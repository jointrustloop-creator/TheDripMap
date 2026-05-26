require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  // Exact slug from today's outreach
  const { data: prov } = await s.from('providers').select('id, slug, name, is_claimed, is_featured, email, phone, city, state, specialties, outreach_sent, outreach_sent_at')
    .eq('slug', 'refresh-med-spa-la-los-angeles').maybeSingle();
  console.log('Refresh Med Spa LA exact match:');
  console.log(JSON.stringify(prov, null, 2));
})();
