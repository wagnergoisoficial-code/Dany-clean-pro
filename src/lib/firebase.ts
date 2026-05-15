import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseAppletConfig from '../../firebase-applet-config.json';

// Helper to get config value with fallback
const getConfig = (key: string, configVal: string | undefined): string | undefined => {
  const envKey = `VITE_FIREBASE_${key.toUpperCase()}`;
  const envVal = import.meta.env[envKey];
  
  // If config value is missing or a placeholder, use ENV
  if (!configVal || configVal === 'REDACTED' || configVal.includes('AIza***')) {
    return envVal;
  }
  
  // In production, we might prefer ENV if available
  const isProd = import.meta.env.PROD;
  if (isProd && envVal) {
    return envVal;
  }

  return configVal;
};

// Use the provisioned config directly if available, falling back to ENV
const firebaseConfig = {
  projectId: getConfig('PROJECT_ID', firebaseAppletConfig.projectId),
  appId: getConfig('APP_ID', firebaseAppletConfig.appId),
  apiKey: getConfig('API_KEY', firebaseAppletConfig.apiKey),
  authDomain: getConfig('AUTH_DOMAIN', firebaseAppletConfig.authDomain),
  storageBucket: getConfig('STORAGE_BUCKET', firebaseAppletConfig.storageBucket),
  messagingSenderId: getConfig('MESSAGING_SENDER_ID', firebaseAppletConfig.messagingSenderId),
};

// Database ID resolution
const getDbId = (): string | undefined => {
  const envDbId = import.meta.env.VITE_FIREBASE_DATABASE_ID;
  const configDbId = (firebaseAppletConfig as any).firestoreDatabaseId;
  
  if (configDbId && configDbId !== 'REDACTED') {
    return configDbId;
  }
  return envDbId || undefined;
};

// Check if we have the minimal config needed
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.warn("Firebase configuration is missing. Ensure VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID are set.");
}

let app: any;
let db: any;
let auth: any;

// Helper to check if we are truly connected
export const isFirebaseReady = () => {
  return db && db.type !== 'mock';
};

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
    // CRITICAL: Must use the specific database ID provisioned by AI Studio
    // If we are on danycleanpro.com, we might be using a different setup, or it might be the same.
    // However, our code MUST respect the config file if it exists.
    const dbId = getDbId();
    db = getFirestore(app, dbId);
    auth = getAuth(app);
    console.log("Firebase initialized with project:", firebaseConfig.projectId, "and DB:", dbId || '(default)');
  } else {
    throw new Error("Firebase config missing API Key or Project ID");
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
