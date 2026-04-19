import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Supabase not configured');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function audit() {
  console.log('--- AUDIT START ---');
  
  // 1. Check San Francisco specifically
  const { data: sf, error: sfErr } = await supabase
    .from('providers')
    .select('id, name, city, state, address')
    .ilike('city', '%San Francisco%');
  
  console.log(`San Francisco matches found: ${sf?.length || 0}`);
  if (sf && sf.length > 0) {
    console.log('First SF listing sample:', sf[0]);
  }

  // 2. Check San Diego (User mentioned 17 vs 7 issue)
  const { data: sd, error: sdErr } = await supabase
    .from('providers')
    .select('id, name, city, state, address')
    .ilike('city', '%San Diego%');
  
  console.log(`San Diego matches found: ${sd?.length || 0}`);
  
  // Deduplicate like we do in the app
  function deduplicate(data) {
    const byId = new Map();
    data.forEach(item => { if (item && item.id && !byId.has(item.id)) byId.set(item.id, item); });
    const seen = new Set();
    const result = [];
    Array.from(byId.values()).forEach(item => {
      const name = (item.name || '').toLowerCase().trim();
      const city = (item.city || '').toLowerCase().trim();
      const address = (item.address || '').toLowerCase().trim();
      const key = `${name}|${city}|${address}`;
      if (!seen.has(key)) { seen.add(key); result.push(item); }
    });
    return result;
  }

  const uniqueSd = deduplicate(sd || []);
  console.log(`San Diego unique listings: ${uniqueSd.length}`);

  // 3. Stats Check
  const { data: all, error: allErr } = await supabase
    .from('providers')
    .select('city, state, name, address');
  
  const uniqueAll = deduplicate(all || []);
  console.log(`Total unique listings across all cities: ${uniqueAll.length}`);

  console.log('--- AUDIT END ---');
}

audit();
