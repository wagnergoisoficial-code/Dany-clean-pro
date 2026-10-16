import admin from 'firebase-admin';
import { firestore } from './firestore';
import { slotsFrom, searchWindow, Busy, Slot, BookingResult } from './slotEngine';
import { durationFor } from './scheduling';
import { softly, within } from './withTimeout';

/**
 * The schedule, kept in the project's own database.
 *
 * No Google API to enable, no calendar to share, no second account that can be
 * revoked — the appointments live in the same Firestore as the leads, which has
 * to work for anything else here to work anyway.
 *
 * Shape of an appointment (collection "appointments"):
 *   start, end        ISO strings
 *   status            'pending' | 'confirmed' | 'released'
 *   leadId, name, phone, city, address, service_type
 *   source            where the booking came from
 *
 * A pending appointment occupies its slot exactly like a confirmed one, so the
 * next caller is never offered a time someone is already holding.
 */

const COLLECTION = 'appointments';

/**
 * Throws when the store cannot be read. It must throw rather than return null:
 * the caller wraps this in a circuit breaker, and a swallowed error looks like
 * success — which had us re-attempting a refused database on every call and
 * paying the full timeout each time.
 */
async function busyPeriods(): Promise<Busy[]> {
  const { from, to } = searchWindow();
  {
  const snap = await firestore()
    .collection(COLLECTION)
    .where('start', '>=', from.toISOString())
    .where('start', '<=', to.toISOString())
    .get();

    return snap.docs
      .map(d => d.data() as any)
      .filter(a => a.status !== 'released' && a.start && a.end)
      .map(a => ({ start: new Date(a.start), end: new Date(a.end) }));
  }
}

/**
 * Offering nothing is the worst answer on a live call — the assistant runs out
 * of script and the caller is left hanging. When the store is unreachable we
 * still propose times from the working-hours rules, treating the calendar as
 * empty. Every booking is confirmed by a person anyway, so a proposal that
 * turns out to clash costs a phone call, not a wasted trip.
 */
export async function findSlots(serviceType?: string | null, limit?: number): Promise<Slot[]> {
  // On a live call a second of silence is expensive. A store that is slow or
  // refusing reads gets one second to answer; past that the rules decide alone.
  const busy = await softly(() => busyPeriods(), 1000, 'appointments read', null);
  return slotsFrom(busy ?? [], serviceType, limit);
}

/** True when the store answers — the caller can promise a real hold. */
export async function scheduleIsAuthoritative(): Promise<boolean> {
  return (await softly(() => busyPeriods(), 1000, 'appointments read', null)) !== null;
}

export async function bookTentative(slotId: string, lead: {
  name?: string; phone?: string; email?: string; city?: string; service_type?: string; address?: string; leadId?: string;
}): Promise<BookingResult> {
  try {
    const start = new Date(slotId);
    if (isNaN(start.getTime())) return { booked: false, error: 'invalid slot' };
    const end = new Date(start.getTime() + durationFor(lead.service_type) * 60000);

    // Last line of defence against two callers accepting the same time within
    // seconds of each other: re-check immediately before writing. A read that
    // fails is not a clash — it just means we cannot rule one out.
    // A read that fails is not a clash — it only means we cannot rule one out.
    const busy = await softly(() => busyPeriods(), 1000, 'appointments read', null);
    if (busy && busy.some(b => start < b.end && b.start < end)) {
      return { booked: false, error: 'that time was just taken' };
    }

    // Every read in this file has a deadline because a second of silence is
    // expensive on a live call. This write had none — and it is the one that
    // runs at the exact moment the caller says yes to a time. Measured against
    // production it takes seconds, which was enough, with the e-mail after it,
    // to push the whole reply past the platform's limit and drop the call.
    const doc = await within(() => firestore().collection(COLLECTION).add({
      start: start.toISOString(),
      end: end.toISOString(),
      status: 'pending',
      name: lead.name || null,
      phone: lead.phone || null,
      email: lead.email || null,
      city: lead.city || null,
      address: lead.address || null,
      service_type: lead.service_type || null,
      leadId: lead.leadId || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }), 4000, 'appointment write');

    console.log('[schedule] held', doc.id, start.toISOString());
    return { booked: true, eventId: doc.id, start: start.toISOString(), end: end.toISOString() };
  } catch (err: any) {
    console.error('[schedule] hold failed:', err?.message || err);
    return { booked: false, error: String(err?.message || err).slice(0, 200) };
  }
}

export async function confirmEvent(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await firestore().collection(COLLECTION).doc(id).update({
      status: 'confirmed',
      confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: String(err?.message || err).slice(0, 200) };
  }
}

export async function cancelEvent(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    // Kept, not deleted: a released slot is part of the history of the lead.
    await firestore().collection(COLLECTION).doc(id).update({
      status: 'released',
      releasedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: String(err?.message || err).slice(0, 200) };
  }
}

export const calendarConfigured = () =>
  !!(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);
