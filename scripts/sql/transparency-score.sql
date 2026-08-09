-- =====================================================================
-- transparency-score.sql  (Transparency Score, 2026-08)
--
-- Adds the three columns the Transparency Score is stored in. The score is
-- computed server side from raw listing data (decision_drivers.manage is
-- stripped from public shapes, so render surfaces cannot recompute it) and
-- persisted here. Recomputed nightly + on every /finish save.
--
-- Paste into the Supabase SQL editor and run once. Additive + idempotent.
--   https://supabase.com/dashboard/project/qaqzwfnjajyejehmdvuw/sql/new
-- =====================================================================

alter table public.providers
  add column if not exists transparency_score integer,
  add column if not exists transparency_checks jsonb,
  add column if not exists transparency_scored_at timestamptz;

-- Cheap filter for "clinics scoring below N" outreach + admin views.
create index if not exists providers_transparency_score_idx
  on public.providers (transparency_score);
