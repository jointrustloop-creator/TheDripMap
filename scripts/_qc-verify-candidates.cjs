/**
 * Verify the French-language Quebec discovery candidates and curate the ones
 * worth listing. Collect and judge only. Inserts nothing, sends nothing.
 *
 * WHY (2026-08-23): the French scrape ran in an earlier session and its 136
 * survivors have been sitting in .audit-tmp unused. Quebec has 16 Montreal
 * listings against Toronto's 77, and Laval, Brossard, Gatineau and
 * Saint-Laurent have one each, on a population of ~8.9M. Every earlier
 * discovery pass queried in English, so Quebec clinics that market
 * "vitaminotherapie intraveineuse" were structurally invisible to us. This is
 * the largest single gap in Canadian coverage, and Canadian outreach runway is
 * currently ZERO, so new listings are the only thing that refills it.
 *
 * A candidate is only ACCEPTED when the page itself proves three things:
 *   1. it sells IV therapy (a service term, in French or English),
 *   2. it is physically in Quebec (a Quebec city or province marker),
 *   3. it publishes an address on its own domain.
 * Anything failing one of those goes to REVIEW with the reason, never to
 * accepted. A directory, a medical reference page or a web designer's site can
 * satisfy one or two of these; requiring all three is what separates a clinic
 * from a page about clinics.
 *
 * Sequential, AbortController, polite delay, state after every candidate.
 * (Windows + Node v24 kills concurrent HTTPS workers silently — CLAUDE.md.)
 *
 * Run: node scripts/_qc-verify-candidates.cjs [--limit N]
 */
require('dotenv').config({ path: '.env.local', override: true });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SRC = path.join('.audit-tmp', '_ca-qc-fr-survivors.json');
const OUT = path.join('.audit-tmp', '_qc-verified.json');
const STATE = path.join('.audit-tmp', '_qc-verify-state.json');
const li = process.argv.indexOf('--limit');
const LIMIT = li > -1 ? Number(process.argv[li + 1]) : Infinity;
const DELAY_MS = 700;
const TIMEOUT_MS = 15000;

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Never a clinic: references, directories, booking vendors, site builders,
// agencies, marketplaces, news. These can rank for clinical French terms.
const NOT_A_CLINIC = /(merckmanuals|msdmanuals|wikipedia|passeportsante|canada\.ca|gouv\.qc\.ca|quebec\.ca|inspq|ramq|yelp|yellowpages|pagesjaunes|tripadvisor|facebook|instagram|linkedin|indeed|glassdoor|groupon|booking|janeapp|mindbody|vagaro|fresha|wellnessliving|squarespace|wix|godaddy|shopify|webflow|stagheaddesigns|latofonts|amazon|ebay|reddit|quora|youtube|pinterest|medium\.com|substack|nih\.gov|pubmed|webmd|healthline)/i;
// STRONG terms only. The first version of this list also accepted "perfusion",
// "hydratation", "serum", "solute" and a bare \bIV\b, and that let 11 of 14
// accepted sites through on nothing: a skincare page promising "hydratation
// intense", a radiology clinic, a physiotherapist, a prenatal screening lab,
// and French prose containing "IV" as a Roman numeral. A term earns a place
// here only if it cannot plausibly mean anything except intravenous nutrient
// therapy.
const IV_TERMS = /(vitaminoth[eé]rapie|intraveineu|intravenous|cocktail de myers|myers.{0,10}cocktail|nad\+|glutathion|IV drip|IV therapy|IV infusion|th[eé]rapie IV\b|perfusion (de |d')?vitamin|injection de vitamines)/i;

// A US clinic can still trip a Quebec marker: a Beverly Hills IV bar was
// accepted on the first run because "QC" and postal-like patterns turn up in
// stray markup. Anything asserting a US location is out, whatever else matched.
// Only unambiguous US signals. The first version also matched two-letter state
// codes after a comma, which was badly wrong: in a Canadian address ", CA"
// means CANADA, so Clinique M in Montreal and Club Five Health were both
// flagged American and rejected. Two-letter codes are gone; a US place has to
// name itself.
const US_MARKER = /(beverly hills|los angeles|san francisco|new york city|california|texas|florida|arizona|nevada|illinois|georgia|,\s*(USA|U\.S\.A\.|United States)|\b\d{5}(-\d{4})?,?\s*(USA|United States)\b)/i;
const QC_MARKER = /(qu[eé]bec|montr[eé]al|laval|gatineau|sherbrooke|longueuil|brossard|saint-laurent|repentigny|terrebonne|trois-rivi[eè]res|l[eé]vis|saguenay|granby|blainville|saint-j[eé]r[oô]me|drummondville|\bQC\b|\bJ[0-9][A-Z]|\bH[0-9][A-Z]|\bG[0-9][A-Z])/i;
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,24}/g;
const BAD_LOCAL = /^(no-?reply|donotreply|postmaster|abuse|webmaster|mailer-daemon|sentry|example|user)/i;
const FILE_TAIL = /\.(png|jpe?g|gif|svg|webp|css|js|woff2?|ico|avif)$/i;

function rootDomain(host) {
  const h = String(host || '').toLowerCase().replace(/^www\./, '');
  const p = h.split('.');
  if (p.length <= 2) return h;
  return /^(co|com|net|org|gouv|qc|on|bc)\.[a-z]{2}$/i.test(p.slice(-2).join('.')) ? p.slice(-3).join('.') : p.slice(-2).join('.');
}

async function get(url) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      signal: ac.signal, redirect: 'follow',
      headers: { 'User-Agent': 'TheDripMapBot/1.0 (+https://www.thedripmap.com; clinic verification)', Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'fr-CA,fr;q=0.9,en;q=0.8' },
    });
    if (!r.ok) return null;
    if (!(r.headers.get('content-type') || '').toLowerCase().includes('html')) return null;
    return await r.text();
  } catch { return null; } finally { clearTimeout(t); }
}

