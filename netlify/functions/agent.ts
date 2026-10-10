import { Handler } from '@netlify/functions';
import admin from 'firebase-admin';
import { firestore } from './shared/firestore';
import { findSlots, bookTentative, calendarConfigured } from './shared/schedule';
import { knowledgePrompt } from './shared/businessKnowledge';
import { sendLeadEmail } from './shared/leadEmail';
import { sendClientEmail } from './shared/clientEmail';
import { softly } from './shared/withTimeout';

/**
 * Tools for a hosted voice agent (Phonely, Vapi, Retell, Bland…).
 *
 * Those platforms run the conversation themselves — streaming audio, barge-in,
 * sub-second turns — and call out to an HTTP endpoint when the agent needs to
 * do something. This is that endpoint, so the business logic stays here and
 * the platform stays replaceable.
 *
 *   POST /api/agent/slots   what times are free        -> { slots: [...] }
 *   POST /api/agent/hold    hold one for approval      -> { ok, when }
 *   POST /api/agent/lead    record the call            -> { ok }
 *   GET  /api/agent/brief   the business facts         -> { brief }
 *
 * Protected by AGENT_API_KEY: these endpoints spend money (they write to the
 * calendar and send mail), so they are not left open to the internet.
 */

const HEADERS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

/**
 * Vapi will not read a bare JSON body. It matches a tool result by id and
 * wants the payload as a flat string:
 *   { results: [ { toolCallId, result } ] }
 * Anything else reaches the model as "no result returned" — which is why the
 * assistant started inventing appointment times and then lost the call.
 *
 * Other platforms (Goodcall, Zapier, a plain curl) expect the plain object, so
 * the envelope is only used when the request carried a tool call id. Vapi also
 * wants HTTP 200 even for failures, with the text under `error`.
 */
function reply(toolCallId: string | null, statusCode: number, body: any) {
  if (!toolCallId) {
    return { statusCode, headers: HEADERS, body: JSON.stringify(body) };
  }
  const failed = statusCode >= 400 || body?.ok === false;
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  return {
    statusCode: 200,
    headers: HEADERS,
    body: JSON.stringify({ results: [failed ? { toolCallId, error: text } : { toolCallId, result: text }] }),
  };
}

/** The id Vapi expects echoed back, wherever this platform puts it. */
function toolCallIdFrom(body: any): string | null {
  const m = body?.message || {};
  return body?.toolCallId
    || m?.toolCallList?.[0]?.id
    || m?.toolCalls?.[0]?.id
    || m?.toolWithToolCallList?.[0]?.toolCall?.id
    || null;
}

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
  } catch { return false; }
}

const digitsOnly = (raw: any) => {
  const d = String(raw ?? '').replace(/\D/g, '');
  return d.length === 11 && d.startsWith('1') ? d.slice(1) : d;
};

function safeParse(text: string): any {
  try { return JSON.parse(text); } catch { return {}; }
}

