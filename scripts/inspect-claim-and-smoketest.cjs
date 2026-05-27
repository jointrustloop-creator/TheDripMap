require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  // Inspect the 1 pending claim_request
  const { data: pending } = await s.from('claim_requests').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(5);
  console.log('Pending claim_requests:');
  pending?.forEach(c => console.log(`  ${c.created_at} | email=${c.email} | owner=${c.owner_name} | listing_id=${c.listing_id}`));

  // Look up provider for each pending listing_id
  for (const c of (pending || [])) {
    const { data: prov } = await s.from('providers').select('slug, name, is_featured').eq('id', c.listing_id).maybeSingle();
    console.log(`  → provider: ${prov?.name} (${prov?.slug}) featured=${prov?.is_featured}`);
  }

  // Smoke test key pages
  const SITE = 'https://www.thedripmap.com';
  const pages = ['/', '/contact', '/search', '/cities/los-angeles', '/providers/refresh-med-spa-la-los-angeles', '/blog', '/quiz', '/verify-claim?token=xyz', '/for-clinics'];
  console.log('\nSmoke test:');
  for (const p of pages) {
    const r = await fetch(SITE + p).catch(e => ({ status: 'ERR', _err: e.message }));
    console.log(`  ${(''+r.status).padStart(3)} ${p}${r._err ? '  '+r._err : ''}`);
  }
})();
