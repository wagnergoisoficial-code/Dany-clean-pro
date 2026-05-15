import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseAppletConfig from '../../firebase-applet-config.json';

// Use the provisioned config directly if available
const firebaseConfig = {
  projectId: firebaseAppletConfig.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: firebaseAppletConfig.appId || import.meta.env.VITE_FIREBASE_APP_ID,
  apiKey: firebaseAppletConfig.apiKey || import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: firebaseAppletConfig.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  storageBucket: firebaseAppletConfig.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: firebaseAppletConfig.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
};

// Check if we have the minimal config needed
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.warn("Firebase configuration is missing. Ensure VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID are set.");
}

let app: any;
let db: any;
let auth: any;

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
    // CRITICAL: Must use the specific database ID provisioned by AI Studio
    const dbId = firebaseAppletConfig.firestoreDatabaseId || import.meta.env.VITE_FIREBASE_DATABASE_ID || undefined;
    db = getFirestore(app, dbId);
    auth = getAuth(app);
  } else {
    throw new Error("Firebase config missing");
  }
} catch (err) {
  console.warn("Firebase could not be initialized. Using mock services.", err);
  // Mock Firebase to prevent crashes in the UI
  app = { name: '[MOCK]' } as any;
  db = { 
    type: 'mock', 
    _databaseId: { projectId: 'mock-id' },
    firestoreGuid: 'mock-guid'
  } as any;
  auth = {
    onAuthStateChanged: (cb: any) => {
      cb(null);
      return () => {};
    },
    signOut: async () => {},
    currentUser: null
  } as any;
}

export { db, auth };

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
