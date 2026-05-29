-- Backlink outreach pipeline — research/draft/send tracker.
-- Run once in Supabase SQL Editor (https://supabase.com/dashboard/project/qaqzwfnjajyejehmdvuw/sql/new).

CREATE TABLE IF NOT EXISTS public.backlink_targets (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url               text NOT NULL,                          -- exact page URL we want a link from
  domain            text NOT NULL,                          -- root domain (for dedup + DA)
  target_type       text NOT NULL,                          -- 'nursing_school' | 'healthcare_law'
                                                            --  | 'wellness_publication' | 'nurse_entrepreneur'
                                                            --  | 'medical_director_match'
  page_title        text,                                   -- the actual page title we found
  contact_name      text,
  contact_email     text,
  article_to_pitch  text NOT NULL,                          -- TheDripMap blog slug we'd pitch
  reason            text NOT NULL,                          -- 1-2 sentence "why this is a real fit"
  domain_authority  int,                                    -- estimate at research time (skip if <20)
  already_links     boolean DEFAULT false,                  -- skipped if true
  status            text NOT NULL DEFAULT 'researched',     -- researched|drafted|sent|replied|linked|rejected
  gmail_draft_id    text,                                   -- (informational — Gmail's UID for the draft)
  notes             text,
  researched_at     timestamptz DEFAULT now(),
  drafted_at        timestamptz,
  sent_at           timestamptz,
  linked_at         timestamptz,
  created_at        timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS backlink_targets_url_uniq
  ON public.backlink_targets (url);

CREATE INDEX IF NOT EXISTS backlink_targets_status_idx
  ON public.backlink_targets (status, created_at DESC);

CREATE INDEX IF NOT EXISTS backlink_targets_domain_idx
  ON public.backlink_targets (domain);
