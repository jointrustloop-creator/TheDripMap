# TheDripMap — Competitor Analysis

**Date:** 2026-05-29
**Prepared from:** Real Google Search Console export (`tmp-gsc/Queries.csv`, `tmp-gsc/Pages.csv`), web-search snippets + cached metadata for competitors, and a code-level audit of our own routing config.

> **Method note / honesty disclaimer:** Direct page fetching (`WebFetch`) of competitor sites was **blocked** in this environment, so all competitor facts come from **search-result snippets and cached metadata**, not live HTML inspection. Items I could not directly verify (framework, hosting, schema, social handles) are explicitly labeled **[inference]** or **[unverified]**. All TheDripMap numbers (positions, impressions, clicks) are **quoted directly from our real GSC export** and are observed facts. Competitor listing counts come from their own on-page copy as surfaced in search snippets.

---

## 1. TheDripMap — Our Own GSC Baseline (observed facts)

Both GSC files cover ~1,000 query rows and ~1,000 page rows. The headline story is brutal but clear: **we get large impression volume and almost no clicks**, because we rank deep on page 4–9 for nearly everything.

### Click/impression reality
- The **entire Queries export shows only a handful of clicks** — the top rows with any clicks are tiny: `iv drip near me` (1 click / 48 impr / **pos 40.73**), `mobile iv therapy toronto` (1 / 46 / **pos 52.63**), `prime youth aesthetics` (1 / 20 / pos 5.45), `iv nutrition therapy near me` (1 / 1 / pos 1).
- **Every single high-volume query has 0 clicks** because our average position is in the 30s–90s. Examples (all 0 clicks):
  - `iv therapy clinic` — **179 impr, pos 33.37**
  - `iv therapy houston` — **174 impr, pos 74.81**
  - `iv therapy near me` — **148 impr, pos 48.01**
  - `drip iv therapy` — 115 impr, pos 54.8
  - `iv therapy` — 101 impr, pos 48.05
  - `iv drip clinic` — 93 impr, **pos 32.67**
  - `iv therapy nyc` — 93 impr, pos 81.9
  - `iv therapy clearwater` — 85 impr, pos 62.8

**Interpretation:** We have *indexation and impression breadth* (Google knows we exist for thousands of money terms) but *zero rank authority* — almost nothing is on page 1. The growth lever is **moving existing high-impression terms from page 4+ to page 1–2**, not chasing new keywords.

### Our best-performing pages (observed)
The only pages earning clicks are **Canada/Toronto content and a few individual provider pages**:
- `/blog/mobile-iv-therapy-toronto-gta` — **6 clicks, 127 impr, pos 12.44** (our single best page)
- `/blog/iv-therapy-mississauga` — **6 clicks, 105 impr, pos 21.48**
- `/blog/iv-therapy-insurance-coverage-canada` — **4 clicks, 85 impr, pos 7.11** (best position of any real content page)
- Homepage `thedripmap.com/` — 4 clicks, 60 impr, pos 8.52
- `/provider/restore-hydration-wellness` — 2 clicks, 26 impr, **pos 2.38**
- `/cities/toronto` — 2 clicks, 95 impr, pos 52.4
- `/cities/ontario` — 1 click, 13 impr, **pos 10.69**

**Canada is our standout.** Of the few pages that rank on page 1–2, a disproportionate share are Toronto/Mississauga/Ontario/insurance-Canada pages. Canada-related queries (`mobile iv therapy toronto` 46 impr, `iv therapy toronto` 65 impr/pos 83.55, `iv treatment toronto` 27 impr, `glutathione iv drip toronto`, `nad iv therapy toronto`, `iv therapy oakville/mississauga/etobicoke/brampton`, etc.) recur throughout the export. This matters enormously because (see §3) **both competitors are US-only**.

### Highest-impression *pages* (mostly wasted — 0 clicks, deep positions)
- `/cities/houston` — **1,149 impr, 0 clicks, pos 55.11** (our single biggest impression sink)
- `/search` — 489 impr, pos 51.8 (a search results page ranking is a wasted slot)
- `/provider/iv-therapy-and-nad-nyc` — 347 impr, pos 81.34
- `/blog/how-much-does-iv-therapy-cost` — 345 impr, pos 35.52
- `/blog/best-iv-therapy-new-york` — 320 impr, pos 76.31
- `/iv-therapy/ny/new-york` — 274 impr, pos 68.19
- `/cities/new-york` — 228 impr, pos 51.19
- `/blog/iv-therapy-toronto-complete-guide` — 199 impr, pos 28.38

