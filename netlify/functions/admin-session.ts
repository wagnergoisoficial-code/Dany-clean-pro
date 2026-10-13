/**
 * "Is the person holding this token an administrator?"
 *
 * The browser used to answer this itself by reading admins/{uid} out of
 * Firestore. That only works when the security rules let it, and the rules
 * deployed on this project do not — so a genuine administrator was told they
 * had no permission, with the proof sitting in a document they were not
 * allowed to look at.
 *
 * The Admin SDK is not subject to those rules, so the server can answer where
 * the browser cannot. It is also the better place for the question: the client
 * now receives a verdict it cannot forge rather than evidence it must weigh.
 */
import { Handler } from '@netlify/functions';
import { initAdmin, callerFrom, isAdminUid } from './shared/adminAuth';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  // A verdict about the person asking must never be served from a shared cache.
  'Cache-Control': 'no-store',
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (!initAdmin()) {
    return { statusCode: 503, headers, body: JSON.stringify({ admin: false, error: 'firebase not configured' }) };
  }

  const caller = await callerFrom(event.headers.authorization || event.headers.Authorization);
  if (!caller) {
    // Not signed in, or the token is expired or forged. Answering 200 with
    // admin:false keeps the browser on one code path for "no".
    return { statusCode: 200, headers, body: JSON.stringify({ admin: false, reason: 'no valid token' }) };
  }

  let admin = false;
  let reason = '';
  try {
    admin = await isAdminUid(caller.uid);
    if (!admin) reason = 'no admins/{uid} record';
  } catch (err: any) {
    // A database that cannot be reached is not permission to enter, but the
    // difference matters when someone is trying to work out why they are out.
    console.error('[admin-session] lookup failed:', err?.message || err);
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({ admin: false, error: 'could not reach the database' }),
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ admin, uid: caller.uid, email: caller.email, ...(reason ? { reason } : {}) }),
  };
};
