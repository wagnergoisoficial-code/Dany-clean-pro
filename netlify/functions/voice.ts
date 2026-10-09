import { Handler } from '@netlify/functions';
import admin from 'firebase-admin';
import twilio from 'twilio';
import { firestore } from './shared/firestore';
import { knowledgePrompt } from './shared/businessKnowledge';
import { softly } from './shared/withTimeout';
import { findSlots, bookTentative, calendarConfigured, Slot } from './shared/schedule';

/**
 * Twilio Voice webhook — the AI answers the phone on the existing number.
 *
 * Ported from server.ts, which never deployed, and corrected on three points:
 *  - it spoke Portuguese to customers in Connecticut
 *  - it kept no memory between turns, so every answer ignored the last one
 *  - it never created a lead, so an answered call left no trace
 *
 * Functions are stateless, so the conversation is carried in the action URL
 * Twilio posts back to. That keeps each turn self-contained with no session
 * store, at the cost of a bounded transcript (URLs are not infinite).
 */

const MODEL = process.env.GEMINI_VOICE_MODEL || 'gemini-3.5-flash';
const AI_TIMEOUT_MS = 6000;
const MAX_TURNS = Number(process.env.VOICE_MAX_TURNS || 8);
const TRANSCRIPT_LIMIT = 900;        // characters carried between turns
/**
 * Voice quality.
 *
 * Polly.Joanna is a standard synthesis voice — it is what makes the line sound
 * like a machine reading. The Neural and Journey voices are a different class:
 * they carry intonation across a sentence instead of pronouncing word by word.
 * Swappable with an env var so the voice can be judged by ear, not by argument.
 *   Polly.Joanna-Neural   warm, neutral American (default)
 *   Polly.Danielle-Neural softer
 *   Polly.Ruth-Neural     closest to a receptionist
 *   Google.en-US-Journey-F  built for dialogue, the most conversational
 */
const VOICE = {
  voice: (process.env.VOICE_NAME || 'Polly.Joanna-Neural') as any,
  language: 'en-US' as const,
};

// Short on purpose: every second of preamble is a second the caller waits.
const GREETING = "Thanks for calling Dany Clean Pro! I can get your cleaning estimate started. What's your name?";
const HANDOFF = "Thank you. I have everything I need. Someone from our team will call you back shortly to confirm your estimate. Have a great day.";
const TROUBLE = "I'm sorry, I'm having trouble on my end. Please call or text us at 2 1 8, 3 5 7, 5 9 3 8 and we'll help you right away.";

const ROLE = `You are the phone receptionist for Dany Clean Pro.

You are on a live phone call, so every reply must be ONE short spoken sentence — under 25 words, no lists, no markdown, nothing that cannot be read aloud naturally.

Collect, one at a time, in this order: name, town, type of cleaning, number of bedrooms, number of bathrooms, and the best day for a visit.
When you have the six details, set "done" to true and thank them.

HOW TO SOUND
- Speak the way a person actually does: contractions ("I'll", "that's", "we'll"), short words, no formal phrasing.
- Acknowledge what they just said in two or three words before the next question — "Got it, Sarah." then ask. Never restate their whole answer.
- One question per reply, under 18 words. Long sentences are what make this sound read aloud.
- Never say "please provide", "may I ask", "I will now", or anything nobody says on the phone.`;

const digitsOnly = (raw: string) => {
  const d = String(raw || '').replace(/\D/g, '');
  return d.length === 11 && d.startsWith('1') ? d.slice(1) : d;
};

function initAdmin(): boolean {
  if (admin.apps.length) return true;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_PRIVATE_KEY || '';
  if (!projectId || !clientEmail || !rawKey) return false;
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId, clientEmail,
        privateKey: rawKey.trim().replace(/^["']|["']$/g, '').replace(/,$/, '').replace(/\\n/g, '\n'),
      }),
    });
    return true;
  } catch (err) {
    console.error('[voice] admin init failed:', err);
    return false;
  }
}

