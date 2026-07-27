/**
 * Monthly newsletter digest generator (DRAFT ONLY, no send system).
 * For each Canadian [SUBSCRIBE] signup, assemble a simple monthly digest:
 * a few top guides + new clinics recently added in (or near) their city.
 * Writes drafts to .audit-tmp/_newsletter-drafts.json for operator review.
 * NOTHING is sent. House style: no dashes, no medical claims, "matching platform".
 * US stays dark: US-city subscribers are skipped.
 *
 *   node scripts/_newsletter-digest.cjs         # print a sample
 *   node scripts/_newsletter-digest.cjs emit      # write all CA drafts to JSON
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local'), override: true });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const EMIT = process.argv[2] === 'emit';
const SITE = 'https://www.thedripmap.com';
const OUT = path.join(__dirname, '..', '.audit-tmp', '_newsletter-drafts.json');
const CASL = `\n--\nTheDripMap, the IV therapy matching platform for Canada | info@thedripmap.com | Caledon, Ontario, Canada\nYou are receiving this because you subscribed on TheDripMap. Reply 'unsubscribe' to stop.`;
const US_CITIES = /murrieta|san luis obispo|noble/i; // subscriber cities that are US / non-CA

function buildEmail(city, guides, clinics) {
  const L = [];
  L.push(`Hi from TheDripMap,`);
  L.push('');
  L.push(`A quick monthly roundup for IV therapy in and around ${city}.`);
  L.push('');
  if (guides.length) {
    L.push('Worth a read:');
    guides.forEach((g) => L.push(`  ${g.title}\n  ${SITE}/blog/${g.slug}`));
    L.push('');
  }
  if (clinics.length) {
    L.push(`New on the platform near ${city}:`);
    clinics.forEach((c) => L.push(`  ${c.name} (${c.city})  ${SITE}/providers/${c.slug}`));
    L.push('');
  }
  L.push(`Browse every ${city} clinic: ${SITE}/cities/${city.toLowerCase().replace(/\s+/g, '-')}`);
  L.push('');
  L.push('Warmly,');
  L.push('TheDripMap');
  L.push(CASL);
  return { subject: `Your monthly IV therapy roundup for ${city}`, body: L.join('\n') };
}

(async () => {
  // top guides: recent CA-relevant blog posts (proven lanes first if present)
  const preferred = ['iv-therapy-laws-canada-province-by-province-2026', 'can-you-claim-iv-therapy-canadian-insurance', 'how-to-verify-ontario-iv-clinic-inspected-2026'];
  const { data: posts } = await s.from('blog_posts').select('slug,title,created_at').order('created_at', { ascending: false }).limit(60);
  const pick = [];
  for (const slug of preferred) { const p = (posts || []).find((x) => x.slug === slug); if (p) pick.push(p); }
  for (const p of (posts || [])) { if (pick.length >= 4) break; if (!pick.find((x) => x.slug === p.slug)) pick.push(p); }

  // subscribers
  const { data: inq } = await s.from('inquiries').select('message,created_at');
  const cities = [...new Set((inq || []).filter((r) => /\[SUBSCRIBE\]/.test(r.message || '')).map((r) => ((String(r.message).match(/city=([^\]]+)/) || [])[1] || '').trim()).filter(Boolean))]
    .filter((c) => !US_CITIES.test(c));

  // recent clinics per city (best-effort: exact city, then just newest CA)
  let provs = [], from = 0;
  while (true) { const { data } = await s.from('providers').select('name,slug,city,country,created_at').eq('country', 'Canada').order('created_at', { ascending: false }).range(from, from + 999); provs = provs.concat(data || []); if (!data || data.length < 1000) break; from += 1000; }

  const drafts = cities.map((city) => {
    const inCity = provs.filter((p) => (p.city || '').toLowerCase() === city.toLowerCase()).slice(0, 3);
    const clinics = inCity.length ? inCity : provs.slice(0, 3);
    const e = buildEmail(city, pick, clinics);
    return { city, subject: e.subject, body: e.body };
  });

  console.log(`CA subscriber cities: ${cities.join(', ') || '(none)'} | drafts: ${drafts.length}`);
  if (drafts[0]) console.log('\n--- SAMPLE ---\nSubject: ' + drafts[0].subject + '\n\n' + drafts[0].body);
  if (EMIT) { fs.writeFileSync(OUT, JSON.stringify(drafts, null, 1)); console.log(`\nemitted ${drafts.length} drafts -> ${OUT} (DRAFTS ONLY; operator sends).`); }
  else console.log('\nDRY. Re-run with "emit" to write drafts JSON. Nothing is sent.');
})().catch((e) => { console.log('FATAL', e.message); process.exit(1); });
