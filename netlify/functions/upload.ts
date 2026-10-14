/**
 * Gallery uploads, done by the server.
 *
 * The browser used to write to Firebase Storage itself, which meant the
 * Storage rules decided — rules edited in a console this repository does not
 * control, and which spent today refusing a genuine administrator with
 * `storage/unauthorized`. The Admin SDK is not subject to them, so the rules
 * can say whatever they say and this keeps working.
 *
 * Permission is checked here instead: a Bearer ID token belonging to someone
 * holding admins/{uid}. That is the same question /api/admin-session answers
 * and the same record Team Access writes, so there is one answer, not three.
 *
 * The file comes as a data URL because that is what the compressor in the
 * browser already produces, and it is returned as the download URL the gallery
 * stores. A Netlify request body tops out around 6 MB and base64 adds a third,
 * so the client compresses to 1200px first — the limit is enforced here too
 * rather than trusted.
 */
import { Handler } from '@netlify/functions';
import crypto from 'crypto';
import admin from 'firebase-admin';
import { initAdmin, callerFrom, isAdminUid } from './shared/adminAuth';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (statusCode: number, body: any) => ({ statusCode, headers, body: JSON.stringify(body) });

const MAX_BYTES = 4 * 1024 * 1024;
const TYPES: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
};

function bucketName(): string {
  return process.env.FIREBASE_STORAGE_BUCKET
    || process.env.VITE_FIREBASE_STORAGE_BUCKET
    || `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });
  if (!initAdmin()) return json(503, { error: 'storage not configured' });

  const caller = await callerFrom(event.headers.authorization || event.headers.Authorization);
  if (!caller || !(await isAdminUid(caller.uid))) return json(401, { error: 'unauthorized' });

  let body: any = {};
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'invalid JSON' }); }

  const dataUrl = String(body.dataUrl || '');
  const match = dataUrl.match(/^data:([^;,]+);base64,(.+)$/);
  if (!match) return json(400, { error: 'send the image as a base64 data URL' });

  const [, mime, encoded] = match;
  const extension = TYPES[mime.toLowerCase()];
  if (!extension) return json(400, { error: `unsupported image type: ${mime}` });

  const bytes = Buffer.from(encoded, 'base64');
  if (bytes.length === 0) return json(400, { error: 'the image is empty' });
  if (bytes.length > MAX_BYTES) {
    return json(413, { error: `a imagem tem ${(bytes.length / 1048576).toFixed(1)} MB; o maximo e 4 MB` });
  }

  // Keep the caller's name for recognisability, but never let it decide where
  // the file lands: slashes and dots would climb out of the folder.
  const folder = String(body.folder || 'gallery').replace(/[^a-zA-Z0-9/_-]/g, '').replace(/\/+/g, '/');
  const stem = String(body.name || 'photo').replace(/\.[^.]*$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60) || 'photo';
  const path = `${folder}/${Date.now()}-${stem}.${extension}`;

  try {
    const bucket = admin.storage().bucket(bucketName());
    const file = bucket.file(path);

    // A download token, the same shape the web SDK gives its URLs. It works
    // whether or not the bucket allows per-object ACLs, which makePublic does
    // not — uniform bucket-level access makes that call throw.
    const token = crypto.randomUUID();
    await file.save(bytes, {
      resumable: false,
      contentType: mime,
      metadata: { cacheControl: 'public, max-age=31536000, immutable',
                  metadata: { firebaseStorageDownloadTokens: token } },
    });

    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}`
      + `/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
    console.log('[upload]', path, `${(bytes.length / 1024).toFixed(0)}KB`, 'by', caller.email);
    return json(201, { url, path, bytes: bytes.length });
  } catch (err: any) {
    console.error('[upload] failed:', err?.message || err);
    return json(500, { error: err?.message || 'upload failed' });
  }
};
