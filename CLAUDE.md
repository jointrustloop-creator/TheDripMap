# TheDripMap Master Context

## Site
URL: https://www.thedripmap.com
Stack: Next.js, Supabase, Vercel, Tailwind CSS
Email: info@thedripmap.com

## Database (as of 2026-07-08, verified live in the CEO audit)
- 1,583 providers total (997 United States, 586 Canada, 0 null country, 14 hidden)
  -> active (not is_hidden) = 1,569
- 21 claimed (is_claimed = true), 6 featured (is_featured = true), 8 safety_verified
  -> of 21 claimed: 16 via the claim flow (verified claim_request), 5 grandfathered/manual
- 636 providers outreach_sent = true; 3 reply_category = not_interested
- 1,158 providers with email; 38 email_bounced; 77 Canada-active still have NULL email
- Only 17 providers have a real (non-stock) logo; the rest show the stock/monogram fallback
- Active provider geographic top-5:
  - CA-Ontario 304, US-California 181, US-Texas 164, CA-BC 121, US-Florida 116
- Active provider top-5 cities:
  - Toronto 77, New York 51, Dallas 36, Tampa 35, Atlanta 35
- NOTE: the pre-2026-07-08 snapshot said 1,478 providers / 13 claimed (dated 2026-06-11);
  those figures are superseded by the live numbers above. Roster below is the 2026-06 view;
  the live claimed roster is 21 (see scripts/_autopilot-seo-log.md audit note).
- 2 pending claim_requests (2026-07-08): BeYouty Medical Spa (beyoutymedspa@gmail.com,
  genuinely open, is_claimed=false) and a STALE DUPLICATE for allies-integrated-health-victoria
  (superseded by the verified row that claimed it; safe to delete).
- Claimed roster ordered by claimed_at desc (newest first):
  0a. vida-flow-penticton (2026-06-12, via claim flow)
  0b. vp-health-lethbridge (2026-06-11, via claim flow)
  1. purete-medical-spa-etobicoke (2026-06-10, via claim flow)
  2. the-lift-bar-medspa-nicholasville (2026-06-09, via claim flow)
  3. soma-and-soul-wellness-toronto (2026-06-09, via claim flow)
  4. natures-touch-naturopathic-clinic-brampton (2026-06-09, via claim flow)
  5. insight-naturopathic-clinic-toronto (2026-06-03, via claim flow)
  6. bay-wellness-centre-vancouver (2026-06-01, via claim flow) [FEATURED]
  7. diamond-aesthetics-brampton (2026-06-01, via claim flow) [FEATURED]
  8. refresh-med-spa-la-los-angeles (2026-05-26, Kia, grandfathered) [FEATURED]
  9. signature-beauty-lounge-downtown-toronto (2026-04-27, Eva, grandfathered) [FEATURED]
  10. signature-beauty-lounge-richmond-hill (2026-04-27, Eva, grandfathered) [FEATURED]
  11. blue-cypress-iv-and-wellness-georgetown (2026-04-19, Mechelle, grandfathered) [FEATURED]
