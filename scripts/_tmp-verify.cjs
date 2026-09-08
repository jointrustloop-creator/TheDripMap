require('dotenv').config({ path: require('path').join('C:/Users/Dell/Desktop/TheDripMap', '.env.local'), override: true });
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const pay = JSON.parse(fs.readFileSync('C:/Users/Dell/Desktop/TheDripMap/.audit-tmp/_ca-draft-payloads.json', 'utf8'));
  const ids = pay.map(p => p.id);
  const { data, error } = await s.from('providers').select('id,name,slug,city,state,country,address,postal_code,phone,website,created_at').in('id', ids);
  if (error) { console.error(error); process.exit(1); }
  const byId = Object.fromEntries(data.map(d => [d.id, d]));
  for (const p of pay) {
    const r = byId[p.id] || {};
    console.log(`\n${p.name}  |  ${p.to}`);
    console.log(`   city=${r.city} state=${r.state} country=${r.country}`);
    console.log(`   addr=${r.address || '(none)'}  postal=${r.postal_code || '(none)'}`);
    console.log(`   phone=${r.phone || '(none)'}  site=${r.website || '(none)'}`);
    console.log(`   created=${r.created_at}`);
  }
})();
