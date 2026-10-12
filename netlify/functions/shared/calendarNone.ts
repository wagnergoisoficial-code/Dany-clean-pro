import { slotsFrom, Slot, BookingResult } from './slotEngine';
import { durationFor } from './scheduling';

/**
 * Scheduling with no store behind it.
 *
 * Times come from the working-hours rules alone and a booking is an agreement
 * made on the call, carried to the owner by e-mail rather than written down.
 * No database is consulted, so the tool answers in milliseconds — which
 * matters on a live call, where every wait is silence the caller sits through.
 *
 * What is given up is the schedule screen and protection against two callers
 * taking the same slot. A person confirms every appointment anyway, so the
 * cost of that is a phone call, not a wasted trip.
 *
 * Select with SCHEDULING_BACKEND=none.
 */

export async function findSlots(serviceType?: string | null, limit?: number): Promise<Slot[]> {
  return slotsFrom([], serviceType, limit);
}

export async function bookTentative(slotId: string, _lead: Record<string, any>): Promise<BookingResult> {
  const start = new Date(slotId);
  if (isNaN(start.getTime())) return { booked: false, error: 'invalid slot' };
  const end = new Date(start.getTime() + durationFor(_lead.service_type) * 60000);
  // Not "booked": nothing was written. The agent handler turns this into the
  // e-mail and tells the caller the team will confirm.
  return { booked: false, error: 'no calendar configured', start: start.toISOString(), end: end.toISOString() };
}

export async function confirmEvent(_id: string) {
  return { ok: false, error: 'no calendar configured' };
}

export async function cancelEvent(_id: string) {
  return { ok: false, error: 'no calendar configured' };
}

export const calendarConfigured = () => true;
