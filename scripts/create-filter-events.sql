-- Filter usage analytics (operator-approved 2026-08-11).
-- Every chip toggle on /search and /cities/[slug] writes one row here, so that
-- in ~60 days keep/kill calls can be made on real demand, not just data honesty.
--
-- No PII. session_id is a random client-generated id (localStorage), used only
-- to collapse a single visit's toggles. Paste this in the Supabase SQL editor.
--
-- The write path (/api/track-filter) is TOLERANT of this table being absent, so
-- shipping the UI before this migration lands is safe; it just records nothing.

create table if not exists public.filter_events (
  id           bigint generated always as identity primary key,
  created_at   timestamptz not null default now(),
  filter_id    text not null,                 -- e.g. 'Mobile', 'NAD', 'PrescriberVerified'
  action       text not null default 'on',    -- 'on' | 'off'
  surface      text,                          -- 'search' | 'city'
  city         text,                          -- selected city context, if any
  session_id   text                           -- random client id; not a user id
);

-- Query-by-time and roll-up-by-filter are the two access patterns.
create index if not exists filter_events_created_idx on public.filter_events (created_at desc);
create index if not exists filter_events_filter_idx  on public.filter_events (filter_id);

-- Analytics table: writable by the anon key (client posts through the API route,
-- which uses the service role), readable only by service role. RLS on, no public
-- policies -> only the service role (used server-side) can read/write.
alter table public.filter_events enable row level security;