/** Rough read of the service from what has been said so far, to size the slot. */
function serviceGuess(transcript: string): string {
  return transcript.slice(-400);
}

const xml = (body: string) => ({ statusCode: 200, headers: { 'Content-Type': 'text/xml' }, body });

/** Ask something and listen for the answer, carrying the transcript forward. */
function ask(question: string, transcript: string, turn: number) {
  const response = new twilio.twiml.VoiceResponse();
  const next = `/api/voice?turn=${turn + 1}&t=${encodeURIComponent(Buffer.from(transcript.slice(-TRANSCRIPT_LIMIT)).toString('base64'))}`;
  const gather = response.gather({
    input: ['speech'],
    action: next,
    method: 'POST',
    // 'auto' waits for a natural pause instead of a fixed countdown, which is
    // most of the dead air people read as "the robot is thinking".
    speechTimeout: 'auto',
    // Tuned for back-and-forth speech rather than dictation: faster to settle
    // and far better with half-sentences and hesitation.
    speechModel: 'experimental_conversations',
    enhanced: true,
    language: 'en-US',
    profanityFilter: false,
  } as any);
  gather.say(VOICE, question);
  // Nothing said: try once more, then hand off rather than loop forever.
  response.say(VOICE, "Sorry, I missed that.");
  response.redirect({ method: 'POST' }, next);
  return xml(response.toString());
}

function hangUp(message: string) {
  const response = new twilio.twiml.VoiceResponse();
  response.say(VOICE, message);
  response.hangup();
  return xml(response.toString());
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'GET') {
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'voice webhook ready' }) };
  }
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body || '', 'base64').toString('utf8')
    : (event.body || '');
  const params = Object.fromEntries(new URLSearchParams(rawBody));

  // The signature covers the full URL, query string included.
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (authToken) {
    const signature = event.headers['x-twilio-signature'] || event.headers['X-Twilio-Signature'];
    const proto = event.headers['x-forwarded-proto'] || 'https';
    const query = event.rawQuery ? `?${event.rawQuery}` : '';
    const url = `${proto}://${event.headers['host'] || ''}${event.path}${query}`;
    if (!signature || !twilio.validateRequest(authToken, String(signature), url, params)) {
      console.error('[voice] SIGNATURE MISMATCH for', url,
        '— check that TWILIO_AUTH_TOKEN in Netlify matches the account\'s primary auth token');
      // Caller hears a sentence, not a Twilio error tone. Static text only:
      // a forged request never reaches the model, so it costs nothing.
      return hangUp(TROUBLE);
    }
  }

  const query = new URLSearchParams(event.rawQuery || '');
  const turn = Number(query.get('turn') || 0);
  const carried = query.get('t')
    ? Buffer.from(decodeURIComponent(query.get('t') || ''), 'base64').toString('utf8')
    : '';
  const caller = digitsOnly(params.From || '');
  const heard = String(params.SpeechResult || '').trim();

  console.log(`[voice] turn ${turn} from ${caller}: ${heard.slice(0, 120) || '(start)'}`);

  // First contact: greet and start listening.
  if (turn === 0) return ask(GREETING, '', 0);

  if (!heard) return ask("Sorry, say that again?", carried, turn);

  const transcript = `${carried}\nCaller: ${heard}`.trim();

  // Bounded conversation: wrap up rather than keep someone on a loop.
  if (turn >= MAX_TURNS) {
    await saveLead(caller, transcript, true).catch(err => console.error('[voice] save failed:', err));
    return hangUp(HANDOFF);
  }

  // Real openings, so the assistant offers times that actually exist.
  let slots: Slot[] = [];
  if (calendarConfigured()) {
    slots = await softly(findSlots(serviceGuess(transcript)), 2000, 'calendar', []);
  }
  const slotBlock = slots.length
    ? `\nAVAILABLE TIMES — offer these, exactly as written, and never invent others:\n`
      + slots.map(s => `- ${s.label}  (id: ${s.id})`).join('\n')
      + `\nWhen the customer picks one, copy its id verbatim into "chosen_slot".`
    : `\nNo openings could be read right now. Take the customer's preferred day and say the team will confirm the time.`;

  let reply = '';
  let done = false;
  let chosen = '';
  let details: Record<string, any> = {};
  try {
    const { GoogleGenAI, Type } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const call = ai.models.generateContent({
      model: MODEL,
      contents: `Conversation so far:\n${transcript}\n\nReply with the next single short spoken sentence.`,
      config: {
        systemInstruction: `${ROLE}\n\n${await knowledgePrompt()}${slotBlock}`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            say: { type: Type.STRING, description: 'One short spoken sentence, under 25 words.' },
            done: { type: Type.BOOLEAN, description: 'True once all six details are collected.' },
            chosen_slot: { type: Type.STRING, description: 'The id of the time the customer accepted, copied exactly from AVAILABLE TIMES. Empty if none was accepted.' },
            name: { type: Type.STRING },
            city: { type: Type.STRING },
            service_type: { type: Type.STRING },
          },
          required: ['say'],
        },
      },
    });
    const result: any = await Promise.race([
      call,
      new Promise((_, reject) => setTimeout(() => reject(new Error('gemini timeout')), AI_TIMEOUT_MS)),
    ]);
    const parsed = JSON.parse(result.text || '{}');
    reply = String(parsed.say || '').slice(0, 300);
    done = parsed.done === true;
    chosen = String(parsed.chosen_slot || '').trim();
    details = parsed;
  } catch (err: any) {
    console.error('[voice] AI step failed:', err?.message || err);
    await saveLead(caller, transcript, false).catch(() => {});
    return hangUp(TROUBLE);
  }

  if (done || !reply) {
    const full = `${transcript}\nAssistant: ${reply}`;
    const booking = chosen
      ? await bookTentative(chosen, {
          name: details.name, phone: caller, city: details.city,
          service_type: details.service_type,
        })
      : null;
    if (booking && !booking.booked) console.error('[voice] hold failed:', booking.error);
    await saveLead(caller, full, true, booking, details).catch(err => console.error('[voice] save failed:', err));
    return hangUp(reply || HANDOFF);
  }

  return ask(reply, `${transcript}\nAssistant: ${reply}`, turn);
};