const canonical = (key: string) =>
  key.toLowerCase().replace(/[\s_-]+/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/** Expose each value under both the key given and its snake_case form. */
function normaliseKeys(input: Record<string, any>): Record<string, any> {
  const known = ['service_type', 'slot_id', 'phone', 'name', 'email', 'city', 'address',
                 'bedrooms', 'bathrooms', 'preferred_date', 'summary', 'notes', 'transcript', 'action'];
  const out: Record<string, any> = { ...input };
  for (const [key, value] of Object.entries(input)) {
    const c = canonical(key);
    const match = known.find(k => canonical(k) === c);
    if (match && out[match] === undefined) out[match] = value;
  }
  return out;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, X-Agent-Key, Authorization',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      },
      body: '',
    };
  }

  let body: any = {};
  let toolCallId: string | null = null;
  try {
    body = event.body ? JSON.parse(event.isBase64Encoded
      ? Buffer.from(event.body, 'base64').toString('utf8')
      : event.body) : {};
  } catch {
    return reply(null, 400, { error: 'invalid JSON' });
  }
  toolCallId = toolCallIdFrom(body);

  // Shared secret. Accepted as a header or a bearer token, because platforms
  // differ in which of the two they let you configure.
  const expected = process.env.AGENT_API_KEY;
  if (expected) {
    // Three ways in, because platforms differ in what they let you configure.
    // Vapi's dashboard has no header field for function tools, so the key has
    // to ride in the query string — weaker (it lands in logs), but it is what
    // the console supports, and the alternative is no auth at all.
    const given = event.headers['x-agent-key']
      || (event.headers['authorization'] || '').replace(/^Bearer\s+/i, '')
      || (event.queryStringParameters || {}).key
      || '';
    if (given !== expected) {
      console.warn('[agent] rejected: bad or missing AGENT_API_KEY');
      return reply(toolCallId, 401, { error: 'unauthorized' });
    }
  } else {
    console.warn('[agent] AGENT_API_KEY not set — these endpoints are open');
  }


  // Platforms vary in how they nest tool arguments, and some humanise the
  // property names on the way out ("Service Type" for service_type). Flatten
  // the nesting and index every key by a normalised form so a console's
  // formatting cannot silently drop a field.
  const raw = body.arguments || body.parameters || body.args
    || body?.message?.toolCallList?.[0]?.arguments
    || body?.message?.toolCalls?.[0]?.function?.arguments
    || body?.message?.toolWithToolCallList?.[0]?.toolCall?.function?.arguments
    || body?.message?.functionCall?.parameters
    || body;
  const parsed = typeof raw === 'string' ? safeParse(raw) : raw;
  const args = normaliseKeys(parsed && typeof parsed === 'object' ? parsed : {});
  const action = String(
    (event.path || '').split('/').filter(Boolean).pop() || args.action || ''
  ).toLowerCase();

  switch (action) {
    /* ---------------------------------------------------------- */
    case 'brief': {
      // Lets the agent be configured once and stay in step with the site.
      return reply(toolCallId, 200, { brief: await knowledgePrompt() });
    }

    /* ---------------------------------------------------------- */
    case 'slots': {
      if (!calendarConfigured() || !initAdmin()) {
        return reply(toolCallId, 200, { slots: [], message: 'The calendar is unavailable. Take the customer\'s preferred day and tell them the team will confirm the time.' });
      }
      const slots = await softly(findSlots(args.service_type), 4000, 'slots', []);
      return reply(toolCallId, 200, {
        slots: slots.map(s => ({ id: s.id, when: s.label })),
        message: slots.length
          ? 'Offer two of these, not all of them. Send back the id of the one the customer accepts.'
          : 'Could not read the calendar. Ask which day and roughly what time suits them, say the team will confirm, and put their answer in save_lead as preferred_date. Do not end the call here.',
      });
    }

    /* ---------------------------------------------------------- */
    case 'hold': {
      const slotId = String(args.slot_id || args.id || '').trim();
      const phone = digitsOnly(args.phone);
      if (!slotId) return reply(toolCallId, 400, { ok: false, error: 'slot_id is required' });
      if (!initAdmin()) return reply(toolCallId, 200, { ok: false, message: 'Could not reach the calendar — tell the customer the team will confirm the time.' });

      const result = await bookTentative(slotId, {
        name: args.name, phone, email: args.email,
        city: args.city, address: args.address, service_type: args.service_type,
      });

      if (!result.booked) {
        if (result.error === 'that time was just taken') {
          return reply(toolCallId, 200, { ok: false, message: 'Someone just took that time. Ask for the slots again and offer another.' });
        }
        // The write failed, but the customer already said a time out loud.
        // Carry it to save_lead rather than dropping it — and never leave the
        // assistant without a next line, which is what ends calls abruptly.
        const spoken = new Date(slotId).toLocaleString('en-US', {
          weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
          timeZone: process.env.BUSINESS_TIMEZONE || 'America/New_York',
        });
        return reply(toolCallId, 200, {
          ok: true,
          pending: true,
          when: spoken,
          message: `Tell the customer you've put them down for ${spoken} and the team will call to confirm it. Then continue, and include that time in save_lead as preferred_date.`,
        });
      }

      const when = new Date(result.start!).toLocaleString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
        timeZone: process.env.BUSINESS_TIMEZONE || 'America/New_York',
      });
      return reply(toolCallId, 200, {
        ok: true, when, eventId: result.eventId,
        message: `Held for ${when}. Tell the customer it is reserved and the team will confirm shortly.`,
      });
    }

    /* ---------------------------------------------------------- */
    case 'lead': {
      const phone = digitsOnly(args.phone);
      if (!phone) return reply(toolCallId, 400, { ok: false, error: 'phone is required' });

      const lead = {
        name: args.name || 'Phone caller',
        phone,
        email: args.email || '',
        city: args.city || '',
        address: args.address || '',
        service_type: args.service_type || '',
        bedrooms: args.bedrooms ?? '',
        bathrooms: args.bathrooms ?? '',
        preferred_date: args.preferred_date || args.preferred_time || '',
        message: [args.notes, args.summary, args.transcript].filter(Boolean).join('\n\n'),
        source: args.source || 'phone-ai',
      };

      // The inbox must hear about the call even if the database is refusing writes.
      await sendLeadEmail({ ...lead, leadId: null });
      if (lead.email) await sendClientEmail('confirmation', lead).catch(() => {});

      let stored = false;
      if (initAdmin()) {
        stored = await softly((async () => {
          const db = firestore();
          const found = await db.collection('leads').where('phone', '==', phone).limit(1).get();
          const payload = {
            ...lead,
            status: 'new',
            attribution_channel: 'Phone AI',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          };
          if (found.empty) {
            await db.collection('leads').add({ ...payload, createdAt: admin.firestore.FieldValue.serverTimestamp() });
          } else {
            await found.docs[0].ref.update(payload);
          }
          return true;
        })(), 4000, 'lead write', false);
      }

      console.log('[agent] call recorded', phone, '| stored:', stored);
      return reply(toolCallId, 200, { ok: true, stored, message: 'Recorded. Thank the customer and end the call.' });
    }

    /* ---------------------------------------------------------- */
    default:
      return reply(toolCallId, 404, {
        error: 'unknown action',
        actions: ['brief', 'slots', 'hold', 'lead'],
        hint: 'POST to /api/agent/slots, /api/agent/hold or /api/agent/lead',
      });
  }
};
