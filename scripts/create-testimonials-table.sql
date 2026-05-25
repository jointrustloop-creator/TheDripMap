-- Patient testimonials for claimed clinics — minimal schema, no function defaults
-- Run this once in Supabase SQL editor (Run button, top right)

create table if not exists public.testimonials (
  id uuid primary key,
  provider_id uuid not null,
  author_name text not null,
  author_email text not null,
  rating int not null,
  title text,
  body text not null,
  visit_date date,
  status text not null default 'pending',
  moderation_token text not null,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  rejected_at timestamptz
);

-- Foreign key (separate so a missing constraint doesn't block the table create)
alter table public.testimonials
  drop constraint if exists testimonials_provider_fk;
alter table public.testimonials
  add constraint testimonials_provider_fk
  foreign key (provider_id) references public.providers(id) on delete cascade;

-- Sanity checks (separate from create so they don't block the table create if one fails)
alter table public.testimonials
  drop constraint if exists testimonials_rating_check;
alter table public.testimonials
  add constraint testimonials_rating_check check (rating between 1 and 5);

alter table public.testimonials
  drop constraint if exists testimonials_status_check;
alter table public.testimonials
  add constraint testimonials_status_check check (status in ('pending', 'approved', 'rejected'));

-- Indexes
create index if not exists testimonials_provider_status_idx
  on public.testimonials (provider_id, status, created_at desc);

create index if not exists testimonials_moderation_token_idx
  on public.testimonials (moderation_token);

-- Row-Level Security
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
