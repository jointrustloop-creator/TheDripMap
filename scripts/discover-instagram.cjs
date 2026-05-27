// For each clinic in scripts/ig-candidates.json:
//   1. Fetch their website
//   2. Extract Instagram handle from href / mailto / footer
//   3. Optionally fetch the IG profile page for follower hint
//   4. Save results to scripts/ig-discovery-results.json

require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const fs = require('fs');

const candidates = JSON.parse(fs.readFileSync('C:/Users/Dell/Desktop/TheDripMap/scripts/ig-candidates.json', 'utf8'));
const TIMEOUT_MS = 8000;
const CONCURRENCY = 10;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

const IG_PATTERNS = [
  /https?:\/\/(?:www\.)?instagram\.com\/([A-Za-z0-9_.]+)/gi,
  /instagram\.com\\?\/([A-Za-z0-9_.]+)/gi,
];

const IGNORE_HANDLES = new Set([
  'instagram', 'sharer', 'share', 'p', 'reel', 'reels', 'explore', 'tv', 'stories', 'about',
  'developer', 'directory', 'legal', 'privacy', 'safety', 'help', 'login', 'signup',
  'accounts', 'web', 'embed', 'create',
]);

async function fetchWithTimeout(url, ms = TIMEOUT_MS) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal, redirect: 'follow',
      headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml' },
    });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('html') && !ct.includes('text')) return null;
    return await res.text();
  } catch { return null; } finally { clearTimeout(t); }
}

function extractInstagramHandle(html) {
  if (!html) return null;
  const found = new Set();
  for (const re of IG_PATTERNS) {
    let m;
    re.lastIndex = 0;
    while ((m = re.exec(html)) !== null) {
      const handle = m[1].toLowerCase().replace(/\/$/, '').replace(/\?.*$/, '');
      if (handle && handle.length > 1 && handle.length < 31 && !IGNORE_HANDLES.has(handle)) {
        found.add(handle);
      }
    }
  }
  if (found.size === 0) return null;
  // Prefer the one that's NOT a generic share link
  const arr = [...found];
  return arr[0];
}

async function discover(c) {
  // 1. Try homepage of clinic
  let html = await fetchWithTimeout(c.website);
  let handle = extractInstagramHandle(html);

  // 2. If not, try /contact
  if (!handle) {
    const base = c.website.replace(/\/$/, '').split('?')[0];
    const candidates = [`${base}/contact`, `${base}/contact-us`, `${base}/about`];
    for (const path of candidates) {
      html = await fetchWithTimeout(path);
      handle = extractInstagramHandle(html);
      if (handle) break;
    }
  }

  return { slug: c.slug, name: c.name, city: c.city, state: c.state, rating: c.rating, reviews: c.reviews, is_featured: c.is_featured || false, instagram_handle: handle };
}

async function runPool(items, concurrency, worker) {
  const results = [];
  let idx = 0;
  async function next() {
    while (idx < items.length) {
      const i = idx++;
      try { results[i] = await worker(items[i], i); }
      catch (e) { results[i] = { slug: items[i].slug, error: e.message }; }
      if ((i + 1) % 5 === 0) console.log(`  …${i + 1}/${items.length}`);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, next));
  return results;
}

(async () => {
  console.log(`Discovering Instagram handles for ${candidates.length} clinics...`);
  const t0 = Date.now();
  const results = await runPool(candidates, CONCURRENCY, discover);
  console.log(`Done in ${((Date.now()-t0)/1000).toFixed(1)}s`);

  const withHandle = results.filter(r => r.instagram_handle);
  console.log(`\nWith Instagram handle: ${withHandle.length} / ${results.length}`);

  fs.writeFileSync('C:/Users/Dell/Desktop/TheDripMap/scripts/ig-discovery-results.json', JSON.stringify(results, null, 2));
  console.log('Saved to scripts/ig-discovery-results.json');
})();
