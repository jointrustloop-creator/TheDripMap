require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  // All inquiries today, newest first
  const today = new Date().toISOString().slice(0,10);
  const { data, error, count } = await s.from('inquiries')
    .select('*', { count: 'exact' })
    .gte('created_at', `${today}T00:00:00Z`)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) { console.error(error); process.exit(1); }
  console.log(`Total inquiries today: ${count}`);
  console.log(`Latest 20:`);
  data.forEach(r => console.log(`  ${r.created_at} | ${r.name} | ${r.email}`));

  // Total all-time
  const { count: total } = await s.from('inquiries').select('id', { count: 'exact', head: true });
  console.log(`\nTotal inquiries all-time: ${total}`);

  // Distinct names today (to see if it's the same test pattern)
  const { data: names } = await s.from('inquiries').select('name')
    .gte('created_at', `${today}T00:00:00Z`);
  const counts = {};
  names.forEach(r => counts[r.name || '(null)'] = (counts[r.name || '(null)']||0) + 1);
  console.log(`\nName distribution today:`);
  Object.entries(counts).sort((a,b) => b[1]-a[1]).forEach(([n,c]) => console.log(`  ${c}x  ${n}`));
})();
