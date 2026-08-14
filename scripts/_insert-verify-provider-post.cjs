// Insert the "how to verify your IV provider" guide (Trusted Source Plan,
// content 02). Same validation + cannibalization guard as the content engine:
// meta lengths, FAQ schema, no en/em dashes, root-relative internal links.
// Run with --dry to preview; no flag inserts.
require('dotenv').config({ path: '.env.local', override: true });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const DIR = path.join(__dirname, '..', 'docs', 'content-engine', 'posts');
const DRY = process.argv.includes('--dry');

const P = {
  file: 'how-to-verify-iv-provider-license-canada-2026.md',
  slug: 'how-to-verify-iv-provider-license-canada-2026',
  title: 'How to Check if Your IV Provider Is Actually Licensed (2026)',
  meta_title: 'Check if Your IV Provider Is Licensed (2026)',
  meta_description:
    'Look up any Canadian IV clinic yourself in two minutes. The public registers for nurses, physicians and naturopaths by province, and what a valid entry shows.',
  excerpt:
    'Every regulated health professional in Canada is on a free public register. Here is exactly how to look up who administers your IV and who prescribes it, province by province.',
  related_cities: [],
  query_family: 'verify nurse license canada / check naturopath IV authorization / IVIT premises register',
};

const CATEGORY = 'Educational';
const AUTHOR = 'TheDripMap Editorial';

async function cannibalizationCheck(p) {
  let all = [], f = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) { const { data } = await s.from('blog_posts').select('slug,title').range(f, f + 499); if (!data || !data.length) break; all = all.concat(data); if (data.length < 500) break; f += 500; }
  const STOP = new Set(['the','a','an','in','on','of','for','and','or','to','you','your','can','how','what','is','iv','therapy','canada','canadian','2026','guide','complete']);
  const toks = (x) => new Set(String(x || '').toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/[\s-]+/).filter((w) => w.length > 2 && !STOP.has(w)));
  const mine = toks(p.title + ' ' + p.slug);
  const overlaps = [];
  for (const ex of all) {
    if (ex.slug === p.slug) continue;
    const theirs = toks((ex.title || '') + ' ' + (ex.slug || ''));
    const shared = [...mine].filter((t) => theirs.has(t));
    if (mine.size && shared.length / mine.size >= 0.5) overlaps.push(`${ex.slug} (shares: ${shared.join(',')})`);
  }
  return overlaps;
}

function validate(p, content) {
  const problems = [];
  if (p.meta_title.length > 60) problems.push(`meta_title ${p.meta_title.length}>60`);
  if (p.meta_description.length > 160) problems.push(`meta_description ${p.meta_description.length}>160`);
  if (!/##\s+Frequently asked questions/i.test(content)) problems.push('no FAQ heading');
  const qCount = (content.match(/\n###\s+/g) || []).length;
  if (qCount < 3) problems.push(`only ${qCount} FAQ questions`);
  if (/[‒–—―−]/.test(content)) problems.push('contains en/em/figure dash');
  const badLinks = (content.match(/\]\(https?:\/\/www\.thedripmap\.com/g) || []).length;
  if (badLinks) problems.push(`${badLinks} absolute self-links (use root-relative)`);
  return { problems, qCount };
}

(async () => {
  const now = new Date().toISOString();
  const content = fs.readFileSync(path.join(DIR, P.file), 'utf8');
  const { problems, qCount } = validate(P, content);
  const { data: existing } = await s.from('blog_posts').select('slug').eq('slug', P.slug).maybeSingle();
  if (!existing) {
    const overlaps = await cannibalizationCheck(P);
    if (overlaps.length) problems.push('CANNIBALIZATION RISK vs: ' + overlaps.join(' | '));
  }
  const status = existing ? 'EXISTS-SKIP' : problems.length ? 'BLOCKED' : 'OK';
  console.log(`[${status}] ${P.slug}`);
  console.log(`  title(${P.title.length}) meta_title(${P.meta_title.length}) meta_desc(${P.meta_description.length}) faqs(${qCount}) words(${content.split(/\s+/).length})`);
  if (problems.length) console.log('  PROBLEMS: ' + problems.join('; '));
  if (DRY || existing || problems.length) return;

  const row = {
    slug: P.slug, title: P.title, content, excerpt: P.excerpt,
    category: CATEGORY, author: AUTHOR, date: now, last_updated: now,
    meta_title: P.meta_title, meta_description: P.meta_description,
    related_cities: P.related_cities, related_clinics: [], image_url: null, author_image_url: null,
    metaTitle: P.meta_title, metaDescription: P.meta_description,
    relatedCities: P.related_cities, relatedClinics: [], imageUrl: null, authorImageUrl: null,
    lastUpdated: now, reviewedBy: null,
  };
  const { error } = await s.from('blog_posts').insert(row);
  if (error) { console.log('  INSERT ERROR: ' + error.message); return; }
  console.log('  inserted OK');
})();
