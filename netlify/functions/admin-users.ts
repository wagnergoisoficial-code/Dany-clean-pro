/**
 * Administrator accounts: create, list, remove.
 *
 *   GET    /api/admin-users             list the administrators
 *   POST   /api/admin-users             create one
 *   DELETE /api/admin-users?uid=...     take the privilege away
 *
 * Creating an account is never a public act. A caller gets in one of two ways:
 *
 *   - a Bearer ID token belonging to someone who already holds admins/{uid}
 *   - the setup key, and only while the site has no administrators at all
 *
 * The second exists because the first cannot bootstrap itself, and it closes
 * the moment it is used: once one administrator exists, the key stops working
 * and the only way to add people is to already be one.
 */
import { Handler } from '@netlify/functions';
import admin from 'firebase-admin';
import { firestore } from './shared/firestore';
import { initAdmin, callerFrom, isAdminUid, noAdminsYet, secretMatches } from './shared/adminAuth';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Setup-Key',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
};

const json = (statusCode: number, body: any) => ({ statusCode, headers, body: JSON.stringify(body) });

/** A password worth accepting. Length does more for this than punctuation does. */
function passwordComplaint(password: string): string | null {
  if (password.length < 10) return 'A senha precisa de pelo menos 10 caracteres.';
  if (/^\d+$/.test(password)) return 'A senha nao pode ser so numeros.';
  if (/^(.)\1+$/.test(password)) return 'A senha nao pode ser um caractere repetido.';
  return null;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (!initAdmin()) return json(503, { error: 'Firebase nao configurado no servidor.' });

  const db = firestore();

  // Who is asking, and are they allowed to ask it.
  const caller = await callerFrom(event.headers.authorization || event.headers.Authorization);
  const callerIsAdmin = caller ? await isAdminUid(caller.uid) : false;

  /* ---------------------------------------------------------------- list */
  if (event.httpMethod === 'GET') {
    if (!callerIsAdmin) return json(401, { error: 'unauthorized' });
    const snap = await db.collection('admins').orderBy('createdAt', 'asc').get();
    return json(200, {
      admins: snap.docs.map(d => ({
        uid: d.id,
        email: d.get('email') || '',
        name: d.get('name') || '',
        createdAt: d.get('createdAt')?.toDate?.()?.toISOString() || null,
        createdBy: d.get('createdBy') || '',
      })),
      you: caller?.uid || null,
    });
  }

  /* -------------------------------------------------------------- create */
  if (event.httpMethod === 'POST') {
    let body: any = {};
    try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'JSON invalido' }); }

    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const name = String(body.name || '').trim();

    if (!EMAIL.test(email)) return json(400, { error: 'Escreva um e-mail valido.' });
    const weak = passwordComplaint(password);
    if (weak) return json(400, { error: weak });

    // Either an administrator is doing this, or the site has none and whoever
    // is holding the setup key gets to create the first one.
    const givenKey = String(event.headers['x-setup-key'] || '').trim();
    const expectedKey = String(process.env.ADMIN_SETUP_KEY || '');
    let grantedBy = '';

    if (callerIsAdmin) {
      grantedBy = caller!.email || caller!.uid;
    } else if (expectedKey && secretMatches(givenKey, expectedKey) && await noAdminsYet()) {
      grantedBy = 'setup key';
    } else if (givenKey && expectedKey && secretMatches(givenKey, expectedKey)) {
      // Right key, wrong moment. Say which, because "unauthorized" would send
      // someone hunting for a typo in a key that is perfectly correct.
      return json(409, { error: 'Ja existe um administrador. A chave de setup nao serve mais — entre com uma conta de admin para criar outras.' });
    } else {
      return json(401, { error: 'unauthorized' });
    }

    // Reuse the Auth account when it already exists, so a half-finished setup
    // can be completed instead of dead-ending on "e-mail already in use".
    let uid: string;
    try {
      const created = await admin.auth().createUser({
        email, password, displayName: name || undefined, emailVerified: false,
      });
      uid = created.uid;
    } catch (err: any) {
      if (err?.code === 'auth/email-already-exists') {
        const existing = await admin.auth().getUserByEmail(email);
        uid = existing.uid;
        await admin.auth().updateUser(uid, { password, ...(name ? { displayName: name } : {}) });
      } else if (err?.code === 'auth/invalid-password') {
        return json(400, { error: 'O Firebase recusou essa senha. Use pelo menos 10 caracteres.' });
      } else {
        console.error('[admin-users] createUser failed:', err?.code, err?.message);
        return json(500, { error: err?.message || 'Nao foi possivel criar a conta.' });
      }
    }

    await db.collection('admins').doc(uid).set({
      email,
      name: name || email,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: grantedBy,
    }, { merge: true });

    console.log('[admin-users] granted admin to', email, '| by:', grantedBy);
    return json(201, { ok: true, uid, email, bootstrapped: grantedBy === 'setup key' });
  }

  /* -------------------------------------------------------------- remove */
  if (event.httpMethod === 'DELETE') {
    if (!callerIsAdmin) return json(401, { error: 'unauthorized' });

    const uid = String((event.queryStringParameters || {}).uid || '').trim();
    if (!uid) return json(400, { error: 'uid obrigatorio' });
    if (uid === caller!.uid) return json(400, { error: 'Voce nao pode remover o seu proprio acesso.' });

    // Never leave the dashboard with nobody who can open it.
    const all = await db.collection('admins').limit(2).get();
    if (all.size <= 1) return json(400, { error: 'Este e o unico administrador. Crie outro antes de remover este.' });

    await db.collection('admins').doc(uid).delete();
    // The login still exists; it simply is not an administrator any more.
    // Deleting the account outright would be a surprise for a shared address.
    console.log('[admin-users] revoked admin for', uid, '| by:', caller!.email);
    return json(200, { ok: true, revoked: uid });
  }

  return json(405, { error: 'Method Not Allowed' });
};
