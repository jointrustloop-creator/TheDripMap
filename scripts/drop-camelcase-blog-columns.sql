-- Drop duplicate camelCase columns from blog_posts table.
--
-- Safe to run because:
--   1. src/lib/data.ts normalizers now fall back to snake_case for every
--      camelCase field (imageUrl, metaTitle, metaDescription, authorImageUrl,
--      lastUpdated, reviewedBy, relatedCities, relatedClinics).
--   2. Data audit confirmed every camelCase column is either fully synced
--      to its snake_case sibling (imageUrl, metaTitle, metaDescription),
--      already empty (authorImageUrl, reviewedBy), or has data exclusively
--      on the snake side (relatedCities, relatedClinics).
--   3. lastUpdated was backfilled into last_updated (16 posts) before drop.
--
-- Paste into the Supabase SQL editor and run.

BEGIN;

ALTER TABLE blog_posts
  DROP COLUMN IF EXISTS "imageUrl",
  DROP COLUMN IF EXISTS "metaTitle",
  DROP COLUMN IF EXISTS "metaDescription",
  DROP COLUMN IF EXISTS "authorImageUrl",
  DROP COLUMN IF EXISTS "reviewedBy",
  DROP COLUMN IF EXISTS "lastUpdated",
  DROP COLUMN IF EXISTS "relatedCities",
  DROP COLUMN IF EXISTS "relatedClinics";

COMMIT;

-- Verify after running:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'blog_posts' ORDER BY column_name;
