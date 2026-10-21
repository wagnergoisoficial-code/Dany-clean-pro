/**
 * Getting to the quote request.
 *
 * The request is a section near the foot of the home page. The hero button,
 * the menu, the service cards and the footer's e-mail field all lead there,
 * and a card brings its service along so the form arrives already filled in.
 * The e-mails Dany's automations send link to danycleanpro.com/#quote, the
 * section's id.
 *
 * A window event rather than shared state, because the header lives in the
 * layout and the form on the home page; the site already talks across that
 * gap this way for the call and text overlays.
 */
export interface QuoteDefaults {
  service_type?: string;
  email?: string;
}

export const QUOTE_EVENT = 'open-quote';

export function openQuote(defaults: QuoteDefaults = {}) {
  if (window.location.pathname !== '/') {
    // The form lives on the home page; the hash takes the visitor to it.
    window.location.assign('/#quote');
    return;
  }
  window.dispatchEvent(new CustomEvent<QuoteDefaults>(QUOTE_EVENT, { detail: defaults }));
}

/** Smooth scroll to a section of the home page. Nothing covers the top: the header is not fixed. */
export function scrollToSection(id: string) {
  if (window.location.pathname !== '/') {
    window.location.assign(`/#${id}`);
    return;
  }
  if (id === 'top') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