### Technical SEO issues visible in GSC + confirmed in our code

This is the most actionable section. Our `next.config.mjs` shows the *intent* to fix these, but GSC proves the **duplication is still live in Google's index**:

1. **`/provider/` (singular) vs `/providers/` (plural) duplication — CONFIRMED.**
   - Our app has **only** `app/providers/[slug]/page.tsx` (plural). There is **no** singular `provider` route.
   - `next.config.mjs` has a permanent redirect `/provider/:slug* → /providers/:slug*` (comment: "fixing ~459 legacy 404s").
   - **Yet GSC Pages.csv shows BOTH forms accumulating impressions with different positions**, e.g. `/provider/restore-hydration-wellness` (pos 2.38) and hundreds of other `/provider/...` rows, alongside `/providers/...` rows. Google is still attributing ranking signals to the old singular URLs. The redirect is correct but signals haven't consolidated — **split ranking signal is real and ongoing.**

2. **www vs non-www duplication — CONFIRMED.**
   - `next.config.mjs` permanently redirects `thedripmap.com → www.thedripmap.com`.
   - **Yet GSC shows large numbers of bare `https://thedripmap.com/...` URLs ranking** (e.g. `thedripmap.com/blog/iv-therapy-insurance-coverage-canada` pos 7.11 AND `www.thedripmap.com/blog/iv-therapy-insurance-coverage-canada` pos 6.85 — the **same page indexed under both hosts at two different positions**). This is textbook signal-splitting; the same content competes against itself.

3. **Legacy `/iv-therapy/{state}/{city}` URLs are being redirected away — losing long-tail specificity.**
   - `next.config.mjs` redirects `/iv-therapy/:state/:city → /cities/:city` (and `/iv-therapy/treatment/:service → /treatments/:service`).
   - GSC shows many `/iv-therapy/...` URLs still indexed and ranking (e.g. `iv-therapy/wisconsin/la-crosse` 56 impr pos 12.91, `iv-therapy/illinois/downers-grove` 141 impr, `iv-therapy/ca/la-jolla` 170 impr). We are **collapsing geo-specific URLs into generic city pages**, which is the *opposite* of what `theivdirectory.com` does (they expand into a treatment×city matrix — see §3). We are throwing away long-tail surface area.

4. **A `/search` page ranks (489 impr).** Internal search-result pages should generally be `noindex`; this is a wasted ranking slot.

---

## 2. Quick profile: what TheDripMap is

For context against competitors: **~1,124 listed clinics across US + Canada**, a clinic claim/verification system (4 claimed, `is_featured`), a 60-second matching **quiz** (`/quiz`, `/quiz/results`), treatment pages (`/treatments/[service]`, `/iv-therapy-for/[slug]`, `/symptoms/[slug]`), programmatic **city** pages (`/cities/[slug]`) and **state** pages (`/states/[state]`), a **92-post blog**, and a **free clinic SEO-audit tool** (`/tools/seo-audit`) plus other clinic tools (`/tools/brand-voice`, `/resources/cost-calculator`, `/resources/safety-checker`). Stack: **Next.js (App Router) + Supabase + Vercel + Tailwind** (from repo + CLAUDE.md).

---

## 3. Competitor Deep-Dives

### 3a. ivtherapymap.com — "IV Therapy Finder"

| Attribute | Finding | Source/confidence |
|---|---|---|
| Total listings | **~3,091 clinics** (their on-page copy) | snippet (cached) |
| Cities / states | **~200 cities, 43 states** | snippet |
| Geography | **US-only** | snippet (no CA results found) |
| Verification / claim | **None** — editorial/curated, no claim or verified-badge system | inference from absence of a `/claim` route in results |
| Reviews | Aggregated/editorial commentary, not a claim-driven review system | inference |
| Quiz / matching | **None observed** | inference |
| Monetization | **Affiliate / booking commissions**, disclosed: *"We may earn a commission when you purchase through our links… pricing independently verified, rankings not influenced by affiliate relationships."* Also "Independent, AI-assisted research." | snippet (confirmed) |
| URL / structure | `/cities`, `/cities/{state}`, heavy `/blog/...` editorial | snippet (confirmed) |
| Title pattern | `"{Topic} \| IV Therapy Finder"` | confirmed across all snippets |

