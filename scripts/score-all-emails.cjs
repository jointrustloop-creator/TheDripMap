// PART 2 — One-shot backfill of providers.email_quality.
//
// PRE-REQ: scripts/add-email-quality-column.sql must be applied first.
// Run via Supabase SQL Editor:
//   https://supabase.com/dashboard/project/qaqzwfnjajyejehmdvuw/sql/new
//
// Then: node scripts/score-all-emails.cjs
//
// Classifies every provider's email into one of:
//   - high     clinic-owned domain
//   - medium   personal-mail domain w/ business-style local-part
//   - low      personal-mail domain w/ person-name / generic local-part
//   - unknown  no email or malformed
//
// Writes the bucket to providers.email_quality (text) and reports the
// final distribution.

require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');

const PERSONAL_DOMAINS = new Set([
  'gmail.com', 'hotmail.com', 'hotmail.ca', 'yahoo.com', 'yahoo.ca',
  'outlook.com', 'live.com', 'aol.com', 'icloud.com', 'me.com',
  'mac.com', 'msn.com', 'ymail.com',
]);

const BUSINESS_ALIASES = new Set([
  'info', 'contact', 'booking', 'bookings', 'hello', 'admin', 'office',
  'support', 'team', 'hi', 'mail', 'staff', 'clinic', 'reception',
  'frontdesk', 'inquiries', 'inquiry', 'sales', 'appointments',
  'appointment', 'schedule', 'scheduling', 'wellness', 'spa',
  'medspa', 'iv', 'drip', 'therapy', 'hydration',
]);

function classify(rawEmail, providerName = '') {
  if (!rawEmail || !rawEmail.trim()) return 'unknown';
  const e = rawEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return 'unknown';
  if (/\.(jpe?g|png|gif|webp|svg)$/i.test(e)) return 'unknown';

  const [local, domain] = e.split('@');
  if (!PERSONAL_DOMAINS.has(domain)) return 'high';
  if (BUSINESS_ALIASES.has(local)) return 'medium';

  if (providerName) {
    const tokens = providerName
      .toLowerCase()
      .replace(/[^a-z0-9 ]+/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= 4 && !['the', 'and', 'with', 'iv', 'spa', 'med', 'clinic', 'wellness', 'hydration', 'therapy', 'drip'].includes(t));
    if (tokens.some((t) => local.includes(t))) return 'medium';
  }

  if (/^[a-z]+[._][a-z]+/.test(local)) return 'low';
  if (/^[a-z]{3,15}$/.test(local)) return 'low';
  return 'low';
}

async function paginateAll(supabase, columns) {
  const pageSize = 1000;
  let from = 0;
  const all = [];
  while (true) {
    const { data, error } = await supabase
      .from('providers')
      .select(columns)
      .range(from, from + pageSize - 1);
    if (error) throw error;
    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

(async () => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Sanity: does the column exist? If not, the script is being run before the
  // SQL migration was applied — bail with a clear instruction.
  const { error: colCheck } = await supabase
    .from('providers')
    .select('id, email_quality')
    .limit(1);
  if (colCheck) {
    console.error('\n[ERR] providers.email_quality column not found.');
    console.error('Run scripts/add-email-quality-column.sql first via the Supabase SQL editor:');
    console.error('  https://supabase.com/dashboard/project/qaqzwfnjajyejehmdvuw/sql/new\n');
    process.exit(1);
  }

  console.log('Pulling all providers…');
  const rows = await paginateAll(supabase, 'id, name, email, email_quality');
  console.log(`Loaded ${rows.length} rows.`);

  // Compute the new quality bucket per row; only update rows where the value
  // differs from what's already stored (saves a write on re-runs).
  const updates = [];
  const dist = { high: 0, medium: 0, low: 0, unknown: 0 };
  for (const r of rows) {
    const q = classify(r.email, r.name);
    dist[q] += 1;
    if (r.email_quality !== q) updates.push({ id: r.id, q });
  }

  console.log(`\nComputed distribution (before write):`);
  for (const k of Object.keys(dist)) console.log(`  ${k.padEnd(8)} ${dist[k]}`);
  console.log(`\nNeed to update ${updates.length} rows (rest already match).`);

  // Batched updates — group by target bucket and use .in('id', ids)
  const byBucket = { high: [], medium: [], low: [], unknown: [] };
  for (const u of updates) byBucket[u.q].push(u.id);
  for (const bucket of Object.keys(byBucket)) {
    const ids = byBucket[bucket];
    if (!ids.length) continue;
    // Update in chunks of 500
    for (let i = 0; i < ids.length; i += 500) {
      const chunk = ids.slice(i, i + 500);
      const { error } = await supabase
        .from('providers')
        .update({ email_quality: bucket })
        .in('id', chunk);
      if (error) {
        console.error(`[ERR] bucket=${bucket} chunk=${i}: ${error.message}`);
        process.exit(1);
      }
    }
    console.log(`  Wrote ${ids.length} -> ${bucket}`);
  }

  // Re-read to confirm
  console.log('\nVerifying distribution from DB…');
  const after = await paginateAll(supabase, 'id, email_quality');
  const finalDist = { high: 0, medium: 0, low: 0, unknown: 0, NULL: 0 };
  for (const r of after) {
    const k = r.email_quality || 'NULL';
    finalDist[k] = (finalDist[k] || 0) + 1;
  }
  console.log('\nFinal email_quality distribution in DB:');
  for (const k of Object.keys(finalDist)) console.log(`  ${k.padEnd(8)} ${finalDist[k]}`);

  console.log('\nDone.');
})();
