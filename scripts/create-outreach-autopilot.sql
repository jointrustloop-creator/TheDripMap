-- Autopilot cold-outreach: control flag, daily cap, and send-log hardening.
--
-- STAGED FOR OPERATOR PASTE. Do NOT run automatically. Idempotent, safe to
-- re-run. Paste into the Supabase SQL editor before enabling the autopilot.
--
-- After pasting: the flag defaults to FALSE (off). Turn it on with the
-- Telegram /start command (or update the row directly).

-- ---------------------------------------------------------------------------
-- 1. Settings store. Single source of truth for the runtime flag + daily cap.
--    The cron re-reads outreach_autopilot_enabled immediately before every
--    individual send and fails closed if it is false or unreadable.
-- ---------------------------------------------------------------------------
create table if not exists outreach_autopilot_settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

insert into outreach_autopilot_settings (key, value) values
  ('outreach_autopilot_enabled', 'false'),  -- master kill switch, default OFF
  ('outreach_daily_cap',         '20')      -- configurable; raise as confidence grows
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Send-log hardening. status records the claim/sent/failed lifecycle. The
--    unique index makes a second send to the same provider impossible at the
--    database level (the cron uses a claim-first insert, so a duplicate claim
--    raises 23505 and is skipped). One outreach email per clinic, ever.
-- ---------------------------------------------------------------------------
alter table outbound_message_log
  add column if not exists status text not null default 'sent';

create unique index if not exists uniq_outbound_message_log_provider
  on outbound_message_log (provider_id)
  where provider_id is not null;

-- ---------------------------------------------------------------------------
-- 3. Suppression list. outreach_suppressions already exists
--    (email, reason, source, created_at). The unsubscribe link inserts here;
--    a unique index on lower(email) makes a repeat unsubscribe a harmless
--    no-op and lets the cron exclude suppressed addresses cleanly.
-- ---------------------------------------------------------------------------
create unique index if not exists uniq_outreach_suppressions_email
  on outreach_suppressions (lower(email));
