/**
 * The referral link: danycleanpro.com/refer?from=Jane.
 *
 * The friend who opens it is told who sent her, and the name rides along to
 * the quote form's "Who referred you?" field, so every referred lead arrives
 * with its referrer. Kept for the browser session only.
 */
const KEY = 'dcp_referred_by';

export const REFERRAL = {
  friendGets: 25,
  referrerGets: 30,
  bonusEvery: 3,
  bonusExtras: 'inside the refrigerator, inside the oven, baseboards or interior windows',
};

/** A first name, or first and last: letters, spaces, hyphens and apostrophes, at most 40 characters. */
export function cleanName(raw: string | null | undefined): string {
  return String(raw || '')
    .replace(/[^\p{L}\s'’.-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 40);
}

export function referralLink(name: string): string {
  return `https://danycleanpro.com/refer?from=${encodeURIComponent(cleanName(name))}`;
}

export function rememberReferral(name: string) {
  try { sessionStorage.setItem(KEY, cleanName(name)); } catch { /* storage off: the friend types it */ }
}

export function readReferral(): string {
  try { return cleanName(sessionStorage.getItem(KEY)); } catch { return ''; }
}
