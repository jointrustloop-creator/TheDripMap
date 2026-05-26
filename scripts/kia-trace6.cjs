require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { data } = await s.from('providers').select('*').eq('slug','refresh-med-spa-la-los-angeles').maybeSingle();
  console.log('Refresh Med Spa LA full row:');
  console.log(JSON.stringify(data, null, 2));
})();
