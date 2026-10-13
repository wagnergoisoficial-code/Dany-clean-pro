/**
 * Who is allowed to administer this site, answered on the server.
 *
 * The browser cannot be the authority here. It used to be: the dashboard gate
 * read an unverified token out of localStorage, so anyone could write the key
 * by hand and walk in. Nor can an e-mail domain be the authority — the rules
 * granted admin to anything ending in @danycleanpro.com, and since Firebase
 * Auth never checks that you own a domain, a sign-up form would have let a
 * stranger register there and promote themselves.
 *
 * So authority lives in one place both sides agree on: a document at
 * admins/{uid}. Firestore's rules already read it, this file writes it, and
 * only someone who already holds one can hand out another.
 */
import admin from 'firebase-admin';
import { firestore } from './firestore';

export function initAdmin(): boolean {
  if (admin.apps.length) return true;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_PRIVATE_KEY || '';
  if (!projectId || !clientEmail || !rawKey) return false;
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        // Netlify stores the key with literal \n, and some consoles wrap it in
        // quotes or leave a trailing comma from a pasted JSON file.
        privateKey: rawKey.trim().replace(/^["']|["']$/g, '').replace(/,$/, '').replace(/\\n/g, '\n'),
      }),
    });
    return true;
  } catch (err) {
    console.error('[adminAuth] initializeApp failed:', err);
    return false;
  }
}

export interface Caller {
  uid: string;
  email: string | null;
  name?: string;
}

/** The signed-in account behind a request, or null when the token is no good. */
export async function callerFrom(authorization?: string): Promise<Caller | null> {
  const token = String(authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email ?? null, name: decoded.name };
  } catch {
    // An expired or forged token is not an error worth logging loudly; it is
    // the normal answer to "is this person who they say they are".
    return null;
  }
}

export async function isAdminUid(uid: string): Promise<boolean> {
  const snap = await firestore().collection('admins').doc(uid).get();
  return snap.exists;
}

/** True while the site has no administrators — the one moment a key may create one. */
export async function noAdminsYet(): Promise<boolean> {
  const snap = await firestore().collection('admins').limit(1).get();
  return snap.empty;
}

/**
 * Constant-time compare, so a wrong setup key cannot be found one character at
 * a time by watching how long the answer takes.
 */
export function secretMatches(given: string, expected: string): boolean {
  if (!expected || !given || given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < given.length; i++) diff |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
