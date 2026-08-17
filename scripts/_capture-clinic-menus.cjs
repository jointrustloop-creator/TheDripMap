// Website menu capture (drip-capture pipeline, source_type='clinic_website').
// Claimed clinics first, per operator priority ruling.
//
// For each claimed clinic with a website: fetch the homepage + likely menu
// paths (sequential + AbortController + 600ms polite delay — the phase3
// pattern; concurrent workers die silently on this machine), strip to text,
// and extract drip menu candidates: verbatim line, matched formula, nearby
// price, ingredient keywords in the surrounding text.
//
// OUTPUT IS A STAGING FILE (.audit-tmp/_menu-capture.json), NOT a DB write.
// Every candidate carries source_url + captured_at + verbatim snippet +
// a confidence grade; the loader only loads 'high' rows, and everything
// is reviewable first. Attribution rule: verbatim text only, our formula
// mapping labeled as ours.
require('dotenv').config({ path: '.env.local', override: true });
const fs = require('fs');
const https = require('https');
const http = require('http');
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const PATHS = ['', '/iv-therapy', '/iv-drips', '/services', '/menu', '/pricing', '/iv'];
const DELAY = 600;
const TIMEOUT = 12000;

const FORMULAS = [
  ['myers', ["myers' cocktail", 'myers cocktail', 'myers']],
  ['nad_infusion', ['nad+', 'nad ']],
  ['glutathione_push', ['glutathione']],
  ['high_dose_c', ['high dose vitamin c', 'high-dose vitamin c', 'vitamin c drip', 'mega c', 'ultra c']],
  ['immune', ['immune', 'immunity', 'cold & flu', 'cold and flu', 'flu fighter']],
  ['hangover', ['hangover', 'recovery drip', 'party recovery']],
  ['hydration', ['hydration']],
  ['energy', ['energy drip', 'energy iv', 'b12 drip', 'energizer', 'nrg']],
  ['beauty', ['beauty', 'glow', 'radiance', 'skin bright', 'hair skin', 'biotin drip']],
  ['athletic', ['athletic', 'performance iv', 'sport recovery']],
  ['iron_infusion', ['iron infusion', 'iron iv', 'venofer', 'monoferric']],
  ['weight_loss', ['weight loss', 'fat burn', 'slim', 'lipotropic', 'mic ']],
];
const INGREDIENTS = [
  ['vitamin_c', ['vitamin c', 'ascorbic']], ['b_complex', ['b-complex', 'b complex', 'b vitamins']],
  ['b12', ['b12', 'methylcobalamin', 'cyanocobalamin']], ['biotin', ['biotin']],
  ['magnesium', ['magnesium']], ['calcium', ['calcium']], ['zinc', ['zinc']], ['selenium', ['selenium']],
  ['glutathione', ['glutathione']], ['nad', ['nad+', 'nicotinamide adenine']],
  ['alpha_lipoic_acid', ['lipoic']], ['nac', ['n-acetyl', ' nac ']], ['taurine', ['taurine']],
  ['carnitine', ['carnitine']], ['amino_blend', ['amino acid', 'amino blend']],
  ['mic', ['methionine', 'inositol', 'choline', 'lipotropic']],
  ['iron', ['iron sucrose', 'venofer', 'monoferric', 'ferric']],
  ['normal_saline', ['saline']], ['lactated_ringers', ['lactated ringer', "ringer's"]],
  ['ondansetron', ['ondansetron', 'zofran']], ['ketorolac', ['ketorolac', 'toradol']],
  ['edta', [' edta', 'chelation']], ['ozone', ['ozone']], ['curcumin', ['curcumin']],
];

// Crash visibility: the process died silently (exit 0) at the same clinic on
// two runs. Log ANY escape hatch so the killer is identifiable, and never let
// one bad host end the run.
process.on('uncaughtException', (e) => { console.log('UNCAUGHT:', e && e.message); });
process.on('unhandledRejection', (e) => { console.log('UNHANDLED:', e && (e.message || e)); });

