require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  console.log('================= CLAIM FLOW SCHEMA AUDIT =================\n');

  // 1) providers.is_claimed column
  console.log('▸ providers.is_claimed column:');
  const { error: icErr } = await s.from('providers').select('is_claimed').limit(1);
  console.log(`  ${icErr ? '✗ DOES NOT EXIST — ' + icErr.message : '✓ EXISTS'}`);

  // 2) providers.is_featured column
  console.log('\n▸ providers.is_featured column:');
  const { error: feErr } = await s.from('providers').select('is_featured').limit(1);
  console.log(`  ${feErr ? '✗ — ' + feErr.message : '✓ EXISTS'}`);

  // 3) claim_requests columns
  console.log('\n▸ claim_requests columns (all expected):');
  const expectedCols = ['id', 'listing_id', 'email', 'owner_name', 'owner_phone', 'token', 'expires_at', 'status', 'verified_at', 'created_at'];
  for (const c of expectedCols) {
    const { error } = await s.from('claim_requests').select(c).limit(1);
    console.log(`  ${error ? '✗' : '✓'} ${c}${error ? ' — ' + error.message : ''}`);
  }

  // 4) FK on claim_requests.listing_id — test by attempting an insert against a real provider id
  console.log('\n▸ claim_requests FK on listing_id (should point to providers, not listings):');
  const testListingId = '517a9b42-b6d2-413d-bab0-92e365fde614'; // Refresh Med Spa LA, known to exist in providers
  const testEmail = `__fk_test_${Date.now()}@example.com`;
  const { data: insTest, error: insErr } = await s.from('claim_requests').insert({
    listing_id: testListingId,
    email: testEmail,
    owner_name: 'FK TEST',
    owner_phone: '0000000000',
    token: `__fk_test_${Date.now()}`,
    expires_at: new Date(Date.now() + 24*60*60*1000).toISOString(),
    created_at: new Date().toISOString(),
  }).select('id');
  if (insErr) {
    console.log(`  ✗ INSERT FAILED — ${insErr.message}`);
    if (/listings/.test(insErr.message)) {
      console.log('     ❗ FK still points to wrong table "listings"');
    }
  } else {
    console.log(`  ✓ INSERT SUCCEEDED (id=${insTest[0].id}) — FK is correct`);
    // Cleanup
    await s.from('claim_requests').delete().eq('id', insTest[0].id);
    console.log(`  ✓ cleaned up test row`);
  }

  // 5) Refresh Med Spa LA current state (Kia)
  console.log('\n▸ Kia / Refresh Med Spa LA provider state:');
  const fieldsToCheck = ['id', 'slug', 'name', 'is_featured', 'rating', 'reviews'];
  if (!icErr) fieldsToCheck.splice(3, 0, 'is_claimed');
  const { data: kia } = await s.from('providers').select(fieldsToCheck.join(',')).eq('id', testListingId).maybeSingle();
  console.log(JSON.stringify(kia, null, 2));

  // 6) outstanding claim_requests
  console.log('\n▸ claim_requests rows in DB:');
  const { count: crCount } = await s.from('claim_requests').select('id', { count: 'exact', head: true });
  console.log(`  Total: ${crCount}`);
  if (crCount > 0) {
    const { data: rows } = await s.from('claim_requests').select('id, email, owner_name, status, created_at').order('created_at', { ascending: false }).limit(5);
    rows.forEach(r => console.log(`  ${r.created_at} | ${r.status || 'pending'} | ${r.email} | ${r.owner_name || '(no name)'}`));
  }

  console.log('\n=================== END AUDIT ===================');
})();
