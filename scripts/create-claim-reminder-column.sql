-- Claim reminder cron (spec 5a). Adds the column the /api/cron/claim-reminder
-- route needs to nudge owners whose claim is pending + about to expire, at most
-- once. Paste once into the Supabase SQL editor; the cron then works.
ALTER TABLE claim_requests
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;
