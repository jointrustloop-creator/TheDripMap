require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  // 4 claimed
  const { data: claimed } = await s.from('providers')
    .select('id, slug, name, city, state, website, rating, reviews, is_featured')
    .eq('is_featured', true);

  // Top 50 unclaimed by rating × log(reviews), priority cities boosted
  const PRIORITY_CITIES = ['Tampa', 'Miami', 'Miami Beach', 'Austin', 'New York', 'Brooklyn', 'Manhattan', 'Toronto', 'Los Angeles', 'Las Vegas', 'San Francisco', 'Houston', 'Clearwater'];

  const { data: unclaimed } = await s.from('providers')
    .select('id, slug, name, city, state, website, rating, reviews')
    .eq('is_featured', false)
    .not('rating', 'is', null)
    .gte('rating', 4.6)
    .not('website', 'is', null).neq('website','')
    .order('rating', { ascending: false })
    .limit(200);

  // Rank by composite score: rating × log10(reviews+1), boost priority cities
  const score = (p) => {
    const base = (Number(p.rating) || 0) * Math.log10((Number(p.reviews) || 0) + 1);
    const cityBoost = PRIORITY_CITIES.some(c => p.city && p.city.toLowerCase().includes(c.toLowerCase())) ? 1.5 : 1;
    return base * cityBoost;
  };
  const top50 = unclaimed.sort((a,b) => score(b) - score(a)).slice(0, 50);

  const all = [...claimed, ...top50];
  fs.writeFileSync('C:/Users/Dell/Desktop/TheDripMap/scripts/ig-candidates.json', JSON.stringify(all, null, 2));
  console.log(`Wrote ${all.length} candidates (${claimed.length} claimed + ${top50.length} top unclaimed)`);
  console.log('Top 10 by score:');
  top50.slice(0,10).forEach(p => console.log(`  ${p.rating}★ ${p.reviews}rev — ${p.name} | ${p.city}, ${p.state}`));
})();
