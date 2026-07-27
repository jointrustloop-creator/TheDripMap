-- Safety Verified = human-reviewed (2026-07-25 operator decision).
-- Completing the /finish safety section no longer grants the badge; it queues
-- the clinic for operator review. These columns back the /admin/badge-reviews
-- queue. Paste into the Supabase SQL editor once, then run
-- scripts/_reconcile-badges.cjs to move every machine-granted badge to pending.

ALTER TABLE providers
  ADD COLUMN IF NOT EXISTS safety_review_status  text,        -- null | 'pending' | 'approved' | 'declined'
  ADD COLUMN IF NOT EXISTS safety_reviewed_at    timestamptz, -- when a human decided
  ADD COLUMN IF NOT EXISTS safety_reviewed_by    text,        -- who decided (operator id / name)
  ADD COLUMN IF NOT EXISTS safety_review_reason  text;        -- decline reason

-- Fast lookup of the review queue.
CREATE INDEX IF NOT EXISTS idx_providers_safety_review_status
  ON providers (safety_review_status)
  WHERE safety_review_status IS NOT NULL;
