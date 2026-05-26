require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  // See current ranks
  const { data: existing } = await s.from('providers').select('slug, name, rank_in_city, city').eq('is_featured', true).order('name');
  console.log('Current ranks on claimed listings:');
  existing.forEach(p => console.log(`  ${p.slug.padEnd(50)} | ${p.city.padEnd(20)} | rank=${p.rank_in_city}`));

  // Set Refresh Med Spa LA to rank 1 in Los Angeles so she sorts first there.
  const { data: upd, error } = await s.from('providers')
    .update({ rank_in_city: 1 })
    .eq('id', '517a9b42-b6d2-413d-bab0-92e365fde614')
    .select('slug, rank_in_city, city');
  if (error) { console.error('Update failed:', error); process.exit(1); }
  console.log('\n✓ Set Refresh Med Spa LA rank_in_city=1:', JSON.stringify(upd, null, 2));
})();
