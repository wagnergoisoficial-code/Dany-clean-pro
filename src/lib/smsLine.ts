/**
 * The number customers text.
 *
 * Calls and texts live on two different numbers. (218) 357-5938 is the office
 * line, answered by the voice agent; (475) 341-3699 does SMS only — the
 * receptionist answers there, and every text the business sends comes from it.
 * A "Text us" button pointing at the call line would start a thread on a number
 * nobody reads, so every SMS link on the site takes its number from here.
 */
export const SMS_NUMBER = '+14753413699';
export const SMS_NUMBER_DISPLAY = '+1 (475) 341-3699';

/** An sms: link with the opening message already typed. */
export function smsHref(body = 'Hi, I would like a cleaning quote.'): string {
  // iOS reads the body after "&", everyone else after "?".
  const isIOS = typeof window !== 'undefined' && (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
  return `sms:${SMS_NUMBER}${isIOS ? '&' : '?'}body=${encodeURIComponent(body)}`;
}
