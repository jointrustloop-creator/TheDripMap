# TheDripMap SEO Program Log

Living record of the SEO program. Pick this up cold: read **Strategy**, then
**Roadmap** for what's next. **Shipped** is the dated history with commit SHAs.

_Last updated: 2026-06-23._

---

## Strategy (the north star)

1. **1000% Canada.** The US market is intentionally OFF behind a single flag,
   `US_MARKET_ENABLED` in `src/lib/market.ts` (default `false`). While off, all US
   city/provider/state/statistics/matrix pages are `robots:noindex` and excluded
   from the sitemap. Flip the flag to `true` to re-enable the US with no other
   code change. GSC "unexpected noindex" on US pages is BY DESIGN.
2. **Data-backed content, NOT mass AI prose.** Google's 2024-25 scaled-content
   updates penalize thin/templated pages, and we already got burned (templated
   city pages → "undefined" bugs + 0.85-similarity duplicates). The defensible,
   citable, AI-engine-friendly asset is the **IV Price Index** (unique data).
   Scale that format, not prose.
3. **The city hub is the canonical commercial page** for "iv therapy {city}".
   Blogs support it (inform + link up), they don't compete.
4. **Growth = the claims → verified-prices flywheel.** Outreach gets clinics to
   claim; claiming adds verified prices; prices push more cities over the Price
   Index publish gate. Outreach and SEO are the same engine.

---

## Key levers & where things live

| Lever | File / location |
|---|---|
| US market on/off | `src/lib/market.ts` → `US_MARKET_ENABLED`, `marketOf`, `isNoindexedUSPage`, `usMarketRobots` |
| IV Price Index data | `src/lib/price-index-data.ts` (live: Toronto, Edmonton, Calgary) |
| Add a price-index city | `node scripts/price-index/build-city.cjs <slug>` → review `.audit-tmp/price-index/<slug>-review.md` → `--write`. For an old cache, `node scripts/price-index/_patch-domains.cjs <slug>` first, then `build-city.cjs <slug> --from-cache`. |
| Price Index hub | `app/iv-prices/page.tsx` (national) + `app/iv-prices/[city]/page.tsx` |
| Blog → hub canonicals | `src/lib/data.ts` → `BLOG_CANONICAL_OVERRIDES` |
| US-hidden blogs | `src/lib/data.ts` → `US_MARKET_BLOG_SLUGS` |
| Sitemap | `app/sitemap.ts` |
| Canada SEO Guardian | `scripts/_canada-seo-guardian.cjs` + weekly task `canada-seo-guardian` |

---

## Automation

**Canada SEO Guardian** — `node scripts/_canada-seo-guardian.cjs`
- CRITICAL (live): asserts no US states / US matrix cities / US stats page in the
  prod sitemap; US pages `noindex`; homepage `lang=en-CA`. Exits 2 on regression.
- ADVISORY: scans `app/`+`src/` for US-leakage patterns (copy, locale, currency).
- Wired to weekly scheduled task **`canada-seo-guardian`** (Mon 6am). **Run it
  after adding any new public route.** As of 2026-06-23: 20/20 critical PASS.

---

## Shipped (2026-06-23 — all deployed to main + production-verified)

| Commit | What |
|---|---|
| `93db12c` | **Cannibalization (canonical):** 8 commercial "best clinics in {city}" blog roundups now canonical to their `/cities/{city}` hub + dropped from sitemap (via `BLOG_CANONICAL_OVERRIDES`). Deep informational "complete guide" posts kept self-canonical. |
| `072257f` | Removed the `/iv-prices` → `/iv-prices/toronto` 307 redirect that shadowed the new hub. |
| `22ea932` | **`/iv-prices` national hub** built — answer-first overview (standard drip median CA$175 / 31 clinics / 3 cities), city index table, CollectionPage+FAQ schema, in sitemap + footer link. De-orphans the moat. |
| `75a34b0` | Brand copy "North America's" → "Canada's" in outreach/email; **added the Canada SEO Guardian**. |
| `5df0532` | **Canada hardening:** US `/states/*`, `/iv-therapy-statistics`, and the US treatment×city matrix → noindex + de-sitemapped; provider `addressCountry` via `marketOf` (CA, not defaulted US); geo signals `lang=en-CA`, OG `en_CA`, Org `areaServed: Canada`; `America/Toronto` + Canada-map defaults. |
| `0c02fb8` | **Calgary** added to the Price Index (3rd city) + **chain-dedup fix** (task #62): chain locations collapse to one before the n≥3 gate. |
| `e7fbbd0` | **Cannibalization (up-links):** city-specific blog posts render a "See all IV therapy clinics in {City}" link up to the CA city hub. |
| `21044fe` | **IV Price Index module on `/cities/{city}`** pages (answer-first median + link to the full index). |
| `5409dee`, `b5c8a94` | Hours parser fixes (" to "/en-dash separators; free-text "By appointment" → "Hours not listed" not "Open now"). |

---

## Roadmap (prioritized — what to do next)

1. **E-E-A-T rewrite of `/about`** (P1, YMYL, UNBLOCKED) — it currently says
   "United States", names no team / medical reviewer / methodology, and has no
   Person/Org schema. This caps every health-page ranking. Rewrite Canada-first
   with a named editorial team + medical reviewer bio + editorial-standards page
   + schema. Backfill `reviewedBy` on health-claim blog posts.
2. **`getSiteStats` Canada filter** (P1) — `src/lib/data.ts` `getSiteStats` counts
   US states/cities, which feeds `/about` + `/iv-therapy-statistics`. Filter to
   Canadian providers so "states" → provinces and top-lists are Canadian.
3. **Finish the moat hub-and-spoke** (P1) — add a "{treatment} prices by city"
   block on treatment hubs (`app/treatments/[service]`) pulling `price-index-data.ts`,
   and an in-content link from `/guide/iv-therapy-cost-guide` → `/iv-prices`.
4. **Expand the Price Index** (the flywheel) — more CA cities, yield-gated
   (~1-in-4 cities publish; many clinics don't post prices). Better lever: wire
   owner-verified prices from the claim flow into the index (task #50).
5. **Guides cluster** (P2) — `src/lib/guides.ts` `relatedCities` point at noindexed
   US cities; swap to Canadian cities + link the price index.
6. **Slim the Toronto city page** (operator nod) — ~8,800 words / ~545 links is
   over-optimized; cut the duplicate use-case re-lists + cap internal links.
7. **Operator / infra** — add `GSC_SERVICE_ACCOUNT_KEY` to Vercel for real rank
   data (vs estimates); review the get-found-kit USD price (pricing-policy).

---

## Measurement

- **GSC baseline (pre-work):** Canada 111 clicks / 8,989 impr / **1.23% CTR**;
  US (noindexed) 77 / 47,727 / 0.16%. /cities/toronto pos ~48, /cities/calgary
  pos ~56 with high impressions = the opportunity these fixes target.
- **Timeline:** canonical + indexability changes take **2-4 weeks** to show in
  Search Console. Re-check Toronto/Calgary/Vancouver hub positions ~mid-July 2026.
- Related deep notes: see the agent memory files (`project_seo_canada_priority`,
  `project_us_noindex`, `project_iv_price_index`, `project_city_pages_seo`).