- Claim distribution: 8 of 11 (73%) are Canadian. 5 free, 6 featured.
- 3 pending claim_requests as of 2026-06-11: BeYouty Medical Spa (Corinna Chin,
  created 2026-06-01, token regenerated 2026-06-11 in WS1), Tri-Health Wellness
  Centre (Dr. Jason Granzotto ND, created 2026-06-02, token regenerated
  2026-06-11 in WS1), Knead Therapy Clinic (Dr. Tonia Winchester, created
  2026-06-04, duplicate row was deleted 2026-06-09 cleanup batch, token
  regenerated 2026-06-11 in WS1). The Insight Naturopathic Clinic stale
  row was deleted 2026-06-11 (the listing's is_claimed was already true).
  Manual follow-up drafts can be queued from /admin/tools (note: the
  "Queue 4 pending-claim drafts" button label and its description are
  now stale; they still reference the old count of 4 including Insight).
- claimed_at column added 2026-06-05. Grandfathered dates were hand-set
  during the 2026-06-05 backfill; never overwrite an existing claimed_at
  from updated_at (enrichment touches updated_at).
- 121 blog posts live (100% have meta_title <=60 chars + meta_description
  <=160 chars after 2026-06-10 Wins 2+3 cleanup)
- 992 active providers with email, 481 without (33% Canada gap = 141 CA
  active providers still NULL email)
- 333 city rows in cities table (was 308 on 2026-06-10; +25 added during
  the autonomous overnight build-out 2026-06-10/11). 36 city pages newly
  populated with content (~4,700 chars each), all dash-clean and verified.
- All 1,478 providers now have lat/lng (Win #4 geocoding completed
  2026-06-10).
- Verify the count live with `select id count exact` on providers, not from this file

## Hard Rules
1. Read GOAL.md at start of every session
2. Never hardcode clinic data - everything from Supabase
3. Only change what is explicitly asked
4. Never touch nav, footer, blog unless asked
5. Never add invalid properties to vercel.json
6. Never delete or gitignore CLAUDE.md
7. Never commit secrets to git
8. Always test before enabling automated emails

## AUTOPILOT v1 (stood up 2026-06-12)
- Standing goal: see the /goal text. Operator reviews at 7am/7pm Toronto.
- W1 Onboarding Engine MERGED to main 2026-06-12 (commit 513e732), gated:
  ONBOARDING_AUTOSEND = false in src/lib/onboarding.ts. Claim verifies
  enqueue onboarding_requests rows; nothing auto-sends until the gate
  flips (separate PR, operator go). Operator sends via /admin/onboarding
  "Send now". Day-7 nudge cron /api/cron/onboarding-nudge (gated, in
  vercel.json). safety_verified AUTO-GRANTS (2026-06-19 rule, corrected
  2026-07-09) the moment a claimed owner completes the safety section of
  the /finish questionnaire (who administers IVs + medical oversight,
  isSafetyComplete() in src/lib/safety.ts) - no operator review happens
  at that point. The operator's click on /admin/onboarding is a SEPARATE,
  secondary path (manual grant/backfill), not the primary one. A monthly
  spot check (3 random Safety Verified clinics + their submitted answers)
  ships in the weekly report so the badge still gets human eyes.
- PENDING OPERATOR PASTE: scripts/create-onboarding-engine-tables.sql
  (onboarding_requests), scripts/create-seo-health-runs-findings.sql
  (WS6, unlocks nightly SEO mechanic).
- LEAD AUTO-FORWARD LIVE 2026-06-25 (app/api/message-clinic/route.ts):
  ENABLE_AUTO_FORWARD = true; migration create-auto-forward-shadow-tables.sql
  APPLIED (no longer pending). A patient "Message Clinic" lead now emails the
  claimed clinic owner directly (reply-to = patient) when eligible (claimed +
  not orphan stub + forward_leads != false + valid, non-bounced, non-suppressed
  email); everything else is saved + info@ notified for manual relay. info@ is
  copied on EVERY lead. Route + /admin/leads tolerate the forward_* columns
  being absent. Per-clinic opt-out = providers.forward_leads=false (or add the
  clinic email to a suppression list). Weekly report now has a LEADS THIS WEEK
  block (patient messages + forwarded count + top clinics by contact clicks).
  Modal copy is status-tailored (claimed = "sent to clinic"; else = "we'll
  relay"). Card/compare contact clicks are now tracked via TrackedLink.
- Templates A (outreach) + B (onboarding) operator-APPROVED 2026-06-12;
  texts in scripts/_autopilot-templates-for-approval.md, flags in
  scripts/_autopilot-approvals.md.
- First run: scripts/_w1-first-run-enqueue.cjs enqueues 7 clinics (the 6
  from the goal + vida-flow-penticton which verified pre-merge). Run it
  AFTER the onboarding SQL paste. It sends nothing.
- Safety evidence prep for the first run (registry links per clinic):
  scripts/_w1-safety-evidence-prep.md. Note: Insight's lead ND is Jill
  (not Tara) Shainhouse; Purete is NP-led so CNO applies, not CPSO.
- 4 scheduled routines (Claude desktop scheduled tasks, run only while
  the app is open): autopilot-morning ~6:15am (triage + W2 drafts +
  digest), autopilot-evening ~6:15pm (triage + digest),
  autopilot-seo-nightly ~2:30am (max 1 branch/night, logs to
  scripts/_autopilot-seo-log.md), autopilot-weekly-analyst Sun 5pm.

## Crons
Both outreach crons PAUSED 2026-06-08 per operator. They fire on schedule
but early-return 0 drafts. To resume: flip `const PAUSED = true` to `false`
in app/api/cron/daily-outreach/route.ts and app/api/cron/followup-outreach/route.ts.
- Daily outreach: 0 13 * * * (9am ET) - 19 emails/day (PAUSED)
- Follow-up: 0 14 * * * (10am ET) - 15 follow-ups/day (PAUSED)
- Weekly SEO digest: 0 0 * * 1 (Sunday 8pm ET) - emails GSC + self-crawl
  report to info@thedripmap.com (active)
- Rating refresh: claimed/featured clinics, 2am ET (active)

For one-off manual batches: /admin/tools has "Wipe drafts + rebuild 50
(Canada only)" — operator-only click.

## Claim Flow
Tested and working May 26 2026
Full docs: scripts/CLAIM_FLOW.md
E2E test: scripts/e2e-claim-flow.cjs
Run e2e test after ANY changes to claim flow

## Goal
$10,000/month by November 20 2026
Full details in GOAL.md and DAILY_CHECKLIST.md

## Standing Decisions
- **Peptides: parked, not promoted, not purged (2026-06-06).** Do not build or
  restore any peptide category, peptide treatment pages, peptide nav links, or
  peptide-specific content/positioning. But also do not hide, delete, or strip
  existing provider listings on peptide grounds. The is_hidden column added
  during the 2026-06-05 peptide decommission is kept, and no provider is
  is_hidden=true on peptide grounds (the 3 currently hidden providers were
  hidden for unrelated reasons, e.g. hijacked-domain). The 19 hybrids cleaned
  during Phase 1/1b stay cleaned (those changes were operator-greenlit
  independent of the hide decision).

## Sleep Mode Hard Lessons (2026-06-10/11)
- 25 autonomous city pages created from templates, 24 had a `${c.city}`
  vs `row.name` field mismatch that left literal "undefined" in the body.
  HTTP 200 checks + no-dash + no-"directory" pre-flight all passed.
  Lesson: when auto-generating templated content, the pre-flight must
  assert `row.name` appears in `content` at least 3 times. Spot checks
  caught all 24; backups saved for rollback.
- Region-specific framing assumptions baked into templates can be wrong
  for outlier rows: the BC template assumed every BC city sits in the
  Lower Mainland, but Victoria is on Vancouver Island. Hamilton template
  inherited "in the Niagara region" framing which is wrong (Hamilton is
  in the Golden Horseshoe). When templating, region-keyword phrases need
  per-row verification.
- Unverifiable superlatives slip through if not specifically scanned:
  "one of the highest hydration-drip per-capita markets in the US" went
  to prod on /cities/phoenix before being caught. Pre-flight should
  flag superlatives (highest, largest, fastest, most) for human review.
- Speculative service-area claims also need verification: my Halifax
  copy said "providers serving selectively the Annapolis Valley" (90-min
  drive west, cannot verify). Soften to "the broader HRM area".
- Spot-checks beat automated audits at catching content quality issues.
  3 rounds of spot-checks caught 32 fixes across 31 cities. Each round
  surfaced a different class of issue the automated audits missed.

## Today's Hard Lessons (2026-06-08)
- /cities/weight-loss returned 404 - no redirect safety net for treatment
  or symptom slugs typed into /cities/ path. When adding new public route
  categories, add a redirect catch for guessable misroutes.
- /treatments/{slug} hub pages rendered 200 but were never in sitemap.ts
  so Google could not crawl them. When adding any new public route, add
  it to app/sitemap.ts in the same commit.
- /iv-therapy/{treatment-slug} created a 2-hop redirect chain after the
  /cities/ safety net landed. Specific redirect rules must come BEFORE
  the generic /iv-therapy/:city catch-all in next.config.mjs, otherwise
  treatment slugs get matched as cities first.
- GSC ownership verification (meta tag) is NOT the same as GSC API
  access. The API needs GSC_SERVICE_ACCOUNT_KEY in Vercel env, separate
  from GOOGLE_PLACES_API_KEY. Confirm env vars are actually set before
  building UI that assumes them.
- Windows + Node v24 silently kills concurrent HTTPS scrape workers
  (exit code 0, no error, partway through). Use sequential fetch +
  AbortController + 600ms polite delay (the phase3 pattern). Always
  write partial JSON every N rows so a death is resumable.

## Earlier Hard Lessons
- Invalid vercel.json property blocked all deploys for 1 hour
- claim_requests FK pointed to wrong table - broke Kia's claim
- Two automated emails sent to Kia by mistake
- Always check before sending any automated email
- CLAUDE.md was in .gitignore causing it to be deleted
