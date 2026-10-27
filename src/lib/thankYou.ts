/**
 * The thank-you page that follows the quote form.
 *
 * Ad platforms count a conversion when a visitor reaches a known address —
 * Google Ads is set up with "URL contains /thank-you". The form used to show
 * its confirmation in place, on the home page's own address, so nothing could
 * tell a sent request from a visit. Now a stored request leads to a real page
 * load of /thank-you, and every tag on the site sees that page as it would any
 * other.
 *
 * The Meta Lead fires there too, once, and only when the visitor really came
 * from the form: someone opening /thank-you directly, or reloading it, is not
 * a new lead. A Lead fired on the form just before leaving the page could be
 * cut off by the navigation.
 */

export const THANK_YOU_PATH = '/thank-you';
const SENT = 'dcp-quote-sent';

/** After the request is stored: remember who sent it and open the thank-you page. */
export function goToThankYou(name: string) {
  try {
    sessionStorage.setItem(SENT, JSON.stringify({ name, at: Date.now() }));
  } catch {
    // Storage refused (private mode): the page still opens, without a name.
  }
  window.location.assign(THANK_YOU_PATH);
}

/**
 * On the thank-you page: who just sent the form, or null when the visit did
 * not come from it. Read once, so a reload does not count twice.
 */
export function takeSentRequest(): { name: string } | null {
  try {
    const raw = sessionStorage.getItem(SENT);
    if (!raw) return null;
    sessionStorage.removeItem(SENT);
    const { name, at } = JSON.parse(raw);
    return Date.now() - Number(at) < 30 * 60_000 ? { name: String(name || '') } : null;
  } catch {
    return null;
  }
}
