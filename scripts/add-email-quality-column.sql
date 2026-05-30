-- PART 2 — Add email_quality column to providers.
-- Run via Supabase SQL editor.

ALTER TABLE providers
  ADD COLUMN IF NOT EXISTS email_quality text;

-- App-layer validation only (no CHECK constraint) so we can evolve the
-- bucket set without a migration. Backfill is done by
-- scripts/score-all-emails.cjs.
CREATE INDEX IF NOT EXISTS idx_providers_email_quality
  ON providers (email_quality);
