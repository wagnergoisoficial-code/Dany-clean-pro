/**
 * Lead e-mail notification.
 *
 * Every request that reaches the CRM — the site form writing straight to
 * Firestore, the API fallback, and the chat/SMS assistant — funnels through
 * `sendLeadEmail` so the inbox always mirrors the dashboard.
 *
 * Provider is chosen by whichever key is present, so no extra dependency is
 * needed (both are plain HTTPS calls):
 *   RESEND_API_KEY    -> https://resend.com   (recommended)
 *   SENDGRID_API_KEY  -> https://sendgrid.com
 *
 * Related env vars:
 *   LEAD_NOTIFY_TO    comma separated recipients (default danycleanenpro@gmail.com)
 *   LEAD_NOTIFY_FROM  verified sender (default onboarding@resend.dev, test only)
 */

export interface LeadEmailPayload {
  name?: string;
  phone?: string;
  email?: string;
  city?: string;
  address?: string;
  zip_code?: string;
  service_type?: string;
  bedrooms?: number | string | null;
  bathrooms?: number | string | null;
  preferred_date?: string;
  preferred_time?: string;
  message?: string;
  sms_consent?: boolean | string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  attribution_channel?: string;
  source?: string;
  leadId?: string | number | null;
}

const DEFAULT_TO = 'danycleanenpro@gmail.com';
const DEFAULT_FROM = 'Dany Clean Pro <onboarding@resend.dev>';

const esc = (val: unknown): string =>
  String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const present = (val: unknown): boolean =>
  val !== undefined && val !== null && String(val).trim() !== '';

function rows(lead: LeadEmailPayload): Array<[string, string]> {
  const size = [
    present(lead.bedrooms) ? `${lead.bedrooms} bedroom(s)` : '',
    present(lead.bathrooms) ? `${lead.bathrooms} bathroom(s)` : '',
  ].filter(Boolean).join(' · ');

  const schedule = [lead.preferred_date, lead.preferred_time].filter(present).join(' · ');

  const attribution = [
    present(lead.attribution_channel) ? lead.attribution_channel : '',
    present(lead.utm_source) ? `source: ${lead.utm_source}` : '',
    present(lead.utm_medium) ? `medium: ${lead.utm_medium}` : '',
    present(lead.utm_campaign) ? `campaign: ${lead.utm_campaign}` : '',
  ].filter(Boolean).join(' · ');

  const all: Array<[string, string]> = [
    ['Name', String(lead.name ?? '')],
    ['Phone', String(lead.phone ?? '')],
    ['Email', String(lead.email ?? '')],
    ['City', String(lead.city ?? '')],
    ['Address', String(lead.address ?? '')],
    ['Zip code', String(lead.zip_code ?? '')],
    ['Service', String(lead.service_type ?? '')],
    ['Home size', size],
    ['Preferred schedule', schedule],
    ['Notes', String(lead.message ?? '')],
    ['SMS consent', lead.sms_consent === undefined ? '' : (lead.sms_consent ? 'Yes' : 'No')],
    ['Attribution', attribution],
    ['Captured via', String(lead.source ?? '')],
    ['Lead ID', lead.leadId == null ? '' : String(lead.leadId)],
  ];
  return all.filter(([, value]) => present(value));
}

