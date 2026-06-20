# SEO Autopilot — standing spec

Version 2. Rewritten 2026-06-20 on real GSC data (last 3 months). Canada-first,
fully autonomous, self-verifying. The next scheduled or dispatched run reads THIS
file as its operating spec. It audits, fixes, self-verifies, ships through the
guardian, and reports, with zero review steps. It never queues work for a human;
it logs or flags instead.

Do not run a pass just because this file changed. A pass runs only when scheduled
or dispatched.

## 1. Data findings driving this version (GSC, last 3 months)

- Canada converts 7.6x better than the US (1.29 percent vs 0.17 percent CTR).
- Editorial blog/guide pages are 6.5 percent of pages but about 30 percent of
  clicks, and they hold page-1 positions. Thin /cities/ template pages sit at
  position 50+ with near-zero clicks.
- Demand-intent cost/comparison terms are indexed but buried at position 44 to 88.
- 88 percent of pages have zero clicks. 41 percent of impressions come from pages
  at position 50+.
- Provider pages only catch brand-name searches.
- Search Appearance shows zero rich results (no FAQ, Article, or business rich
  surfaces are being earned).

## 2. Operating priorities (this replaces the old targeting section)

### 2.1 GEO: Canada only
Optimize Canadian pages only. Do NOT spend optimization cycles on US pages or
provider pages. Log all US work for a future US phase. Canada-first is now
data-confirmed.

### 2.2 Format bias: editorial first
Prefer editorial blog/guide pages. They are the proven page-1 winners. When a
city has both an editorial guide and a thin /cities/ template page competing for
the same query, strengthen the guide and treat the template as a deprioritized
consolidation candidate: log it, do NOT delete or noindex it.

### 2.3 Concentration (beat the US dead weight without removing it)
We do NOT deindex US pages. We concentrate every signal on Canada so the US
footprint naturally sinks in priority while staying warm for the future US phase.
Each run:
- Add contextual internal links BETWEEN existing Canadian guides (guide-to-guide,
  hub-to-guide) so Canadian pages reinforce each other and Google reads the site
  as Canadian through positive signal.
- Where existing Canadian hub or homepage content links out, bias those links
  toward the page-1 Canadian guides.
- Internal-link edits must stay inside the content allowlist. If a link placement
  would require editing a forbidden component (homepage JSX, routing), do NOT
  edit it; log it instead.
- Never add links that point optimization weight at US or provider pages.

### 2.4 Two-track targeting (core change)
- TRACK 1, striking distance (keep): optimize Canadian pages at position 3 to 15
  on high-value queries via metadata, schema, and copy. Up to the normal per-run
  cap.
- TRACK 2, buried high-value lift (NEW): for strategic Canadian demand terms at
  position 16 to 50 (cost, price, "how much", comparison, best-of,
  treatment-by-city) where an existing page is thin, apply real content lift to
  pull them into striking distance: aggregated cost ranges across multiple
  verified clinics, comparison tables, FAQ blocks, structured data. Substance,
  not meta tweaks. Cap Track 2 at 3 pages per run (heavier work, higher
  regression risk). Add lifted pages to the ledger.

### 2.5 Proven clusters to expand (Canada, EXISTING pages per the kill-list; log net-new)
- Safety/regulatory: the "who can legally give IV" guide is page-1. Replicate the
  pattern for more provinces/cities.
- Insurance/coverage (page-1 winner): deepen to city and treatment variants.
- Mobile-IV-by-city (Toronto/Calgary mobile guides rank): extend to more GTA and
  Canadian cities.
- Wellness-adjacent research Q&A ("alcohol after IV" ranks): add more compliant
  question-format guides, subject to the medical tier gate.
- Cost / comparison / best-of: the Track 2 lift targets.

### 2.6 Structured data push (NEW)
Search Appearance is empty, so we earn no rich or AI surfaces. Add FAQPage,
Article, and MedicalBusiness or LocalBusiness JSON-LD to EVERY priority Canadian
page touched, to start qualifying for rich results and AI citations. Count it in
the report.

