require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { data } = await s.from('providers')
    .select('id, slug, name, city, state, address, website')
    .or('city.ilike.%tampa%,address.ilike.%tampa%')
    .order('name');
  console.log(`Existing Tampa providers: ${data.length}`);
  data.forEach(p => console.log(`  - ${p.name} | ${p.address}`));
})();
