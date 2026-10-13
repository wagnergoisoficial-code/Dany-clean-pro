/**
 * The database, reached through the server instead of from the browser.
 *
 * Every panel in the dashboard used to open its own connection to Firestore
 * and was answered by the security rules, which are edited in a console this
 * repository does not control. When those rules and this code disagree the
 * symptom is a dashboard full of empty panels, and the cause is invisible from
 * here. That is the problem this file ends: the Admin SDK is not subject to
 * rules, so the rules can stay shut and nothing in the browser depends on them.
 *
 * Permission is decided here rather than there:
 *
 *   read   'public'  anyone, because the marketing site needs it
 *          'admin'   a Bearer ID token held by someone in `admins`
 *   write  'admin'   always, with one exception below
 *
 * `leads` may be created by anyone — that is the quote form — but only an
 * administrator can read, change or delete one.
 */
import { Handler } from '@netlify/functions';
import admin from 'firebase-admin';
import { firestore } from './shared/firestore';
import { initAdmin, callerFrom, isAdminUid } from './shared/adminAuth';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Cache-Control': 'no-store',
};
const json = (statusCode: number, body: any) => ({ statusCode, headers, body: JSON.stringify(body) });

type Access = 'public' | 'admin';

interface Rule {
  read: Access;
  create: Access;
  modify: Access;
  /** Narrows a public listing, so an unpublished review stays unpublished. */
  publicFilter?: (doc: any) => boolean;
  /** Fields a public caller may send, so a create cannot smuggle in a status. */
  publicFields?: string[];
}

const COLLECTIONS: Record<string, Rule> = {
  settings:     { read: 'public', create: 'admin',  modify: 'admin' },
  gallery:      { read: 'public', create: 'admin',  modify: 'admin' },
  reviews:      { read: 'public', create: 'admin',  modify: 'admin',
                  publicFilter: d => d.isPublished === true || d.is_published === true },
  leads:        { read: 'admin',  create: 'public', modify: 'admin',
                  publicFields: ['name', 'email', 'phone', 'city', 'address', 'zip_code',
                                 'service_type', 'bedrooms', 'bathrooms', 'preferred_date',
                                 'preferred_time', 'message', 'sms_consent', 'source',
                                 'utm_source', 'utm_medium', 'utm_campaign'] },
  customers:    { read: 'admin',  create: 'admin',  modify: 'admin' },
  appointments: { read: 'admin',  create: 'admin',  modify: 'admin' },
};

/** Timestamps arrive as objects; the browser wants something it can parse. */
function plain(doc: FirebaseFirestore.DocumentSnapshot): any {
  const out: any = { id: doc.id };
  const data = doc.data() || {};
  for (const [key, value] of Object.entries(data)) {
    out[key] = value instanceof admin.firestore.Timestamp ? value.toDate().toISOString() : value;
  }
  return out;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (!initAdmin()) return json(503, { error: 'database not configured' });

  // /api/data/<collection>/<id?>
  const parts = (event.path || '').split('/').filter(Boolean);
  const at = parts.indexOf('data');
  const name = at >= 0 ? (parts[at + 1] || '') : '';
  const id = at >= 0 ? (parts[at + 2] || '') : '';

  const rule = COLLECTIONS[name];
  if (!rule) return json(404, { error: `unknown collection: ${name || '(none)'}` });

  const caller = await callerFrom(event.headers.authorization || event.headers.Authorization);
  const isAdmin = caller ? await isAdminUid(caller.uid) : false;
  const allowed = (need: Access) => need === 'public' || isAdmin;

  const db = firestore();
  const col = db.collection(name);

  try {
    /* ------------------------------------------------------------- read */
    if (event.httpMethod === 'GET') {
      if (!allowed(rule.read)) return json(401, { error: 'unauthorized' });

      if (id) {
        const snap = await col.doc(id).get();
        if (!snap.exists) return json(404, { error: 'not found' });
        const one = plain(snap);
        if (!isAdmin && rule.publicFilter && !rule.publicFilter(one)) {
          return json(404, { error: 'not found' });
        }
        return json(200, { doc: one });
      }

      const q = event.queryStringParameters || {};
      const max = Math.min(Number(q.limit) || 200, 500);
      let query: FirebaseFirestore.Query = col;
      if (q.orderBy) query = query.orderBy(q.orderBy, q.desc === 'true' ? 'desc' : 'asc');
      if (q.where && q.equals !== undefined) query = query.where(q.where, '==', q.equals);

      let docs = (await query.limit(max).get()).docs.map(plain);
      if (!isAdmin && rule.publicFilter) docs = docs.filter(rule.publicFilter);
      return json(200, { docs });
    }

    /* ----------------------------------------------------------- create */
    if (event.httpMethod === 'POST') {
      if (!allowed(rule.create)) return json(401, { error: 'unauthorized' });

      let body: any = {};
      try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'invalid JSON' }); }

      // An anonymous caller gets the fields the form is for and nothing else.
      let payload = body;
      if (!isAdmin && rule.publicFields) {
        payload = Object.fromEntries(
          Object.entries(body).filter(([key]) => rule.publicFields!.includes(key)),
        );
        if (name === 'leads') payload.status = 'new';
      }

      payload.createdAt = admin.firestore.FieldValue.serverTimestamp();
      const ref = id ? col.doc(id) : col.doc();
      await ref.set(payload, { merge: !!id });
      return json(201, { id: ref.id });
    }

    /* ----------------------------------------------------------- update */
    if (event.httpMethod === 'PATCH') {
      if (!allowed(rule.modify)) return json(401, { error: 'unauthorized' });
      if (!id) return json(400, { error: 'id required' });

      let body: any = {};
      try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'invalid JSON' }); }
      body.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      await col.doc(id).set(body, { merge: true });
      return json(200, { ok: true, id });
    }

    /* ----------------------------------------------------------- delete */
    if (event.httpMethod === 'DELETE') {
      if (!allowed(rule.modify)) return json(401, { error: 'unauthorized' });
      if (!id) return json(400, { error: 'id required' });
      await col.doc(id).delete();
      return json(200, { ok: true, deleted: id });
    }

    return json(405, { error: 'Method Not Allowed' });
  } catch (err: any) {
    console.error('[data]', name, event.httpMethod, '->', err?.message || err);
    return json(500, { error: err?.message || 'database error' });
  }
};
