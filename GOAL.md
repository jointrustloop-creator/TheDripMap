# TheDripMap — $10,000/month by November 20, 2026

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
