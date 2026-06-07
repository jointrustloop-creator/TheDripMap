require('dotenv').config({ path: '.env.local' });
const sb = require('@supabase/supabase-js').createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function parseReviews(r) {
  if (r == null) return null;
  const n = parseInt(String(r).replace(/[^0-9]/g, ''), 10);
  return isNaN(n) ? null : n;
}

(async () => {
  const { data: row1 } = await sb.from('providers').select('*').eq('country','Canada').limit(1);
  console.log('=== schema (one row) ===');
  if (row1 && row1[0]) console.log(Object.keys(row1[0]).sort().join(', '));
  console.log();

  const { data: all, error } = await sb
    .from('providers')
    .select('id, name, slug, city, state, type, category, specialties, rating, reviews, is_claimed, is_featured, price_range, decision_drivers')
    .eq('country','Canada')
    .range(0, 1999);
  if (error) { console.error(error); return; }

  console.log('=== CA DATA CHECK FOR 5 ARTICLES ===');
  console.log('Total CA providers: ' + all.length);
  console.log();

  // Ratings
  const withRating = all.filter((p) => p.rating != null && p.rating > 0);
  const withReviewsCount = all.filter((p) => parseReviews(p.reviews) != null);
  const withBoth = all.filter((p) => p.rating != null && p.rating > 0 && parseReviews(p.reviews) != null);
  console.log('--- Ratings ---');
  console.log('  Rating > 0:                ' + withRating.length + ' / ' + all.length);
  console.log('  Reviews count parseable:   ' + withReviewsCount.length + ' / ' + all.length);
  console.log('  Both rating + reviews:     ' + withBoth.length + ' / ' + all.length);
  const rating45 = all.filter((p) => p.rating != null && p.rating >= 4.5 && parseReviews(p.reviews) >= 10);
  const rating49 = all.filter((p) => p.rating != null && p.rating >= 4.9 && parseReviews(p.reviews) >= 50);
  console.log('  4.5+ stars and 10+ revs:   ' + rating45.length);
  console.log('  4.9+ stars and 50+ revs:   ' + rating49.length);
  console.log();

  // Pricing
  const withPriceRange = all.filter((p) => p.price_range);
  console.log('--- Pricing ---');
  console.log('  Has price_range field:     ' + withPriceRange.length);
  if (withPriceRange.length) {
    const sample = withPriceRange.slice(0, 5).map((p) => p.name + ': ' + p.price_range);
    console.log('  Sample: ' + sample.join(' | '));
  }
  const withDDPricing = all.filter((p) => p.decision_drivers && (p.decision_drivers.pricing || p.decision_drivers.prices || p.decision_drivers.price));
  console.log('  decision_drivers.pricing*: ' + withDDPricing.length);
  console.log();

  // Type field
  const byType = {};
  for (const p of all) { const t = p.type || '(null)'; byType[t] = (byType[t] || 0) + 1; }
  console.log('--- Type ---');
  for (const [t,c] of Object.entries(byType).sort((a,b)=>b[1]-a[1])) console.log('  ' + t.padEnd(14) + ' ' + c);
  console.log();

  // Category
  const byCat = {};
  for (const p of all) { const c = p.category || '(null)'; byCat[c] = (byCat[c] || 0) + 1; }
  console.log('--- Category ---');
  for (const [c,n] of Object.entries(byCat).sort((a,b)=>b[1]-a[1])) console.log('  ' + c.padEnd(28) + ' ' + n);
  console.log();

  // Toronto + Vancouver top by composite score
  for (const city of ['Toronto', 'Vancouver']) {
    const list = all.filter((p) => p.city === city && p.rating != null && parseReviews(p.reviews) != null);
    list.forEach((p) => {
      p._rev = parseReviews(p.reviews);
      p._score = p.rating * Math.log10(1 + p._rev);
    });
    list.sort((a, b) => b._score - a._score);
    console.log('--- ' + city + ' top 12 by composite (rating * log(reviews)) ---');
    for (const p of list.slice(0, 12)) {
      console.log('  ' + p.rating.toFixed(1) + '* ' + String(p._rev).padStart(5) + 'rev  ' + (p.is_claimed ? '[C] ' : '    ') + (p.type || '?').padEnd(8) + (p.category || '?').padEnd(24) + p.name);
    }
    console.log();
  }

  // Status
  const claimed = all.filter((p) => p.is_claimed);
  const featured = all.filter((p) => p.is_featured);
  console.log('--- Status ---');
  console.log('  Claimed:  ' + claimed.length);
  console.log('  Featured: ' + featured.length);
})();
