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

/**
 * Deliberately empty.
 *
 * Granting admin to a whole domain cannot be done safely: Firebase Auth never
 * verifies that an account owns the domain in its address, so trusting
 * @danycleanpro.com would mean anyone able to register there arrives as an
 * administrator. Authority comes from admins/{uid} instead, which only
 * /api/admin-users can write.
 */
export const ADMIN_DOMAINS: string[] = [];

export function isAdminEmail(email?: string | null): boolean {
  const addr = String(email ?? '').trim().toLowerCase();
  if (!addr) return false;
  if (ADMIN_EMAILS.includes(addr)) return true;
  return ADMIN_DOMAINS.some(domain => addr.endsWith(`@${domain}`));
}

/**
 * Does this account hold admins/{uid}?
 *
 * Asked of our own server rather than of Firestore. Reading the document from
 * the browser needs the security rules to allow it, and when they do not, a
 * real administrator is told they have no permission — with the proof sitting
 * in a record they are not allowed to look at. The Admin SDK on the server is
 * not subject to those rules, so it can answer where the browser cannot.
 *
 * It is also the better place for the question: what comes back is a verdict
 * that cannot be forged, rather than evidence the client has to weigh.
 */
export async function hasAdminRecord(_uid?: string | null): Promise<boolean> {
  try {
    const { auth } = await import('./firebase');
    const token = await auth.currentUser?.getIdToken();
    if (!token) return false;

    const res = await fetch('/api/admin-session', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      // 503 means the server could not reach the database. That is not a
      // refusal, and saying so saves the next person the hunt we just had.
      console.warn('[admins] could not check admin status:', res.status);
      return false;
    }
    const body = await res.json();
    if (!body.admin && body.reason) console.warn('[admins] not an administrator:', body.reason);
    return body.admin === true;
  } catch (err) {
    console.warn('[admins] admin check failed:', err);
    return false;
  }
}
