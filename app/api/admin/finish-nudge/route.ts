/**
 * POST /api/admin/finish-nudge
 *
 * Owner "finish your listing" nudge (src/lib/finish-nudge.ts). Three modes:
 *   { mode: 'preview', only?: string[] }
 *       Render every eligible clinic, send nothing. Returns subjects + text.
 *   { mode: 'test', slug?: string }
 *       ONE [TEST] copy of a real clinic's email to info@ with the operator
 *       cc'd (the format-approval rule: every new email format is seen by the
 *       operator before its first real use). Marks nothing.
 *   { mode: 'send', confirm: 'SEND', only?: string[], limit?: number }
 *       The real send. Each success is marked on the provider (one nudge ever)
 *       and one row is written to email_send_log.
 *
 * Auth: admin cookie, or the operator-side machine token (scoped in
 * middleware.ts and re-checked here). Never runs on a schedule.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminRequest } from '../../../../src/lib/admin-auth';
import { machineTokenOk } from '../../../../src/lib/machine-token';
import { sendMail } from '../../../../src/lib/mailer';
import { logSend } from '../../../../src/lib/send-log';
import { buildFinishNudgeQueue, markFinishNudgeSent } from '../../../../src/lib/finish-nudge';

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
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  if (mode === 'preview') {
    const { candidates, counts } = await buildFinishNudgeQueue(sb, { only });
    return NextResponse.json({
      ok: true,
      counts,
      candidates: candidates.map((c) => ({ slug: c.slug, name: c.name, to: c.to, ownerName: c.ownerName, strength: c.strength, stagedCount: c.stagedCount, subject: c.email.subject, text: c.email.text })),
    });
  }

  if (mode === 'test') {
    const slug = typeof body?.slug === 'string' && body.slug ? body.slug : undefined;
    const { candidates } = await buildFinishNudgeQueue(sb, { only: slug ? [slug] : undefined, includeNudged: true });
    // Pick the richest example (most staged treatments) when no slug is given.
    const c = [...candidates].sort((a, b) => b.stagedCount - a.stagedCount)[0];
    if (!c) return NextResponse.json({ error: 'no eligible clinic to render' }, { status: 404 });
    const res = await sendMail({
      from: FROM,
      to: OPERATOR_EMAIL,
      cc: OPERATOR_CC,
      replyTo: OPERATOR_EMAIL,
      subject: `[TEST] ${c.email.subject}`,
      text: `[TEST of finish_nudge_v1, rendered for ${c.name}; the real one would go to ${c.to}]\n\n${c.email.text}`,
      html: c.email.html,
    });
    await logSend(sb, { channel: 'finish_nudge', action: 'test', recipients: [OPERATOR_EMAIL, OPERATOR_CC], subject: `[TEST] ${c.email.subject}`, note: `rendered for ${c.slug}` });
    return NextResponse.json({ ok: res.ok, provider: res.provider, error: res.error, rendered_for: c.slug, would_go_to: c.to, subject: c.email.subject }, { status: res.ok ? 200 : 500 });
  }

  if (mode === 'send') {
    if (body?.confirm !== 'SEND') return NextResponse.json({ error: "confirm: 'SEND' required" }, { status: 400 });
    const limit = Math.max(1, Math.min(50, Number(body?.limit) || 50));
    const { candidates, counts } = await buildFinishNudgeQueue(sb, { only });
    const batch = candidates.slice(0, limit);
    const results: Array<{ slug: string; to: string; ok: boolean; error?: string }> = [];
    for (const c of batch) {
      const res = await sendMail({ from: FROM, to: c.to, replyTo: OPERATOR_EMAIL, subject: c.email.subject, text: c.email.text, html: c.email.html });
      if (res.ok) await markFinishNudgeSent(sb, c.id, res.id);
      results.push({ slug: c.slug, to: c.to, ok: res.ok, error: res.error });
    }
    const sentTo = results.filter((r) => r.ok).map((r) => r.to);
    if (sentTo.length) {
      await logSend(sb, { channel: 'finish_nudge', action: 'send', recipients: sentTo, subject: batch[0]?.email.subject, note: `finish_nudge_v1 batch of ${sentTo.length}` });
    }
    return NextResponse.json({ ok: true, counts, sent: sentTo.length, results });
  }

  return NextResponse.json({ error: `unknown mode ${mode}` }, { status: 400 });
}
