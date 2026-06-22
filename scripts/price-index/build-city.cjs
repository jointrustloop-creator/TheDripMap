#!/usr/bin/env node
// Build (or refresh) a city's IV Price Index in one command.
//
//   node scripts/price-index/build-city.cjs <city-slug> [flags]
//
// Flags:
//   --from-cache        skip scraping, re-aggregate the existing raw JSON
//   --limit N           scrape at most N new clinics (testing / resuming)
//   --as-of "June 2026" snapshot label (default: current month + year)
//   --currency CAD|USD  override currency (default: from DB country, or cache)
//   --write             splice the dataset block into price-index-data.ts
//                       (new cities only; never overwrites an existing slug)
//
// Outputs (under .audit-tmp/price-index/):
//   <slug>-raw.json     resumable raw scrape
//   <slug>-review.md    human spot-check doc  <-- READ THIS before shipping
//   <slug>-dataset.ts.txt  the exact block to paste into price-index-data.ts
//
// Default behaviour ships NOTHING. You review the markdown, then either paste
// the block yourself or re-run with --write. This gate is deliberate.
require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { scrapeCity } = require('./scrape.cjs');
const { aggregate } = require('./aggregate.cjs');
const { toDatasetBlock, toReviewMarkdown } = require('./emit.cjs');

const ROOT = 'C:/Users/Dell/Desktop/TheDripMap';
const OUT_DIR = path.join(ROOT, '.audit-tmp/price-index');
const DATA_FILE = path.join(ROOT, 'src/lib/price-index-data.ts');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
function flag(name) {
  return process.argv.includes(name);
}

(async () => {
  const citySlug = (process.argv[2] || '').toLowerCase().trim();
  if (!citySlug || citySlug.startsWith('--')) {
    console.log('Usage: node scripts/price-index/build-city.cjs <city-slug> [--from-cache] [--limit N] [--as-of "Month YYYY"] [--currency CAD|USD] [--write]');
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const now = new Date();
  const asOf = arg('--as-of', `${MONTHS[now.getMonth()]} ${now.getFullYear()}`);
  const limit = Number(arg('--limit', 'Infinity'));
  const rawPath = path.join(OUT_DIR, `${citySlug}-raw.json`);

  let byProvider, cityName, currency;

  if (flag('--from-cache')) {
    if (!fs.existsSync(rawPath)) {
      console.log(`No cache at ${rawPath}. Run without --from-cache first.`);
      process.exit(1);
    }
    const cache = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
    byProvider = cache.byProvider || {};
    cityName = cache.cityName || citySlug.replace(/(^|\s|-)\w/g, (c) => c.toUpperCase());
    currency = arg('--currency', cache.currency);
    if (!currency) {
      console.log('Cache has no currency. Re-run with --currency CAD or --currency USD.');
      process.exit(1);
    }
    console.log(`From cache: ${Object.keys(byProvider).length} clinics, ${cityName} (${currency})`);
  } else {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const res = await scrapeCity({ supabase, citySlug, outPath: rawPath, limit });
    byProvider = res.byProvider;
    cityName = res.cityName;
    currency = arg('--currency', res.currency);
  }

  const agg = aggregate(byProvider);
  agg._byProvider = byProvider; // for the per-clinic section of the review doc

  if (!agg.rows.length) {
    console.log(`\nNothing clears the publish threshold for ${cityName} yet. Scrape more clinics or lower coverage expectations.`);
  }

  const ctx = { citySlug, cityName, currency, asOf, agg };
  const block = toDatasetBlock(ctx);
  const review = toReviewMarkdown(ctx);

  const reviewPath = path.join(OUT_DIR, `${citySlug}-review.md`);
  const blockPath = path.join(OUT_DIR, `${citySlug}-dataset.ts.txt`);
  fs.writeFileSync(reviewPath, review);
  fs.writeFileSync(blockPath, block + '\n');

  console.log(`\n==== ${cityName} IV Price Index (${asOf}, ${currency}) ====`);
  console.log(`clinics: scraped ${agg.clinicsScraped} | priced ${agg.clinicsWithAnyPrice} | published ${agg.clinicCount}`);
  for (const r of agg.rows) {
    console.log(`  ${r.treatment.padEnd(26)} n=${String(r.clinics).padStart(2)}  $${r.low}-$${r.high}  median $${r.median}`);
  }
  console.log(`\nreview : ${reviewPath}`);
  console.log(`block  : ${blockPath}`);

  if (flag('--write')) {
    if (!agg.rows.length) {
      console.log('\n--write skipped: nothing to publish.');
      return;
    }
    const src = fs.readFileSync(DATA_FILE, 'utf8');
    if (new RegExp(`\\n  ${citySlug}: \\{`).test(src)) {
      console.log(`\n--write refused: "${citySlug}" already exists in price-index-data.ts. Remove it first, then re-run.`);
      return;
    }
    const anchor = 'export const PRICE_INDEX: Record<string, CityPriceIndex> = {\n';
    if (!src.includes(anchor)) {
      console.log('\n--write failed: could not find the PRICE_INDEX anchor. Paste the block manually.');
      return;
    }
    const next = src.replace(anchor, anchor + block + '\n');
    fs.writeFileSync(DATA_FILE, next);
    console.log(`\n--write: inserted "${citySlug}" into ${DATA_FILE}. Still add the route to sitemap + redirect, and review the page copy.`);
  } else {
    console.log(`\nNext: read the review, then paste ${citySlug}-dataset.ts.txt into price-index-data.ts (or re-run with --write).`);
  }
})().catch((e) => {
  console.log('FATAL', e.message);
  process.exit(1);
});
