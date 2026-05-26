require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  // claim_requests columns
  const { data: sample } = await s.from('claim_requests').select('*').limit(1);
  console.log('claim_requests columns:', sample[0] ? Object.keys(sample[0]).sort().join(', ') : '(empty table)');

  // count + Kia's row
  const { count } = await s.from('claim_requests').select('id', { count: 'exact', head: true });
  console.log('Total claim_requests:', count);

  const { data: refresh } = await s.from('claim_requests').select('*')
    .or('email.ilike.%kia%,owner_name.ilike.%kia%,listing_id.in.(select id from providers where slug ilike \'refresh-med-spa-la%\')')
    .order('created_at', { ascending: false }).limit(3);
  console.log('\nRecent Kia / Refresh Med Spa claims:');
  if (refresh && refresh.length) {
    refresh.forEach(r => console.log(JSON.stringify(r, null, 2)));
  } else {
    // Just show the 3 most recent
    const { data: any3 } = await s.from('claim_requests').select('*').order('created_at', { ascending: false }).limit(3);
    console.log('Most recent 3:');
    any3.forEach(r => console.log(JSON.stringify(r, null, 2)));
  }

  // The provider row
  const { data: prov } = await s.from('providers').select('id, slug, name, is_claimed, is_featured, email, phone, specialties, city, state').ilike('slug', 'refresh-med-spa-la%').maybeSingle();
  console.log('\nRefresh Med Spa LA provider row:');
  console.log(JSON.stringify(prov, null, 2));
})();
