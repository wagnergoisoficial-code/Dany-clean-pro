import { Handler } from '@netlify/functions';
import admin from 'firebase-admin';
import { firestore } from './shared/firestore';
import { findSlots, bookTentative, calendarConfigured, backendName } from './shared/schedule';
import type { BookingResult } from './shared/slotEngine';
import { knowledgePrompt } from './shared/businessKnowledge';
import { sendLeadEmail, sendBookingEmail } from './shared/leadEmail';
import { sendClientEmail } from './shared/clientEmail';
import { softly, within } from './shared/withTimeout';

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
 *
 * No reply here ever tells the model to end the call. Tools report facts; the
 * conversation decides when it is over.
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
  const text = typeof body === 'string' ? body : speakable(body);
  return {
    statusCode: 200,
    headers: HEADERS,
    body: JSON.stringify({ results: [failed ? { toolCallId, error: text } : { toolCallId, result: text }] }),
  };
}

/**
 * What the model receives as the tool result.
 *
 * Vapi wants a flat string, and the obvious choice — JSON.stringify — hands a
 * voice model a wall of escaped quotes to parse before it can say anything.
 * A sentence it can almost read aloud gets it talking immediately, which is
 * the difference between a pause and a silence the caller sits through.
 */
function speakable(body: any): string {
  if (!body || typeof body !== 'object') return String(body ?? '');

  if (Array.isArray(body.slots)) {
    if (!body.slots.length) return body.message || 'No times available.';
    const times = body.slots
      .map((s: any) => `${s.when} [id: ${s.id}]`)
      .join('; ');
    return `Available: ${times}. ${body.message || ''}`.trim();
  }

  // Everything else is already a short result plus an instruction.
  const parts = [body.when ? `Time: ${body.when}.` : '', body.message || body.error || ''];
  const sentence = parts.filter(Boolean).join(' ').trim();
  return sentence || JSON.stringify(body);
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

const KNOWN_ARGS = ['service_type', 'slot_id', 'phone', 'name', 'email', 'city', 'address',
                   'bedrooms', 'bathrooms', 'preferred_date', 'summary', 'notes', 'transcript', 'action'];

/** Expose each value under both the key given and its snake_case form. */
function normaliseKeys(input: Record<string, any>): Record<string, any> {
  const known = KNOWN_ARGS;
  const out: Record<string, any> = { ...input };
  for (const [key, value] of Object.entries(input)) {
    const c = canonical(key);
    const match = known.find(k => canonical(k) === c);
    if (match && out[match] === undefined) out[match] = value;
  }
  return out;
}

/**
 * Tool arguments, whatever shape the platform wrapped them in.
 *
 * Vapi alone has three: `toolCallList[0].function.arguments`,
 * `toolCalls[0].function.arguments`, and a flattened
 * `toolCallList[0].arguments` — as a JSON string or an object, depending on the
 * message version. A chain of `||` commits to one guess and, when it guesses
 * wrong, quietly hands back the whole request body: every field reads as
 * missing, so `hold` answers "slot_id is required" on a call where the customer
 * has just named a time out loud, and no appointment reaches the inbox.
 *
 * So try all of them and keep the first that actually carries a field a tool
 * asked for.
 */
function argumentsFrom(body: any): Record<string, any> {
  const lists = [
    body?.message?.toolCallList,
    body?.message?.toolCalls,
    body?.toolCallList,
    body?.toolCalls,
    body?.message?.toolWithToolCallList?.map((entry: any) => entry?.toolCall),
  ].filter(Array.isArray);

  const candidates: any[] = [body?.arguments, body?.parameters, body?.args];
  for (const list of lists) {
    for (const call of list) {
      candidates.push(
        call?.function?.arguments, call?.arguments,
        call?.function?.parameters, call?.parameters,
      );
    }
  }
  candidates.push(
    body?.message?.functionCall?.parameters,
    body?.message?.functionCall?.arguments,
    body,
  );

  let fallback: Record<string, any> = {};
  for (const candidate of candidates) {
    const parsed = typeof candidate === 'string' ? safeParse(candidate) : candidate;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) continue;
    const named = normaliseKeys(parsed);
    if (KNOWN_ARGS.some(key => named[key] !== undefined)) return named;
    if (!Object.keys(fallback).length) fallback = named;
  }
  return fallback;
}

/**
 * A plain sentence about why a requested time cannot be served, or null when it
 * can. Hours live in scheduling.ts, so this never drifts from what the rest of
 * the system honours.
 */
