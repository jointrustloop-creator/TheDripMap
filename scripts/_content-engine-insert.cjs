// Content-engine post inserter (2026-08). Reads markdown files from
// docs/content-engine/posts/ + inline metadata, validates meta lengths + FAQ
// schema structure, and inserts into blog_posts (snake_case + camelCase columns
// both populated to match the render path). Writes a rollback manifest of
// inserted slugs. Run with --dry to preview, no flag to insert.
require('dotenv').config({ path: '.env.local', override: true });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const DIR = path.join(__dirname, '..', 'docs', 'content-engine', 'posts');
const DRY = process.argv.includes('--dry');

// Target query family recorded per post for the morning report.
const POSTS = [
  {
    file: 'who-can-legally-give-iv-ontario-2026.md',
    slug: 'who-can-legally-give-iv-ontario-2026',
    title: 'Who Can Legally Give You an IV in Ontario? (2026 Rules)',
    meta_title: 'Who Can Legally Give an IV in Ontario? (2026)',
    meta_description: 'Who can legally give you an IV in Ontario in 2026? How CNO nurses, physicians, and CONO-authorized naturopaths are regulated, and what to ask before booking.',
    excerpt: 'Starting an IV in Ontario is a controlled act. Here is exactly who can legally do it, from CNO nurses to CONO-authorized naturopaths, and what to ask before you book.',
    related_cities: ['Toronto', 'Ottawa', 'Mississauga', 'Oakville', 'Richmond Hill', 'Hamilton'],
    query_family: 'who can give an IV in Ontario / IV therapy Ontario rules',
  },
  {
    file: 'who-can-legally-give-iv-british-columbia-2026.md',
    slug: 'who-can-legally-give-iv-british-columbia-2026',
    title: 'Who Can Legally Give You an IV in British Columbia? (2026 Rules)',
    meta_title: 'Who Can Legally Give an IV in BC? (2026)',
    meta_description: 'Who can legally give you an IV in British Columbia in 2026? How BCCNM nurses, LPNs, physicians, and CNPBC-certified naturopaths are regulated, and what to ask.',
    excerpt: 'In British Columbia, only certain professionals can legally start your IV. Here is who, from BCCNM nurses and LPNs to CNPBC-certified naturopaths, and what to ask.',
    related_cities: ['Vancouver', 'Victoria', 'Kelowna', 'Burnaby', 'Surrey'],
    query_family: 'who can give an IV in BC / IV therapy British Columbia rules',
  },
  {
    file: 'who-can-legally-give-iv-alberta-2026.md',
    slug: 'who-can-legally-give-iv-alberta-2026',
    title: 'Who Can Legally Give You an IV in Alberta? (2026 Rules)',
    meta_title: 'Who Can Legally Give an IV in Alberta? (2026)',
    meta_description: 'Who can legally give you an IV in Alberta in 2026? How CRNA nurses, LPNs, physicians, and CNDA-authorized naturopaths are regulated, plus what to ask.',
    excerpt: 'In Alberta, starting an IV is a restricted activity. Here is who can legally do it, from CRNA nurses to CNDA-authorized naturopaths, and what to ask before booking.',
    related_cities: ['Calgary', 'Edmonton', 'Red Deer'],
    query_family: 'who can give an IV in Alberta / IV therapy Alberta rules',
  },
  {
    file: 'who-can-legally-give-iv-quebec-2026.md',
    slug: 'who-can-legally-give-iv-quebec-2026',
    title: 'Who Can Legally Give You an IV in Quebec? (2026 Rules)',
    meta_title: 'Who Can Legally Give an IV in Quebec? (2026)',
    meta_description: 'Who can legally give you an IV in Quebec in 2026? Why only OIIQ nurses and CMQ physicians can, why naturopaths cannot, and what to ask before you book.',
    excerpt: 'Quebec regulates IV therapy differently. Only OIIQ nurses and CMQ physicians can legally start your IV, and naturopaths cannot. Here is what that means for you.',
    related_cities: ['Montreal', 'Quebec City'],
    query_family: 'who can give an IV in Quebec / IV therapy Quebec / Montreal rules',
  },
  {
    file: 'nad-iv-therapy-canada-dosing-safety-evidence-2026.md',
    slug: 'nad-iv-therapy-canada-dosing-safety-evidence-2026',
    title: 'NAD+ IV Therapy in Canada: Dosing, Safety & Cost (2026)',
    meta_title: 'NAD+ IV Therapy in Canada: Dosing, Safety & Cost',
    meta_description: 'NAD+ IV therapy in Canada in 2026: dosing tiers, why sessions run long, what the evidence really shows, safety, and real prices from our Price Index.',
    excerpt: 'NAD+ IV therapy, honestly: the dosing tiers Canadian clinics use, why sessions run for hours, what the evidence supports, and what it actually costs.',
    related_cities: ['Toronto', 'Calgary', 'Vancouver', 'Mississauga', 'Ottawa'],
    query_family: 'NAD+ IV Canada / NAD+ IV cost / NAD+ dosing / does NAD+ work',
  },
  {
    file: 'how-to-claim-iv-therapy-insurance-canada-2026.md',
    slug: 'how-to-claim-iv-therapy-insurance-canada-2026',
    title: 'How to Claim IV Therapy on Your Benefits in Canada (2026)',
    meta_title: 'How to Claim IV Therapy on Benefits in Canada (2026)',
    meta_description: 'How to claim IV therapy on extended health benefits in Canada: the naturopath receipt that works, what your plan must include, HSAs, and why claims fail.',
    excerpt: 'Provincial plans do not cover wellness IVs, but the right naturopath receipt plus the right benefits plan can get you reimbursed. Here is exactly how claiming works.',
    related_cities: ['Toronto', 'Vancouver', 'Calgary', 'Mississauga', 'Ottawa'],
    query_family: 'claim IV therapy insurance / IV therapy benefits receipt / naturopath receipt IV',
  },
  {
    file: 'can-you-eat-before-iv-drip.md',
    slug: 'can-you-eat-before-iv-drip',
    title: 'Can You Eat Before an IV Drip? Prep Do’s and Don’ts (2026)',
    meta_title: 'Can You Eat Before an IV Drip? Prep Guide (2026)',
    meta_description: 'Yes, eat before an IV drip. What to do before and after: food, water, coffee, alcohol, exercise, the NAD+ exception, and when to call the clinic.',
    excerpt: 'Yes, you should eat before an IV drip. The full before-and-after checklist: food, water, coffee, alcohol, exercise, and the one drip that needs real preparation.',
    related_cities: ['Toronto', 'Montreal', 'Calgary'],
    query_family: 'can you eat before an IV / do you fast before IV therapy / IV drip prep',
  },
];

