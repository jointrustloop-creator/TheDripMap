-- Auto-forward migration (shadow mode 2026-06-12, went LIVE 2026-06-25).
--
-- Adds the bookkeeping columns the /api/message-clinic route uses to
-- record, for every clinic-message lead, where the lead was forwarded,
-- plus a per-clinic opt-out flag (forward_leads). Forwarding now fires
-- for claimed clinics (ENABLE_AUTO_FORWARD=true); these columns make the
-- result visible on /admin/leads and let a clinic opt out.
--
-- Run once in Supabase SQL Editor:
--   https://supabase.com/dashboard/project/qaqzwfnjajyejehmdvuw/sql/new
--
-- Scope: only these 3 columns on inquiries + 1 column on providers +
-- 1 index. Idempotent. Safe to re-run.

ALTER TABLE public.inquiries
  ADD COLUMN IF NOT EXISTS forwarded_to_clinic_at timestamptz,
  ADD COLUMN IF NOT EXISTS forwarded_to_clinic_email text,
  ADD COLUMN IF NOT EXISTS forward_status text;

-- Index makes the admin filter "show me everything that would have
-- forwarded" cheap once volume picks up.
CREATE INDEX IF NOT EXISTS inquiries_forward_status_idx
  ON public.inquiries (forward_status);

ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS forward_leads boolean DEFAULT true;

-- forward_status legal values, recorded for documentation only:
--   sent              real send fired (flag must have been on)
--   shadow_would_send shadow mode, flag off, but a real send would have fired
--   unclaimed         is_claimed=false, no forward eligible
--   no_email          provider has no email on file
--   bounced           provider.email_bounced=true
--   orphan_stub       decision_drivers.source = 'orphan_claim_stub'
--   suppressed        provider email in email_suppressions OR outreach_suppressions
--   opted_out         providers.forward_leads = false (clinic clicked unsubscribe)
--   no_provider       inquiry has no matching provider row (shouldn't happen post-WS2)
--   junk_patient      patient email failed the existing isJunkEmail check
