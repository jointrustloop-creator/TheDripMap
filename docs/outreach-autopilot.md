# Outreach autopilot

Automated cold outreach: one compliant first-touch email per eligible Canadian
clinic, sent in small batches inside business hours, behind a kill switch.

Default state is **OFF**. Nothing sends until the operator turns it on.

## What it does

- Cadence: up to **5 sends per 30 minutes**, **Mon to Fri, 09:00 to 17:00
  America/Toronto**. The cron fires every 30 min on a wide UTC band
  (`*/30 13-22 * * 1-5`); the route enforces the exact Toronto window itself,
  so DST never matters.
- Daily cap: starts at **20**, configurable (the `outreach_daily_cap` row).
- Eligible pool at build time: **296** clinics (Canadian, valid email, not in
  `outreach_suppressions`, no `outbound_message_log` row). ~3 weeks at cap 20.

## Per-send gates (all must pass, or the email is skipped and logged)

1. `outreach_autopilot_enabled` is true. **Re-read immediately before every
   individual send. If off or unreadable, the send aborts (fail closed).**
2. Address not in `outreach_suppressions`.
3. No prior `outbound_message_log` row for that clinic (one email ever).
4. Canadian provider with a valid email, unclaimed, not bounced/hidden/featured.
5. Inside the Mon to Fri, 09:00 to 17:00 Toronto window.
6. Under the 5-per-batch rate and the daily cap.

## No double sends

Claim-first: the cron INSERTs the `outbound_message_log` row (status `pending`)
**before** calling SMTP. A unique index on `outbound_message_log(provider_id)`
makes a second claim raise `23505`, which is skipped. After SMTP returns the row
is updated to `sent` or `failed`. A failed send is never retried, by design:
better to under-send than risk a double send.

## Control (Telegram)

- `/stop` sets the flag false. `/start` sets it true. `/status` reports the flag
  and today's count.
- Per-batch ping: count + recipients. Daily summary at 17:00 Toronto.

## Template + compliance

Approved Template A, carried inside `src/lib/outreach-autopilot.ts` (independent
of `outreach-templates.ts`). CASL footer with mailing address
(Caledon, Ontario, Canada) and a working unsubscribe link, plus a reply-to-
unsubscribe fallback. No medical claims. No em or en dashes. "Matching
platform", never "directory".

The unsubscribe link is signed (HMAC over the recipient's own address) and
writes the clinic into `outreach_suppressions` on click. Idempotent.

## Files

- `scripts/create-outreach-autopilot.sql` - staged migration (settings table,
  `status` column, unique indexes). Paste in Supabase; do not auto-run.
- `src/lib/outreach-autopilot.ts` - engine (settings, window, candidates, body,
  claim-and-send, unsubscribe token).
- `app/api/cron/outreach-autopilot/route.ts` - the cron (batch + daily summary).
- `app/api/telegram/route.ts` - `/start` `/stop` `/status` webhook.
- `app/unsubscribe/page.tsx` - unsubscribe landing.
- `vercel.json` - the `*/30 13-22 * * 1-5` cron entry.

The claim/verify to onboarding auto-email flow is untouched.

## Enable checklist (operator, after merge)

1. Paste `scripts/create-outreach-autopilot.sql` into the Supabase SQL editor.
2. In Vercel env, set `TELEGRAM_WEBHOOK_SECRET` (any random string) and,
   optionally, `UNSUBSCRIBE_SECRET` (falls back to `CRON_SECRET`). `CRON_SECRET`,
   `SMTP_USER`, `SMTP_PASS`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` should
   already be set.
3. Register the Telegram webhook once:
   `curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://www.thedripmap.com/api/telegram&secret_token=<TELEGRAM_WEBHOOK_SECRET>"`
4. Deploy (merge this PR). The cron is registered but the flag is OFF.
5. Send `/start` in Telegram (or set the `outreach_autopilot_enabled` row to
   `true`). Sending begins in the next business-hours batch.

## Notes

- Vercel cron at 30-minute frequency requires a Pro plan (the project already
  runs sub-daily crons, so this is in scope).
- To raise throughput, update `outreach_daily_cap`. To pause instantly, `/stop`.
