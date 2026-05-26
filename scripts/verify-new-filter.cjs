require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  // Match the exact filter the cron now uses
  const { data, error, count } = await s.from('providers')
    .select('slug, name, rating, reviews, email', { count: 'exact' })
    .neq('availability', false)
    .eq('is_featured', false)
    .neq('outreach_sent', true)
    .neq('email_bounced', true)
    .or('rating.gte.4.5,rating.is.null')
    .not('email', 'is', null).neq('email', '')
    .order('rating', { ascending: false, nullsFirst: false })
    .limit(50);

  if (error) { console.error(error); process.exit(1); }
  console.log(`Eligible pool (new filter): ${count}`);
  console.log(`Days of pipeline at 19/day: ${Math.ceil(count / 19)}`);
  console.log('\nTop 19 ranked (tomorrow morning batch preview):');
  // Apply the in-memory filter the cron does (reviews>=10 OR rating IS NULL)
  const eligible = data.filter(p => p.email && (!p.rating || (Number(p.reviews) >= 10 && Number(p.rating) >= 4.5)));
  const score = (p) => (Number(p.rating) || 0) * Math.log10((Number(p.reviews) || 0) + 1);
  const ranked = eligible.sort((a, b) => {
    const s2 = score(b) - score(a);
    return s2 !== 0 ? s2 : a.slug.localeCompare(b.slug);
  }).slice(0, 19);
  ranked.forEach((p, i) => {
    const r = p.rating ? `${p.rating}★/${p.reviews}rev` : 'no-rating';
    console.log(`  ${(i+1).toString().padStart(2)}. [${r.padEnd(12)}] ${p.name.slice(0, 50)} — ${p.email}`);
  });
})();
