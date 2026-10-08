import {
  TIMEZONE, WORK_HOURS, TRAVEL_BUFFER_MIN, MAX_JOBS_PER_DAY,
  MIN_LEAD_HOURS, SEARCH_DAYS, SLOT_STEP_MIN, SLOTS_OFFERED, durationFor,
} from './scheduling';

/**
 * Turns "when is the team free?" into concrete start times.
 *
 * Deliberately knows nothing about where appointments are stored: it takes a
 * list of busy periods and applies the business rules. Both the in-house
 * calendar and the Google one feed it, so the two can never drift apart on
 * working hours, travel time or the daily ceiling.
 */

export interface Busy { start: Date; end: Date; }

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

/** The window a store should be asked about. */
export function searchWindow(): { from: Date; to: Date } {
  const from = new Date(Date.now() + MIN_LEAD_HOURS * 36e5);
  return { from, to: new Date(from.getTime() + SEARCH_DAYS * 24 * 36e5) };
}

export function slotsFrom(busy: Busy[], serviceType?: string | null, limit = SLOTS_OFFERED): Slot[] {
  const minutes = durationFor(serviceType);
  const { from } = searchWindow();
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
      // Keep the travel buffer clear on both sides of an existing job.
      const padded = busy.some(b =>
        overlaps(start, end,
                 new Date(b.start.getTime() - TRAVEL_BUFFER_MIN * 60000),
                 new Date(b.end.getTime() + TRAVEL_BUFFER_MIN * 60000)));
      if (padded) continue;

      slots.push({ start, end, label: spoken(start), id: start.toISOString() });
      break;   // one option per day keeps the choice readable on a phone call
    }
  }

  return slots;
}

export { spoken, zoned, sameZonedDay, durationFor };
