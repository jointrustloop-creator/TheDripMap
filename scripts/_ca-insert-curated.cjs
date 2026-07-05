/**
 * Curated insert of NEW Canadian IV/wellness clinics from the scrape.
 * Allow-list only: hospitals, health authorities, government, US clinics, and
 * generic/uncertain entries are excluded for data quality. Real data only.
 * DRY by default; pass "apply" to write.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local'), override: true });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY = process.argv[2] === 'apply';
const cands = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '.audit-tmp', '_ca-scrape-candidates.json'), 'utf8'));

// Hand-vetted: domain -> clean clinic name. Only real Canadian IV/wellness clinics.
// 2026-07-04 discovery pass. Dropped: hospitals/health authorities (Fraser/AHS/
// Misericordia/VCH/Island/Interior Health), news (CBC, Montreal Gazette), placeholder/
// mismatched emails (mysite.com, panda/rva), US false-positives (Waterloo IA, Richmond
// VA), a UK chain (Get A Drip), and a dup already drafted (TruMed).
const ALLOW = {
  'thehealthbar.biz': 'The Health Bar',
  'balanceintegrativehealth.ca': 'Balance Integrative Health',
  'driplounge.ca': 'Drip Lounge',
  'easyalliedhealth.ca': 'Easy Allied Health',
  'drmikaylamilne.com': 'Serenity Health',
  'colabhealthandbody.ca': 'CoLab Health and Body',
  'elysianwellnesscentre.com': 'Elysian Wellness Centre',
  'caremedwellness.ca': 'CareMed Wellness',
  'idealbodyclinic.com': 'Ideal Body Clinic',
  'elev8aesthetics.ca': 'Elev8 Aesthetic Medicine',
  'kwc-aestheticsbysam.com': 'KWC Aesthetics by Sam',
  'alliesintegrated.health': 'Allies Integrated Health',
  'pinkalhealth.com': 'Pinkal Medical Aesthetics',
  'londonplasticsurgery.ca': 'London Plastic Surgery',
  'royalmedicalspa.ca': 'Royal Medical Spa',
  'mobilerevivedrip.com': 'Revive Drip',
  'dynamicdrips.com': 'Dynamic Drips',
  'jpdwellness.com': 'JPD Wellness',
};
const slugify = (x) => (x || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

(async () => {
  let provs = [], from = 0;
  while (true) { const { data } = await s.from('providers').select('slug').range(from, from + 999); provs = provs.concat(data || []); if (!data || data.length < 1000) break; from += 1000; }
  const haveSlug = new Set(provs.map((p) => p.slug));
  const used = new Set();

  const rows = [];
  for (const c of cands) {
    const name = ALLOW[c.domain];
    if (!name) continue;
    let slug = slugify(name) + '-' + slugify(c.city);
    let n = 2; while (haveSlug.has(slug) || used.has(slug)) slug = slugify(name) + '-' + slugify(c.city) + '-' + n++;
    used.add(slug);
    rows.push({
      name, slug, city: c.city, state: c.prov, country: 'Canada',
      email: c.hasEmail ? c.email : null, phone: c.phone || null,
      website: 'https://' + c.domain, category: 'IV Therapy', availability: true, is_claimed: false,
      decision_drivers: { source: 'ca_scrape_2026_07_04' },
    });
  }
  console.log(`curated to insert: ${rows.length} (${rows.filter((r) => r.email).length} with email)`);
  rows.forEach((r) => console.log(`  ${r.name} [${r.city}, ${r.state}] ${r.email || '(no email)'}`));
  if (!APPLY) { console.log('\nDRY. Re-run with "apply".'); process.exit(0); }
  let ok = 0;
  for (const r of rows) { const { error } = await s.from('providers').insert(r); if (error) console.log('ERR ' + r.name + ': ' + error.message); else ok++; }
  console.log(`\nINSERTED ${ok}/${rows.length}.`);
  process.exit(0);
})().catch((e) => { console.log('FATAL', e.message); process.exit(1); });
