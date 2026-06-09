-- Living document for the weekly clinic-owner-pains research cron.
-- Run once in Supabase SQL Editor:
--   https://supabase.com/dashboard/project/qaqzwfnjajyejehmdvuw/sql/new
--
-- The cron writes the latest markdown body here. The /admin page reads it.
-- Single row, id=1, upserted by the cron.

CREATE TABLE IF NOT EXISTS public.clinic_owner_pains (
  id            smallint PRIMARY KEY,
  body          text NOT NULL,
  sources_used  jsonb,
  updated_at    timestamptz NOT NULL DEFAULT now()
);
