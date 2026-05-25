-- Repoint inquiries.listing_id from the orphan 'listings' table to 'providers'.
-- Run once in Supabase SQL editor (https://supabase.com/dashboard/project/qaqzwfnjajyejehmdvuw/sql/new).
--
-- Currently 0 inquiries have listing_id set, so this is a safe schema-only change.
-- After running: re-enable listing_id setting in app/api/message-clinic/route.ts
-- (change `listing_id: null` back to `listing_id: data.clinicId`).

-- 1. Drop the bad constraint to the orphan listings table
alter table public.inquiries
  drop constraint if exists inquiries_listing_id_fkey;

-- 2. Add a soft FK to providers — ON DELETE SET NULL so deleting a clinic
--    doesn't nuke the historical lead record
alter table public.inquiries
  add constraint inquiries_listing_id_fkey
  foreign key (listing_id) references public.providers(id)
  on delete set null;

-- 3. Verify the new constraint
select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.inquiries'::regclass
  and conname = 'inquiries_listing_id_fkey';
