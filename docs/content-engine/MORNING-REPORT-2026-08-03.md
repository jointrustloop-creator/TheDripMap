# Content Engine — Morning Report (2026-08-03)

Goal: feed what Google already rewards (Canadian regulatory/practical content, the
NAD+/glutathione matrix, Montreal, CTR titles, trust housekeeping). This is a
multi-run goal; below is exactly what is LIVE, what is in a branch awaiting your
merge, and what is not done yet, with reasons. Nothing invented: every regulatory
claim in the new posts links to the actual provincial college.

## TL;DR

- **5 new posts are LIVE now** (4 province deep-dives + a NAD+ Canada explainer), all
  with FAQPage schema and sourced to real regulators. Verified rendering.
- **3 winning posts now link into Montreal** (task 3c done).
- **One code branch is ready for you to merge**, `feature/content-engine`: Toronto
  CTR title surgery (all city titles), plus a sourced provincial regulatory note on
  every treatment-city page (the real task-2 gap).
- **The NAD+/glutathione matrix already existed and most pages already rank** — the
  honest gap is Montreal + Ottawa, which can only be closed by adding real clinics
  (task 3a), not by faking counts.
- **The count reconciliation is answered below** and is already fixed in PR2.
- **Not done yet:** 15 of 20 posts, Montreal clinic completeness (3a), French +
  hreflang (3b), sitemap re-submit (needs the GSC key). Plan for each below.

---

## FIRST: the merge you asked for ("merge it all, deploy")

I could not merge for you: there is no `gh` CLI or GitHub token in this environment,
and these branches sit behind branch protection, so the merge clicks are physically
yours regardless. More importantly, two PRs are NOT safe to deploy until their SQL is
pasted (they write to columns that do not exist yet, which would break the finish
flow and the discovery cron). Safe order:

**Deploy now (no SQL needed), in this order:**
1. `fix/false-claims-emergency` (trust copy)
2. `fix/counts-copy-compliance` (count reconciliation — see below)
3. `feature/us-gate-b2b-newsletter`
4. `feature/toronto-rescue`
5. `feature/content-engine` (this session — titles + matrix note)

**Paste SQL first, THEN merge:**
6. Paste `scripts/create-badge-review-columns.sql`, then merge `fix/badge-human-review`
7. Paste `scripts/create-discovery-columns.sql`, then merge `feature/slow-discovery-places`

