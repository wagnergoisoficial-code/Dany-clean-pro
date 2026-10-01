/**
 * Client-facing e-mails.
 *
 * The notification in leadEmail.ts is written for the owner's inbox; these are
 * written for the person who asked for a cleaning. Same editorial system as the
 * site so the thread looks like it comes from the same business.
 *
 * Every message carries an opt-out line: a request for a quote is transactional,
 * but the follow-ups that come later are not, and people must be able to stop them.
 */
import { sendMail, MailMessage } from './leadEmail';

const SITE = 'https://danycleanpro.com';
const PHONE = '(218) 357-5938';
const INBOX = 'danycleanenpro@gmail.com';

export type ClientEmailKind = 'confirmation' | 'quote_followup' | 'review_request' | 'winback';

const esc = (val: unknown): string =>
  String(val ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function shell(opts: {
  eyebrow: string;
  heading: string;
  body: string[];
  cta?: { label: string; href: string };
  footnote: string;
}): string {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f8fafc;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;">
        <tr><td style="background:#0f172a;padding:28px 32px;">
          <div style="font:700 10px/14px Helvetica,Arial,sans-serif;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.6);">
            Dany Clean Pro · ${esc(opts.eyebrow)}
          </div>
          <div style="font:400 28px/36px Georgia,'Times New Roman',serif;color:#ffffff;margin-top:8px;">
            ${esc(opts.heading)}
          </div>
        </td></tr>
        <tr><td style="padding:28px 32px;">
          ${opts.body.map(p => `<p style="margin:0 0 16px;font:400 15px/24px Helvetica,Arial,sans-serif;color:#334155;">${p}</p>`).join('')}
          ${opts.cta ? `
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:20px;">
            <tr><td style="background:#2563eb;">
              <a href="${esc(opts.cta.href)}" style="display:inline-block;padding:14px 28px;font:700 12px/16px Helvetica,Arial,sans-serif;letter-spacing:0.12em;text-transform:uppercase;color:#ffffff;text-decoration:none;">
                ${esc(opts.cta.label)}
              </a>
            </td></tr>
          </table>` : ''}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;border-top:1px solid #e2e8f0;">
            <tr><td style="padding-top:20px;">
              <div style="font:700 10px/14px Helvetica,Arial,sans-serif;letter-spacing:0.16em;text-transform:uppercase;color:#2563eb;">Talk to us directly</div>
              <div style="font:400 15px/24px Helvetica,Arial,sans-serif;color:#0f172a;margin-top:6px;">
                Call or text ${PHONE}<br>${INBOX}
              </div>
            </td></tr>
          </table>
        </td></tr>
      </table>
      <div style="max-width:560px;margin-top:16px;font:400 12px/18px Helvetica,Arial,sans-serif;color:#64748b;text-align:center;">
        ${esc(opts.footnote)}
      </div>
    </td></tr>
  </table>
</body></html>`;
}

const optOut = `Don't want these follow-ups? Reply with "stop" and we won't send any more.`;

export function buildClientEmail(kind: ClientEmailKind, lead: Record<string, any>): MailMessage {
  const first = String(lead.name || '').trim().split(/\s+/)[0] || 'there';
  const service = String(lead.service_type || '').trim();
  const serviceLine = service ? ` for your ${service.toLowerCase()}` : '';

  switch (kind) {
    case 'confirmation':
      return {
        subject: 'We got your cleaning request — Dany Clean Pro',
        html: shell({
          eyebrow: 'Request received',
          heading: `Thanks, ${first}`,
          body: [
            `We've received your request${esc(serviceLine)} and it's with our scheduling desk now.`,
            `<strong>What happens next:</strong> we'll call or text you within a few hours to confirm the details, go over anything specific about your home, and give you your price. No payment is needed to get the estimate.`,
            `If you need us sooner, just call or text — that reaches us fastest.`,
          ],
          footnote: 'You received this because you requested a cleaning estimate on danycleanpro.com.',
        }),
        text: [
          `Thanks, ${first} —`,
          '',
          `We've received your request${serviceLine} and it's with our scheduling desk.`,
          `We'll call or text within a few hours to confirm details and give you your price.`,
          `No payment is needed to get the estimate.`,
          '',
          `Call or text ${PHONE} · ${INBOX}`,
        ].join('\n'),
      };

    case 'quote_followup':
      return {
        subject: `Still planning that cleaning, ${first}?`,
        html: shell({
          eyebrow: 'Following up',
          heading: 'Still interested?',
          body: [
            `We reached out about your ${esc(service ? service.toLowerCase() : 'cleaning')} and haven't heard back — no problem at all, we know how weeks get.`,
            `If the timing wasn't right, tell us roughly when it would be and we'll hold a slot. If something about the estimate didn't work, say so plainly and we'll see what we can do.`,
            `And if you've sorted it elsewhere, just reply "all set" and we'll close it out.`,
          ],
          cta: { label: 'Pick a new date', href: `${SITE}/#quote` },
          footnote: optOut,
        }),
        text: [
          `Hi ${first},`,
          '',
          `We reached out about your ${service ? service.toLowerCase() : 'cleaning'} and haven't heard back.`,
          `If the timing wasn't right, tell us when works and we'll hold a slot.`,
          `If you've sorted it elsewhere, reply "all set" and we'll close it out.`,
          '',
          `Call or text ${PHONE} · ${SITE}/#quote`,
          '',
          optOut,
        ].join('\n'),
      };

    case 'review_request':
      return {
        subject: 'How did we do?',
        html: shell({
          eyebrow: 'Your visit',
          heading: `How did we do, ${first}?`,
          body: [
            `Thank you for having us in your home. We'd love to know how it went.`,
            `If anything wasn't right, tell us first — we'll come back and re-clean it at no charge. That guarantee is real and we'd rather fix it than have you live with it.`,
            `And if you were happy, a few words from you helps other families in Connecticut find us.`,
          ],
          cta: { label: 'Leave a review', href: `${SITE}/#reviews` },
          footnote: optOut,
        }),
        text: [
          `Hi ${first},`,
          '',
          `Thank you for having us in your home — how did it go?`,
          `If anything wasn't right, tell us first and we'll come back and re-clean at no charge.`,
          `If you were happy, a few words helps other families find us: ${SITE}/#reviews`,
          '',
          optOut,
        ].join('\n'),
      };

    case 'winback':
      return {
        subject: 'Time for another clean?',
        html: shell({
          eyebrow: 'We miss you',
          heading: `It's been a while, ${first}`,
          body: [
            `It's been some time since we last cleaned for you, and we'd love to have you back on the schedule.`,
            `If you'd like to start up again — one-off or on a regular rhythm — just reply to this e-mail or text us, and we'll find a time that fits.`,
          ],
          cta: { label: 'Book another clean', href: `${SITE}/#quote` },
          footnote: optOut,
        }),
        text: [
          `Hi ${first},`,
          '',
          `It's been a while since we last cleaned for you — we'd love to have you back.`,
          `Reply here or text ${PHONE} and we'll find a time that fits.`,
          '',
          optOut,
        ].join('\n'),
      };
  }
}

export async function sendClientEmail(kind: ClientEmailKind, lead: Record<string, any>) {
  const to = String(lead.email || '').trim();
  if (!to || !to.includes('@')) return { sent: false, error: 'lead has no e-mail address' };
  return sendMail({ to: [to], replyTo: INBOX, ...buildClientEmail(kind, lead) });
}
