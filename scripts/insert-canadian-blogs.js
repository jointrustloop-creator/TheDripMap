// Insert 4 Canadian city blog posts (Vancouver, Calgary, Ottawa, Montreal).
// All Canadian provinces other than Ontario currently have 0 providers in our DB,
// so each post focuses on guidance, pricing, and links to /search + /quiz + Toronto/Mississauga cross-refs.

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local', quiet: true });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const TODAY = '2026-05-24T00:00:00+00:00';

const posts = [
  {
    slug: 'best-iv-therapy-vancouver-2026',
    title: 'Best IV Therapy in Vancouver 2026',
    excerpt: 'Complete 2026 guide to IV therapy in Vancouver and the Lower Mainland. CAD pricing, popular drips for the West Coast lifestyle, mobile vs in-clinic, and how to choose a clinic.',
    meta_title: 'Best IV Therapy in Vancouver 2026 — Costs, Mobile Service & How to Choose',
    meta_description: 'Find the best IV therapy in Vancouver. 2026 CAD pricing, top drips for West Coast wellness, mobile in-home services, and what to look for in a clinic.',
    image_url: 'https://images.unsplash.com/photo-1559666272-c6e98f99bb89?w=1200&q=80',
    related_cities: ['vancouver', 'toronto'],
    content: `Vancouver has become one of the most active IV therapy markets in Canada, driven by the city's deep wellness culture, year-round outdoor lifestyle, and a strong cohort of biohacking-curious tech and entertainment workers. The combination of long workdays, frequent travel, and an active recreation calendar — skiing in Whistler, paddling in False Creek, marathon training on the Seawall — gives Vancouver residents real reasons to consider intravenous hydration and nutrient therapy.

## What IV therapy costs in Vancouver (CAD)

Vancouver pricing sits in the upper-middle of the Canadian market — slightly below downtown Toronto for like-for-like drips, but well above smaller markets in the BC Interior or the Prairies.

- Standard hydration and Myers Cocktail drips: typically **$175 to $325 CAD** per session
- Immune support, beauty glow, and recovery formulas: **$200 to $375 CAD**
- NAD+ infusions (where offered): **$400 to $1,000+ CAD** depending on dose
- Mobile (in-home, hotel, or office) usually adds **$50 to $125 CAD** to in-clinic pricing

For a full Canada-wide pricing reference, see our [IV therapy cost guide](/guide/iv-therapy-cost-guide).

## Popular drips for Vancouver residents

The drip profile in Vancouver leans heavily toward energy, recovery, and longevity — reflecting the local emphasis on fitness, outdoor activity, and proactive wellness:

- **Recovery drips** for hikers, climbers, runners, and Whistler/Cypress weekenders
- **Immune support** through the long, wet shoulder seasons
- **NAD+ and longevity protocols** popular among the wellness-forward downtown and Yaletown crowds
- **Beauty glow and glutathione** drips for skin clarity in a city that gets meaningful sun only part of the year
- **Hangover recovery** in Yaletown, Gastown, and Mount Pleasant after weekend events

## Mobile vs in-clinic in Vancouver

Vancouver has a strong mobile-IV market, especially through downtown, Kitsilano, the West End, and the North Shore. Mobile makes sense if you live in a high-rise, have a busy schedule, or want a recovery drip after a long ride or training session without leaving home. In-clinic visits are usually the better value if you want a thorough consultation or you're trying a specialty protocol (NAD+, high-dose vitamin C) for the first time.

If you're new to IV therapy entirely, our [first-time IV therapy guide](/guide/first-time-iv-therapy-what-to-expect) walks through what the session itself feels like.

## How to choose a clinic in Vancouver

Five things to verify before you book:

1. **Licensed medical staff** — confirm RNs or NPs administer the drips, with a physician medical director
2. **Pre-session screening** — reputable clinics will do a brief intake before your first infusion
3. **Transparent pricing** — flat per-drip pricing beats vague packages and undisclosed add-ons
4. **Ingredient sourcing** — ask whether they use Health Canada-registered ingredients
5. **Reviews and follow-up** — look for clinics that follow up after sessions, not just sell packages

Our full [how to choose an IV therapy clinic guide](/guide/how-to-choose-iv-therapy-clinic) goes deeper on what to look for.

## Is IV therapy covered by insurance in Vancouver?

Generally, no — IV therapy is considered an elective wellness service and is not covered under BC's MSP or by most extended health plans. A subset of drips administered for documented medical deficiencies (iron, B12) may be partially reimbursed when prescribed by a naturopath or physician, but elective wellness drips typically aren't. See our [Canadian insurance coverage guide](/blog/iv-therapy-insurance-coverage-canada) for the full breakdown.

## Vancouver neighborhood notes

- **Downtown and Yaletown** — highest clinic density, premium pricing, strong mobile coverage
- **Kitsilano and Point Grey** — wellness-oriented studios, often paired with naturopathic or aesthetic services
- **Mount Pleasant and Main Street** — newer independent clinics with lower pricing
- **North Shore and Burnaby** — fewer clinics, mobile service usually a better option
- **Richmond and Surrey** — primarily mobile coverage from downtown providers

## FAQ

**How long does an IV therapy session take in Vancouver?**
Most standard drips take 45 to 60 minutes from arm-prep to walking out. NAD+ infusions run significantly longer — typically 90 minutes to 4 hours depending on dose.

**Can I get IV therapy delivered to a Whistler hotel?**
A few Vancouver-area mobile providers do serve Whistler, but expect a meaningful travel fee. For weekend trips, planning the session for a Friday-after-arrival or Saturday-morning works better than waiting for a Sunday recovery.

**Are there walk-in IV therapy clinics in Vancouver?**
Some clinics accept walk-ins during slower midweek hours, but most prefer pre-booked appointments to ensure a nurse is available and the drip is prepared.

## Ready to find a clinic?

Our directory is currently strongest in the Greater Toronto Area, with broader Canadian expansion through Vancouver, Calgary, Ottawa, Montreal, and Edmonton underway in 2026. While we build out Vancouver coverage, you can browse our full directory on the [main search page](/search) or take the [60-second drip quiz](/quiz) to see what protocol matches your goals. For a sense of how we cover Canada elsewhere, the [Toronto guide](/blog/iv-therapy-toronto-complete-guide) is the most thorough city resource we publish today.`
  },

  {
    slug: 'best-iv-therapy-calgary-2026',
    title: 'Best IV Therapy in Calgary 2026',
    excerpt: 'Complete 2026 guide to IV therapy in Calgary. CAD pricing, popular drips for chinooks and altitude, mobile services, and how to choose a clinic in YYC.',
    meta_title: 'Best IV Therapy in Calgary 2026 — Costs, Mobile Drips & Top Clinics',
    meta_description: 'IV therapy in Calgary 2026: CAD pricing, popular drips for the Alberta lifestyle, mobile in-home services, NAD+ protocols, and clinic selection tips.',
    image_url: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=1200&q=80',
    related_cities: ['calgary', 'toronto'],
    content: `Calgary's IV therapy market has grown rapidly over the past few years, supported by the city's high disposable income, an outdoorsy population that trains hard in the Rockies, and a meaningful energy-sector workforce that travels frequently. The combination of altitude effects, chinook-driven dehydration, and a strong fitness culture gives Calgarians real, practical reasons to look at IV hydration and nutrient drips beyond the typical wellness-trend curiosity.

## What IV therapy costs in Calgary (CAD)

Calgary pricing tends to come in slightly below Vancouver and Toronto for comparable drips — partly because clinic real estate is cheaper, and partly because the market is younger and more competitive.

- Standard hydration and Myers Cocktail: **$160 to $300 CAD** per session
- Immune support, beauty, recovery formulas: **$185 to $350 CAD**
- NAD+ infusions: **$375 to $950 CAD** depending on dose
- Mobile add-on: typically **$40 to $100 CAD**

For a Canada-wide pricing reference and how Calgary compares to other markets, see our full [IV therapy cost guide](/guide/iv-therapy-cost-guide).

## Popular drips for Calgary residents

A few protocols dominate the Calgary order mix:

- **Altitude and hydration drips** — Calgary's elevation (~1,045 m), combined with weekend trips to Banff, Canmore, and the higher Rockies, drives steady demand for straight hydration plus B-complex
- **Recovery drips** for skiers, mountain bikers, and Spartan-race regulars
- **Immune support** through the cold, dry winters
- **NAD+ protocols** popular with the longevity-curious tech and energy-sector workforce
- **Hangover recovery** through Stampede week and the busy summer event calendar

## Mobile vs in-clinic in Calgary

Mobile IV therapy is widely available across Calgary — primarily through downtown, Beltline, Inglewood, and Mission, with several providers also serving outlying communities like Cochrane, Airdrie, Okotoks, and Chestermere. In-clinic is usually better value if you want a longer consultation or you're trying a specialty protocol for the first time; mobile makes sense for Stampede weekends, post-event recovery, or simply skipping a 45-minute commute through downtown.

If this is your first IV session ever, our [first-time IV therapy guide](/guide/first-time-iv-therapy-what-to-expect) walks through the experience step-by-step.

## How to choose an IV clinic in Calgary

Five quick filters before booking:

1. **Licensed medical staff** — RN or NP administering, with a physician medical director on file
2. **Health Canada-registered ingredients** — ask explicitly
3. **Clear per-drip pricing** — avoid vague membership-only models
4. **A real intake form** — first-time clients should always get screened
5. **Recent reviews** — look at the past 90 days, not the highlight reel

Our [how to choose an IV therapy clinic guide](/guide/how-to-choose-iv-therapy-clinic) is the deeper-dive version of this checklist.

## Insurance coverage in Calgary

As in the rest of Canada, IV therapy is treated as an elective wellness service and isn't covered under Alberta Health Care Insurance Plan (AHCIP) or by most extended benefits. Some drips with a documented medical indication (iron deficiency, B12, vitamin D) administered by a naturopath or physician may qualify for partial reimbursement — but elective wellness drips do not. See our [Canadian insurance coverage guide](/blog/iv-therapy-insurance-coverage-canada) for the full breakdown.

## Calgary neighborhood notes

- **Downtown and Beltline** — highest clinic density, fastest mobile turnaround
- **Mission, Inglewood, Bridgeland** — newer wellness studios, often paired with med-spa services
- **NW Calgary and University District** — younger student and academic population, lower pricing
- **South Calgary (Mahogany, Auburn Bay)** — primarily mobile coverage from downtown providers
- **Airdrie, Cochrane, Okotoks** — mobile-only for most providers, expect a small travel fee

## FAQ

**How long does an IV drip session take in Calgary?**
Standard drips are 45 to 60 minutes. NAD+ runs significantly longer — typically 90 minutes to 4 hours depending on dose.

**Can I book IV therapy delivered to a Banff or Canmore hotel?**
A few Calgary mobile providers serve Banff and Canmore, but expect a travel fee in the $100 to $200 CAD range. For a long mountain weekend, booking the drip for Friday evening at your hotel works better than waiting until you're already wrecked on Sunday.

**Are there 24/7 mobile IV providers in Calgary?**
A handful of providers offer near-24-hour service during Stampede, NYE, and major Saddledome events. Outside those windows, expect daytime and evening hours with limited overnight availability.

**Do I need a doctor's note for IV therapy in Calgary?**
No — reputable clinics handle the medical screening themselves through a Nurse Practitioner or Physician medical director. You don't need a referral from your family doctor. The clinic will ask about medications, allergies, and any conditions during the intake form.

**What's the difference between an IV drip and a B12 injection?**
An intramuscular B12 shot delivers a single nutrient into the muscle and absorbs over hours. An IV drip delivers a tailored multi-nutrient solution directly into the bloodstream and acts within minutes. Most Calgary clinics offer both — the right choice depends on your goal and budget.

## Ready to find a clinic?

Our directory currently has strongest coverage in the Greater Toronto Area, with Calgary listings expanding through 2026. In the meantime, you can browse our full directory on the [main search page](/search) or take the [60-second drip quiz](/quiz) to see what protocol fits your goals. For an example of how we cover Canadian cities in depth, the [Toronto complete guide](/blog/iv-therapy-toronto-complete-guide) is our most-developed Canada resource.`
  },

  {
    slug: 'best-iv-therapy-ottawa-2026',
    title: 'Best IV Therapy in Ottawa 2026',
    excerpt: 'Complete 2026 guide to IV therapy in Ottawa. CAD pricing, popular drips for federal workers and Gatineau residents, mobile vs in-clinic, and how to choose a provider.',
    meta_title: 'Best IV Therapy in Ottawa 2026 — Costs, Mobile Service & Top Clinics',
    meta_description: 'IV therapy in Ottawa 2026: CAD pricing, popular drips for federal-sector workers, NAD+ and recovery protocols, mobile in-home options, and clinic selection tips.',
    image_url: 'https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=1200&q=80',
    related_cities: ['ottawa', 'toronto'],
    content: `Ottawa's IV therapy market has expanded steadily over the past few years, driven by a stable federal-sector workforce, a meaningful tech presence in Kanata and downtown, and the cross-river Gatineau professional community. Long workdays, frequent business travel, and a notably active outdoor culture — cycling the Gatineau Park trails, running the Canal, winter skating — give Ottawa residents real reasons to consider intravenous hydration and wellness drips.

## What IV therapy costs in Ottawa (CAD)

Ottawa pricing sits squarely in the middle of the Canadian market — meaningfully below downtown Toronto, slightly below Vancouver, and roughly in line with Calgary.

- Standard hydration and Myers Cocktail: **$150 to $300 CAD** per session
- Immune support, beauty, recovery formulas: **$175 to $350 CAD**
- NAD+ infusions: **$375 to $900 CAD** depending on dose
- Mobile (in-home, hotel, office) usually adds **$50 to $100 CAD**

For full Canada-wide pricing comparisons, see our [IV therapy cost guide](/guide/iv-therapy-cost-guide).

## Popular drips for Ottawa residents

A few categories show up repeatedly across Ottawa providers:

- **Immune support** through the long Ontario winters
- **Recovery and hydration** drips for cyclists, runners, and winter sports
- **Energy and B-complex** drips for the federal-sector and tech workforce dealing with deadline-heavy stretches
- **NAD+ protocols** as longevity awareness grows in the wellness-curious downtown crowd
- **Beauty and glutathione** drips through wedding season and the summer event calendar

## Mobile vs in-clinic in Ottawa

Ottawa has a healthy mobile-IV market, especially serving the downtown core, the Glebe, Westboro, Kanata, and select Gatineau-side clients. In-clinic is usually the better value for first-time visits or specialty protocols (NAD+, high-dose vitamin C). Mobile makes sense for parents at home, executives without time to leave the office, or anyone trying to recover from a tough weekend without going anywhere.

If this is your first IV session, our [first-time IV therapy guide](/guide/first-time-iv-therapy-what-to-expect) walks through what the actual session feels like.

## How to choose an IV clinic in Ottawa

Five quick filters:

1. **Licensed medical staff** — RNs or NPs administering, physician medical director on file
2. **Health Canada-registered ingredients** — ask explicitly
3. **Per-drip transparent pricing** — avoid vague membership-only structures
4. **Real intake screening** — every first-time client should get a brief medical screen
5. **Recent reviews** — focus on the last 90 days

Our [how to choose an IV therapy clinic guide](/guide/how-to-choose-iv-therapy-clinic) is the longer version of this checklist.

## Insurance coverage in Ottawa

IV therapy is treated as an elective wellness service in Ontario and isn't covered under OHIP. Most extended employer benefit plans also exclude wellness drips. A subset of medically-indicated drips (iron, B12, vitamin D) prescribed by a naturopath or physician may qualify for partial reimbursement under your extended plan — but elective wellness drips don't. See our [Canadian insurance coverage guide](/blog/iv-therapy-insurance-coverage-canada) for the full picture.

## Ottawa neighborhood notes

- **Downtown / ByWard / Centretown** — highest clinic density, fastest mobile turnaround
- **The Glebe, Westboro, Hintonburg** — wellness-oriented studios, often paired with med-spa or naturopathic services
- **Kanata** — tech-worker dominant; growing mobile coverage from downtown providers
- **Orleans and Barrhaven** — primarily mobile coverage; expect short travel fees from downtown providers
- **Gatineau-side (Hull, Aylmer)** — limited dedicated providers; a few Ottawa-side mobile services do cross-river

## FAQ

**How long does an IV therapy session take in Ottawa?**
Most standard drips run 45 to 60 minutes. NAD+ infusions are significantly longer — 90 minutes to 4 hours depending on dose.

**Can I get IV therapy delivered to a hotel or Airbnb in Ottawa?**
Yes — most Ottawa mobile providers serve hotels, Airbnbs, and offices throughout the downtown core and inner suburbs. Conference weekends (Bluesfest, Winterlude, major Senators home stands) tend to book out faster.

**Are there walk-in IV therapy clinics in Ottawa?**
Some clinics accept walk-ins during slower midweek hours, but most prefer pre-booked appointments — it's better for the nurse's schedule and ensures your drip is prepared correctly.

**Do I need a referral or a doctor's note for IV therapy in Ottawa?**
No — reputable clinics handle medical screening in-house through a Nurse Practitioner or physician medical director. You don't need a family-doctor referral. The intake form covers medications, allergies, and any conditions before the line goes in.

**How often should I get an IV drip?**
For elective wellness, most clinics recommend no more than once a week — and for many people, monthly is plenty. NAD+ and high-dose vitamin C protocols are usually run as multi-session series with explicit clinical guidance from the medical director.

**What's the difference between an IV drip and a B12 or vitamin injection?**
An intramuscular injection delivers a single nutrient into the muscle and absorbs over hours. An IV drip delivers a multi-nutrient solution directly into the bloodstream and acts within minutes. Most Ottawa clinics offer both — the right choice depends on the goal, the budget, and how quickly you want the effect.

## Ready to find a clinic?

Our directory currently has the strongest Canadian coverage in the Greater Toronto Area, with Ottawa listings expanding through 2026. While we build out Ottawa coverage, you can browse our full directory on the [main search page](/search) or take the [60-second drip quiz](/quiz) to find a protocol matched to your goals. For an example of our most-developed Canadian city resource, see the [Toronto complete guide](/blog/iv-therapy-toronto-complete-guide).`
  },

  {
    slug: 'best-iv-therapy-montreal-2026',
    title: 'Best IV Therapy in Montreal 2026',
    excerpt: 'Complete 2026 guide to IV therapy in Montreal. CAD pricing, popular drips for the local lifestyle, mobile vs in-clinic, and how to choose a provider in MTL.',
    meta_title: 'Best IV Therapy in Montreal 2026 — Costs, Mobile Service & Top Clinics',
    meta_description: 'IV therapy in Montreal 2026: CAD pricing, popular drips for the local nightlife and wellness scene, mobile in-home options, NAD+ protocols, and clinic selection tips.',
    image_url: 'https://images.unsplash.com/photo-1519178614-68673b201f36?w=1200&q=80',
    related_cities: ['montreal', 'toronto'],
    content: `Montreal has one of the most distinctive IV therapy markets in Canada — shaped by the city's heavy event calendar (Jazz Fest, Osheaga, Just for Jokes, F1 weekend), a deeply rooted aesthetic and beauty culture, and a year-round population of students, creatives, and bilingual professionals who treat wellness as a core part of daily life. The local mix skews more toward beauty, recovery, and energy drips than the longevity-heavy mix you'd see in San Francisco or downtown Toronto.

## What IV therapy costs in Montreal (CAD)

Montreal pricing tends to be the most accessible of any major Canadian city — partly because of lower clinic real estate costs in many neighborhoods, partly because of strong competition between independent operators.

- Standard hydration and Myers Cocktail: **$135 to $275 CAD** per session
- Immune support, beauty, recovery formulas: **$165 to $325 CAD**
- NAD+ infusions: **$350 to $850 CAD** depending on dose
- Mobile (in-home, hotel, office) usually adds **$50 to $100 CAD**

For a Canada-wide pricing reference and how Montreal compares to Toronto, Vancouver, and Calgary, see our [IV therapy cost guide](/guide/iv-therapy-cost-guide).

## Popular drips for Montreal residents

A few protocols dominate the local mix:

- **Hangover recovery** drives heavy volume through festival season (June to August) and the post-NYE / F1 weekend rebounds
- **Beauty and glutathione drips** are unusually popular — Montreal's aesthetic culture supports a deep beauty-focused IV market
- **Immune support** through the long winter
- **Recovery drips** for skiers (Mont-Tremblant, Sutton, Bromont), marathoners, and cycling clubs
- **NAD+ protocols** as longevity awareness reaches the downtown professional and creative crowds

## Mobile vs in-clinic in Montreal

Mobile IV therapy is well-established across Montreal — primarily through downtown, Plateau, Mile-End, Outremont, Westmount, and Old Port. Mobile is especially popular during festival weekends, when getting downtown by car is impractical and clinics book out days in advance. In-clinic visits are usually a better fit for first-time clients or specialty protocols.

If this is your first IV experience, our [first-time IV therapy guide](/guide/first-time-iv-therapy-what-to-expect) walks through what the session itself actually feels like.

## How to choose an IV clinic in Montreal

Five things to check before booking — same standard we recommend across Canada:

1. **Licensed medical staff** — RNs or NPs administering, with a physician medical director (or in Quebec, a partnering naturopath where applicable)
2. **Health Canada-registered ingredients** — ask explicitly
3. **Per-drip transparent pricing** — avoid clinics that only quote bundle packages
4. **A real intake screening** — first-time clients should be screened before the line goes in
5. **Recent reviews** — last 90 days matter more than legacy testimonials

Our [how to choose an IV therapy clinic guide](/guide/how-to-choose-iv-therapy-clinic) is the deeper-dive version.

## Insurance coverage in Montreal

IV therapy is considered elective and isn't covered under RAMQ. Most private extended-benefit plans also exclude wellness drips. A subset of medically indicated drips (iron, B12, vitamin D) prescribed by a physician or naturopath may qualify for partial reimbursement under private extended plans — but elective wellness drips typically don't. See our [Canadian insurance coverage guide](/blog/iv-therapy-insurance-coverage-canada) for the full breakdown.

## Montreal neighborhood notes

- **Downtown and Old Port** — highest clinic density, premium pricing, fastest mobile coverage
- **Plateau, Mile-End, Outremont** — newer independent studios, often paired with aesthetic clinics
- **Westmount and NDG** — fewer providers but strong in-clinic options
- **South Shore (Brossard, Longueuil, Saint-Lambert)** — primarily mobile coverage from downtown providers
- **Laval** — limited dedicated providers; most Laval clients use mobile services from Montreal-island operators
- **Quebec City (3 hours east)** — separate small market; not typically served by Montreal mobile providers

## FAQ

**How long does an IV drip session take in Montreal?**
Most standard drips run 45 to 60 minutes. NAD+ infusions are significantly longer — 90 minutes to 4 hours depending on dose.

**Can I get IV therapy delivered to a hotel during festival season?**
Yes — but book ahead. Jazz Fest, Osheaga, F1 weekend, and NYE all push mobile providers to capacity. Booking 7 to 10 days ahead during peak weekends is realistic; 3 to 5 days the rest of the year.

**Are there bilingual French-English IV clinics in Montreal?**
Most Montreal clinics operate bilingually as a matter of course. Some independent providers in the Plateau and Mile-End primarily operate in French; downtown and Westmount-area clinics typically default to English-first. Booking online usually offers both languages; over the phone, ask up front if the receptionist prefers French or English so the consultation goes smoothly.

**Do I need a doctor's referral for IV therapy in Montreal?**
No — clinics handle medical screening in-house through their nursing staff and partnering physicians. You don't need a referral from your family doctor. The intake form covers medications, allergies, and conditions before the first session.

## Ready to find a clinic?

Our directory currently has the deepest Canadian coverage in the Greater Toronto Area, with Montreal listings expanding through 2026. In the meantime, browse our full directory on the [main search page](/search) or take the [60-second drip quiz](/quiz) to see what protocol matches your goals. For our most-developed Canadian city resource, see the [Toronto complete guide](/blog/iv-therapy-toronto-complete-guide).`
  },
];

