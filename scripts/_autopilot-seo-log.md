
## 2026-07-05 (Lane A run 1, post structural merge)
- Layer 2, Tier 1 intent #1 (cost): rewrote guide/iv-therapy-cost-guide from
  generic USD content to Canada-first answer-first with REAL Price Index data
  (Toronto CA$119-399 med CA$175 n=9; Calgary med CA$200 n=3; Edmonton med
  CA$150 n=7; per-treatment rows). Information Gain: aggregated city ranges,
  n>=3 methodology stated, verified-menu sourcing. 6 FAQs in searched language
  incl. OHIP/extended-benefits (Canadian insurance angle). relatedCities now
  CA-only. Compliance scans passed (no prohibited claims, no dashes, no
  "directory"). metaTitle 53ch, metaDesc 155ch, dateModified 2026-07-05.

## 2026-07-06/07 (GSC export audit + fix-all run, operator goal)
- Audited operator-supplied GSC exports (Performance 3mo, Coverage, 3 drill
  downs) saved under SEARCH CONSOLE/. Verdict: zero technical fires. Apex
  308s, /provider/ -> /providers/ 308s, sitemap clean (913 URLs), June-12
  indexed-count drop = US noindex strategy, 404/redirect piles all decode
  to removed or legacy URLs.
- FIX iron cluster (perf: oakville iron 459 imp pos 22 zero clicks): matrix
  row had content: null so every /iv-therapy/iron-infusion/{city} rendered
  no education. Rewrote the Iron Infusion entry Canada-first (CAD $250-800,
  prescriber/requisition reality, extended-health framing, 6 FAQs) and wired
  the matrix. NOTE: treatment-content.ts already had an Iron entry mid-file;
  duplicate-key trap caught by scan. Em dashes stripped from the entry (other
  legacy entries still carry them - future sweep).
- FIX /treatments/nad-plus metadata title 'NAD+ Plus IV Therapy' -> 'NAD+ IV
  Therapy' via titleName override (menu name unchanged). 1,181 impressions
  consolidating onto this URL from the old alias.
- FIX b1r4 blog up-links: survey showed 14/16 city-topic blogs already link
  their city page; inserted blockquote up-links in the 2 missing
  (myers-cocktail-toronto, iv-therapy-yorkville-toronto). Backup:
  _b1r4-toronto-uplinks-backup.json.
- FIX cities row st-johns: name 'St Johns'/state null -> "St. John's"/NL.
  Page stays sub-gate (2 providers) and noindexed; data now correct.
- Price Index attempted for burlington/saskatoon/bedford (GSC crawled-not-
  indexed CA cities): scrapes ran, NO treatment reached the n>=3 gate
  (Burlington priced 1/16, Saskatoon 3/5, Bedford 3/5 clinics but <3 price
  points per treatment). Gate held, nothing published. Raw cache in
  .audit-tmp/price-index/ for future top-up.
- IndexNow: 13 changed/target URLs submitted (200 OK).
- Deploy 7276959 merged ff-only to main, prod build green, all changes
  live-verified (iron hub full content + FAQ, oakville snippet, NAD+ title,
  both blog up-links).
- NOT done autonomously (destructive, flagged to operator): consolidating or
  redirecting overlapping Toronto blogs Google declines to index.

## 2026-09-08 (nightly SEO mechanic)
- Findings source: seo_health_runs/seo_health_findings tables (87 runs, 1,866
  findings). Latest COMPLETED crawl = run 117 (2026-09-06, 981 URLs, 2 issues).
  Note: runs 119/118/116/115/114 are stuck status='started', finished_at NULL —
  the daily crawl route is dying mid-run on ~5 of the last 8 nights. Parked for
  the operator; it is an infra/timeout matter, not a page fix.
- Verified 13 candidate URLs live (sequential, 600ms, AbortController).
  DROPPED as false positives: all 35 non_200 (blog + provider pages, every one
  returns 200 now), all crawl_timeout ("This operation was aborted"), and the
  treatment x city unexpected_noindex hits (montreal/richmond-hill/victoria all
  render with no robots meta). Matches the known "crawler aborts slow requests"
  pattern.
- REPRODUCED: /cities/new-westminster is IN sitemap.xml yet serves
  <meta name="robots" content="noindex, follow">. That is a Search Console
  "Submitted URL marked noindex" error, carried in ~14 runs since 2026-08-20.
- CLASS FIXED (root cause, not the one URL): getAllCities() in src/lib/data.ts
  counted EVERY providers row, while getListingsByCity() — what city pages
  actually render — drops is_hidden rows and availability=false rows. The two
  counts straddled the shared 3-provider gate. Added the same filter to
  getAllCities so sitemap.ts, the city page, getTopHubs (data.ts:883) and the
  matrix pages all read one source of truth.
- Blast radius checked against live data: 8 CA city counts get more honest
  (toronto 80->77, which matches the CLAUDE.md live figure; mississauga 21->20,
  richmond-hill 18->17, north-vancouver 10->9, north-york 5->4, ajax 5->4,
  new-westminster 3->2, okotoks 2->1). No city drops to zero. Sitemapped CA
  cities 59 -> 58, losing exactly the contradictory URL.
- npx tsc --noEmit clean (only the pre-existing src/test.tsx error).
- Branch seo-nightly-2026-09-08, NOT merged.
  PR: https://github.com/jointrustloop-creator/TheDripMap/pull/new/seo-nightly-2026-09-08
