
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
