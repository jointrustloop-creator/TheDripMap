// E2E for the /for-clinics/setup form path.
//
// Simulates a real setup-form submission for a clinic that doesn't exist in
// our DB and asserts the full converged claim flow runs end-to-end:
//   (a) operator_profiles row is created with the submission data
//   (b) claim_requests row is created and links to a real listing_id
//   (c) a providers stub is auto-created with decision_drivers.source =
//       'orphan_claim_stub' (the orphan-claim safety net does its job)
//   (d) the admin notification carries a real slug, not literal "(no slug)"
//
// We do NOT verify SMTP sends here (same pattern as e2e-orphan-claim-flow):
// the route returns the resolved slug + listingId in the JSON response and
// the verification email goes out via Vercel SMTP — assertions on the DB
// state plus the response payload are enough to prove the converged path.
//
// The setup form is a client component that writes operator_profiles via the
// browser supabase client and then POSTs to /api/notify-operator. This test
// simulates that pair of writes against production with the service-role
// key (same way the other two suites do).
//
// Rollback at the end deletes the operator_profile + claim_request + stub
// provider so the directory isn't polluted.
//
// Run: node scripts/e2e-setup-form-flow.cjs
require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');

const SITE = 'https://www.thedripmap.com';
const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Unique-per-run inputs so re-runs are isolated.
const RUN_ID = Date.now().toString(36);
const CLINIC_NAME = `E2E Setup Form Clinic ${RUN_ID}`;
const OWNER_EMAIL = `e2e-setup-${RUN_ID}@thedripmap.com`;
const OWNER_NAME = 'E2E Setup Owner';
const CLINIC_CITY = 'E2E Setup City';

function step(name, ok, detail = '') {
  console.log(`${ok ? '✓ PASS' : '✗ FAIL'} — ${name}${detail ? ' — ' + detail : ''}`);
  return ok;
}

