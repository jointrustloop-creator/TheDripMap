// Reconciles cities.listings_count to match what each city page actually shows
// (i.e., what getListingsByCity returns) so footer counts, /cities index counts,
// and individual city page H1s all agree.
//
// Run without args for PREVIEW. Pass --apply to write.

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local', quiet: true });

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Mirror the EXACT GTA grouping from src/lib/data.ts (kept in sync — if data.ts
// GTA_CITIES changes, update this too). Wider list would produce a different
// Toronto count from what the city page actually shows.
const GTA_CITIES = ['Toronto', 'Ajax', 'Brampton', 'Mississauga', 'Oakville', 'Richmond Hill', 'Vaughan'];

// State full-name → 2-letter abbr (matches src/lib/data.ts STATE_MAP behavior)
const STATE_ABBR = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
  colorado: 'CO', connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA',
  hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA',
  kansas: 'KS', kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD',
  massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS',
  missouri: 'MO', montana: 'MT', nebraska: 'NE', nevada: 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', ohio: 'OH', oklahoma: 'OK',
  oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT', vermont: 'VT',
  virginia: 'VA', washington: 'WA', 'west virginia': 'WV', wisconsin: 'WI', wyoming: 'WY',
  // Canadian
  ontario: 'ON', quebec: 'QC', 'british columbia': 'BC', alberta: 'AB',
  manitoba: 'MB', saskatchewan: 'SK', 'nova scotia': 'NS', 'new brunswick': 'NB',
  'prince edward island': 'PE', newfoundland: 'NL', 'newfoundland and labrador': 'NL',
};

// Mirror getListingsByCity's logic: substring city match + optional state match
// (matching either full name OR abbreviation since providers table is inconsistent)
// + GTA special case. Toronto/Ontario/GTA returns providers whose city is in GTA_CITIES.
async function countListings(cityName, stateName) {
  const isGTA = stateName?.toLowerCase() === 'ontario' || cityName.toLowerCase() === 'gta';
  if (isGTA && (cityName === 'Toronto' || cityName.toLowerCase() === 'gta')) {
    const { count } = await supabase
      .from('providers')
      .select('*', { count: 'exact', head: true })
      .in('city', GTA_CITIES)
      .eq('country', 'Canada');
    return count ?? 0;
  }

  // Standard: substring city match + state filter (if provided, matching both name and abbr)
  let query = supabase.from('providers').select('*', { count: 'exact', head: true }).ilike('city', `%${cityName}%`);
  if (stateName) {
    const abbr = STATE_ABBR[stateName.toLowerCase()] || stateName;
    // Match either full name or abbreviation — providers table is inconsistent (some 'Florida', some 'FL')
    query = query.or(`state.ilike.${stateName},state.ilike.${abbr}`);
  }
  const { count } = await query;
  return count ?? 0;
}

// Load every city row
const { data: cities, error } = await supabase
  .from('cities')
  .select('id, slug, name, state, state_code, listings_count');
if (error) { console.error('Load failed:', error); process.exit(1); }

console.log(`Loaded ${cities.length} city rows`);
console.log(`Mode: ${APPLY ? 'APPLY (will write)' : 'PREVIEW (no writes — pass --apply to commit)'}`);
console.log('');

const updates = [];
for (const c of cities) {
  // Build the state arg to pass into countListings. Prefer full state name (matches the city page route which passes state from URL).
  let stateArg = c.state;
  if (!stateArg && c.state_code) {
    // Cities table has some rows with state_code but null state; skip those for now
    stateArg = undefined;
  }
  const liveCount = await countListings(c.name, stateArg);
  const dbCount = c.listings_count ?? 0;
  if (liveCount !== dbCount) {
    updates.push({ id: c.id, slug: c.slug, name: c.name, state: stateArg, oldCount: dbCount, newCount: liveCount });
  }
}

console.log(`Cities needing sync: ${updates.length} / ${cities.length}`);
console.log('');

// Show biggest deltas first
updates.sort((a, b) => Math.abs(b.newCount - b.oldCount) - Math.abs(a.newCount - a.oldCount));
for (const u of updates.slice(0, 30)) {
  const delta = u.newCount - u.oldCount;
  const sign = delta > 0 ? '+' : '';
  console.log(`  ${u.slug.padEnd(25)} (${(u.state||'?').padEnd(20)}) ${String(u.oldCount).padStart(3)} → ${String(u.newCount).padStart(3)} (${sign}${delta})`);
}
if (updates.length > 30) console.log(`  ... +${updates.length - 30} more`);

if (!APPLY) {
  console.log('\n[PREVIEW] No DB writes. Re-run with --apply to commit changes.');
  process.exit(0);
}

console.log('\nApplying updates...');
let ok = 0, fail = 0;
for (const u of updates) {
  const { error } = await supabase
    .from('cities')
    .update({ listings_count: u.newCount, listing_count: u.newCount })
    .eq('id', u.id);
  if (error) { console.log(`  ⚠ ${u.slug}: ${error.message}`); fail++; }
  else ok++;
}
console.log(`\nDone: ${ok} ok, ${fail} failed`);