## 3. US decay watch (passive monitoring only, replaces any prune logic; NEVER act)
We do not deindex, delete, or noindex anything. Each run, monitor whether the US
dead weight is starting to suppress Canada, and flag ONLY if a trigger fires:
- TRIGGER A: Canadian priority pages plateau or decline in average position
  across 3+ consecutive runs despite being optimized.
- TRIGGER B: a known Google core-update window correlates with a Canadian
  impression or position drop.

If neither fires, report one line: "US decay watch: no suppression signal." If a
trigger fires, surface it to Hubert as a flagged observation for a separate human
decision. Take no action either way.

## 4. Pipeline (per run)
1. Kill-switch check (Section 7). If STOP, no-op and report "paused."
2. Audit (read-only): inventory indexable Canadian pages from repo + sitemap;
   pull Canadian cities, treatments, and verified-clinic counts from Supabase;
   build the demand-intent query universe (Canada only, exclude "near me"); bucket
   by position; score by intent x proximity x demand. Use GSC API positions if
   `GSC_SERVICE_ACCOUNT_KEY` is set, else proceed ESTIMATED and label it. Save the
   artifact to `seo-audit/`.
3. Fix on branch `seo/canada-autopilot`: Track 1 (cap = velocity cap) + Track 2
   (cap 3) + concentration internal links + structured data on every touched
   page. Allowlist-only. One commit per page with a clear message.
4. Guardian (Section 5). All checks must pass.
5. Ship or revert (Section 5).
6. Report (Section 8). Update the ledger.

## 5. Guardian (PRESERVE EXACTLY)
- Allowlist-only edits. Forbidden-file refusal: if a fix would require a forbidden
  file, do NOT make it; log it and move on; never pause.
- Build, lint, link, and schema checks on the Vercel preview deploy.
- Auto-merge only if all green.
- Auto-revert on a failed production smoke test.

### 5.1 File allowlist
ALLOWED to edit:
- Page metadata (title, meta description, canonical).
- MDX / markdown content files for EXISTING pages.
- JSON-LD / structured-data components (FAQPage, ItemList, MedicalBusiness,
  LocalBusiness).
- Existing page copy and FAQ content, including the content libs
  (`src/lib/city-intros.ts`, `src/lib/city-meta.ts`, `src/lib/guides.ts`,
  `src/lib/use-cases.ts`).
- Sitemap entries for pages that already exist.

FORBIDDEN to edit (log and move on, never pause):
- App routing, middleware, auth, API routes.
- Supabase migrations or schema, any DB writes (this includes blog_posts and the
  cities table body content, which are Supabase-backed).
- Env vars, build config, next config, package.json / dependencies.
- Core component logic, the safety_verified logic, any outreach/email code.
- Homepage JSX and routing.

### 5.2 Operational notes for running the guardian (learnings)
- No `gh` CLI and no Vercel token are required. Read the Vercel build state from
  the GitHub commit-status API (`/repos/{owner}/{repo}/commits/{sha}/status`,
  Vercel context). Read the preview URL from the GitHub deployments API
  (`environment_url`). The repo is reachable unauthenticated.
- Vercel PREVIEW deployments are protected and return HTTP 401 to an
  unauthenticated crawl, so the link/schema crawl cannot run on the preview as-is.
  Two options, in order: (a) set `VERCEL_AUTOMATION_BYPASS_SECRET` and pass it as
  `x-vercel-protection-bypass` to crawl the preview; (b) until then, treat a green
  preview BUILD as the build/lint/typecheck gate, merge, and run the link/schema
  crawl on PRODUCTION as the smoke test with auto-revert armed (production is
  public). Auto-revert reverts the merge commit and redeploys the prior state.
- Merge is a local `git` merge of `seo/canada-autopilot` into `main` plus a push
  (no `gh` auto-merge available). This is the "auto-merge only if all green" step.