function fetchUrl(url) {
  return new Promise((resolve) => {
    let redirects = 0;
    let settled = false;
    const done = (v) => { if (!settled) { settled = true; resolve(v); } };
    const go = (u) => {
      try {
        const mod = u.startsWith('https') ? https : http;
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), TIMEOUT);
        const req = mod.get(u, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TheDripMapBot/1.0; +https://www.thedripmap.com)' } }, (r) => {
          r.on('error', () => { clearTimeout(t); done({ ok: false, status: 'RESP_ERR' }); });
          if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location && redirects < 3) {
            redirects++; clearTimeout(t); r.resume();
            let next;
            try { next = r.headers.location.startsWith('http') ? r.headers.location : new URL(r.headers.location, u).href; }
            catch { return done({ ok: false, status: 'BAD_REDIRECT' }); }
            return go(next);
          }
          if (r.statusCode !== 200) { clearTimeout(t); r.resume(); return done({ ok: false, status: r.statusCode }); }
          let d = '';
          r.on('data', (c) => { d += c; if (d.length > 900000) { clearTimeout(t); done({ ok: true, html: d, finalUrl: u }); req.destroy(); } });
          r.on('end', () => { clearTimeout(t); done({ ok: true, html: d, finalUrl: u }); });
          r.on('aborted', () => { clearTimeout(t); done({ ok: false, status: 'ABORTED' }); });
        });
        req.on('error', () => { clearTimeout(t); done({ ok: false, status: 'ERR' }); });
      } catch (e) {
        console.log('FETCH_THROW:', u, e && e.message);
        done({ ok: false, status: 'THROW' });
      }
    };
    go(url);
  });
}

function htmlToLines(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/tr)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#\d+;|&[a-z]+;/gi, ' ')
    .split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter((l) => l.length > 2 && l.length < 400);
}

const PRICE_RE = /\$\s?(\d{2,4})(?:\.\d{2})?/;

function extract(lines, sourceUrl, capturedAt) {
  const out = [];
  const seen = new Set();
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]; const low = line.toLowerCase();
    let formula = null, matchLen = 0;
    for (const [id, syns] of FORMULAS) for (const syn of syns) if (low.includes(syn) && syn.length > matchLen) { formula = id; matchLen = syn.length; }
    if (!formula) continue;
    // price on the same line or within the next 2 lines
    let priceRaw = null;
    for (let j = i; j <= Math.min(i + 2, lines.length - 1); j++) {
      const m = lines[j].match(PRICE_RE);
      if (m) { priceRaw = m[0]; break; }
    }
    // ingredients in a window around the line
    const window = lines.slice(Math.max(0, i - 1), Math.min(lines.length, i + 4)).join(' ').toLowerCase();
    const ings = INGREDIENTS.filter(([, syns]) => syns.some((sy) => window.includes(sy))).map(([id]) => id);
    // published name = the line up to the price (verbatim), trimmed
    const name = line.replace(PRICE_RE, '').replace(/[|•·]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
    if (!name || name.length < 3) continue;
    const key = (formula + '|' + name.toLowerCase()).slice(0, 140);
    if (seen.has(key)) continue;
    seen.add(key);
    // confidence: high = price found AND name is short/menu-like; medium = formula match only
    const menuLike = name.length <= 70 && !/\b(learn|read|blog|article|about|why|how|what)\b/i.test(name);
    const confidence = priceRaw && menuLike ? 'high' : menuLike ? 'medium' : 'low';
    out.push({
      published_name: name, formula_id: formula,
      price_raw: priceRaw, price_cad: priceRaw ? Number(priceRaw.replace(/[^\d.]/g, '')) : null,
      ingredients: ings, verbatim_snippet: line.slice(0, 240),
      source_url: sourceUrl, captured_at: capturedAt, confidence,
    });
  }
  return out;
}

