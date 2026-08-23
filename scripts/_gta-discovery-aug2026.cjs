/**
 * GTA + Ontario clinic discovery, web-search sourced (2026-08-23).
 *
 * The Places API path is unavailable locally (no GOOGLE_PLACES_API_KEY in
 * .env.local, and the Cloud billing account is suspended), so candidates come
 * from web search and are verified by fetching each site.
 *
 * For every candidate: dedupe against the live roster (domain first, then a
 * normalized-name match), then fetch the homepage plus likely contact pages and
 * extract a real contact email from the page text and mailto links.
 *
 * Fetch pattern per the house hard lesson: SEQUENTIAL, AbortController timeout,
 * 600ms polite delay. Concurrent HTTPS workers die silently on this machine
 * (exit 0, partway through). Partial results are written after EVERY candidate
 * so a death is resumable rather than total.
 *
 * Output: .audit-tmp/_gta-discovery.json  (nothing is written to the database)
 * Run: node scripts/_gta-discovery-aug2026.cjs
 */
require('dotenv').config({ path: '.env.local', override: true });
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const OUT = '.audit-tmp/_gta-discovery.json';

// Web-search sourced. `city` is the clinic's stated primary location.
const CANDIDATES = [
  // Toronto + boroughs (our thinnest GTA coverage: Scarborough 2, East York 1, North York 5)
  { name: 'The Mom Loft', city: 'North York', site: 'https://themomloft.com' },
  { name: 'Rejuvenus Clinic', city: 'Toronto', site: 'https://www.rejuvenusclinic.ca' },
  { name: 'MyBest Clinic', city: 'Toronto', site: 'https://mybestclinic.com' },
  { name: 'Beauty Bar Medical Clinic', city: 'Toronto', site: 'https://beautybarclinic.com' },
  { name: 'Toronto Functional Medicine Centre (The IV Lounge)', city: 'Toronto', site: 'https://torontofunctionalmedicine.com' },
  { name: 'Motion Care Clinic', city: 'North York', site: 'https://www.motioncareclinic.com' },
  { name: 'Higher Health Naturopathic Centre', city: 'Toronto', site: 'https://higherhealthcentre.com' },
  // Peel + Halton
  { name: 'Painease Clinic', city: 'Mississauga', site: 'https://painease.ca' },
  { name: 'pureBalance Wellness', city: 'Mississauga', site: 'https://www.mypurebalance.ca' },
  { name: 'Fyxson Medical Aesthetics', city: 'Oakville', site: 'https://fyxsonmedical.com' },
  // York region
  { name: 'Larivee Medical Cosmetic Clinic', city: 'Vaughan', site: 'https://lmccltd.ca' },
  { name: 'The Grand Medical Aesthetic Clinic', city: 'Richmond Hill', site: 'https://gmaclinic.com' },
  { name: 'Golden Glow Skin Clinic', city: 'Richmond Hill', site: 'https://goldenglowskinclinic.com' },
  // Durham
  { name: 'Medskincare Laser Centre', city: 'Whitby', site: 'https://medskincare.ca' },
  { name: 'Aniyah Care Health & Wellness', city: 'Ajax', site: 'https://aniyahcare.com' },
  { name: 'Oshawa Clinic Group Infusion Clinic', city: 'Oshawa', site: 'https://oshawaclinic.com' },
  { name: 'Centre for Advanced Medicine', city: 'Whitby', site: 'https://advancedmedicine.ca' },
  // Beyond the GTA (operator said outside is fine)
  { name: 'Aesthetics By SAM', city: 'Kitchener', site: 'https://kwc-aestheticsbysam.com' },
  { name: 'Revitalize Aesthetics MedSpa', city: 'Kitchener', site: 'https://www.revitalizemedspa.ca' },
  { name: 'Sunshine Cosmetic Clinic & Medi Spa', city: 'Waterloo', site: 'https://kitchenerwaterloomedispa.com' },
  { name: 'HealthSource Integrative Medical Centre', city: 'Kitchener', site: 'https://www.healthsourceimc.com' },
  { name: 'Elev8 Aesthetic Medicine', city: 'Kitchener', site: 'https://www.elev8aesthetics.ca' },
  { name: 'Visage Rejuvenation', city: 'Waterdown', site: 'https://www.visagerejuvenation.com' },
  // Round 2: mobile-first operators and naturopathic IV clinics, which sit
  // outside the "IV clinic <city>" search surface round 1 covered.
  { name: 'Drip Tonic', city: 'Toronto', site: 'https://driptonic.ca' },
  { name: 'Wellness Haus', city: 'Toronto', site: 'https://wellnesshaus.com' },
  { name: 'IV Drip Toronto', city: 'Toronto', site: 'https://ivdriptoronto.com' },
  { name: 'Mobile IV Canada', city: 'Toronto', site: 'https://mobileivcanada.com' },
  { name: 'Viva Wellness Drip', city: 'Toronto', site: 'https://vivawellnessdrip.com' },
  { name: 'Ontario Naturopathic Clinic', city: 'Toronto', site: 'https://www.ontarionaturopathicclinic.ca' },
  { name: 'Willow London Naturopathic & IV Clinic', city: 'London', site: 'https://www.willownaturopath.com' },
  { name: 'Nardella Clinic', city: 'Calgary', site: 'https://nardellaclinic.com' },
];

