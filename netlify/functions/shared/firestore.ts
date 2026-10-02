import admin from 'firebase-admin';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

/**
 * The browser connects with `getFirestore(app, VITE_FIREBASE_DATABASE_ID)`, so
 * when the project stores its data in a *named* database the server has to ask
 * for the same one. `admin.firestore()` always targets "(default)", and writing
 * to a default database that was never created fails with a PERMISSION_DENIED
 * that talks about billing — which sends you looking in the wrong place.
 *
 * Set FIRESTORE_DATABASE_ID to the same value as VITE_FIREBASE_DATABASE_ID.
 * Leave it unset for the default database.
 */
export function firestore(): Firestore {
  const databaseId = (process.env.FIRESTORE_DATABASE_ID || process.env.VITE_FIREBASE_DATABASE_ID || '').trim();
  if (databaseId && databaseId !== '(default)') {
    return getFirestore(admin.app(), databaseId);
  }
  return admin.firestore();
}

export function databaseLabel(): string {
  return (process.env.FIRESTORE_DATABASE_ID || process.env.VITE_FIREBASE_DATABASE_ID || '(default)').trim();
}
