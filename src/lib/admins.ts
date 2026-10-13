/**
 * Who may open the admin dashboard.
 *
 * This has to agree with isAdmin() in firestore.rules, because the two answer
 * different questions and only one of them is protection. The rules decide what
 * the database hands over; this decides what the browser renders. When they
 * disagree the dashboard opens onto empty panels with every read denied, which
 * reads as a broken dashboard rather than a permissions problem — so the list
 * lives in one place and both sides import it.
 *
 * Note what is deliberately absent: a token from localStorage. The gate used to
 * accept `!!auth.token`, read straight out of storage and never verified, so
 * anyone could write the key by hand in a console and walk in. Access is now a
 * question only Firebase Auth can answer.
 */
export const ADMIN_EMAILS = [
  'wagnergoisoficial@gmail.com',
];

/** Any address at the business's own domain. Mirrors the rules' endsWith check. */
export const ADMIN_DOMAINS = [
  'danycleanpro.com',
];

export function isAdminEmail(email?: string | null): boolean {
  const addr = String(email ?? '').trim().toLowerCase();
  if (!addr) return false;
  if (ADMIN_EMAILS.includes(addr)) return true;
  return ADMIN_DOMAINS.some(domain => addr.endsWith(`@${domain}`));
}
