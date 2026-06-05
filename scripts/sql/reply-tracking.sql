-- =====================================================================
-- reply-tracking.sql
-- Inbound reply tracking for TheDripMap outreach loop.
-- CASL-compliant suppression + idempotent audit trail.
--
-- Paste this whole file into the Supabase SQL editor and run it ONCE
-- before deploying app/api/cron/process-replies. Additive only:
--   - 3 NEW tables (email_suppressions, email_replies, email_replies_cursor)
--   - 1 NEW table (outbound_message_log) reserved for future threading
--   - 6 NEW additive columns on public.providers (all guarded with
--     `add column if not exists`)
--
-- Does NOT touch claim_requests, inquiries, listing_events, blogs,
-- testimonials, or any existing column on providers. Safe to re-run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. email_suppressions
-- Permanent suppression list. One row per email address that has opted
-- out OR hard-bounced OR been manually suppressed. The daily-outreach
-- + followup-outreach crons MUST check this before queueing a draft
-- (CASL requirement).
-- ---------------------------------------------------------------------
create table if not exists public.email_suppressions (
  id                 uuid primary key default gen_random_uuid(),
  email              text not null unique,
  reason             text not null check (reason in ('unsubscribe','hard_bounce','manual')),
  source             text,
  notes              text,
  suppressed_at      timestamptz not null default now(),
  source_message_id  text
);
create index if not exists email_suppressions_email_idx
  on public.email_suppressions (email);

-- ---------------------------------------------------------------------
-- 2. email_replies
-- One row per processed inbound message. Idempotency + audit + display.
-- Unique on RFC822 Message-ID so re-runs of the cron are safe.
-- ---------------------------------------------------------------------
create table if not exists public.email_replies (
  id                    uuid primary key default gen_random_uuid(),
  message_id            text not null unique,
  in_reply_to           text,
  references_chain      text[],
  thread_id             text,
  from_email            text not null,
  from_name             text,
  to_email              text,
  subject               text,
  snippet               text,
  received_at           timestamptz not null,
  category              text not null check (category in (
                          'interested',
                          'question',
                          'not_interested',
                          'auto_reply',
                          'bounce',
                          'unclear'
                        )),
  needs_human           boolean not null default false,
  matched_provider_ids  uuid[],
  matched_via           text,
  handled_at            timestamptz,
  handled_by            text,
  gmail_thread_url      text,
  created_at            timestamptz not null default now()
);
create index if not exists email_replies_received_idx
  on public.email_replies (received_at desc);
create index if not exists email_replies_category_idx
  on public.email_replies (category);
create index if not exists email_replies_handled_idx
  on public.email_replies (handled_at) where handled_at is null;

-- ---------------------------------------------------------------------
-- 3. email_replies_cursor
-- Singleton config row. The process-replies cron reads + writes
-- last_uid here so re-runs only fetch NEW messages.
-- ---------------------------------------------------------------------
create table if not exists public.email_replies_cursor (
  id           int primary key default 1,
  last_uid     bigint,
  last_run_at  timestamptz,
  constraint email_replies_cursor_singleton check (id = 1)
);
insert into public.email_replies_cursor (id) values (1)
  on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 4. outbound_message_log  (RESERVED / FUTURE)
-- For threading-based reply matching (A1 path). NOT populated by the
-- current send pipeline. Daily-outreach + followup-outreach do not yet
-- log Message-IDs because Gmail rewrites them on send via IMAP APPEND.
-- Schema is included so the next change to draft-saver.ts has a target.
-- ---------------------------------------------------------------------
create table if not exists public.outbound_message_log (
  id           uuid primary key default gen_random_uuid(),
  message_id   text not null unique,
  provider_id  uuid references public.providers(id) on delete set null,
  to_email     text,
  subject      text,
  sent_at      timestamptz not null default now(),
  kind         text check (kind in ('outreach','followup','welcome','manual'))
);
create index if not exists outbound_message_log_message_idx
  on public.outbound_message_log (message_id);
create index if not exists outbound_message_log_provider_idx
  on public.outbound_message_log (provider_id);

-- ---------------------------------------------------------------------
-- 5. Additive columns on public.providers
-- Mirror the reply state into the provider row so the existing admin
-- queries don't need a join. Precedence is enforced in the cron code,
-- not via DDL.
-- ---------------------------------------------------------------------
alter table public.providers add column if not exists reply_status text;
alter table public.providers add column if not exists reply_received_at timestamptz;
alter table public.providers add column if not exists reply_snippet text;
alter table public.providers add column if not exists reply_category text;
alter table public.providers add column if not exists reply_thread_url text;
alter table public.providers add column if not exists needs_human boolean default false;

-- Suppression-skip reason for the outreach + followup crons. Tracks the
-- WHY without overloading outreach_sent_at, which has its own semantic.
alter table public.providers add column if not exists outreach_skipped_reason text;
alter table public.providers add column if not exists outreach_skipped_at timestamptz;

-- ---------------------------------------------------------------------
-- 6. Row Level Security
-- Same posture as listing_events: service-role only. No anon access.
-- ---------------------------------------------------------------------
alter table public.email_suppressions enable row level security;
alter table public.email_replies enable row level security;
alter table public.email_replies_cursor enable row level security;
alter table public.outbound_message_log enable row level security;

drop policy if exists email_suppressions_service on public.email_suppressions;
drop policy if exists email_replies_service on public.email_replies;
drop policy if exists email_replies_cursor_service on public.email_replies_cursor;
drop policy if exists outbound_message_log_service on public.outbound_message_log;

create policy email_suppressions_service
  on public.email_suppressions
  for all to service_role
  using (true) with check (true);

create policy email_replies_service
  on public.email_replies
  for all to service_role
  using (true) with check (true);

create policy email_replies_cursor_service
  on public.email_replies_cursor
  for all to service_role
  using (true) with check (true);

create policy outbound_message_log_service
  on public.outbound_message_log
  for all to service_role
  using (true) with check (true);

-- =====================================================================
-- END reply-tracking.sql
-- =====================================================================
