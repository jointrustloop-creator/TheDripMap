require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  // claim_requests schema — attempt a no-op select for each suspected column
  const cols = ['id', 'listing_id', 'email', 'owner_name', 'owner_phone', 'token', 'expires_at', 'status', 'verified_at', 'created_at'];
  console.log('claim_requests column availability:');
  for (const c of cols) {
    const { error } = await s.from('claim_requests').select(c).limit(1);
    console.log(`  ${error ? '✗' : '✓'} ${c}${error ? ' — ' + error.message : ''}`);
  }

  // is_claimed on providers
  console.log('\nproviders.is_claimed:');
  const { error: ic } = await s.from('providers').select('is_claimed').limit(1);
  console.log(`  ${ic ? '✗ ' + ic.message : '✓ exists'}`);

  // Try simulating Kia's insert (will fail if columns missing — useful diagnostic, will rollback)
  console.log('\nSimulating Kia insert (will be deleted immediately):');
  const { data, error: insErr } = await s.from('claim_requests').insert({
    listing_id: '517a9b42-b6d2-413d-bab0-92e365fde614',
    email: '__test_kia_simulate__@example.com',
    owner_name: 'TEST DELETE ME',
    owner_phone: '0000000000',
    token: '__test_kia_token__',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString()
  }).select();
  if (insErr) {
    console.log('  ✗ INSERT FAILED:', insErr.message, insErr.details || '', insErr.code || '');
  } else {
    console.log('  ✓ INSERT SUCCEEDED — id:', data[0].id);
    // Cleanup
    await s.from('claim_requests').delete().eq('email', '__test_kia_simulate__@example.com');
    console.log('  ✓ cleaned up test row');
  }
})();
