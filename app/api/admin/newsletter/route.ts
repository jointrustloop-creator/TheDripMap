/**
 * Patient newsletter admin API (platform mailer via Resend, not Gmail).
 *
 *   GET  /api/admin/newsletter   -> clean queue + counts + 2 example renders
 *   POST /api/admin/newsletter   -> { action: 'test'|'send', testEmail? }
 *
 * Every send is operator-gated: nothing leaves until an authenticated admin
 * POSTs here from /admin/newsletter. 'test' sends ONE representative edition to
 * a chosen address (default the Montreal render); 'send' sends the clean batch
 * and records a per-edition sent marker so nobody is mailed twice.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminRequest } from '../../../../src/lib/admin-auth';
import { sendMail } from '../../../../src/lib/mailer';
import { computeNewsletterQueue, recordNewsletterSent } from '../../../../src/lib/newsletter';
import { NEWSLETTER_SEND_PAUSED, sendPausedMessage, sendConfirmCode, verifySendCode } from '../../../../src/lib/send-config';
import { logSend, getLastSend } from '../../../../src/lib/send-log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

// Newsletter goes through Resend ONLY (never Workspace SMTP), from a patient-
// appropriate address on the Resend-authenticated domain. Reply-to stays info@.
const NEWSLETTER_FROM = process.env.NEWSLETTER_FROM || 'TheDripMap <hello@thedripmap.com>';
const NEWSLETTER_REPLY_TO = 'info@thedripmap.com';

function resendConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

// Pick a draft to represent a city in the preview / test (case-insensitive).
function draftForCity<T extends { city: string | null }>(drafts: T[], city: string): T | undefined {
  return drafts.find((d) => (d.city || '').trim().toLowerCase() === city.toLowerCase());
}

export async function GET() {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { drafts, excluded, counts } = await computeNewsletterQueue(db());
  // Two example renders the operator asked to see: Montreal and Halifax.
  const examples = ['Montreal', 'Halifax']
    .map((c) => draftForCity(drafts, c))
    .filter(Boolean)
    .map((d) => ({ to: d!.to, city: d!.city, priceCity: d!.priceCity, localLine: d!.localLine, subject: d!.subject, html: d!.html }));
  const lastSend = await getLastSend(db(), 'newsletter');
  return NextResponse.json({
    ok: true,
    resendConfigured: resendConfigured(),
    from: NEWSLETTER_FROM,
    replyTo: NEWSLETTER_REPLY_TO,
    sendPaused: NEWSLETTER_SEND_PAUSED,
    confirmCode: sendConfirmCode('newsletter'),
    lastSend,
    counts,
    examples,
    drafts: drafts.map((d) => ({
      to: d.to, city: d.city, priceCity: d.priceCity, localLine: d.localLine,
      subject: d.subject, html: d.html, alreadySent: d.alreadySent,
    })),
    excluded,
  });
}

export async function POST(req: Request) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!resendConfigured()) {
    return NextResponse.json({ error: 'RESEND_API_KEY is not set. The newsletter sends via Resend only.' }, { status: 500 });
  }
  let body: { action?: string; testEmail?: string; city?: string; confirmCode?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }); }

  const { drafts } = await computeNewsletterQueue(db());

  // TEST: one representative edition to a chosen address. Sends nothing to
  // subscribers. Defaults to the Montreal render (falls back to the first draft).
  if (body.action === 'test') {
    const to = (body.testEmail || '').trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return NextResponse.json({ error: 'valid testEmail required' }, { status: 400 });
    const pick = (body.city ? draftForCity(drafts, body.city) : null) || draftForCity(drafts, 'Montreal') || drafts[0];
    if (!pick) return NextResponse.json({ error: 'no subscribers to sample' }, { status: 400 });
    const r = await sendMail({ from: NEWSLETTER_FROM, to, replyTo: NEWSLETTER_REPLY_TO, subject: pick.subject, text: pick.text, html: pick.html, channel: 'resend' });
    if (r.ok) await logSend(db(), { channel: 'newsletter', action: 'test', recipients: [to], subject: pick.subject, note: 'test send' });
    return NextResponse.json({ ok: r.ok, action: 'test', sampleCity: pick.city, subject: pick.subject, to, from: NEWSLETTER_FROM, provider: r.provider, id: r.id, error: r.error });
  }

  // SEND: the clean batch. Skips anyone already sent this edition, and records a
  // marker on each success so a second click will not re-mail them.
  if (body.action === 'send') {
    if (NEWSLETTER_SEND_PAUSED) {
      return NextResponse.json({ ok: true, paused: true, sent: 0, message: sendPausedMessage('newsletter') });
    }
    if (!verifySendCode('newsletter', body.confirmCode)) {
      return NextResponse.json({ error: 'Confirmation code missing, wrong, or expired. Reopen the send dialog and type the current code.', needCode: true }, { status: 400 });
    }
    const supabase = db();
    const batch = drafts.filter((d) => !d.alreadySent);
    const results: Array<{ to: string; sent: boolean; error?: string }> = [];
    for (const d of batch) {
      try {
        const r = await sendMail({ from: NEWSLETTER_FROM, to: d.to, replyTo: NEWSLETTER_REPLY_TO, subject: d.subject, text: d.text, html: d.html, channel: 'resend' });
        if (r.ok) {
          await recordNewsletterSent(supabase, d.to);
          results.push({ to: d.to, sent: true });
        } else {
          results.push({ to: d.to, sent: false, error: r.error });
        }
      } catch (err) {
        results.push({ to: d.to, sent: false, error: err instanceof Error ? err.message : String(err) });
      }
    }
    const sentTo = results.filter((r) => r.sent).map((r) => r.to);
    await logSend(supabase, { channel: 'newsletter', action: 'send', recipients: sentTo, subject: `Newsletter batch (${sentTo.length})`, note: `attempted ${results.length}` });
    return NextResponse.json({
      ok: true,
      action: 'send',
      attempted: results.length,
      sent: results.filter((r) => r.sent).length,
      failed: results.filter((r) => !r.sent).length,
      skippedAlreadySent: drafts.length - batch.length,
      results,
    });
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 });
}
