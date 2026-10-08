import { GoogleAuth } from 'google-auth-library';
import { TIMEZONE } from './scheduling';
import { slotsFrom, searchWindow, Busy, Slot, BookingResult } from './slotEngine';
import { durationFor } from './scheduling';

/**
 * Google Calendar, through the service account the Firebase project already
 * has. The scheduling rules live in slotEngine — this file only supplies the
 * busy periods and writes the events.
 *
 * Needs: the Calendar API enabled on the project, and the calendar shared with
 * FIREBASE_CLIENT_EMAIL with "Make changes to events".
 */

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';
const API = 'https://www.googleapis.com/calendar/v3';
const PENDING_PREFIX = '[PENDING] ';

export type { Slot, BookingResult };

function credentials() {
  const client_email = process.env.FIREBASE_CLIENT_EMAIL;
  const private_key = (process.env.FIREBASE_PRIVATE_KEY || '')
    .trim().replace(/^["']|["']$/g, '').replace(/,$/, '').replace(/\\n/g, '\n');
  if (!client_email || !private_key) return null;
  return { client_email, private_key };
}

export function calendarConfigured(): boolean {
  return !!credentials();
}

async function token(): Promise<string | null> {
  const creds = credentials();
  if (!creds) return null;
  try {
    const auth = new GoogleAuth({
      credentials: creds,
      scopes: ['https://www.googleapis.com/auth/calendar.events'],
    });
    const client = await auth.getClient();
    const result = await client.getAccessToken();
    return typeof result === 'string' ? result : result?.token || null;
  } catch (err: any) {
    console.error('[calendar] auth failed:', err?.message || err);
    return null;
  }
}

async function api(path: string, init: RequestInit = {}): Promise<any> {
  const bearer = await token();
  if (!bearer) throw new Error('calendar not authorised');
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`${res.status} ${detail.slice(0, 200)}`);
  }
  return res.status === 204 ? null : res.json();
}

/** Busy periods from the shared calendar, handed to the rules engine. */
export async function findSlots(serviceType?: string | null, limit?: number): Promise<Slot[]> {
  const { from, to } = searchWindow();
  const data = await api(
    `/calendars/${encodeURIComponent(CALENDAR_ID)}/events` +
    `?timeMin=${from.toISOString()}&timeMax=${to.toISOString()}` +
    `&singleEvents=true&orderBy=startTime&maxResults=250`
  );
  const busy: Busy[] = (data.items || [])
    .filter((e: any) => e.status !== 'cancelled' && e.start?.dateTime && e.end?.dateTime)
    .map((e: any) => ({ start: new Date(e.start.dateTime), end: new Date(e.end.dateTime) }));
  return slotsFrom(busy, serviceType, limit);
}

/** Hold a slot, unconfirmed, and say so on the event itself. */
export async function bookTentative(slotId: string, lead: {
  name?: string; phone?: string; email?: string; city?: string; service_type?: string; address?: string;
}): Promise<BookingResult> {
  try {
    const start = new Date(slotId);
    if (isNaN(start.getTime())) return { booked: false, error: 'invalid slot' };
    const end = new Date(start.getTime() + durationFor(lead.service_type) * 60000);

    const event = await api(`/calendars/${encodeURIComponent(CALENDAR_ID)}/events`, {
      method: 'POST',
      body: JSON.stringify({
        summary: `${PENDING_PREFIX}${lead.service_type || 'Cleaning'} — ${lead.name || lead.phone || 'New client'}`,
        description: [
          'Booked by the AI receptionist. NOT CONFIRMED until approved in the dashboard.',
          '',
          `Name: ${lead.name || '-'}`,
          `Phone: ${lead.phone || '-'}`,
          `Email: ${lead.email || '-'}`,
          `City: ${lead.city || '-'}`,
          `Address: ${lead.address || '-'}`,
          `Service: ${lead.service_type || '-'}`,
        ].join('\n'),
        location: [lead.address, lead.city].filter(Boolean).join(', ') || undefined,
        start: { dateTime: start.toISOString(), timeZone: TIMEZONE },
        end: { dateTime: end.toISOString(), timeZone: TIMEZONE },
        status: 'tentative',
        colorId: '5',              // banana — visibly different from confirmed work
        transparency: 'opaque',    // still blocks the time
      }),
    });

    console.log('[calendar] tentative hold', event.id, start.toISOString());
    return { booked: true, eventId: event.id, start: start.toISOString(), end: end.toISOString() };
  } catch (err: any) {
    console.error('[calendar] booking failed:', err?.message || err);
    return { booked: false, error: String(err?.message || err).slice(0, 200) };
  }
}

/** Promote a held slot to a real appointment. */
export async function confirmEvent(eventId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const current = await api(`/calendars/${encodeURIComponent(CALENDAR_ID)}/events/${encodeURIComponent(eventId)}`);
    await api(`/calendars/${encodeURIComponent(CALENDAR_ID)}/events/${encodeURIComponent(eventId)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        summary: String(current.summary || '').replace(PENDING_PREFIX, ''),
        description: String(current.description || '').replace(
          'Booked by the AI receptionist. NOT CONFIRMED until approved in the dashboard.',
          'Confirmed in the dashboard.'),
        status: 'confirmed',
        colorId: '10',             // basil — confirmed work
      }),
    });
    return { ok: true };
  } catch (err: any) {
    console.error('[calendar] confirm failed:', err?.message || err);
    return { ok: false, error: String(err?.message || err).slice(0, 200) };
  }
}

/** Drop a held slot — the customer changed their mind, or it was a mistake. */
export async function cancelEvent(eventId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await api(`/calendars/${encodeURIComponent(CALENDAR_ID)}/events/${encodeURIComponent(eventId)}`, { method: 'DELETE' });
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: String(err?.message || err).slice(0, 200) };
  }
}
