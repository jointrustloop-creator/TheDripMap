// Parses scripts/missing-cities-import.sql and inserts the 56 provider rows via supabase-js.
// Uses upsert with ignoreDuplicates to mimic ON CONFLICT (slug) DO NOTHING.

import dotenv from 'dotenv';
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local', quiet: true });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const sql = fs.readFileSync('scripts/missing-cities-import.sql', 'utf8');

// Walk a VALUES row and split into column values, respecting quoted strings (with '' escaping)
function parseRow(rowStr) {
  const values = [];
  let i = 0;
  while (i < rowStr.length) {
    while (i < rowStr.length && /[\s,]/.test(rowStr[i])) i++;
    if (i >= rowStr.length) break;
    if (rowStr[i] === "'") {
      let s = '';
      i++;
      while (i < rowStr.length) {
        if (rowStr[i] === "'") {
          if (rowStr[i + 1] === "'") { s += "'"; i += 2; continue; }
          i++; break;
        }
        s += rowStr[i++];
      }
      values.push(s);
    } else {
      let token = '';
      while (i < rowStr.length && rowStr[i] !== ',' && rowStr[i] !== ')') {
        token += rowStr[i++];
      }
      token = token.trim();
      if (/^NULL$/i.test(token)) values.push(null);
      else if (/^true$/i.test(token)) values.push(true);
      else if (/^false$/i.test(token)) values.push(false);
      else if (/^-?\d+(\.\d+)?$/.test(token)) values.push(Number(token));
      else values.push(token);
    }
  }
  return values;
}

const COLUMNS = ['name', 'slug', 'city', 'state', 'country', 'address', 'phone', 'website', 'category', 'rating', 'reviews', 'is_featured'];

// Extract every row inside parentheses on a line starting with `(`
const rowLines = sql.split('\n').filter(l => l.trim().startsWith("('"));

const rows = [];
for (const line of rowLines) {
  // Strip trailing comma or trailing `)` plus any trailing comma
  let row = line.trim();
  if (row.endsWith(',')) row = row.slice(0, -1);
  if (row.endsWith(')')) row = row.slice(0, -1);
  if (row.startsWith('(')) row = row.slice(1);
  const values = parseRow(row);
  if (values.length !== COLUMNS.length) {
    console.error(`Bad row (got ${values.length} cols, expected ${COLUMNS.length}): ${line.slice(0, 100)}`);
    continue;
  }
  const obj = Object.fromEntries(COLUMNS.map((c, i) => [c, values[i]]));
  rows.push(obj);
}

console.log(`Parsed ${rows.length} rows from SQL file`);
console.log('\nBy city:');
const byCity = {};
for (const r of rows) byCity[r.city] = (byCity[r.city] || 0) + 1;
for (const [city, count] of Object.entries(byCity).sort()) {
  console.log(`  ${city.padEnd(20)} ${count}`);
}

const { count: beforeCount } = await supabase
  .from('providers')
  .select('*', { count: 'exact', head: true });
console.log(`\nProviders table BEFORE: ${beforeCount} rows`);

console.log('\nInserting via upsert (ignoreDuplicates on slug)...');
const { error, count: insertedCount } = await supabase
  .from('providers')
  .upsert(rows, { onConflict: 'slug', ignoreDuplicates: true })
  .select('*', { count: 'exact', head: true });
if (error) {
  console.error('Insert failed:', error);
  process.exit(1);
}

const { count: afterCount } = await supabase
  .from('providers')
  .select('*', { count: 'exact', head: true });
console.log(`\nProviders table AFTER:  ${afterCount} rows`);
console.log(`Net new rows added:     ${afterCount - beforeCount}`);
console.log(`(Some rows may have been skipped due to existing slugs)`);

// Sample-check: count by city for the 10 target cities
console.log('\n=== Per-city verification ===');
const targetCities = ['Miami', 'Austin', 'Denver', 'Nashville', 'Charlotte', 'Indianapolis', 'Columbus', 'Portland', 'Sacramento', 'Salt Lake City'];
for (const city of targetCities) {
  const { count } = await supabase
    .from('providers')
    .select('*', { count: 'exact', head: true })
    .eq('city', city);
  console.log(`  ${city.padEnd(20)} ${count} providers total in DB now`);
}
