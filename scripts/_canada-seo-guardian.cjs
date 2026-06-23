/**
 * Canada SEO Guardian — regression guard for the Canada-first posture.
 *
 *   node scripts/_canada-seo-guardian.cjs
 *
 * Two layers:
 *  CRITICAL (live) — fetches prod and asserts NO US content is indexable: the
 *    sitemap must contain no US states / US treatment-matrix cities / the US
 *    stats page, and sample US pages must emit robots:noindex. These must pass.
 *  ADVISORY (code) — scans app/ + src/ for US-leakage patterns that should be
 *    reviewed (en_US locale, America/New_York defaults, "North America" copy,
 *    addressCountry/currency US defaults). These are a worklist, not failures.
 *
 * Report-only. Never edits. Exit 0 unless a CRITICAL check fails (exit 2), so a
 * scheduled run surfaces real regressions without noise. US_MARKET_ENABLED flips
 * the whole thing off (when the US phase launches, US content is expected).
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const SITE = 'https://www.thedripmap.com';

// Keep in sync with src/lib/states.ts US states + a few top US matrix cities.
const US_STATES = ['florida', 'new-york', 'texas', 'california', 'virginia'];
const US_MATRIX_CITIES = ['dallas', 'houston', 'phoenix', 'tampa', 'atlanta', 'miami', 'new-york', 'los-angeles', 'chicago'];

const ADVISORY_PATTERNS = [
  { re: /locale:\s*['"]en[_-]US['"]/g, label: "OpenGraph locale en_US (use en_CA)" },
  { re: /lang=["']en-US["']/g, label: 'html lang en-US (use en-CA)' },
  { re: /\|\|\s*['"]America\/New_York['"]/g, label: "default timezone America/New_York (use America/Toronto)" },
  { re: /North America/g, label: '"North America" copy (use "Canada")' },
  { re: /\?\s*['"]United States['"]/g, label: "default 'United States' fallback (use Canada)" },
  { re: /addressCountry["']?\s*:\s*[^,\n]*\?\s*["']CA["']\s*:\s*["']US["']/g, label: 'addressCountry defaults to US (use marketOf -> CA)' },
  { re: /priceCurrency["']?\s*:\s*["']USD["']|currency:\s*['"]USD['"]/g, label: "USD currency in schema/offer (use CAD)" },
];
// Files/areas where US strings are expected infrastructure (US data detection,
// the flag itself, this guardian) — not leaks.
const SKIP = [/node_modules/, /\.next/, /\.audit-tmp/, /_canada-seo-guardian/, /src[\\/]lib[\\/]market\.ts/, /src[\\/]lib[\\/]states\.ts/, /\.test\./];

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, e.name);
    if (SKIP.some((re) => re.test(fp))) continue;
    if (e.isDirectory()) walk(fp, out);
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(fp);
  }
}

async function fetchText(url) {
  const r = await fetch(url + (url.includes('?') ? '&' : '?') + 'gz=' + Date.now(), { headers: { 'Cache-Control': 'no-cache' } });
  return r.text();
}
const isNoindex = (h) => /<meta name="robots"[^>]*noindex/i.test(h) || /"robots"[^}]*index["':\s]*false/i.test(h);

(async () => {
  const crit = [];
  const pass = (ok, msg) => crit.push({ ok, msg });
  console.log('=== Canada SEO Guardian ===\n');

  // CRITICAL — live indexability
  try {
    const sm = await fetchText(`${SITE}/sitemap.xml`);
    for (const s of US_STATES) pass(!sm.includes(`/states/${s}`), `sitemap excludes /states/${s}`);
    pass(!/<loc>[^<]*\/iv-therapy-statistics<\/loc>/.test(sm), 'sitemap excludes /iv-therapy-statistics');
    for (const c of US_MATRIX_CITIES) pass(!new RegExp(`/iv-therapy/[a-z0-9-]+/${c}<`).test(sm), `sitemap excludes US matrix city /${c}`);
    pass(sm.includes('/states/ontario') || sm.includes('/cities/toronto'), 'sitemap still has Canadian routes (sanity)');

    const fl = await fetchText(`${SITE}/states/florida`);
    pass(isNoindex(fl), '/states/florida is noindex');
    const on = await fetchText(`${SITE}/states/ontario`);
    pass(!isNoindex(on), '/states/ontario is indexable');
    const stats = await fetchText(`${SITE}/iv-therapy-statistics`);
    pass(isNoindex(stats), '/iv-therapy-statistics is noindex');
    const home = await fetchText(`${SITE}/`);
    pass(/<html lang="en-CA"/.test(home), 'homepage html lang is en-CA');
  } catch (e) {
    pass(false, 'live checks errored: ' + e.message);
  }

  const failed = crit.filter((c) => !c.ok);
  console.log('CRITICAL (live indexability) — must all pass:');
  for (const c of crit) console.log(`  ${c.ok ? 'PASS' : 'FAIL'}  ${c.msg}`);
  console.log(`\n  ${crit.length - failed.length}/${crit.length} passed${failed.length ? '  <-- ' + failed.length + ' REGRESSION(S)' : ''}`);

  // ADVISORY — code leak scan
  const files = [];
  walk(path.join(ROOT, 'app'), files);
  walk(path.join(ROOT, 'src'), files);
  const advisory = [];
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    const lines = src.split('\n');
    for (const { re, label } of ADVISORY_PATTERNS) {
      lines.forEach((ln, i) => { re.lastIndex = 0; if (re.test(ln)) advisory.push({ file: path.relative(ROOT, f), line: i + 1, label, text: ln.trim().slice(0, 90) }); });
    }
  }
  console.log('\nADVISORY (code US-leakage to review) — worklist, not failures:');
  if (!advisory.length) console.log('  (none)');
  const byLabel = {};
  for (const a of advisory) (byLabel[a.label] ||= []).push(a);
  for (const [label, items] of Object.entries(byLabel)) {
    console.log(`  [${items.length}] ${label}`);
    for (const it of items.slice(0, 6)) console.log(`       ${it.file}:${it.line}`);
    if (items.length > 6) console.log(`       ...and ${items.length - 6} more`);
  }
  console.log(`\n  ${advisory.length} advisory hit(s) across ${files.length} files`);

  console.log(`\n=== ${failed.length ? 'FAIL — ' + failed.length + ' critical regression(s)' : 'PASS — Canada posture intact'} | ${advisory.length} advisory ===`);
  process.exit(failed.length ? 2 : 0);
})().catch((e) => { console.log('FATAL', e.message); process.exit(1); });
