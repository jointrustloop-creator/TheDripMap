// City price scraper. Reads the clinic list for a city from Supabase (Hard Rule:
// clinic data always comes from the DB), fetches each clinic's public menu, and
// pairs published $prices to treatments. Windows + Node v24 safe: SEQUENTIAL
// fetch, AbortSignal timeout, 600ms polite delay, partial JSON written after
// every clinic so a silent worker death is resumable (skip already-done ids).
const fs = require('fs');
const T = require('./treatments.cjs');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TheDripMap-research/1.0)' },
      redirect: 'follow',
      signal: AbortSignal.timeout(9000),
    });
    if (!r.ok) return null;
    if (!/html/.test(r.headers.get('content-type') || '')) return null;
    return await r.text();
  } catch {
    return null;
  }
}

function normTreatment(ctx) {
  for (const [re, name] of T.MATCHERS) if (re.test(ctx)) return name;
  return null;
}

// Pull every in-context price, attribute it to a treatment, keep one (the min)
// per treatment for this clinic. Returns [{ treatment, price }].
function extractFromText(t) {
  const found = [];
  let m;
  T.PRICE.lastIndex = 0;
  while ((m = T.PRICE.exec(t)) && found.length < 40) {
    const val = Number(m[0].replace(/[^\d.]/g, ''));
    if (!Number.isFinite(val) || val < T.PRICE_MIN || val > T.PRICE_MAX) continue;
    const ctx = t.slice(Math.max(0, m.index - T.CTX_BEFORE), m.index + T.CTX_AFTER);
    if (T.EXCLUDE.test(ctx)) continue;
    const treatment = normTreatment(ctx);
    if (!treatment) continue;
    found.push({ treatment, price: val });
  }
  return found;
}

function discoverLinks(html, origin) {
  const set = new Set();
  let m;
  T.LINK.lastIndex = 0;
  while ((m = T.LINK.exec(html))) {
    const href = m[1];
    if (!T.LINKHINT.test(href)) continue;
    try {
      const u = new URL(href, origin);
      if (u.origin === origin) set.add(u.origin + u.pathname);
    } catch {}
    if (set.size >= 6) break;
  }
  return [...set];
}

// Resolve the clinic list for a city from Supabase. citySlug 'new-york' matches
// city 'New York' (ILIKE, dashes -> spaces, exact case-insensitive). Returns
// { providers, cityName, currency } where currency is derived from country.
async function loadCityProviders(supabase, citySlug) {
  const cityMatch = citySlug.replace(/-/g, ' ');
  let all = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('providers')
      .select('id,name,slug,website,city,country,is_claimed,is_featured')
      .neq('is_hidden', true)
      .not('website', 'is', null)
      .ilike('city', cityMatch)
      .range(from, from + 999);
    if (error) throw new Error(`Supabase: ${error.message}`);
    all = all.concat(data || []);
    if (!data || data.length < 1000) break;
    from += 1000;
  }
  const cityName = all[0]?.city || citySlug.replace(/(^|\s|-)\w/g, (c) => c.toUpperCase());
  const currency = (all[0]?.country || '').toLowerCase() === 'canada' ? 'CAD' : 'USD';
  return { providers: all, cityName, currency };
}

// Scrape a city end to end. Resumable: pass the same outPath to continue.
// Returns { byProvider, cityName, currency }.
async function scrapeCity({ supabase, citySlug, outPath, limit = Infinity, log = console.log }) {
  const { providers, cityName, currency } = await loadCityProviders(supabase, citySlug);
  log(`${cityName}: ${providers.length} clinics with a website`);

  let done = {};
  try {
    done = JSON.parse(fs.readFileSync(outPath, 'utf8')).byProvider || {};
  } catch {}

  let processed = 0;
  for (const p of providers) {
    if (processed >= limit) break;
    if (done[p.id]) continue;
    processed++;

    let site = String(p.website || '').trim();
    if (!/^https?:\/\//i.test(site)) site = 'https://' + site;
    let origin, domain = '';
    try {
      const u = new URL(site);
      origin = u.origin;
      // registrable host drives chain detection in aggregate() (same domain in
      // the same city = one chain, counted once, so it can't skew the index).
      domain = u.hostname.replace(/^www\./, '').toLowerCase();
    } catch {
      done[p.id] = { name: p.name, city: p.city, domain: '', claimed: !!(p.is_claimed || p.is_featured), prices: [] };
      continue;
    }

    const home = await getHtml(origin);
    await sleep(600);
    const links = home ? discoverLinks(home, origin) : [];
    const pages = [...new Set([origin, ...links, ...T.GUESS.map((g) => origin + g)])].slice(0, 8);

    const pairs = [];
    for (const url of pages) {
      const html = url === origin && home ? home : await getHtml(url);
      if (url !== origin || !home) await sleep(600);
      if (!html) continue;
      for (const h of extractFromText(stripTags(html))) pairs.push(h);
      if (pairs.length >= 25) break;
    }

    // one representative (min) price per treatment for this clinic
    const byTreat = {};
    for (const h of pairs) if (!byTreat[h.treatment] || h.price < byTreat[h.treatment]) byTreat[h.treatment] = h.price;
    const prices = Object.entries(byTreat).map(([treatment, price]) => ({ treatment, price }));

    done[p.id] = { name: p.name, city: p.city, domain, claimed: !!(p.is_claimed || p.is_featured), prices };
    log(`${prices.length ? '+' : '-'} ${p.name} -> ${prices.map((x) => `${x.treatment} $${x.price}`).join(', ') || 'none'}`);
    fs.writeFileSync(outPath, JSON.stringify({ cityName, currency, byProvider: done }, null, 2));
  }

  return { byProvider: done, cityName, currency };
}

module.exports = { scrapeCity, loadCityProviders, extractFromText, discoverLinks, stripTags };