- Detecting existing coverage before adding a city entry: object keys in the
  content libs may be quoted OR unquoted (`'vancouver':` vs `vancouver:`). Grep
  for BOTH, or run a focused `tsc --noEmit` on the changed files before pushing.
  A duplicate object key is a TS1117 error that esbuild does NOT catch but
  `next build` rejects. (This caused a two-build failure on 2026-06-20; the local
  pre-push typecheck now catches it.)

## 6. Medical tier gate (PRESERVE EXACTLY)
- Tier 1: safe, non-medical content (cost, location, logistics, regulatory facts,
  who-can-administer, clinic comparison). Auto.
- Tier 2: wellness-adjacent content that needs careful compliant wording (research
  Q&A like "alcohol after IV", treatment descriptions). Requires a right-wording
  pass plus a compliance second-pass scan before it can ship.
- Tier 3: medical claims, efficacy promises, dosing advice, diagnosis, or
  contraindication guidance. Hard-refuse-and-log. Never ship.
- Run a prohibited-phrase scan on every added line (cure, treat a condition,
  detox/cleanse claims, "boosts immunity", "proven to", "faster than", efficacy
  comparisons, dosing instructions). Strip or refuse per the tier.

## 7. Recurring safety (PRESERVE EXACTLY)
- Ledger: record every page optimized so no page is re-worked without new reason.
  Ledger lives in `seo-audit/` (audit artifacts + a running ledger of touched
  pages and Track-2 lifts).
- Stopping condition: if there is no qualifying striking-distance or buried-lift
  target left this run, stop and report "no qualifying targets"; do not invent
  busywork.
- Velocity cap scaled to GSC data availability: with GSC positions available, use
  the normal Track-1 cap plus Track-2 cap 3. Without GSC (ESTIMATED), halve the
  Track-1 cap and keep Track-2 at most 1, because targeting is lower-confidence.
- Prior-work regression check plus auto-revert: re-check previously optimized
  pages still render and still pass; auto-revert any regression.
- Persistent kill switch (STOP/GO): a STOP set by the operator (Telegram reply
  STOP, recorded in the ledger / a switch file in `seo-audit/`) pauses all runs.
  The run checks this first and no-ops while STOP is set. GO resumes.

## 8. Zero-review (PRESERVE EXACTLY)
Nothing queues for Hubert. Tier 3 refusals and any US-decay-watch trigger are
logged or flagged, never auto-acted. The only human surface is a flagged
observation when a decay-watch trigger fires.

## 9. Content rules (PRESERVE EXACTLY)
- No medical claims.
- "Matching platform", never "directory".
- No em-dashes or en-dashes. Use commas or short sentences.
- Canada only.
- Cost ranges are described as typical and tied to "confirm with the clinic".
  Reference "clinics listed" not "verified" when a city has no claimed clinics.
  No fabricated per-clinic prices.

## 10. Reporting (weekly Telegram message)
Send one message. Lines:
- SHIPPED (n pages) or NO CHANGES (reason).
- Track 1 striking-distance optimized (n).
- Track 2 buried pages lifted (n).
- Internal links added between Canadian guides (n).
- Structured data added (n pages).
- US decay watch: <no suppression signal | TRIGGER FIRED: detail>.
- Existing counters: best-of pages, directory-to-matching fixes, use-case /
  Tier-2 added, Tier-3 refused, impression trend, cumulative progress.
- The live URLs touched this run.
- Footer: "Reply STOP to pause autopilot."

If `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are not set, deliver the same
summary in-channel to the operator instead, and note the env vars to add.

## 11. Environment and data availability
- `GSC_SERVICE_ACCOUNT_KEY`: when set (and the service account has read access to
  the Search Console property), pull real positions for the audit. When absent,
  run ESTIMATED (city population x treatment popularity) and halve velocity per
  Section 7. The findings in Section 1 came from a manual GSC export, not the API.
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`: weekly report delivery. Falls back to
  in-channel reporting when unset.
- `VERCEL_AUTOMATION_BYPASS_SECRET`: optional, enables preview-deploy crawls; see
  Section 5.2.
