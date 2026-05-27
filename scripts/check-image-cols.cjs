require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  // Same query I used earlier in status snapshot - confirm 381 count
  const { count: camelOnly } = await s.from('providers').select('id', { count: 'exact', head: true })
    .not('imageUrl', 'is', null).is('image_url', null);
  console.log('camelOnly (imageUrl set, image_url NULL):', camelOnly);

  // Now SELECT 3 such rows
  const { data: examples, error } = await s.from('providers').select('id, slug, imageUrl, image_url')
    .not('imageUrl', 'is', null).is('image_url', null).limit(3);
  if (error) console.log('ERR:', error.message);
  console.log('Examples:');
  examples?.forEach(r => console.log(JSON.stringify(r)));
})();
