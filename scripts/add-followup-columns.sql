-- Adds follow-up tracking columns to providers.
-- Run once in Supabase SQL Editor (https://supabase.com/dashboard/project/qaqzwfnjajyejehmdvuw/sql/new)

ALTER TABLE providers ADD COLUMN IF NOT EXISTS followup_sent boolean DEFAULT false;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS followup_sent_at timestamptz;

-- Optional index for cron's lookup (eligible pool query speed)
CREATE INDEX IF NOT EXISTS idx_providers_followup_eligible
  ON providers (outreach_sent_at)
  WHERE outreach_sent = true AND followup_sent IS NOT TRUE;
