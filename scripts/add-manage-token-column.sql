-- Durable finish-link token: move providers.manage_token out of the
-- decision_drivers JSONB into its own column so no enrichment / research /
-- rating-refresh write to decision_drivers can ever clobber it.
--
-- Root cause (2026-06-15): a freshly verified clinic (Erin Mills Optimum
-- Health) had its manage_token wiped when an enrichment write overwrote
-- decision_drivers AFTER the verification email had already gone out, so the
-- finish link in that email stopped validating. A dedicated column is
-- untouched by JSONB writes, so the emailed link stays valid for good.
--
-- Safe to run any time. The application code reads/validates the token from
-- BOTH this column AND decision_drivers->>'manage_token', and writes the column
-- with a decision_drivers fallback, so deploys work before or after this runs.
-- Paste into the Supabase SQL editor.

ALTER TABLE providers ADD COLUMN IF NOT EXISTS manage_token text;

-- Backfill: copy any existing token out of decision_drivers into the column.
UPDATE providers
SET manage_token = decision_drivers->>'manage_token'
WHERE manage_token IS NULL
  AND decision_drivers IS NOT NULL
  AND decision_drivers ? 'manage_token';

-- Sanity check (optional): how many claimed clinics now have a durable token.
-- SELECT count(*) FILTER (WHERE manage_token IS NOT NULL) AS with_token,
--        count(*) AS claimed
-- FROM providers WHERE is_claimed = true;
