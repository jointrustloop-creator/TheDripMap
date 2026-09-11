/**
 * GET /api/cron/newsletter-welcome   (Vercel cron, daily)
 *
 * Every clean subscriber who has not yet received the first edition gets it,
 * automatically, so nobody waits weeks for a welcome (two Canadian subscribers
 * sat unsent from mid-August to 2026-09-11 waiting for a manual click). The
 * first edition is evergreen (Price Index, how to choose a clinic, the
 * Transparency Score), which is why it can be sent unattended; later editions
 * are written per month and go out through /admin/newsletter after the
 * operator approves a [TEST].
 *
 * Same queue, renderer, exclusions (internal, clinic addresses, US, unknown
 * cities held for review, suppression list) and per-subscriber sent marker as
 * the admin button. NEWSLETTER_SEND_PAUSED still wins.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMail } from '../../../../src/lib/mailer';
import { computeNewsletterQueue, recordNewsletterSent } from '../../../../src/lib/newsletter';
import { NEWSLETTER_SEND_PAUSED } from '../../../../src/lib/send-config';
import { logSend } from '../../../../src/lib/send-log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NEWSLETTER_FROM = process.env.NEWSLETTER_FROM || 'TheDripMap <hello@thedripmap.com>';
const NEWSLETTER_REPLY_TO = 'info@thedripmap.com';
const MAX_PER_RUN = 50;

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  if ((req.headers.get('authorization') || '') !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (NEWSLETTER_SEND_PAUSED) return NextResponse.json({ ok: true, paused: true, sent: 0 });
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 });

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { drafts, excluded } = await computeNewsletterQueue(sb);
  const due = drafts.filter((d) => !d.alreadySent).slice(0, MAX_PER_RUN);
  if (!due.length) return NextResponse.json({ ok: true, sent: 0, heldForReview: excluded.filter((e) => /held for review/.test(e.reason)).length });

  const results: Array<{ to: string; sent: boolean; error?: string }> = [];
  for (const d of due) {
    try {
      const r = await sendMail({ from: NEWSLETTER_FROM, to: d.to, replyTo: NEWSLETTER_REPLY_TO, subject: d.subject, text: d.text, html: d.html, channel: 'resend' });
      if (r.ok) { await recordNewsletterSent(sb, d.to); results.push({ to: d.to, sent: true }); }
      else results.push({ to: d.to, sent: false, error: r.error });
    } catch (err) {
      results.push({ to: d.to, sent: false, error: err instanceof Error ? err.message : String(err) });
    }
  }
  const sentTo = results.filter((r) => r.sent).map((r) => r.to);
  if (sentTo.length) {
    await logSend(sb, { channel: 'newsletter', action: 'send', actor: 'cron', recipients: sentTo, subject: `Newsletter welcome (${sentTo.length})`, note: `welcome cron: attempted ${results.length}` });
    await sendMail({
      from: 'TheDripMap <info@thedripmap.com>', to: NEWSLETTER_REPLY_TO, replyTo: NEWSLETTER_REPLY_TO,
      subject: `[TheDripMap] Newsletter welcome sent to ${sentTo.length} new subscriber${sentTo.length === 1 ? '' : 's'}`,
      text: `First edition sent to:\n${sentTo.map((e) => `- ${e}`).join('\n')}\n\nSubscribers held for review (city not recognized): ${excluded.filter((e) => /held for review/.test(e.reason)).length}. Check /admin/newsletter.`,
    });
  }
  return NextResponse.json({ ok: true, attempted: results.length, sent: sentTo.length, failed: results.length - sentTo.length, results });
}
