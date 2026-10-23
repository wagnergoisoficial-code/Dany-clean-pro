/**
 * The Firebase database SDK, fetched only when it is wanted.
 *
 * It is about 480 KB of JavaScript. On a phone over a slow connection that is
 * seconds of downloading and processing, and a visitor only needs it to send
 * the quote form — public reads go over plain REST (firestoreRest.ts). The
 * dashboard's settings hook uses it too, once the page has loaded.
 */

import { afterPageLoad } from './timing';

type Firestore = typeof import('firebase/firestore');
export interface FirestoreKit { db: any; fs: Firestore }

let loading: Promise<FirestoreKit | null> | null = null;

/** Firestore now — for something the visitor is waiting on, like sending the form. */
export function firestoreNow(): Promise<FirestoreKit | null> {
  loading ??= Promise.all([import('./firebaseCore'), import('firebase/firestore')])
    .then(([core, fs]) => (core.isFirebaseReady() ? { db: core.db, fs } : null))
    .catch((err) => {
      console.warn('Database unavailable:', err);
      loading = null; // let a later call try again
      return null;
    });
  return loading;
}

/** Firestore after the page has loaded — for reads that can wait. */
export async function firestoreWhenIdle(): Promise<FirestoreKit | null> {
  await afterPageLoad();
  return firestoreNow();
}
