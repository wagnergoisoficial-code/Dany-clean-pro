import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

/**
 * The Firebase app and its database — the part both the public site and the
 * dashboard need.
 *
 * Kept apart from sign-in and file storage (src/lib/firebase.ts adds those)
 * because a visitor to the home page needs neither. The public pages load this
 * module late, through firestoreLazy.ts, so none of it stands between a phone
 * and the first picture of the page.
 */

const cleanEnvVar = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const cleaned = value.replace(/^["'](.+)["']$/, '$1').trim();
  return cleaned || undefined;
};

export const firebaseConfig = {
  apiKey: cleanEnvVar(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: cleanEnvVar(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: cleanEnvVar(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: cleanEnvVar(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: cleanEnvVar(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: cleanEnvVar(import.meta.env.VITE_FIREBASE_APP_ID),
  measurementId: cleanEnvVar(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID),
};

export const databaseId: string | undefined = cleanEnvVar(import.meta.env.VITE_FIREBASE_DATABASE_ID);

let app: FirebaseApp | null = null;
let db: Firestore | any;

try {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error('Firebase config missing API Key or Project ID');
  }
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  db = getFirestore(app, databaseId as string);
} catch (err) {
  console.warn('Firebase could not be initialized. Using mock services.', err);
  db = { type: 'mock', _databaseId: { projectId: 'mock-id' }, firestoreGuid: 'mock-guid' };
}

export { app, db };

export const isFirebaseReady = () => !!db && db.type !== 'mock';
