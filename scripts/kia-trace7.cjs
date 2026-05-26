require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  // CRITICAL: does providers table have is_claimed column?
  const { data: p1 } = await s.from('providers').select('is_claimed').limit(1);
  console.log('is_claimed column exists?', p1 ? '✓' : '✗', 'sample:', JSON.stringify(p1));

  // Look in inquiries for any Refresh / Hangover mentions
  const { data: i1 } = await s.from('inquiries').select('*')
    .or('message.ilike.%refresh%,message.ilike.%hangover relief%,message.ilike.%kia%,name.ilike.%kia%')
    .order('created_at', { ascending: false }).limit(10);
  console.log(`\nInquiries matching refresh/hangover/kia: ${i1?.length ?? 0}`);
  i1?.forEach(r => console.log(`  ${r.created_at} | ${r.name} | ${r.email} | ${(r.message||'').slice(0,100)}`));

  // Listing_id match: any inquiry linked to Refresh Med Spa LA's id?
  const { data: i2 } = await s.from('inquiries').select('*')
    .eq('listing_id', '517a9b42-b6d2-413d-bab0-92e365fde614')
    .order('created_at', { ascending: false }).limit(10);
  console.log(`\nInquiries linked to Refresh listing_id: ${i2?.length ?? 0}`);
  i2?.forEach(r => console.log(`  ${r.created_at} | ${r.name} | ${r.email} | ${(r.message||'').slice(0,100)}`));

  // Check claim_requests table schema
  const { error: claimErr } = await s.from('claim_requests').select('*').limit(0);
  console.log('\nclaim_requests table accessible?', claimErr ? `✗ ${claimErr.message}` : '✓');
})();
