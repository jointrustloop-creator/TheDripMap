// E2E for the orphan-claim flow.
//
// Submits a claim for a clinic name that DOES NOT match any existing provider
// row and asserts that:
//   (a) a claim_requests row is created and links to a real listing_id
//   (b) a providers stub is auto-created with decision_drivers.source='orphan_claim_stub'
//   (c) the admin notification contains a real slug / public listing URL
//
// We do NOT verify the SMTP send itself in this test (SMTP fires from the
// Vercel function, the assertion of "real slug in admin email" is satisfied
// by checking the response payload + DB state). This avoids accidentally
// emailing info@thedripmap.com on every CI run.
//
// Rollback at the end deletes the stub provider + claim_request so we don't
// pollute the directory.
//
// Run: node scripts/e2e-orphan-claim-flow.cjs
require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');

const SITE = 'https://www.thedripmap.com';
const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Unique-per-run inputs so re-runs are isolated and never collide with each other
const RUN_ID = Date.now().toString(36);
const ORPHAN_NAME = `E2E Orphan Clinic ${RUN_ID}`;
const ORPHAN_EMAIL = `e2e-orphan-${RUN_ID}@thedripmap.com`;
const ORPHAN_CITY = 'E2E City';

function step(name, ok, detail = '') {
  console.log(`${ok ? '✓ PASS' : '✗ FAIL'} — ${name}${detail ? ' — ' + detail : ''}`);
  return ok;
}

(async () => {
  let createdProviderId = null;
  let createdClaimId = null;
  const results = [];

  try {
    console.log('================= E2E ORPHAN CLAIM FLOW TEST =================\n');
    console.log(`Run ID: ${RUN_ID}`);
    console.log(`Orphan clinic name: ${ORPHAN_NAME}`);
    console.log(`Orphan email      : ${ORPHAN_EMAIL}`);

    // STEP 0: Confirm no provider currently matches this name (sanity)
    console.log('\n[STEP 0] Confirm no existing provider matches orphan name...');
    const { data: pre } = await s.from('providers').select('id').eq('name', ORPHAN_NAME).limit(1);
    results.push(step('No existing provider with orphan name (pre-flight)', !pre || pre.length === 0));

    // STEP 1: Hit /api/notify-operator with NO listingId, NO token, NO slug.
    // This is the exact payload shape the /for-clinics/setup page sends for an
    // orphan claim (operator typed in a clinic name we don't have).
    console.log('\n[STEP 1] POST /api/notify-operator with orphan payload...');
    const notifyRes = await fetch(`${SITE}/api/notify-operator`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinicName: ORPHAN_NAME,
        ownerName: 'E2E Orphan Owner',
        ownerPhone: '5555550111',
        email: ORPHAN_EMAIL,
        specialty: 'IV therapy',
        city: ORPHAN_CITY,
        // intentionally no token / listingId / providerSlug
      }),
    });
    const notifyBody = await notifyRes.json();
    results.push(step('notify-operator returned 200', notifyRes.status === 200,
      JSON.stringify(notifyBody).slice(0, 160)));
    results.push(step('Response says orphan=true', notifyBody?.orphan === true,
      `orphan=${notifyBody?.orphan}`));
    results.push(step('Response includes a real providerSlug',
      typeof notifyBody?.providerSlug === 'string' && notifyBody.providerSlug.length > 0,
      `slug=${notifyBody?.providerSlug}`));
    results.push(step('Response includes a real listingId',
      typeof notifyBody?.listingId === 'string' && notifyBody.listingId.length > 0,
      `listingId=${notifyBody?.listingId}`));
    createdProviderId = notifyBody?.listingId || null;

    // STEP 2: Confirm the stub providers row was created with the right marker.
    if (createdProviderId) {
      console.log('\n[STEP 2] Verify stub providers row...');
      const { data: prov } = await s.from('providers')
        .select('id, slug, name, email, city, is_claimed, is_featured, decision_drivers')
        .eq('id', createdProviderId)
        .maybeSingle();
      results.push(step('Stub provider row exists', !!prov,
        prov ? `slug=${prov.slug}` : 'NOT FOUND'));
      results.push(step('Stub has is_claimed=false', prov?.is_claimed === false));
      results.push(step('Stub has is_featured=false', prov?.is_featured === false));
      results.push(step('Stub decision_drivers.source = orphan_claim_stub',
        prov?.decision_drivers?.source === 'orphan_claim_stub',
        `source=${prov?.decision_drivers?.source}`));
      results.push(step('Stub email matches submission', prov?.email === ORPHAN_EMAIL));
    }

    // STEP 3: Confirm claim_requests row exists, is linked to the stub, and is pending.
    console.log('\n[STEP 3] Verify claim_requests row...');
    const { data: claim } = await s.from('claim_requests')
      .select('id, listing_id, email, owner_name, owner_phone, token, status, expires_at')
      .eq('email', ORPHAN_EMAIL)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    results.push(step('claim_requests row created for orphan email', !!claim,
      claim ? `id=${claim.id}` : 'NOT FOUND'));
    results.push(step('claim_requests.listing_id === stub provider id',
      claim?.listing_id === createdProviderId));
    results.push(step('claim_requests has a valid token',
      typeof claim?.token === 'string' && claim.token.length > 10));
    results.push(step('claim_requests.status is pending or null',
      claim?.status === null || claim?.status === 'pending'));
    createdClaimId = claim?.id || null;

    // STEP 4: Admin notification payload sanity. The route returns the slug,
    // so the admin notification email is guaranteed to use it.
    console.log('\n[STEP 4] Admin notification carries a real slug (not "(unknown)")...');
    results.push(step('providerSlug in notify response is not literal "(no slug)"',
      notifyBody?.providerSlug && notifyBody.providerSlug !== '(no slug)'));

  } catch (err) {
    console.log(`\n!!! UNEXPECTED ERROR: ${err.message}`);
    results.push(step('No unexpected error thrown', false, err.message));
  } finally {
    // STEP 5: Roll back so the directory isn't polluted by test stubs.
    console.log('\n[STEP 5] Rolling back...');
    if (createdClaimId) {
      const { error } = await s.from('claim_requests').delete().eq('id', createdClaimId);
      step('Deleted test claim_requests row', !error, error?.message);
    }
    if (createdProviderId) {
      const { error } = await s.from('providers').delete().eq('id', createdProviderId);
      step('Deleted test stub provider row', !error, error?.message);
    }

    const passed = results.filter(Boolean).length;
    const total = results.length;
    console.log(`\n=================== RESULT: ${passed}/${total} passed ===================`);
    if (passed < total) process.exit(1);
  }
})();
