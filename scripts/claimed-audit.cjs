require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { data } = await s.from('providers').select('*').eq('is_featured', true).order('name');
  console.log(`=== ${data.length} CLAIMED PROVIDERS ===\n`);
  for (const p of data) {
    console.log(`▸ ${p.name}`);
    console.log(`  slug:           ${p.slug}`);
    console.log(`  city/state:     ${p.city}, ${p.state}`);
    console.log(`  rating:         ${p.rating || '✗'}  reviews: ${p.reviews || '✗'}`);
    console.log(`  phone:          ${p.phone || '✗'}`);
    console.log(`  email:          ${p.email || '✗'}`);
    console.log(`  website:        ${p.website || '✗'}`);
    console.log(`  description:    ${p.description ? p.description.slice(0,60) + '...' : '✗ MISSING'}`);
    console.log(`  specialties:    ${Array.isArray(p.specialties) ? p.specialties.length + ' items' : (p.specialties ? 'string' : '✗')}`);
    console.log(`  amenities:      ${Array.isArray(p.amenities) ? p.amenities.length + ' items' : (p.amenities ? 'string' : '✗')}`);
    console.log(`  hours:          ${p.working_hours ? 'set' : '✗'}`);
    console.log(`  image_url:      ${p.image_url ? p.image_url.slice(0,70) : '✗'}`);
    console.log(`  price_range:    ${p.price_range || '✗'}`);
    console.log(`  address:        ${p.address || '✗'}`);
    console.log('');
  }
})();
