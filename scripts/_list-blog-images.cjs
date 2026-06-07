require('dotenv').config({ path: '.env.local' });
const sb = require('@supabase/supabase-js').createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { data, error } = await sb.storage.from('blog-images').list('', { limit: 200, sortBy: { column: 'name', order: 'asc' } });
  if (error) { console.error(error); return; }
  for (const f of data) console.log(f.name);
})();
