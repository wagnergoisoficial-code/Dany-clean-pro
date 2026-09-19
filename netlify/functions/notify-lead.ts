import { Handler } from '@netlify/functions';
import { sendLeadEmail, LeadEmailPayload } from './shared/leadEmail';

/**
 * Notification endpoint for leads the browser wrote straight to Firestore.
 * The form takes that path whenever Firebase is ready, so without this call
 * those requests would never reach the inbox.
 */
export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
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

  const result = await sendLeadEmail(lead);
  // A failed notification must never look like a failed booking to the client.
  return { statusCode: 200, headers, body: JSON.stringify(result) };
};
