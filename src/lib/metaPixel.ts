/**
 * Meta Pixel — Dany Clean Pro, ID 1096937758561129.
 *
 * The base code lives in index.html, where Meta's tools expect to find it, and
 * fires the first PageView. Everything after that goes through here: a single
 * page app changes pages without reloading, so the pixel only hears about the
 * second page if someone tells it.
 *
 * The admin panel is left out on purpose. Dany opening the dashboard twenty
 * times a day would be counted as a visitor, and it would end up in the
 * audiences the ads are built from.
 *
 * Every call is optional: an ad blocker removes `fbq`, and a blocked pixel must
 * never cost a booking.
 */

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

type StandardEvent = 'PageView' | 'Lead' | 'Contact';

export function track(event: StandardEvent, params?: Record<string, string | number>) {
  try {
    if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
    if (window.location.pathname.startsWith('/admin')) return;
    window.fbq('track', event, params);
  } catch {
    // A tracking failure is never the visitor's problem.
  }
}

/**
 * A Lead for a call or a text, once per channel per visit.
 *
 * The Meta campaign optimises for Lead, and for a cleaning company a tap on
 * "call" or "text" is as much a lead as the quote form. Someone who taps
 * "call" three times is still one person, though, so the Lead goes out the
 * first time in the browser tab's session; Contact still goes out on every
 * tap. Storage can be refused (private mode), so memory backs it up.
 */
const LEADS_SENT = 'dcp-pixel-contact-leads';
const sentThisPage = new Set<string>();

function leadOncePerVisit(channel: string) {
  let sent: string[] = [];
  try { sent = JSON.parse(sessionStorage.getItem(LEADS_SENT) || '[]'); } catch {}
  if (sentThisPage.has(channel) || sent.includes(channel)) return;
  sentThisPage.add(channel);
  try { sessionStorage.setItem(LEADS_SENT, JSON.stringify([...sent, channel])); } catch {}
  track('Lead', { content_name: channel });
}

/**
 * A tap on a phone or text link is the visitor reaching out. Those links are
 * spread across the header, the hero, the footer and the contact block, so
 * one listener on the document hears them all instead of five handlers that
 * would drift apart.
 */
export function trackContactLinks(): () => void {
  const onClick = (e: MouseEvent) => {
    const link = (e.target as Element | null)?.closest?.('a[href^="tel:"], a[href^="sms:"]');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    const channel = href.startsWith('sms:') ? 'Text' : 'Phone call';
    track('Contact', { content_name: channel });
    leadOncePerVisit(channel);
  };
  document.addEventListener('click', onClick, true);
  return () => document.removeEventListener('click', onClick, true);
}
