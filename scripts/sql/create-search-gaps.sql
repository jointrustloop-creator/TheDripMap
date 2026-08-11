-- ============================================================================
-- search_gaps — coverage-gap log for the match quiz.
-- Paste in the Supabase SQL editor. Safe to run once; idempotent.
--
-- Every row is a quiz search (city + treatment) that returned ZERO qualified
-- clinics. Query it to see which markets patients want that we cannot serve yet:
--
--   select city, treatment, count(*) as searches, max(created_at) as last_seen
--   from search_gaps
--   group by city, treatment
--   order by searches desc;
-- ============================================================================
create table if not exists public.search_gaps (
  id         uuid primary key default gen_random_uuid(),
  city       text not null,
  state      text,
  treatment  text not null,
  created_at timestamptz not null default now()
);

create index if not exists search_gaps_city_treatment_idx
  on public.search_gaps (city, treatment);
create index if not exists search_gaps_created_at_idx
  on public.search_gaps (created_at desc);

-- Writes come only from the server (service role) via /api/log-search-gap, so
-- RLS stays enabled with no public policy (service role bypasses RLS).
alter table public.search_gaps enable row level security;
