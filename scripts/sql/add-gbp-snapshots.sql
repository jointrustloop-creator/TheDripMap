-- Get Found opportunity engine, GBP snapshot history table.
-- Run once in Supabase SQL Editor:
--   https://supabase.com/dashboard/project/qaqzwfnjajyejehmdvuw/sql/new
--
-- Stores ONE row per (clinic_id, captured_at) snapshot. Never overwrite a
-- clinic's first snapshot, that row is the "before" baseline we compare
-- against 30 days after a Get Found Setup run. Each refresh appends a new
-- row; the admin page reads the most recent row per clinic for the live
-- view and joins to older rows for the comparison.
--
-- All values come straight from the Google Places API, no inventions.
-- Missing fields are stored as null.

CREATE TABLE IF NOT EXISTS public.gbp_snapshots (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id       uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  place_id        text,
  primary_type    text,
  types           text[] DEFAULT '{}',
  rating          numeric(3,2),
  review_count    int,
  photo_count     int,
  has_website     boolean,
  has_phone       boolean,
  has_hours       boolean,
  -- Computed gap flags + score + tier
  category_gap      boolean NOT NULL DEFAULT false,
  reviews_gap       boolean NOT NULL DEFAULT false,
  photos_gap        boolean NOT NULL DEFAULT false,
  completeness_gap  boolean NOT NULL DEFAULT false,
  gap_score         smallint NOT NULL DEFAULT 0,
  tier              text NOT NULL DEFAULT 'low',
  gap_list          text[] NOT NULL DEFAULT '{}',
  places_call_count smallint NOT NULL DEFAULT 0,
  captured_at       timestamptz NOT NULL DEFAULT now()
);

-- Latest-snapshot lookup per clinic (the admin page reads the newest row).
CREATE INDEX IF NOT EXISTS idx_gbp_snapshots_clinic_captured
  ON public.gbp_snapshots (clinic_id, captured_at DESC);

-- Tier filter for the admin list.
CREATE INDEX IF NOT EXISTS idx_gbp_snapshots_tier_score
  ON public.gbp_snapshots (tier, gap_score DESC);

-- A view that selects the most-recent snapshot per clinic for the
-- /admin/opportunities live table.
CREATE OR REPLACE VIEW public.gbp_snapshots_latest AS
SELECT DISTINCT ON (clinic_id)
  *
FROM public.gbp_snapshots
ORDER BY clinic_id, captured_at DESC;
