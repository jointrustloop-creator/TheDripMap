/**
 * GET /api/cron/partb-daily   (Vercel cron, weekdays)
 *
 * The daily cold-outreach batch the operator used to click by hand on
 * /admin/outreach ("yes please do 25 texas daily", 2026-09-11). Same queue,
 * same rails, same renderer as the admin button: computeOutreachQueue applies
 * both suppression tables, the two-touch cap, bounce/reply/needs_human skips
 * and one-conversation-per-email; recordSentTouch advances the cap; every
 * batch is logged to email_send_log.
 *
 * Safety:
 *  - OUTREACH_SEND_PAUSED (env OUTREACH_SEND_ENABLED !== 'true') still wins.
 *  - DAILY_MARKETS is the operator-approved list; a market not in it never
 *    sends. Adding a market is a code change the operator merges.
 *  - PER_MARKET_LIMIT per market per day, and at most one run per market per
 *    calendar day (a redeploy or a manual hit cannot double-send).
 *  - Weekdays only.
 *  - A short summary goes to info@ so the operator sees what went out.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMail } from '../../../../src/lib/mailer';
import { computeOutreachQueue, recordSentTouch, queueOptionsFor, marketLabelFor } from '../../../../src/lib/partb-outreach';
import { OUTREACH_SEND_PAUSED } from '../../../../src/lib/send-config';
import { logSend } from '../../../../src/lib/send-log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// Operator-approved markets for unattended daily sends. PAUSED 2026-09-12
// (September Sprint, GOAL.md): Canada-only positioning; the US archive stays
// noindexed until Canadian money terms reach page 1 to 2. To resume Texas,
// put 'US-TX' back here; the route, rails and log are unchanged.
const DAILY_MARKETS: string[] = [];
const PER_MARKET_LIMIT = 25;
const OUTREACH_FROM = process.env.OUTREACH_FROM || 'TheDripMap <hello@thedripmap.com>';
const OUTREACH_REPLY_TO = 'info@thedripmap.com';
const OPERATOR_EMAIL = 'info@thedripmap.com';

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  if ((req.headers.get('authorization') || '') !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (OUTREACH_SEND_PAUSED) return NextResponse.json({ ok: true, paused: true, sent: 0 });
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 });

  // Weekdays only (UTC day is fine: the schedule fires mid-morning Eastern).
  const dow = new Date().getUTCDay();
  if (dow === 0 || dow === 6) return NextResponse.json({ ok: true, skipped: 'weekend', sent: 0 });

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const today = new Date().toISOString().slice(0, 10);
  const summary: string[] = [];
  const out: Record<string, unknown> = {};

  for (const market of DAILY_MARKETS) {
    // Once per market per day: look for today's daily-cron log row.
    const { data: already } = await sb
      .from('email_send_log')
      .select('id')
      .eq('channel', 'partb')
      .eq('action', 'send')
      .ilike('note', `daily cron ${market} ${today}%`)
      .limit(1);
    if (already && already.length) { out[market] = { skipped: 'already ran today' }; continue; }

    const { drafts, counts } = await computeOutreachQueue(sb, queueOptionsFor(market));
    const batch = drafts.slice(0, PER_MARKET_LIMIT);
    const results: Array<{ to: string; sent: boolean; error?: string }> = [];
    for (const d of batch) {
      try {
        const r = await sendMail({ from: OUTREACH_FROM, to: d.to, replyTo: OUTREACH_REPLY_TO, subject: d.subject, text: d.text, html: d.html, channel: 'resend' });
        if (r.ok) { await recordSentTouch(sb, d.id, d.touch); results.push({ to: d.to, sent: true }); }
        else results.push({ to: d.to, sent: false, error: r.error });
      } catch (err) {
        results.push({ to: d.to, sent: false, error: err instanceof Error ? err.message : String(err) });
      }
    }
    const sentTo = results.filter((r) => r.sent).map((r) => r.to);
    await logSend(sb, {
      channel: 'partb', action: 'send', actor: 'cron',
      recipients: sentTo,
      subject: `Part B batch, ${marketLabelFor(market)} (${sentTo.length})`,
      note: `daily cron ${market} ${today}: attempted ${results.length}, queue ${drafts.length}`,
    });
    const firsts = batch.filter((d) => d.touch === 'first').length;
    out[market] = { attempted: results.length, sent: sentTo.length, failed: results.length - sentTo.length, remaining: Math.max(0, drafts.length - batch.length), counts };
    summary.push(`${marketLabelFor(market)}: sent ${sentTo.length} (${firsts} first touch, ${batch.length - firsts} follow-ups), ${Math.max(0, drafts.length - batch.length)} left in the queue.`);
    if (results.some((r) => !r.sent)) summary.push(`  failed: ${results.filter((r) => !r.sent).map((r) => `${r.to} (${r.error || 'unknown'})`).join('; ')}`);
  }

  if (summary.length) {
    await sendMail({
      from: 'TheDripMap <info@thedripmap.com>', to: OPERATOR_EMAIL, replyTo: OPERATOR_EMAIL,
      subject: `[TheDripMap] Daily outreach sent, ${today}`,
      text: `Daily cold outreach ran at ${new Date().toISOString().slice(11, 16)}Z.\n\n${summary.join('\n')}\n\nQueue and log: https://www.thedripmap.com/admin/outreach`,
    });
  }
  return NextResponse.json({ ok: true, date: today, markets: out });
}
