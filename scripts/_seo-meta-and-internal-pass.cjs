/**
 * META + INTERNAL passes on the audit-flagged blog posts.
 *
 * META pass (17 affected posts):
 *   - meta_title > 70 chars: trim to <=60 at clean word boundary.
 *   - meta_description > 180 chars: trim to first complete sentence
 *     within 160 chars, else word-boundary truncate.
 *   - image_url missing: fill with a category-appropriate default
 *     from the blog-images storage bucket.
 *
 * INTERNAL pass (27 affected posts):
 *   - Insert a "## Related on TheDripMap" section just before the
 *     FAQ heading with 3-5 contextual internal links derived from
 *     the post's title/slug (city, treatment, regulation guide,
 *     and the search hub).
 *
 * Idempotent: skip a post if it already passes the relevant audit
 * check.
 */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const sb = require('@supabase/supabase-js').createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const IMG_BASE = 'https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images';

// ============================================================
// META TRIM HELPERS
// ============================================================
function trimMetaTitle(title, target = 60) {
  if (!title || title.length <= target) return title;
  // Try to trim from the right at a word boundary while preserving any
  // " - X" or " | X" suffix.
  const sepIdx = Math.max(title.lastIndexOf(' - '), title.lastIndexOf(' | '));
  if (sepIdx > 0 && sepIdx < target) {
    const suffix = title.slice(sepIdx);
    const headRoom = target - suffix.length;
    const head = title.slice(0, headRoom).replace(/\s+\S*$/, '').trim();
    return head + suffix;
  }
  return title.slice(0, target).replace(/\s+\S*$/, '').trim();
}

function trimMetaDescription(desc, target = 160) {
  if (!desc || desc.length <= target) return desc;
  // Look for the last sentence boundary (".", "!", "?") before the cap.
  const head = desc.slice(0, target + 1);
  const lastPeriod = Math.max(
    head.lastIndexOf('. '),
    head.lastIndexOf('! '),
    head.lastIndexOf('? ')
  );
  if (lastPeriod > target * 0.6) {
    return desc.slice(0, lastPeriod + 1).trim();
  }
  // Else word-boundary truncate.
  return desc.slice(0, target).replace(/\s+\S*$/, '').trim() + '.';
}

// Category-appropriate fallback hero images for the 3 missing-image posts.
const IMAGE_FALLBACKS = {
  'iv-therapy-cost-canada-2026': 'iv-therapy-vitamin-drip-citrus.jpg',
  'mobile-iv-therapy-canada-laws-province-by-province': 'mobile-iv-therapy-kit-home-delivery.jpg',
  'iv-therapy-laws-canada-province-by-province-2026': 'iv-therapy-clinical-medical-setting.jpg',
};

// ============================================================
// INTERNAL LINK BUILDER
// ============================================================
const CITY_PATHS = {
  toronto: '/cities/toronto-on',
  vancouver: '/cities/vancouver-bc',
  calgary: '/cities/calgary-ab',
  edmonton: '/cities/edmonton-ab',
  ottawa: '/cities/ottawa-on',
  montreal: '/cities/montreal-qc',
  mississauga: '/cities/mississauga-on',
  'north-york': '/cities/toronto-on',
  yorkville: '/cities/toronto-on',
  oakville: '/cities/oakville-on',
  brampton: '/cities/brampton-on',
  hamilton: '/cities/hamilton-on',
  burlington: '/cities/burlington-on',
  markham: '/cities/markham-on',
  manhattan: '/cities/new-york-ny',
  brooklyn: '/cities/new-york-ny',
  nyc: '/cities/new-york-ny',
  'new-york': '/cities/new-york-ny',
  miami: '/cities/miami-fl',
  boston: '/cities/boston-ma',
  chicago: '/cities/chicago-il',
  'los-angeles': '/cities/los-angeles-ca',
  'san-francisco': '/cities/san-francisco-ca',
  'san-diego': '/cities/san-diego-ca',
  phoenix: '/cities/phoenix-az',
  dallas: '/cities/dallas-tx',
  houston: '/cities/houston-tx',
  philadelphia: '/cities/philadelphia-pa',
  atlanta: '/cities/atlanta-ga',
  'washington-dc': '/cities/washington-dc',
  denver: '/cities/denver-co',
  'las-vegas': '/cities/las-vegas-nv',
};
const TREATMENT_KEYWORDS = {
  myers: { label: 'Myers Cocktail', path: '/treatments/myers-cocktail' },
  'nad-plus': { label: 'NAD+ IV therapy', path: '/treatments/nad-plus' },
  'nad+': { label: 'NAD+ IV therapy', path: '/treatments/nad-plus' },
  glutathione: { label: 'Glutathione IV therapy', path: '/treatments/glutathione' },
  hangover: { label: 'Hangover IV therapy', path: '/treatments/hangover' },
  hydration: { label: 'IV hydration therapy', path: '/treatments/hydration' },
  'b12': { label: 'B12 IV therapy', path: '/treatments/vitamin-b12' },
  iron: { label: 'IV iron infusion', path: '/treatments/iron' },
  'vitamin-c': { label: 'High-dose vitamin C IV', path: '/treatments/vitamin-c' },
  ozone: { label: 'Ozone IV therapy', path: '/treatments/ozone' },
  magnesium: { label: 'Magnesium IV therapy', path: '/treatments/magnesium' },
  mobile: { label: 'Mobile IV therapy', path: '/treatments/mobile-iv' },
  immune: { label: 'Immune support IV', path: '/treatments/immune-boost' },
  biotin: { label: 'Biotin IV therapy', path: '/treatments/biotin' },
  saline: { label: 'Saline IV therapy', path: '/treatments/hydration' },
};
const CANADIAN_KEYWORDS = ['canada', 'canadian', 'toronto', 'vancouver', 'calgary', 'edmonton', 'ottawa', 'montreal', 'mississauga', 'oakville', 'north-york', 'yorkville', 'gta', 'ontario', 'quebec', 'alberta', 'british-columbia'];

