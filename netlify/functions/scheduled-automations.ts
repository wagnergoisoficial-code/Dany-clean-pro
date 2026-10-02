import { schedule } from '@netlify/functions';
import admin from 'firebase-admin';
import { sendClientEmail, ClientEmailKind } from './shared/clientEmail';
import { sendMail } from './shared/leadEmail';
import { firestore, databaseLabel } from './shared/firestore';

/**
 * Hourly sweep over the leads.
 *
 * Everything else in this app only runs when someone does something — opens the
 * site, submits the form, calls. This is the one piece that wakes up on its own
 * and asks "is anything overdue?".
 *
 * Design rules, in order of importance:
 *  1. Never send the same thing twice — each lead records what was sent in
 *     `automation_log`, and the rule is skipped if it is already there.
 *  2. Always have a stop condition — a lead that moved on, opted out or has no
 *     e-mail is skipped. Chasing someone who already booked is worse than
 *     sending nothing.
 *  3. Never act on history — on first run, leads older than LOOKBACK_DAYS are
 *     ignored, so switching this on does not mail a year of old records.
 *  4. Stay off by default — AUTOMATION_ENABLED must be set explicitly.
 */

const LOOKBACK_DAYS = 90;
const MAX_PER_RULE = Number(process.env.AUTOMATION_MAX_PER_RUN || 25);

interface Rule {
  id: string;
  kind: ClientEmailKind | 'owner_nudge';
  /** Lead statuses the rule applies to. */
  statuses: string[];
  /** How long the lead must have been sitting in that state. */
  afterHours: number;
  /** Upper bound: past this age the moment has passed and the rule stays quiet. */
  withinHours?: number;
  describe: (lead: any) => string;
}

const RULES: Rule[] = [
  {
    id: 'owner_nudge_2h',
    kind: 'owner_nudge',
    statuses: ['new'],
    afterHours: Number(process.env.AUTOMATION_NUDGE_HOURS || 2),
    describe: l => `${l.name || 'A lead'} from ${l.city || 'unknown city'} has been waiting`,
  },
  {
    id: 'quote_followup_3d',
    kind: 'quote_followup',
    statuses: ['contacted', 'quote_sent', 'estimate_requested', 'followup_needed'],
    afterHours: Number(process.env.AUTOMATION_FOLLOWUP_HOURS || 72),
    describe: l => `follow-up sent to ${l.email}`,
  },
  {
    id: 'review_request_1d',
    kind: 'review_request',
    statuses: ['completed'],
    afterHours: Number(process.env.AUTOMATION_REVIEW_HOURS || 24),
    // Asking "how did we do?" a month later reads as if nobody was paying attention.
    withinHours: Number(process.env.AUTOMATION_REVIEW_WINDOW_HOURS || 24 * 7),
    describe: l => `review request sent to ${l.email}`,
  },
  {
    id: 'winback_45d',
    kind: 'winback',
    statuses: ['completed'],
    afterHours: Number(process.env.AUTOMATION_WINBACK_HOURS || 24 * 45),
    describe: l => `win-back sent to ${l.email}`,
  },
];

function initAdmin(): boolean {
  if (admin.apps.length) return true;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_PRIVATE_KEY || '';
  if (!projectId || !clientEmail || !rawKey) {
    console.warn('[automations] Firebase Admin credentials missing');
    return false;
  }
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: rawKey.trim().replace(/^["']|["']$/g, '').replace(/,$/, '').replace(/\\n/g, '\n'),
      }),
    });
    return true;
  } catch (err) {
    console.error('[automations] admin init failed:', err);
    return false;
  }
}

