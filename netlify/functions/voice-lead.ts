import { Handler, HandlerEvent } from '@netlify/functions';
import { handler as leadsHandler } from './leads';

/**
 * Webhook for the AI phone receptionist (Goodcall / Zapier, or any platform
 * that can POST JSON at the end of a call).
 *
 * It only normalises the payload — call platforms nest their fields and name
 * them differently — and then hands it to the existing leads function, so a
 * phone lead goes through exactly the same path as a website lead: Firestore
 * de-duplication by phone, AI enrichment, dashboard, and the e-mail notice.
 */

const FIELD_ALIASES: Record<string, string[]> = {
  name: ['name', 'caller_name', 'customer_name', 'contact_name', 'full_name', 'callerName', 'firstName'],
  phone: ['phone', 'caller_phone', 'customer_phone', 'from', 'from_number', 'caller_number', 'callerNumber', 'phone_number', 'customer_number', 'number'],
  email: ['email', 'caller_email', 'customer_email', 'contact_email'],
  city: ['city', 'town', 'location', 'service_city'],
  address: ['address', 'street_address', 'service_address'],
  zip_code: ['zip_code', 'zip', 'zipcode', 'postal_code'],
  service_type: ['service_type', 'service', 'service_requested', 'job_type', 'cleaning_type'],
  bedrooms: ['bedrooms', 'bedroom_count', 'beds', 'num_bedrooms'],
  bathrooms: ['bathrooms', 'bathroom_count', 'baths', 'num_bathrooms'],
  preferred_date: ['preferred_date', 'date', 'appointment_date', 'requested_date'],
  preferred_time: ['preferred_time', 'time', 'appointment_time', 'requested_time'],
  message: ['notes', 'note', 'summary', 'call_summary', 'details', 'description', 'message'],
  transcript: ['transcript', 'call_transcript', 'conversation'],
  recording_url: ['recording_url', 'recording', 'audio_url', 'call_recording_url'],
};

/** Call platforms nest under call/lead/data/payload/answers — flatten one map of leaf values. */
function flatten(input: any, depth = 0): Record<string, any> {
  const out: Record<string, any> = {};
  if (!input || typeof input !== 'object' || depth > 4) return out;

  for (const [key, value] of Object.entries(input)) {
    if (value === null || value === undefined) continue;
    if (Array.isArray(value)) {
      // Goodcall/Vapi style: [{ question|name|key, answer|value }]
      for (const item of value) {
        if (item && typeof item === 'object') {
          const label = item.question ?? item.name ?? item.key ?? item.field;
          const answer = item.answer ?? item.value ?? item.response;
          if (label !== undefined && answer !== undefined) {
            out[String(label)] = answer;
          } else {
            Object.assign(out, flatten(item, depth + 1));
          }
        }
      }
      continue;
    }
    if (typeof value === 'object') {
      Object.assign(out, flatten(value, depth + 1));
      continue;
    }
    if (out[key] === undefined) out[key] = value;
  }
  return out;
}

const normaliseKey = (key: string) =>
  key.toLowerCase().replace(/[-_\s?:.]/g, '').normalize('NFD').replace(/[̀-ͯ]/g, '');

function pick(flat: Record<string, any>, aliases: string[]): any {
  const index = new Map<string, any>();
  for (const [key, value] of Object.entries(flat)) index.set(normaliseKey(key), value);

  for (const alias of aliases) {
    const hit = index.get(normaliseKey(alias));
    if (hit !== undefined && String(hit).trim() !== '') return hit;
  }
  // last resort: a key that contains the alias (e.g. "How many bedrooms?")
  for (const alias of aliases) {
    const needle = normaliseKey(alias);
    for (const [key, value] of index) {
      if (key.includes(needle) && String(value).trim() !== '') return value;
    }
  }
  return undefined;
}

/** Digits only, so the same caller matches the lead created from the website form. */
function tidyPhone(raw: any): string {
  const digits = String(raw ?? '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1);
  return digits;
}

export const handler: Handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod === 'GET') {
    return { statusCode: 200, headers, body: JSON.stringify({ status: 'voice-lead webhook ready' }) };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  let raw: any;
  try {
    raw = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const flat = flatten(raw);
  const phone = tidyPhone(pick(flat, FIELD_ALIASES.phone));

  if (!phone) {
    console.error('[voice-lead] no phone in payload. keys:', Object.keys(flat).join(', '));
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Caller phone number is required' }) };
  }

  const notes = [
    pick(flat, FIELD_ALIASES.message),
    pick(flat, FIELD_ALIASES.transcript) ? `Transcript: ${pick(flat, FIELD_ALIASES.transcript)}` : '',
    pick(flat, FIELD_ALIASES.recording_url) ? `Recording: ${pick(flat, FIELD_ALIASES.recording_url)}` : '',
  ].filter(v => v !== undefined && String(v).trim() !== '').join('\n\n');

  const lead = {
    name: pick(flat, FIELD_ALIASES.name) ?? 'Phone caller',
    phone,
    email: pick(flat, FIELD_ALIASES.email) ?? '',
    city: pick(flat, FIELD_ALIASES.city) ?? '',
    address: pick(flat, FIELD_ALIASES.address) ?? '',
    zip_code: pick(flat, FIELD_ALIASES.zip_code) ?? '',
    service_type: pick(flat, FIELD_ALIASES.service_type) ?? '',
    bedrooms: pick(flat, FIELD_ALIASES.bedrooms) ?? '',
    bathrooms: pick(flat, FIELD_ALIASES.bathrooms) ?? '',
    preferred_date: pick(flat, FIELD_ALIASES.preferred_date) ?? '',
    preferred_time: pick(flat, FIELD_ALIASES.preferred_time) ?? '',
    message: notes,
    status: 'new',
    source: 'phone-ai',
    utm_source: 'phone',
    utm_medium: 'ai-receptionist',
  };

  console.log('[voice-lead] normalised call lead:', JSON.stringify({ ...lead, message: notes.slice(0, 120) }));

  // Same path as a website lead: dedup by phone, enrichment, dashboard, e-mail.
  const forwarded: HandlerEvent = { ...event, body: JSON.stringify(lead) } as HandlerEvent;
  return leadsHandler(forwarded, context, () => {}) as any;
};
