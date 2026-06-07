/**
 * Data check before writing the 5 Canadian Instagram-share articles.
 * Reports what REAL data we have so we don't invent any stats.
 */
require('dotenv').config({ path: '.env.local' });
const sb = require('@supabase/supabase-js').createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

(async () => {
  const { data: all } = await sb
    .from('providers')
    .select('id, name, slug, city, state, type, category, specialties, services, rating, reviews, is_claimed, is_featured, price_min, price_max, decision_drivers, photos, hours, address, postal_code')
    .eq('country', 'Canada')
    .range(0, 1999);

  console.log('=== CA DATA CHECK FOR 5 ARTICLES ===');
  console.log('Total CA providers: ' + all.length);
  console.log();

  // Ratings
  const withRating = all.filter((p) => p.rating != null && p.rating > 0);
  const withReviews = all.filter((p) => p.reviews != null && String(p.reviews).match(/\d/));
  console.log('--- Ratings + reviews ---');
  console.log('  With rating:       ' + withRating.length + ' / ' + all.length);
  console.log('  With review count: ' + withReviews.length + ' / ' + all.length);
  // Top-rated by metro
  const withBoth = all.filter((p) => p.rating != null && p.rating >= 4.5 && p.reviews != null);
  console.log('  Rating >=4.5 AND has reviews: ' + withBoth.length);
  console.log();

  // Pricing
  const withPriceMin = all.filter((p) => p.price_min != null && p.price_min > 0);
  const withPriceMax = all.filter((p) => p.price_max != null && p.price_max > 0);
  console.log('--- Pricing ---');
  console.log('  With price_min field: ' + withPriceMin.length);
  console.log('  With price_max field: ' + withPriceMax.length);
  // Decision drivers pricing
  const withDDPrice = all.filter((p) => p.decision_drivers && (p.decision_drivers.pricing || p.decision_drivers.prices));
  console.log('  With decision_drivers.pricing: ' + withDDPrice.length);
  console.log();

  // Services
  const withServices = all.filter((p) => Array.isArray(p.services) && p.services.length > 0);
  const withSpecialties = all.filter((p) => Array.isArray(p.specialties) && p.specialties.length > 0);
  console.log('--- Services + specialties ---');
  console.log('  With services array:    ' + withServices.length);
  console.log('  With specialties array: ' + withSpecialties.length);
  console.log();

  // Provider type (Clinic/Mobile/Both)
  const byType = {};
  for (const p of all) {
    const t = p.type || '(null)';
    byType[t] = (byType[t] || 0) + 1;
  }
  console.log('--- Type field ---');
  for (const [t, c] of Object.entries(byType)) {
    console.log('  ' + t.padEnd(12) + ' ' + c);
  }
  console.log();

  // Category breakdown
  const byCat = {};
  for (const p of all) {
    const c = p.category || '(null)';
    byCat[c] = (byCat[c] || 0) + 1;
  }
  console.log('--- Category field ---');
  for (const [c, n] of Object.entries(byCat).sort((a, b) => b[1] - a[1])) {
    console.log('  ' + c.padEnd(28) + ' ' + n);
  }
  console.log();

  // Toronto top 10 by (rating * reviews) for article 1
  const toronto = all.filter((p) => p.city === 'Toronto' && p.rating != null && p.reviews != null);
  toronto.forEach((p) => {
    p._revNum = parseInt(String(p.reviews).replace(/[^0-9]/g, ''), 10) || 0;
    p._score = p.rating * Math.log10(1 + p._revNum);
  });
  toronto.sort((a, b) => b._score - a._score);
  console.log('--- Toronto top 10 (rating * log(reviews)) ---');
  for (const p of toronto.slice(0, 10)) {
    console.log('  ' + p.rating + ' / ' + String(p._revNum).padStart(5) + ' reviews  ' + (p.is_claimed ? '[CLAIMED] ' : '          ') + p.name);
  }
  console.log();

  const vancouver = all.filter((p) => p.city === 'Vancouver' && p.rating != null && p.reviews != null);
  vancouver.forEach((p) => {
    p._revNum = parseInt(String(p.reviews).replace(/[^0-9]/g, ''), 10) || 0;
    p._score = p.rating * Math.log10(1 + p._revNum);
  });
  vancouver.sort((a, b) => b._score - a._score);
  console.log('--- Vancouver top 10 (rating * log(reviews)) ---');
  for (const p of vancouver.slice(0, 10)) {
    console.log('  ' + p.rating + ' / ' + String(p._revNum).padStart(5) + ' reviews  ' + (p.is_claimed ? '[CLAIMED] ' : '          ') + p.name);
  }
  console.log();

  // Claimed status
  const claimed = all.filter((p) => p.is_claimed);
  const featured = all.filter((p) => p.is_featured);
  console.log('--- Status ---');
  console.log('  Claimed:  ' + claimed.length);
  console.log('  Featured: ' + featured.length);
})();