/** Firestore timestamp, ISO string or millis — whatever the writer used. */
function toDate(value: any): Date | null {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

const hoursSince = (d: Date) => (Date.now() - d.getTime()) / 36e5;

function optedOut(lead: any): boolean {
  if (lead.automation_opt_out === true) return true;
  // "stop" in any reply we recorded is an opt-out, same as the SMS convention
  const history = `${lead.sms_history || ''} ${lead.conversation_summary || ''}`.toLowerCase();
  return /\bstop\b|\bunsubscribe\b|descadastr/.test(history);
}

export const handler = schedule('@hourly', async () => {
  const enabled = process.env.AUTOMATION_ENABLED === 'true';
  const dryRun = process.env.AUTOMATION_DRY_RUN === 'true';

  if (!enabled) {
    console.log('[automations] AUTOMATION_ENABLED is not "true" — nothing sent');
    return { statusCode: 200, body: JSON.stringify({ skipped: 'disabled' }) };
  }
  if (!initAdmin()) {
    return { statusCode: 500, body: JSON.stringify({ error: 'firebase not configured' }) };
  }

  const db = firestore();
  console.log('[automations] using Firestore database:', databaseLabel());
  const cutoff = new Date(Date.now() - LOOKBACK_DAYS * 24 * 36e5);
  const snapshot = await db.collection('leads').where('createdAt', '>=', cutoff).get();

  const report: Record<string, number> = {};
  const mailedThisRun = new Set<string>();
  const skipped: Record<string, number> = {};
  const bump = (bag: Record<string, number>, key: string) => { bag[key] = (bag[key] || 0) + 1; };

  for (const rule of RULES) {
    let sentForRule = 0;

    for (const doc of snapshot.docs) {
      if (sentForRule >= MAX_PER_RULE) break;
      const lead = doc.data() as any;

      if (!rule.statuses.includes(String(lead.status || 'new'))) continue;

      const log: string[] = Array.isArray(lead.automation_log) ? lead.automation_log : [];
      if (log.includes(rule.id)) { bump(skipped, 'already_sent'); continue; }

      if (optedOut(lead)) { bump(skipped, 'opted_out'); continue; }

      // Age is measured from the last state change, falling back to creation.
      const since = toDate(lead.updatedAt) || toDate(lead.createdAt);
      if (!since) { bump(skipped, 'no_timestamp'); continue; }
      if (hoursSince(since) < rule.afterHours) continue;
      if (rule.withinHours && hoursSince(since) > rule.withinHours) { bump(skipped, 'window_passed'); continue; }

      // One client-facing message per lead per run — two in a row reads as spam.
      if (rule.kind !== 'owner_nudge' && mailedThisRun.has(doc.id)) { bump(skipped, 'already_mailed_this_run'); continue; }

      if (rule.kind !== 'owner_nudge' && !String(lead.email || '').includes('@')) {
        bump(skipped, 'no_email');
        continue;
      }

      if (dryRun) {
        console.log(`[automations][dry-run] ${rule.id} -> ${doc.id}: ${rule.describe(lead)}`);
        bump(report, rule.id);
        if (rule.kind !== 'owner_nudge') mailedThisRun.add(doc.id);
        sentForRule++;
        continue;
      }

      const result = rule.kind === 'owner_nudge'
        ? await sendMail({
            subject: `Lead waiting ${Math.floor(hoursSince(since))}h — ${lead.name || lead.phone || 'unknown'}`,
            html: `<p style="font:400 15px/24px Helvetica,Arial,sans-serif;color:#334155;">
                     <strong>${rule.describe(lead)}</strong> for ${Math.floor(hoursSince(since))} hours and is still marked “new”.
                   </p>
                   <p style="font:400 15px/24px Helvetica,Arial,sans-serif;color:#334155;">
                     ${lead.phone || ''} · ${lead.email || ''}<br>${lead.service_type || ''}
                   </p>
                   <p><a href="https://danycleanpro.com/admin/dashboard/leads">Open the dashboard</a></p>`,
            text: `${rule.describe(lead)} for ${Math.floor(hoursSince(since))} hours and is still marked "new".\n`
                + `${lead.phone || ''} · ${lead.email || ''}\n`
                + `https://danycleanpro.com/admin/dashboard/leads`,
          })
        : await sendClientEmail(rule.kind as ClientEmailKind, lead);

      if (result.sent) {
        // Written only after a confirmed send, so a failure retries next hour.
        await doc.ref.update({
          automation_log: admin.firestore.FieldValue.arrayUnion(rule.id),
          last_automation_at: admin.firestore.FieldValue.serverTimestamp(),
        });
        bump(report, rule.id);
        if (rule.kind !== 'owner_nudge') mailedThisRun.add(doc.id);
        sentForRule++;
      } else {
        console.error(`[automations] ${rule.id} failed for ${doc.id}:`, result.error);
        bump(skipped, 'send_failed');
      }
    }
  }

  console.log('[automations] run finished', JSON.stringify({ scanned: snapshot.size, sent: report, skipped }));
  return { statusCode: 200, body: JSON.stringify({ scanned: snapshot.size, sent: report, skipped, dryRun }) };
});
