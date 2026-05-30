// Dry-run dedup across all 3 Canadian candidate files against the live DB.
// Reports what would be inserted, dropped as duplicate, or flagged for review.
// Does NOT touch the DB.

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const slugify = (s) =>
  (s || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const hostOf = (url) => {
  try {
    return new URL(/^https?:\/\//.test(url) ? url : 'https://' + url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
};

const normName = (n) =>
  (n || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

(async () => {
  // 1. Load all 3 candidate files
  const files = [
    'scripts/gta-candidates-toronto-york.json',     // 50 from earlier run
    'scripts/gta-small-cities-candidates.json',     // 92 just landed
    'scripts/bc-small-cities-candidates.json',      // 72 just landed
  ];
  const candidates = [];
  for (const f of files) {
    if (!fs.existsSync(f)) {
      console.log('  (skipped — missing) ' + f);
      continue;
    }
    try {
      const arr = JSON.parse(fs.readFileSync(f, 'utf8'));
      for (const c of arr) candidates.push({ ...c, _source: f.replace(/^scripts\//, '') });
    } catch (e) {
      console.error('  PARSE FAIL: ' + f + ' — ' + e.message);
    }
  }
  console.log('Loaded raw candidates: ' + candidates.length);
  console.log('  by source:');
  const bySrc = {};
  candidates.forEach((c) => { bySrc[c._source] = (bySrc[c._source] || 0) + 1; });
  Object.entries(bySrc).forEach(([k, v]) => console.log('    ' + k + ': ' + v));

  // 2. Pull existing ON + BC providers
  const { data: existing } = await sb
    .from('providers')
    .select('name, city, state, website')
    .or('state.ilike.Ontario,state.ilike.British Columbia');
  const existingHosts = new Set();
  const existingNameCity = new Set(); // normalized "name | city" key
  for (const p of existing || []) {
    const h = hostOf(p.website || '');
    if (h) existingHosts.add(h);
    existingNameCity.add(normName(p.name) + ' | ' + normName(p.city || ''));
  }
  console.log('\nExisting Canadian providers in DB: ' + (existing?.length || 0));
  console.log('  unique website hosts: ' + existingHosts.size);

  // 3. Dedup candidates internally (by host, then by name+city)
  const seenHosts = new Set();
  const seenNameCity = new Set();
  const survivors = [];
  const internalDupes = [];
  for (const c of candidates) {
    const h = hostOf(c.website || '');
    const k = normName(c.name) + ' | ' + normName(c.city || '');
    // intra-batch dupe?
    if (h && seenHosts.has(h)) {
      internalDupes.push({ ...c, _why: 'intra-batch same host: ' + h });
      continue;
    }
    if (seenNameCity.has(k)) {
      internalDupes.push({ ...c, _why: 'intra-batch same name+city' });
      continue;
    }
    seenHosts.add(h);
    seenNameCity.add(k);
    survivors.push(c);
  }
  console.log('\nAfter intra-batch dedup: ' + survivors.length + ' (dropped ' + internalDupes.length + ' intra-batch dupes)');

  // 4. Dedup against existing DB
  const toInsert = [];
  const dbDupes = [];
  for (const c of survivors) {
    const h = hostOf(c.website || '');
    const k = normName(c.name) + ' | ' + normName(c.city || '');
    if (h && existingHosts.has(h)) {
      // Same host — could be multi-location chain (Skin Vitality, NewM, Beauty Bar etc).
      // Check if name+city matches anything existing; if not, it's a new location
      // and we keep it. Otherwise it's a true dupe.
      if (existingNameCity.has(k)) {
        dbDupes.push({ ...c, _why: 'db dupe — host AND name+city both match' });
        continue;
      }
      // Different name or different city on a shared hostname — keep as new location
      toInsert.push({ ...c, _multiLocation: true });
      continue;
    }
    if (existingNameCity.has(k)) {
      dbDupes.push({ ...c, _why: 'db dupe — same name+city, different host' });
      continue;
    }
    toInsert.push(c);
  }

  console.log('\nAfter DB dedup:');
  console.log('  net-new to insert: ' + toInsert.length);
  console.log('  multi-location (shared host with existing): ' + toInsert.filter((c) => c._multiLocation).length);
  console.log('  dropped as DB dupes: ' + dbDupes.length);

  // 5. Group survivors by city for the user-facing report
  const byCity = {};
  for (const c of toInsert) {
    const key = (c.city || '?') + ', ' + (c.state || '?');
    byCity[key] = (byCity[key] || 0) + 1;
  }
  console.log('\nNet-new per city:');
  Object.entries(byCity)
    .sort((a, b) => b[1] - a[1])
    .forEach(([k, v]) => console.log('  ' + k + ': ' + v));

  // 6. Schema sanity check — service vocab + required fields
  const ALLOWED_SERVICES = new Set([
    'IV Therapy', 'Hydration', 'Myers Cocktail', 'NAD+', 'Glutathione', 'Vitamin C', 'Iron Infusion',
    'Vitamin Injections', 'Immune', 'Hangover', 'Recovery', 'Energy', 'Beauty Glow', 'Weight Loss',
    'Mobile IV', 'Peptide Therapy', 'Hormone Therapy', 'GLP-1 Weight Loss',
  ]);
  const schemaIssues = [];
  for (const c of toInsert) {
    if (!c.name || !c.city || !c.state || !c.country) {
      schemaIssues.push({ name: c.name, issue: 'missing required field' });
      continue;
    }
    const badSvcs = (c.services || []).filter((s) => !ALLOWED_SERVICES.has(s));
    if (badSvcs.length) {
      schemaIssues.push({ name: c.name, issue: 'invalid services: ' + badSvcs.join(', ') });
    }
  }
  console.log('\nSchema sanity:');
  console.log('  issues: ' + schemaIssues.length);
  if (schemaIssues.length) {
    schemaIssues.slice(0, 10).forEach((i) => console.log('    ✗ ' + i.name + ' — ' + i.issue));
    if (schemaIssues.length > 10) console.log('    (... and ' + (schemaIssues.length - 10) + ' more)');
  }

  // 7. Save the resolved insert list for the next step
  fs.writeFileSync(
    'scripts/_canadian-candidates-ready-to-insert.json',
    JSON.stringify(
      toInsert.map((c) => {
        const { _source, _multiLocation, ...rest } = c;
        return rest;
      }),
      null,
      2
    )
  );
  console.log('\nSaved ready-to-insert list: scripts/_canadian-candidates-ready-to-insert.json');
  console.log('  ' + toInsert.length + ' rows; run insert script next.');

  // 8. Save dupes for review
  fs.writeFileSync(
    'scripts/_canadian-candidates-dropped-dupes.json',
    JSON.stringify({ internal: internalDupes, db: dbDupes }, null, 2)
  );
})();
