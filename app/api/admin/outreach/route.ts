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

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

function mailerConfigured(): boolean {
  return (!!process.env.SMTP_USER && !!process.env.SMTP_PASS) || !!process.env.RESEND_API_KEY;
}

export async function GET() {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { drafts, counts } = await computeOutreachQueue(db());
  const limit = 25;
  const batch = drafts.slice(0, limit).map((d) => ({
    id: d.id, to: d.to, name: d.name, city: d.city, band: d.band, score: d.score, touch: d.touch, views: d.views, subject: d.subject, html: d.html,
  }));
  return NextResponse.json({
    ok: true,
    mailerConfigured: mailerConfigured(),
    counts,
    batchSize: batch.length,
    remaining: Math.max(0, drafts.length - batch.length),
    batch,
  });
}

export async function POST(req: Request) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!mailerConfigured()) {
    return NextResponse.json({ error: 'No mail provider configured (SMTP_USER+SMTP_PASS or RESEND_API_KEY).' }, { status: 500 });
  }
  let body: { action?: string; testEmail?: string; limit?: number };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }); }

  // TEST: one sample email to a chosen address. Sends nothing to clinics.
  if (body.action === 'test') {
    const to = (body.testEmail || '').trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return NextResponse.json({ error: 'valid testEmail required' }, { status: 400 });
    const s = sampleTestEmail('your clinic');
    const r = await sendMail({ from: 'TheDripMap <info@thedripmap.com>', to, replyTo: 'info@thedripmap.com', subject: s.subject, text: s.text, html: s.html });
    return NextResponse.json({ ok: r.ok, action: 'test', to, provider: r.provider, id: r.id, error: r.error });
  }

  // SEND: the pending batch. Records the two-touch state on each success.
  if (body.action === 'send') {
    const supabase = db();
    const limit = Math.min(Math.max(1, Number(body.limit) || 25), 25);
    const { drafts } = await computeOutreachQueue(supabase);
    const batch = drafts.slice(0, limit);
    const results: Array<{ to: string; sent: boolean; error?: string }> = [];
    for (const d of batch) {
      try {
        const r = await sendMail({ from: 'TheDripMap <info@thedripmap.com>', to: d.to, replyTo: 'info@thedripmap.com', subject: d.subject, text: d.text, html: d.html });
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
