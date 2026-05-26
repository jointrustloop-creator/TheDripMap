require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  // Note: is_claimed column DOESN'T exist (audit finding). Setting is_featured=true is
  // the practical equivalent — it's what the provider page UI actually gates on
  // (claimed visual treatment + real image + no claim CTA). is_claimed schema fix
  // is a separate todo.
  const { data, error } = await s.from('providers')
    .update({ is_featured: true })
    .eq('id', '517a9b42-b6d2-413d-bab0-92e365fde614')
    .select('id, name, slug, is_featured');
  if (error) { console.error('UPDATE ERROR:', error); process.exit(1); }
  console.log('✓ Provider updated:');
  console.log(JSON.stringify(data, null, 2));
})();