const strip = (html) => html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

function pickEmail(html, root) {
  const raw = [...(html.match(/mailto:([^"'>\s?]+)/gi) || []).map((m) => m.replace(/^mailto:/i, '')), ...(html.match(EMAIL_RE) || [])];
  let best = null;
  for (const c of raw) {
    const e = c.trim().toLowerCase().replace(/[.,;:)]+$/, '');
    if (FILE_TAIL.test(e)) continue;
    const [local, host] = e.split('@');
    if (!local || !host || BAD_LOCAL.test(local)) continue;
    if (NOT_A_CLINIC.test(host)) continue;
    if (rootDomain(host) !== root) continue;
    const score = /^(info|contact|bonjour|hello|admin|reception|clinique)$/.test(local) ? 3 : 1;
    if (!best || score > best.score) best = { email: e, score };
  }
  return best ? best.email : null;
}

function titleOf(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].replace(/\s+/g, ' ').trim().split(/\s*[|\-–—]\s*/)[0].slice(0, 90) : null;
}

(async () => {
  const raw = JSON.parse(fs.readFileSync(SRC, 'utf8'));
  const rows = raw.survivors || [];

  let all = [], f = 0;
  for (;;) {
    const { data, error } = await s.from('providers').select('website,email,name,city').range(f, f + 999);
    if (error) { console.error('READ FAIL', error.message); process.exit(1); }
    if (!data || !data.length) break;
    all = all.concat(data); if (data.length < 1000) break; f += 1000;
  }
  const knownDomains = new Set(all.map((p) => { try { return rootDomain(new URL(p.website).hostname); } catch { return null; } }).filter(Boolean));
  const knownEmails = new Set(all.map((p) => (p.email || '').toLowerCase()).filter(Boolean));

  let st; try { st = JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch { st = { accepted: {}, review: {}, rejected: {} }; }

  const queue = rows
    .filter((c) => !NOT_A_CLINIC.test(c.domain))
    .filter((c) => !knownDomains.has(rootDomain(c.domain)))
    .filter((c) => !st.accepted[c.domain] && !st.review[c.domain] && !st.rejected[c.domain])
    .slice(0, LIMIT);

  const preDropped = rows.length - rows.filter((c) => !NOT_A_CLINIC.test(c.domain)).length;
  const known = rows.filter((c) => !NOT_A_CLINIC.test(c.domain) && knownDomains.has(rootDomain(c.domain))).length;
  console.log(`survivors ${rows.length} | dropped as non-clinic ${preDropped} | already listed ${known} | to verify ${queue.length}`);

  let i = 0;
  for (const c of queue) {
    i++;
    const root = rootDomain(c.domain);
    const base = `https://${c.domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '')}`;
    let html = await get(base);
    await sleep(DELAY_MS);
    if (!html) { st.rejected[c.domain] = 'site unreachable'; }
    else {
      const text = strip(html);
      let email = pickEmail(html, root);
      if (!email) {
        for (const p of ['/contact', '/contactez-nous', '/nous-joindre', '/contact-us']) {
          const h2 = await get(base + p); await sleep(DELAY_MS);
          if (h2) { email = pickEmail(h2, root); if (email) break; }
        }
      }
      const hasIV = IV_TERMS.test(text);
      const isUS = US_MARKER.test(text);
      const inQC = QC_MARKER.test(text) && !isUS;
      const name = titleOf(html) || (c.titles && c.titles[0]) || null;
      const rec = { domain: c.domain, site: base, name, email, hasIV, inQC, queries: c.queries };
      if (hasIV && inQC && email && !knownEmails.has(email)) {
        st.accepted[c.domain] = rec;
        console.log(`  [${i}/${queue.length}] ACCEPT ${root} | ${name} | ${email}`);
      } else {
        const why = !hasIV ? 'no unambiguous IV therapy term on the page' : isUS ? 'asserts a US location' : !QC_MARKER.test(text) ? 'no Quebec location marker' : !email ? 'no address on its own domain' : 'address already in use';
        st.review[c.domain] = { ...rec, why };
        console.log(`  [${i}/${queue.length}] review ${root}: ${why}`);
      }
    }
    fs.writeFileSync(STATE, JSON.stringify(st, null, 2), 'utf8');
  }

  fs.writeFileSync(OUT, JSON.stringify(Object.values(st.accepted), null, 2), 'utf8');
  console.log(`\naccepted ${Object.keys(st.accepted).length} | review ${Object.keys(st.review).length} | rejected ${Object.keys(st.rejected).length}`);
  console.log(`curated list: ${OUT}`);
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
