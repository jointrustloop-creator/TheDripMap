# TheDripMap Daily Operations

## Every morning (2 minutes)
- [ ] Check info@thedripmap.com for clinic replies
- [ ] Check thedripmap.com/admin/leads for claim requests
- [ ] Check Vercel dashboard - any build failures?

## Every evening (3 minutes)
- [ ] Check info@thedripmap.com again for late replies
- [ ] Note anything unusual

## Weekly (Monday morning - 10 minutes)
- [ ] Check Google Search Console - impressions trending up?
- [ ] Check outreach pipeline - how many days left?
- [ ] Add new providers if pipeline below 7 days
- [ ] Review any claimed listings - do they need enrichment?

## Claude Code check-in prompts (use 3x per day)

MORNING:
"Read GOAL.md and DAILY_CHECKLIST.md. Check today outreach
status in Supabase. Any bounces? Any replies in Gmail?
How many pipeline days left? Report in 5 bullets."

MIDDAY:
"Check admin leads table in Supabase for new claim requests
or upgrade requests today. Any new providers claimed?
Report in 5 bullets."

EVENING:
"Daily summary - total outreach sent to date, pipeline days
remaining, any issues, what is priority for tomorrow.
Report in 5 bullets."

## The numbers that matter
- Outreach emails sent today: check outreach_sent_at = today
- Total claimed listings: check is_featured = true count
- Pipeline remaining: count where outreach_sent is null
- Open rate: we cannot track this without paid Resend plan

## When a clinic replies to outreach
1. Reply within 2 hours if possible
2. Answer any questions about TheDripMap
3. Send them their direct claim link again
4. If they claim - follow up 7 days later about upgrading to $99

## When a clinic claims their listing
1. You get notified at info@thedripmap.com automatically
2. Go to their provider page and verify it looks good
3. Send a personal welcome email within 24 hours
4. Follow up about $99 upgrade after 14 days

## Goal tracker
- June 1 target: 5 paying clinics
- Current paying: 0
- Days until June 1: calculate from today
- On track: NO - need first paying customer this week
