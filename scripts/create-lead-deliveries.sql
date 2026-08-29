-- Lead engine v1 (PLAN-3, 2026-08-28): per-clinic lead delivery ledger.
--
-- WHY a separate table when inquiries already has forward_status: the paid
-- pitch is "we sent you N patients this month", and that sentence must be
-- provable per clinic per month across EVERY channel (auto-forward now,
-- manual operator relay, future quiz matches). inquiries records what the
-- patient did; lead_deliveries records what the clinic RECEIVED. One row per
-- delivery event, append-only, never updated.
--
-- Paste into the Supabase SQL editor. All statements are idempotent; the app
-- tolerates the table being absent (falls back silently) so deploy order
-- does not matter.

create table if not exists lead_deliveries (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid,
  provider_id uuid not null,
  -- auto_forward: the message-clinic route emailed the clinic directly.
  -- manual_relay: the operator forwarded it by hand and recorded it.
  channel text not null check (channel in ('auto_forward', 'manual_relay')),
  -- message_clinic | booking (both ride /api/message-clinic today; quiz_match reserved)
  source text not null default 'message_clinic',
  delivered_to text,
  delivered_at timestamptz not null default now(),
  notes text
);

create index if not exists lead_deliveries_provider_idx
  on lead_deliveries (provider_id, delivered_at desc);
create index if not exists lead_deliveries_delivered_at_idx
  on lead_deliveries (delivered_at desc);

-- Service-role only: this is operator/billing data, never client-readable.
alter table lead_deliveries enable row level security;
