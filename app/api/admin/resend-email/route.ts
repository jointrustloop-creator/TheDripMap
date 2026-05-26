import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../../src/lib/admin-auth';

// Admin-only diagnostic. Fetches a single email's delivery status from
// Resend's API so we can tell whether a message that returned 200 from the
// send endpoint was actually delivered, bounced, or is still queued.
// Usage: GET /api/admin/resend-email?id=<resend-message-id>
export async function GET(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing ?id=' }, { status: 400 });

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 });
  }

  try {
    const res = await fetch(`https://api.resend.com/emails/${id}`, {
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    });
    const data = await res.json();
    return NextResponse.json({ status: res.status, data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// Also list recent emails — useful when we don't have a specific ID
// Usage: GET /api/admin/resend-email?list=1
export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 });
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    });
    const data = await res.json();
    return NextResponse.json({ status: res.status, data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
