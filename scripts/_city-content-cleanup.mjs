/**
 * City body cleanup, 2026-09-18 audit. Applies to EVERY cities.content row,
 * including the unrendered templates (hygiene) and the bespoke pages (public).
 *
 *   node scripts/_city-content-cleanup.mjs           dry run: counts + samples
 *   node scripts/_city-content-cleanup.mjs --apply   writes, with a JSON backup
 *
 * Rules, deliberately narrow and reviewable:
 *   1. En and em dashes. Between two numbers, "$99–$200" -> "$99 to $200";
 *      "30–45 minutes" -> "30 to 45 minutes". A spaced em/en dash used as a
 *      clause break -> ", ". An unspaced em dash -> ", ". A dash after a bold
 *      lead-in "**Myers Cocktail** — The most..." -> "**Myers Cocktail**. The most...".
 *   2. "directory" -> "matching platform" wording, case preserved where it
 *      starts a sentence. Link labels like "[Ontario directory](...)" become
 *      "[Ontario clinics](...)".
 *   3. Liver detox claim (templated in 261 rows) reworded to a demand
 *      description with no efficacy claim.
 *   4. Two one-off oncology promo lines (Oakville, San Francisco) reworded.
 * Toronto is skipped: it was rewritten by hand.
 */
import dotenv from 'dotenv';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
dotenv.config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const apply = process.argv.includes('--apply');

function clean(s) {
  let t = s;
  // 1. dashes
  t = t.replace(/(\$?\d[\d,.]*)\s?[–—]\s?(\$?\d)/g, '$1 to $2');              // numeric ranges
  t = t.replace(/(\*\*[^*\n]+\*\*)\s[–—]\s/g, '$1. ');                      // bold lead-in
  t = t.replace(/(#{1,6} [^\n–—]+?)\s[–—]\s([^\n]+)/g, '$1: $2');   // heading "A — B" -> "A: B"
  t = t.replace(/\s[–—]\s/g, ', ');                                           // spaced clause break
  t = t.replace(/[–—]/g, ', ');                                               // anything left
  t = t.replace(/,\s*,/g, ',').replace(/ ,/g, ',');
  // 2. directory
  t = t.replace(/\[([^\]]*?)\bdirectory\b([^\]]*?)\]\(/gi, (m, a, b) => `[${a}clinics${b}](`);
  t = t.replace(/\bour directory\b/gi, 'our listings');
  t = t.replace(/\bthe directory\b/gi, 'the platform');
  t = t.replace(/\bthe (dedicated|full|broader|treatment-city|mobile) directory\b/gi, 'the $1 page');
  t = t.replace(/\bthis directory\b/gi, 'this matching platform');
  t = t.replace(/\bDirectory\b/g, 'Matching platform').replace(/\bdirectory\b/g, 'matching platform');
  // 3. liver detox (templated line and the few variants)
  t = t.replace(/The body's master antioxidant, supporting liver detoxification, skin brightening, immune function, and cellular protection/g,
                "The body's master antioxidant, most often booked for skin brightening and antioxidant protocols");
  t = t.replace(/skin brightening, liver detox(ification)?, and antioxidant support/gi, 'skin brightening and antioxidant protocols');
  t = t.replace(/Supports liver detox, skin brightening, and immune function/g, 'Most often booked for skin brightening and antioxidant protocols');
  t = t.replace(/liver detox(ification)?/gi, 'antioxidant support');
  // 4. one-off oncology promo lines
  t = t.replace(/slightly more medical and slightly more naturopathic-oncology-adjacent than downtown Toronto/g, 'slightly more medical and more naturopath-led than downtown Toronto');
  t = t.replace(/NDs more often offer high-dose vitamin C and adjunctive oncology protocols, plus naturopathic-specific formulations/g, 'NDs more often offer high-dose vitamin C and naturopathic-specific formulations');
  t = t.replace(/Popular during cold and flu season and among cancer support patients/g, 'Popular during cold and flu season');
  return t;
}

const { data: rows } = await sb.from('cities').select('slug,content,meta_title,meta_description').limit(2000);
const changes = []; const samples = {};
for (const r of rows) {
  if (r.slug === 'toronto' || !r.content) continue;
  const next = clean(r.content);
  const mt = r.meta_title ? clean(r.meta_title) : r.meta_title;
  const md = r.meta_description ? clean(r.meta_description) : r.meta_description;
  if (next !== r.content || mt !== r.meta_title || md !== r.meta_description) {
    changes.push({ slug: r.slug, content: next, meta_title: mt, meta_description: md, before: r.content });
    const left = { dashes: (next.match(/[–—]/g)||[]).length, directory: (next.match(/\bdirectory\b/gi)||[]).length, liver: (next.match(/liver detox/gi)||[]).length };
    if (left.dashes || left.directory || left.liver) samples[r.slug] = left;
  }
}
console.log(`rows: ${rows.length} | would change: ${changes.length} | rows with leftovers after cleaning: ${Object.keys(samples).length}`);
if (Object.keys(samples).length) console.log('leftovers:', JSON.stringify(samples).slice(0, 600));
// show a few bespoke diffs for eyeballing
for (const s of ['oakville', 'calgary', 'vancouver', 'north-york', 'richmond-hill']) {
  const c = changes.find(x => x.slug === s); if (!c) continue;
  const b = c.before.split('\n'), a = c.content.split('\n');
  const diff = b.map((l, i) => l !== a[i] ? `- ${l.slice(0,140)}\n+ ${(a[i]||'').slice(0,140)}` : null).filter(Boolean).slice(0, 4);
  console.log(`\n--- ${s}:\n${diff.join('\n')}`);
}
if (apply) {
  fs.writeFileSync('.audit-tmp/city-content-backup-2026-09-18.json', JSON.stringify(changes.map(c => ({ slug: c.slug, content: c.before }))));
  let n = 0;
  for (const c of changes) {
    const { error } = await sb.from('cities').update({ content: c.content, meta_title: c.meta_title, meta_description: c.meta_description }).eq('slug', c.slug);
    if (error) console.error(c.slug, error.message); else n++;
  }
  console.log(`\napplied to ${n} rows; backup at .audit-tmp/city-content-backup-2026-09-18.json`);
} else {
  console.log('\nDRY RUN, nothing written');
}
