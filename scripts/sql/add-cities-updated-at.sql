-- Change order 2026-09-28, item 1: a real "last content update" for city pages.
-- Paste once into the Supabase SQL editor. Additive and safe to re-run.
--
-- Until this column exists, sitemap.ts derives each city's lastmod from the
-- newest clinic added to the city and the newest blog post tied to it. Once it
-- exists, the sitemap reads it directly and any script that edits
-- cities.content should set it.

alter table public.cities add column if not exists updated_at timestamptz;

-- Backfill from the last two passes that rewrote city guide bodies:
--   2026-08-03  content engine wave 1 (guide bodies written)
--   2026-09-18  site audit (294 Canadian city bodies cleaned)
update public.cities set updated_at = '2026-09-18T00:00:00Z' where updated_at is null and content is not null and content <> '';
update public.cities set updated_at = created_at where updated_at is null;

-- Keep it honest going forward: any content edit bumps the timestamp.
create or replace function public.cities_touch_updated_at() returns trigger language plpgsql as $$
begin
  if new.content is distinct from old.content or new.meta_title is distinct from old.meta_title or new.meta_description is distinct from old.meta_description then
    new.updated_at = now();
  end if;
  return new;
end $$;
drop trigger if exists cities_touch_updated_at on public.cities;
create trigger cities_touch_updated_at before update on public.cities for each row execute function public.cities_touch_updated_at();
