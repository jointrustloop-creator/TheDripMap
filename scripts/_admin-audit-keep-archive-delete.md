# Admin Audit: KEEP / ARCHIVE / DELETE (for operator sign-off)

Date: 2026-06-12. Status: PROPOSAL ONLY, nothing changed. On approval,
approved items execute on a branch as one PR (code) plus one count-checked
data script (DB rows).

Definitions: KEEP = stays as is. ARCHIVE = code stays in repo but the UI
button/nav entry is removed and the endpoint returns 410 gone-but-documented
(reversible in one commit). DELETE = code file or DB rows removed.

## A. Data cleanups (the big wins)

| # | Item | Finding | Proposal |
|---|------|---------|----------|
| A1 | inquiries table: 2,216 rows from pipeline-test@thedripmap.com + 1 from verify-dns-fix@test.com, ALL dated 2026-05-26 (a delivery-test loop) | These are why Leads shows "~498 contact entries": the page caps at 500 rows/30d and the test rows drown everything. Real contact inquiries: 4 total. Site got 192 listing views in 30d, so 4 real inquiries is plausible. | DELETE 2,217 rows, count-checked (abort unless deleted == 2217). Preserves the 4 real inquiries, all 12 claim_requests (all verified-real), all testimonials. |
| A2 | "E2E Test Owner" debris | Already clean. claim_requests has 12 rows, every one a real claim (BeYouty, Tri-Health, Knead pending + 9 verified). Past e2e rows were purged in an earlier cleanup. | NO ACTION. |
| A3 | Atheria Wellness, Collaborative Wellness (Delta), Vega Vitality (Boston) | CORRECTION: these are REAL clinics, not fixtures. scripts/e2e-claim-flow.cjs picks a random low-profile real listing and attaches an "E2E Test Owner" claim to it; these three were past targets. Atheria has a real website + appears in the GTA candidates data. All three are correctly unclaimed today. | KEEP all 3 listings. Optional: add a fixed dedicated test provider (is_hidden=true) so e2e runs stop touching real listings. |

## B. /admin pages

| # | Page | Status | Proposal |
|---|------|--------|----------|
| B1 | /admin dashboard, /admin/login, /admin/onboarding, /admin/leads, /admin/insights, /admin/replies, /admin/testimonials, /admin/backlinks | CURRENT | KEEP |
| B2 | /admin/opportunities (Get Found pitch tracker, $299 flow) | You named Get Found Kit a RETIRED flow. Page reads clinic_opportunities, has warm-lead tracking. | ARCHIVE (remove from nav + dashboard; page stays reachable by URL) unless you still work this pitch list. Your call. |
| B3 | /admin/clinic-owner-pains | Confirmed INTERNAL-ONLY: admin-gated, noindex, research-only, never publishes or emails. Weekly cron refreshes it. Its content is genuinely useful for W2 personal openers. | KEEP, but demote: move out of the main nav into the Tools page as a link. Weekly refresh cron stays. |

## C. /admin/tools buttons

| # | Button | Status | Proposal |
|---|--------|--------|----------|
| C1 | GSC snapshot, Refresh verified ratings, Backfill hours, Rescue 404s, Inspect held redirects | CURRENT utilities | KEEP |
| C2 | Generate 10 outreach drafts + Clean regenerate 50 | PRE-AUTOPILOT outreach. Both already neutralized by PR #3 (OUTREACH_DRAFTS_PAUSED). One of these paths produced the unattended 12:08 batch. | ARCHIVE both buttons (remove from UI; endpoints stay gated). W2 morning routine replaces them. |
| C3 | Queue 4 pending-claim drafts | STALE: label still says 4 incl. Insight; reality is 3 pending (BeYouty, Tri-Health, Knead). W4 triage now drafts follow-ups. | ARCHIVE button. The 3 pending claims get handled through W4 + /admin/onboarding. |
| C4 | Generate Get Found Kit | Tied to the Get Found flow (B2). | Same decision as B2: ARCHIVE unless the $299 pitch is still live. |

## D. /api/admin endpoints with no UI (dead code)

| # | Endpoint | Status | Proposal |
|---|----------|--------|----------|
| D1 | queue-upgrade-drafts | Featured/WAITLIST upsell drafts. Conflicts with the pricing-hidden standing decision. | DELETE file |
| D2 | queue-claimed-data-drafts | Old "send us your hours/photos" drafts. Fully superseded by W1 onboarding. | DELETE file |
| D3 | queue-outreach-drafts | Legacy prospecting, superseded by regenerate-outreach, now also gated. | DELETE file |
| D4 | gmail-cleanup | One-time setup utility that DELETES Inbox + Drafts wholesale. Dangerous to leave callable. | DELETE file |
| D5 | clean-blog | One-time HTML-to-Markdown migration. | DELETE file |
| D6 | sync-sent-to-db | Backfill: reads Gmail Sent, marks outreach_sent. Genuinely useful for reconciliation (used the same logic manually tonight). | KEEP (no UI needed) |
| D7 | outreach-status | Read-only Gmail draft/sent counter. Harmless diagnostic. | KEEP (no UI needed) |
| D8 | gbp-snapshot-refresh | UNCLEAR: opportunities page moved to clinic_opportunities but this still writes gbp_snapshots. | Same decision as B2; if B2 archives, ARCHIVE this too. |

## E. Report crons overlapping AUTOPILOT digests (flagging, your call)

| # | Item | Finding | Proposal |
|---|------|---------|----------|
| E1 | daily-report cron (10pm ET email) | Still fires (today's arrived). Overlaps the new 6:45am/6:45pm AUTOPILOT digests. | Your call: ARCHIVE (pause) once digests prove out over a few days, or keep both. |
| E2 | weekly-report cron (Sunday GSC digest) | Overlaps W5 weekly analyst (Sunday 5pm). | Your call: keep both for 2 weeks, then retire one. |

## Execution plan on approval
One branch (admin-audit-cleanup): nav/dashboard/tools UI removals (B2, B3,
C2-C4), endpoint deletions (D1-D5), 410 stubs for archived endpoints.
One data script: A1 purge with SELECT-first + exact-count abort.
Nothing executes until you reply with approvals, e.g. "approve A1, B3, C2,
C3, D1-D5; hold B2/C4; E later".
