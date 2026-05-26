require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local' });
const { createClient } = require('@supabase/supabase-js');
console.log('Using Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { count } = await s.from('providers').select('id', { count:'exact', head:true });
  console.log('Total providers:', count);

  const { data } = await s.from('providers').select('slug, name').ilike('slug', '%refresh%').limit(20);
  console.log('\nSlugs containing "refresh":');
  data?.forEach(p => console.log(`  ${p.slug} | ${p.name}`));

  // Search by city Los Angeles
  const { data: la } = await s.from('providers').select('slug, name, city, state').ilike('city', '%los angeles%').ilike('name', '%spa%').limit(10);
  console.log('\nLA + spa in name:');
  la?.forEach(p => console.log(`  ${p.slug} | ${p.name}`));
})();
