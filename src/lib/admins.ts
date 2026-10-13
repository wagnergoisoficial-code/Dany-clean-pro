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
 * The same document the Firestore rules read, asked from the browser so the
 * gate and the database agree on one answer. The rules let a signed-in account
 * read its own entry, and nothing else in here, so a stranger learns only
 * whether they themselves are an administrator.
 */
export async function hasAdminRecord(uid?: string | null): Promise<boolean> {
  if (!uid) return false;
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const { db, isFirebaseReady } = await import('./firebase');
    if (!isFirebaseReady()) return false;
    const snap = await getDoc(doc(db, 'admins', uid));
    return snap.exists();
  } catch {
    // A denied or offline read is not an admission of access.
    return false;
  }
}
