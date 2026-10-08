import { Handler } from '@netlify/functions';
import admin from 'firebase-admin';
import twilio from 'twilio';
import { firestore } from './shared/firestore';
import { knowledgePrompt } from './shared/businessKnowledge';
import { findSlots, bookTentative, calendarConfigured, Slot } from './shared/schedule';

/**
 * Twilio SMS webhook — the receptionist that answers texts.
 *
 * Ported from the Express route in server.ts, which never shipped: it lives in
 * the dev server only, so in production nobody was answering the number the
 * site advertises.
 *
 * Three things differ from the original, all forced by running in the open:
 *  1. The reply goes back as TwiML. Twilio sends it from the same number with
 *     no API round-trip, so a credentials problem can't swallow the answer.
 *  2. The signature is verified. This URL is public and each hit costs money in
 *     Gemini and SMS; without the check anyone can run up the bill.
 *  3. Nothing about persistence can stop a reply. Firestore writes are
 *     best-effort — a database problem must never leave a customer unanswered.
 */

const MODEL = process.env.GEMINI_SMS_MODEL || 'gemini-3.5-flash';
const AI_TIMEOUT_MS = 7000;   // Netlify cuts the function at 10s
const FALLBACK = "Thanks for reaching out to Dany Clean Pro! We'll get right back to you. For anything urgent, call us at (218) 357-5938.";

const ROLE = `You are the SMS receptionist for Dany Clean Pro.

Guide the customer toward one of three outcomes:
1. Schedule an estimate appointment
2. Send photos of the home for review
3. Have the team visit for an in-person estimate

Collect, one at a time: name, city, type of service, number of bedrooms, number of bathrooms, preferred day.

Tone: warm, patient, human, never robotic. Ask exactly one question per message.
Keep every reply under 320 characters — this is SMS.`;

const digitsOnly = (raw: string) => {
  const d = String(raw || '').replace(/\D/g, '');
  return d.length === 11 && d.startsWith('1') ? d.slice(1) : d;
};

function twiml(message: string) {
  const response = new twilio.twiml.MessagingResponse();
  response.message(message);
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/xml' },
    body: response.toString(),
  };
}

const emptyTwiml = () => ({
  statusCode: 200,
  headers: { 'Content-Type': 'text/xml' },
  body: '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
});

