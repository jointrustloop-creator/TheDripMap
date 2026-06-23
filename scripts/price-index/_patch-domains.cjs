// Backfill the `domain` field into a pre-existing raw scrape cache (cities
// scraped before scrape.cjs captured domains), so aggregate()'s chain-dedup can
// collapse same-domain locations. Reads website per provider id from the DB.
//   node scripts/price-index/_patch-domains.cjs <city-slug>
require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const domainOf = (u) => { try { return new URL(/^https?:\/\//i.test(u) ? u : 'https://' + u).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; } };

(async () => {
  const citySlug = (process.argv[2] || '').toLowerCase().trim();
  const rawPath = path.join('C:/Users/Dell/Desktop/TheDripMap/.audit-tmp/price-index', `${citySlug}-raw.json`);
  if (!fs.existsSync(rawPath)) { console.log('no cache at ' + rawPath); process.exit(1); }
  const cache = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
  const ids = Object.keys(cache.byProvider || {});
  const { data } = await s.from('providers').select('id,website,name').in('id', ids);
  const byId = new Map((data || []).map((r) => [r.id, r]));
  let patched = 0, missing = 0;
  for (const id of ids) {
    const row = byId.get(id);
    const dom = row ? domainOf(row.website) : '';
    cache.byProvider[id].domain = dom;
    if (dom) patched++; else missing++;
  }
  fs.writeFileSync(rawPath, JSON.stringify(cache, null, 2));
  console.log(`patched ${patched} entries with a domain (${missing} had none) -> ${rawPath}`);
  // quick chain preview
  const counts = {};
  for (const id of ids) { const d = cache.byProvider[id].domain || '(none)'; counts[d] = (counts[d] || 0) + 1; }
  const chains = Object.entries(counts).filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]);
  console.log('multi-location domains in this city: ' + (chains.length ? chains.map(([d, n]) => d + ' x' + n).join(', ') : '(none)'));
  process.exit(0);
})().catch((e) => { console.log('FATAL', e.message); process.exit(1); });
