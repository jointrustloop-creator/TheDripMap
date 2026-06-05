/**
 * Re-audit the 59-slug Phase 2 hide list before any UPDATE runs.
 *
 * Rule (operator-supplied): hide only providers with NO real IV offering.
 * Keep any genuine IV clinic even if it also lists peptides.
 *
 * The previous classifier only inspected description + specialties + category.
 * It missed clinics whose IV signal lives in the NAME (e.g.
 * natura-med-spa-and-iv-bar-denver has "IV Bar" in the name). This pass
 * widens the check to: name + slug + specialties + subtypes + services
 * (name and description) + description + category.
 */
require('dotenv').config({ path: '.env.local' });
const sb = require('@supabase/supabase-js').createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const HIDE_CANDIDATES = [
  'vitalitymd-toronto',
  'men-s-vitality-clinic-vancouver',
  'dr-bobby-s-clinic-calgary',
  'tbt-medical-edmonton',
  'toronto-plastic-surgeons-wellness-centre-toronto',
  'gameday-men-s-health-north-york-north-york',
  'revolution-medical-clinic-vancouver',
  'dr-kris-conrad-toronto',
  'sparrow-md-advanced-medical-aesthetics-vancouver',
  'enerchanges-vancouver',
  'citrin-wellness-beverly-hills',
  'regenerative-health-ny-little-neck',
  'alphaman-clinic-sherman-oaks',
  'tower-urology-medical-group-los-angeles',
  'renew-beauty-med-spa-and-wellness-dallas',
  'infinity-premier-health-houston',
  'integrative-wellness-fx-dallas',
  'vida-integrative-health-miami',
  'evolv-wellness-medspa-denver',
  'gameday-men-s-health-dallas-north-dallas',
  'executive-medicine-of-texas-southlake',
  'lume-wellness-chicago',
  'colorado-medical-solutions-denver',
  'aspire-rejuvenation-plano',
  'gleam-medical-spa-denver',
  'thrive-health-solutions-englewood',
  'physio-logic-nyc-brooklyn',
  'restorative-injectables-med-spa-denver',
  'wellness-at-century-city-los-angeles',
  'hebe-aesthetics-and-vitality-atlanta',
  'peptide-balance-clinic-las-vegas-las-vegas',
  'age-well-atl-atlanta',
  'moksha-aesthetics-potomac',
  'center-for-plastic-surgery-chevy-chase',
  'renewalpeptides-las-vegas-las-vegas',
  'elevate-miami-miami',
  'elite-health-center-nyc-new-york',
  'weiss-wellness-beauty-new-york',
  'houston-regenerative-medicine-houston',
  'htx-urology-webster',
  'tribecamed-miami-beach',
  'chicago-aesthetics-surgery-and-med-spa-chicago',
  'z-med-clinic-and-med-spa-houston',
  'the-biostation-miami-beach',
  'evexias-medical-center-denver-lone-tree',
  'omni-sculpt-md-dallas',
  'prive-aesthetics-dallas',
  'houston-men-s-health-clinic-houston',
  'daniel-benhuri-md-beverly-hills',
  'juventas-wellness-denver',
  'dr-sende-wellness-miami',
  'michael-aziz-md-and-associates-new-york',
  'north-dallas-dermatology-associates-dallas',
  'wholehealth-chicago-chicago',
  'natura-med-spa-and-iv-bar-denver',
  'dr-jennifer-levine-new-york',
  'pure-medical-spa-chicago',
  'elysium-aesthetics-longevity-chicago',
  'progressive-medical-center-atlanta',
];

