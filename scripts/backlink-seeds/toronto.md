# Toronto + GTA backlink seed list

Curated Canada-priority backlink prospects per the 2026-06-06 Search
Console pivot. Canada CTR is 16x the US, and the Toronto/GTA pages
(/blog/mobile-iv-therapy-toronto-gta pos 12, /blog/iv-therapy-mississauga
pos 21, /cities/toronto pos 52 with room to climb, /cities/ontario pos
11) are the ones we want backlinks pointing at.

Five target_type buckets matching the templates in
`src/lib/backlink-templates.ts`. NYC types stay registered but parked
per operator brief.

This is a research seed, not a contact list. Real contact emails get
researched at the moment of outreach. We never fabricate aliases.

Pitch destinations (in order of current rank, strongest first):

- https://www.thedripmap.com/blog/iv-therapy-insurance-coverage-canada (pos 7)
- https://www.thedripmap.com/cities/ontario (pos 11)
- https://www.thedripmap.com/blog/mobile-iv-therapy-toronto-gta (pos 12)
- https://www.thedripmap.com/blog/iv-therapy-mississauga (pos 21)
- https://www.thedripmap.com/cities/toronto (pos 52, climbing)
- https://www.thedripmap.com/blog/who-can-legally-give-iv-canada-rules-by-province-2026 (regulator pillar)

---

## 1. toronto_wellness_blog

Toronto-anchored city + lifestyle publications with editorial sections
that cover wellness, recovery, beauty, biohacking.

Research starting points:
  - BlogTO (wellness/lifestyle vertical)
  - Toronto Life (wellness, health)
  - Daily Hive Toronto
  - Narcity Toronto
  - Now Toronto
  - Curiocity Toronto
  - Streets of Toronto
  - Toronto.com
  - Inside Toronto
  - View The Vibe
  - Slice of Toronto
  - Cult MTL (cross-Canada but with Toronto coverage)
  - Reader's Digest Canada (Toronto features)

What to research per target before outreach:
  - A real article from the last 90 days touching IV therapy, recovery,
    hangover cures, biohacking, NAD+, longevity, post-flight wellness,
    cold + flu IV.
  - The byline author's contact (their public email or pitches@) — never
    a guessed alias.
  - Whether the site has a resources page where local guides get linked.

## 2. toronto_local_press

Toronto-area newspapers, online dailies, neighborhood publications.
Less authority than the national wellness press, but very relevant for
local intent ranking.

Research starting points:
  - Toronto Star (lifestyle section)
  - National Post (Toronto features)
  - The Globe and Mail (Toronto bureau)
  - CityNews Toronto
  - CBC Toronto
  - CTV News Toronto
  - 680News
  - Toronto Sun (Toronto)
  - The Globe and Mail Style section
  - Bridle Path Times
  - Bay Street Bull
  - Post City Magazines (multiple Toronto neighborhoods)

What to research per target before outreach:
  - A specific recent article that touched IV therapy, hangovers, or GTA
    wellness — the pitch needs a real article hook.
  - The byline author's direct email if public, otherwise the publication's
    tips/pitches inbox.

## 3. gta_fitness_studio

GTA fitness studios, gyms, recovery centers with active blog/editorial
sections. Members are exactly the people asking about IV recovery.

Research starting points:
  - Equinox Toronto (Furthermore Toronto coverage)
  - SoulCycle (when active in Toronto)
  - F45 Training studios across GTA
  - Orangetheory Fitness GTA
  - Barry's Bootcamp Toronto
  - Studio Lagree Toronto
  - Misfit Studio
  - Move Your Mountain (yoga)
  - Sweat and Tonic
  - Spin Society
  - Toronto Hot Yoga
  - Yyoga Toronto
  - Iron + Earth Strength
  - Tonic Yoga
  - Rebel Soul (cycling)
  - Various CrossFit boxes (CrossFit Yorkville, CrossFit Toronto, etc.)
  - Recovery-focused studios: Othership, Hammam Spa, Steam Whistle Spa
  - Mile2Marathon (running)

What to research per target before outreach:
  - Whether they publish a recovery / wellness roundup post.
  - Right contact: community manager, marketing lead, or owner, not a
    generic info@.

## 4. canada_naturopathic_assoc

Canadian naturopathic associations and provincial colleges with
patient-facing resource pages. These have high authority (.org / .ca)
and patients trust their referrals.

Research starting points:
  - Canadian Association of Naturopathic Doctors (CAND.ca)
  - Ontario Association of Naturopathic Doctors (OAND.org)
  - College of Naturopaths of Ontario (CONO.on.ca) — patient resources page
  - BC Naturopathic Association (BCNA.ca)
  - College of Complementary Health Professionals of BC (CCHPBC) — public
    registry / patient guidance
  - Alberta Association of Naturopathic Doctors (AAND.ca)
  - Naturopathic Association of Saskatchewan
  - Manitoba Naturopathic Association
  - College of Naturopaths of Alberta (CNDA)
  - The CCNM (Canadian College of Naturopathic Medicine) public resources
  - Boucher Institute of Naturopathic Medicine

What to research per target before outreach:
  - Whether the org maintains a patient-facing resource list (often the
    "find a ND" + "learn more" pages link out).
  - The communications or patient education lead — usually listed on the
    About / Staff page.
  - Cite the CONO (Ontario) and CCHPBC (BC) authorities in the pitch so
    the regulator naming is accurate.

## 5. toronto_corporate_wellness

Corporate wellness consultancies, benefits brokers, and Toronto employer
HR resource lists.

Research starting points:
  - LifeWorks (now TELUS Health)
  - Inkblot Therapy
  - HSI Group Canada
  - Modern Health (Canadian arm)
  - Headversity
  - Workhuman Canada
  - Toronto Region Board of Trade — member resources
  - Toronto Workplace Wellness Network
  - HR consultancies: Mercer Canada (Toronto), Aon Canada (Toronto),
    Buck Canada
  - Vancity Community Investment Bank wellness resources (national)

What to research per target before outreach:
  - Whether they maintain a vetted vendor resource list for clients (the
    link target).
  - Benefits or wellness program lead — LinkedIn is usually the starting
    point.
  - Reciprocal opportunity: many of these will accept a partner exchange.

---

## Workflow

1. Pick a target_type bucket from above.
2. Find a real recent article + the real contact (manually, not from this file).
3. Insert a row into `backlink_targets` with target_type = the matching
   toronto_* / gta_* / canada_naturopathic_assoc key, page_title,
   contact_name, contact_email, article_to_pitch (one of the Canadian
   pitch destinations above), reason, status='researched'.
4. The drafts cron will pick it up, render the matching template, and
   queue a Gmail draft for review.
5. Send manually from Gmail. Mark sent / replied / linked in /admin/backlinks.

## What's deliberately NOT in this file

- Contact emails. We don't invent them. Bad emails poison reputation.
- Specific article URLs to pitch. They go stale fast.
- Outreach send automation. Canadian backlink outreach is manual by
  design — one bad pitch from a generic template scorches a publication
  you can't pitch again for a year.

The auto-research cron does NOT rotate the toronto_* / gta_* /
canada_naturopathic_assoc / vancouver_* types — they are inserted only
by an operator after manual research. The AUTO_RESEARCH_TYPES subset in
`src/lib/backlink-templates.ts` keeps the same B2B-only allowlist
(nursing_school, healthcare_law, wellness_publication, nurse_entrepreneur,
medical_director_match) it used before this pivot.
