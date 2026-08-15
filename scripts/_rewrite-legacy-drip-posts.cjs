// Rewrite 4 legacy marketing-voice drip posts into the honest-triage voice
// (operator-approved 2026-08-15: "keep going with what you recommend" on the
// flagged recommendation). Slugs unchanged (rankings preserved); title, meta,
// excerpt and content replaced; last_updated stamped. Same validation as the
// content engine. --dry previews. Backs up the ORIGINAL rows to
// docs/content-engine/_legacy-post-backups-2026-08-15.json before updating.
require('dotenv').config({ path: '.env.local', override: true });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const DIR = path.join(__dirname, '..', 'docs', 'content-engine', 'posts', 'rewrites');
const BACKUP = path.join(__dirname, '..', 'docs', 'content-engine', '_legacy-post-backups-2026-08-15.json');
const DRY = process.argv.includes('--dry');

const POSTS = [
  {
    slug: 'science-of-iv-therapy-for-hangover-recovery',
    title: 'Hangover IVs: What They Fix and What They Cannot (2026)',
    meta_title: 'Hangover IVs: What They Fix and What They Cannot',
    meta_description: 'A drip rehydrates you faster than drinking. It does not clear the alcohol byproducts causing most of the misery. The honest hangover IV picture, sourced.',
    excerpt: 'The dehydration part is real, the cure part is not. What a hangover actually is, which piece a drip fixes, and how to decide if the price makes sense.',
  },
  {
    slug: 'iv-therapy-immune-support',
    title: 'Immune IV Drips: What the Evidence Actually Supports (2026)',
    meta_title: 'Immune IV Drips: What the Evidence Supports',
    meta_description: 'Your immune system is not a fuel tank. What immune drips contain, what surplus vitamins do in a well-nourished body, and the G6PD question worth asking.',
    excerpt: 'Correcting deficiency helps immunity. Surplus mostly gets excreted. The honest picture of immune drips, with the one safety question that separates clinics.',
  },
  {
    slug: 'glutathione-iv-therapy-benefits',
    title: 'Glutathione IV: The Claims, the Evidence, the Safety Record (2026)',
    meta_title: 'Glutathione IV: Claims, Evidence, Safety Record',
    meta_description: 'The FDA warning on injectable skin whitening, the Canadian contamination record, and what the evidence actually says about the master antioxidant drip.',
    excerpt: 'Real molecule, unproven claims, and the one drip where the safety record is about the vial, not the needle. The honest glutathione picture.',
  },
  {
    slug: 'nad-plus-iv-therapy-cellular-longevity-guide',
    title: 'NAD+ and Longevity: What Is Known and What Is Sold (2026)',
    meta_title: 'NAD+ and Longevity: Known vs Sold (2026)',
    meta_description: 'The biology is real, the research is young, and the 500 dollar drip is ahead of both. The honest gap between NAD+ science and NAD+ menus.',
    excerpt: 'The most expensive drip on the menu, the least established benefit, the most uncomfortable delivery. What NAD+ research shows versus what clinics claim.',
  },
];

function validate(p, content) {
  const problems = [];
  if (p.meta_title.length > 60) problems.push(`meta_title ${p.meta_title.length}>60`);
  if (p.meta_description.length > 160) problems.push(`meta_description ${p.meta_description.length}>160`);
  if (!/##\s+Frequently asked questions/i.test(content)) problems.push('no FAQ heading');
  const qCount = (content.match(/\n###\s+/g) || []).length;
  if (qCount < 3) problems.push(`only ${qCount} FAQ questions`);
  if (/[‒–—―−]/.test(content)) problems.push('contains en/em/figure dash');
  const badLinks = (content.match(/\]\(https?:\/\/www\.thedripmap\.com/g) || []).length;
  if (badLinks) problems.push(`${badLinks} absolute self-links`);
  return { problems, qCount };
}

(async () => {
  const now = new Date().toISOString();
  const backups = fs.existsSync(BACKUP) ? JSON.parse(fs.readFileSync(BACKUP, 'utf8')) : [];
  console.log(DRY ? '=== DRY RUN ===' : '=== UPDATING ===');
  for (const p of POSTS) {
    const content = fs.readFileSync(path.join(DIR, `${p.slug}.md`), 'utf8');
    const { problems, qCount } = validate(p, content);
    const { data: existing, error: exErr } = await s.from('blog_posts')
      .select('slug,title,meta_title,meta_description,excerpt,content,last_updated').eq('slug', p.slug).maybeSingle();
    if (exErr || !existing) { console.log(`[MISSING] ${p.slug} ${exErr ? exErr.message : ''}`); continue; }
    const status = problems.length ? 'BLOCKED' : 'OK';
    console.log(`[${status}] ${p.slug}`);
    console.log(`  "${existing.title}" -> "${p.title}"`);
    console.log(`  meta_title(${p.meta_title.length}) meta_desc(${p.meta_description.length}) faqs(${qCount}) words(${content.split(/\s+/).length})`);
    if (problems.length) { console.log('  PROBLEMS: ' + problems.join('; ')); continue; }
    if (DRY) continue;

    if (!backups.find((b) => b.slug === p.slug)) backups.push(existing);
    const { error, count } = await s.from('blog_posts').update({
      title: p.title, content,
      excerpt: p.excerpt,
      meta_title: p.meta_title, meta_description: p.meta_description,
      metaTitle: p.meta_title, metaDescription: p.meta_description,
      last_updated: now, lastUpdated: now,
    }, { count: 'exact' }).eq('slug', p.slug);
    if (error) { console.log('  UPDATE ERROR: ' + error.message); continue; }
    if (count !== 1) { console.log(`  SCOPE ERROR count=${count}`); continue; }
    console.log('  updated OK');
  }
  if (!DRY) {
    fs.writeFileSync(BACKUP, JSON.stringify(backups, null, 2));
    console.log(`\nOriginals backed up: ${path.basename(BACKUP)} (${backups.length} rows)`);
  }
})();
