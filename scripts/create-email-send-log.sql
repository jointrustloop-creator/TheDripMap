-- Email send audit log (operator-approved 2026-08-11 send-gate).
--
-- The missing piece behind the Aug 10/11 accidental double-send: there was no
-- record of "what already went out," so a batch could be re-sent unknowingly.
-- Every Part B outreach and newsletter action (send AND test) now writes one row
-- here, and the admin screens read the latest row to show "last batch sent" state
-- before any button is clicked.
--
-- Paste in the Supabase SQL editor. The write path (src/lib/send-log.ts) is
-- TOLERANT of this table being absent, so shipping the code before the paste is
-- safe; it just records nothing until the table exists.

create table if not exists public.email_send_log (
  id              bigint generated always as identity primary key,
  created_at      timestamptz not null default now(),
  channel         text not null,              -- 'partb' | 'newsletter'
  action          text not null,              -- 'send' | 'test'
  actor           text,                        -- who triggered it (operator label)
  recipient_count integer not null default 0,
  recipients      jsonb,                       -- array of addresses actually sent to
  subject         text,
  note            text
);

create index if not exists email_send_log_channel_idx on public.email_send_log (channel, created_at desc);

-- Service-role only (the API routes use it). RLS on, no public policies.
alter table public.email_send_log enable row level security;
