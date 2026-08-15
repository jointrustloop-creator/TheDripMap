-- Drip capture (operator-approved data model, 2026-08-14/15).
-- clinic -> drip -> ingredients, with price, duration, and a source URL + date
-- on EVERY record. Attribution-first: we store the clinic's VERBATIM published
-- name and snippet; canonical formula/ingredient mapping is OUR normalization
-- (src/lib/drip-vocabulary.ts) and is never presented as the clinic's claim.
-- No "what it does" field anywhere: only an optional verbatim, attributed
-- published_indication ("what they say it is for").
--
-- Paste in the Supabase SQL editor. Write paths are tolerant of absence.

create table if not exists public.clinic_drips (
  id                   bigint generated always as identity primary key,
  created_at           timestamptz not null default now(),
  provider_id          uuid not null,
  published_name       text not null,          -- clinic's verbatim menu name
  formula_id           text,                    -- OUR normalization (drip-vocabulary), nullable
  price_cad            numeric,                 -- parsed, nullable
  price_raw            text,                    -- verbatim price text
  duration_min         integer,                 -- parsed, nullable
  duration_raw         text,                    -- verbatim duration text
  published_indication text,                    -- VERBATIM "what they say it's for" (attributed, optional)
  source_type          text not null,           -- 'clinic_website' | 'owner_finish_form' | 'operator'
  source_url           text not null,           -- where this record came from
  captured_at          date not null,           -- when it was read
  verbatim_snippet     text,                    -- short quote from the source for audit
  is_active            boolean not null default true
);
create index if not exists clinic_drips_provider_idx on public.clinic_drips (provider_id);
create index if not exists clinic_drips_formula_idx  on public.clinic_drips (formula_id);

create table if not exists public.drip_ingredients (
  id             bigint generated always as identity primary key,
  created_at     timestamptz not null default now(),
  clinic_drip_id bigint not null references public.clinic_drips(id) on delete cascade,
  ingredient_id  text not null,                 -- drip-vocabulary canonical id
  dose_raw       text,                          -- verbatim dose text, if published
  dose_value     numeric,
  dose_unit      text,
  source_url     text not null,
  captured_at    date not null
);
create index if not exists drip_ingredients_drip_idx on public.drip_ingredients (clinic_drip_id);
create index if not exists drip_ingredients_ing_idx  on public.drip_ingredients (ingredient_id);

-- Service-role only. RLS on, no public policies.
alter table public.clinic_drips enable row level security;
alter table public.drip_ingredients enable row level security;
