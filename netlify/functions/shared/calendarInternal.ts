import admin from 'firebase-admin';
import { firestore } from './firestore';
import { slotsFrom, searchWindow, Busy, Slot, BookingResult } from './slotEngine';
import { durationFor } from './scheduling';

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

async function busyPeriods(): Promise<Busy[]> {
  const { from, to } = searchWindow();
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

export async function findSlots(serviceType?: string | null, limit?: number): Promise<Slot[]> {
  const busy = await busyPeriods();
  return slotsFrom(busy, serviceType, limit);
}

export async function bookTentative(slotId: string, lead: {
  name?: string; phone?: string; email?: string; city?: string; service_type?: string; address?: string; leadId?: string;
}): Promise<BookingResult> {
  try {
    const start = new Date(slotId);
    if (isNaN(start.getTime())) return { booked: false, error: 'invalid slot' };
    const end = new Date(start.getTime() + durationFor(lead.service_type) * 60000);

    // Last line of defence against two callers accepting the same time within
    // seconds of each other: re-check immediately before writing.
    const clash = (await busyPeriods()).some(b => start < b.end && b.start < end);
    if (clash) return { booked: false, error: 'that time was just taken' };

    const doc = await firestore().collection(COLLECTION).add({
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
    });

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
