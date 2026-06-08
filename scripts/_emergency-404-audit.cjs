/**
 * Emergency: production reports widespread 404s on blog and city pages.
 * Pull every published blog_posts.slug and every providers.city, hit prod
 * for each, log the status. Identify the pattern of failures.
 */
require('dotenv').config({ path: '.env.local' });
const https = require('https');
const sb = require('@supabase/supabase-js').createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

function head(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'HEAD', timeout: 15000, rejectUnauthorized: false }, (res) => {
      resolve({ status: res.statusCode, age: res.headers['age'], cache: res.headers['x-vercel-cache'] });
    });
    req.on('error', (e) => resolve({ status: 'ERR', error: e.code || e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 'TIMEOUT' }); });
    req.end();
  });
}

(async () => {
  console.log('=== STATUS OF KEY ROUTES ===');
  for (const path of ['/', '/blog', '/cities', '/search', '/treatments', '/sitemap.xml']) {
    const r = await head('https://www.thedripmap.com' + path);
    console.log('  ' + path.padEnd(20) + ' status=' + r.status + (r.cache ? ' cache=' + r.cache : ''));
  }
  console.log();

  // === Blog posts ===
  const { data: posts } = await sb.from('blog_posts').select('slug, title, date').range(0, 999);
  console.log('=== BLOG POSTS: ' + posts.length + ' rows in DB ===');
  const blogResults = { '200': 0, '404': 0, '500': 0, other: 0 };
  const blog404 = [];
  let n = 0;
  for (const p of posts) {
    n++;
    const r = await head('https://www.thedripmap.com/blog/' + p.slug);
    const key = String(r.status);
    if (key === '200') blogResults['200']++;
    else if (key === '404') { blogResults['404']++; blog404.push(p.slug); }
    else if (key === '500') blogResults['500']++;
    else blogResults.other++;
    if (n % 20 === 0) process.stdout.write('.');
  }
  console.log();
  console.log('  200: ' + blogResults['200']);
  console.log('  404: ' + blogResults['404']);
  console.log('  500: ' + blogResults['500']);
  console.log('  other: ' + blogResults.other);
  if (blog404.length) {
    console.log();
    console.log('  404 list (first 30):');
    for (const s of blog404.slice(0, 30)) console.log('    ' + s);
    if (blog404.length > 30) console.log('    ...and ' + (blog404.length - 30) + ' more');
  }
  console.log();

  // === City pages ===
  const { data: providers } = await sb.from('providers').select('city, state, country').not('city', 'is', null).range(0, 1999);
  const citySet = new Set();
  for (const p of providers) {
    if (p.city) citySet.add(p.city);
  }
  // Build slug guess: lowercase, spaces+special -> hyphens
  function citySlugify(name) {
    return String(name).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-');
  }
  // We need to also append state to match the routes (/cities/toronto-on, /cities/calgary-ab)
  const cityRows = [];
  for (const p of providers) {
    if (!p.city || !p.state) continue;
    const stateAbbr = stateToAbbr(p.state);
    cityRows.push({ city: p.city, state: p.state, slug: citySlugify(p.city) + '-' + stateAbbr.toLowerCase() });
  }
  // Dedupe
  const uniqueCities = Array.from(new Map(cityRows.map((c) => [c.slug, c])).values());
  console.log('=== CITY PAGES: ' + uniqueCities.length + ' unique slugs ===');
  const cityResults = { '200': 0, '404': 0, '500': 0, other: 0 };
  const city404 = [];
  let cn = 0;
  for (const c of uniqueCities) {
    cn++;
    const r = await head('https://www.thedripmap.com/cities/' + c.slug);
    const key = String(r.status);
    if (key === '200') cityResults['200']++;
    else if (key === '404') { cityResults['404']++; city404.push(c.slug + ' (' + c.city + ', ' + c.state + ')'); }
    else if (key === '500') cityResults['500']++;
    else cityResults.other++;
    if (cn % 30 === 0) process.stdout.write('.');
  }
  console.log();
  console.log('  200: ' + cityResults['200']);
  console.log('  404: ' + cityResults['404']);
  console.log('  500: ' + cityResults['500']);
  console.log('  other: ' + cityResults.other);
  if (city404.length) {
    console.log();
    console.log('  404 list (first 30):');
    for (const c of city404.slice(0, 30)) console.log('    ' + c);
    if (city404.length > 30) console.log('    ...and ' + (city404.length - 30) + ' more');
  }
})();

function stateToAbbr(state) {
  const m = {
    'Ontario':'on','British Columbia':'bc','Alberta':'ab','Quebec':'qc','Manitoba':'mb','Nova Scotia':'ns','Saskatchewan':'sk','New Brunswick':'nb','Newfoundland and Labrador':'nl','Prince Edward Island':'pe','Northwest Territories':'nt','Nunavut':'nu','Yukon':'yt',
    'Alabama':'al','Alaska':'ak','Arizona':'az','Arkansas':'ar','California':'ca','Colorado':'co','Connecticut':'ct','Delaware':'de','Florida':'fl','Georgia':'ga','Hawaii':'hi','Idaho':'id','Illinois':'il','Indiana':'in','Iowa':'ia','Kansas':'ks','Kentucky':'ky','Louisiana':'la','Maine':'me','Maryland':'md','Massachusetts':'ma','Michigan':'mi','Minnesota':'mn','Mississippi':'ms','Missouri':'mo','Montana':'mt','Nebraska':'ne','Nevada':'nv','New Hampshire':'nh','New Jersey':'nj','New Mexico':'nm','New York':'ny','North Carolina':'nc','North Dakota':'nd','Ohio':'oh','Oklahoma':'ok','Oregon':'or','Pennsylvania':'pa','Rhode Island':'ri','South Carolina':'sc','South Dakota':'sd','Tennessee':'tn','Texas':'tx','Utah':'ut','Vermont':'vt','Virginia':'va','Washington':'wa','West Virginia':'wv','Wisconsin':'wi','Wyoming':'wy','District of Columbia':'dc'
  };
  return m[state] || state.toLowerCase().slice(0, 2);
}
