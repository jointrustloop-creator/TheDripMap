/**
 * Part B outreach admin API (platform mailer, not Gmail drafts).
 *
 *   GET  /api/admin/outreach            -> counts + the next pending batch (25)
 *   POST /api/admin/outreach            -> { action: 'test'|'send', testEmail?, limit? }
 *
 * Every send is operator-gated: nothing leaves until an authenticated admin
 * POSTs here from /admin/outreach. 'test' sends ONE sample to a chosen address;
 * 'send' sends the pending batch and records the two-touch state.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminRequest } from '../../../../src/lib/admin-auth';
import { sendMail } from '../../../../src/lib/mailer';
import { computeOutreachQueue, recordSentTouch, sampleTestEmail } from '../../../../src/lib/partb-outreach';
import { OUTREACH_SEND_PAUSED, sendPausedMessage } from '../../../../src/lib/send-config';
import { logSend, getLastSend } from '../../../../src/lib/send-log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

// Bulk outreach goes through Resend ONLY (never Workspace SMTP), so info@'s
// Workspace account is not exposed to bulk-send rate limits / suspension.
// The from address must be on the Resend-authenticated domain (resend._domainkey
// + send.thedripmap.com return-path). Reply-to stays info@ so replies are seen.
const OUTREACH_FROM = process.env.OUTREACH_FROM || 'TheDripMap <hello@thedripmap.com>';
const OUTREACH_REPLY_TO = 'info@thedripmap.com';

function resendConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export async function GET() {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { drafts, counts } = await computeOutreachQueue(db());
  const limit = 25;
  const batch = drafts.slice(0, limit).map((d) => ({
    id: d.id, to: d.to, name: d.name, city: d.city, band: d.band, score: d.score, touch: d.touch, views: d.views, subject: d.subject, html: d.html,
  }));
  const lastSend = await getLastSend(db(), 'partb');
  return NextResponse.json({
    ok: true,
    resendConfigured: resendConfigured(),
    from: OUTREACH_FROM,
    sendPaused: OUTREACH_SEND_PAUSED,
    lastSend,
    counts,
    batchSize: batch.length,
    remaining: Math.max(0, drafts.length - batch.length),
    batch,
  });
}

export async function POST(req: Request) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!resendConfigured()) {
    return NextResponse.json({ error: 'RESEND_API_KEY is not set. Part B outreach sends via Resend only.' }, { status: 500 });
  }
  let body: { action?: string; testEmail?: string; limit?: number; realFromQueue?: boolean; index?: number };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }); }

  // TEST: one email to a chosen address. Sends nothing to real clinics.
  //   default        -> a fixed sample ("Hi your clinic team,").
  //   realFromQueue  -> the ACTUAL rendered email of a real pending-batch clinic
  //                     (default the first), so name-fill in greeting + subject
  //                     is proven before the batch. Still goes to testEmail only.
  if (body.action === 'test') {
    const to = (body.testEmail || '').trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return NextResponse.json({ error: 'valid testEmail required' }, { status: 400 });
    let s: { subject: string; text: string; html: string };
    let clinic: { name: string; city: string; band: string } | null = null;
    if (body.realFromQueue) {
      const { drafts } = await computeOutreachQueue(db());
      const idx = Math.min(Math.max(0, Number(body.index) || 0), Math.max(0, drafts.length - 1));
      const d = drafts[idx];
      if (!d) return NextResponse.json({ error: 'no pending clinics to sample' }, { status: 400 });
      s = { subject: d.subject, text: d.text, html: d.html };
      clinic = { name: d.name, city: d.city, band: d.band };
    } else {
      s = sampleTestEmail('your clinic');
    }
    const r = await sendMail({ from: OUTREACH_FROM, to, replyTo: OUTREACH_REPLY_TO, subject: s.subject, text: s.text, html: s.html, channel: 'resend' });
    // Log tests too, so the "what already went out" panel shows the info@ test
    // copies that caused confusion on 2026-08-11.
    if (r.ok) await logSend(db(), { channel: 'partb', action: 'test', recipients: [to], subject: s.subject, note: 'test send' });
    return NextResponse.json({ ok: r.ok, action: 'test', realFromQueue: !!body.realFromQueue, clinic, subject: s.subject, to, from: OUTREACH_FROM, provider: r.provider, id: r.id, error: r.error });
  }

  // SEND: the pending batch. Records the two-touch state on each success.
  if (body.action === 'send') {
    // HARD GATE: default-paused kill-switch. Prevents an accidental or
    // unattended release (the 2026-08-11 double-send failure mode).
    if (OUTREACH_SEND_PAUSED) {
      return NextResponse.json({ ok: true, paused: true, sent: 0, message: sendPausedMessage('outreach') });
    }
    const supabase = db();
    const limit = Math.min(Math.max(1, Number(body.limit) || 25), 25);
    const { drafts } = await computeOutreachQueue(supabase);
    const batch = drafts.slice(0, limit);
    const results: Array<{ to: string; sent: boolean; error?: string }> = [];
    for (const d of batch) {
      try {
        const r = await sendMail({ from: OUTREACH_FROM, to: d.to, replyTo: OUTREACH_REPLY_TO, subject: d.subject, text: d.text, html: d.html, channel: 'resend' });
        if (r.ok) {
          await recordSentTouch(supabase, d.id, d.touch);
          results.push({ to: d.to, sent: true });
        } else {
          results.push({ to: d.to, sent: false, error: r.error });
        }
      } catch (err) {
        results.push({ to: d.to, sent: false, error: err instanceof Error ? err.message : String(err) });
      }
    }
    // Audit row: the source of truth the admin screen reads to show "last batch".
    const sentTo = results.filter((r) => r.sent).map((r) => r.to);
    await logSend(supabase, { channel: 'partb', action: 'send', recipients: sentTo, subject: `Part B batch (${sentTo.length})`, note: `attempted ${results.length}` });
    return NextResponse.json({
      ok: true,
      action: 'send',
      attempted: results.length,
      sent: results.filter((r) => r.sent).length,
      failed: results.filter((r) => !r.sent).length,
      results,
    });
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 });
}
