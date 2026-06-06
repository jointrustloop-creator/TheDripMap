# Vancouver + BC backlink seed list

Curated Canada-priority backlink prospects per the 2026-06-06 Search
Console pivot. Vancouver is a smaller share of current Canadian clicks
than Toronto, but BC has uncontested supply potential and the Canada
regulation pillar already ranks for BC-relevant queries.

Four target_type buckets matching the templates in
`src/lib/backlink-templates.ts`. Same honest-research design as
the Toronto + NYC seeds — no fabricated contact emails.

Pitch destinations (in order of relevance for BC patients):

- https://www.thedripmap.com/blog/who-can-legally-give-iv-canada-rules-by-province-2026 (regulator pillar, mentions CCHPBC + BCCNM directly)
- https://www.thedripmap.com/cities/vancouver (city hub)
- https://www.thedripmap.com/blog/iv-therapy-insurance-coverage-canada (cross-province insurance piece)

---

## 1. vancouver_wellness_blog

Vancouver and BC-anchored city + lifestyle publications with editorial
sections covering wellness, recovery, beauty, biohacking.

Research starting points:
  - Daily Hive Vancouver
  - Vancouver Magazine
  - Curiocity Vancouver
  - Narcity Vancouver
  - Vancouver Is Awesome
  - Scout Magazine
  - Inside Vancouver
  - Western Living Magazine
  - The Georgia Straight (wellness section)
  - BC Living
  - Pique Newsmagazine (Whistler corridor)
  - Montecristo Magazine

What to research per target before outreach:
  - A real article from the last 90 days touching IV therapy, recovery,
    biohacking, NAD+, longevity, naturopathic medicine, hangover cures.
  - The byline author's contact (their public email or pitches@) — never
    a guessed alias.
  - Whether the site has a resources page where local guides get linked.

## 2. vancouver_local_press

Vancouver-area newspapers, online dailies, BC publications.

Research starting points:
  - Vancouver Sun
  - The Province
  - CBC Vancouver
  - CTV News Vancouver
  - Global News BC
  - News 1130
  - Vancouver Free Press
  - Tyee (BC longform)
  - Business in Vancouver
  - The Globe and Mail Vancouver bureau
  - National Post BC features
  - Maclean's BC features

What to research per target before outreach:
  - A specific recent article that touched IV therapy, hangovers, or BC
    wellness.
  - The byline author's direct email if public, otherwise the
    publication's tips/pitches inbox.

## 3. vancouver_fitness_studio

Vancouver and Lower Mainland fitness studios, gyms, recovery centers.

Research starting points:
  - Yyoga Vancouver (multiple locations)
  - Equinox Vancouver
  - Steve Nash Fitness World (multiple)
  - Westside Barbell Vancouver
  - F45 Training studios across Greater Vancouver
  - Orangetheory Fitness Vancouver
  - Lagree West
  - Lululemon-affiliated studios (Sweat the Practice)
  - Recovery-focused: Hammam Spa, Miraj Hammam, The Bathhouse
  - Cold plunge / sauna: Othership (when expanded to Van), Float House
  - CrossFit Vancouver locations
  - Mile2Marathon (Van)
  - Distrikt Movement
  - Movement Performance Therapy

What to research per target before outreach:
  - Whether they publish a recovery / wellness roundup post.
  - Right contact: community manager, marketing lead, or owner, not
    a generic info@.

## 4. vancouver_corporate_wellness

Vancouver-based corporate wellness consultancies and BC employer
HR resource lists.

Research starting points:
  - TELUS Health (HQ in Vancouver area)
  - Inkblot Therapy
  - Modern Health (BC clients)
  - Greater Vancouver Board of Trade — member resources
  - Vancouver Workplace Wellness organizations
  - HR consultancies in Vancouver: Mercer Canada, Aon Canada, Buck
    Canada (BC offices)
  - Boutique BC HR firms

What to research per target before outreach:
  - Whether they maintain a vetted vendor resource list for clients.
  - Benefits or wellness program lead — LinkedIn is usually the starting
    point.

---

## Workflow

1. Pick a target_type bucket from above.
2. Find a real recent article + the real contact (manually, not from this file).
3. Insert a row into `backlink_targets` with target_type = the matching
   vancouver_* key, page_title, contact_name, contact_email,
   article_to_pitch (one of the BC pitch destinations above), reason,
   status='researched'.
4. The drafts cron will pick it up, render the matching template, and
   queue a Gmail draft for review.
5. Send manually from Gmail. Mark sent / replied / linked in /admin/backlinks.

## What's deliberately NOT in this file

- Contact emails. We don't invent them.
- Specific article URLs to pitch. They go stale fast.
- Outreach send automation.

The auto-research cron does NOT rotate the vancouver_* types — they are
inserted only by an operator after manual research. See
`src/lib/backlink-templates.ts` AUTO_RESEARCH_TYPES.

## Regulator naming reference (use exactly these, do not paraphrase)

- BC naturopathic physicians: **College of Complementary Health
  Professionals of BC (CCHPBC)**, with the IV infusion and chelation
  prescribing authority.
- BC registered nurses + nurse practitioners: **BC College of Nurses and
  Midwives (BCCNM)**.
- BC physicians: College of Physicians and Surgeons of BC (CPSBC).