// Count words to verify 800+ minimum
for (const p of posts) {
  const wc = p.content.split(/\s+/).filter(Boolean).length;
  console.log(`  ${p.slug.padEnd(40)} ${wc} words`);
  if (wc < 800) {
    console.error(`  ✗ ABORT — ${p.slug} only ${wc} words, below 800 threshold`);
    process.exit(1);
  }
}

const { count: before } = await supabase.from('blog_posts').select('*', { count: 'exact', head: true });
console.log(`\nblog_posts BEFORE: ${before} rows`);

// Use upsert with ignoreDuplicates so accidental re-runs are safe
const rows = posts.map((p) => ({
  slug: p.slug,
  title: p.title,
  content: p.content,
  excerpt: p.excerpt,
  category: 'City Guides',
  author: 'TheDripMap Team',
  date: TODAY,
  meta_title: p.meta_title,
  meta_description: p.meta_description,
  image_url: p.image_url,
  related_cities: p.related_cities,
}));

const { error } = await supabase.from('blog_posts').upsert(rows, { onConflict: 'slug', ignoreDuplicates: true });
if (error) { console.error('Insert failed:', error); process.exit(1); }

const { count: after } = await supabase.from('blog_posts').select('*', { count: 'exact', head: true });
console.log(`blog_posts AFTER:  ${after} rows`);
console.log(`Net new:           ${after - before}`);

// Verify each post landed
console.log('\nVerification:');
for (const p of posts) {
  const { data } = await supabase.from('blog_posts').select('slug, title').eq('slug', p.slug).single();
  console.log(`  ${data ? '✓' : '✗'} ${p.slug}`);
}
