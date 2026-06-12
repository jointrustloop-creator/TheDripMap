// Read-only: gap-to-Bay-quality snapshot for the 6 first-run clinics.
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const SLUGS = [
  'purete-medical-spa-etobicoke',
  'the-lift-bar-medspa-nicholasville',
  'soma-and-soul-wellness-toronto',
  'natures-touch-naturopathic-clinic-brampton',
  'insight-naturopathic-clinic-toronto',
];

(async () => {
  const { data: bySlug } = await sb.from('providers')
    .select('id,name,slug,city,state,country,website,is_claimed,safety_verified,description,services,photos,image_url,imageUrl,medical_team,price_range,specialties')
    .in('slug', SLUGS);
  const { data: vp } = await sb.from('providers')
    .select('id,name,slug,city,state,country,website,is_claimed,safety_verified,description,services,photos,image_url,imageUrl,medical_team,price_range,specialties')
    .ilike('name', '%vp health%');
  const all = [...(bySlug || []), ...(vp || [])];
  for (const p of all) {
    const svc = Array.isArray(p.services) ? p.services : [];
    const priced = svc.filter(s => s && s.price).length;
    const photos = Array.isArray(p.photos) ? p.photos.length : 0;
    const team = Array.isArray(p.medical_team) ? p.medical_team.length : 0;
    console.log(`\n=== ${p.name} (${p.slug}) ${p.city}, ${p.state} ${p.country}`);
    console.log(`  claimed=${p.is_claimed} safety_verified=${p.safety_verified} website=${p.website || 'none'}`);
    console.log(`  desc=${(p.description || '').length} chars | services=${svc.length} (${priced} priced) | photos=${photos} | logo/image=${!!(p.image_url || p.imageUrl)} | medical_team=${team} | price_range=${p.price_range || 'null'}`);
    console.log(`  desc snippet: ${(p.description || '').slice(0, 160)}`);
  }
  console.log(`\nTotal rows found: ${all.length} (expect 6: 5 slugs + VP Health)`);
})();
