---
name: ops-integrity
description: Weekly and session-start integrity check for TheDripMap's operations layer. Hunts the one recurring bug class we keep finding after the fact - an event is recorded but the follow-through silently failed - across leads, sends, replies, suppressions, claims, tracking, dashboards and crons. Run at the start of every session and whenever a number on /admin looks wrong. Report only unless the fix is a one-line data reversal of a proven false positive.
---

# Ops integrity check

Hubert, 2026-09-18, after four instances in a month: "we have to do better than
this, let's not miss anything going forward." The four instances: a reconcile
that never ran, a verification email discarded, message clicks mislabeled,
failed fetches cached as noindex. The 2026-09-18 audit added four more: leads
marked forwarded before the send was confirmed, owners auto-unsubscribed by a
footer keyword in quoted text, a smoke-test cron counted as owner opens, and a
dashboard filter that silently dropped every row with a NULL referrer.

## The rule (memory: recorded-is-not-done)

A stored status is a claim about the world. Never write the success state
before the side effect has succeeded, never let a filter throw away rows it did
not mean to, and never let an automated actor be counted as a human.

## Run this list. Each item is a query or a code check, not an opinion.

1. **Sends gated on success.** Every place that writes `forward_status`,
   `outreach_sent`, `sent_at`, `personal_note`, `register_touch`,
   `warm_outreach` or an `email_send_log` row: is it after `sendMail` returned
   `ok: true`? grep for `sendMail(` and read the ten lines after each.
2. **Suppressions are real.** `email_suppressions` and `outreach_suppressions`
   rows with `source = 'reply'` in the last 30 days: open each source message;
   the opt-out word must appear in the sender's own text, never in quoted
   history. `ownText()` in src/lib/reply-classifier.ts is the guard; a
   suppression that fails this test is reversed and the owner's
   `email_bounced` reset.
3. **Replies answered.** Every inbound reply in the last 14 days (Gmail label
   or `reply_snippet`) has a matching outbound or an explicit decision note.
   Silence past 48 hours on a clinic reply is a RED.
4. **Leads delivered.** Every lead row: `forward_status` matches an actual send
   in `email_send_log` or `outbound_message_log`; every lead to an unclaimed
   clinic reached info@ and was acted on.
5. **Automated actors excluded.** Crons and smoke tests (flow-smoke, SEO
   crawl, activation engine, our own browser checks) must not increment
   `finishOpenCount`, `listing_events` views, or any "owner engagement" field.
   Check the finish page and /api/track for an operator or bot bypass.
6. **Dashboard filters are NULL-safe.** Any `.not(col, 'like', ...)` or
   `.neq(col, ...)` on a nullable column in src/lib/analytics-query.ts,
   app/admin/**, app/api/cron/weekly-report must be `.or('col.is.null,...')`.
   Recompute one headline number by raw count and compare.
7. **Crons ran.** For each entry in vercel.json crons, find its last log line or
   send; a cron with no trace in 2x its interval is a RED.
8. **Data written matches data submitted.** For any finish-form save or emailed
   answer recorded this week, the provider row carries it (services, prices,
   hours, medical_team, photos) and the public page shows it.
9. **Counts agree.** Homepage, /about, city titles, city bodies, llms.txt and
   /admin all derive from the same functions; spot-check Toronto and the
   national total.
10. **Indexation guard.** `npx vitest run` passes (strict-fetch test).

## Output

A short table: check | GREEN/YELLOW/RED | evidence | fix or owner. Fix only
what is a proven false positive with a one-line reversal; everything else is
reported with the file:line to change. Write the table to
.audit-tmp/ops-integrity/<date>.md and tell Hubert the REDs in one line each.
