-- providers.claimed_at: schema + backfill (2026-06-05)
--
-- Paste this into the Supabase SQL editor once. Idempotent on the schema
-- change. The backfill UPDATEs are also re-runnable because each WHERE
-- clause filters on `claimed_at is null` so already-stamped rows are skipped.

alter table public.providers
  add column if not exists claimed_at timestamptz;

-- 1. Backfill from claim_requests.verified_at where available.
update public.providers p
   set claimed_at = cr.verified_at
  from public.claim_requests cr
 where cr.listing_id = p.id
   and cr.status = 'verified'
   and cr.verified_at is not null
   and p.is_claimed = true
   and p.claimed_at is null;

-- 2. Backfill the 4 grandfathered claims (no claim_requests row) by hand.
update public.providers
   set claimed_at = '2026-05-26T00:00:00Z'
 where slug = 'refresh-med-spa-la-los-angeles'
   and claimed_at is null;

update public.providers
   set claimed_at = '2026-04-27T00:00:00Z'
 where slug = 'signature-beauty-lounge-richmond-hill'
   and claimed_at is null;

update public.providers
   set claimed_at = '2026-04-27T00:00:00Z'
 where slug = 'signature-beauty-lounge-downtown-toronto'
   and claimed_at is null;

update public.providers
   set claimed_at = '2026-04-19T00:00:00Z'
 where slug = 'blue-cypress-iv-and-wellness-georgetown'
   and claimed_at is null;
