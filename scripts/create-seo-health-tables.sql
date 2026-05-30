-- SEO health monitoring — backing tables for both layers.
-- Run once in Supabase SQL Editor:
--   https://supabase.com/dashboard/project/qaqzwfnjajyejehmdvuw/sql/new

-- Layer A baseline: single-row key/value store for the most recent
-- self-crawl snapshot. We upsert id=1 every run. Stored as JSONB so the
-- shape can evolve without migrations.
CREATE TABLE IF NOT EXISTS public.seo_health_baseline (
  id         smallint PRIMARY KEY,
  payload    jsonb    NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Layer B rotation cursor: tracks which slice of sitemap URLs the URL
-- Inspection API sampled last time. Lets us cycle through all ~2,142 URLs
-- over time while respecting GSC's daily quota.
CREATE TABLE IF NOT EXISTS public.seo_health_gsc_cursor (
  id         smallint PRIMARY KEY,
  cursor     int      NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- Seed the cursor row if not present (idempotent).
INSERT INTO public.seo_health_gsc_cursor (id, cursor)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;
