// Insert the two keyword-sprint posts (operator-approved copy 2026-08-16):
// the Myers ingredient reference + the skeptic guide. Same validation +
// cannibalization guard as the content engine. --dry previews; no flag inserts.
require('dotenv').config({ path: '.env.local', override: true });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const DIR = path.join(__dirname, '..', 'docs', 'content-engine', 'posts');
const DRY = process.argv.includes('--dry');
const CATEGORY = 'Educational';
const AUTHOR = 'TheDripMap Editorial';

const POSTS = [
  {
    file: 'what-is-in-a-myers-cocktail.md',
    slug: 'what-is-in-a-myers-cocktail',
    title: 'What Is in a Myers Cocktail? Every Ingredient, Explained',
    meta_title: 'What Is in a Myers Cocktail? Ingredients Explained',
    meta_description:
      'The canonical Myers cocktail ingredient list: magnesium, calcium, B vitamins, vitamin C. Plus real Canadian prices from 6 clinic menus and how recipes vary.',
    excerpt:
      'The Myers cocktail is the default drip on Canadian IV menus, but there is no standardized recipe. Here is what is typically in the bag, ingredient by ingredient, with real prices.',
    query_family: 'what is in a myers cocktail / myers cocktail ingredients / myers cocktail cost canada',
  },
  {
    file: 'is-iv-vitamin-therapy-worth-it-honest-guide.md',
    slug: 'is-iv-vitamin-therapy-worth-it-honest-guide',
    title: 'Is IV Vitamin Therapy Worth It? An Honest Look at the Evidence',
    meta_title: 'Is IV Vitamin Therapy Worth It? An Honest Look',
    meta_description:
      'What the evidence actually shows about IV vitamin drips, when they make sense, and when drinking water does the same job for free. Written by a directory.',
    excerpt:
      'We run an IV therapy directory, and this is the article that costs us money: what the evidence supports, what is marketing, and when an IV genuinely is the right tool.',
    query_family: 'is iv vitamin therapy worth it / iv drip vs drinking water / do iv drips work',
  },
];

async function cannibalizationCheck(p) {
  let all = [], f = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) { const { data } = await s.from('blog_posts').select('slug,title').range(f, f + 499); if (!data || !data.length) break; all = all.concat(data); if (data.length < 500) break; f += 500; }
  const STOP = new Set(['the','a','an','in','on','of','for','and','or','to','you','your','can','how','what','is','iv','therapy','canada','canadian','2026','guide','complete','every','look','honest']);
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
  if (/[‒–—―−]/.test(content)) problems.push('en/em dash found in content');
  if (/[‒–—―−]/.test(p.title + p.meta_title + p.meta_description + p.excerpt)) problems.push('dash in meta fields');
  if (!/^##\s+Frequently asked questions/im.test(content)) problems.push('missing FAQ heading');
  const faqBlock = content.match(/##\s+Frequently asked questions[\s\S]*$/i);
  const faqCount = faqBlock ? (faqBlock[0].match(/^###\s+/gm) || []).length : 0;
  if (faqCount < 3) problems.push(`only ${faqCount} FAQ items (<3)`);
  const badLinks = (content.match(/\]\((?!https?:\/\/|\/)[^)]+\)/g) || []);
  if (badLinks.length) problems.push(`non root-relative internal links: ${badLinks.join(' ')}`);
  return problems;
}

async function main() {
  for (const p of POSTS) {
    const content = fs.readFileSync(path.join(DIR, p.file), 'utf8');
    const problems = validate(p, content);
    const overlaps = await cannibalizationCheck(p);
    console.log(`=== ${p.slug}`);
    console.log(`  words ~${content.split(/\s+/).length}, meta_title ${p.meta_title.length}, meta_desc ${p.meta_description.length}`);
    if (problems.length) { console.error('  VALIDATION FAIL:', problems.join(' | ')); process.exitCode = 1; continue; }
    if (overlaps.length) console.log('  cannibalization overlaps (review):', overlaps.join(' ; '));
    const { data: exists } = await s.from('blog_posts').select('slug').eq('slug', p.slug).maybeSingle();
    if (exists) { console.log('  already inserted, skipping'); continue; }
    if (DRY) { console.log('  [dry] would insert'); continue; }
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await s.from('blog_posts').insert({
      slug: p.slug,
      title: p.title,
      meta_title: p.meta_title,
      meta_description: p.meta_description,
      excerpt: p.excerpt,
      content,
      category: CATEGORY,
      author: AUTHOR,
      date: today,
      last_updated: today,
    });
    if (error) { console.error('  INSERT FAIL:', error.message); process.exitCode = 1; continue; }
    console.log('  inserted, live at /blog/' + p.slug);
  }
}
main().catch((e) => { console.error('ERR', e.message); process.exit(1); });