function buildRelatedSection(slug, title, content) {
  const slugLc = slug.toLowerCase();
  const titleLc = (title || '').toLowerCase();
  const contentLc = (content || '').toLowerCase();
  const links = [];

  // 1. City link (if a city is detected).
  for (const [key, p] of Object.entries(CITY_PATHS)) {
    if (slugLc.includes(key) || titleLc.includes(key.replace('-', ' '))) {
      const cityName = key.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      links.push({ label: 'Find IV therapy clinics in ' + cityName, url: 'https://www.thedripmap.com' + p });
      break;
    }
  }

  // 2. Treatment link (if a treatment is detected).
  for (const [key, t] of Object.entries(TREATMENT_KEYWORDS)) {
    if (slugLc.includes(key) || titleLc.includes(key.replace('-', ' '))) {
      links.push({ label: t.label + ' guide', url: 'https://www.thedripmap.com' + t.path });
      break;
    }
  }

  // 3. Canadian regulations guide (for Canadian posts).
  const isCanadian = CANADIAN_KEYWORDS.some((k) => slugLc.includes(k) || titleLc.includes(k));
  if (isCanadian) {
    links.push({ label: 'Canadian IV clinic regulations 2026', url: 'https://www.thedripmap.com/blog/canadian-iv-clinic-regulations-2026' });
  }

  // 4. Safety checklist (universal).
  links.push({ label: '7 questions to ask before IV therapy', url: 'https://www.thedripmap.com/blog/7-questions-before-iv-therapy' });

  // 5. The matching platform / search.
  links.push({ label: 'Browse all IV therapy clinics', url: 'https://www.thedripmap.com/search' });

  // Deduplicate by URL.
  const seen = new Set();
  const unique = links.filter((l) => { if (seen.has(l.url)) return false; seen.add(l.url); return true; });
  // Cap at 5.
  return unique.slice(0, 5);
}

