-- Auto-forward shadow mode 2026-06-12.
--
-- Adds the bookkeeping columns the /api/message-clinic route uses to
-- record, for every clinic-message lead, what auto-forward to the
-- claimed clinic owner WOULD have done if the feature flag were on.
-- No clinic emails fire while ENABLE_AUTO_FORWARD=false. Once we have
-- 1-2 weeks of forward_status data we can flip the flag.
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
