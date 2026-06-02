// PART A rescue script for Tri-Health Wellness Centre (Vaughan, ON).
//
// Real organic claim landed 2026-06-02 17:21 UTC at /for-clinics/setup with
// no matching provider, so the admin notification said "Listing ID: (unknown)"
// and no verification email was sent. This script:
//   1. Geocodes the address via Nominatim (no API key needed).
//   2. Inserts a `providers` row with the verified details from the task.
//   3. Inserts a `claim_requests` row tied to this new provider and to the
//      submission email (so the standard /verify-claim?token=... flow works).
//   4. Prints the verify URL + the curl command the operator runs to fire
//      the verification email via the new /api/admin/resend-verification
//      endpoint.
//
// SAFETY: idempotent — if a provider with this exact name+city already exists,
// the script reuses it. If a pending claim_request already exists for this
// email + listing, the script reuses it. No double inserts.
//
// Run: node scripts/_rescue-trihealth.cjs
require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase env vars'); process.exit(1);
}
const s = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const SITE = 'https://www.thedripmap.com';

// Verified details exactly as the operator specified.
const T = {
  name: 'Tri-Health Wellness Centre',
  address: '8611 Weston Rd #4, Woodbridge, ON L4L 9P1',
  city: 'Vaughan',
  state: 'Ontario',
  country: 'Canada',
  postal_code: 'L4L 9P1',
  phone: '(905) 605-9355',
  website: 'https://www.trihealth.ca',
  booking: 'https://trihealth.janeapp.com',
  email: 'admin@trihealth.ca',
  description:
    'Naturopath-led integrative clinic in Vaughan offering IV therapy, vitamin and IM injections, hydration support, immune and energy drips, beauty and glow drips, and athletic recovery. Co-founded by Dr. Jason Granzotto, ND and Dr. Maria Granzotto, ND.',
  specialties: [
    'IV therapy',
    'Vitamin / IM injections',
    'Hydration',
    'Immune support',
    'Energy + NAD+',
    'Beauty + glow',
    'Athletic recovery',
  ],
  regulatorOverride: 'College of Naturopaths of Ontario (CONO)',
};

// Project's slugify (mirrored from src/lib/data.ts to avoid an ESM import dance)
function slugify(text) {
  if (!text) return '';
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'TheDripMap-Rescue/1.0 (info@thedripmap.com)',
      'Accept-Language': 'en',
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  const lat = Number(data[0].lat); const lng = Number(data[0].lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

(async () => {
  console.log('===== Tri-Health rescue =====\n');

  // 0) Verify regulator_override column exists. If not, abort with paste
  // instructions — the rescue would lose the regulator detail otherwise.
  const { error: colErr } = await s.from('providers').select('regulator_override').limit(1);
  if (colErr) {
    console.log('!! providers.regulator_override column missing. Paste this into the Supabase SQL editor:');
    console.log('   ALTER TABLE providers ADD COLUMN IF NOT EXISTS regulator_override TEXT;');
    console.log('Then re-run this script. Halting to avoid losing the regulator detail.');
    process.exit(1);
  }
  console.log('OK regulator_override column present.');

  // 1) Geocode the address.
  console.log('Geocoding address...');
  let coords = await geocode(`${T.address}, ${T.city}, ${T.state}, ${T.country}`);
  if (!coords) {
    // fallback: street + postal code is usually highly specific
    coords = await geocode(`${T.address}, ${T.country}`);
  }
  if (!coords) {
    console.log('WARN geocoding failed — falling back to Vaughan city centre.');
    coords = await geocode('Vaughan, Ontario, Canada');
  }
  console.log(`Coords: ${coords?.lat}, ${coords?.lng}`);

  const slug = slugify(`${T.name} ${T.city}`); // tri-health-wellness-centre-vaughan
  console.log(`Slug: ${slug}`);

  // 2) Check for an existing provider with this slug or name+city.
  const { data: existingBySlug } = await s.from('providers').select('id, slug, name').eq('slug', slug).maybeSingle();
  let providerId;
  if (existingBySlug) {
    console.log('Existing provider found:', existingBySlug);
    providerId = existingBySlug.id;
  } else {
    const payload = {
      name: T.name,
      slug,
      address: T.address,
      city: T.city,
      state: T.state, // store full name; layout normalizes ON
      postal_code: T.postal_code,
      country: T.country,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      phone: T.phone,
      website: T.website,
      email: T.email,
      online_booking_url: T.booking,
      description: T.description,
      specialties: T.specialties,
      is_claimed: false, // owner hasn't verified yet
      is_featured: false,
      regulator_override: T.regulatorOverride,
      decision_drivers: { source: 'organic_claim' },
    };
    console.log('Inserting provider row...');
    const { data: ins, error: insErr } = await s.from('providers').insert(payload).select('id, slug').single();
    if (insErr) { console.error('Insert failed:', insErr); process.exit(1); }
    providerId = ins.id;
    console.log('Inserted provider id=' + providerId);
  }

  // 3) Link / create the claim_request row. Reuse any pending one.
  const { data: existingClaim } = await s.from('claim_requests')
    .select('id, token, status, expires_at')
    .eq('email', T.email)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let claimId, token;
  if (existingClaim && existingClaim.status !== 'verified' && new Date(existingClaim.expires_at) > new Date()) {
    claimId = existingClaim.id;
    token = existingClaim.token;
    console.log('Reusing existing pending claim_request:', claimId);
    // Make sure it's tied to the new provider
    const { error: updErr } = await s.from('claim_requests')
      .update({ listing_id: providerId })
      .eq('id', claimId);
    if (updErr) console.error('Update listing_id failed:', updErr);
  } else {
    token = crypto.randomUUID();
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: insClaim, error: insClaimErr } = await s.from('claim_requests').insert({
      listing_id: providerId,
      email: T.email,
      owner_name: 'Dr. Jason Granzotto, ND',
      owner_phone: T.phone,
      token,
      expires_at: expires,
      created_at: new Date().toISOString(),
    }).select('id').single();
    if (insClaimErr) { console.error('claim_requests insert failed:', insClaimErr); process.exit(1); }
    claimId = insClaim.id;
    console.log('Inserted claim_request id=' + claimId);
  }

  const verifyUrl = `${SITE}/verify-claim?token=${encodeURIComponent(token)}`;
  const listingUrl = `${SITE}/providers/${slug}`;

  console.log('\n===== READY =====');
  console.log('Listing URL :', listingUrl);
  console.log('Verify URL  :', verifyUrl);
  console.log('Claim ID    :', claimId);
  console.log('\nNow fire the verification email by running this curl on the operator machine');
  console.log('(replace $CRON_SECRET with the value from Vercel envs):');
  console.log('');
  console.log(`  curl -X POST '${SITE}/api/admin/resend-verification' \\`);
  console.log(`    -H 'Authorization: Bearer '"$CRON_SECRET" \\`);
  console.log(`    -H 'Content-Type: application/json' \\`);
  console.log(`    -d '{"claim_request_id":"${claimId}"}'`);
  console.log('');
})();
