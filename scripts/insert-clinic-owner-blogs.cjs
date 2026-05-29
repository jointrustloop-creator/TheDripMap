/**
 * Insert the 5 "Clinic Owner Resources" blog posts (clinic-owner series, May 2026).
 * Reads each article body from scripts/blog-drafts/<slug>.md, decodes any HTML
 * entities, and upserts into blog_posts. Run: node scripts/insert-clinic-owner-blogs.cjs
 */
require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const STORAGE = 'https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/';
const DRAFTS = path.join(__dirname, 'blog-drafts');
const DATE = '2026-05-29';

const decodeEntities = (s) =>
  s.replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');

const wordCount = (c) => c.replace(/[#>*|`_\-]/g, ' ').split(/\s+/).filter((w) => /[a-z0-9]/i.test(w)).length;

const POSTS = [
  {
    slug: 'how-to-start-iv-therapy-business-2026',
    title: 'How to Start an IV Therapy Business in 2026 — The Complete Guide for Nurses and Entrepreneurs',
    meta: 'A complete 2026 guide to starting an IV therapy business: market data, costs, CPOM laws, medical directors, licensing, equipment, pricing, and patients.',
    excerpt: 'Everything a nurse or entrepreneur needs to launch an IV hydration clinic in 2026 — real startup costs, ownership laws, medical-director arrangements, state-by-state rules, and how to land your first 20 patients.',
    image: 'iv-therapy-clinical-medical-setting.jpg',
  },
  {
    slug: 'how-to-find-medical-director-iv-therapy-clinic',
    title: 'How to Find a Medical Director for Your IV Therapy Clinic — What They Do, What to Pay, and Red Flags to Avoid',
    meta: 'A 2026 guide for IV therapy clinic owners on what a medical director does, what to pay, where to find one, and the red flags that trigger regulators.',
    excerpt: 'A practical, current guide to hiring a medical director for your IV therapy clinic — the legal "why," real cost ranges, where to find a qualified physician, and the absentee-doctor arrangements that get clinics shut down.',
    image: 'iv-therapy-group-clinic.jpg',
  },
  {
    slug: 'iv-therapy-laws-by-state-2026',
    title: 'IV Therapy Laws by State — What Every Clinic Owner Must Know in 2026',
    meta: 'A 2026 guide to IV therapy laws by state: ownership/CPOM rules, who can administer IVs, good-faith exam and medical director requirements.',
    excerpt: 'Ownership rules, scope of practice, good-faith exams, and medical director requirements for IV therapy vary dramatically by state. A plain-English, state-by-state breakdown for clinic owners in 2026.',
    image: 'iv-therapy-clinical-medical-setting.jpg',
  },
  {
    slug: 'how-much-does-it-cost-to-open-iv-therapy-clinic',
    title: 'How Much Does It Cost to Open an IV Therapy Clinic in 2026? Real Startup Budget Breakdown',
    meta: 'A real 2026 startup budget for opening an IV therapy clinic, with low/mid/high totals, mobile vs. fixed vs. hybrid models, ongoing costs, and break-even.',
    excerpt: 'A line-by-line look at what it actually costs to open an IV therapy clinic in 2026 — from LLC and medical director fees to equipment, supplies, and runway, with mobile, fixed, and hybrid budgets you can copy into a spreadsheet.',
    image: 'iv-therapy-vitamin-drip-citrus.jpg',
  },
  {
    slug: 'how-to-get-patients-iv-therapy-clinic-without-ads',
    title: 'How to Get Patients for Your IV Therapy Clinic Without Paid Ads — 8 Strategies That Actually Work in 2026',
    meta: '8 proven organic ways to get more patients for your IV therapy clinic in 2026 — directory listings, local SEO, reviews, referrals and more. No paid ads.',
    excerpt: "Paid ads are getting expensive and unpredictable. Eight organic, repeatable ways to fill your IV therapy clinic's schedule in 2026 — starting with the local discovery channels patients actually use.",
    image: 'iv-therapy-group-clinic.jpg',
  },
];

(async () => {
  for (const p of POSTS) {
    const file = path.join(DRAFTS, `${p.slug}.md`);
    if (!fs.existsSync(file)) {
      console.error('MISSING draft:', file);
      continue;
    }
    const content = decodeEntities(fs.readFileSync(file, 'utf8').trim());
    const row = {
      slug: p.slug,
      title: p.title,
      content,
      excerpt: p.excerpt,
      category: 'Clinic Owner Resources',
      author: 'TheDripMap Editorial Team',
      image_url: STORAGE + p.image,
      meta_title: p.title,
      meta_description: p.meta,
      date: DATE,
      last_updated: DATE,
    };
    const { data: existing } = await sb.from('blog_posts').select('id').eq('slug', p.slug).maybeSingle();
    const res = existing
      ? await sb.from('blog_posts').update(row).eq('id', existing.id)
      : await sb.from('blog_posts').insert(row);
    if (res.error) { console.error('FAIL', p.slug, res.error.message); continue; }
    console.log(`${existing ? 'updated' : 'inserted'}  ${p.slug}  (${wordCount(content)} words)`);
  }
})();