const CATEGORY = 'Educational';
const AUTHOR = 'TheDripMap Editorial';

function validate(p, content) {
  const problems = [];
  if (p.meta_title.length > 60) problems.push(`meta_title ${p.meta_title.length}>60`);
  if (p.meta_description.length > 160) problems.push(`meta_description ${p.meta_description.length}>160`);
  if (!/##\s+Frequently asked questions/i.test(content)) problems.push('no FAQ heading (FAQPage schema will not generate)');
  const qCount = (content.match(/\n###\s+/g) || []).length;
  if (qCount < 3) problems.push(`only ${qCount} FAQ questions`);
  // Guard: no em/en dashes in body (house style).
  if (/[‒-―−]/.test(content)) problems.push('contains en/em/figure dash');
  // Guard: internal links should be root-relative.
  const badLinks = (content.match(/\]\(https?:\/\/www\.thedripmap\.com/g) || []).length;
  if (badLinks) problems.push(`${badLinks} absolute self-links (use root-relative)`);
  return { problems, qCount };
}

(async () => {
  const now = new Date().toISOString();
  const inserted = [];
  console.log(DRY ? '=== DRY RUN ===' : '=== INSERTING ===');
  for (const p of POSTS) {
    const content = fs.readFileSync(path.join(DIR, p.file), 'utf8');
    const { problems, qCount } = validate(p, content);
    const { data: existing } = await s.from('blog_posts').select('slug').eq('slug', p.slug).maybeSingle();
    const status = existing ? 'EXISTS-SKIP' : problems.length ? 'BLOCKED' : 'OK';
    console.log(`\n[${status}] ${p.slug}`);
    console.log(`   title(${p.title.length}) meta_title(${p.meta_title.length}) meta_desc(${p.meta_description.length}) faqs(${qCount}) words(${content.split(/\s+/).length})`);
    console.log(`   query family: ${p.query_family}`);
    if (problems.length) console.log('   PROBLEMS: ' + problems.join('; '));
    if (DRY || existing || problems.length) continue;

    const row = {
      slug: p.slug,
      title: p.title,
      content,
      excerpt: p.excerpt,
      category: CATEGORY,
      author: AUTHOR,
      date: now,
      last_updated: now,
      meta_title: p.meta_title,
      meta_description: p.meta_description,
      related_cities: p.related_cities,
      related_clinics: [],
      image_url: null,
      author_image_url: null,
      // camelCase mirrors (both column sets exist on the table)
      metaTitle: p.meta_title,
      metaDescription: p.meta_description,
      relatedCities: p.related_cities,
      relatedClinics: [],
      imageUrl: null,
      authorImageUrl: null,
      lastUpdated: now,
      reviewedBy: null,
    };
    const { error } = await s.from('blog_posts').insert(row);
    if (error) { console.log('   INSERT ERROR: ' + error.message); continue; }
    console.log('   inserted OK');
    inserted.push(p.slug);
  }
  if (inserted.length) {
    const roll = path.join(__dirname, '..', 'docs', 'content-engine', '_rollback-inserted-slugs.json');
    let prev = [];
    try { prev = JSON.parse(fs.readFileSync(roll, 'utf8')); } catch {}
    fs.writeFileSync(roll, JSON.stringify([...new Set([...prev, ...inserted])], null, 2));
    console.log(`\nInserted ${inserted.length}. Rollback list: docs/content-engine/_rollback-inserted-slugs.json`);
  }
})();
