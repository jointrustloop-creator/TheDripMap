/**
 * Fill providers.price_range for clinics that publish IV prices on their own
 * site but have the field blank. That blank is why 592 Canadian clinics fail
 * transparency check 5 (pricing) despite the price being public.
 *
 * This is the same lever as the photo mirror: the information is already out
 * there, on the clinic's own pages, verbatim. We are not asserting a price, we
 * are surfacing what the clinic itself published, and we record the source URL
 * so any figure is traceable back to the page it came from.
 *
 * It REUSES the Price Index extraction (scripts/price-index/treatments.cjs):
 * the same $-regex, the same treatment matchers, the same exclusions (botox,
 * fillers, per-unit, memberships, consults) and the same 60..1500 sanity
 * bounds. That logic is battle-tested; re-implementing it would just be a place
 * for a new bug.
 *
 * WHAT IT WRITES: price_range = "$<low>-<high>" from the IV drip prices found
 * on the clinic's menu, and decision_drivers.price_source with the URL and date
 * so the figure is auditable. It ONLY writes when at least MIN_HITS distinct
 * drip prices are found, so a single stray number never becomes a range. It
 * NEVER overwrites a price_range a human already set.
 *
 * SEQUENTIAL, AbortSignal timeout, polite delay, state after every clinic.
 * (Windows + Node v24 kills concurrent HTTPS workers silently — CLAUDE.md.)
 *
 * Run: node scripts/_fill-price-range.cjs [--limit N] [--apply]
 *      (dry run by default; --apply writes price_range + recomputes the score)
 */
require('dotenv').config({ path: '.env.local', override: true });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const T = require('./price-index/treatments.cjs');

const STATE = path.join('.audit-tmp', '_price-range-state.json');
const APPLY = process.argv.includes('--apply');
const li = process.argv.indexOf('--limit');
const LIMIT = li > -1 ? Number(process.argv[li + 1]) : Infinity;
const DELAY_MS = 650;
const TIMEOUT_MS = 9000;
const MIN_HITS = 2;          // need >=2 distinct drip prices to publish a range
const PATHS = ['', '/iv-therapy', '/iv-drips', '/services', '/pricing', '/menu', '/treatments', '/iv-menu'];

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Standing instruction (memory: upper-room-do-not-contact): do NOT act on Upper
// Room Clinic's published IV menu. Reading their prices into price_range is
// acting on that menu, so these slugs are excluded outright. The first full run
// filled them before this guard existed; both were reverted 2026-08-25.
const DO_NOT_TOUCH = new Set(['upper-room-clinic-toronto', 'upper-room-clinic-oakville']);

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&amp;|&rarr;|&ndash;|&mdash;/g, ' ')
    .replace(/\s+/g, ' ');
}

async function getHtml(url) {
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TheDripMap-research/1.0; +https://www.thedripmap.com)' },
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!r.ok) return null;
    if (!/html/.test(r.headers.get('content-type') || '')) return null;
    return await r.text();
  } catch { return null; }
}

function normTreatment(ctx) {
  for (const [re, name] of T.MATCHERS) if (re.test(ctx)) return name;
  return null;
}

// Same extraction as the Price Index scraper: a price only counts if it sits in
// the context of a real IV treatment and clears the exclusions and bounds.
function extractPrices(text) {
  const found = [];
  let m;
  T.PRICE.lastIndex = 0;
  while ((m = T.PRICE.exec(text)) && found.length < 60) {
    const val = Number(m[0].replace(/[^\d.]/g, ''));
    if (!Number.isFinite(val) || val < T.PRICE_MIN || val > T.PRICE_MAX) continue;
    const ctx = text.slice(Math.max(0, m.index - T.CTX_BEFORE), m.index + T.CTX_AFTER);
    if (T.EXCLUDE.test(ctx)) continue;
    if (!normTreatment(ctx)) continue; // must be attributable to an IV treatment
    found.push(val);
  }
  return found;
}

