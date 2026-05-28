import { NextResponse } from 'next/server';
import { getServiceSupabase } from '../../../../src/lib/supabase';
import { sendMail } from '../../../../src/lib/mailer';
import type { BrandVoiceResult } from '../route';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function buildKit(clinicName: string, r: BrandVoiceResult): string {
  const lines: string[] = [];
  lines.push(`Your TheDripMap copy kit — ${clinicName}`);
  lines.push('');
  lines.push('LISTING DESCRIPTION');
  lines.push(r.listingDescription);
  lines.push('');
  lines.push('GOOGLE BUSINESS "ABOUT"');
  lines.push(r.gbpAbout);
  lines.push('');
  lines.push('INSTAGRAM BIO');
  lines.push(r.instagramBio);
  lines.push('');
  lines.push('INSTAGRAM CAPTIONS');
  (r.instagramCaptions || []).forEach((c) => {
    lines.push(`  [${c.tone}] ${c.text}`);
    lines.push('');
  });
  lines.push('WELCOME EMAIL');
  lines.push(`Subject: ${r.welcomeEmail?.subject || ''}`);
  lines.push(r.welcomeEmail?.paragraph || '');
  lines.push('');
  lines.push('WEBSITE HERO HEADLINE');
  lines.push(r.heroHeadline);
  lines.push('');
  lines.push('TAGLINE');
  lines.push(r.tagline);
  lines.push('');
  lines.push('—');
  lines.push('Generated free at https://www.thedripmap.com/tools/brand-voice');
  lines.push('Claim your free listing to publish this copy: https://www.thedripmap.com/for-clinics');
  return lines.join('\n');
}

export async function POST(req: Request) {
  let body: { email?: string; clinicName?: string; city?: string; result?: BrandVoiceResult };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const email = (body.email || '').trim().toLowerCase();
  const clinicName = (body.clinicName || '').trim();
  const city = (body.city || '').trim();
  const result = body.result;
  if (!isEmail(email)) return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  if (!result || !result.listingDescription) return NextResponse.json({ error: 'Missing generated copy.' }, { status: 400 });

  const sb = getServiceSupabase();

  // 1. Save lead (mirrors inquiries pattern; [BRAND VOICE] marker surfaces in /admin/leads).
  let leadSaved = false;
  try {
    const { error } = await sb.from('inquiries').insert({
      name: clinicName || 'Brand Voice Lead',
      email,
      phone: null,
      message: `[BRAND VOICE] clinic=${clinicName || '(n/a)'} city=${city || '(n/a)'}`,
      listing_id: null,
      created_at: new Date().toISOString(),
    });
    leadSaved = !error;
    if (error) console.error('brand-voice lead insert error:', error.message);
  } catch (err) {
    console.error('brand-voice lead insert threw:', err);
  }

  // 2. Email the copy kit (best-effort).
  const kit = buildKit(clinicName || 'your clinic', result);
  let emailed = false;
  try {
    const mail = await sendMail({
      from: 'TheDripMap <info@thedripmap.com>',
      to: email,
      replyTo: 'info@thedripmap.com',
      subject: `Your TheDripMap copy kit${clinicName ? ` — ${clinicName}` : ''}`,
      text: kit,
    });
    emailed = mail.ok;
    if (!mail.ok) console.error('brand-voice email failed:', mail.error);
  } catch (err) {
    console.error('brand-voice email threw:', err);
  }

  // 3. Notify the team.
  try {
    await sendMail({
      from: 'TheDripMap <info@thedripmap.com>',
      to: 'info@thedripmap.com',
      subject: `[Brand Voice lead] ${email}${clinicName ? ` — ${clinicName}` : ''}`,
      text: `New brand-voice lead.\n\nEmail: ${email}\nClinic: ${clinicName || '(n/a)'}\nCity: ${city || '(n/a)'}\n\n${kit}`,
    });
  } catch (err) {
    console.error('brand-voice notify threw:', err);
  }

  // 4. Does this email belong to a claimed clinic? If so, surface their listing.
  let claimedListing: { name: string; slug: string | null; city: string | null } | null = null;
  try {
    const { data: prof } = await sb.from('operator_profiles').select('clinic_id').eq('email', email).maybeSingle();
    if (prof?.clinic_id) {
      const { data: prov } = await sb
        .from('providers')
        .select('name, slug, city, is_featured')
        .eq('id', prof.clinic_id)
        .maybeSingle();
      if (prov?.is_featured) claimedListing = { name: prov.name, slug: prov.slug, city: prov.city };
    }
  } catch (err) {
    console.error('brand-voice claimed-email check threw:', err);
  }

  return NextResponse.json({ ok: true, leadSaved, emailed, claimedListing });
}
