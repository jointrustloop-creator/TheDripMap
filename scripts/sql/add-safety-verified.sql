-- Add safety_verified boolean column to providers.
-- Run once in Supabase SQL Editor:
--   https://supabase.com/dashboard/project/qaqzwfnjajyejehmdvuw/sql/new
--
-- Per the 2026-06-08 standing decision: Safety Verified is a separate,
-- optional step earned only after the operator confirms the clinic's
-- medical director, licensed staff, liability insurance, etc. It is
-- explicitly NOT the same thing as is_claimed. The badge gates on this
-- single boolean so the data model matches the policy.
--
-- DO NOT BACKFILL TO TRUE for existing claimed clinics. Default false;
-- operator flips to true manually after attestation.

ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS safety_verified boolean NOT NULL DEFAULT false;

-- Optional: index for the featured shelf lookup.
CREATE INDEX IF NOT EXISTS idx_providers_safety_verified
  ON public.providers (safety_verified)
  WHERE safety_verified = true;