// --gta mode (keyword sprint, 2026-08-16): capture Toronto + GTA clinic menus
// regardless of claim status, to unblock the Toronto and NAD price targets
// (both below the n>=3 publish rule). Same verbatim-attribution pipeline; the
// loader still takes only reviewed high-confidence rows.
const GTA_MODE = process.argv.includes('--gta');
const GTA_CITIES = ['Toronto', 'North York', 'Scarborough', 'Etobicoke', 'York', 'East York',
  'Mississauga', 'Brampton', 'Vaughan', 'Markham', 'Richmond Hill', 'Oakville', 'Burlington'];

(async () => {
  const query = GTA_MODE
    ? s.from('providers')
        .select('id,slug,name,city,website').in('city', GTA_CITIES)
        .eq('is_hidden', false).eq('country', 'Canada')
        .not('website', 'is', null)
    : s.from('providers')
        .select('id,slug,name,city,website').eq('is_claimed', true)
        .not('website', 'is', null);
  const { data: claimed, error } = await query;
  if (error) { console.log('ERR', error.message); return; }
  let targets = (claimed || []).filter((p) => /^https?:\/\//i.test(p.website || ''));
  if (GTA_MODE) {
    // Toronto proper first (the blocked target), then the rest of the GTA.
    const core = new Set(['Toronto', 'North York', 'Scarborough', 'Etobicoke', 'York', 'East York']);
    targets.sort((a, b) => (core.has(b.city) ? 1 : 0) - (core.has(a.city) ? 1 : 0));
  }
  // RESUMABLE (hard lesson: Windows+Node dies silently mid-scrape, exit 0):
  // partial JSON is written after EVERY clinic, and a restart skips clinics
  // already captured.
  fs.mkdirSync('.audit-tmp', { recursive: true });
  const OUT = '.audit-tmp/_menu-capture.json';
  let results = [];
  try { results = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch { /* fresh run */ }
  const done = new Set(results.map((r) => r.slug));
  targets = targets.filter((p) => !done.has(p.slug));
  console.log(`claimed clinics with websites: ${targets.length + done.size} (${done.size} already captured, ${targets.length} to go)`);
  const capturedAt = new Date().toISOString().slice(0, 10);
  for (const p of targets) {
    const base = p.website.replace(/\/+$/, '');
    let clinicRows = []; let fetched = 0; let failed = 0;
    for (const pathPart of PATHS) {
      const url = base + pathPart;
      const r = await fetchUrl(url);
      await new Promise((res) => setTimeout(res, DELAY));
      if (!r.ok) { failed++; continue; }
      fetched++;
      clinicRows = clinicRows.concat(extract(htmlToLines(r.html), r.finalUrl || url, capturedAt));
      if (clinicRows.filter((x) => x.confidence === 'high').length >= 6) break; // enough signal
    }
    // dedupe by formula+name across pages
    const seen = new Set(); const rows = [];
    for (const row of clinicRows) { const k = row.formula_id + '|' + row.published_name.toLowerCase(); if (!seen.has(k)) { seen.add(k); rows.push(row); } }
    results.push({ provider_id: p.id, slug: p.slug, name: p.name, city: p.city, website: p.website, pages_fetched: fetched, pages_failed: failed, drips: rows });
    // write partial after EVERY clinic so a silent death is resumable
    fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
    console.log(`${p.slug}: pages ${fetched} ok/${failed} fail -> ${rows.length} candidates (${rows.filter((x) => x.confidence === 'high').length} high)`);
  }
  const totals = results.reduce((a, r) => { a.d += r.drips.length; a.h += r.drips.filter((x) => x.confidence === 'high').length; return a; }, { d: 0, h: 0 });
  console.log(`\nStaged ${totals.d} candidates (${totals.h} high-confidence) across ${results.length} clinics -> .audit-tmp/_menu-capture.json`);
})();