// Strong IV-therapy signals — if any of these appear in any examined field,
// the provider has a real IV offering and must NOT be hidden.
const IV_SIGNAL_PATTERNS = [
  /\biv\s*therapy\b/i,
  /\biv\s*hydration\b/i,
  /\biv\s*infusion\b/i,
  /\biv\s*drip\b/i,
  /\biv\s*bar\b/i,                 // "IV Bar" in name (e.g. Natura Med Spa & IV Bar)
  /\biv\s*lounge\b/i,
  /\biv\s*vitamin\b/i,
  /\bivs?\b/i,                     // bare "IV" / "IVs" in name or services
  /\bmyers\b/i,
  /\bnad\+?\b/i,
  /\bhangover\b/i,
  /\bhydration\s*drip\b/i,
  /\bvitamin\s*iv\b/i,
  /\bwellness\s*iv\b/i,
  /\bwellness\s*drip\b/i,
  /\bdrip\s*bar\b/i,
  /\bdrip\s*lounge\b/i,
  /\bivc\b/i,                      // high-dose vitamin C IV
  /\bglutathione\s*push\b/i,
  /\bglutathione\s*drip\b/i,
  /\bvitamin\s*infusion\b/i,
];

function ivSignalIn(text) {
  if (!text) return null;
  for (const re of IV_SIGNAL_PATTERNS) {
    const m = text.match(re);
    if (m) return m[0];
  }
  return null;
}

(async () => {
  const { data, error } = await sb
    .from('providers')
    .select(
      'id, slug, name, city, country, state, category, specialties, subtypes, services, description, is_claimed'
    )
    .in('slug', HIDE_CANDIDATES);
  if (error) {
    console.error('Fetch failed:', error.message);
    process.exit(1);
  }
  console.log('Audited:', data.length, 'of', HIDE_CANDIDATES.length, 'slugs');

  const stillHide = [];
  const flippedToKeep = [];

  for (const p of data) {
    const services = Array.isArray(p.services)
      ? p.services
          .map((s) =>
            typeof s === 'string'
              ? s
              : (s && (s.name || s.description)
                  ? `${s.name || ''} ${s.description || ''}`
                  : '')
          )
          .join(' ')
      : '';
    const fields = {
      name: p.name || '',
      slug: p.slug || '',
      specialties: (p.specialties || []).join(' '),
      subtypes: (p.subtypes || []).join(' '),
      services,
      description: p.description || '',
      category: p.category || '',
    };

    let firstHit = null;
    let firstField = null;
    for (const [field, text] of Object.entries(fields)) {
      const m = ivSignalIn(text);
      if (m) {
        firstHit = m;
        firstField = field;
        break;
      }
    }

    if (firstHit) {
      flippedToKeep.push({
        slug: p.slug,
        country: p.country,
        city: p.city,
        name: p.name,
        category: p.category,
        ivHit: `${firstField}: "${firstHit}"`,
      });
    } else {
      stillHide.push({
        slug: p.slug,
        country: p.country,
        city: p.city,
        name: p.name,
        category: p.category,
        specialties: p.specialties || [],
      });
    }
  }

  console.log();
  console.log('=== FLIPPED to KEEP (' + flippedToKeep.length + ' providers, real IV signal found) ===');
  for (const r of flippedToKeep) {
    console.log(`  ${r.country.slice(0, 2)} | ${r.slug}`);
    console.log(`     name: ${r.name}`);
    console.log(`     IV signal in ${r.ivHit}`);
  }

  console.log();
  console.log('=== STILL HIDE (' + stillHide.length + ' providers, peptide-only) ===');
  const ca = stillHide.filter((r) => r.country === 'Canada');
  const us = stillHide.filter((r) => r.country === 'United States');
  console.log('Canada (' + ca.length + '):');
  for (const r of ca) {
    console.log(`  ${r.slug}`);
    console.log(`     name: ${r.name} | category: ${r.category}`);
    console.log(`     specialties: ${JSON.stringify(r.specialties.slice(0, 6))}`);
  }
  console.log();
  console.log('US (' + us.length + '):');
  for (const r of us) {
    console.log(`  ${r.slug}`);
    console.log(`     name: ${r.name} | category: ${r.category}`);
    console.log(`     specialties: ${JSON.stringify(r.specialties.slice(0, 6))}`);
  }

  console.log();
  console.log('=== Summary ===');
  console.log('Original Phase 2 list: ' + HIDE_CANDIDATES.length);
  console.log('Flipped to KEEP (real IV signal): ' + flippedToKeep.length);
  console.log('Still HIDE (peptide-only): ' + stillHide.length);
})();