function describeIfOutsideHours(text: string): string | null {
  const t = text.toLowerCase();
  const m = t.match(/(\d{1,2})\s*[:h]?\s*(\d{2})?\s*(am|pm|a\.m|p\.m)?/);
  if (!m) return null;

  let hour = parseInt(m[1], 10);
  const minute = m[2] ? parseInt(m[2], 10) : 0;
  const meridiem = m[3];
  if (meridiem?.startsWith('p') && hour < 12) hour += 12;
  if (meridiem?.startsWith('a') && hour === 12) hour = 0;
  // "six thirty in the evening" with no am/pm marker
  if (!meridiem && hour <= 7 && /(evening|night|tarde|noite)/.test(t)) hour += 12;
  if (hour > 23) return null;

  const saturday = /saturday|s[aá]bado/.test(t);
  const sunday = /sunday|domingo/.test(t);
  if (sunday) return 'Sundays are not a service day.';

  const open = saturday ? 9 : 8;
  const close = saturday ? 16 : 18;
  const asMinutes = hour * 60 + minute;

  if (asMinutes < open * 60) return `The team starts at ${open === 9 ? '9am' : '8am'}, so that is earlier than they can be there.`;
  if (asMinutes >= close * 60) return `The team finishes at ${close === 16 ? '4pm' : '6pm'}, so that is later than they can be there.`;
  return null;
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
  const args = argumentsFrom(body);
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
      if (!calendarConfigured() || (backendName() === 'internal' && !initAdmin())) {
        return reply(toolCallId, 200, { slots: [], message: 'The calendar is unavailable. Ask which day and roughly what time suits them, say the team will confirm, and carry on with the call.' });
      }

      const slots = await softly(() => findSlots(args.service_type), 1200, 'slots', []);
      const offered = slots.map(s => ({ id: s.id, when: s.label }));

      // A caller who has already named a time deserves an answer about that
      // time. Asking for 6:30pm and hearing three unrelated mornings read out
      // is where the conversation stalls — the assistant has nothing sensible
      // to say, so say it for it.
      const wanted = String(args.preferred_time || args.preferred_date || '').trim();
      const outside = wanted ? describeIfOutsideHours(wanted) : null;

      if (!offered.length) {
        return reply(toolCallId, 200, {
          slots: [],
          message: 'Could not read the calendar. Ask which day and roughly what time suits them, say the team will confirm, put their answer in save_lead as preferred_date, and carry on with the call.',
        });
      }

      return reply(toolCallId, 200, {
        slots: offered,
        asked_for: wanted || undefined,
        outside_working_hours: !!outside,
        message: outside
          ? `${outside} Say that plainly, then offer two of the times listed here as the nearest alternatives.`
          : 'Offer two of these, not all of them. Send back the id of the one the customer accepts.',
      });
    }

    /* ---------------------------------------------------------- */
    case 'hold': {
      const slotId = String(args.slot_id || args.id || '').trim();
      const phone = digitsOnly(args.phone);
      // A caller can name a time the assistant never quoted a slot id for.
      // That is still an appointment, and the inbox still has to hear about it.
      const said = String(args.preferred_date || args.when || args.time || '').trim();
      if (!slotId && !said) {
        return reply(toolCallId, 200, { ok: false, message: 'Ask which day and roughly what time they would like, then try again.' });
      }

      // Only the Firestore-backed calendar needs the admin credential. With
      // SCHEDULING_BACKEND=none there is nothing to write to, and refusing to
      // go on would throw away the one record of the appointment.
      const canBook = !!slotId && calendarConfigured() && (backendName() !== 'internal' || initAdmin());
      const result: BookingResult = canBook
        ? await bookTentative(slotId, {
            name: args.name, phone, email: args.email,
            city: args.city, address: args.address, service_type: args.service_type,
          })
        : { booked: false, error: 'no calendar configured' };

      if (!result.booked && result.error === 'that time was just taken') {
        return reply(toolCallId, 200, { ok: false, message: 'Someone just took that time. Ask for the slots again and offer another.' });
      }

      const at = new Date(result.booked ? result.start! : slotId);
      const when = Number.isNaN(at.getTime())
        ? (said || 'a time still to be confirmed')
        : at.toLocaleString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
            timeZone: process.env.BUSINESS_TIMEZONE || 'America/New_York',
          });

      // This message is the appointment. Without a database it is the only
      // record there is, so its outcome is reported rather than swallowed —
      // a booking that never reached the inbox has to be visible from outside.
      // Bounded for the same reason the write is. This runs after it, on the
      // same ten-second budget, and an SMTP connection to Gmail is seconds of
      // it. Losing the e-mail is bad; losing the call while the customer waits
      // is worse, and the appointment is in the database by this point.
      const mail = await within(
        () => sendBookingEmail({
          when, held: result.booked,
          name: args.name, phone, email: args.email, city: args.city,
          address: args.address, service_type: args.service_type,
          bedrooms: args.bedrooms, bathrooms: args.bathrooms,
        }),
        3500, 'booking e-mail',
      ).catch((err: any) => ({ sent: false, error: String(err?.message || err) }));

      if (mail.sent) console.log('[agent] booking e-mailed:', when, '| held:', result.booked);
      else console.error('[agent] BOOKING NOT E-MAILED:', when, '|', mail.error);

      if (!result.booked) {
        // Nothing was written, but the customer said a time out loud. Carry it
        // to save_lead rather than dropping it — and never leave the assistant
        // without a next line, which is what ends calls abruptly.
        return reply(toolCallId, 200, {
          ok: true, pending: true, when, emailed: mail.sent,
          message: `Tell the customer you've put them down for ${when} and the team will call to confirm it. Then continue, and include that time in save_lead as preferred_date.`,
        });
      }

      return reply(toolCallId, 200, {
        ok: true, when, eventId: result.eventId, emailed: mail.sent,
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
      const mail = await sendLeadEmail({ ...lead, leadId: null })
        .catch((err: any) => ({ sent: false, error: String(err?.message || err) }));
      if (!mail.sent) console.error('[agent] LEAD NOT E-MAILED:', phone, '|', mail.error);
      if (lead.email) await sendClientEmail('confirmation', lead).catch(() => {});

      let stored = false;
      if (initAdmin()) {
        stored = await softly(async () => {
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
        }, 2000, 'lead write', false);
      }

      console.log('[agent] call recorded', phone, '| stored:', stored, '| e-mailed:', mail.sent);
      // Never tell the model to hang up. A tool reports a fact; when the call
      // ends is the conversation's business. "End the call" here was being
      // obeyed the moment the model reached for save_lead mid-booking, which
      // is exactly how a caller lost the line while times were being offered.
      return reply(toolCallId, 200, {
        ok: true,
        stored,
        emailed: mail.sent,
        message: 'Saved. Keep going — ask if there is anything else they need, and only say goodbye once they are done.',
      });
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
