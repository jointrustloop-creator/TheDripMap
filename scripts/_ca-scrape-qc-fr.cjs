/**
 * Discovery refuel — FRENCH-LANGUAGE QUEBEC angle (2026-08-22).
 *
 * Why this angle: Quebec has 22 active CA providers vs Ontario's 325, on a
 * population of ~8.9M. Every prior discovery source tag (ca_scrape_2026_06_21,
 * ca_scrape_2026_07_04, ca_scrape_v2_2026_07_11, and the agent_research_*
 * passes) queried in ENGLISH. Quebec clinics market IV therapy as
 * "vitaminotherapie intraveineuse" / "perfusion de vitamines" / "solute",
 * so English queries structurally could not find them. This run mines that gap.
 *
 * Mechanics are the hard-won phase3 pattern and MUST stay that way:
 * sequential fetch only (Windows + Node v24 silently kills concurrent HTTPS
 * workers), AbortController timeout, ~700ms polite delay, and an incremental
 * write after EVERY query so a mid-run death is resumable.
 *
 * Collect only. Inserts nothing. Sends nothing.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local'), override: true });
const fs = require('fs');
const path = require('path');

const KEY = process.env.FIRECRAWL_API_KEY;
if (!KEY) { console.error('FIRECRAWL_API_KEY missing'); process.exit(1); }

const OUT = path.join(__dirname, '..', '.audit-tmp', '_ca-scrape-qc-fr-candidates.json');
const STATE = path.join(__dirname, '..', '.audit-tmp', '_ca-scrape-qc-fr-state.json');

// French service terms. Deliberately NOT the English terms used in prior runs.
const BIG_TERMS = [
  'clinique vitaminotherapie intraveineuse',
  'perfusion de vitamines clinique',
  'therapie IV clinique',
  'clinique NAD+ intraveineux',
  'cocktail Myers clinique',
  'solute vitamines clinique privee',
];
const SMALL_TERMS = [
  'clinique vitaminotherapie intraveineuse',
  'perfusion de vitamines clinique',
  'therapie IV clinique',
];

const BIG_CITIES = ['Montreal', 'Laval', 'Longueuil', 'Quebec', 'Gatineau', 'Sherbrooke'];
const SMALL_CITIES = [
  'Trois-Rivieres', 'Brossard', 'Terrebonne', 'Levis', 'Saguenay',
  'Repentigny', 'Saint-Jerome', 'Granby', 'Blainville', 'Saint-Hyacinthe',
  'Boucherville', 'Drummondville',
];

const QUERIES = [];
for (const c of BIG_CITIES) for (const t of BIG_TERMS) QUERIES.push(`${t} ${c}`);
for (const c of SMALL_CITIES) for (const t of SMALL_TERMS) QUERIES.push(`${t} ${c}`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function rootDomain(u) {
  try {
    const h = new URL(u).hostname.toLowerCase().replace(/^www\./, '');
    const parts = h.split('.');
    // handle .qc.ca / .co.uk style
    if (parts.length > 2 && /^(co|com|qc|on|bc|ab|gov|org|net)$/.test(parts[parts.length - 2])) {
      return parts.slice(-3).join('.');
    }
    return parts.slice(-2).join('.');
  } catch { return null; }
}

async function search(q) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 45000);
  try {
    const r = await fetch('https://api.firecrawl.dev/v2/search', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q, limit: 10, location: 'Canada' }),
      signal: ac.signal,
    });
    if (!r.ok) return { ok: false, err: 'HTTP ' + r.status };
    const j = await r.json();
    const web = (j && j.data && (j.data.web || j.data)) || [];
    return { ok: true, results: Array.isArray(web) ? web : [] };
  } catch (e) {
    return { ok: false, err: e.name === 'AbortError' ? 'timeout' : e.message };
  } finally { clearTimeout(timer); }
}

(async () => {
  let cands = {};
  let done = [];
  if (fs.existsSync(OUT)) cands = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  if (fs.existsSync(STATE)) done = JSON.parse(fs.readFileSync(STATE, 'utf8'));
  const doneSet = new Set(done);

  console.log(`${QUERIES.length} queries total, ${doneSet.size} already done`);

  let i = 0;
  for (const q of QUERIES) {
    i++;
    if (doneSet.has(q)) continue;
    const res = await search(q);
    if (!res.ok) {
      console.log(`[${i}/${QUERIES.length}] FAIL ${q} :: ${res.err}`);
      await sleep(2000);
      continue;
    }
    let fresh = 0;
    for (const r of res.results) {
      const d = rootDomain(r.url);
      if (!d) continue;
      if (!cands[d]) {
        cands[d] = { domain: d, urls: [], titles: [], descs: [], queries: [] };
        fresh++;
      }
      const c = cands[d];
      if (c.urls.length < 5 && !c.urls.includes(r.url)) c.urls.push(r.url);
      if (r.title && !c.titles.includes(r.title) && c.titles.length < 5) c.titles.push(r.title);
      if (r.description && c.descs.length < 3) c.descs.push(r.description);
      if (!c.queries.includes(q)) c.queries.push(q);
    }
    doneSet.add(q);
    // incremental write after EVERY query — a mid-run death must be resumable
    fs.writeFileSync(OUT, JSON.stringify(cands, null, 2));
    fs.writeFileSync(STATE, JSON.stringify([...doneSet], null, 2));
    console.log(`[${i}/${QUERIES.length}] ${q} -> ${res.results.length} results, ${fresh} new domains (total ${Object.keys(cands).length})`);
    await sleep(700);
  }

  console.log(`\nDONE. ${Object.keys(cands).length} unique domains collected -> ${OUT}`);
})();
