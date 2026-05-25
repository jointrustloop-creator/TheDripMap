import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
dotenv.config({ path: '.env.local', quiet: true });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const top20 = JSON.parse(fs.readFileSync(path.resolve('scripts/top20.json'), 'utf8'));
const ids = top20.map(p => p.id);
const { data, error } = await supabase.from('providers').select('id,name,phone,description,specialties,address').in('id', ids);
if (error) { console.error(error); process.exit(1); }
const byId = Object.fromEntries(data.map(r => [r.id, r]));

let descCount = 0, specCount = 0, addrCount = 0, phoneNew = 0;
const noDesc = [], noSpec = [];
for (const p of top20) {
  const r = byId[p.id];
  if (!r) continue;
  if (r.description && r.description.length > 60) descCount++; else noDesc.push(r.name);
  if (Array.isArray(r.specialties) && r.specialties.length > 0) specCount++; else noSpec.push(r.name);
  if (r.address) addrCount++;
  if (!p.phone && r.phone) phoneNew++;
}
console.log('========== FINAL DB STATE FOR TOP 20 ==========');
console.log(`Have description : ${descCount} / 20`);
console.log(`Have specialties : ${specCount} / 20`);
console.log(`Have address     : ${addrCount} / 20`);
console.log(`New phones added : ${phoneNew} / 20`);
if (noDesc.length) console.log('\nStill missing description:'); for (const n of noDesc) console.log(`  - ${n}`);
if (noSpec.length) console.log('\nStill missing specialties:'); for (const n of noSpec) console.log(`  - ${n}`);
