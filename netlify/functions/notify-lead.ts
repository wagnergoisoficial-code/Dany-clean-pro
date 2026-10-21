import { Handler } from '@netlify/functions';
import admin from 'firebase-admin';
import type { DocumentReference, DocumentSnapshot } from 'firebase-admin/firestore';
import { sendLeadEmail, mailProviderName, LeadEmailPayload } from './shared/leadEmail';
import { sendClientEmail } from './shared/clientEmail';
import { firestore } from './shared/firestore';
import { softly } from './shared/withTimeout';

/**
 * Notification endpoint for leads the browser wrote straight to Firestore.
 * The form takes that path whenever Firebase is ready, so without this call
 * those requests would never reach the inbox.
 *
 * It is also where the client hears back. The confirmation used to live only
 * in /api/leads — the fallback the form uses when Firestore is down — so on a
 * normal day nobody who filled in the form ever got it.
 */

function initAdmin(): boolean {
  if (admin.apps.length) return true;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_PRIVATE_KEY || '';
  if (!projectId || !clientEmail || !rawKey) return false;
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId, clientEmail,
        privateKey: rawKey.trim().replace(/^["']|["']$/g, '').replace(/,$/, '').replace(/\\n/g, '\n'),
      }),
    });
    return true;
  } catch { return false; }
}

/**
 * Whether to mail the client, and the lead document to mark once it is sent.
 *
 * This endpoint is open to the internet, and a client e-mail goes out from
 * Dany's own account to whatever address it is handed. So the address has to
 * belong to a request that really is in the database, and each request gets
 * its confirmation once. When the database cannot be read at all the mail
 * still goes: a customer left without an answer is the worse failure.
 */
async function confirmationTarget(lead: LeadEmailPayload): Promise<{ send: boolean; ref?: DocumentReference }> {
  const email = String(lead.email || '').trim().toLowerCase();
  if (!email.includes('@')) return { send: false };
  if (!initAdmin()) return { send: true };

  const leadId = String(lead.leadId || '').trim();
  if (!leadId) return { send: false };

  const doc = await softly<DocumentSnapshot | null>(
    () => firestore().collection('leads').doc(leadId).get(), 2000, 'lead lookup', null,
  );
  if (!doc) return { send: true };
  if (!doc.exists) return { send: false };

  const data = doc.data() as any;
  if (String(data?.email || '').trim().toLowerCase() !== email) return { send: false };
  const log: string[] = Array.isArray(data?.automation_log) ? data.automation_log : [];
  if (log.includes('confirmation')) return { send: false };
  return { send: true, ref: doc.ref };
}

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

  // GET is a health check: confirms the provider key landed in the environment
  // without exposing it. Handy right after setting the variable in Netlify.
  if (event.httpMethod === 'GET') {
    const provider = mailProviderName();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        configured: !!provider,
        provider,
        to: (process.env.LEAD_NOTIFY_TO || 'danycleanenpro@gmail.com').split(',').map(s => s.trim()),
        from: process.env.LEAD_NOTIFY_FROM || '(default sender)',
      }),
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  let lead: LeadEmailPayload;
  try {
    lead = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  if (!lead.phone && !lead.email) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'phone or email required' }) };
  }

  // Both mails go over the same SMTP connection budget; sent side by side so
  // the second does not wait out the first.
  const [result, client] = await Promise.all([
    sendLeadEmail(lead),
    confirmationTarget(lead).then(async target => {
      if (!target.send) return { sent: false, skipped: true };
      const ack = await sendClientEmail('confirmation', lead);
      if (ack.sent && target.ref) {
        const ref = target.ref;
        await softly(
          () => ref.update({ automation_log: admin.firestore.FieldValue.arrayUnion('confirmation') }).then(() => true),
          2000, 'confirmation log', false,
        );
      }
      if (!ack.sent) console.error('[notify-lead] CLIENT CONFIRMATION NOT SENT:', lead.email, '|', ack.error);
      return ack;
    }).catch((err: any) => ({ sent: false, error: String(err?.message || err) })),
  ]);

  // A failed notification must never look like a failed booking to the client.
  return { statusCode: 200, headers, body: JSON.stringify({ ...result, client_confirmation: client.sent }) };
};