/** Record the call against the caller's lead. Best effort — never blocks the call. */
async function saveLead(
  phone: string,
  transcript: string,
  complete: boolean,
  booking?: { booked: boolean; eventId?: string; start?: string; end?: string } | null,
  details?: Record<string, any>,
) {
  if (!phone || !initAdmin()) return;
  const db = firestore();
  const note = `AI phone call${complete ? '' : ' (ended early)'}:\n${transcript}`;
  // A held slot is pending until a person approves it in the dashboard.
  const bookingFields = booking?.booked
    ? {
        booking: {
          status: 'pending',
          eventId: booking.eventId,
          start: booking.start,
          end: booking.end,
          heldAt: new Date().toISOString(),
          source: 'phone-ai',
        },
        status: 'scheduled',
      }
    : {};
  const detailFields: Record<string, any> = {};
  for (const key of ['name', 'city', 'service_type']) {
    const value = details?.[key];
    if (value && String(value).trim() && String(value).toLowerCase() !== 'unknown') detailFields[key] = value;
  }
  const found = await db.collection('leads').where('phone', '==', phone).limit(1).get();

  if (!found.empty) {
    await found.docs[0].ref.update({
      message: note,
      ...detailFields,
      ...bookingFields,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } else {
    await db.collection('leads').add({
      name: 'Phone caller',
      phone,
      message: note,
      status: 'new',
      ...detailFields,
      ...bookingFields,
      source: 'phone-ai',
      attribution_channel: 'Twilio Voice',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
  console.log('[voice] lead recorded for', phone);
}
