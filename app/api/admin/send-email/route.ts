import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { isAdminRequest } from '../../../../src/lib/admin-auth';

// Admin-only generic Resend sender. Used for one-off outreach tests.
// Cookie-protected so it can't be abused as an open relay.
export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 });
  }

  try {
    const data = await req.json();
    const from = String(data?.from || 'TheDripMap <notifications@thedripmap.com>');
    const to = String(data?.to || '').trim();
    const replyTo = data?.replyTo ? String(data.replyTo).trim() : undefined;
    const subject = String(data?.subject || '').trim();
    const text = String(data?.text || '').trim();

    if (!to || !subject || !text) {
      return NextResponse.json(
        { error: 'Missing to, subject, or text' },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return NextResponse.json({ error: 'Invalid to address' }, { status: 400 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from,
      to,
      ...(replyTo ? { replyTo } : {}),
      subject,
      text,
    });

    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error('admin/send-email error', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
