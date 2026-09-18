/**
 * POST /api/admin/send-mail   { to, subject, text, replyTo?, cc? }
 *
 * One-off operator replies to clinic owners, sent through the platform's OWN
 * mailer instead of the Gmail API. Why this exists (2026-09-10): a reply sent
 * through the Gmail connector had every bare URL rewritten into a raw
 * "https://www.google.com/url?q=..." redirect string, so the owner saw a
 * garbled link. Our mailer renders real anchors; via Workspace SMTP the message
 * still lands in info@'s Sent folder.
 *
 * Plain text in, plus a minimal HTML rendering where bare URLs become clean
 * <a> links. Not for bulk: one recipient per call, logged, never scheduled.
 * Auth: admin cookie or the operator-side machine token.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminRequest } from '../../../../src/lib/admin-auth';
import { machineTokenOk } from '../../../../src/lib/machine-token';
import { sendMail } from '../../../../src/lib/mailer';
import { logSend } from '../../../../src/lib/send-log';
import { textToHtml, toPlainText } from '../../../../src/lib/email-render';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FROM = 'TheDripMap <info@thedripmap.com>';
const OPERATOR_EMAIL = 'info@thedripmap.com';

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest()) && !machineTokenOk(req.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const to = String(body?.to || '').trim();
  const subject = String(body?.subject || '').trim();
  const text = String(body?.text || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to) || !subject || !text) {
    return NextResponse.json({ error: 'to, subject and text are required' }, { status: 400 });
  }
  if (/[–—]/.test(text)) return NextResponse.json({ error: 'no en/em dashes in outgoing copy' }, { status: 400 });
  const cc = typeof body?.cc === 'string' && body.cc ? body.cc : undefined;
  const res = await sendMail({
    from: FROM,
    to,
    ...(cc ? { cc } : {}),
    replyTo: typeof body?.replyTo === 'string' && body.replyTo ? body.replyTo : OPERATOR_EMAIL,
    subject,
    text: toPlainText(text),
    html: textToHtml(text),
  });
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  await logSend(sb, { channel: 'partb', action: 'send', recipients: [to], subject, note: `operator reply via send-mail (${res.provider})` });
  return NextResponse.json({ ok: res.ok, provider: res.provider, id: res.id, error: res.error }, { status: res.ok ? 200 : 500 });
}
