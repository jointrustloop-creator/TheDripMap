# NYC backlink seed list

Curated NYC-relevant link prospects for the patient-side flywheel. Five
target_type buckets matching the templates in `src/lib/backlink-templates.ts`.

This is a research seed, not a contact list. The actual contact email and
the specific recent article must be researched at the moment of outreach,
not pre-filled here — that's the human step. Bad contact data poisons send
reputation, so we never fabricate.

The pitch from all five buckets points patients at:

- https://www.thedripmap.com/blog/best-iv-therapy-new-york-2026
- https://www.thedripmap.com/cities/new-york

If either of those pages weakens (gets thin, falls behind), the whole NYC
flywheel weakens. They're the single point of failure. Audit them quarterly.

---

## 1. nyc_wellness_blog

City-level health and wellness publications with editorial coverage of
recovery, biohacking, beauty, and lifestyle. They link to credible
city-specific guides when the pitch is honest and the resource is real.

Research starting points:

- Well+Good (national, but actively covers NYC). Wellness editors,
  contributing freelancers.
- Mindbodygreen (national, NYC contributors active).
- NYMag's The Strategist (wellness section).
- The Cut (wellness vertical).
- Greatist (now Healthline, but historical NYC roundups).
- Apartment Therapy NY wellness coverage.
- Goop (NYC features).
- Outside Magazine + Outside Online (recovery + NYC fitness).
- The Highlight by Vox (longform wellness pieces with NYC reporting).

What to research per target before outreach:
  - A recent (last 90 days) article that touches IV therapy, recovery,
    hangovers, biohacking, post-flight wellness, or boutique health in NYC.
  - The byline author's contact (their public email or the publication's
    pitches@ inbox, not a guessed alias).
  - Whether they have a resources page where guides get linked.

## 2. nyc_fitness_studio

Studios and gyms with active blog/editorial sections, especially those
that talk about recovery to their members. The pitch is "your members
already ask about IV recovery, here's a vetted city-specific resource."

Research starting points:

- Equinox (Furthermore by Equinox is their editorial arm).
- SoulCycle (community blog).
- CorePower Yoga NYC locations (blog).
- Y7 Studio (boutique yoga).
- Solidcore (boutique strength) NYC.
- Tone House (HIIT) NYC.
- Barry's Bootcamp NYC blog.
- Bandier (active lifestyle retail) editorial.
- F45 NYC affiliate sites.
- Mile High Run Club blog.
- Tracy Anderson Method NYC.

What to research per target before outreach:
  - Whether they publish a recovery / wellness roundup post that could
    accommodate a citation.
  - The right contact (community manager, marketing lead, or studio owner,
    not a generic info@ which goes nowhere).
  - Whether they would accept a partner content swap (link us, we add
    their studio to a "best NYC recovery routine" follow-up post).

## 3. nyc_hospitality_concierge

NYC hotels and concierge networks. Many guests ask the concierge desk
about in-room recovery treatments after late flights, conferences, or big
nights out. A vetted clinic list is a real concierge tool.

Research starting points:

- Les Clefs d'Or USA (concierge association).
- Hotel concierge teams at: The Standard NYC, The Bowery Hotel, The
  William Vale, 1 Hotel Brooklyn Bridge, The Greenwich Hotel, The Plaza,
  The Mark, The Carlyle.
- Boutique hotel groups: Sydell Group, ENNISMORE, Highgate NYC properties.
- Hotel wellness program managers (more useful than info@).
- Conference center concierge desks (Javits area hotels).

What to research per target before outreach:
  - The right point of contact: concierge desk supervisor, lifestyle
    director, or wellness program manager.
  - Whether the hotel offers a "wellness" or "recovery" guest amenities
    list where a curated clinic link could be added.
  - For boutique groups, whether they centralize guest-facing resources
    in a portal.

## 4. nyc_local_press

NYC newspapers, online publications, neighborhood blogs, and lifestyle
verticals. Lighter on link DA than national wellness pubs, but very
relevant for local SEO signals.

Research starting points:

- Curbed New York (lifestyle reporting).
- The Cut.
- Time Out New York (recovery + nightlife coverage).
- Gothamist.
- AM New York (amny.com).
- New York Family.
- Bedford + Bowery.
- Brokelyn.
- Brick Underground.
- New York Post lifestyle section.
- Brooklyn Magazine.
- Patch.com (per-neighborhood editions).

What to research per target before outreach:
  - A specific recent article that touched IV therapy, hangovers,
    biohacking, or NYC recovery. (Without a real article hook, the
    pitch reads as spam.)
  - The byline author's direct email if it's public, otherwise the
    publication's tips/pitches inbox.

## 5. nyc_corporate_wellness

Companies that design or deliver corporate wellness programs for NYC
employers. Many add vetted vendor lists for clients (yoga instructors,
massage therapists, nutrition, and lately IV therapy too).

Research starting points:

- Modern Health.
- Vitality Group.
- Wellable.
- One Medical employer health (corporate side).
- Limeade.
- WellRight.
- NYC Health & Wellness consultants (independent practitioners).
- Wellness offices at large NYC employers (finance, law, consulting).
- HR benefits consultancies (Mercer, Aon, Buck) NYC offices.

What to research per target before outreach:
  - Whether the company maintains a vetted vendor resource list for
    clients (the link target).
  - The benefits or wellness program manager (LinkedIn is usually the
    starting point; never a guessed corporate alias).
  - Whether they want to be a referral resource the other direction
    (mutual exchange beats a one-way ask).

---

## Workflow

1. Pick a target_type bucket.
2. Open the seed list, pick a publication.
3. Find a real recent article + the real contact (manually, not from this file).
4. Insert a row into `backlink_targets` with: url, domain, target_type
   (one of the new nyc_* keys), page_title, contact_name, contact_email,
   article_to_pitch, reason, status='researched'.
5. The drafts cron will pick it up, render the matching template from
   `backlink-templates.ts`, and queue a Gmail draft for review.
6. Send manually from Gmail. Come back to /admin/backlinks and mark
   sent / replied / linked.

## What's deliberately NOT in this file

- Contact emails. We do not invent them. Bad emails poison reputation.
- Specific article URLs. They go stale fast and tempt sending generic
  pitches.
- Outreach send automation. Backlink outreach is manual by design — one
  bad pitch from a generic template scorches a publication you can't pitch
  again for a year.
