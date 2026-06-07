/**
 * Automatic SEO hygiene fix on every blog_posts row.
 *
 * Fixes applied:
 *   1. em-dash (—) and en-dash (–) -> hyphen-with-spaces ( - )
 *      Operator's standing rule: no em/en-dashes in user-facing text.
 *   2. h1 in content body -> demote to h2 (page title is the canonical h1)
 *   3. leftover "directory" wording -> "matching platform" (catch
 *      possessives like "directory's" that the earlier sweep missed)
 *
 * Stops short of touching meta length, internal links, or Canadian
 * regulator mentions - those need editorial judgment.
 *
 * Reports a per-post diff summary.
 */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const sb = require('@supabase/supabase-js').createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

function applyFixes(text) {
  let out = text;
  const counts = { em_dash: 0, h1_demoted: 0, directory_residue: 0 };

  // em-dash -> " - " (preserving space). en-dash -> " - ".
  out = out.replace(/—/g, (_) => { counts.em_dash++; return ' - '; });
  out = out.replace(/–/g, (_) => { counts.em_dash++; return ' - '; });
  // Collapse double spaces that may have appeared
  out = out.replace(/ {3,}/g, '  ');

  // # at start of a line (h1) - demote to h2. Skip lines like #SomeHash that are not headings (rare in markdown).
  out = out.replace(/^# (?=\S)/gm, () => { counts.h1_demoted++; return '## '; });

  // leftover "directory" tokens - replace, preserving case.
  out = out.replace(/\bDirectory\b/g, () => { counts.directory_residue++; return 'Matching Platform'; });
  out = out.replace(/\bdirectory\b/g, () => { counts.directory_residue++; return 'matching platform'; });
  // Possessives
  out = out.replace(/\bdirectory's\b/g, "matching platform's");
  out = out.replace(/\bDirectory's\b/g, "Matching Platform's");

  return { text: out, counts };
}

function applyFixesField(value) {
  if (!value) return { value, counts: { em_dash: 0, h1_demoted: 0, directory_residue: 0 } };
  const r = applyFixes(String(value));
  return { value: r.text, counts: r.counts };
}

(async () => {
  const receipt = { phase: 'seo-auto-fix', timestamp: new Date().toISOString(), updated: [], errors: [] };
  const { data: all } = await sb.from('blog_posts').select('id, slug, content, excerpt, meta_title, meta_description, metaTitle, metaDescription').range(0, 999);
  console.log('Scanning ' + all.length + ' blog posts...');
  console.log();

  for (const p of all) {
    const fields = ['content', 'excerpt', 'meta_title', 'meta_description', 'metaTitle', 'metaDescription'];
    const updates = {};
    const totals = { em_dash: 0, h1_demoted: 0, directory_residue: 0 };
    let anyChanged = false;
    for (const f of fields) {
      const orig = p[f];
      if (!orig) continue;
      const fix = applyFixesField(orig);
      if (fix.value !== orig) {
        updates[f] = fix.value;
        anyChanged = true;
        for (const k of Object.keys(totals)) totals[k] += fix.counts[k];
      }
    }
    if (!anyChanged) continue;
    updates.last_updated = new Date().toISOString();
    updates.lastUpdated = updates.last_updated;
    const { error } = await sb.from('blog_posts').update(updates).eq('id', p.id);
    if (error) {
      console.log('!! ' + p.slug + ': ' + error.message);
      receipt.errors.push({ slug: p.slug, error: error.message });
      continue;
    }
    receipt.updated.push({ slug: p.slug, counts: totals, fields_changed: Object.keys(updates).filter((k) => !k.includes('Updated')) });
    console.log('+ ' + p.slug.padEnd(60) + ' em=' + totals.em_dash + ' h1=' + totals.h1_demoted + ' dir=' + totals.directory_residue);
  }

  console.log();
  console.log('Updated: ' + receipt.updated.length + ' | Errors: ' + receipt.errors.length);
  const grand = receipt.updated.reduce((acc, r) => { acc.em += r.counts.em_dash; acc.h1 += r.counts.h1_demoted; acc.dir += r.counts.directory_residue; return acc; }, { em: 0, h1: 0, dir: 0 });
  console.log('Total replacements: em-dash ' + grand.em + '  h1->h2 ' + grand.h1 + '  directory ' + grand.dir);

  fs.mkdirSync('scripts/_receipts', { recursive: true });
  const outPath = path.join('scripts/_receipts', 'seo-auto-fix-' + Date.now() + '.json');
  fs.writeFileSync(outPath, JSON.stringify(receipt, null, 2));
  console.log('Receipt: ' + outPath);
})();
