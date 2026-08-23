// READ-ONLY probe: how many providers carry special_offers, and how many are
// live under the /deals gate (title + active !== false + not expired + not
// hidden + compliance). Mirrors src/lib/deals.ts. Never writes.
require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const CLAIM = /\b(cure[sd]?|heal(s|ed|ing)?|treats?\b(?!\s+yourself)|treatment\s+(of|for)|prevents?\b|detox|cleanse[sd]?|guaranteed?\s+(results?|relief)|clinically\s+proven|(melts?|burns?)\s+fat|cancer|covid|diabetes)\b/i;

(async () => {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await s
    .from('providers')
    .select('id, name, slug, city, state, is_hidden, is_claimed, special_offers')
    .not('special_offers', 'is', null)
    .neq('special_offers', '[]');
  if (error) { console.error('query error:', error.message); process.exit(1); }
  const rows = (data || []).filter((r) => Array.isArray(r.special_offers) && r.special_offers.length > 0);
  console.log(`providers with a non-empty special_offers array: ${rows.length}`);
  let live = 0;
  for (const r of rows) {
    const o = r.special_offers.find((x) => x && typeof x.title === 'string' && x.title.trim()
      && x.active !== false && (!x.expires || x.expires >= today)
      && !CLAIM.test([x.title, x.description].filter(Boolean).join(' ')));
    const status = r.is_hidden ? 'HIDDEN' : (o ? 'LIVE' : 'inactive/expired/blocked');
    if (!r.is_hidden && o) live++;
    console.log(`- ${r.slug} [${r.city}, ${r.state}] claimed=${r.is_claimed} -> ${status}`);
    for (const x of r.special_offers) console.log(`    offer: ${JSON.stringify(x)}`);
  }
  console.log(`\nLIVE deals today (${today}): ${live}`);
})();
