import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local', quiet: true });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const { data, error } = await supabase
  .from('providers')
  .select('id, name, slug, city, state, country, phone, email, website, rating, reviews, description, working_hours, specialties, address, outreach_sent')
  .or('is_featured.is.null,is_featured.eq.false')
  .not('website', 'is', null)
  .not('rating', 'is', null)
  .order('rating', { ascending: false })
  .order('reviews', { ascending: false, nullsFirst: false })
  .limit(20);

if (error) { console.error(error); process.exit(1); }

const outPath = path.join(process.env.TEMP || '/tmp', 'top20.json');
fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
console.log(`Wrote ${data.length} providers to ${outPath}`);
data.forEach((p, i) => {
  console.log(`${String(i+1).padStart(2)} ★${p.rating} (${p.reviews||0}) ${(p.name||'').padEnd(50).slice(0,50)} — ${p.city} — ${(p.website||'').slice(0,50)}`);
});
