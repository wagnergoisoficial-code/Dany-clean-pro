/**
 * Is the backend up?
 *
 * The login page shows a status dot and asks this. There was no such endpoint,
 * so the request fell through to the SPA, came back as HTML, and the dot sat
 * red saying the system was offline while everything worked — the first thing
 * anyone saw on the login screen was a false alarm.
 *
 * Deliberately cheap: no database, no mail, no credentials. Those belong in
 * /api/diagnostics, which is allowed to be slow. This one only answers whether
 * functions are running at all, so it stays fast enough to ask on page load.
 */
import { Handler } from '@netlify/functions';

export const handler: Handler = async () => ({
  statusCode: 200,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
  },
  body: JSON.stringify({ ok: true, time: new Date().toISOString() }),
});
