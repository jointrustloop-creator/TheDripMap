// scripts/db.js
//
// Thin CLI wrapper around @supabase/supabase-js using the service-role key.
// Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local.
//
// USAGE:
//   node scripts/db.js count <table>
//   node scripts/db.js select <table> [limit]
//   node scripts/db.js insert-json <table> <path-to-json-file>
//   node scripts/db.js sql "<raw SQL>"   # experimental, uses pg-meta endpoint
//
// EXAMPLES:
//   node scripts/db.js count providers
//   node scripts/db.js select providers 5
//   node scripts/db.js insert-json providers scripts/la-clinics-import.json
//   node scripts/db.js sql "SELECT COUNT(*) FROM providers WHERE state='CA';"

import dotenv from 'dotenv';
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

// Load .env.local first (overrides), then .env (defaults)
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const [cmd, ...args] = process.argv.slice(2);

async function cmdCount(table) {
  if (!table) return usage();
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error) { console.error(error.message); process.exit(1); }
  console.log(`${table}: ${count} rows`);
}

async function cmdSelect(table, limit) {
  if (!table) return usage();
  const n = Number(limit) || 5;
  const { data, error } = await supabase.from(table).select('*').limit(n);
  if (error) { console.error(error.message); process.exit(1); }
  console.log(JSON.stringify(data, null, 2));
}

async function cmdInsertJson(table, file) {
  if (!table || !file) return usage();
  if (!fs.existsSync(file)) {
    console.error(`File not found: ${file}`);
    process.exit(1);
  }
  const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(rows)) {
    console.error('JSON file must contain an array of row objects');
    process.exit(1);
  }
  console.log(`Inserting ${rows.length} rows into ${table}...`);
  const { data, error } = await supabase.from(table).insert(rows).select();
  if (error) { console.error(error.message); process.exit(1); }
  console.log(`Inserted ${data.length} rows.`);
}

async function cmdSql(query) {
  if (!query) return usage();
  // Experimental: Supabase's pg-meta endpoint. May not be enabled on all projects.
  const res = await fetch(`${url}/pg/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
    },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`HTTP ${res.status}: ${text}`);
    process.exit(1);
  }
  try { console.log(JSON.stringify(JSON.parse(text), null, 2)); }
  catch { console.log(text); }
}

function usage() {
  console.log(`Usage:
  node scripts/db.js count <table>
  node scripts/db.js select <table> [limit]
  node scripts/db.js insert-json <table> <path-to-json-file>
  node scripts/db.js sql "<raw SQL>"`);
  process.exit(1);
}

switch (cmd) {
  case 'count':       await cmdCount(args[0]); break;
  case 'select':      await cmdSelect(args[0], args[1]); break;
  case 'insert-json': await cmdInsertJson(args[0], args[1]); break;
  case 'sql':         await cmdSql(args[0]); break;
  default:            usage();
}