function initAdmin(): boolean {
  if (admin.apps.length) return true;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_PRIVATE_KEY || '';
  if (!projectId || !clientEmail || !rawKey) return false;
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: rawKey.trim().replace(/^["']|["']$/g, '').replace(/,$/, '').replace(/\\n/g, '\n'),
      }),
    });
    return true;
  } catch (err) {
    console.error('[sms] admin init failed:', err);
    return false;
  }
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'GET') {
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'sms webhook ready' }) };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body || '', 'base64').toString('utf8')
    : (event.body || '');
  const params = Object.fromEntries(new URLSearchParams(rawBody));

  // --- 1. prove the request really came from Twilio ---
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (authToken) {
    const signature = event.headers['x-twilio-signature'] || event.headers['X-Twilio-Signature'];
    const proto = event.headers['x-forwarded-proto'] || 'https';
    const host = event.headers['host'] || '';
    const url = `${proto}://${host}${event.path}`;
    const valid = signature && twilio.validateRequest(authToken, String(signature), url, params);
    if (!valid) {
      console.warn('[sms] rejected: bad or missing Twilio signature for', url);
      return { statusCode: 403, body: 'Forbidden' };
    }
  } else {
    console.warn('[sms] TWILIO_AUTH_TOKEN not set — webhook is running unverified');
  }

  const clientMessage = String(params.Body || '').trim();
  const clientPhone = digitsOnly(params.From || '');
  if (!clientPhone) return emptyTwiml();

  console.log(`[sms] from ${clientPhone}: ${clientMessage.slice(0, 120)}`);

  // --- 2. opt-out keywords: the carrier stops delivery, we stop the follow-ups ---
  const keyword = clientMessage.toUpperCase();
  if (['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'].includes(keyword)) {
    await markOptOut(clientPhone).catch(err => console.error('[sms] opt-out write failed:', err));
    return emptyTwiml();   // Twilio sends the compliance confirmation itself
  }
  if (keyword === 'HELP') {
    return twiml('Dany Clean Pro — residential & commercial cleaning in Connecticut. Call or text (218) 357-5938. Reply STOP to opt out. Msg & data rates may apply.');
  }

  // --- 3. context, best effort ---
  let lead: any = null;
  let leadRef: FirebaseFirestore.DocumentReference | null = null;
  let history: Array<{ sender: string; message: string }> = [];

  if (initAdmin()) {
    try {
      const db = firestore();
      const found = await db.collection('leads').where('phone', '==', clientPhone).limit(1).get();
      if (!found.empty) {
        leadRef = found.docs[0].ref;
        lead = found.docs[0].data();
        history = Array.isArray(lead.sms_thread) ? lead.sms_thread.slice(-15) : [];
      }
    } catch (err: any) {
      console.error('[sms] could not read lead (replying anyway):', err?.message || err);
    }
  }

  // --- 4. the answer itself ---
  // Real openings, so the assistant offers times that actually exist.
  let slots: Slot[] = [];
  if (calendarConfigured()) {
    try {
      slots = await findSlots(lead?.service_type);
    } catch (err: any) {
      console.error('[sms] could not read the calendar (continuing without times):', err?.message || err);
    }
  }
  const slotBlock = slots.length
    ? `\nAVAILABLE TIMES — offer these, exactly as written, and never invent others:\n`
      + slots.map(s => `- ${s.label}  (id: ${s.id})`).join('\n')
      + `\nWhen the customer picks one, copy its id verbatim into "chosen_slot".`
    : `\nNo openings could be read right now. Take the customer's preferred day and say the team will confirm the time.`;

  let replyText = FALLBACK;
  let extracted: Record<string, any> = {};
  try {
    const { GoogleGenAI, Type } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    const prompt = `Incoming message: "${clientMessage}"
Customer phone: ${clientPhone}

What we already know about this customer:
- Name: ${lead?.name || 'Unknown'}
- City: ${lead?.city || 'Unknown'}
- Service: ${lead?.service_type || 'Unknown'}
- Bedrooms: ${lead?.bedrooms || 'Unknown'}
- Bathrooms: ${lead?.bathrooms || 'Unknown'}

Conversation so far:
${history.map(h => `${h.sender === 'client' ? 'Client' : 'Assistant'}: ${h.message}`).join('\n') || '(this is the first message)'}

Fill in whatever the message reveals, and write the next single caring question in "response_message".`;

    const call = ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        systemInstruction: `${ROLE}\n\n${await knowledgePrompt()}${slotBlock}`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            response_message: { type: Type.STRING, description: 'The SMS reply. Under 320 characters, warm, exactly one question.' },
            name: { type: Type.STRING },
            city: { type: Type.STRING },
            service_type: { type: Type.STRING },
            bedrooms: { type: Type.STRING },
            bathrooms: { type: Type.STRING },
            preferred_date: { type: Type.STRING },
            chosen_slot: { type: Type.STRING, description: 'The id of the time the customer accepted, copied exactly from AVAILABLE TIMES. Empty if none was accepted.' },
          },
          required: ['response_message'],
        },
      },
    });

    const result: any = await Promise.race([
      call,
      new Promise((_, reject) => setTimeout(() => reject(new Error('gemini timeout')), AI_TIMEOUT_MS)),
    ]);

    const parsed = JSON.parse(result.text || '{}');
    if (parsed.response_message) replyText = String(parsed.response_message).slice(0, 600);
    extracted = parsed;
  } catch (err: any) {
    console.error('[sms] AI step failed, sending fallback:', err?.message || err);
  }

  // --- 5. hold the slot the customer accepted, before recording anything ---
  let booking: Awaited<ReturnType<typeof bookTentative>> | null = null;
  const chosen = String(extracted.chosen_slot || '').trim();
  if (chosen && calendarConfigured()) {
    booking = await bookTentative(chosen, {
      name: extracted.name || lead?.name,
      phone: clientPhone,
      email: lead?.email,
      city: extracted.city || lead?.city,
      service_type: extracted.service_type || lead?.service_type,
    });
    if (!booking.booked) console.error('[sms] hold failed:', booking.error);
  }

  // --- 6. record the exchange, best effort, after the reply is decided ---
  if (initAdmin()) {
    try {
      const db = firestore();
      const turn = [
        { sender: 'client', message: clientMessage, at: new Date().toISOString() },
        { sender: 'assistant', message: replyText, at: new Date().toISOString() },
      ];
      const fields: Record<string, any> = {
        phone: clientPhone,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        sms_thread: admin.firestore.FieldValue.arrayUnion(...turn),
      };
      if (booking?.booked) {
        fields.booking = {
          status: 'pending',
          eventId: booking.eventId,
          start: booking.start,
          end: booking.end,
          heldAt: new Date().toISOString(),
          source: 'twilio-sms',
        };
        fields.status = 'scheduled';
      }
      for (const key of ['name', 'city', 'service_type', 'bedrooms', 'bathrooms', 'preferred_date']) {
        const value = extracted[key];
        if (value && String(value).trim() && String(value).toLowerCase() !== 'unknown') fields[key] = value;
      }

      if (leadRef) {
        await leadRef.update(fields);
      } else {
        await db.collection('leads').add({
          ...fields,
          status: 'new',
          source: 'twilio-sms',
          attribution_channel: 'Twilio SMS',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    } catch (err: any) {
      console.error('[sms] could not persist the exchange (customer was still answered):', err?.message || err);
    }
  }

  return twiml(replyText);
};

async function markOptOut(phone: string) {
  if (!initAdmin()) return;
  const db = firestore();
  const found = await db.collection('leads').where('phone', '==', phone).limit(1).get();
  if (!found.empty) {
    await found.docs[0].ref.update({ automation_opt_out: true, sms_opt_out_at: admin.firestore.FieldValue.serverTimestamp() });
    console.log('[sms] opt-out recorded for', phone);
  }
}
