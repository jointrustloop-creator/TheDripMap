-- W1 Onboarding Engine: queue table for post-verification onboarding.
-- Operator pastes this into the Supabase SQL editor. Idempotent.
--
-- One row per claimed clinic. Tracks the onboarding email lifecycle:
--   pending_send -> sent -> (nudged) -> replied -> published | parked
-- The onboarding email itself NEVER fires while the code gate
-- ONBOARDING_AUTOSEND in src/lib/onboarding.ts is false.

create table if not exists onboarding_requests (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references providers(id) on delete cascade,
  owner_email text,
  owner_name text,
  status text not null default 'pending_send',
  -- pending_send | sent | nudged | replied | parked | published
  sent_at timestamptz,
  nudge_sent_at timestamptz,
  reply_received_at timestamptz,
  published_at timestamptz,
  answers jsonb,          -- the 5 answers, brand-voice-rewritten + raw
  assets jsonb,           -- {logo_url, photo_urls[]} after validation/upload
  safety_evidence jsonb,  -- per sub-attestation: quote from reply + registry check
  parked_reason text,     -- set when status = parked (hostile, claim-heavy, no assets...)
  operator_notes text,
  created_at timestamptz not null default now(),
  unique (provider_id)
);

create index if not exists idx_onboarding_requests_status
  on onboarding_requests (status);

-- RLS: deny anon/authenticated; service role bypasses RLS.
alter table onboarding_requests enable row level security;
