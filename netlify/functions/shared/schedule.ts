/**
 * Which calendar the assistants use.
 *
 * "internal" (the default) keeps appointments in this project's own Firestore:
 * nothing to enable, nothing to share, and it depends only on a database that
 * has to work anyway. Set SCHEDULING_BACKEND=google to use a Google Calendar
 * instead — the interface is identical, so nothing else changes.
 */
import * as internal from './calendarInternal';
import * as google from './calendarGoogle';

const backend = (process.env.SCHEDULING_BACKEND || 'internal').toLowerCase() === 'google' ? google : internal;

export const findSlots = backend.findSlots;
export const bookTentative = backend.bookTentative;
export const confirmEvent = backend.confirmEvent;
export const cancelEvent = backend.cancelEvent;
export const calendarConfigured = backend.calendarConfigured;
export const backendName = () => (backend === google ? 'google' : 'internal');
export type { Slot, BookingResult } from './slotEngine';
