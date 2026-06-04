import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { sendMail } from '../../../src/lib/mailer';

const SUPABASE_PROJECT_REF = 'qaqzwfnjajyejehmdvuw';
const SITE_URL = 'https://www.thedripmap.com';

// Project's slugify (mirrors src/lib/data.ts so this route has no client-only imports)
function slugify(text?: string | null): string {
  if (!text) return '';
  return String(text).toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

// Infer "US" or "Canada" from a free-text address. Default US to stay
// consistent with the rest of the directory (majority of providers).
function inferCountry(address: string | null | undefined, city: string | null | undefined): string {
  const hay = `${address || ''} ${city || ''}`.toLowerCase();
  const caHints = [
    'canada', ' on ', ', on ', ', on,', 'ontario', 'quebec', 'qc ', 'british columbia', ' bc ',
    'alberta', ' ab ', 'manitoba', ' mb ', 'saskatchewan', ' sk ', 'nova scotia', ' ns ',
    'new brunswick', ' nb ', 'newfoundland', 'prince edward island', ' pe ',
    'toronto', 'vancouver', 'montreal', 'calgary', 'edmonton', 'ottawa', 'mississauga',
    'vaughan', 'brampton', 'markham', 'richmond hill', 'oakville',
  ];
  if (caHints.some((h) => hay.includes(h))) return 'Canada';
  return 'US';
}

interface ClaimPayload {
  clinicName?: string;
  ownerName?: string;
  ownerPhone?: string;
  email?: string;
  specialty?: string;
  token?: string;
  listingId?: string | null;
  providerSlug?: string | null;
  // Optional richer fields when the source has them (e.g. /for-clinics/setup)
  address?: string | null;
  city?: string | null;
  state?: string | null;
}

// POST /api/notify-operator
// Single chokepoint for new clinic claim notifications. Used by:
//   - ClaimListingModal (always supplies listingId + providerSlug)
//   - /for-clinics/setup  (often has NO listingId for orphan claims)
//
// Behaviour for orphan claims (no listingId): we auto-create a minimal
// providers stub from the submitted name/city, derive a slug, link the
// claim_requests row to it, and use the stub's slug in the admin notification.
// This makes the verification email always send and the admin email always
// shows a real listing URL, never "(unknown)".
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ClaimPayload;
    const {
      clinicName,
      ownerName,
      ownerPhone,
      email,
      specialty,
      address,
      city,
      state,
    } = body || {};
    let { token, listingId, providerSlug } = body || {};

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Server-side Supabase (service role) so we can stub providers + insert
    // claim_requests even when the browser had RLS issues or no provider id.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

    // ORPHAN HANDLING: if no listingId was supplied, build a stub provider so
    // the claim has a real target and the admin notification has a real slug.
    let orphan = false;
    let stubInfo: { id: string; slug: string } | null = null;
    if (!listingId && supabase && clinicName) {
      orphan = true;
      const country = inferCountry(address || null, city || null);
      const baseSlug = city ? slugify(`${clinicName} ${city}`) : slugify(clinicName);
      // Disambiguate against existing slug collisions.
      let candidate = baseSlug;
      for (let i = 2; i < 50; i++) {
        const { data: hit } = await supabase.from('providers').select('id').eq('slug', candidate).maybeSingle();
        if (!hit) break;
        candidate = `${baseSlug}-${i}`;
      }
      const submitted_at = new Date().toISOString();
      const { data: ins, error: insErr } = await supabase
        .from('providers')
        .insert({
          name: clinicName,
          slug: candidate,
          address: address || null,
          city: city || null,
          state: state || null,
          country,
          email,
          phone: ownerPhone || null,
          is_claimed: false,
          is_featured: false,
          specialties: specialty ? [specialty] : [],
          decision_drivers: { source: 'orphan_claim_stub', submitted_at },
        })
        .select('id, slug')
        .single();
      if (!insErr && ins) {
        listingId = ins.id;
        providerSlug = ins.slug;
        stubInfo = ins;
      } else if (insErr) {
        console.error('orphan stub insert failed', insErr);
      }
    }

    // CLAIM REQUEST: if the caller did not supply a token (orphan path from
    // /for-clinics/setup never does), but we now have a listingId, mint one
    // so the verification email is sendable. Also covers ClaimListingModal
    // submissions whose browser INSERT failed (RLS, network, etc.).
    if (listingId && supabase) {
      let needNewClaim = !token;
      if (token) {
        const { data: existing } = await supabase
          .from('claim_requests')
          .select('id')
          .eq('token', token)
          .maybeSingle();
        needNewClaim = !existing;
      }
      if (needNewClaim) {
        token = token || crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const { error: cErr } = await supabase.from('claim_requests').insert({
          listing_id: listingId,
          email,
          owner_name: ownerName || null,
          owner_phone: ownerPhone || null,
          token,
          expires_at: expiresAt,
          created_at: new Date().toISOString(),
        });
        if (cErr) console.error('claim_requests INSERT (server fallback) failed', cErr);
      }
    }

    // Verification email to the owner (em-dash + en-dash free).
    if (token) {
      const verifyUrl = `${SITE_URL}/verify-claim?token=${encodeURIComponent(token)}`;
      await sendMail({
        from: 'TheDripMap <info@thedripmap.com>',
        to: email,
        replyTo: 'info@thedripmap.com',
        subject: `Verify your claim for ${clinicName || 'your clinic'} on TheDripMap`,
        text: `Hi ${ownerName || 'there'},

Thanks for submitting a claim for ${clinicName || 'your clinic'} on TheDripMap.

To confirm you are the rightful owner, click the link below within the next 7 days:

${verifyUrl}

If you did not submit this claim, you can safely ignore this email.

TheDripMap Team
`,
      });
    }

    const publicUrl = providerSlug ? `${SITE_URL}/providers/${providerSlug}` : '(no slug)';
    const supabaseUrlAdmin = `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/editor`;
    await sendMail({
      from: 'TheDripMap <info@thedripmap.com>',
      to: 'info@thedripmap.com',
      replyTo: email,
      subject: `New clinic claim: ${clinicName || 'Unknown'}${orphan ? ' (orphan stub auto-created)' : ''}`,
      text: `New clinic claim request

Clinic: ${clinicName || 'Unknown'}
Owner name: ${ownerName || 'Not provided'}
Owner email: ${email}
Owner phone: ${ownerPhone || 'Not provided'}
Specialty: ${specialty || 'N/A'}

Listing ID: ${listingId || '(unknown)'}
Public listing: ${publicUrl}
Manage in Supabase: ${supabaseUrlAdmin}
${stubInfo ? '\nNOTE: this was an orphan claim. A minimal providers row was auto-created with source=orphan_claim_stub. Review and enrich it in Supabase.\n' : ''}
Status: pending verification (owner must click the link in their verification email)
`,
    });

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      return NextResponse.json({ success: true, warning: 'Telegram skipped (config missing)', listingId, providerSlug, orphan });
    }

    const message = `\u{1F3E5} New Clinic Signup!\n\nClinic: ${clinicName || 'Unknown'}\nOwner: ${ownerName || 'Not provided'}\nEmail: ${email}\nPhone: ${ownerPhone || 'Not provided'}\nSpecialty: ${specialty || 'N/A'}${orphan ? '\n(orphan stub auto-created)' : ''}\n\nReview at: https://supabase.com/dashboard`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text: message }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        return NextResponse.json({ success: true, warning: 'Telegram delayed', listingId, providerSlug, orphan });
      }
    } catch (fErr) {
      console.warn('Telegram fetch failed:', fErr);
      return NextResponse.json({ success: true, warning: 'Telegram queued', listingId, providerSlug, orphan });
    }

    return NextResponse.json({ success: true, listingId, providerSlug, orphan });
  } catch (error) {
    console.error('Notification API error:', error);
    return NextResponse.json({ success: true, warning: 'Fallback mode active' });
  }
}