(async () => {
  let createdOperatorProfileId = null;
  let createdProviderId = null;
  let createdClaimId = null;
  const results = [];

  try {
    console.log('================= E2E SETUP-FORM FLOW TEST =================\n');
    console.log(`Run ID         : ${RUN_ID}`);
    console.log(`Clinic name    : ${CLINIC_NAME}`);
    console.log(`Owner email    : ${OWNER_EMAIL}`);

    // STEP 0: Sanity — no existing provider with this name.
    console.log('\n[STEP 0] Confirm no existing provider matches setup-form name...');
    const { data: preProv } = await s.from('providers').select('id').eq('name', CLINIC_NAME).limit(1);
    results.push(step('No existing provider with setup-form name (pre-flight)',
      !preProv || preProv.length === 0));
    const { data: preOp } = await s.from('operator_profiles').select('id').eq('email', OWNER_EMAIL).limit(1);
    results.push(step('No existing operator_profile with setup-form email (pre-flight)',
      !preOp || preOp.length === 0));

    // STEP 1: Simulate the operator_profiles INSERT the setup-form makes
    // from the browser. The setup form does this with the anon key; here we
    // use the service-role key, which exercises the same table + payload.
    console.log('\n[STEP 1] Insert operator_profiles row (mirrors setup-form browser write)...');
    const profilePayload = {
      owner_name: OWNER_NAME,
      email: OWNER_EMAIL,
      profile_data: {
        clinicName: CLINIC_NAME,
        ownerName: OWNER_NAME,
        email: OWNER_EMAIL,
        primarySpecialty: 'IV Therapy',
        additionalServices: ['Energy + NAD+', 'Hydration'],
        environment: 'Medical clinic',
        waitTime: 'By appointment',
        administerType: 'Registered Nurse (RN)',
        medicalDirectorName: 'Dr. E2E Test',
        medicalDirectorCredentials: 'MD',
        yearsInPractice: '5',
        typicalPatientAge: ['25-35'],
        primaryReasons: ['Wellness routine'],
        priceRange: '$150-250',
        walkInsWelcome: false,
        mobileService: false,
        oneLiner: 'E2E setup-form clinic for automated testing.',
        founderStatement: '',
        practitionerPhotoUrl: '',
        user_id: null,
      },
    };
    const { data: opIns, error: opErr } = await s.from('operator_profiles')
      .insert([profilePayload])
      .select();
    results.push(step('operator_profiles INSERT succeeded',
      !opErr && opIns && opIns[0],
      opErr ? opErr.message : `id=${opIns[0].id}`));
    if (opIns && opIns[0]) createdOperatorProfileId = opIns[0].id;

    // STEP 2: POST /api/notify-operator with the SAME enriched payload the
    // patched setup form now sends. listingId / providerSlug intentionally
    // omitted so this exercises the orphan auto-stub path — which is what
    // happens for any submission where the operator typed a clinic name we
    // don't already have.
    console.log('\n[STEP 2] POST /api/notify-operator with setup-form orphan payload...');
    const notifyRes = await fetch(`${SITE}/api/notify-operator`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinicName: CLINIC_NAME,
        ownerName: OWNER_NAME,
        email: OWNER_EMAIL,
        specialty: 'IV Therapy',
        listingId: null,
        providerSlug: null,
        address: null,
        city: CLINIC_CITY,
        state: null,
      }),
    });
    const notifyBody = await notifyRes.json();
    results.push(step('/api/notify-operator returned 200', notifyRes.status === 200,
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

    // STEP 3: Verify the orphan stub providers row was created with the right marker.
    if (createdProviderId) {
      console.log('\n[STEP 3] Verify stub providers row...');
      const { data: prov } = await s.from('providers')
        .select('id, slug, name, email, city, is_claimed, is_featured, decision_drivers')
        .eq('id', createdProviderId)
        .maybeSingle();
      results.push(step('Stub provider row exists', !!prov,
        prov ? `slug=${prov.slug}` : 'NOT FOUND'));
      results.push(step('Stub decision_drivers.source = orphan_claim_stub',
        prov?.decision_drivers?.source === 'orphan_claim_stub',
        `source=${prov?.decision_drivers?.source}`));
      results.push(step('Stub is_claimed=false and is_featured=false (tier-split correct)',
        prov?.is_claimed === false && prov?.is_featured === false,
        `is_claimed=${prov?.is_claimed} is_featured=${prov?.is_featured}`));
      results.push(step('Stub email matches submission', prov?.email === OWNER_EMAIL));
    }

    // STEP 4: Confirm a claim_requests row exists and is linked to the stub.
    console.log('\n[STEP 4] Verify claim_requests row...');
    const { data: claim } = await s.from('claim_requests')
      .select('id, listing_id, email, owner_name, token, status, expires_at')
      .eq('email', OWNER_EMAIL)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    results.push(step('claim_requests row created for setup-form email', !!claim,
      claim ? `id=${claim.id}` : 'NOT FOUND'));
    results.push(step('claim_requests.listing_id === stub provider id',
      claim?.listing_id === createdProviderId));
    results.push(step('claim_requests has a valid verification token',
      typeof claim?.token === 'string' && claim.token.length > 10));
    createdClaimId = claim?.id || null;

    // STEP 5: Admin notification slug sanity — the response payload carries
    // the slug used in the admin email, so we assert it isn't the "(no slug)"
    // dead-end string from before the orphan-stub fix.
    console.log('\n[STEP 5] Admin notification carries a real slug...');
    results.push(step('providerSlug in notify response is not literal "(no slug)"',
      notifyBody?.providerSlug && notifyBody.providerSlug !== '(no slug)'));

    // STEP 6: operator_profile + claim_request agree on the same email +
    // owner_name (the setup form should be writing the same person to both).
    console.log('\n[STEP 6] Cross-check operator_profiles ↔ claim_requests...');
    if (createdOperatorProfileId && claim) {
      const { data: opCheck } = await s.from('operator_profiles')
        .select('owner_name, email')
        .eq('id', createdOperatorProfileId)
        .maybeSingle();
      results.push(step('operator_profile.email === claim_requests.email',
        opCheck?.email === claim.email,
        `${opCheck?.email} vs ${claim.email}`));
    }

  } catch (err) {
    console.log(`\n!!! UNEXPECTED ERROR: ${err.message}`);
    results.push(step('No unexpected error thrown', false, err.message));
  } finally {
    // STEP 7: Roll back so the directory isn't polluted.
    console.log('\n[STEP 7] Rolling back...');
    if (createdClaimId) {
      const { error } = await s.from('claim_requests').delete().eq('id', createdClaimId);
      step('Deleted test claim_requests row', !error, error?.message);
    }
    if (createdProviderId) {
      const { error } = await s.from('providers').delete().eq('id', createdProviderId);
      step('Deleted test stub provider row', !error, error?.message);
    }
    if (createdOperatorProfileId) {
      const { error } = await s.from('operator_profiles').delete().eq('id', createdOperatorProfileId);
      step('Deleted test operator_profile row', !error, error?.message);
    }

    const passed = results.filter(Boolean).length;
    const total = results.length;
    console.log(`\n=================== RESULT: ${passed}/${total} passed ===================`);
    if (passed < total) process.exit(1);
  }
})();
