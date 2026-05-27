require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  // Look at column-level state
  const { count: total } = await s.from('providers').select('id', { count:'exact', head:true });
  const { count: snake_set } = await s.from('providers').select('id', { count:'exact', head:true }).not('image_url', 'is', null);
  const { count: snake_null } = await s.from('providers').select('id', { count:'exact', head:true }).is('image_url', null);
  const { count: camel_set } = await s.from('providers').select('id', { count:'exact', head:true }).not('imageUrl', 'is', null);
  const { count: camel_null } = await s.from('providers').select('id', { count:'exact', head:true }).is('imageUrl', null);
  console.log(`Total providers: ${total}`);
  console.log(`image_url set:   ${snake_set}    image_url NULL:  ${snake_null}`);
  console.log(`imageUrl  set:   ${camel_set}    imageUrl  NULL:  ${camel_null}`);

  // Pick 3 with image_url set and inspect
  const { data: samples } = await s.from('providers').select('id, slug, imageUrl, image_url').not('image_url', 'is', null).limit(3);
  console.log('\nSample of providers with image_url set:');
  samples.forEach(p => console.log(`  ${p.slug}\n    imageUrl: ${(p.imageUrl||'').slice(0,60)}\n    image_url: ${(p.image_url||'').slice(0,60)}`));

  // 3 with image_url NULL
  const { data: nulls } = await s.from('providers').select('id, slug, imageUrl, image_url').is('image_url', null).limit(3);
  console.log('\nSample of providers with image_url NULL:');
  nulls.forEach(p => console.log(`  ${p.slug}\n    imageUrl: ${(p.imageUrl||'').slice(0,60)}\n    image_url: ${p.image_url}`));
})();
