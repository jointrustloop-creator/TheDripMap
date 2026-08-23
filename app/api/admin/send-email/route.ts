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
    // HTML body and cc, both needed by the operator format-review rule: a new
    // email format is sent once to info@ with the operator cc'd, and reviewing
    // a design requires seeing the actual HTML, not the plain-text fallback.
    const html = data?.html ? String(data.html) : undefined;
    const ccRaw = Array.isArray(data?.cc) ? data.cc : data?.cc ? [data.cc] : [];
    const cc = ccRaw.map((x: unknown) => String(x).trim()).filter(Boolean);

    if (!to || !subject || !text) {
      return NextResponse.json({ error: 'Missing to, subject, or text' }, { status: 400 });
    }
    const isEmail = (x: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x);
    if (!isEmail(to)) {
      return NextResponse.json({ error: 'Invalid to address' }, { status: 400 });
    }
    const badCc = cc.find((x: string) => !isEmail(x));
    if (badCc) {
      return NextResponse.json({ error: `Invalid cc address: ${badCc}` }, { status: 400 });
    }

    const result = await sendMail({
      from,
      to,
      replyTo,
      subject,
      text,
      ...(html ? { html } : {}),
      ...(cc.length ? { cc } : {}),
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error('admin/send-email error', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
