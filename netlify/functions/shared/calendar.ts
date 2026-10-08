import { GoogleAuth } from 'google-auth-library';
import {
  TIMEZONE, WORK_HOURS, TRAVEL_BUFFER_MIN, MAX_JOBS_PER_DAY,
  MIN_LEAD_HOURS, SEARCH_DAYS, SLOT_STEP_MIN, SLOTS_OFFERED, durationFor,
} from './scheduling';

/**
 * Google Calendar, through the service account the Firebase project already
 * has. No OAuth screen, no token to refresh by hand: the owner shares the
 * calendar with that service account once and the server can read and write.
 *
 * Bookings the assistant makes are written as *tentative*. They occupy the
 * slot immediately — so the next caller cannot be offered the same time — but
 * they are visibly unconfirmed until a person approves them in the dashboard.
 * An assistant's mistake stays inside the calendar instead of reaching a
 * doorstep.
 *
 * Needs: the Calendar API enabled on the project, and the calendar shared with
 * FIREBASE_CLIENT_EMAIL with "Make changes to events".
 */

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';
const API = 'https://www.googleapis.com/calendar/v3';
const PENDING_PREFIX = '[PENDING] ';

export interface Slot {
  start: Date;
  end: Date;
  /** Exactly what the assistant should say out loud. */
  label: string;
  /** Opaque value the assistant echoes back when the customer picks it. */
  id: string;
}

export interface BookingResult {
  booked: boolean;
  eventId?: string;
  start?: string;
  end?: string;
  error?: string;
}

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

/* ------------------------------------------------------------------ */

/**
 * Wall-clock maths in the business timezone.
 *
 * The server runs in UTC. Doing this with plain Date methods means 08:00 on the
 * server is 4am in Connecticut, and the assistant cheerfully offers a customer
 * a Saturday 3am cleaning. Everything below converts through the business zone.
 */
const PARTS = new Intl.DateTimeFormat('en-US', {
  timeZone: TIMEZONE, hour12: false,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short',
});

const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function zoned(date: Date) {
  const map: Record<string, string> = {};
  for (const part of PARTS.formatToParts(date)) map[part.type] = part.value;
  return {
    year: +map.year, month: +map.month, day: +map.day,
    hour: +map.hour % 24, minute: +map.minute, second: +map.second,
    weekday: WEEKDAY_INDEX[map.weekday] ?? 0,
  };
}

/** Offset of the business zone at this instant, DST included. */
function offsetMs(date: Date): number {
  const z = zoned(date);
  return Date.UTC(z.year, z.month - 1, z.day, z.hour, z.minute, z.second) - date.getTime();
}

/** The instant whose wall clock in the business zone is the one given. */
function fromZoned(year: number, month: number, day: number, hour: number, minute: number): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  // One correction is enough except exactly on a DST boundary, so apply twice.
  let date = new Date(guess - offsetMs(new Date(guess)));
  date = new Date(guess - offsetMs(date));
  return date;
}

function atTime(reference: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const z = zoned(reference);
  return fromZoned(z.year, z.month, z.day, h, m);
}

/** Next :00 or :30 at or after this instant, in the business zone. */
function alignUp(date: Date, stepMin: number): Date {
  const z = zoned(date);
  const roundedMinute = Math.ceil(z.minute / stepMin) * stepMin;
  return fromZoned(z.year, z.month, z.day, z.hour, 0).getTime() + roundedMinute * 60000 >= date.getTime()
    ? new Date(fromZoned(z.year, z.month, z.day, z.hour, 0).getTime() + roundedMinute * 60000)
    : new Date(fromZoned(z.year, z.month, z.day, z.hour, 0).getTime() + (roundedMinute + stepMin) * 60000);
}

const sameZonedDay = (a: Date, b: Date) => {
  const x = zoned(a), y = zoned(b);
  return x.year === y.year && x.month === y.month && x.day === y.day;
};

function spoken(d: Date): string {
  return d.toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZone: TIMEZONE,
  });
}

const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) => aStart < bEnd && bStart < aEnd;

/**
 * Free start times for a job of this length, respecting working hours, the
 * travel buffer either side, the daily ceiling and the minimum notice.
 */
export async function findSlots(serviceType?: string | null, limit = SLOTS_OFFERED): Promise<Slot[]> {
  const minutes = durationFor(serviceType);
  const now = new Date();
  const from = new Date(now.getTime() + MIN_LEAD_HOURS * 36e5);
  const to = new Date(from.getTime() + SEARCH_DAYS * 24 * 36e5);

  let busy: Array<{ start: Date; end: Date }> = [];
  const data = await api(
    `/calendars/${encodeURIComponent(CALENDAR_ID)}/events` +
    `?timeMin=${from.toISOString()}&timeMax=${to.toISOString()}` +
    `&singleEvents=true&orderBy=startTime&maxResults=250`
  );
  busy = (data.items || [])
    .filter((e: any) => e.status !== 'cancelled' && e.start?.dateTime && e.end?.dateTime)
    .map((e: any) => ({ start: new Date(e.start.dateTime), end: new Date(e.end.dateTime) }));

  const slots: Slot[] = [];

  for (let dayOffset = 0; dayOffset <= SEARCH_DAYS && slots.length < limit; dayOffset++) {
    const day = new Date(from.getTime() + dayOffset * 24 * 36e5);

    const hours = WORK_HOURS[zoned(day).weekday];
    if (!hours) continue;

    const jobsThatDay = busy.filter(b => sameZonedDay(b.start, day)).length;
    if (jobsThatDay >= MAX_JOBS_PER_DAY) continue;

    const dayStart = atTime(day, hours.start);
    const dayEnd = atTime(day, hours.end);

    for (let t = alignUp(new Date(Math.max(dayStart.getTime(), from.getTime())), SLOT_STEP_MIN);
         t.getTime() + minutes * 60000 <= dayEnd.getTime() && slots.length < limit;
         t = new Date(t.getTime() + SLOT_STEP_MIN * 60000)) {

      const start = new Date(t);
      const end = new Date(t.getTime() + minutes * 60000);
      // Keep the buffer clear on both sides of an existing job.
      const padded = busy.some(b =>
        overlaps(start, end,
                 new Date(b.start.getTime() - TRAVEL_BUFFER_MIN * 60000),
                 new Date(b.end.getTime() + TRAVEL_BUFFER_MIN * 60000)));
      if (padded) continue;

      slots.push({ start, end, label: spoken(start), id: start.toISOString() });
      // One option per day keeps the choice readable on a phone call.
      break;
    }
  }

  return slots;
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
