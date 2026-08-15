# TheDripMap — $10,000/month by November 20, 2026

## ⭐ THE TRUSTED SOURCE PLAN (2026-08-13) — CURRENT OPERATING PLAN
Operator-approved execution of the patient-pain deep research
(docs/research/patient-pain-research-2026-08.md — every claim sourced; visual:
the Research Findings artifact). This is now the primary lens for all work:
**answer the questions patients actually have, and verify clinics against
public registers instead of trusting their word.**

Thesis: patients' #1 question is "which clinics are reputable / which to avoid";
Ontario's regulator itself tells consumers to "check the register." TheDripMap
checks the registers FOR them and says exactly what was checked.

### Phase 1 — Trust foundation (COMPLETE 2026-08-13)
- [x] Content 01: "Who should NOT get IV therapy" — published
      (who-should-not-get-iv-therapy-canada-2026)
- [x] Content 02: "Verify your IV provider, province by province" — published
      (how-to-verify-iv-provider-license-canada-2026)
- [x] "How verification works" public page — live at /verification
- [x] Verification Ladder L1–L5 adopted into docs/badge-standard.md (2026-08-13)

### Phase 2 — Demand capture
- [x] Content 03: Iron infusions in Canada — published
      (iron-infusion-canada-cost-coverage-2026)
- [x] Content 04: IV vs oral, the honest absorption story — published
      (iv-vs-oral-vitamins-absorption-canada-2026; NIH/PNAS figures verified)
- [x] Content 05: CRA tax deductibility — published
      (iv-therapy-tax-deductible-canada-2026; corrected vs the actual 2012 T.I.:
      practitioner FEE eligible under 118.2(2)(a), substances generally NOT)
- [ ] Content 06: Per-drip honest-triage verdicts (hangover, Myers', immune,
      NAD+ cautionary, glutathione incl. skin-brightening safety)

### Phase 3 — Round out the question space
- [ ] Content 07: Pregnancy & breastfeeding ingredient table (SOGC-aligned)
- [ ] Content 08: Mobile IV in Canada (legality + premium + emergency questions)
- [ ] Content 09: 10-point printable pre-appointment checklist

### Product track (parallel)
- [ ] L5 register-surfacing: show CONO IVIT premises inspection outcomes on
      Ontario ND-clinic listings, linked to the regulator's register
- [ ] Questionnaire additions: G6PD-before-high-dose-C (yes/no), injectables
      supplier (cross-check vs Health Canada recalls), ops-trust disclosures
      (refund policy, cancellation path, no-membership-trap)
- [ ] Drip capture (approved data model): flag finish_template rows, fix
      dropped duration, vocabulary reference table (internal cono_table2_status)
- [ ] Iron-infusion facet (after drip capture)

### Standing rules for this plan
- Every trust claim carries a NAMED authority + checked-as-of date; the word
  "verified" is reserved for register-checked (L2) and above; checks fail closed.
- Content posture = honest triage ("makes sense for X, skip it for Y") — never
  clinic-marketing voice; every claim sourced; no health claims we can't cite.
- Rejuuv/CBC item: PARKED per operator 2026-08-13 (note on file, no action).
- This plan serves priority #3 (GET GOOGLE TO TRUST US) and is the moat for
  #1 and #2: verified data no competitor can copy.

## The math
- 100 paying clinics × $100/month average = $10,000/month
- Current paying clinics: 0
- Current listed clinics: 633
- Conversion needed: 15.8% of listed clinics

## Monthly milestones
- June 1: 5 paying = $500/month
- July 1: 15 paying = $1,500/month
- August 1: 30 paying = $3,000/month
- September 1: 50 paying = $5,000/month
- October 1: 75 paying = $7,500/month
- November 20: 100 paying = $10,000/month

## The 3 things that matter right now
1. GET SEEN — backlinks, sitemap, Canadian content, Search Console
2. GET CLINICS CLAIMING — 10 outreach emails every Monday, no exceptions
3. GET GOOGLE TO TRUST US — consistent content, fresh data, internal links

## Weekly non-negotiables
- Monday: 10 outreach emails sent — AUTOMATED (see Daily outreach below)
- Tuesday: Check Search Console impressions vs last week
- Wednesday: Add new providers or content
- Friday: Review any claim requests or inbound emails

## Daily outreach — AUTOMATED
- Vercel Cron `/api/cron/daily-outreach` runs every day at 13:00 UTC (9am Eastern)
- Sends up to 19 emails/day to highest-rated unclaimed clinics with email-on-file
- Skips any clinic where providers.outreach_sent = true (no double sends, ever)
- Sends a daily summary report email to info@thedripmap.com after each run
- Template + sender: Deborah Triandafilou, info@thedripmap.com, via Workspace SMTP
- Pause: remove the cron entry in vercel.json or disable in Vercel dashboard
- Re-send to a specific clinic: `UPDATE providers SET outreach_sent=false WHERE slug='...'`
- Mark a bouncing email: `UPDATE providers SET email_bounced=true WHERE email='...'` (cron will skip)

## Follow-up outreach — AUTOMATED (compounds conversion ~2x)
- Vercel Cron `/api/cron/followup-outreach` runs every day at 14:00 UTC (10am Eastern, 1h after first cron)
- Sends up to 15 follow-ups/day to clinics emailed 7+ days ago that did not claim
- Skips: claimed clinics, bounced emails, already-followed-up clinics
- Different subject + body that explicitly references "following up on my note last week"
- Sends a daily follow-up summary to info@thedripmap.com
- Requires columns: providers.followup_sent (bool), providers.followup_sent_at (timestamptz)
  (Migration SQL: scripts/add-followup-columns.sql — must be run once in Supabase)

## Outreach priority order
1. Mechelle — info@bluecypressky.com — Blue Cypress Georgetown KY — SEND TOMORROW
2. Eva — info@signaturebeautylounge.ca — Signature Beauty Lounge Toronto — SEND TOMORROW
3. Top 20 unclaimed clinics by rating — drafts in scripts/outreach-drafts.md

## Backlinks — do this week not next week
- [ ] Yelp for Business — biz.yelp.com
- [ ] Foursquare — foursquare.com/business
- [ ] Crunchbase — crunchbase.com/add-listing
- [ ] BBB — bbb.org/start
- [ ] Manta — manta.com/add-your-business
- [ ] YellowPages.ca
- [ ] AlternativeTo — alternativeto.net
- [ ] Wellness.com
- [ ] Hotfrog — hotfrog.com
- [ ] SaaSHub — saashub.com

## Payment strategy
Do NOT build payment infrastructure until a clinic asks to pay.
When first clinic wants to upgrade — handle manually via e-transfer or PayPal invoice.
Build Stripe only when 3+ clinics are paying.

## What success looks like each week
- Impressions growing in Search Console
- At least 1 outreach email replied to
- At least 1 new claim request submitted
- No site bugs reported

## Read this every morning
633 clinics listed. Each one is a potential $99-249/month customer.
The goal is simple: get 100 of them to pay by November 20.
Outreach and SEO are the only two levers that matter right now.

## Instructions for Claude Code
- Reference this file at the start of every session
- Always remind Hubert about backlink submissions if not done
- Always remind Hubert about Monday outreach emails
- Track progress toward milestones when asked
- Every code change must serve one of the 3 priorities above
- If a task does not move toward $10k/month goal, question it
