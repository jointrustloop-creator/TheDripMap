-- Featured waitlist
--
-- Paste this into the Supabase SQL editor once. Idempotent — re-running is safe.
--
-- Purpose: collect clinic owner interest in the Featured tier before pricing
-- or paid placement is publicly announced. NO pricing is shown anywhere on the
-- /for-clinics/featured-waitlist page. NO promised launch date. The list is
-- only used internally to (1) prioritize which cities to open paid placement
-- in first and (2) give early-interest clinics first dibs when we do open it.
--
-- Service-role insert only. Public access is OFF.

create table if not exists public.featured_waitlist (
  id uuid primary key default gen_random_uuid(),
  clinic_name text not null,
  city text not null,
  email text not null,
  phone text,
  notes text,
  source text default 'web',           -- 'web' | 'outreach-reply' | 'admin'
  user_agent text,
  ip_hash text,
  created_at timestamptz not null default now()
);

create index if not exists featured_waitlist_city_idx on public.featured_waitlist (lower(city));
create index if not exists featured_waitlist_email_idx on public.featured_waitlist (lower(email));
create index if not exists featured_waitlist_created_idx on public.featured_waitlist (created_at desc);

alter table public.featured_waitlist enable row level security;

drop policy if exists "service role full access" on public.featured_waitlist;
create policy "service role full access"
  on public.featured_waitlist
  for all
  to service_role
  using (true)
  with check (true);

-- No anon/authenticated read or write. Inserts go through the
-- /api/featured-waitlist route handler which uses the service-role key
-- server-side. That keeps the list private and the schema enforced.