**Content recency (confirmed, strong):** Aggressively year-stamped 2026 editorial. Live titles include *"How Much Does IV Therapy Cost in 2026? Pricing by Drip Type and City,"* *"Best IV Therapy Memberships of 2026 [Cost-Per-Drip Comparison],"* *"Best IV Therapy in Los Angeles, New York, and Chicago: 2026 Guide,"* *"Mobile IV vs Clinic IV: Convenience vs Cost [2026],"* *"Myers Cocktail in 2026: Pricing and Top Providers,"* *"Cheapest Mobile IV Services Under $150."* Their core SEO play is **editorial round-ups and cost/comparison content** ("best IV therapy in {city} 2026", membership cost-per-drip comparisons), not pure programmatic geo.

**Tech stack [inference / unverified]:** Could not confirm framework via search (WebFetch blocked). Clean path structure (`/cities`, `/blog/{slug}`, no file extensions) is **consistent with a Next.js or static-generated JAMstack site [inference]**; not confirmed. Schema markup **[unverified]**.

**Social presence [unverified]:** No `ivtherapymap` social handles surfaced in search. Could not confirm Instagram/TikTok/FB/X presence — treat as **likely minimal / SEO-first brand [inference]**.

**What they rank for [inference from on-page SEO]:** cost/pricing queries ("how much does IV therapy cost"), "best IV therapy in {city}", membership comparison, Myers cocktail pricing, "cheapest mobile IV." These are **exactly the high-impression terms we rank deep on** — e.g. our `/blog/how-much-does-iv-therapy-cost` sits at **pos 35.52 (345 impr, 0 clicks)** while they own that intent.

---

### 3b. theivdirectory.com — "The IV Directory"

| Attribute | Finding | Source/confidence |
|---|---|---|
| Total providers | **~7,300 providers** (baseline; on-page counts vary by city) | baseline + snippets |
| Cities / states | **1,100+ cities, all 50 states** | baseline |
| Geography | **US-only** (no Canada providers surfaced) | snippet (confirmed-absent) |
| Verification / claim | **Full claim system + verified badge.** Free claim → verified badge, contact info, hours, appears in city search. | snippet (confirmed) |
| Featured / paid tier | **Featured tier**: featured placement in city results, provider spotlight, **analytics dashboard, direct booking link, priority support.** "Premium placement & advertising coming soon." | snippet (confirmed) |
| Payments | Stripe (baseline) | baseline |
| Matching | Provider-matching service (baseline) | baseline |
| Monetization | **Paid listings** (free → premium/Featured → elite), advertising | snippet + baseline |
| Contact | hello@theivdirectory.com | snippet |

**URL / structure (CONFIRMED — this is their weapon):** A true **programmatic treatment × geography matrix**:
- `/city/{city-st}` → e.g. `/city/las-vegas-nv`, `/city/new-york-ny`, `/city/ann-arbor-mi`, `/city/los-gatos-ca`
- `/state/{state}` → e.g. `/state/illinois` (147 providers), `/state/indiana` (110 providers)
- `/treatment/{type}/{city-st}` → e.g. `/treatment/detox/fayetteville-nc`
- `/provider/{slug}` → e.g. `/provider/prime-iv-hydration-wellness-shadow-lake-papillion`

**Title pattern (CONFIRMED):** **Counts + year baked into titles** — *"IV Therapy in Las Vegas, NV (2026) — 78 Providers,"* *"IV Therapy in New York, NY (2026) — 64 Providers,"* *"IV Therapy in Ann Arbor, MI (2026) — 20 Providers,"* *"IV Therapy in Illinois (2026) — 147 Providers."* The provider count and "(2026)" in the `<title>` is a deliberate CTR + freshness tactic we do **not** use.

**Content recency (confirmed):** Every city/state/treatment page is year-stamped "(2026)" in the title and rebuilds counts dynamically — perpetually "fresh" at scale.

**Tech stack [inference / unverified]:** Lowercase, hyphenated, extensionless programmatic routes (`/city/las-vegas-nv`) with dynamically-injected counts strongly suggest a **Next.js/Vercel-style framework with server-rendered programmatic pages [inference]** — same playbook as ours, executed at far larger scale. Not directly confirmed (WebFetch blocked). Schema markup **[unverified]** but a directory of this type almost certainly emits LocalBusiness/ItemList schema **[inference]**.

