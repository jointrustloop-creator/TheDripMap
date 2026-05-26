import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../../src/lib/admin-auth';
import { sendMail } from '../../../../src/lib/mailer';

// Admin-only generic email sender. Uses the shared mailer (SMTP first,
// Resend fallback). Cookie-protected so it can't be abused as an open relay.
export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await req.json();
    const from = String(data?.from || 'TheDripMap <info@thedripmap.com>');
    const to = String(data?.to || '').trim();
    const replyTo = data?.replyTo ? String(data.replyTo).trim() : undefined;
    const subject = String(data?.subject || '').trim();
    const text = String(data?.text || '').trim();

    if (!to || !subject || !text) {
      return NextResponse.json({ error: 'Missing to, subject, or text' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return NextResponse.json({ error: 'Invalid to address' }, { status: 400 });
    }

    const result = await sendMail({ from, to, replyTo, subject, text });
    return NextResponse.json(result);
  } catch (err) {
    console.error('admin/send-email error', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