function loadState() { try { return JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch { return { done: {}, none: {} }; } }
function saveState(st) { fs.mkdirSync(path.dirname(STATE), { recursive: true }); fs.writeFileSync(STATE, JSON.stringify(st, null, 2), 'utf8'); }

let computeTransparencyScore = null;

(async () => {
  // Load the scorer via tsx-compiled require is not available in a .cjs, so we
  // recompute by re-reading the row through the same SQL the app uses. Simpler:
  // shell out to the TS recompute for the touched ids at the end. Here we just
  // set price_range; a follow-up recompute pass updates the stored score.

  let all = [], f = 0;
  for (;;) {
    const { data, error } = await s
      .from('providers')
      .select('id,slug,name,city,country,is_hidden,website,price_range,transparency_checks,decision_drivers')
      .range(f, f + 999);
    if (error) { console.error('READ FAIL', error.message); process.exit(1); }
    if (!data || !data.length) break;
    all = all.concat(data);
    if (data.length < 1000) break;
    f += 1000;
  }

  // Target: Canadian, active, has a website, no price_range, and the pricing
  // check is currently failing (so this will actually move the score).
  const targets = all.filter((p) => {
    if (DO_NOT_TOUCH.has(p.slug)) return false;
    if (p.is_hidden || p.country !== 'Canada' || !p.website) return false;
    if (p.price_range && String(p.price_range).trim()) return false;
    const failsPricing = (p.transparency_checks || []).some((c) => c.key === 'pricing' && !c.passed);
    return failsPricing;
  });

  const st = loadState();
  const pending = targets.filter((p) => !st.done[p.slug] && !st.none[p.slug]).slice(0, LIMIT);

  console.log(`CA clinics failing pricing with a website: ${targets.length}`);
  console.log(`already processed: ${targets.length - targets.filter((p) => !st.done[p.slug] && !st.none[p.slug]).length}`);
  console.log(`this run: ${pending.length}${APPLY ? '' : '  (dry run)'}\n`);

  let filled = 0, none = 0, i = 0;
  const touchedIds = [];
  for (const p of pending) {
    i++;
    let origin;
    try { origin = new URL(p.website).origin; } catch { st.none[p.slug] = 'bad url'; none++; saveState(st); continue; }

    const prices = [];
    let sourceUrl = null;
    for (const suffix of PATHS) {
      const html = await getHtml(origin + suffix);
      await sleep(DELAY_MS);
      if (!html) continue;
      const hits = extractPrices(stripTags(html));
      if (hits.length) { prices.push(...hits); if (!sourceUrl) sourceUrl = origin + suffix; }
      if (prices.length >= 6) break; // enough signal, stop crawling
    }

    const distinct = [...new Set(prices)].sort((a, b) => a - b);
    if (distinct.length < MIN_HITS) {
      st.none[p.slug] = `only ${distinct.length} price(s) found`;
      none++;
      console.log(`  [${i}/${pending.length}] none  ${p.slug} (${distinct.length})`);
      saveState(st);
      continue;
    }

    const low = distinct[0];
    const high = distinct[distinct.length - 1];
    const range = `$${low}-${high}`;

    if (APPLY) {
      const dd = (p.decision_drivers && typeof p.decision_drivers === 'object') ? p.decision_drivers : {};
      const { error, count } = await s
        .from('providers')
        .update({
          price_range: range,
          decision_drivers: { ...dd, price_source: { found_at: new Date().toISOString().slice(0, 10), url: sourceUrl, count: distinct.length } },
        }, { count: 'exact' })
        .eq('id', p.id);
      if (error || count !== 1) { console.log(`  [${i}/${pending.length}] DB FAIL ${p.slug}`); saveState(st); continue; }
      touchedIds.push(p.id);
    }

    st.done[p.slug] = { range, count: distinct.length, at: new Date().toISOString() };
    filled++;
    console.log(`  [${i}/${pending.length}] ${APPLY ? 'SET ' : 'WOULD SET '}${p.slug} -> ${range}  (${distinct.length} prices, ${sourceUrl})`);
    saveState(st);
  }

  console.log(`\n${APPLY ? 'filled' : 'would fill'}: ${filled} | no usable price: ${none}`);
  if (APPLY && touchedIds.length) {
    fs.writeFileSync('.audit-tmp/_price-range-touched-ids.json', JSON.stringify(touchedIds, null, 2));
    console.log(`\n${touchedIds.length} rows updated. Now recompute stored scores:`);
    console.log('  npx tsx scripts/_transparency-recompute.ts --ca');
  }
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
