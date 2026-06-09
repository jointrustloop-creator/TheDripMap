-- Get Found Kit intake table.
-- Run once in Supabase SQL Editor:
--   https://supabase.com/dashboard/project/qaqzwfnjajyejehmdvuw/sql/new
--
-- Captures clinic-submitted details after they pay (or just inquire). The
-- public POST endpoint writes a row with default status 'new'. Operator
-- generates the kit, reviews it, marks status 'delivered'.

CREATE TABLE IF NOT EXISTS public.kit_orders (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_name   text NOT NULL,
  city          text NOT NULL,
  website       text,
  gbp_url       text,
  contact_email text NOT NULL,
  status        text NOT NULL DEFAULT 'new',
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kit_orders_status_created
  ON public.kit_orders (status, created_at DESC);
