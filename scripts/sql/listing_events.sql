-- =====================================================================
-- listing_events.sql
-- First-party per-listing analytics capture table for TheDripMap.
--
-- Paste this whole file into the Supabase SQL editor and run it once.
-- Additive only. Does NOT touch providers, claim_requests, inquiries,
-- testimonials, or any existing table. Safe to re-run (everything is
-- guarded by IF NOT EXISTS / CREATE OR REPLACE).
--
-- Schema:
--   public.listing_events                table
--   listing_events_provider_time_idx     index for per-provider rollups
--   listing_events_provider_type_time_idx index for per-event-type rollups
--   public.listing_events_monthly        view used by /admin/insights
--
-- RLS:
--   anon  -> no read, no write
--   authenticated -> no read, no write
--   service_role  -> insert + select (bypasses RLS by default but kept
--                    explicit for clarity)
-- =====================================================================

create table if not exists public.listing_events (
  id          uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  event_type  text not null check (event_type in (
    'view',
    'book_click',
    'call_click',
    'website_click',
    'directions_click',
    'message_click'
  )),
  created_at  timestamptz not null default now(),
  referrer    text
);

create index if not exists listing_events_provider_time_idx
  on public.listing_events (provider_id, created_at desc);

create index if not exists listing_events_provider_type_time_idx
  on public.listing_events (provider_id, event_type, created_at desc);

-- Per-provider, per-calendar-month, per-event-type rollup.
-- Used by /admin/insights to render the current-month dashboard fast
-- without scanning the raw events on every page load.
create or replace view public.listing_events_monthly as
select
  provider_id,
  (date_trunc('month', created_at))::date as month,
  event_type,
  count(*)::bigint as count
from public.listing_events
group by 1, 2, 3;

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.listing_events enable row level security;

-- Drop any older policies so this file stays idempotent.
drop policy if exists listing_events_service_insert on public.listing_events;
drop policy if exists listing_events_service_select on public.listing_events;
drop policy if exists listing_events_anon_no_read   on public.listing_events;

-- service_role can insert.
create policy listing_events_service_insert
  on public.listing_events
  for insert
  to service_role
  with check (true);

-- service_role can read.
create policy listing_events_service_select
  on public.listing_events
  for select
  to service_role
  using (true);

-- No anon / authenticated policies are created. With RLS on and no
-- matching policy, anon and authenticated requests are denied by
-- default, so no PII is exposed even if an anon key were misused.

-- View permissions: revoke from anon/authenticated, keep service_role.
revoke all on public.listing_events_monthly from anon;
revoke all on public.listing_events_monthly from authenticated;
grant select on public.listing_events_monthly to service_role;
