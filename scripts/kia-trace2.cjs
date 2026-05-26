require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  // Provider row — broader search
  const { data: prov } = await s.from('providers').select('id, slug, name, is_claimed, is_featured, email, phone, city, state, outreach_sent, outreach_sent_at')
    .or('name.ilike.%refresh med spa%,slug.ilike.%refresh-med-spa%')
    .limit(5);
  console.log('Refresh Med Spa matches:');
  console.log(JSON.stringify(prov, null, 2));

  // Check inquiries for Kia
  const { data: kia, count } = await s.from('inquiries').select('*', { count: 'exact' })
    .or('name.ilike.%kia%,email.ilike.%kia%,name.ilike.%hangover%relief%')
    .order('created_at', { ascending: false }).limit(5);
  console.log(`\nInquiries matching Kia / Hangover Relief: ${count}`);
  if (kia && kia.length) {
    kia.forEach(r => console.log('  ', r.created_at, '|', r.name, '|', r.email, '|', (r.message||'').slice(0,80)));
  }

  // Also check any other inquiry columns
  const { data: sampleInq } = await s.from('inquiries').select('*').limit(1);
  console.log('\ninquiries columns:', sampleInq[0] ? Object.keys(sampleInq[0]).sort().join(', ') : '(no inquiries)');
})();
