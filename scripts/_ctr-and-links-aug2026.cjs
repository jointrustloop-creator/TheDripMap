/**
 * CTR rewrites + internal linking pass (SEO weekend sprint, 2026-08-20).
 *
 * CTR: every target title was 66 to 82 chars WITH the site suffix, so Google
 * truncated all of them. Rewritten under 60 (before suffix), question-led, with
 * a real number where we have one. NO content changes for the CTR part.
 *
 * LINKS: the editorial pages rank; the city/treatment pages lag. This routes
 * authority with 2 to 4 contextual links per page, completing the
 * insurance <-> legality <-> cost triangle.
 *
 * It also fixes a live leak found while auditing: our single biggest page by
 * impressions (can-you-drink-alcohol-after-iv-therapy, 2,795/28d) linked to
 * /cities/las-vegas and /cities/new-york. US city pages are NOINDEXED under
 * the Canada-first posture, so that equity went nowhere. Repointed to Canadian
 * cities.
 *
 * Honesty note: the province-guide title says 10 Provinces, not 13. The post
 * covers all 10 provinces but none of the 3 territories (verified against the
 * content before writing the number).
 *
 * Idempotent (marker checks). Backups: docs/content-engine/_ctr-backups-2026-08-20.json
 * Run with --dry to preview; no flag applies.
 */
require('dotenv').config({ path: '.env.local', override: true });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const DRY = process.argv.includes('--dry');
const BACKUP = path.join(__dirname, '..', 'docs', 'content-engine', '_ctr-backups-2026-08-20.json');

const META = [
  {
    slug: 'can-you-drink-alcohol-after-iv-therapy',
    meta_title: 'Can You Drink Alcohol After IV Therapy?',
    meta_description:
      'How long to wait before drinking after an IV, by drip type (NAD+, hangover, wellness), plus the medication interactions worth knowing and what clinics advise.',
  },
  {
    slug: 'iv-therapy-insurance-coverage-canada',
    meta_title: 'Is IV Therapy Covered by Insurance in Canada?',
    meta_description:
      'OHIP, RAMQ and MSP do not cover elective drips, but HSAs and paramedical benefits often do. What 5 major insurers cover and the receipt to ask for.',
  },
  {
    slug: 'who-can-legally-give-iv-canada-rules-by-province-2026',
    meta_title: 'Who Can Legally Give an IV in Canada? 10 Provinces',
    meta_description:
      'Province-by-province rules across all 10 provinces: which doctors, nurses and naturopaths may start an IV, and what to ask a clinic before you book.',
  },
];

// 2 to 4 contextual links per page, no link farms. Each entry appends one short
// paragraph in the page's own voice; `marker` keeps it idempotent.
const LINKS = [
  {
    slug: 'does-insurance-cover-iv-therapy-canada-2026',
    marker: 'Related reading on cost and legality',
    append: `

## Related reading on cost and legality

Coverage is only half the money question. For what clinics actually charge, see our [IV therapy cost guide](/guide/iv-therapy-cost-guide) and the [Canada IV price index](/iv-prices), both built from clinics' published menus. And before you book anywhere, it is worth knowing [who can legally give you an IV in Canada](/blog/who-can-legally-give-iv-canada-rules-by-province-2026), because the prescriber's credentials also decide whether a receipt is claimable. You can [compare clinics in your city](/search) with prices and verification status side by side.
`,
  },
  {
    slug: 'iv-therapy-insurance-coverage-canada',
    marker: 'Who is allowed to give you the IV',
    append: `

## Who is allowed to give you the IV

Coverage questions and legality questions are linked: a claim usually depends on the practitioner's designation and registration number. Our guide to [who can legally give you an IV in Canada](/blog/who-can-legally-give-iv-canada-rules-by-province-2026) covers the rules in all 10 provinces, and [how to verify any clinic's licence](/blog/how-to-verify-iv-provider-license-canada-2026) shows you how to check the public register yourself in about five minutes.
`,
  },
  {
    slug: 'who-can-legally-give-iv-canada-rules-by-province-2026',
    marker: 'What it costs and what insurance covers',
    append: `

## What it costs and what insurance covers

Once you know who may legally treat you, the next two questions are price and coverage. Our [IV therapy cost guide](/guide/iv-therapy-cost-guide) reports real ranges from clinic menus, and [does insurance cover IV therapy in Canada](/blog/does-insurance-cover-iv-therapy-canada-2026) breaks down what the major insurers actually reimburse.
`,
  },
];

