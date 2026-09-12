-- Demand Pulse: the proper home for intent events (2026-09-12).
-- NOT YET APPLIED. Until it is, intent rows live in listing_events under the
-- carrier event type 'booking_click' with the payload encoded in `referrer`
-- as an "i:" token (see src/lib/intent.ts). When this table exists, point
-- the writer (app/api/track/route.ts, app/api/message-clinic/route.ts) and
-- the reader (scripts/_intent-report.ts) here, then backfill with:
--   insert into intent_events (provider_id, kind, city, treatment, session_id, source_path, topic, created_at)
--   select provider_id, ... decoded from referrer ... from listing_events where referrer like 'i:%';

create table if not exists public.intent_events (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references public.providers(id) on delete cascade,
  kind text not null check (kind in ('impression','quiz_match','compare_add','view_src','reach_prices','reach_hours','reach_practitioner','reach_book','message_topic')),
  city text,
  treatment text,
  session_id text,
  source_path text,
  topic text,
  created_at timestamptz not null default now()
);
create index if not exists intent_events_created_at_idx on public.intent_events (created_at desc);
create index if not exists intent_events_provider_idx on public.intent_events (provider_id, created_at desc);
create index if not exists intent_events_city_kind_idx on public.intent_events (city, kind, created_at desc);
