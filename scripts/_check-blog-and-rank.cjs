require('dotenv').config({ path: '.env.local' });
const sb = require('@supabase/supabase-js').createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function parseReviews(r) {
  if (r == null) return null;
  const n = parseInt(String(r).replace(/[^0-9]/g, ''), 10);
  return isNaN(n) ? null : n;
}
function numRating(r) {
  if (r == null) return null;
  const n = parseFloat(r);
  return isNaN(n) ? null : n;
}

(async () => {
  // Recent blog posts
  const { data: posts } = await sb.from('blog_posts').select('id, slug, title, category, published_at, status').order('published_at', { ascending: false }).limit(20);
  console.log('=== Recent 20 blog posts ===');
  for (const p of posts || []) console.log('  ' + (p.status || '').padEnd(10) + ' ' + (p.category || '').padEnd(20) + ' ' + p.slug);
  console.log();

  // Top by city
  const { data: all } = await sb.from('providers').select('id, name, slug, city, state, type, category, rating, reviews, is_claimed, website, description').eq('country','Canada').range(0, 1999);

  for (const city of ['Toronto', 'Vancouver']) {
    const list = (all || []).filter((p) => p.city === city && numRating(p.rating) != null && parseReviews(p.reviews) != null);
    list.forEach((p) => { p._rating = numRating(p.rating); p._rev = parseReviews(p.reviews); p._score = p._rating * Math.log10(1 + p._rev); });
    list.sort((a, b) => b._score - a._score);
    console.log('=== ' + city + ' top 15 ===');
    for (const p of list.slice(0, 15)) {
      console.log('  ' + p._rating.toFixed(1) + '* ' + String(p._rev).padStart(5) + 'rev  ' + (p.is_claimed ? '[CLAIMED] ' : '          ') + (p.type || '?').padEnd(10) + ' ' + p.name + '  ' + (p.slug));
    }
    console.log();
  }
})();
