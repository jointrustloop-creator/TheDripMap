-- Abandoned-claim reminder support.
-- Adds a single nullable timestamp so the claim-reminder cron sends at most one
-- reminder per claim_requests row. Safe to run more than once.
--
-- Apply in the Supabase SQL editor (project qaqzwfnjajyejehmdvuw), then flip
-- CLAIM_REMINDER_AUTOSEND in src/lib/claim-reminder.ts when ready.

ALTER TABLE public.claim_requests
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;

-- Optional: index the columns the cron filters on, for fast lookups as the
-- table grows. Harmless if it already exists.
CREATE INDEX IF NOT EXISTS claim_requests_pending_reminder_idx
  ON public.claim_requests (status, created_at)
  WHERE status = 'pending' AND reminder_sent_at IS NULL;
