-- Slow discovery pipeline (2026-07-28).
-- Adds the fields the weekly Places sweep needs to diff reliably and to record
-- what it saw, without ever deleting a listing.
--
-- place_id          Google Places identifier. The PRIMARY diff key: exact and
--                   stable across name/address edits. Null on older rows, so
--                   the diff falls back to name+address fuzzy matching.
-- business_status   Google's OPERATIONAL / CLOSED_TEMPORARILY / CLOSED_PERMANENTLY.
--                   A closed status is FLAGGED for operator review, never auto-deleted.
-- discovery_source  Which source last saw this listing ('google_places', later
--                   'outscraper'). Keeps the pipeline source-agnostic.
-- discovery_seen_at Last time a sweep saw this clinic in results.
-- discovery_flag    Operator-review marker, e.g. 'closed_permanently'.

ALTER TABLE providers
  ADD COLUMN IF NOT EXISTS place_id          text,
  ADD COLUMN IF NOT EXISTS business_status   text,
  ADD COLUMN IF NOT EXISTS discovery_source  text,
  ADD COLUMN IF NOT EXISTS discovery_seen_at timestamptz,
  ADD COLUMN IF NOT EXISTS discovery_flag    text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_providers_place_id
  ON providers (place_id)
  WHERE place_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_providers_discovery_flag
  ON providers (discovery_flag)
  WHERE discovery_flag IS NOT NULL;

-- Per-run quota + outcome log, so quota burn is visible in the digest.
CREATE TABLE IF NOT EXISTS discovery_runs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ran_at        timestamptz NOT NULL DEFAULT now(),
  city          text        NOT NULL,
  source        text        NOT NULL DEFAULT 'google_places',
  api_calls     integer     NOT NULL DEFAULT 0,
  results_seen  integer     NOT NULL DEFAULT 0,
  new_clinics   integer     NOT NULL DEFAULT 0,
  updated       integer     NOT NULL DEFAULT 0,
  flagged       integer     NOT NULL DEFAULT 0,
  notes         text
);

CREATE INDEX IF NOT EXISTS idx_discovery_runs_ran_at ON discovery_runs (ran_at DESC);
