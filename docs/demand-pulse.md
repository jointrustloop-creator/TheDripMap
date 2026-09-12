# Demand Pulse

Owner-approved plan, 2026-09-12 ("i like demand pulse... invent the absolute
best demand pulse plan"). Build order: Phase 0 first; the Pulse itself only when
the data clears the honesty floor.

## What it is
Every week (monthly at first), each claimed clinic gets a short, true story
about the patients who looked for IV therapy near them, what they wanted, how
the clinic showed up, and the ONE thing to change before next week.

Six lines, one action:
1. Demand near you: N people compared IV clinics within 15 km this week.
2. What they wanted: treatments by count.
3. You in the mix: opens; times shown in a comparison.
4. Where you lost them: the section most visitors left at.
5. Versus the field: peers of the same completeness tier, anonymized.
6. This week's one move: the change with the highest expected uplift, linked
   straight into the finish page.

## Honesty rules (non-negotiable)
- Nothing shown under n=5 patients or 3 clinics; below that the line says "not
  enough data near you yet" and shows the provincial picture.
- Trend arrows only with 4 weeks of history.
- Every number carries its window and source.
- The one move must be doable on the finish page in under 2 minutes, and the
  next Pulse reports whether it moved the numbers.
- Aggregates only. No patient identity in any Pulse. Owner's own sessions are
  excluded after claim. Rate-limit by session so views cannot be inflated;
  views never affect ranking.

## Why not weekly yet (measured 2026-09-12)
Last 28 days: 404 listing views site-wide, 54 website clicks, 8 book, 6 call,
6 message. Montreal 11 views/week, Toronto and Hamilton 7, everything else
under 6. Of 26 claimed Canadian clinics with any views, 1 clears 5/week. A
weekly per-clinic Pulse would say "not enough data" to 25 of 26 owners.

## Phases
- **Phase 0 (shipped 2026-09-12): instrument.** See "Data" below. Silent; no
  owner sees anything. Collect 4 weeks.
- **Phase 1: monthly, city-level Pulse v1** (first edition around 2026-10-06):
  city aggregates (which clear the floor in the top 6 cities), the clinic's
  own lines only where its own n >= 5. [TEST] to the operator first.
- **Phase 2: owner page** with the same numbers plus 12-week history.
- **Phase 2b: City Scoreboard**, monthly, public, EARNED ONLY (Safety
  Verified, Transparency Score, Display Complete, patient actions per view).
  Position is never for sale. A labelled "Sponsor of the <city> Scoreboard"
  slot, sold only to clinics already on the board, is a later Monetize item
  and stays parked while pricing is hidden site-wide.
- **Weekly version** switches on per city automatically when that city passes
  30 comparisons a week.
- **Phase 3: Pro** (alerts, missed-demand ledger, peer benchmark, source mix,
  history) only after three cities are weekly; pricing brief to the operator
  before anything is charged.

## Data (Phase 0)
Intent events per clinic, in addition to the six click events:

| kind | fired when | fields |
|---|---|---|
| impression | clinic shown in search results (top 12) | city, chips, session |
| quiz_match | clinic shown as a quiz match | city, recommended treatment, session |
| compare_add | clinic added to compare | session |
| view_src | a listing view arrived from one of our own pages | source path, session |
| reach_prices / reach_hours / reach_practitioner / reach_book | visitor scrolled a section into view (once per session) | session |
| message_topic | a patient message was sent | topic category only |

Storage: `listing_events` under carrier event type `booking_click`, payload in
`referrer` as an `i:` token (src/lib/intent.ts). Readers exclude `i:%` rows from
click metrics. The proper table is scripts/create-intent-events.sql; apply it
when SQL access exists and switch writer + reader.

Read back: `npx tsx scripts/_intent-report.ts --days 7`.

## Derived signals (Phase 1 computation)
Demand index per city/treatment (searches + quiz + Price Index views, 7-day vs
4-week baseline); share of comparison; open rate (opens / shown); drop-off
section; intent conversion (calls + books + website per open) vs peers of the
same completeness tier; missed demand (requested treatments the clinic offers
but has not priced or listed); source mix.
