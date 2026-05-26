require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TEST_EMAIL = 'test@thedripmap.com';
const SITE = 'https://www.thedripmap.com';

function step(name, ok, detail = '') {
  console.log(`${ok ? '✓ PASS' : '✗ FAIL'} — ${name}${detail ? ' — ' + detail : ''}`);
  return ok;
}

(async () => {
  let testProvider = null;
  let testClaimId = null;
  let token = null;
  const results = [];

  try {
    console.log('================= E2E CLAIM FLOW TEST =================\n');

    // STEP 0: Pick a low-profile unclaimed provider that hasn't been outreached
    console.log('[STEP 0] Selecting test provider (long-tail, not outreached)...');
    const { data: candidates } = await s.from('providers')
      .select('id, slug, name, is_featured, is_claimed, outreach_sent')
      .eq('is_featured', false)
      .neq('outreach_sent', true)
      .or('rating.is.null,rating.lt.4.0')
      .not('slug', 'is', null)
      .limit(5);
    if (!candidates || candidates.length === 0) throw new Error('No suitable test provider found');
    testProvider = candidates[0];
    console.log(`  Selected: ${testProvider.name} (${testProvider.slug})`);
    console.log(`  Pre-test state: is_claimed=${testProvider.is_claimed} is_featured=${testProvider.is_featured}`);

    // STEP 1: Insert claim_requests row (this is what the modal does)
    console.log('\n[STEP 1] Insert claim_requests row...');
    token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: inserted, error: insErr } = await s.from('claim_requests').insert({
      listing_id: testProvider.id,
      email: TEST_EMAIL,
      owner_name: 'E2E Test Owner',
      owner_phone: '5555550100',
      token,
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    }).select('id, token, status');
    results.push(step('claim_requests INSERT succeeded (FK is fixed)',
      !insErr && inserted?.[0],
      insErr ? insErr.message : `id=${inserted[0].id}`));
    if (insErr) throw new Error('Cannot proceed without claim_requests row');
    testClaimId = inserted[0].id;
    results.push(step('claim_requests row contains token and status=pending or null',
      inserted[0].token === token && (inserted[0].status === null || inserted[0].status === 'pending')));

    // STEP 2: Call /api/notify-operator to fire the verification + operator emails
    console.log('\n[STEP 2] Call /api/notify-operator to send verification + operator emails...');
    const notifyRes = await fetch(`${SITE}/api/notify-operator`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinicName: testProvider.name,
        ownerName: 'E2E Test Owner',
        ownerPhone: '5555550100',
        email: TEST_EMAIL,
        specialty: 'IV Therapy',
        token,
        listingId: testProvider.id,
        providerSlug: testProvider.slug,
      }),
    });
    const notifyBody = await notifyRes.json();
    results.push(step('/api/notify-operator returned 200', notifyRes.status === 200,
      JSON.stringify(notifyBody).slice(0, 100)));

    // STEP 3: Hit /verify-claim?token=XXX to simulate Kia clicking the link
    console.log('\n[STEP 3] Hit /verify-claim with the test token...');
    const verifyRes = await fetch(`${SITE}/verify-claim?token=${encodeURIComponent(token)}`, {
      headers: { 'User-Agent': 'E2E-Test-Bot' },
    });
    const verifyHtml = await verifyRes.text();
    results.push(step('verify-claim page returned 200', verifyRes.status === 200));
    results.push(step('verify-claim page renders new success copy ("now live")',
      verifyHtml.includes('now live') && !verifyHtml.includes('24 hours')));
    results.push(step('verify-claim page shows clickable listing URL on success',
      verifyHtml.includes(`thedripmap.com/providers/${testProvider.slug}`)));
    results.push(step('verify-claim page invites email reply for photos/services',
      verifyHtml.includes('reply to your verification email')));

    // STEP 4: Verify DB state after verification
    console.log('\n[STEP 4] Verify DB state changed...');
    const { data: claimAfter } = await s.from('claim_requests').select('status, verified_at').eq('id', testClaimId).maybeSingle();
    results.push(step('claim_requests.status flipped to "verified"',
      claimAfter?.status === 'verified',
      `status=${claimAfter?.status} verified_at=${claimAfter?.verified_at}`));
    const { data: provAfter } = await s.from('providers').select('is_claimed, is_featured').eq('id', testProvider.id).maybeSingle();
    results.push(step('providers.is_claimed = true', provAfter?.is_claimed === true));
    results.push(step('providers.is_featured = true', provAfter?.is_featured === true));

    // STEP 5: Re-fire verify-claim with same token to confirm "already verified" path
    console.log('\n[STEP 5] Hit /verify-claim again — should be "already_verified"...');
    const replayRes = await fetch(`${SITE}/verify-claim?token=${encodeURIComponent(token)}`);
    const replayHtml = await replayRes.text();
    results.push(step('Re-verify shows "Already verified" state',
      replayHtml.includes('Already verified') || replayHtml.includes('already')));

  } catch (err) {
    console.log(`\n!!! UNEXPECTED ERROR: ${err.message}`);
    results.push(step('No unexpected error thrown', false, err.message));
  } finally {
    // STEP 6: ROLLBACK — undo everything
    console.log('\n[STEP 6] Rolling back test state...');
    if (testClaimId) {
      const { error } = await s.from('claim_requests').delete().eq('id', testClaimId);
      step('Deleted test claim_requests row', !error, error?.message);
    }
    if (testProvider?.id) {
      const { error } = await s.from('providers').update({ is_claimed: false, is_featured: false }).eq('id', testProvider.id);
      step('Reset providers.is_claimed=false, is_featured=false', !error, error?.message);
      const { data: final } = await s.from('providers').select('is_claimed, is_featured').eq('id', testProvider.id).maybeSingle();
      step('Verified rollback: provider back to is_claimed=false, is_featured=false',
        final?.is_claimed === false && final?.is_featured === false,
        `is_claimed=${final?.is_claimed} is_featured=${final?.is_featured}`);
    }

    const passed = results.filter(r => r).length;
    const total = results.length;
    console.log(`\n=================== RESULT: ${passed}/${total} passed ===================`);
    if (passed < total) process.exit(1);
  }
})();
