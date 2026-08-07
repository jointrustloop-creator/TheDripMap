# TheDripMap Claim Engine — Decisions Log

## 2026-08-07 — MONETIZATION ACTIVATED ("go on all", operator)
Operator approved all monetization lanes, explicitly lifting the 2026-05-27
pricing-hidden rule FOR PRIVATE FEATURED PITCHES (public pricing pages remain a
separate decision). Founding Featured launched: $49/mo locked for life, first 10
claimed clinics, 3 per city, invoice/e-transfer, free listing stays free. 8
pitches drafted to the top claimed CA clinics by 90d engagement (Bar Beauty,
Erin Mills, DRS Mobile, Knead, Nature's Touch, Tri-Health, Vida+Flow, UNITY).
Playbook: docs/monetization/README.md. US Featured stays parked until CA proves
the price point. Badge integrity note: 8 claimed clinics now human-approved
(incl DRIP Miami reconciled 2026-08-07); 5 grandfathered badges have Sept-15
completion emails (Blue Cypress SENT 2026-08-07; Signature x2, Refresh LA, Bay
Wellness verified-safe to send — none had completed the questionnaire).

Autonomous build of a CASL-compliant email engine that converts unclaimed Canadian
listings into claimed ones. ONE approval gate: nothing sends to a real clinic until
Hubert approves the copy + sender setup. This file logs every judgment call so the
gate review is complete. Started 2026-08-06.

## Verified numbers (live Supabase, 2026-08-06)

- CA active listings: 619 | claimed: 21 | **CA active unclaimed: 598** (the universe)
- Unclaimed with a valid, non-bounced email: **495**
- Unclaimed with NO email but a website to scrape: **79** (all 79 have a website)
- Already emailed once by the old outreach: **521** | already 2nd-touched: 83 | replied: 28
- Suppression already in place: email_suppressions 25, outreach_suppressions 31
- Listing events tracked: view, website_click, call_click, book_click, directions_click, message_click
- **Only 97 of 598 (16%) have a meaningful stats hook** (>=5 views OR >=1 click/call/booking in 90d)

## Judgment calls (for gate review)

### JC-1 — The stats hook only works for ~16% of clinics. Two-track copy.
The brief's Touch 1 leads with real stats ("your listing got X views, Y clicks").
But 84% of unclaimed clinics have near-zero 90-day activity, because site-wide
demand is still thin. Emailing "your listing got 1 view" is worse than not
mentioning it.
**Decision:** the engine picks the hook per clinic.
- Clinics with meaningful stats (>=5 views OR >=1 click/call/booking/90d) get the
  STATS-LED copy with their real numbers.
- Clinics without get a VALUE-LED variant (free listing, control your info, appear
  in the city + treatment pages that are now ranking) with NO stat claim.
- **First cohort = the ~97 strong-stat clinics.** They are the highest-converting
  and the most honest use of the hook. Low/zero-stat clinics come later (or not at
  all) pending approval. This also respects the 20/day cap: 97 clinics ~= 5 days.

### JC-2 — 521 clinics were already emailed. Global 3-touch cap, not a fresh blast.
Re-blasting clinics the old campaign already touched would be spammy and risk CASL/
deliverability. **Decision:** the 3-touch cap counts ALL prior outreach. Prior
`outreach_sent` = touch 1 used; `decision_drivers.second_touch_at` = touch 2 used.
The engine only sends a clinic its *next* remaining touch, and prioritizes clinics
with the most remaining budget (never-emailed strong-stats first). Any clinic that
replied (`reply_category` set) is auto-held.

### JC-3 — Email provider: Resend (default). Operator sets up the account + DNS.
I cannot create accounts or edit DNS, so this is a required operator action (and is
part of the "sender setup" you approve at the gate). **Decision:** build the sender
as a provider-agnostic `sendClaimEmail()` that uses `RESEND_API_KEY` +
`CLAIM_FROM_EMAIL`. Resend chosen over Postmark for the simplest API + generous
free tier (3k emails/mo free, well under any spend concern). Swappable if you
prefer Postmark. **Operator setup needed before go-live** (checklist at the gate):
create Resend account, add the sending subdomain (proposed `get.thedripmap.com`),
publish the SPF, DKIM, and DMARC DNS records Resend generates, verify the domain,
put the API key in Vercel env.

### JC-4 — Sender identity + subdomain.
Proposed From: `Hubert <hello@get.thedripmap.com>`, reply-to a monitored address.
Subdomain (not the apex) protects the main domain's deliverability reputation, per
your instruction. Mailing address + full name go in every footer (CASL). **You
confirm the exact From name, address, and mailing address at the gate.**

### JC-5 — CASL basis: implied consent via conspicuously published business email.
Emails go only to a clinic's own publicly published business address, only about
their own listing. For each scraped email the engine records the source URL
(the page it was published on) as implied-consent documentation. Every email
carries: sender name + business name + mailing address + a working one-click
unsubscribe wired to the suppression list. No purchased lists, no guessed
addresses, no LinkedIn. (This is the mechanical CASL implementation; you own the
final legal comfort call as the sender.)

### JC-6 — Storage: reuse existing tables, no new migration to paste.
Suppression reuses `email_suppressions` + `outreach_suppressions` (both checked,
fail-closed). The per-clinic sent-log (touch number, date, template version, email
source URL, provider message id, status) is stored append-only in
`providers.decision_drivers.claim_engine` — schema-free, so the engine needs no SQL
paste to run. The weekly report is computed from that state + the suppression
tables + `is_claimed`. A dedicated log table can be added later if you want one.

### JC-7 — Email extraction method: polite sequential fetch, Firecrawl as fallback.
Per the Windows+Node hard lesson (concurrent HTTPS workers die silently), the
scraper is sequential with AbortController timeouts and a 600ms delay, writing
partial results as it goes. It reads the homepage + /contact + /contact-us,
prefers `mailto:` links and on-domain addresses, and filters junk (no-reply,
platform noise). `FIRECRAWL_API_KEY` is already in the env and can be a fallback
for JS-rendered / Cloudflare-protected sites; usage on <100 URLs is negligible and
free-tier, but I will flag in this file if it is used and at what cost.

### JC-8 — Reply handling: Gmail is connected to info@thedripmap.com (VERIFIED 2026-08-06).
The Gmail MCP is now on the correct account (confirmed: all sent mail is from
info@thedripmap.com). So the reply inbox is solved: outreach sends via Resend from
the subdomain, with **reply-to set to info@thedripmap.com**, and the reply agent
reads/answers that inbox via the Gmail MCP. **Decision:** the reply classifier
runs DRAFT-FIRST for the first week (it drafts answers in Gmail for a quick human
glance), then can flip to auto-send once the answer quality is proven. Escalation
(complaints, legal, press, money/partnerships) always routes to you, never
auto-answered. Unsubscribes detected in replies are processed automatically.

## Open operator actions (surfaced early, not blocking the build)
1. Create the Resend account + add + verify `get.thedripmap.com` + publish SPF/DKIM/
   DMARC + set `RESEND_API_KEY` in Vercel. (Full checklist at the gate.)
2. Confirm the From name, reply-to, and the business mailing address for footers.
3. Decide whether the reply inbox is wired via provider inbound webhook or Gmail.

## Build status
- [x] Data inspection + decisions (this file)
- [ ] Email extraction script + run (79 no-email clinics, record source URLs)
- [ ] `sendClaimEmail()` provider integration (Resend, env-gated, hard OFF by default)
- [ ] 3 touch templates (stats-led + value-led variants), rendered with real data
- [ ] One-click unsubscribe route wired to suppression (fail-closed)
- [ ] Claimed-detection halt + 3-touch cap + 20/day + 6-day spacing
- [ ] Reply classifier + auto-answer templates (draft-first)
- [ ] Self-verification (stats for 5 clinics, unsubscribe E2E, suppression blocks)
- [ ] GATE: present templates rendered with a real clinic + setup checklist, STOP
