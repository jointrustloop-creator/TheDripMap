# TheDripMap Master Context

## Site
URL: https://www.thedripmap.com
Stack: Next.js, Supabase, Vercel, Tailwind CSS
Email: info@thedripmap.com

## Database
- 771 providers, 4 claimed (is_featured = true)
- Claimed:
  1. blue-cypress-iv-and-wellness-georgetown (Mechelle)
  2. signature-beauty-lounge-downtown-toronto (Eva)
  3. signature-beauty-lounge-richmond-hill (Eva)
  4. refresh-med-spa-la-los-angeles (Kia - joined May 26)
- 92 blog posts live
- 517 providers in outreach pipeline

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

## Today's Hard Lessons
- Invalid vercel.json property blocked all deploys for 1 hour
- claim_requests FK pointed to wrong table - broke Kia's claim
- Two automated emails sent to Kia by mistake
- Always check before sending any automated email
- CLAUDE.md was in .gitignore causing it to be deleted
