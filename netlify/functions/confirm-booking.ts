import { Handler } from '@netlify/functions';
import admin from 'firebase-admin';
import { firestore } from './shared/firestore';
import { confirmEvent, cancelEvent } from './shared/calendar';

/**
 * The one tap that turns a held slot into a real appointment — or releases it.
 *
 * The assistant can hold a time but never commit one. A person decides here,
 * which is what keeps an AI mistake inside the calendar instead of sending
 * someone to a doorstep.
 */
export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  let body: any;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { leadId, action } = body as { leadId?: string; action?: 'confirm' | 'release' };
  if (!leadId || !['confirm', 'release'].includes(String(action))) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'leadId and action (confirm|release) are required' }) };
  }

  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const rawKey = process.env.FIREBASE_PRIVATE_KEY || '';
    if (!projectId || !clientEmail || !rawKey) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'firebase not configured' }) };
    }
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId, clientEmail,
        privateKey: rawKey.trim().replace(/^["']|["']$/g, '').replace(/,$/, '').replace(/\\n/g, '\n'),
      }),
    });
  }

  try {
    const ref = firestore().collection('leads').doc(leadId);
    const snap = await ref.get();
    if (!snap.exists) return { statusCode: 404, headers, body: JSON.stringify({ error: 'lead not found' }) };

    const booking = (snap.data() as any)?.booking;
    if (!booking?.eventId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'this lead has no held slot' }) };
    }

    const result = action === 'confirm'
      ? await confirmEvent(booking.eventId)
      : await cancelEvent(booking.eventId);

    if (!result.ok) {
      return { statusCode: 502, headers, body: JSON.stringify({ error: result.error || 'calendar update failed' }) };
    }

    await ref.update({
      'booking.status': action === 'confirm' ? 'confirmed' : 'released',
      'booking.decidedAt': admin.firestore.FieldValue.serverTimestamp(),
      status: action === 'confirm' ? 'scheduled' : 'contacted',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`[confirm-booking] ${action} ${leadId} (${booking.eventId})`);
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, action }) };
  } catch (err: any) {
    console.error('[confirm-booking] failed:', err?.message || err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: String(err?.message || err).slice(0, 200) }) };
  }
};
