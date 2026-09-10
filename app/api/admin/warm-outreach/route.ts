/**
 * POST /api/admin/warm-outreach   (Activation Plan step 5, "give first")
 *
 *   { mode: 'preview', only?, allow_third_touch? }   render, send nothing
 *   { mode: 'test', slug? }                           ONE [TEST] to info@ + operator cc
 *   { mode: 'send', confirm: 'SEND', only?, limit?, allow_third_touch? }
 *
 * allow_third_touch lets a clinic already at the two-touch cold cap receive
 * this one materially different email; it is off unless the operator says so.
 * Every success is marked (one warm email ever) and logged to email_send_log.
 * Auth: admin cookie or the operator-side machine token. Never scheduled.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminRequest } from '../../../../src/lib/admin-auth';
import { machineTokenOk } from '../../../../src/lib/machine-token';
import { sendMail } from '../../../../src/lib/mailer';
import { logSend } from '../../../../src/lib/send-log';
import { buildWarmQueue, markWarmSent } from '../../../../src/lib/warm-outreach';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const FROM = 'TheDripMap <info@thedripmap.com>';
const OPERATOR_EMAIL = 'info@thedripmap.com';
const OPERATOR_CC = 'hubertzyworonek@gmail.com';

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest()) && !machineTokenOk(req.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const mode = String(body?.mode || 'preview');
  const only = Array.isArray(body?.only) ? body.only.map(String) : undefined;
  const allowThirdTouch = body?.allow_third_touch === true;
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  if (mode === 'preview') {
    const { candidates, counts } = await buildWarmQueue(sb, { only, allowThirdTouch });
    return NextResponse.json({ ok: true, counts, candidates: candidates.map((c) => ({ slug: c.slug, name: c.name, to: c.to, views90d: c.views90d, gscImpressions: c.gscImpressions, priorTouches: c.priorTouches, found: c.found, subject: c.email.subject, text: c.email.text })) });
  }

  if (mode === 'test') {
    const slug = typeof body?.slug === 'string' && body.slug ? body.slug : undefined;
    const { candidates } = await buildWarmQueue(sb, { only: slug ? [slug] : undefined, allowThirdTouch: true, includeSent: true });
    const c = [...candidates].sort((a, b) => b.found.treatments - a.found.treatments)[0];
    if (!c) return NextResponse.json({ error: 'no eligible clinic to render (has the engine run on it?)' }, { status: 404 });
    const res = await sendMail({ from: FROM, to: OPERATOR_EMAIL, cc: OPERATOR_CC, replyTo: OPERATOR_EMAIL, subject: `[TEST] ${c.email.subject}`, text: `[TEST of warm_outreach_v1, rendered for ${c.name}; the real one would go to ${c.to}]\n\n${c.email.text}`, html: c.email.html });
    await logSend(sb, { channel: 'partb', action: 'test', recipients: [OPERATOR_EMAIL, OPERATOR_CC], subject: `[TEST] ${c.email.subject}`, note: `warm_outreach_v1 rendered for ${c.slug}` });
    return NextResponse.json({ ok: res.ok, provider: res.provider, error: res.error, rendered_for: c.slug, would_go_to: c.to, subject: c.email.subject }, { status: res.ok ? 200 : 500 });
  }

  if (mode === 'send') {
    if (body?.confirm !== 'SEND') return NextResponse.json({ error: "confirm: 'SEND' required" }, { status: 400 });
    const limit = Math.max(1, Math.min(50, Number(body?.limit) || 50));
    const { candidates, counts } = await buildWarmQueue(sb, { only, allowThirdTouch });
    const batch = candidates.slice(0, limit);
    const results: Array<{ slug: string; to: string; ok: boolean; error?: string }> = [];
    for (const c of batch) {
      // Bulk outreach goes through Resend, never the Workspace SMTP account.
      const res = await sendMail({ from: FROM, to: c.to, replyTo: OPERATOR_EMAIL, subject: c.email.subject, text: c.email.text, html: c.email.html, channel: 'resend' });
      if (res.ok) await markWarmSent(sb, c, res.id);
      results.push({ slug: c.slug, to: c.to, ok: res.ok, error: res.error });
    }
    const sentTo = results.filter((r) => r.ok).map((r) => r.to);
    if (sentTo.length) await logSend(sb, { channel: 'partb', action: 'send', recipients: sentTo, subject: batch[0]?.email.subject, note: `warm_outreach_v1 batch of ${sentTo.length}${allowThirdTouch ? ' (third touch allowed)' : ''}` });
    return NextResponse.json({ ok: true, counts, sent: sentTo.length, results });
  }

  return NextResponse.json({ error: `unknown mode ${mode}` }, { status: 400 });
}
