require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const base = () => s.from('providers').select('id', { count: 'exact', head: true })
    .eq('is_featured', false).neq('outreach_sent', true).neq('email_bounced', true)
    .not('email', 'is', null).neq('email', '');

  const variants = [
    { label: 'No rating filter, no reviews filter (everything w/ email)', q: base() },
    { label: 'rating>=4.5 reviews>=10 (current)', q: base().gte('rating', 4.5).gte('reviews', 10) },
    { label: 'rating>=4.0 reviews>=5',  q: base().gte('rating', 4.0).gte('reviews', 5) },
    { label: 'rating>=4.0 reviews>=1',  q: base().gte('rating', 4.0).gte('reviews', 1) },
    { label: 'rating>=3.5 reviews>=1',  q: base().gte('rating', 3.5).gte('reviews', 1) },
    { label: 'No threshold but rating IS NOT NULL', q: base().not('rating', 'is', null) },
  ];

  for (const v of variants) {
    const { count } = await v.q;
    console.log(`  ${count.toString().padStart(4)} | ${v.label}  → ${Math.ceil(count/19)} days`);
  }

  // Distribution
  console.log('\n--- Rating distribution (unclaimed, has email) ---');
  for (const r of [5.0, 4.9, 4.8, 4.7, 4.5, 4.0, 3.5, 3.0]) {
    const { count } = await s.from('providers').select('id', { count: 'exact', head: true })
      .eq('is_featured', false).neq('outreach_sent', true).neq('email_bounced', true)
      .not('email', 'is', null).neq('email', '').gte('rating', r);
    console.log(`  rating >= ${r}: ${count}`);
  }
  const { count: noRating } = await s.from('providers').select('id', { count: 'exact', head: true })
    .eq('is_featured', false).neq('outreach_sent', true).neq('email_bounced', true)
    .not('email', 'is', null).neq('email', '').is('rating', null);
  console.log(`  rating IS NULL: ${noRating}`);
})();
