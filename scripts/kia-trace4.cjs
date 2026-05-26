require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { data: byName } = await s.from('providers').select('id, slug, name, is_claimed, is_featured, email, phone, city, state, specialties, outreach_sent')
    .ilike('name', '%refresh%')
    .limit(10);
  console.log('Name contains "refresh":');
  byName?.forEach(p => console.log(`  ${p.slug} | ${p.name} | claimed=${p.is_claimed} featured=${p.is_featured} email=${p.email} outreach=${p.outreach_sent}`));

  // Also email-based search
  const { data: byEmail } = await s.from('providers').select('id, slug, name, is_claimed, email')
    .ilike('email', '%refreshmedspala%');
  console.log('\nEmail contains "refreshmedspala":');
  byEmail?.forEach(p => console.log(`  ${p.slug} | ${p.name} | ${p.email} | claimed=${p.is_claimed}`));
})();
