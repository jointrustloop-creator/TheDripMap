import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMail } from '../../../src/lib/mailer';
import { manageUrlForProvider } from '../../../src/lib/manage-token';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/resend-finish-link   body: { providerId: string, email: string }
//
// Self-serve "send me my finish link" for a claimed clinic owner who never
// completed their profile, so we stop chasing them with reminder emails.
//
// SECURITY: the finish link grants edit access, so it is ONLY ever sent to the
// owner email ALREADY ON FILE for that listing's verified claim. The visitor's
// entered email must match the on-file email; if it does not, nothing is sent.
// We always return the same generic success, so the endpoint cannot be used to
// probe which email owns a clinic (password-reset-style behaviour).
//
// All copy here is em-dash and en-dash free, per the content rule.
const GENERIC = {
  ok: true,
  message: 'If that email is the one on file for this clinic, we just sent your private finish link to it. Check your inbox.',
};

export async function POST(req: Request) {
  let body: { providerId?: string; email?: string } = {};
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }); }

  const providerId = typeof body.providerId === 'string' ? body.providerId.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!providerId || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'providerId and a valid email are required' }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json(GENERIC); // never leak config state

  try {
    const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

    const { data: prov } = await sb
      .from('providers')
      .select('id, name, email, is_claimed')
      .eq('id', providerId)
      .maybeSingle();
    // Only a claimed listing has an owner to resend to.
    if (!prov || (prov as { is_claimed?: boolean }).is_claimed !== true) return NextResponse.json(GENERIC);

    // Owner email on file = the verified claim's email, falling back to the
    // listing email for grandfathered claims that never went through the form.
    const { data: claim } = await sb
      .from('claim_requests')
      .select('email')
      .eq('listing_id', providerId)
      .eq('status', 'verified')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const onFile = ((claim?.email as string | undefined) || (prov as { email?: string }).email || '').trim().toLowerCase();

    // No match -> send nothing, return the same generic reply.
    if (!onFile || onFile !== email) return NextResponse.json(GENERIC);

    const link = await manageUrlForProvider(sb, providerId);
    if (!link) return NextResponse.json(GENERIC);

    await sendMail({
      from: 'TheDripMap <info@thedripmap.com>',
      to: onFile,
      replyTo: 'info@thedripmap.com',
      subject: `Your private link to finish ${(prov as { name?: string }).name || 'your clinic'} on TheDripMap`,
      text: `Hi,

Here is your private link to finish your TheDripMap listing for ${(prov as { name?: string }).name || 'your clinic'}:

${link}

Open it to complete your profile and your safety questionnaire. Once you submit it, we review and add the Safety Verified badge to your listing, which makes it stand out to patients searching your city.

This link is private to you. If you did not request it, you can safely ignore this email.

TheDripMap Team
`,
    });

    return NextResponse.json(GENERIC);
  } catch {
    return NextResponse.json(GENERIC); // never surface internals
  }
}
