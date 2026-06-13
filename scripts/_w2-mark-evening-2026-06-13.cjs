// Mark the 26 providers behind tonight's 20 outreach drafts as outreach_sent.
// SELECT first, count check = 26, abort on any unexpected scope.
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const SENT_AT = '2026-06-13T22:30:00Z';
const IDS = [
  '01df166b-fe6f-4a33-b67d-0a9451f9588f', // Collaborative Wellness
  '681aa352-2c76-4485-a3bd-12e251d10084', // Revolution Medical
  '66bb4787-cfda-46bd-8fb8-283e994d6069', // Whistler Medical Aesthetics
  '22b4ddb6-c25d-42e4-82d9-325db7817a44', '2fbc6f9b-5288-4efd-8ebf-63c2594b491a', // NewM (2)
  '0896425c-725d-4a0f-8b52-862086cd462d', // Limitless
  '3a2364d0-f8bc-4e20-942a-14c657307a36', // The IV Health Centre
  '347be0ca-b1bf-472e-b2f0-01d246b42a7d', // Beauty Med
  'ea8c692a-aafe-456d-909a-b9b446a25cea', // Vitalchecks
  'acdddcef-ccc6-4482-9e3e-fcad2ac14cd3', // Helix
  'f43ff627-4df6-4efe-9f3b-36d5279198ae', // Rejuvenation Med
  '77d8e67e-4ab0-4fe3-b561-da020ffa2867', // Visage
  'e183af3e-34a7-4826-938d-8a874f14c488', // Phenom HPM
  '37284d81-ffa4-4fb4-b342-cfd01ad0fecb', // West Van
  '6e5bce7f-9612-4b90-83ae-4059b953a6cc', // Thrive
  'df27a069-15c4-48d6-a043-4995bccbd635', // Vega Vitality
  'a51d5af9-1533-4c15-900e-4e310d3da046', 'cd7f8ba4-5c31-4747-b4d0-452ddc67426c', // NEXTDRIP (2)
  '733e0910-73ed-4e9e-b9d1-dbcc8f2fe6d8', // Diba
  'f9a685d2-a371-43a8-bf10-cfc82feb0822', '4f5e91d0-e7de-4d40-a184-b2b64e861829', // Ever IV (2)
  '41f0b33e-0c37-43c9-a333-b76c1f40ec43', // HydroInfusion
  'b8a6ed0d-e427-43ec-89dc-6d3b53ec889c', 'a6bd1bd6-b4f3-4c38-b948-6d28a7e006b2', 'c9c0bc89-ad30-46c0-a250-fd5cdb3390ff', 'b8bb036e-2816-44a6-951a-6f2a5a9f986e', // ASAP IVs (4)
];

(async () => {
  const { data: rows, error } = await sb.from('providers').select('id, name, outreach_sent_at').in('id', IDS);
  if (error) { console.error('ABORT select:', error.message); process.exit(1); }
  if (rows.length !== IDS.length) { console.error(`ABORT: found ${rows.length}, expected ${IDS.length}`); process.exit(1); }
  const already = rows.filter((r) => r.outreach_sent_at);
  if (already.length) { console.error('ABORT: some already marked:', already.map((r) => r.name)); process.exit(1); }
  const { error: updErr, count } = await sb.from('providers')
    .update({ outreach_sent: true, outreach_sent_at: SENT_AT }, { count: 'exact' }).in('id', IDS);
  if (updErr) { console.error('ABORT update:', updErr.message); process.exit(1); }
  if (count !== IDS.length) { console.error(`ABORT: updated ${count}, expected ${IDS.length}`); process.exit(1); }
  console.log(`Marked ${count} providers outreach_sent=true at ${SENT_AT}. (20 drafts / ${IDS.length} providers)`);
})();
