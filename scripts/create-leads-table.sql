-- public.leads — captured by the Drip Assistant when a user volunteers an
-- email for follow-up (e.g. "notify me when you add a clinic in Calgary").
--
-- Falls back to public.inquiries at runtime if this table doesn't yet exist
-- (see captureLead in src/lib/drip-assistant.ts), so deploying the agent
-- does NOT require this migration first — but applying it gives the team a
-- clean, queryable lead store separated from clinic-message inquiries.

CREATE TABLE IF NOT EXISTS public.leads (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text NOT NULL,
  city       text,
  treatment  text,
  source     text NOT NULL DEFAULT 'agent_no_coverage',
  meta       jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leads_created_at_idx ON public.leads (created_at DESC);
CREATE INDEX IF NOT EXISTS leads_source_idx     ON public.leads (source);
CREATE INDEX IF NOT EXISTS leads_email_idx      ON public.leads (lower(email));

-- RLS off — service-role inserts only. The admin dashboard reads via
-- service-role as well, mirroring the inquiries / claim_requests pattern.
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS leads_no_anon_read ON public.leads;
CREATE POLICY leads_no_anon_read ON public.leads
  FOR SELECT TO anon USING (false);
DROP POLICY IF EXISTS leads_no_anon_write ON public.leads;
CREATE POLICY leads_no_anon_write ON public.leads
  FOR INSERT TO anon WITH CHECK (false);
