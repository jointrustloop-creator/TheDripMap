# Claim Flow — End-to-End Reference

**Last E2E verified:** 2026-05-26, commit `2d0b5f6` — 11/11 checks passed.
**Test script:** `scripts/e2e-claim-flow.cjs` — re-run any time the flow changes.

---

## What the clinic owner experiences

1. **Lands on their provider page** at `https://www.thedripmap.com/providers/[slug]`
2. **Clicks "Claim this listing"** — opens `ClaimListingModal`
3. **Fills 3 fields** + 1 confirmation checkbox:
   - Owner full name
   - Owner phone number
   - Their clinic email
   - ✓ "I am the owner or authorized representative"
4. **Submits.** Modal shows: *"Request Received! We have sent a verification email to [email]. Click the link to complete your claim."*
5. **Receives verification email** at the address they entered:
   - From: `TheDripMap <info@thedripmap.com>`
   - Subject: `Verify your claim for [clinic name] on TheDripMap`
   - Body: warm greeting + verification link valid for 7 days
6. **Clicks the link** → lands on `/verify-claim?token=XXX`
7. **Server-side verification fires** (see *"What happens at verify-claim"* below)
8. **Sees the success page:** *"Your listing is now live! 🎉"* with clickable listing URL + invitation to reply for photos/services
9. **Listing immediately shows as claimed** on the directory (real photo, no claim CTA, premium card treatment, gradient icon, etc.)
10. **Receives confirmation email**: *"Your claim for [clinic name] is verified"*

If the link is older than 7 days or already used:
- Expired: success page replaced with "Link expired" + a **"Request a new verification link"** button that deep-links straight to their provider page with `?claim=1` (auto-opens the claim modal)
- Already verified: success page replaced with "Already verified" message — no double-fires

---

## Database writes

### On modal submit (`ClaimListingModal.tsx`)

```sql
INSERT INTO claim_requests
  (listing_id, email, owner_name, owner_phone, token, expires_at, created_at)
VALUES
  (provider.id, email, ownerName, ownerPhone, crypto.randomUUID(), now() + 7 days, now());
```

The `claim_requests.listing_id` FK references `providers(id)` (fixed via the May 2026 migration — was previously pointing at a non-existent `listings` table, which was Kia's "Link doesn't work" bug).

### On verify link click (`app/verify-claim/page.tsx`)

```sql
-- 1) Find the pending claim
SELECT id, listing_id, email, owner_name, owner_phone, expires_at, status
FROM claim_requests
WHERE token = $1;

-- 2) Find the provider
SELECT id, name, slug, is_claimed
FROM providers
WHERE id = claim.listing_id;

-- 3) Mark provider claimed AND featured (UI gates on is_featured for claimed visual treatment)
UPDATE providers
SET is_claimed = true, is_featured = true
WHERE id = provider.id;

-- 4) Mark the claim verified
UPDATE claim_requests
SET status = 'verified', verified_at = now()
WHERE id = claim.id;
```

**Critical:** `verify-claim/page.tsx` uses `SUPABASE_SERVICE_ROLE_KEY` (NOT the anon key) so it can bypass RLS on `claim_requests.SELECT` and `providers.UPDATE`. It runs as a server component with `export const dynamic = 'force-dynamic'` so the key never reaches the browser.

---

## Emails sent

| When | From | To | Subject | Sender |
|---|---|---|---|---|
| On modal submit | `info@thedripmap.com` | Owner's claim email | `Verify your claim for [clinic name] on TheDripMap` | `/api/notify-operator` |
| On modal submit | `info@thedripmap.com` | `info@thedripmap.com` | `New clinic claim: [clinic name]` | `/api/notify-operator` |
| On modal submit | (Telegram bot, optional) | `TELEGRAM_CHAT_ID` | 🏥 New Clinic Signup notification | `/api/notify-operator` |
| On verify success | `info@thedripmap.com` | Owner's claim email | `Your claim for [clinic name] is verified` | `verify-claim/page.tsx` |
| On verify success | `info@thedripmap.com` | `info@thedripmap.com` | `Claim VERIFIED: [clinic name]` | `verify-claim/page.tsx` |

All sends use the unified `sendMail()` helper in `src/lib/mailer.ts`, which uses Workspace SMTP (`smtp.gmail.com:465`) via `SMTP_USER` + `SMTP_PASS` env vars in Vercel.

---

## Environment variables required

| Var | Where used | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Modal, verify-claim, all server routes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `ClaimListingModal.tsx` | Browser INSERT into claim_requests |
| `SUPABASE_SERVICE_ROLE_KEY` | `verify-claim/page.tsx`, all crons + admin routes | Bypass RLS for server-side reads/updates |
| `SMTP_USER` | `mailer.ts` | Workspace email account |
| `SMTP_PASS` | `mailer.ts` | Workspace App Password |
| `TELEGRAM_BOT_TOKEN` | `notify-operator` | Optional — Telegram alerts |
| `TELEGRAM_CHAT_ID` | `notify-operator` | Optional — Telegram alerts |

---

## Manual recovery when a step fails

### "Owner replied that the link doesn't work"

1. Check `claim_requests` for their row by their email:
   ```sql
   SELECT id, listing_id, token, status, expires_at FROM claim_requests
   WHERE email = '<owner_email>' ORDER BY created_at DESC LIMIT 5;
   ```
2. If `status='pending'` and not expired — token is good, give them this URL directly:
   `https://www.thedripmap.com/verify-claim?token=<token>`
3. If expired — tell them to click "Request a new verification link" on the expired page (auto-opens modal), or paste the modal URL: `https://www.thedripmap.com/providers/<slug>?claim=1`
4. If no row exists — the modal INSERT failed. Check FK constraint:
   ```sql
   SELECT conname, confrelid::regclass FROM pg_constraint
   WHERE conname = 'claim_requests_listing_id_fkey';
   -- Should reference: providers (NOT listings)
   ```

### "Owner verified but their listing still looks unclaimed"

```sql
SELECT id, name, is_claimed, is_featured FROM providers WHERE slug = '<slug>';
-- If is_claimed=true but is_featured=false:
UPDATE providers SET is_featured = true WHERE slug = '<slug>';
```

(Should not happen post-2d0b5f6 — verify-claim sets both. But possible if an older claim verified pre-fix.)

### "Confirmation email never arrived"

Check Gmail Sent folder for `info@thedripmap.com` (via Gmail MCP or web UI). If absent:
- `sendMail` likely silently failed. Check Vercel function logs for `[sendMail]` lines.
- SMTP_USER / SMTP_PASS may have rotated or expired.
- Workspace may have flagged outbound spam → check the postmaster.

---

## Cron schedules (for reference when restoring)

`vercel.json` should contain:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    { "path": "/api/cron/daily-outreach", "schedule": "0 13 * * *" },
    { "path": "/api/cron/followup-outreach", "schedule": "0 14 * * *" }
  ]
}
```

- `daily-outreach` — fires at 13:00 UTC (9am Eastern). Sends up to 19 first-touch emails to highest-ranked unclaimed clinics. Uses `CRON_SECRET` for auth.
- `followup-outreach` — fires at 14:00 UTC (10am Eastern, 1h after first). Sends up to 15 second-touch emails to clinics emailed 7+ days ago that didn't claim.

Do not re-enable crons until this E2E reference passes.
