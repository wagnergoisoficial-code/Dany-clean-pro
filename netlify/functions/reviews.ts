import { Handler } from '@netlify/functions';
import admin from 'firebase-admin';
import { firestore } from './shared/firestore';
import { sendMail } from './shared/leadEmail';
import { within } from './shared/withTimeout';

/**
 * POST /api/reviews/submit — a review written on the site.
 *
 * Anyone can write one, so nothing written here is shown until Dany has read
 * it: the review is stored unpublished, she gets an e-mail, and publishing is
 * one click under Reviews in the dashboard. The browser cannot write the
 * review itself — the database only lets signed-in accounts create reviews —
 * so it comes through here, where the Admin SDK writes it.
 *
 * The name as typed and the e-mail address go to Dany in the notification
 * and nowhere else. The database lets anyone read a published review in
 * full, so whatever is stored with it is public: only the name as shown
 * ("Sarah M."), the town, the service and the words.
 *
 * Two cheap filters keep most bots out without bothering people: a field
 * hidden from sight that only a bot fills in, and a form sent less than two
 * seconds after it was opened. Both get a polite "thank you" and are
 * dropped, so the bot learns nothing. Neither may ever catch a person: the
 * trap has a name no browser's autofill recognises, and the time is measured
 * on the visitor's own device — comparing their clock with this server's
 * would drop every review from a phone whose clock runs fast.
 */

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (statusCode: number, body: Record<string, unknown>) => ({ statusCode, headers: HEADERS, body: JSON.stringify(body) });

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

/** Plain text only: no markup, no control characters, no runs of blank lines. */
function clean(value: unknown, max: number): string {
  return String(value ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);
}

/** "sarah   miller" -> "Sarah M." — a first name and an initial is all the site shows. */
export function displayName(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);
  const first = cap(parts[0]);
  return parts.length > 1 ? `${first} ${parts[parts.length - 1].charAt(0).toUpperCase()}.` : first;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: HEADERS, body: '' };
  // Any POST is a submission: this function does nothing else, and a check on
  // the path would be one more way for a real review to be turned away.
  if (event.httpMethod !== 'POST') {
    return json(404, { ok: false, error: 'Not found' });
  }

  let input: any;
  try {
    input = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { ok: false, error: 'Invalid request.' });
  }

  // Bots: thanked and forgotten.
  const elapsed = Number(input.elapsedMs);
  if (clean(input.dcp_trap, 200) || (Number.isFinite(elapsed) && elapsed >= 0 && elapsed < 2000)) {
    console.warn('[reviews] dropped a submission that looked automated');
    return json(200, { ok: true });
  }

  const name = clean(input.name, 60);
  const city = clean(input.city, 60);
  const service = clean(input.service, 60);
  const comment = clean(input.comment, 1000);
  const email = clean(input.email, 120).toLowerCase();
  const rating = Math.round(Number(input.rating));

  if (name.length < 2) return json(400, { ok: false, error: 'Please tell us your name.' });
  if (!(rating >= 1 && rating <= 5)) return json(400, { ok: false, error: 'Please choose a rating from 1 to 5 stars.' });
  if (comment.length < 20) return json(400, { ok: false, error: 'Please write a few more words about your cleaning.' });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json(400, { ok: false, error: 'That e-mail address does not look right.' });
  if (input.consent !== true) return json(400, { ok: false, error: 'Please agree to your review being shown on the site.' });

  if (!initAdmin()) {
    console.error('[reviews] Firebase Admin credentials missing — review not stored');
    return json(503, { ok: false, error: 'We could not send your review right now. Please try again later.' });
  }

  const date = new Date().toLocaleDateString('en-CA', { timeZone: process.env.BUSINESS_TIMEZONE || 'America/New_York' });
  const review = {
    author: displayName(name),
    rating,
    comment,
    date,
    city,
    service,
    source: 'website',
    isPublished: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  let id = '';
  try {
    const ref = await within(() => firestore().collection('reviews').add(review), 5000, 'review write');
    id = ref.id;
  } catch (err: any) {
    console.error('[reviews] REVIEW NOT STORED:', err?.message || err);
    return json(503, { ok: false, error: 'We could not send your review right now. Please try again later.' });
  }

  // Dany hears about it straight away. A mail failure is logged, not shown:
  // the review is safely stored and waiting in the dashboard either way.
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
  const where = [city, service].filter(Boolean).join(' · ');
  const panel = 'https://danycleanpro.com/admin/dashboard/reviews';
  const mail = await within(() => sendMail({
    subject: `New review from ${review.author} (${rating}/5) — waiting for you to publish`,
    replyTo: email || undefined,
    html: `<div style="font:15px/1.6 Helvetica,Arial,sans-serif;color:#334155;max-width:560px">
      <p style="margin:0 0 4px;font-size:18px;color:#0f172a"><strong>${esc(name)}</strong> left a review</p>
      <p style="margin:0 0 16px;color:#f59e0b;font-size:18px;letter-spacing:2px">${stars}</p>
      ${where ? `<p style="margin:0 0 12px;color:#64748b">${esc(where)}</p>` : ''}
      <p style="margin:0 0 20px;padding:16px;background:#f8fafc;border-left:3px solid #2563eb;white-space:pre-line">${esc(comment)}</p>
      ${email ? `<p style="margin:0 0 20px;color:#64748b">E-mail: ${esc(email)}</p>` : ''}
      <p style="margin:0 0 8px">It is not on the site yet. To publish it, open Reviews in the dashboard and press the eye.</p>
      <p><a href="${panel}" style="color:#2563eb">${panel}</a></p>
    </div>`,
    text: `${name} left a review: ${rating}/5\n${where ? where + '\n' : ''}\n${comment}\n\n${email ? `E-mail: ${email}\n\n` : ''}`
      + `It is not on the site yet. To publish it, open Reviews in the dashboard:\n${panel}`,
  }), 3000, 'review e-mail').catch((err: any) => ({ sent: false, error: String(err?.message || err) }));

  if (!mail.sent) console.error('[reviews] review stored but NOT e-mailed:', id, '|', (mail as any).error);
  console.log('[reviews] stored', id, '| rating', rating, '| e-mailed:', mail.sent);
  return json(200, { ok: true });
};
