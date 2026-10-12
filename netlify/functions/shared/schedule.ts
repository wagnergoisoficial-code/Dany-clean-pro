/**
 * Which calendar the assistants use.
 *
 * "internal" (the default) keeps appointments in this project's own Firestore.
 * "google" uses a Google Calendar. "none" uses no store at all: times come
 * from the working-hours rules and the appointment travels by e-mail, which
 * answers in milliseconds and is the right choice while a database is
 * unavailable. The interface is identical, so nothing else changes.
 */
import * as internal from './calendarInternal';
import * as google from './calendarGoogle';
import * as none from './calendarNone';

const choice = (process.env.SCHEDULING_BACKEND || 'internal').toLowerCase();
const backend = choice === 'google' ? google : choice === 'none' ? none : internal;

export const findSlots = backend.findSlots;
export const bookTentative = backend.bookTentative;
export const confirmEvent = backend.confirmEvent;
export const cancelEvent = backend.cancelEvent;
export const calendarConfigured = backend.calendarConfigured;
export const backendName = () => (backend === google ? 'google' : backend === none ? 'none' : 'internal');
export type { Slot, BookingResult } from './slotEngine';