export function buildLeadEmail(lead: LeadEmailPayload) {
  const name = present(lead.name) ? String(lead.name) : 'New client';
  const where = present(lead.city) ? ` · ${lead.city}` : '';
  const subject = `New cleaning request — ${name}${where}`;

  const body = rows(lead);

  const text = [
    'NEW CLEANING REQUEST',
    '',
    ...body.map(([label, value]) => `${label}: ${value}`),
    '',
    'Open the dashboard: https://danycleanpro.com/admin/dashboard/leads',
  ].join('\n');

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f8fafc;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;">
        <tr><td style="background:#0f172a;padding:28px 32px;">
          <div style="font:700 10px/14px Helvetica,Arial,sans-serif;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.6);">
            Dany Clean Pro · New request
          </div>
          <div style="font:400 28px/36px Georgia,'Times New Roman',serif;color:#ffffff;margin-top:8px;">
            ${esc(name)}
          </div>
        </td></tr>
        <tr><td style="padding:8px 32px 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${body.map(([label, value]) => `
            <tr>
              <td style="padding:14px 0;border-bottom:1px solid #e2e8f0;vertical-align:top;width:40%;">
                <span style="font:700 10px/14px Helvetica,Arial,sans-serif;letter-spacing:0.16em;text-transform:uppercase;color:#2563eb;">${esc(label)}</span>
              </td>
              <td style="padding:14px 0;border-bottom:1px solid #e2e8f0;vertical-align:top;">
                <span style="font:400 15px/24px Helvetica,Arial,sans-serif;color:#0f172a;">${esc(value).replace(/\n/g, '<br>')}</span>
              </td>
            </tr>`).join('')}
          </table>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:28px;">
            <tr><td style="background:#2563eb;">
              <a href="https://danycleanpro.com/admin/dashboard/leads"
                 style="display:inline-block;padding:14px 28px;font:700 12px/16px Helvetica,Arial,sans-serif;letter-spacing:0.12em;text-transform:uppercase;color:#ffffff;text-decoration:none;">
                Open in dashboard
              </a>
            </td></tr>
          </table>
        </td></tr>
      </table>
      <div style="max-width:560px;margin-top:16px;font:400 13px/20px Helvetica,Arial,sans-serif;color:#475569;">
        Sent automatically when a request is submitted on danycleanpro.com.
      </div>
    </td></tr>
  </table>
</body></html>`;

  return { subject, html, text };
}

export async function sendLeadEmail(lead: LeadEmailPayload): Promise<{ sent: boolean; provider?: string; error?: string }> {
  const to = (process.env.LEAD_NOTIFY_TO || DEFAULT_TO).split(',').map(s => s.trim()).filter(Boolean);
  const from = process.env.LEAD_NOTIFY_FROM || DEFAULT_FROM;
  const { subject, html, text } = buildLeadEmail(lead);
  const replyTo = present(lead.email) ? String(lead.email) : undefined;

  const resendKey = process.env.RESEND_API_KEY;
  const sendgridKey = process.env.SENDGRID_API_KEY;

  if (!resendKey && !sendgridKey) {
    console.warn('[leadEmail] no RESEND_API_KEY or SENDGRID_API_KEY set — skipping notification');
    return { sent: false, error: 'no provider configured' };
  }

  try {
    if (resendKey) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to, subject, html, text, ...(replyTo ? { reply_to: replyTo } : {}) }),
      });
      if (!res.ok) {
        const detail = await res.text();
        console.error('[leadEmail] resend failed:', res.status, detail);
        return { sent: false, provider: 'resend', error: `${res.status} ${detail}` };
      }
      console.log('[leadEmail] sent via resend to', to.join(', '));
      return { sent: true, provider: 'resend' };
    }

    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${sendgridKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: to.map(email => ({ email })) }],
        from: { email: from.replace(/^.*<|>$/g, '') || from, name: 'Dany Clean Pro' },
        ...(replyTo ? { reply_to: { email: replyTo } } : {}),
        subject,
        content: [{ type: 'text/plain', value: text }, { type: 'text/html', value: html }],
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      console.error('[leadEmail] sendgrid failed:', res.status, detail);
      return { sent: false, provider: 'sendgrid', error: `${res.status} ${detail}` };
    }
    console.log('[leadEmail] sent via sendgrid to', to.join(', '));
    return { sent: true, provider: 'sendgrid' };
  } catch (err: any) {
    console.error('[leadEmail] send threw:', err?.message || err);
    return { sent: false, error: err?.message || 'unknown error' };
  }
}
