/**
 * Corrected production 404 audit using the actual cities.slug values from
 * the cities table (not constructed from providers).
 */
require('dotenv').config({ path: '.env.local' });
const https = require('https');
const sb = require('@supabase/supabase-js').createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

function head(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'GET', timeout: 15000, rejectUnauthorized: false }, (res) => {
      // Drain so the connection releases
      res.on('data', () => {});
      res.on('end', () => resolve({ status: res.statusCode }));
    });
    req.on('error', (e) => resolve({ status: 'ERR', error: e.code || e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 'TIMEOUT' }); });
    req.end();
  });
}

(async () => {
  // === Blog posts ===
  const { data: posts } = await sb.from('blog_posts').select('slug').range(0, 999);
  console.log('=== BLOG POSTS: ' + posts.length + ' rows in DB ===');
  const blogR = { '200': 0, '404': 0, '500': 0, other: 0 };
  const blog404 = [];
  for (const p of posts) {
    const r = await head('https://www.thedripmap.com/blog/' + p.slug);
    const k = String(r.status);
    if (k === '200') blogR['200']++;
    else if (k === '404') { blogR['404']++; blog404.push(p.slug); }
    else if (k === '500') blogR['500']++;
    else blogR.other++;
  }
  console.log('  200: ' + blogR['200']);
  console.log('  404: ' + blogR['404']);
  console.log('  500: ' + blogR['500']);
  console.log('  other: ' + blogR.other);
  if (blog404.length) {
    console.log('  404 list:');
    for (const s of blog404) console.log('    ' + s);
  }
  console.log();

  // === Cities (use actual cities.slug values) ===
  const { data: cities } = await sb.from('cities').select('slug, name, state').not('slug', 'is', null).range(0, 999);
  console.log('=== CITY PAGES: ' + cities.length + ' rows in DB ===');
  const cityR = { '200': 0, '404': 0, '500': 0, other: 0 };
  const city404 = [];
  for (const c of cities) {
    const r = await head('https://www.thedripmap.com/cities/' + c.slug);
    const k = String(r.status);
    if (k === '200') cityR['200']++;
    else if (k === '404') { cityR['404']++; city404.push(c.slug + ' (' + c.name + (c.state ? ', ' + c.state : '') + ')'); }
    else if (k === '500') cityR['500']++;
    else cityR.other++;
  }
  console.log('  200: ' + cityR['200']);
  console.log('  404: ' + cityR['404']);
  console.log('  500: ' + cityR['500']);
  console.log('  other: ' + cityR.other);
  if (city404.length) {
    console.log('  404 list (first 30):');
    for (const s of city404.slice(0, 30)) console.log('    ' + s);
    if (city404.length > 30) console.log('    ...and ' + (city404.length - 30) + ' more');
  }
})();
