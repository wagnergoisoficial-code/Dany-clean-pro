/**
 * Scheduling rules.
 *
 * These are the four answers the assistant needs before it can offer a time:
 * how long each service takes, when the team works, how much room to leave
 * between houses, and how many jobs fit in a day. The values below are
 * starting points — hours come from what the site publishes, the rest are
 * conservative guesses. Correcting them here changes both the phone and the
 * SMS assistant at once.
 *
 * Erring long is the safe direction: a slot that is too generous costs an
 * empty gap, one that is too tight sends someone late to the next house.
 */

export const TIMEZONE = process.env.BUSINESS_TIMEZONE || 'America/New_York';

/** Minutes on site, by service. Matched loosely against what the customer said. */
export const SERVICE_DURATIONS: Array<{ match: RegExp; minutes: number; label: string }> = [
  { match: /deep/i,                         minutes: 240, label: 'Deep cleaning' },
  { match: /move|turnover|airbnb|rental/i,  minutes: 300, label: 'Move-in / move-out' },
  { match: /construction|renovat|remodel/i, minutes: 300, label: 'Post-construction' },
  { match: /office|commercial|clinic/i,     minutes: 180, label: 'Commercial' },
  { match: /standard|regular|weekly|bi-?weekly|residential|maintenance/i, minutes: 150, label: 'Standard residential' },
];
export const DEFAULT_DURATION_MIN = 180;

/** Working hours per weekday, from the site. 0 = Sunday. */
export const WORK_HOURS: Record<number, { start: string; end: string } | null> = {
  0: null,                              // Sunday — requests taken, no visits
  1: { start: '08:00', end: '18:00' },
  2: { start: '08:00', end: '18:00' },
  3: { start: '08:00', end: '18:00' },
  4: { start: '08:00', end: '18:00' },
  5: { start: '08:00', end: '18:00' },
  6: { start: '09:00', end: '16:00' },  // Saturday
};

/** Driving and setup between two houses. */
export const TRAVEL_BUFFER_MIN = Number(process.env.SCHEDULING_TRAVEL_BUFFER_MIN || 45);

/** Ceiling per day, so the assistant cannot overfill the calendar. */
export const MAX_JOBS_PER_DAY = Number(process.env.SCHEDULING_MAX_JOBS_PER_DAY || 3);

/** Nothing booked sooner than this — the team needs notice. */
export const MIN_LEAD_HOURS = Number(process.env.SCHEDULING_MIN_LEAD_HOURS || 24);

/** How far ahead to look when offering times. */
export const SEARCH_DAYS = Number(process.env.SCHEDULING_SEARCH_DAYS || 10);

/** Start times are offered on the hour and half hour, not at 9:07. */
export const SLOT_STEP_MIN = 30;

/** How many options to put in front of the customer. More than three is a maze. */
export const SLOTS_OFFERED = Number(process.env.SCHEDULING_SLOTS_OFFERED || 3);

export function durationFor(serviceType: string | undefined | null): number {
  const text = String(serviceType || '');
  for (const rule of SERVICE_DURATIONS) {
    if (rule.match.test(text)) return rule.minutes;
  }
  return DEFAULT_DURATION_MIN;
}