function insertRelatedSection(content, links) {
  let block = '## Related on TheDripMap\n\n';
  for (const l of links) {
    block += '- [' + l.label + '](' + l.url + ')\n';
  }
  block += '\n';
  // Insert before FAQ if present, else before last h2, else append.
  const faqMatch = content.match(/##\s+Frequently\s+Asked\s+Questions/i);
  if (faqMatch) {
    return content.slice(0, faqMatch.index) + block + content.slice(faqMatch.index);
  }
  const lastH2 = content.lastIndexOf('\n## ');
  if (lastH2 > -1) {
    return content.slice(0, lastH2 + 1) + block + content.slice(lastH2 + 1);
  }
  return content.trimEnd() + '\n\n' + block;
}

// ============================================================
// MAIN
// ============================================================
const META_FIX_SLUGS = [
  'iv-therapy-cost-canada-2026',
  'peptide-therapy-guide-2026',
  'how-to-start-iv-therapy-business-2026',
  'mobile-iv-therapy-canada-laws-province-by-province',
  'biotin-iv-therapy-guide',
  'how-much-does-it-cost-to-open-iv-therapy-clinic',
  'mobile-iv-therapy-calgary',
  'mobile-iv-therapy-vancouver',
  'how-to-get-patients-iv-therapy-clinic-without-ads',
  'how-to-find-medical-director-iv-therapy-clinic',
  'iv-therapy-canada-complete-guide-2026',
  'thedripmap-launches-toronto-gta-iv-therapy',
  'ozempic-vitamin-gap-iv-therapy-real-prices-2026',
  'iv-therapy-laws-canada-province-by-province-2026',
  'mobile-iv-therapy-edmonton',
  'best-iv-therapy-vancouver-2026',
  'mobile-iv-therapy-ottawa',
];

const INTERNAL_FIX_SLUGS = [
  'vitamin-c-iv-therapy-guide', 'myers-cocktail-nyc', 'how-to-start-iv-therapy-business-2026',
  'iv-therapy-laws-by-state-2026', 'how-much-does-it-cost-to-open-iv-therapy-clinic',
  'hangover-iv-therapy-nyc', 'hsa-fsa-iv-therapy-reimbursement-united-states',
  'saline-iv-therapy-at-home-guide', 'iv-therapy-first-time-discount-guide',
  'iv-therapy-insurance-coverage-united-states', 'how-to-get-patients-iv-therapy-clinic-without-ads',
  'how-to-find-medical-director-iv-therapy-clinic', 'thedripmap-launches-toronto-gta-iv-therapy',
  '7-questions-before-iv-therapy', 'iv-therapy-vs-emergency-room-when-to-choose',
  'ozempic-vitamin-gap-iv-therapy-real-prices-2026', 'iv-therapy-medication-interactions-guide',
  'is-iv-therapy-a-scam-what-the-science-says', 'myers-cocktail-toronto',
  'b12-iv-vs-b12-injection-comparison', 'canadian-iv-clinic-regulations-2026',
  'magnesium-iv-therapy-guide', 'nad-plus-therapy-nyc', 'iv-therapy-for-wedding-day-prep',
  'mobile-iv-therapy-nyc', 'ozone-iv-therapy-guide', 'hangover-iv-therapy-toronto',
];

(async () => {
  const receipt = { phase: 'seo-meta-and-internal', timestamp: new Date().toISOString(), meta: [], internal: [], errors: [] };

  // META pass
  console.log('=== META PASS ===');
  for (const slug of META_FIX_SLUGS) {
    const { data: row } = await sb.from('blog_posts').select('id, title, content, excerpt, meta_title, meta_description, image_url').eq('slug', slug).maybeSingle();
    if (!row) { console.log('? not found: ' + slug); continue; }
    const updates = {};
    let note = [];
    if (row.meta_title && row.meta_title.length > 70) {
      const trimmed = trimMetaTitle(row.meta_title, 60);
      updates.meta_title = trimmed;
      updates.metaTitle = trimmed;
      note.push('title ' + row.meta_title.length + '->' + trimmed.length);
    }
    if (row.meta_description && row.meta_description.length > 180) {
      const trimmed = trimMetaDescription(row.meta_description, 160);
      updates.meta_description = trimmed;
      updates.metaDescription = trimmed;
      note.push('desc ' + row.meta_description.length + '->' + trimmed.length);
    }
    if (!row.image_url && IMAGE_FALLBACKS[slug]) {
      const url = IMG_BASE + '/' + IMAGE_FALLBACKS[slug];
      updates.image_url = url;
      updates.imageUrl = url;
      note.push('+ image ' + IMAGE_FALLBACKS[slug]);
    }
    if (Object.keys(updates).length === 0) { console.log('= ' + slug + ' (no changes needed)'); continue; }
    updates.last_updated = new Date().toISOString();
    updates.lastUpdated = updates.last_updated;
    const { error } = await sb.from('blog_posts').update(updates).eq('id', row.id);
    if (error) { console.log('!! ' + slug + ': ' + error.message); receipt.errors.push({ slug, op: 'meta', error: error.message }); continue; }
    receipt.meta.push({ slug, changes: note });
    console.log('+ ' + slug.padEnd(56) + ' ' + note.join('; '));
  }

  // INTERNAL pass
  console.log();
  console.log('=== INTERNAL PASS ===');
  for (const slug of INTERNAL_FIX_SLUGS) {
    const { data: row } = await sb.from('blog_posts').select('id, title, content').eq('slug', slug).maybeSingle();
    if (!row) { console.log('? not found: ' + slug); continue; }
    // Re-check link count - might already have been bumped to 3+ by an earlier pass.
    const c = row.content || '';
    const re = /\]\((https?:\/\/(www\.)?thedripmap\.com)?\/(clinics|cities|treatments|search|for-clinics|symptoms|iv-therapy|tools|blog|resources)\//g;
    const existingLinks = (c.match(re) || []).length;
    if (existingLinks >= 3) {
      console.log('= ' + slug + ' (now has ' + existingLinks + ' internal links - skipping)');
      continue;
    }
    const links = buildRelatedSection(slug, row.title, c);
    if (links.length < 2) {
      console.log('!! ' + slug + ' (could not build >=2 contextual links, skipping)');
      continue;
    }
    const newContent = insertRelatedSection(c, links);
    if (newContent === c) {
      console.log('!! ' + slug + ' (insertion did not change content)');
      continue;
    }
    const { error } = await sb.from('blog_posts').update({
      content: newContent,
      last_updated: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    }).eq('id', row.id);
    if (error) { console.log('!! ' + slug + ': ' + error.message); receipt.errors.push({ slug, op: 'internal', error: error.message }); continue; }
    receipt.internal.push({ slug, links_added: links.length, before: existingLinks, after_min: existingLinks + links.length });
    console.log('+ ' + slug.padEnd(56) + ' +' + links.length + ' links (was ' + existingLinks + ')');
  }

  console.log();
  console.log('META updated: ' + receipt.meta.length + ' | INTERNAL updated: ' + receipt.internal.length + ' | Errors: ' + receipt.errors.length);

  fs.mkdirSync('scripts/_receipts', { recursive: true });
  const outPath = path.join('scripts/_receipts', 'seo-meta-and-internal-' + Date.now() + '.json');
  fs.writeFileSync(outPath, JSON.stringify(receipt, null, 2));
  console.log('Receipt: ' + outPath);
})();
