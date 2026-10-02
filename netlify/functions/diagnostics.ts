import { Handler } from '@netlify/functions';
import admin from 'firebase-admin';
import { mailProviderName } from './shared/leadEmail';
import { firestore, databaseLabel } from './shared/firestore';

/**
 * One read-only URL that answers "is production actually wired up?".
 * Reports configuration state and the result of a real Firestore read, with no
 * secret values in the response.
 */
export const handler: Handler = async () => {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

  const report: Record<string, any> = {
    mail: {
      provider: mailProviderName(),
      configured: !!mailProviderName(),
      notifies: (process.env.LEAD_NOTIFY_TO || 'danycleanenpro@gmail.com').split(',').map(s => s.trim()),
    },
    automation: {
      enabled: process.env.AUTOMATION_ENABLED === 'true',
      dryRun: process.env.AUTOMATION_DRY_RUN === 'true',
    },
    firestore: {
      projectId: process.env.FIREBASE_PROJECT_ID || null,
      database: databaseLabel(),
      credentials: !!(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY),
      readable: false,
      error: null as string | null,
    },
  };

  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID!,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
          privateKey: (process.env.FIREBASE_PRIVATE_KEY || '')
            .trim().replace(/^["']|["']$/g, '').replace(/,$/, '').replace(/\\n/g, '\n'),
        }),
      });
    }
    // A single-document read is the smallest thing that proves server-side access.
    const snap = await firestore().collection('leads').limit(1).get();
    report.firestore.readable = true;
    report.firestore.leadsVisible = snap.size;
  } catch (err: any) {
    report.firestore.error = String(err?.message || err).slice(0, 300);
  }

  report.ok = report.mail.configured && report.firestore.readable;
  return { statusCode: 200, headers, body: JSON.stringify(report, null, 2) };
};
