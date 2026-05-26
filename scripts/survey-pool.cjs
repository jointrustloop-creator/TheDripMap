require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  // Total providers
  const { count: total } = await s.from('providers').select('id', { count: 'exact', head: true });
  console.log('Total providers:', total);

  // Has email, unclaimed, not yet outreached, meets new thresholds
  const { count: eligibleNow } = await s.from('providers').select('id', { count: 'exact', head: true })
    .eq('is_featured', false).neq('outreach_sent', true).neq('email_bounced', true)
    .gte('rating', 4.5).gte('reviews', 10).not('email', 'is', null);
  console.log('Eligible NOW (has email, new thresholds):', eligibleNow);

  // Discovery pool: no email, has website, unclaimed, not outreached
  const { count: discoveryPool } = await s.from('providers').select('id', { count: 'exact', head: true })
    .eq('is_featured', false).neq('outreach_sent', true).neq('email_bounced', true)
    .or('email.is.null,email.eq.')
    .not('website', 'is', null).neq('website', '');
  console.log('Discovery pool (no email, has website):', discoveryPool);

  // Same with rating/reviews thresholds (high-value targets)
  const { count: discoveryPoolHighValue } = await s.from('providers').select('id', { count: 'exact', head: true })
    .eq('is_featured', false).neq('outreach_sent', true).neq('email_bounced', true)
    .or('email.is.null,email.eq.')
    .not('website', 'is', null).neq('website', '')
    .gte('rating', 4.5).gte('reviews', 10);
  console.log('Discovery pool (no email, has website, meets thresholds):', discoveryPoolHighValue);

  // Sample 5 rows to see what we're dealing with
  const { data: sample } = await s.from('providers').select('slug, name, website, rating, reviews').eq('is_featured', false).neq('outreach_sent', true).neq('email_bounced', true).or('email.is.null,email.eq.').not('website', 'is', null).neq('website', '').gte('rating', 4.5).gte('reviews', 10).order('rating', { ascending: false }).limit(5);
  console.log('\nTop 5 discovery candidates:');
  sample.forEach((r) => console.log(`  ${r.rating}★ ${r.reviews}rev — ${r.name} — ${r.website}`));
})();