// Deliberately excluded, with reasons, so the exclusion is auditable:
//   upperroomclinic.com  standing operator rule, never contact
//   ivdriptherapynearme.com / driphydration.com  lead-gen aggregators, not clinics
const EXCLUDED = ['upperroomclinic.com', 'ivdriptherapynearme.com', 'driphydration.com'];

const CONTACT_PATHS = ['', '/contact', '/contact-us', '/about', '/about-us', '/book', '/booking'];
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
// Junk senders that appear on almost every site and are never the clinic.
const JUNK_EMAIL = /(example|sentry|wixpress|godaddy|squarespace|@2x|\.png|\.jpg|\.webp|\.gif|\.svg|sentry\.io|@sentry|placeholder|your-?email|domain\.com|email\.com)/i;

const norm = (n) => (n || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const domainOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchText(url) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 15000);
  try {
    const res = await fetch(url, {
      signal: ac.signal,
      redirect: 'follow',
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; TheDripMapBot/1.0; +https://www.thedripmap.com)' },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function extractEmails(html, siteDomain) {
  if (!html) return [];
  const found = new Set();
  // mailto: links are the highest-signal source
  for (const m of html.matchAll(/mailto:([^"'?>\s]+)/gi)) found.add(m[1]);
  for (const m of (html.match(EMAIL_RE) || [])) found.add(m);
  const cleaned = [...found]
    .map((e) => e.trim().replace(/^mailto:/i, '').toLowerCase())
    .filter((e) => !JUNK_EMAIL.test(e))
    .filter((e) => e.length < 60);
  // Prefer an address on the clinic's own domain.
  const own = cleaned.filter((e) => siteDomain && e.endsWith('@' + siteDomain));
  const other = cleaned.filter((e) => !own.includes(e));
  return [...new Set([...own, ...other])];
}

async function main() {
  // Live roster for dedupe.
  let roster = [], f = 0;
  for (;;) {
    const { data, error } = await s.from('providers').select('name,city,website,email').range(f, f + 999);
    if (error) throw new Error(error.message);
    if (!data || !data.length) break;
    roster = roster.concat(data);
    if (data.length < 1000) break;
    f += 1000;
  }
  const haveDomains = new Set(roster.map((p) => domainOf(p.website)).filter(Boolean));
  const haveNames = new Set(roster.map((p) => norm(p.name)));
  console.log(`roster: ${roster.length} providers, ${haveDomains.size} domains\n`);

  let results = [];
  try { results = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch { /* fresh */ }
  const done = new Set(results.map((r) => r.site));

  for (const c of CANDIDATES) {
    if (done.has(c.site)) { console.log(`skip (done) ${c.name}`); continue; }
    const dom = domainOf(c.site);
    if (EXCLUDED.includes(dom)) { console.log(`EXCLUDED ${c.name}`); continue; }

    let status = 'NEW';
    if (haveDomains.has(dom)) status = 'ALREADY_HAVE (domain)';
    else if (haveNames.has(norm(c.name))) status = 'ALREADY_HAVE (name)';

    let emails = [], reachable = false, pagesOk = 0;
    if (status === 'NEW') {
      for (const p of CONTACT_PATHS) {
        const html = await fetchText(c.site.replace(/\/+$/, '') + p);
        if (html) { reachable = true; pagesOk++; emails.push(...extractEmails(html, dom)); }
        await sleep(600); // polite delay, house pattern
      }
      emails = [...new Set(emails)];
    }

    const row = { ...c, domain: dom, status, reachable, pagesOk, emails };
    results.push(row);
    fs.writeFileSync(OUT, JSON.stringify(results, null, 2)); // after EVERY candidate
    console.log(`${status.padEnd(22)} ${c.name.padEnd(50)} ${emails[0] || (status === 'NEW' ? (reachable ? 'no email found' : 'UNREACHABLE') : '')}`);
  }

  const fresh = results.filter((r) => r.status === 'NEW');
  console.log(`\n${results.length} checked | ${fresh.length} NOT in our database | ${fresh.filter((r) => r.emails.length).length} with an email found`);
}

main().catch((e) => { console.error('ERR', e.message); process.exit(1); });