`feature/content-engine` is branched off `feature/toronto-rescue`, so merge rescue
first (or merge content-engine last; it contains rescue's commit).

---

## Task 1 — 20 posts: 5 LIVE, 15 to go

All live now, verified (HTTP 200, FAQPage schema, regulator links, internal links):

| URL | Target query family | Sources cited |
|---|---|---|
| /blog/who-can-legally-give-iv-ontario-2026 | who can give an IV in Ontario | CNO, CONO (IVIT), CPSO |
| /blog/who-can-legally-give-iv-british-columbia-2026 | who can give an IV in BC | BCCNM, CNPBC, CPSBC |
| /blog/who-can-legally-give-iv-alberta-2026 | who can give an IV in Alberta | CRNA, CLPNA, CNDA, CPSA |
| /blog/who-can-legally-give-iv-quebec-2026 | who can give an IV in Quebec / Montreal | OIIQ, CMQ |
| /blog/nad-iv-therapy-canada-dosing-safety-evidence-2026 | NAD+ IV Canada / cost / dosing | Toronto Price Index (real prices), honest evidence caveat |

These four province posts directly expand the winning province-rules post (which
ranks position ~6 and is the #1 organic result for these queries — I confirmed that
while sourcing). The NAD+ post attacks the gap you flagged (530 impressions, zero
dedicated pages) and links down into the NAD+ matrix pages.

**No-invention status: clean.** Every regulatory statement in these 5 posts links to
the actual college. Prices come from the Price Index, not invented. Nothing flagged
for your personal review.

**The remaining 15** (not written yet — this is the honest gap): per-province
insurance-receipt posts, iron-infusion rules, naturopath-vs-RN-vs-MD explainer,
medical-director explainer, red-flags checklist, pregnancy/breastfeeding, needle
anxiety, eat-before-an-IV, how-often, HST/receipts. Each needs the same real
sourcing, which is why I did not rush them. Tooling is in place to add them fast:
drop a markdown file in `docs/content-engine/posts/`, add a row to
`scripts/_content-engine-insert.cjs`, run it (it validates meta lengths + FAQ schema
+ dashes and skips existing slugs). Rollback list at
`docs/content-engine/_rollback-inserted-slugs.json`.

## Task 2 — NAD+/glutathione matrix: mostly already built

Important finding: the matrix template already exists at
`/iv-therapy/[treatment]/[city]` with everything the spec asked for (local clinic
list from our DB, real prices where published with "confirm with the clinic" hedges,
education, honest caveat, FAQPage schema, city + treatment links, correct
Claimed-vs-Safety-Verified separation). Live indexed counts:

- **NAD+:** Toronto 17, Calgary 8, Mississauga 5, Vancouver 4 = already indexed.
  Montreal 2 and Ottawa 2 = below the 3-clinic index gate.
- **Glutathione:** Toronto 7, Vancouver 5 = already indexed. Montreal 0.

So the matrix is not a "build," it is a "lift." What I added (in
`feature/content-engine`, pending merge): a **sourced provincial regulatory note** on
every treatment-city page ("Who can legally give you this IV" + link to the province
guide). That was the one piece of your task-2 spec the template lacked, and it lifts
every matrix page at once.

The Montreal/Ottawa gaps can only be closed honestly by adding real clinics that
actually offer those drips (task 3a), not by loosening the gate. Flagged, not faked.

## Task 3 — Montreal beachhead

- **3c internal links: DONE.** All three winning posts now link to /cities/montreal
  (province-rules already did; insurance already had Montreal in related cities; I
  added Montreal to the alcohol post's related cities). Non-disruptive — I did not
  rewrite the winning posts' prose (Hard Rule #4).
- **3a completeness (add every findable Montreal IV clinic WITH source): NOT started.**
  This is real per-clinic web research (each listing needs a live website or Google
  Business URL recorded, no source no listing). It is the linchpin that also unlocks
  the Montreal NAD+/glutathione matrix pages. Biggest remaining research task.
- **3b French + hreflang: NOT started.** Real Quebecois French versions of the
  Montreal city + NAD+/glutathione + Quebec-rules pages with en/fr hreflang. This is
  net-new i18n infrastructure (route strategy + hreflang tags), not a copy job — it
  needs its own scoped build so the French reads native, not machine-stilted.

## Task 4 — CTR title surgery: DONE in branch (pending merge)

One template change in `app/cities/[slug]/page.tsx` fixes every city title. Before →
after (all now <=60 chars, city-first, number + benefit + year):

| City | Before | After |
|---|---|---|
| Toronto | IV Therapy in Toronto, Ontario (2026) \| 77 Clinics | IV Therapy Toronto: Compare 77 Clinics & Prices (2026) |
| Calgary | IV Therapy in Calgary, Alberta (2026) \| 36 Clinics | IV Therapy Calgary: Compare 36 Clinics & Prices (2026) |
| Vancouver | IV Therapy in Vancouver, British Columbia (2026) \| 26 Clinics | IV Therapy Vancouver: Compare 26 Clinics & Prices (2026) |
| Ottawa | IV Therapy in Ottawa, Ontario (2026) \| 25 Clinics | IV Therapy Ottawa: Compare 25 Clinics & Prices (2026) |
| Mississauga | IV Therapy in Mississauga, Ontario (2026) \| 20 Clinics | IV Therapy Mississauga: Compare 20 Clinics & Prices (2026) |
| Montreal | IV Therapy in Montreal, Quebec (2026) \| 16 Clinics | IV Therapy Montreal: Compare 16 Clinics & Prices (2026) |

(Same transform applies to Edmonton, Winnipeg, Richmond Hill, Hamilton, Vaughan,
Markham, Oakville, Burlington, Brampton, and every other city.) I chose "& Prices"
over "Prices & Safety" so the title stays under 60 across all city names; Toronto
lands at 54 characters. Vancouver actually gets shorter because dropping the province
frees room.

## Task 5 — Trust housekeeping

**5a Count reconciliation (the answer you asked for):**
- **Homepage "1,626+" (live) / "1,567+" (older):** counts ALL provider rows, including
  the ~993 US listings we host but noindex and any hidden rows. Not a defensible
  public number under the Canada-first posture.
- **Admin "382":** this is the outreach follow-up QUEUE depth (Canadian, unclaimed,
  emailed-once, not yet second-touched), not a clinic count. It was never meant to be
  a public "how many clinics" figure.
- **The one defensible truth: 619 active Canadian listings.** (Total active incl. US
  = 1,612; hidden excluded.) For a Canada-first site, 619 is the number the homepage
  should show.
- **Already fixed:** PR2 (`fix/counts-copy-compliance`) changes the homepage to
  `Compare {stats.total}+ Clinics` where `stats.total` is now the CA-only 619 (SSOT
  `getSiteStats` excludes hidden + US), and the description now says "across Canada"
  (dropped "and the US") and drops the "Verified" overclaim. So merging PR2 aligns
  every public count to 619. No extra code needed.

**5b Sitemap / schema / orphans:**
- New posts: in the sitemap automatically (blog route, revalidates every 10 min) and
  reachable within two clicks (blog index -> post; the NAD+ post links the matrix
  pages; province posts link the city pages).
- FAQPage schema: verified generating on the live posts (5 questions each).
- Sitemap re-submit to GSC: still blocked on `GSC_SERVICE_ACCOUNT_KEY` (unset). Google
  will re-crawl the sitemap on its own; explicit submission waits on that key.

---

## What I deliberately did NOT do (and why)

- **Did not blind-merge / force-push to main.** No credentials, branch protection, and
  two PRs unsafe without their SQL. Merging is yours; the safe order is above.
- **Did not write all 20 posts this run.** Each regulatory post needs real sourcing to
  honor the no-invention rule; 5 done right beats 20 rushed. Tooling is ready to
  continue.
- **Did not fake the Montreal/Ottawa matrix counts.** They stay honestly below the
  index gate until real clinics are added.
- **Did not rewrite the winning posts' prose** for Montreal links — used the
  related-cities module instead (Hard Rule #4).

## Immediate next actions when you continue

1. Merge the branches in the safe order above; paste the 2 SQL files for badge +
   discovery.
2. I continue task 1 (next batch of ~5 sourced posts) and task 3a (Montreal clinic
   completeness with sources), which also unlocks the Montreal matrix pages.
3. Scope task 3b (French + hreflang) as its own build.
