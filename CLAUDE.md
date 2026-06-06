# TheDripMap Master Context

## Site
URL: https://www.thedripmap.com
Stack: Next.js, Supabase, Vercel, Tailwind CSS
Email: info@thedripmap.com

## Database (as of 2026-06-05)
- 1,374 providers total (997 United States, 377 Canada, 0 null country)
- 7 claimed (is_claimed = true), 6 featured (is_featured = true)
- Claimed roster ordered by claimed_at desc (newest first):
  1. insight-naturopathic-clinic-toronto (2026-06-03, via claim flow)
  2. bay-wellness-centre-vancouver (2026-06-01, via claim flow)
  3. diamond-aesthetics-brampton (2026-06-01, via claim flow)
  4. refresh-med-spa-la-los-angeles (2026-05-26, Kia, grandfathered)
  5. signature-beauty-lounge-downtown-toronto (2026-04-27, Eva, grandfathered)
  6. signature-beauty-lounge-richmond-hill (2026-04-27, Eva, grandfathered)
  7. blue-cypress-iv-and-wellness-georgetown (2026-04-19, Mechelle, grandfathered)
- tri-health-wellness-centre-vaughan is NOT is_claimed=true in the DB even though
  prior CLAUDE.md said so. If a claim should exist there, re-run the verify
  flow on whatever email holds the listing.
- claimed_at column added 2026-06-05. Grandfathered dates were hand-set
  during the 2026-06-05 backfill; never overwrite an existing claimed_at
  from updated_at (enrichment touches updated_at).
- 113 blog posts live
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

## Crons (both active and verified)
- Daily outreach: 0 13 * * * (9am ET) - 19 emails/day
- Follow-up: 0 14 * * * (10am ET) - 15 follow-ups/day

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
  during the 2026-06-05 peptide decommission is kept but every provider is
  is_hidden=false; the 19 hybrids cleaned during Phase 1/1b stay cleaned (those
  changes were operator-greenlit independent of the hide decision).

## Today's Hard Lessons
- Invalid vercel.json property blocked all deploys for 1 hour
- claim_requests FK pointed to wrong table - broke Kia's claim
- Two automated emails sent to Kia by mistake
- Always check before sending any automated email
- CLAUDE.md was in .gitignore causing it to be deleted
