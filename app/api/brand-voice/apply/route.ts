import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServiceSupabase } from '../../../../src/lib/supabase';
import { sendMail } from '../../../../src/lib/mailer';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

const SITE = 'https://www.thedripmap.com';
const TTL_MS = 60 * 60 * 1000; // 1 hour

function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

// POST /api/brand-voice/apply
// A claimed clinic owner requests to apply generated copy to their listing.
// We verify the entered email matches the email the listing was claimed with,
// stash a one-time token + the copy in operator_profiles.profile_data, and email
// the owner a magic link. The link (handled by /apply-copy) actually writes the
// description — so applying requires both the claimed email AND inbox access.
export async function POST(req: Request) {
  let body: { slug?: string; email?: string; listingDescription?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const slug = (body.slug || '').trim();
  const email = (body.email || '').trim().toLowerCase();
  const listingDescription = (body.listingDescription || '').trim();
  if (!slug || !isEmail(email) || !listingDescription) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }

  const sb = getServiceSupabase();

  const { data: provider } = await sb
    .from('providers')
    .select('id, name, slug, is_featured')
    .eq('slug', slug)
    .maybeSingle();
  if (!provider || !provider.is_featured) {
    return NextResponse.json({ error: 'This listing isn\'t a claimed listing.' }, { status: 404 });
  }

  const { data: prof } = await sb
    .from('operator_profiles')
    .select('id, email, profile_data')
    .eq('clinic_id', provider.id)
    .maybeSingle();
  if (!prof || !prof.email) {
    return NextResponse.json({ error: 'We couldn\'t find an owner profile for this listing. Email info@thedripmap.com and we\'ll help.' }, { status: 404 });
  }
  if (String(prof.email).trim().toLowerCase() !== email) {
    return NextResponse.json({ error: 'That email doesn\'t match the email this listing was claimed with. Use your claimed email, or contact info@thedripmap.com.' }, { status: 403 });
  }

  const token = crypto.randomBytes(24).toString('hex');
  const newPd = {
    ...(prof.profile_data || {}),
    pendingBrandVoice: { token, oneLiner: listingDescription, expiresAt: Date.now() + TTL_MS },
  };
  const { error: updErr } = await sb.from('operator_profiles').update({ profile_data: newPd }).eq('id', prof.id);
  if (updErr) {
    return NextResponse.json({ error: 'Could not start the apply request. Please try again.' }, { status: 500 });
  }

  const link = `${SITE}/apply-copy?c=${provider.id}&t=${token}`;
  let sent = false;
  try {
    const mail = await sendMail({
      from: 'TheDripMap <info@thedripmap.com>',
      to: prof.email,
      replyTo: 'info@thedripmap.com',
      subject: `Apply your new copy to ${provider.name}`,
      text: `Hi,

You asked to apply newly generated copy to your TheDripMap listing for ${provider.name}.

Click to confirm and publish it to your listing (link expires in 1 hour):
${link}

The new listing description will be:
"${listingDescription}"

If you didn't request this, you can ignore this email — nothing will change.

— TheDripMap`,
    });
    sent = mail.ok;
  } catch (err) {
    console.error('brand-voice apply email threw:', err);
  }

  return NextResponse.json({ ok: true, sent, email: prof.email });
}