**Social presence [unverified]:** No handles surfaced. **[inference]** SEO-first, programmatic brand with little social investment.

**What they rank for [inference]:** the geo long-tail — "IV therapy in {city}" and "{treatment} in {city}" — i.e. **precisely the `/iv-therapy/{state}/{city}` and treatment×city URLs we are currently redirecting away into generic city pages.**

---

## 4. Head-to-Head Synthesis

| Dimension | **TheDripMap** | **ivtherapymap.com** | **theivdirectory.com** |
|---|---|---|---|
| Listings | ~1,124 | ~3,091 | ~7,300 |
| Cities / states | US + Canada cities; 50 states + CA | ~200 cities / 43 states | 1,100+ cities / 50 states |
| **Geography** | **US + CANADA** ✅ | US only | US only |
| Claim / verified | Yes (4 claimed) | No (editorial) | Yes (verified badge) |
| Featured/paid tier | Built (currently de-emphasized*) | No (affiliate instead) | Yes (Featured + analytics dashboard) |
| Quiz / matching | **60-sec quiz** ✅ | No | Matching service |
| Free SEO-audit tool | **Yes** ✅ (unique) | No | No |
| Programmatic geo | City + state pages (treatment×city collapsed away) | Light (editorial-led) | **Treatment × city matrix at scale** |
| Editorial blog depth | 92 posts (Canada-strong) | **Deep, year-stamped cost/round-up** | Thin (programmatic-led) |
| Counts/year in titles | No | Year yes | **Counts + year** ✅ |
| Monetization | Claim/Featured (pricing hidden*) | Affiliate commissions | Paid listings (free→Featured→elite) |
| Social presence | (n/a here) | Minimal [inferred] | Minimal [inferred] |
| Stack | Next.js + Supabase + Vercel | Next.js/JAMstack [inferred] | Next.js/Vercel-style [inferred] |

\* Per internal memory, all paid-tier/Featured/$99 pricing language was stripped from the site 2026-05-27 and should not be reintroduced without approval. The *capability* exists in code; it is intentionally not surfaced.

### Where competitors are stronger
- **Scale:** theivdirectory has ~6.5× our listings; ivtherapymap ~2.7×. More listings = more indexable long-tail pages.
- **theivdirectory's programmatic matrix** (`/treatment/{type}/{city-st}`) owns the exact geo long-tail we're forfeiting via redirects.
- **ivtherapymap's editorial freshness** (year-stamped cost/comparison/round-up content) owns the high-value informational money terms (cost, memberships, "best in {city}") where we sit on page 4+.
- **Title-tag CTR tactics:** theivdirectory's "(2026) — N Providers" titles likely beat our generic titles on click-through even at similar ranks.

### Where WE are stronger
- **Canada is uncontested.** Both competitors are US-only; our GSC proves Canada pages are *already our best performers* (`mobile-iv-therapy-toronto-gta` pos 12.44, `iv-therapy-insurance-coverage-canada` pos 7.11, `/cities/ontario` pos 10.69). This is a moat nobody is defending.
- **Product depth:** we have a **quiz** (neither competitor matches ivtherapymap; theivdirectory has matching but no quiz) AND a **free clinic SEO-audit tool** — a unique B2B acquisition hook for claiming clinics that neither competitor offers.
- **Both claim system AND editorial** — we straddle theivdirectory's model and ivtherapymap's model; we just under-execute both.

### Provider overlap (spot-check results)
Confirmed overlap between our listings and **theivdirectory.com**:
- **Prime IV Hydration & Wellness** — appears on theivdirectory (`/provider/prime-iv-hydration-wellness-shadow-lake-papillion`) **and** on us (`thedripmap.com/.../prime-iv-hydration-wellness-shadow-lake-papillion` — same slug, in GSC Pages.csv). Many Prime IV locations appear in our GSC.
- **The DRIPBaR** — on theivdirectory (`/provider/...the-dripbar-andover...`) **and** all over our GSC (`the-dripbar-troy`, `the-dripbar-brooksville`, `the-dripbar-stafford`, etc.).
- **Restore Hyper Wellness** — chain present on both ecosystems (numerous `restore-hyper-wellness-*` rows in our GSC; chain widely directory-listed).

