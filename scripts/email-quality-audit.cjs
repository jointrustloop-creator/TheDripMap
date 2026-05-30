// Email Quality Audit (PART 0)
// One-shot audit of the providers table to bucket every active provider
// into one of four email-quality buckets: high, medium, low, unknown.
//
// Run: node scripts/email-quality-audit.cjs
//
// ------------------------------------------------------------------------
// AUDIT OUTPUT (2026-05-30 — pre-backfill, live production data)
// ------------------------------------------------------------------------
// Total providers in DB:                1161
// Active (availability != false):       1161
//   With non-empty email:               647
//   Without email:                      514
//
// Quality breakdown (all active providers):
//   Country            | high | medium | low | unknown | total
//   -------------------|------|--------|-----|---------|------
//   Canada             |   86 |      1 |   1 |      76 |   164
//   United States      |  476 |     41 |  38 |     442 |   997
//   TOTAL              |  562 |     42 |  39 |     518 |  1161
//
// Cron-eligible pool TODAY (unclaimed + not bounced + not yet sent + has email):
//   high:    430
//   medium:   36
//   low:      35   <-- would be skipped under high+medium-only filter
//   unknown:   4   <-- no email, already skipped
//   TOTAL:   505
//
// If we restrict outreach to high + medium ONLY, we exclude 35 providers
// (the "low" bucket). 466 high+medium remain in the daily pool — ~24+ days
// of inventory at 19 drafts/day.
// ------------------------------------------------------------------------

require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');

const PERSONAL_DOMAINS = new Set([
  'gmail.com', 'hotmail.com', 'hotmail.ca', 'yahoo.com', 'yahoo.ca',
  'outlook.com', 'live.com', 'aol.com', 'icloud.com', 'me.com',
  'mac.com', 'msn.com', 'ymail.com',
]);

// Business-style local-parts that signal "this is a shared business inbox"
// even when the domain is gmail/hotmail/etc.
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
  // Basic shape check — malformed emails get treated as unknown
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return 'unknown';
  // Image-scrape garbage
  if (/\.(jpe?g|png|gif|webp|svg)$/i.test(e)) return 'unknown';

  const [local, domain] = e.split('@');

  // High = clinic-owned domain (not on the personal-mail list)
  if (!PERSONAL_DOMAINS.has(domain)) return 'high';

  // From here on, domain is a known personal-mail domain (gmail.com etc.)
  // Medium = local-part looks like a business alias
  if (BUSINESS_ALIASES.has(local)) return 'medium';

  // Medium = local-part contains the clinic's name (case-insensitive)
  if (providerName) {
    // Normalize the name to alphabetic tokens >= 3 chars
    const tokens = providerName
      .toLowerCase()
      .replace(/[^a-z0-9 ]+/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= 4 && !['the', 'and', 'with', 'iv', 'spa', 'med', 'clinic', 'wellness', 'hydration', 'therapy', 'drip'].includes(t));
    if (tokens.some((t) => local.includes(t))) return 'medium';
  }

  // Person-name heuristic: firstname.lastname or first_last
  if (/^[a-z]+[._][a-z]+/.test(local)) return 'low';

  // Single 3-15 char alphabetic token that's not a business alias -> low
  if (/^[a-z]{3,15}$/.test(local)) return 'low';

  // Anything else on a personal domain (numbers, weird mixes) -> low
  return 'low';
}

function bucketByCountry(country) {
  const c = (country || '').trim().toLowerCase();
  if (c === 'canada') return 'Canada';
  if (c === 'united states' || c === 'usa' || c === 'us') return 'United States';
  return 'Other/Unknown';
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

  console.log('Pulling all providers…');
  const rows = await paginateAll(
    supabase,
    'id, name, email, country, availability, is_featured, outreach_sent, email_bounced'
  );

  const active = rows.filter((r) => r.availability !== false);
  console.log(`\nTotal providers in DB:     ${rows.length}`);
  console.log(`Active (availability != false): ${active.length}`);

  const withEmail = active.filter((r) => r.email && r.email.trim());
  const withoutEmail = active.length - withEmail.length;
  console.log(`  With non-empty email:    ${withEmail.length}`);
  console.log(`  Without email:           ${withoutEmail}`);

  // Classify every active provider
  const counts = {
    Canada: { high: 0, medium: 0, low: 0, unknown: 0 },
    'United States': { high: 0, medium: 0, low: 0, unknown: 0 },
    'Other/Unknown': { high: 0, medium: 0, low: 0, unknown: 0 },
    TOTAL: { high: 0, medium: 0, low: 0, unknown: 0 },
  };

  // Track providers that would currently be eligible for the cron
  // (i.e. not bounced, not already sent, not claimed) so we can report how
  // many would be excluded if we add the high+medium filter.
  let poolHigh = 0;
  let poolMedium = 0;
  let poolLow = 0;
  let poolUnknown = 0;

  const lowSamples = [];
  const mediumSamples = [];

  for (const r of active) {
    const q = classify(r.email, r.name);
    const country = bucketByCountry(r.country);
    counts[country][q] += 1;
    counts.TOTAL[q] += 1;

    const inOutreachPool =
      !r.is_featured && r.outreach_sent !== true && r.email_bounced !== true && r.email && r.email.trim();
    if (inOutreachPool) {
      if (q === 'high') poolHigh += 1;
      else if (q === 'medium') poolMedium += 1;
      else if (q === 'low') poolLow += 1;
      else poolUnknown += 1;
    }

    if (q === 'low' && lowSamples.length < 10) lowSamples.push({ name: r.name, email: r.email });
    if (q === 'medium' && mediumSamples.length < 10) mediumSamples.push({ name: r.name, email: r.email });
  }

  console.log('\n=== Email-quality breakdown (all active providers) ===');
  console.log('Country            | high | medium | low | unknown | total');
  console.log('-------------------|------|--------|-----|---------|------');
  for (const country of ['Canada', 'United States', 'Other/Unknown', 'TOTAL']) {
    const c = counts[country];
    const total = c.high + c.medium + c.low + c.unknown;
    console.log(
      `${country.padEnd(18)} | ${String(c.high).padStart(4)} | ${String(c.medium).padStart(6)} | ${String(c.low).padStart(3)} | ${String(c.unknown).padStart(7)} | ${String(total).padStart(5)}`
    );
  }

  console.log('\n=== Current cron-eligible pool (unclaimed, not bounced, not yet sent, has email) ===');
  const poolTotal = poolHigh + poolMedium + poolLow + poolUnknown;
  console.log(`  high:    ${poolHigh}`);
  console.log(`  medium:  ${poolMedium}`);
  console.log(`  low:     ${poolLow}  <-- would be skipped under high+medium-only filter`);
  console.log(`  unknown: ${poolUnknown}  <-- already skipped (no email)`);
  console.log(`  TOTAL:   ${poolTotal}`);
  console.log(`\nUnder a high+medium-only outreach policy, we would EXCLUDE ${poolLow} provider(s) from the pool.`);

  console.log('\nSample LOW classifications (first 10):');
  for (const s of lowSamples) console.log(`  - ${s.email}  (${s.name})`);
  console.log('\nSample MEDIUM classifications (first 10):');
  for (const s of mediumSamples) console.log(`  - ${s.email}  (${s.name})`);
})();
