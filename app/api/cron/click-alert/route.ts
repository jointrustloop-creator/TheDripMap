/**
 * GET /api/cron/click-alert   (Vercel cron, daily at 21:00 UTC, 5pm Toronto)
 *
 * Same-day note to a CLAIMED clinic when a patient clicked to call, book,
 * visit their site, get directions or message them from their TheDripMap page
 * in the last 24 hours. This is the first version of the lead product: the
 * clinic sees our value on the day it happened, not in a monthly report.
 *
 * Rails (all fail closed):
 *   claimed only; a valid, non-bounced email; forward_leads !== false; not an
 *   orphan claim stub; not on email_suppressions OR outreach_suppressions;
 *   at most ONE alert per clinic per 24 hours (decision_drivers.click_alert);
 *   human clicks only (intent carrier rows and bot-filtered rows excluded).
 *
 * Query params:
 *   ?dry=1    compute and report, send nothing
 *   ?test=1   render the first eligible alert and send it ONLY to info@ (cc
 *             the operator) with a [TEST] subject; nothing goes to a clinic
 *   ?slug=x   restrict to one clinic (with test or dry)
 *
 * Every send is recorded on the clinic row AND in email_send_log, and the run
 * emails a summary to the operator. Batch channel is Resend (house rule).
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMail } from '../../../../src/lib/mailer';
import { REPORT_TO } from '../../../../src/lib/report-recipient';
import { textToHtml, toPlainText } from '../../../../src/lib/email-render';
import { logSend } from '../../../../src/lib/send-log';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const SITE = 'https://www.thedripmap.com';
const OPERATOR_CC = 'hubertzyworonek@gmail.com';
const CLICK_TYPES = ['call_click', 'book_click', 'website_click', 'directions_click', 'message_click'] as const;
type ClickType = (typeof CLICK_TYPES)[number];

const LABEL: Record<ClickType, string> = {
  call_click: 'tapped to call you',
  book_click: 'clicked through to book',
  website_click: 'went to your website',
  directions_click: 'opened directions to you',
  message_click: 'opened the message form',
};

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

function buildEmail(p: { name: string; slug: string; city: string | null }, counts: Partial<Record<ClickType, number>>) {
  const total = Object.values(counts).reduce((a, b) => a + (b || 0), 0);
  const lines = (Object.keys(counts) as ClickType[])
    .filter((k) => (counts[k] || 0) > 0)
    .sort((a, b) => (counts[b] || 0) - (counts[a] || 0))
    .map((k) => `${plural(counts[k] || 0, 'patient', 'patients')} ${LABEL[k]}`);

  const lead = total === 1
    ? `A patient on your ${p.name} page on TheDripMap just took a step toward booking with you.`
    : `${total} patients on your ${p.name} page on TheDripMap took a step toward booking with you today.`;

  const subject = total === 1
    ? `A patient just clicked through to ${p.name} from TheDripMap`
    : `${total} patients clicked through to ${p.name} from TheDripMap today`;

  const text = `Hi ${p.name} team,

${lead}

In the last 24 hours:
${lines.map((l) => `- ${l}`).join('\n')}

These are people in ${p.city || 'your area'} comparing IV therapy clinics who chose you. If your prices, hours or booking link on the page are out of date, that is the moment it costs you.

[See your ${p.name} page](${SITE}/providers/${p.slug})

You get this note on days a patient acts on your page, never on days nobody does.

Deborah Triandafilou
Founder, TheDripMap`;

  return { subject, text };
}

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  if ((req.headers.get('authorization') || '') !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const url = new URL(req.url);
  const dry = url.searchParams.get('dry') === '1';
  const test = url.searchParams.get('test') === '1';
  const only = url.searchParams.get('slug');

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Human clicks in the last 24h, grouped by clinic.
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { data: events, error: evErr } = await sb
    .from('listing_events')
    .select('provider_id, event_type, referrer')
    .gte('created_at', since)
    .in('event_type', [...CLICK_TYPES])
    .or('referrer.is.null,referrer.not.like.i:%');
  if (evErr) return NextResponse.json({ error: `events: ${evErr.message}` }, { status: 500 });

  const byClinic = new Map<string, Partial<Record<ClickType, number>>>();
  for (const e of events || []) {
    const c = byClinic.get(e.provider_id) || {};
    c[e.event_type as ClickType] = (c[e.event_type as ClickType] || 0) + 1;
    byClinic.set(e.provider_id, c);
  }
  if (byClinic.size === 0) {
    return NextResponse.json({ ok: true, eligible: 0, sent: 0, note: 'no human clicks in the last 24h' });
  }

  // 2. Eligibility, fail closed on every rail.
  const ids = Array.from(byClinic.keys());
  const { data: rows, error: pErr } = await sb
    .from('providers')
    .select('id, name, slug, city, email, is_claimed, is_hidden, email_bounced, forward_leads, decision_drivers')
    .in('id', ids);
  if (pErr) return NextResponse.json({ error: `providers: ${pErr.message}` }, { status: 500 });

  const [s1, s2] = await Promise.all([
    sb.from('email_suppressions').select('email'),
    sb.from('outreach_suppressions').select('email'),
  ]);
  if (s1.error || s2.error) {
    return NextResponse.json({ error: 'suppression lists unreadable; refusing to send' }, { status: 500 });
  }
  const suppressed = new Set([...(s1.data || []), ...(s2.data || [])].map((r: { email: string }) => String(r.email).toLowerCase().trim()));

  const cutoff = Date.now() - 24 * 3600 * 1000;
  const skipped: string[] = [];
  const eligible: Array<{ row: NonNullable<typeof rows>[number]; counts: Partial<Record<ClickType, number>> }> = [];
  for (const row of rows || []) {
    const dd = (row.decision_drivers && typeof row.decision_drivers === 'object' ? row.decision_drivers : {}) as Record<string, unknown>;
    const why =
      only && row.slug !== only ? 'not the requested slug'
      : !row.is_claimed ? 'unclaimed'
      : row.is_hidden ? 'hidden'
      : !row.email ? 'no email'
      : row.email_bounced ? 'bounced'
      : row.forward_leads === false ? 'opted out of leads'
      : dd.source === 'orphan_claim_stub' ? 'orphan stub'
      : suppressed.has(String(row.email).toLowerCase().trim()) ? 'suppressed'
      : (dd.click_alert as { last_sent_at?: string } | undefined)?.last_sent_at &&
        Date.parse(String((dd.click_alert as { last_sent_at?: string }).last_sent_at)) > cutoff ? 'alerted within 24h'
      : null;
    if (why) { skipped.push(`${row.name}: ${why}`); continue; }
    eligible.push({ row, counts: byClinic.get(row.id) || {} });
  }

  // 3. Send.
  const sent: string[] = [];
  const failed: string[] = [];
  for (const { row, counts } of eligible) {
    const { subject, text } = buildEmail({ name: row.name, slug: row.slug, city: row.city }, counts);
    if (/[–—]/.test(subject + text)) { failed.push(`${row.name}: dash in copy`); continue; }
    if (dry) { sent.push(`${row.name} (dry)`); continue; }

    const to = test ? REPORT_TO : String(row.email).trim();
    const render = { footerFor: to, clinicName: row.name };
    const r = await sendMail({
      from: 'TheDripMap <info@thedripmap.com>',
      to,
      cc: test ? OPERATOR_CC : undefined,
      replyTo: 'info@thedripmap.com',
      subject: test ? `[TEST of click_alert_v1, rendered for ${row.name}; the real one would go to ${row.email}] ${subject}` : subject,
      text: toPlainText(text, render),
      html: textToHtml(text, render),
      headers: { 'List-Unsubscribe': `<${SITE}/api/newsletter/unsubscribe/${encodeURIComponent(to)}>` },
      channel: 'resend',
    });
    if (!r.ok) { failed.push(`${row.name}: ${r.error || 'send failed'}`); continue; }
    sent.push(row.name);
    if (!test) {
      const dd = (row.decision_drivers && typeof row.decision_drivers === 'object' ? row.decision_drivers : {}) as Record<string, unknown>;
      await sb.from('providers').update({
        decision_drivers: { ...dd, click_alert: { last_sent_at: new Date().toISOString(), last_counts: counts, template: 'click_alert_v1' } },
      }).eq('id', row.id);
    }
    if (test) break; // one rendered sample is the point of a test
    await new Promise((res) => setTimeout(res, 2000));
  }
  if (!dry && sent.length) {
    await logSend(sb, {
      channel: 'click_alert',
      action: test ? 'test' : 'send',
      actor: 'cron',
      recipients: test ? [REPORT_TO] : eligible.slice(0, sent.length).map((e) => String(e.row.email)),
      subject: `click alert (${sent.length})`,
      note: `clinics with clicks ${byClinic.size}, eligible ${eligible.length}, skipped ${skipped.length}`,
    });
  }

  // 4. Operator summary (not on test runs, the test IS the email).
  if (!test) {
    try {
      await sendMail({
        from: 'TheDripMap <info@thedripmap.com>',
        to: REPORT_TO,
        subject: `[TheDripMap] Click alerts ${dry ? '(DRY) ' : ''}sent: ${sent.length}`,
        text: [
          `Clinics with human clicks in the last 24h: ${byClinic.size}`,
          `Eligible claimed clinics: ${eligible.length}`,
          `Sent: ${sent.length}${sent.length ? '\n  - ' + sent.join('\n  - ') : ''}`,
          `Failed: ${failed.length}${failed.length ? '\n  - ' + failed.join('\n  - ') : ''}`,
          `Skipped: ${skipped.length}${skipped.length ? '\n  - ' + skipped.join('\n  - ') : ''}`,
        ].join('\n'),
      });
    } catch { /* reporting never fails the run */ }
  }

  return NextResponse.json({ ok: true, dry, test, clinicsWithClicks: byClinic.size, eligible: eligible.length, sent, failed, skipped });
}
