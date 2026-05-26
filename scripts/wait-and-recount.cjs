require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { count: a } = await s.from('inquiries').select('id', { count: 'exact', head: true });
  console.log('Inquiries NOW:', a);
  await new Promise(r => setTimeout(r, 30_000));
  const { count: b } = await s.from('inquiries').select('id', { count: 'exact', head: true });
  console.log('Inquiries +30s:', b);
  console.log(b === a ? '✓ NO NEW INQUIRIES — loop is dead' : `⚠️  ${b-a} new inquiries arrived — something else is firing`);
})();
