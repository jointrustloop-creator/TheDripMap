# TheDripMap automation

Plain-English map of what runs by itself, when, and what is still on you.

All times are UTC. ET shown where useful. All crons live in `vercel.json`
and are protected by `Authorization: Bearer ${CRON_SECRET}`.

## What runs automatically

### Outreach pipeline

| When (UTC) | What | Path | Notes |
|---|---|---|---|
| 13:00 daily (9am ET) | Daily outreach DRAFT prep (19 drafts) | `/api/cron/daily-outreach` | Drafts only. You send manually from Gmail. |
| 14:00 daily (10am ET) | 7-day follow-up DRAFT prep (15 drafts) | `/api/cron/followup-outreach` | Drafts only. You send manually. |
| 12:00 daily | Unsubscribe sweep | `/api/cron/process-unsubscribes` | Marks `unsubscribed=true` on opt-out replies. |
| 12:00 daily | Backlink research | `/api/cron/backlink-research` | Finds new backlink targets. |
| 13:30 daily | Backlink outreach DRAFT prep | `/api/cron/backlink-drafts` | Drafts only. Manual send. |

### Listing lifecycle

| When (UTC) | What | Path | Notes |
|---|---|---|---|
| On verify-claim click | Auto-enrich the listing | hook in `app/verify-claim/page.tsx` | Geocode + website scrape + Google Places (if key set). Only fills null fields, never overwrites. Fire-and-forget — user redirects instantly. |
| 06:00 daily (2am ET) | Refresh Google rating + review count on every claimed/verified clinic | `/api/cron/refresh-verified-ratings` | Uses Google Places. Requires `GOOGLE_PLACES_API_KEY`. |

### SEO health

| When (UTC) | What | Path | Notes |
|---|---|---|---|
| 10:00 daily (6am ET) | Crawl sitemap, detect new SEO issues, email digest on issues or Mondays | `/api/cron/seo-health` | Emails `info@thedripmap.com`. |
| 00:00 Mondays | Search Console weekly summary | `/api/cron/seo-health-gsc` | Email digest. |

### Reports

| When (UTC) | What | Path | Notes |
|---|---|---|---|
| 22:00 daily | Daily report (email + Telegram) | `/api/cron/daily-report` | New claims today (with source), new verifications, pending claims with days waiting, drafts prepared today, totals. |
| 22:00 Sundays | Weekly summary (email + Telegram) | `/api/cron/weekly-report` | 7-day totals + trend vs prior week, outreach-to-claim conversion, top 10 listings by views/clicks, SEO health snapshot. |

## Where each report lands

- Email: `info@thedripmap.com` (Gmail SMTP, same channel as outreach)
- Telegram: the chat ID set in `TELEGRAM_CHAT_ID` (set up the bot via @BotFather)

If Telegram env vars are not set the cron still runs and emails normally; the Telegram send is a no-op with a warning log.

## What still needs you (operator)

1. Read the daily report each evening and the weekly summary on Mondays.
2. Send the 19 outreach drafts prepared each morning (Gmail Drafts folder).
3. Send the 15 follow-up drafts prepared each morning.
4. Reply personally to inbox replies from clinic owners that need a human (reply classification is not automated yet).
5. Optionally upgrade claimed clinics to `is_featured=true` after a paid Featured purchase.
6. Approve testimonials in `/admin/testimonials` if any are pending.

## Env vars that must be set in Vercel for full coverage

- `CRON_SECRET` — bearer token for cron auth (already set).
- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — already set.
- `SMTP_USER`, `SMTP_PASS` — Workspace Gmail SMTP (already set).
- `GOOGLE_PLACES_API_KEY` — required for the daily rating refresh and the Places step of auto-enrichment. Without it, those simply skip.
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` — required for Telegram delivery of daily + weekly reports. Without them, email-only.

## How to add Telegram delivery (5 minutes)

1. On your phone, message `@BotFather` on Telegram.
2. Send `/newbot`. Pick a name (e.g. `TheDripMap Reports`) and a username ending in `bot`.
3. BotFather replies with an HTTP API token. Copy it to `TELEGRAM_BOT_TOKEN` in Vercel env.
4. Send a quick `hi` to your new bot.
5. Open `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates` in a browser. Find `"chat":{"id":<number>}`. That number is your `TELEGRAM_CHAT_ID`. Add it to Vercel env.
6. Redeploy or wait for the next cron tick — the daily/weekly reports will start landing in Telegram.

## What is NOT automated (yet, by design)

- Outreach SEND. Drafts only. You stay in the loop on tone and timing.
- Featured tier upgrades. Manual until billing is wired.
- Reply triage (which inbox replies are hot leads vs admin chatter). Surface to be added later.
- The parked snake_case schema migration. Untouched.

## Where the new code lives

- `src/lib/auto-enrich.ts` — geocode + website scrape + Places quick rating, fills only null fields.
- `src/lib/places-refresh.ts` — shared engine for the rating refresh (cron + admin endpoint).
- `src/lib/telegram.ts` — Telegram Bot API wrapper, no-op when env unset.
- `app/api/cron/refresh-verified-ratings/route.ts` — daily Places refresh.
- `app/api/cron/daily-report/route.ts` — daily report cron.
- `app/api/cron/weekly-report/route.ts` — weekly summary cron.
- Auto-enrich trigger lives at `app/verify-claim/page.tsx` (fire-and-forget after `is_claimed=true` flip).
