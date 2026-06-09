-- Pitch-tracker for the $299 Get Found outreach.
-- Run once in Supabase SQL Editor:
--   https://supabase.com/dashboard/project/qaqzwfnjajyejehmdvuw/sql/new
--
-- Data source: the free agent assessment (not paid Places).
-- One row per clinic. Editable status / notes / last_contacted are user-set
-- via the /admin/opportunities UI. assessed_at + gaps + recommendation are
-- set by the assessment script.

CREATE TABLE IF NOT EXISTS public.clinic_opportunities (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id         uuid NOT NULL UNIQUE REFERENCES public.providers(id) ON DELETE CASCADE,
  -- Free-text plain-words gaps (e.g. ["category not IV", "9 reviews", "no hours listed"])
  gaps              text[] NOT NULL DEFAULT '{}',
  -- "What is solid" bullets from the assessment
  solid             text[] NOT NULL DEFAULT '{}',
  -- yes / no / maybe
  recommendation    text NOT NULL DEFAULT 'maybe',
  -- The "needs a manual Google check" items
  manual_check      text[] NOT NULL DEFAULT '{}',
  assessed_at       timestamptz NOT NULL DEFAULT now(),
  -- Outreach tracking, editable in the UI
  outreach_status   text NOT NULL DEFAULT 'not_contacted',
  last_contacted_at date,
  notes             text NOT NULL DEFAULT '',
  -- Warm flag is derived from providers.is_claimed OR reply_status,
  -- and computed on read. We do NOT store it.
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clinic_opportunities_status
  ON public.clinic_opportunities (outreach_status);

CREATE INDEX IF NOT EXISTS idx_clinic_opportunities_recommendation
  ON public.clinic_opportunities (recommendation);
