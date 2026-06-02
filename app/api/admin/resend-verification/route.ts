import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMail } from '../../../../src/lib/mailer';

const SITE_URL = 'https://www.thedripmap.com';

// POST /api/admin/resend-verification
//   Headers: Authorization: Bearer $CRON_SECRET
//   Body:    { claim_request_id: string } OR { email: string }
//
// Re-fires the BEFORE-verify verification email for a given claim_request.
// Used to rescue orphan claims (where the original /api/notify-operator call
// failed to send) and as a manual fallback whenever an owner reports they
// never received their verification email. Bearer-auth so the operator can
// fire from a plain shell without a browser session.
//
// All copy here is em-dash + en-dash free.
export async function POST(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  if ((req.headers.get('authorization') || '') !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase env missing' }, { status: 500 });
  }
  const supabase = createClient(supabaseUrl, supabaseKey);

  let body: { claim_request_id?: string; email?: string } = {};
  try { body = await req.json(); } catch { /* allow empty body */ }

  // Resolve the target claim_request: either by id or by email (latest pending).
  let claim: { id: string; listing_id: string; email: string; owner_name: string | null; token: string; expires_at: string; status: string | null } | null = null;
  if (body.claim_request_id) {
    const { data } = await supabase
      .from('claim_requests')
      .select('id, listing_id, email, owner_name, token, expires_at, status')
      .eq('id', body.claim_request_id)
      .maybeSingle();
    claim = data;
  } else if (body.email) {
    const { data } = await supabase
      .from('claim_requests')
      .select('id, listing_id, email, owner_name, token, expires_at, status')
      .eq('email', body.email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    claim = data;
  } else {
    return NextResponse.json({ error: 'Must supply claim_request_id or email' }, { status: 400 });
  }

  if (!claim) {
    return NextResponse.json({ error: 'claim_request not found' }, { status: 404 });
  }
  if (claim.status === 'verified') {
    return NextResponse.json({ error: 'claim already verified', claim_id: claim.id }, { status: 409 });
  }
  if (new Date(claim.expires_at) < new Date()) {
    return NextResponse.json({ error: 'claim token expired', claim_id: claim.id }, { status: 410 });
  }

  // Look up clinic name for the email subject + body.
  const { data: prov } = await supabase
    .from('providers')
    .select('name')
    .eq('id', claim.listing_id)
    .maybeSingle();
  const clinicName = prov?.name || 'your clinic';
  const verifyUrl = `${SITE_URL}/verify-claim?token=${encodeURIComponent(claim.token)}`;

  // Em-dash and en-dash free. Mirrors notify-operator's verification copy but
  // is the canonical "before verify" template for re-sends going forward.
  const text = `Hi ${claim.owner_name || 'there'},

Thanks for submitting a claim for ${clinicName} on TheDripMap.

To confirm you are the rightful owner, click the link below within the next 7 days:

${verifyUrl}

If you did not submit this claim, you can safely ignore this email.

The TheDripMap Team
`;

  const result = await sendMail({
    from: 'TheDripMap <info@thedripmap.com>',
    to: claim.email,
    replyTo: 'info@thedripmap.com',
    subject: `Verify your claim for ${clinicName} on TheDripMap`,
    text,
  });

  return NextResponse.json({
    ok: result.ok,
    provider: result.provider,
    error: result.error,
    verify_url: verifyUrl,
    claim_id: claim.id,
    listing_id: claim.listing_id,
    to: claim.email,
  });
}
