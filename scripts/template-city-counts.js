// Sweep all rows in `cities` table and replace hardcoded provider counts in
// `content`, `meta_title`, `meta_description` with the {count} placeholder so
// they render the live provider count at request time.
//
// Run with no args for a PREVIEW (no DB writes).
// Run with `--apply` to actually update the rows.
//
// Patterns we safely template:
//   - "X verified providers"             → "{count} verified providers"
//   - "Compare X (top-rated )?providers" → "Compare {count} $1providers"
//   - "all X (verified )?providers"      → "all {count} $1providers"
//   - "all X IV therapy providers"       → "all {count} IV therapy providers"
//   - "with X (verified )?providers"     → "with {count} $1providers"
//   - "X Top-Rated Clinics"              → "{count} Top-Rated Clinics"
//   - "— X Clinics Near You"             → "— {count} Clinics Near You"
//   - "X IV therapy clinics"             → "{count} IV therapy clinics"
//   - "X IV therapy providers"           → "{count} IV therapy providers"
//   - "currently X providers"            → "currently {count} providers"
//
// We DO NOT touch numbers attached to:
//   - currency ($150, $300)
//   - durations (30 minutes, 4 hours, 3 days)
//   - percentages (20%, 30%)
//   - price ranges with en-dash ($120–$180)
//   - decade/year markers (2026, 1990s)

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local', quiet: true });

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Each rule: [pattern (must include a number capture), replacement_with_$N_groups, label]
// Patterns avoid currency/percentage by using lookbehinds that reject `$` `~` and trailing `%`/`-`/word chars like 'minute'.
const NUMBER = '(?<!\\$)(?<![\\d.\\-–])(\\d{1,4})(?![\\d.,]|\\s*%|\\s*(?:minute|hour|day|month|year|second|°|am|pm|°F|°C|–|-))';

const RULES = [
  // Phrase: "X verified providers" → "{count} verified providers"
  [new RegExp(`${NUMBER}\\s+verified\\s+providers\\b`, 'gi'), `{count} verified providers`, 'X verified providers'],
  // "Compare X top-rated providers"
  [new RegExp(`(Compare\\s+)${NUMBER}\\s+(top-rated\\s+)?providers\\b`, 'gi'), (m, pre, _n, opt) => `${pre}{count} ${opt ?? ''}providers`, 'Compare X (top-rated )?providers'],
  // "Compare X (top-rated )?clinics"
  [new RegExp(`(Compare\\s+)${NUMBER}\\s+(top-rated\\s+)?clinics\\b`, 'gi'), (m, pre, _n, opt) => `${pre}{count} ${opt ?? ''}clinics`, 'Compare X clinics'],
  // "all X (verified )?providers"
  [new RegExp(`(\\ball\\s+)${NUMBER}\\s+(verified\\s+|IV therapy\\s+)?providers\\b`, 'gi'), (m, pre, _n, opt) => `${pre}{count} ${opt ?? ''}providers`, 'all X (verified)? providers'],
  // "with X (verified )?providers"
  [new RegExp(`(\\bwith\\s+)${NUMBER}\\s+(verified\\s+)?providers\\b`, 'gi'), (m, pre, _n, opt) => `${pre}{count} ${opt ?? ''}providers`, 'with X providers'],
  // "X IV therapy clinics"
  [new RegExp(`${NUMBER}\\s+IV\\s+therapy\\s+clinics\\b`, 'gi'), `{count} IV therapy clinics`, 'X IV therapy clinics'],
  // "X IV therapy providers"
  [new RegExp(`${NUMBER}\\s+IV\\s+therapy\\s+providers\\b`, 'gi'), `{count} IV therapy providers`, 'X IV therapy providers'],
  // "X Top-Rated Clinics" (Title Case, often in meta titles)
  [new RegExp(`${NUMBER}\\s+Top-Rated\\s+Clinics\\b`, 'g'), `{count} Top-Rated Clinics`, 'X Top-Rated Clinics'],
  // "X Clinics Near You" — common H1/meta_title pattern
  [new RegExp(`${NUMBER}\\s+Clinics\\s+Near\\s+You\\b`, 'g'), `{count} Clinics Near You`, 'X Clinics Near You'],
  // "currently X providers"
  [new RegExp(`(\\bcurrently\\s+)${NUMBER}\\s+providers\\b`, 'gi'), (m, pre) => `${pre}{count} providers`, 'currently X providers'],
];

function applyRules(text) {
  if (!text || typeof text !== 'string') return { out: text, changed: [] };
  let out = text;
  const changed = [];
  for (const [pattern, replacement, label] of RULES) {
    const before = out;
    out = out.replace(pattern, replacement);
    if (before !== out) {
      // Track every distinct match that was replaced
      const matches = [...before.matchAll(pattern)];
      for (const m of matches) {
        changed.push({ label, match: m[0] });
      }
    }
  }
  return { out, changed };
}

// === Load every city row ===
const { data: cities, error } = await supabase
  .from('cities')
  .select('id, slug, name, content, meta_title, meta_description');
if (error) { console.error('Load failed:', error); process.exit(1); }

console.log(`Loaded ${cities.length} city rows`);
console.log(`Mode: ${APPLY ? 'APPLY (will write)' : 'PREVIEW (no writes — pass --apply to commit)'}`);
console.log('');

const updates = [];
let touchedFields = 0;
for (const c of cities) {
  const contentRes = applyRules(c.content);
  const titleRes   = applyRules(c.meta_title);
  const descRes    = applyRules(c.meta_description);
  const anyChanged = contentRes.changed.length || titleRes.changed.length || descRes.changed.length;
  if (!anyChanged) continue;

  const update = { id: c.id };
  if (c.content !== contentRes.out) { update.content = contentRes.out; touchedFields++; }
  if (c.meta_title !== titleRes.out) { update.meta_title = titleRes.out; touchedFields++; }
  if (c.meta_description !== descRes.out) { update.meta_description = descRes.out; touchedFields++; }
  updates.push({
    slug: c.slug,
    name: c.name,
    update,
    changes: { content: contentRes.changed, meta_title: titleRes.changed, meta_description: descRes.changed },
  });
}

console.log(`Cities needing changes: ${updates.length} / ${cities.length}`);
console.log(`Total fields to update: ${touchedFields}`);
console.log('');

// Print per-city sample of changes
for (const u of updates.slice(0, 30)) {
  const allChanges = [
    ...u.changes.content.map((c) => ({ field: 'content', ...c })),
    ...u.changes.meta_title.map((c) => ({ field: 'meta_title', ...c })),
    ...u.changes.meta_description.map((c) => ({ field: 'meta_desc', ...c })),
  ];
  console.log(`  ${u.slug.padEnd(20)} (${u.name})`);
  for (const ch of allChanges.slice(0, 5)) {
    console.log(`    [${ch.field.padEnd(10)}] "${ch.match}" → templated`);
  }
  if (allChanges.length > 5) console.log(`    ... +${allChanges.length - 5} more`);
}
if (updates.length > 30) console.log(`  ... +${updates.length - 30} more cities`);

if (!APPLY) {
  console.log('\n[PREVIEW] No DB writes. Re-run with `--apply` to commit changes.');
  process.exit(0);
}

console.log('\nApplying updates...');
let ok = 0, fail = 0;
for (const u of updates) {
  const { error } = await supabase.from('cities').update(u.update).eq('id', u.update.id);
  if (error) { console.log(`  ⚠ ${u.slug}: ${error.message}`); fail++; }
  else ok++;
}
console.log(`\nDone: ${ok} ok, ${fail} failed`);
