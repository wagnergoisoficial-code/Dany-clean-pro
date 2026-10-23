import { getAuth } from 'firebase/auth';
import { doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { app, db, databaseId, firebaseConfig, isFirebaseReady } from './firebaseCore';

/**
 * Firebase for the dashboard: the app and database from firebaseCore, plus
 * sign-in and file storage. The public pages never import this module — it
 * would put sign-in and storage, which no visitor uses, on their critical
 * path — they reach the database through firestoreLazy.ts instead.
 */

if (import.meta.env.DEV) {
  console.log('--- Firebase Audit ---');
  console.log('Project ID:', firebaseConfig.projectId || 'MISSING');
  console.log('API Key Present:', !!firebaseConfig.apiKey);
  console.log('Database:', databaseId || '(default)');
  console.log('---------------------');
}

let auth: any;
let storage: any;

if (app) {
  auth = getAuth(app);
  storage = getStorage(app);
} else {
  auth = {
    onAuthStateChanged: (cb: any) => {
      cb(null);
      return () => {};
    },
    signOut: async () => {},
    currentUser: null
  } as any;
  storage = {
    ref: () => ({}),
    uploadBytes: async () => ({}),
    getDownloadURL: async () => ''
  } as any;
}

export { isFirebaseReady };
export { db, auth, storage };

// Validation check
async function testConnection() {
  // Only test if db is a real Firestore instance
  if (!db || db.type === 'mock') return;
  
  try {
    const docRef = doc(db, 'test', 'connection');
    await getDocFromServer(docRef);
    console.log("Firebase connection established successfully.");
  } catch (error: any) {
    const msg = error?.message || '';
    if (msg.includes('not found') || msg.includes('permission')) {
      console.warn("Firestore database configuration issue detected. Platform will operate in fallback mode.");
    } else if (msg.includes('the client is offline')) {
      console.warn("Firestore is offline.");
    } else {
      console.warn("Firestore connection check issue:", error);
    }
  }
}

// Vite uses import.meta.env.DEV for checking dev mode
if (import.meta.env.DEV) {
  testConnection();
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

let lastErrorTime = 0;
const ERROR_SPAM_THRESHOLD = 5000; // 5 seconds

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Check for configuration/permission loops
  const now = Date.now();
  if (now - lastErrorTime < ERROR_SPAM_THRESHOLD) {
    return;
  }
  
  lastErrorTime = now;

  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || false,
      isAnonymous: auth?.currentUser?.isAnonymous || false,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }

  console.error('Firestore Error: ', JSON.stringify(errInfo));

  // DO NOT THROW in production or for common benign errors
  // Throwing here is what causes "White Screen" if not caught by ErrorBoundary
  if (!import.meta.env.DEV || errorMessage.includes('not found') || errorMessage.includes('permission')) {
    return;
  }

  // We only throw in dev for real unexpected errors to help developer, 
  // but we should probably just return even then to be safe.
  // throw new Error(JSON.stringify(errInfo));
}