// Repoint the US city links on our biggest page to Canadian equivalents.
// US city pages are noindexed (Canada-first), so those links leaked equity.
const REPLACEMENTS = [
  {
    slug: 'can-you-drink-alcohol-after-iv-therapy',
    marker: '/cities/toronto',
    pairs: [
      ['/cities/las-vegas', '/cities/toronto'],
      ['/cities/new-york', '/cities/vancouver'],
    ],
  },
];

async function main() {
  const backups = fs.existsSync(BACKUP) ? JSON.parse(fs.readFileSync(BACKUP, 'utf8')) : {};

  for (const m of META) {
    const { data: p, error } = await s.from('blog_posts').select('slug,meta_title,meta_description').eq('slug', m.slug).single();
    if (error || !p) { console.error('FETCH FAIL', m.slug, error?.message); process.exitCode = 1; continue; }
    if (m.meta_title.length > 60) { console.error('TITLE TOO LONG', m.slug, m.meta_title.length); process.exitCode = 1; continue; }
    if (m.meta_description.length > 160) { console.error('DESC TOO LONG', m.slug, m.meta_description.length); process.exitCode = 1; continue; }
    if (/[‒–—―−]/.test(m.meta_title + m.meta_description)) { console.error('DASH', m.slug); process.exitCode = 1; continue; }
    if (p.meta_title === m.meta_title) { console.log('meta skip (already applied):', m.slug); continue; }
    console.log(`meta ${m.slug}: ${p.meta_title.length} -> ${m.meta_title.length} chars`);
    if (DRY) continue;
    if (backups[m.slug] === undefined) backups[m.slug] = { meta_title: p.meta_title, meta_description: p.meta_description };
    else Object.assign(backups[m.slug], { meta_title: p.meta_title, meta_description: p.meta_description });
    const { error: e } = await s.from('blog_posts').update({ meta_title: m.meta_title, meta_description: m.meta_description }).eq('slug', m.slug);
    if (e) { console.error('  UPDATE FAIL', e.message); process.exitCode = 1; }
  }

  for (const l of LINKS) {
    const { data: p, error } = await s.from('blog_posts').select('slug,content').eq('slug', l.slug).single();
    if (error || !p) { console.error('FETCH FAIL', l.slug, error?.message); process.exitCode = 1; continue; }
    if ((p.content || '').includes(l.marker)) { console.log('links skip (already applied):', l.slug); continue; }
    if (/[‒–—―−]/.test(l.append)) { console.error('DASH in append', l.slug); process.exitCode = 1; continue; }
    console.log(`links ${l.slug}: +${l.append.length} chars`);
    if (DRY) continue;
    if (!backups[l.slug]) backups[l.slug] = {};
    if (backups[l.slug].content === undefined) backups[l.slug].content = p.content;
    const { error: e } = await s.from('blog_posts').update({ content: (p.content || '').trimEnd() + l.append, last_updated: new Date().toISOString().slice(0, 10) }).eq('slug', l.slug);
    if (e) { console.error('  UPDATE FAIL', e.message); process.exitCode = 1; }
  }

  for (const r of REPLACEMENTS) {
    const { data: p, error } = await s.from('blog_posts').select('slug,content').eq('slug', r.slug).single();
    if (error || !p) { console.error('FETCH FAIL', r.slug, error?.message); process.exitCode = 1; continue; }
    let c = p.content || '';
    const before = c;
    for (const [from, to] of r.pairs) c = c.split(from).join(to);
    if (c === before) { console.log('repoint skip (nothing to change):', r.slug); continue; }
    console.log(`repoint ${r.slug}: US city links -> Canadian`);
    if (DRY) continue;
    if (!backups[r.slug]) backups[r.slug] = {};
    if (backups[r.slug].content === undefined) backups[r.slug].content = before;
    const { error: e } = await s.from('blog_posts').update({ content: c, last_updated: new Date().toISOString().slice(0, 10) }).eq('slug', r.slug);
    if (e) { console.error('  UPDATE FAIL', e.message); process.exitCode = 1; }
  }

  if (!DRY) fs.writeFileSync(BACKUP, JSON.stringify(backups, null, 2));
  console.log(DRY ? '\n[dry run] no writes.' : '\nDone.');
}
main().catch((e) => { console.error('ERR', e.message); process.exit(1); });
