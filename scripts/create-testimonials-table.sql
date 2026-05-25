-- Patient testimonials for claimed clinics
-- Run this once in Supabase SQL editor

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  author_name text not null,
  author_email text not null,
  rating int not null check (rating between 1 and 5),
  title text,
  body text not null,
  visit_date date,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  moderation_token text not null default replace(gen_random_uuid()::text, '-', ''),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  rejected_at timestamptz
);

create index if not exists testimonials_provider_status_idx
  on public.testimonials (provider_id, status, created_at desc);

create index if not exists testimonials_moderation_token_idx
  on public.testimonials (moderation_token);

-- RLS: anon can insert (form submissions) and select approved only
alter table public.testimonials enable row level security;

drop policy if exists "anon insert testimonials" on public.testimonials;
create policy "anon insert testimonials"
  on public.testimonials for insert
  to anon, authenticated
  with check (true);

drop policy if exists "anon read approved" on public.testimonials;
create policy "anon read approved"
  on public.testimonials for select
  to anon, authenticated
  using (status = 'approved');

-- Service role bypasses RLS automatically, so moderation routes work without policies.