**Conclusion:** Heavy listing overlap with theivdirectory on the big national chains. ivtherapymap-specific overlap could **not be verified** (search returned the chains' own sites, not ivtherapymap listing pages) — treat as **unconfirmed**. The differentiator is therefore *not* exclusive inventory; it's **rank, freshness, geography (Canada), and product (quiz/audit).**

### Tying GSC to competitor-owned terms — concrete priority targets
These are terms where **we already earn impressions but rank too low**, and which the competitors' content/structure likely owns:

| Query | Our impr | Our position | Likely competitor owner |
|---|---|---|---|
| `iv therapy clinic` | 179 | **33.37** | both (generic directory) |
| `iv therapy houston` | 174 | 74.81 | theivdirectory `/city/houston-tx` |
| `iv therapy near me` | 148 | 48.01 | both |
| `iv drip clinic` | 93 | **32.67** | both |
| `iv therapy nyc` | 93 | 81.9 | theivdirectory `/city/new-york-ny` |
| `how much does iv therapy cost` (page) | 345 | 35.52 | **ivtherapymap** cost guide |
| `best iv therapy new york` (page) | 320 | 76.31 | **ivtherapymap** "best in {city} 2026" |
| `iv therapy toronto` | 65 | 83.55 | **NOBODY (Canada) — ours to take** |
| `mobile iv therapy toronto` | 46 | 52.63 | **NOBODY (Canada)** |

The two clearest "we're on the cusp" terms are `iv therapy clinic` (pos 33) and `iv drip clinic` (pos 32) — page-3/4 terms with real volume that a few quality internal links + title fixes could push toward page 1–2.

---

## 5. Prioritized Recommendations (each one line + rationale)

1. **Force www + plural canonical consolidation NOW** — submit `thedripmap.com→www` and `/provider/→/providers/` consolidation in GSC and add explicit `rel=canonical` to `www`+plural on every page; *rationale:* GSC proves the same pages rank twice under two hosts/paths, splitting authority (e.g. insurance-Canada page indexed at pos 6.85 AND 7.11).
2. **Stop redirecting `/iv-therapy/{state}/{city}` to generic city pages — rebuild it as a real treatment × city matrix** (`/iv-therapy/{treatment}/{city}`); *rationale:* theivdirectory's matrix owns this long-tail and our config is actively throwing away geo-specific URLs that still earn impressions (la-jolla 170, downers-grove 141).
3. **Go all-in on Canada (uncontested moat)** — build out `/cities/{canadian-city}` + Canada treatment pages + more Toronto/GTA/Mississauga/Vancouver editorial; *rationale:* both competitors are US-only and Canada pages are already our highest-ranking content (pos 7–21).
4. **Adopt count + year title tags** ("IV Therapy in Toronto (2026) — 23 Providers"); *rationale:* directly copies theivdirectory's proven CTR/freshness tactic that we currently lack; cheap, sitewide win.
5. **Rewrite + refresh the cost/comparison blog to outrank ivtherapymap** — beef up `/blog/how-much-does-iv-therapy-cost` (345 impr, pos 35) and `/blog/best-iv-therapy-new-york` (320 impr, pos 76) with 2026 city pricing tables; *rationale:* highest-impression informational terms where ivtherapymap currently wins.
6. **`noindex` the `/search` page and any thin/empty city pages**; *rationale:* `/search` wastes a ranking slot at 489 impr, and thin pages dilute crawl budget against 7,300-page competitors.
7. **Fix the Houston impression sink** — `/cities/houston` has **1,149 impressions at pos 55**; add unique content, provider count, internal links, FAQ schema; *rationale:* single biggest latent-traffic page; even page-2 ranking would convert hundreds of impressions.
8. **Internal-link the page-3 "cusp" money terms to page 1–2** — prioritize `iv therapy clinic` (pos 33) and `iv drip clinic` (pos 32) with hub→spoke links and optimized titles; *rationale:* closest high-volume terms to a breakthrough.
9. **Lead clinic acquisition with the free SEO-audit tool** (unique vs both competitors) to win claims/Featured conversions; *rationale:* neither competitor has a B2B hook this strong; pairs with our claim system.
10. **Add LocalBusiness + ItemList/FAQ schema to provider, city, and treatment pages** (verify ours, since theivdirectory almost certainly has it [inference]); *rationale:* rich results lift CTR and are table-stakes for directory SEO at competitor scale.

---

*Facts vs inferences are labeled throughout. Competitor framework/hosting/schema/social are inferences only — direct page inspection (WebFetch) was blocked, and no competitor social handles surfaced in search. All TheDripMap GSC numbers and routing/config findings are observed/verified.*
