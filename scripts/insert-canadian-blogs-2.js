// Insert the remaining 2 Canadian blog posts:
//   - best-iv-therapy-edmonton-2026 (city guide)
//   - iv-therapy-canada-complete-guide-2026 (cross-province pillar)

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
    slug: 'best-iv-therapy-edmonton-2026',
    title: 'Best IV Therapy in Edmonton 2026',
    excerpt: 'Complete 2026 guide to IV therapy in Edmonton. CAD pricing, popular drips for the Alberta lifestyle, mobile vs in-clinic, and how to choose a clinic in YEG.',
    meta_title: 'Best IV Therapy in Edmonton 2026 — Costs, Mobile Drips & Top Clinics',
    meta_description: 'IV therapy in Edmonton 2026: CAD pricing, popular drips, mobile in-home services, NAD+ protocols, and clinic selection tips for YEG residents.',
    image_url: 'https://images.unsplash.com/photo-1551776235-dde6d4829808?w=1200&q=80',
    related_cities: ['edmonton', 'calgary', 'toronto'],
    content: `Edmonton has a steadily growing IV therapy market — smaller than Calgary by clinic count, but with a similar demand profile shaped by long Alberta winters, a strong oil-and-gas sector workforce, and an active recreation culture from river-valley running to weekend trips to Jasper. Demand has expanded notably since 2023 as more clinics opened across downtown, Strathcona, and the southwest, and as mobile providers extended coverage out to Sherwood Park, St. Albert, Leduc, and Spruce Grove.

## What IV therapy costs in Edmonton (CAD)

Edmonton pricing is close to Calgary — sometimes a touch lower because the clinic supply is thinner and the operators tend to be smaller independents rather than chain wellness brands.

- Standard hydration and Myers Cocktail: **$150 to $290 CAD** per session
- Immune support, beauty, recovery formulas: **$175 to $340 CAD**
- NAD+ infusions: **$375 to $925 CAD** depending on dose
- Mobile add-on: typically **$40 to $100 CAD**

For Canada-wide pricing comparisons across Toronto, Vancouver, Calgary, Ottawa, and Montreal, see our full [IV therapy cost guide](/guide/iv-therapy-cost-guide).

## Popular drips for Edmonton residents

A few protocols dominate the local mix:

- **Immune support drips** through the long, cold winters — Edmonton's winters are notably more severe than Vancouver's or Toronto's
- **Recovery drips** for skiers (Marmot Basin, Sunshine, Lake Louise), cyclists, and weekend warriors
- **Energy and B-complex drips** for the oil-and-gas workforce dealing with shift work and frequent travel
- **NAD+ protocols** popular with the longevity-curious downtown professional crowd
- **Hangover recovery** through the busy summer festival calendar — Heritage Days, K-Days, Folk Fest

## Mobile vs in-clinic in Edmonton

Mobile IV therapy is well-established across Edmonton — primarily through downtown, Old Strathcona, the university area, and Whyte Ave. Mobile coverage extends to surrounding communities including Sherwood Park, St. Albert, Spruce Grove, and Leduc, though expect a small travel fee outside city limits. In-clinic is usually better value for first-time sessions or specialty protocols (NAD+, high-dose vitamin C); mobile makes more sense for post-event recovery, busy parents, or skipping a downtown commute in winter.

If this is your first IV session, our [first-time IV therapy guide](/guide/first-time-iv-therapy-what-to-expect) covers exactly what to expect.

## How to choose an IV clinic in Edmonton

Five quick filters before booking:

1. **Licensed medical staff** — RN or NP administering, with a physician medical director on file
2. **Health Canada-registered ingredients** — ask explicitly
3. **Per-drip transparent pricing** — avoid clinics that only quote bundle packages
4. **A real intake screening** — every first-time client should be screened before the line goes in
5. **Recent reviews** — focus on the last 90 days, not legacy testimonials

Our [how to choose an IV therapy clinic guide](/guide/how-to-choose-iv-therapy-clinic) is the deeper-dive version.

## Insurance coverage in Edmonton

IV therapy is treated as an elective wellness service across Canada and isn't covered under the Alberta Health Care Insurance Plan (AHCIP). Most extended employer benefits also exclude wellness drips. A subset of medically indicated drips (iron, B12, vitamin D) prescribed by a naturopath or physician may qualify for partial reimbursement under your extended plan — but elective wellness drips don't. See our [Canadian insurance coverage guide](/blog/iv-therapy-insurance-coverage-canada) for the full breakdown.

## Edmonton neighborhood notes

- **Downtown and Oliver** — highest clinic density, fastest mobile turnaround
- **Old Strathcona and Whyte Ave** — newer independent studios, often paired with naturopathic or aesthetic services
- **University District** — younger demographic, lower pricing, some campus-adjacent clinics
- **Southwest (Windermere, Terwillegar)** — primarily mobile coverage from downtown providers
- **Sherwood Park, St. Albert, Spruce Grove, Leduc** — mobile-only for most providers; expect a small travel fee

## FAQ

**How long does an IV drip session take in Edmonton?**
Standard drips are 45 to 60 minutes. NAD+ infusions run longer — typically 90 minutes to 4 hours depending on dose.

**Can I book IV therapy delivered to a hotel during a festival weekend?**
Yes — Edmonton mobile providers serve hotels and Airbnbs across downtown. Heritage Days, K-Days, Folk Fest, and major Oilers playoff runs push mobile providers to capacity, so book 7 to 10 days ahead for peak weekends.

**Do I need a doctor's referral for IV therapy in Edmonton?**
No — reputable clinics handle medical screening in-house through a Nurse Practitioner or physician medical director. You don't need a referral from your family doctor.

**Are there walk-in IV therapy clinics in Edmonton?**
Some clinics accept walk-ins during slower midweek hours, but most prefer pre-booked appointments. It's better for the nurse's schedule and ensures your drip is mixed correctly.

## Ready to find a clinic?

Our directory currently has the strongest Canadian coverage in the Greater Toronto Area, with Edmonton listings being added through 2026 alongside Vancouver, Calgary, Ottawa, and Montreal. In the meantime, browse our full directory on the [main search page](/search) or take the [60-second drip quiz](/quiz) to see what protocol fits your goals. For our most-developed Canadian city resource, see the [Toronto complete guide](/blog/iv-therapy-toronto-complete-guide).`
  },

  {
    slug: 'iv-therapy-canada-complete-guide-2026',
    title: 'IV Therapy in Canada: The Complete 2026 Guide',
    excerpt: 'The definitive 2026 guide to IV therapy across Canada. Health Canada regulations, provincial coverage (RAMQ, OHIP, MSP, AHCIP), CAD pricing by province, and what to look for in a clinic.',
    meta_title: 'IV Therapy in Canada — Complete 2026 Guide (Costs, Regulations, Coverage)',
    meta_description: 'The complete guide to IV therapy in Canada in 2026. Health Canada rules, what each province covers (RAMQ, OHIP, MSP, AHCIP), CAD pricing, and clinic selection tips.',
    image_url: 'https://images.unsplash.com/photo-1542884748-2b87b36c6b90?w=1200&q=80',
    related_cities: ['toronto', 'vancouver', 'calgary', 'ottawa', 'montreal'],
    content: `IV therapy has gone from a niche wellness experiment to a mainstream service across Canada in just a few years. By 2026, every major Canadian metro has at least a handful of operators, the Greater Toronto Area has dozens, and mobile-first providers are filling in the suburbs and smaller markets. This guide is the cross-Canada overview — what's actually legal, what each province does and doesn't cover, what it costs in CAD, and how to think about choosing a clinic regardless of where you are.

## Is IV therapy legal in Canada?

Yes — elective IV hydration and nutrient therapy is legal across all Canadian provinces, but the regulatory framework varies in two key ways:

1. **Who can administer it.** Provincially, only licensed Registered Nurses (RN), Nurse Practitioners (NP), and Physicians (MD) can legally insert an intravenous line and administer prescription-grade ingredients. Naturopathic Doctors (ND) have IV therapy authority in BC, Ontario, Alberta, Saskatchewan, and Manitoba with additional certification; other provinces are stricter. Always confirm the staff credentials before booking.

2. **What ingredients are allowed.** All injectable ingredients used in IV therapy must be Health Canada-registered, with a Drug Identification Number (DIN) or Natural Product Number (NPN). Compounded mixtures must be prepared by a licensed compounding pharmacy in line with NAPRA standards. Avoid any clinic offering ingredients that can't be traced to a Health Canada record.

## What it costs across Canada (CAD)

Pricing varies by province, city, and protocol. The 2026 ranges below cover the most common drips at established clinics:

| Province | Standard hydration | Myers Cocktail | NAD+ infusion |
|---|---|---|---|
| Ontario (Toronto, Ottawa) | $175 – $325 | $200 – $375 | $400 – $1,000+ |
| BC (Vancouver) | $175 – $325 | $200 – $375 | $400 – $1,000+ |
| Alberta (Calgary, Edmonton) | $150 – $290 | $175 – $340 | $375 – $925 |
| Quebec (Montreal) | $135 – $275 | $165 – $325 | $350 – $850 |
| Manitoba (Winnipeg) | $140 – $260 | $165 – $310 | $350 – $800 |

Mobile (in-home, hotel, office) typically adds **$50 to $125 CAD** on top of in-clinic pricing. For a deeper Canada-vs-US comparison, see the [IV therapy cost guide](/guide/iv-therapy-cost-guide).

## Provincial health coverage — the short version

Elective wellness IV therapy is **not covered** under any provincial health plan in Canada. Specifically:

- **OHIP (Ontario)** — does not cover elective IV wellness
- **MSP (BC)** — does not cover elective IV wellness
- **AHCIP (Alberta)** — does not cover elective IV wellness
- **RAMQ (Quebec)** — does not cover elective IV wellness
- **Manitoba Health** — does not cover elective IV wellness
- Most other provincial plans treat it the same way

A subset of **medically indicated drips** (iron infusions for documented iron deficiency, B12 for documented B12 deficiency, vitamin D for documented deficiency) prescribed by a physician or naturopath may qualify for partial reimbursement under your **extended/private benefits plan** if the plan covers naturopathic or IV services. Elective wellness drips never qualify. Our [Canadian insurance coverage guide](/blog/iv-therapy-insurance-coverage-canada) walks through exactly how to check your plan.

## Popular drips by province

Drip mix varies meaningfully by region:

- **Ontario** — broad mix, with strong demand for hangover recovery, hydration, beauty/glutathione, and growing NAD+ adoption in downtown Toronto
- **BC** — recovery-heavy, NAD+/longevity-heavy, beauty drips for the West Coast lifestyle
- **Alberta** — immune support through winters, recovery for outdoor athletes, energy drips for the oil-and-gas workforce
- **Quebec** — beauty/glutathione strongly over-indexed vs other provinces, hangover recovery heavy through festival season
- **Manitoba** — immune support, recovery, B-complex; smaller market with fewer specialty protocols

## How to choose a clinic anywhere in Canada

A clinic-vetting checklist that works in every province:

1. **Licensed medical staff** — RN, NP, or MD administering; physician medical director on file
2. **Health Canada-registered ingredients** — ask for DIN or NPN documentation
3. **Compounded ingredients from a licensed compounding pharmacy** — should be traceable
4. **Real medical screening** — every first-time client should be screened
5. **Transparent flat per-drip pricing** — bundle-only or membership-only pricing is a yellow flag
6. **Emergency protocols** — clinic should have anaphylaxis protocols and basic life support staff on premises
7. **Recent reviews** — focus on the last 90 days

For the longer version, see our full [how to choose an IV therapy clinic guide](/guide/how-to-choose-iv-therapy-clinic).

## Mobile vs in-clinic in Canada

Mobile-first providers have become the default in many Canadian markets, especially Toronto, Vancouver, Montreal, and Calgary. The trade-offs are roughly the same everywhere:

- **In-clinic** — better for first-time clients, longer consultations, specialty protocols (NAD+, high-dose vitamin C), and lower total cost
- **Mobile** — better for busy schedules, parents, post-event recovery, and corporate group wellness events; typically $50–$125 CAD more per session

## City-by-city resources

Our most-developed Canadian city resources:

- [Best IV Therapy in Toronto 2026](/blog/best-iv-therapy-toronto-2026)
- [Best IV Therapy in Vancouver 2026](/blog/best-iv-therapy-vancouver-2026)
- [Best IV Therapy in Calgary 2026](/blog/best-iv-therapy-calgary-2026)
- [Best IV Therapy in Ottawa 2026](/blog/best-iv-therapy-ottawa-2026)
- [Best IV Therapy in Montreal 2026](/blog/best-iv-therapy-montreal-2026)
- [Best IV Therapy in Edmonton 2026](/blog/best-iv-therapy-edmonton-2026)
- [IV Therapy in Mississauga](/blog/iv-therapy-mississauga)
- [IV Therapy in the Greater Toronto Area](/blog/iv-therapy-greater-toronto-area)

## FAQ

**Is IV therapy regulated by Health Canada?**
The injectable ingredients used in IV therapy are regulated by Health Canada and must carry a DIN or NPN. The clinical practice of IV therapy is regulated provincially through nursing, naturopathic, and medical college standards.

**Do I need a doctor's referral?**
No — reputable clinics handle the medical screening through their own RN, NP, or medical director. You don't need a family-doctor referral for elective wellness IV therapy.

**How often should I get an IV drip?**
For elective wellness, most clinics recommend no more than once a week, and for many people monthly is plenty. NAD+ and high-dose protocols are usually run as a multi-session series with explicit clinical guidance.

**Is mobile IV therapy safe?**
Yes, when administered by a licensed RN or NP with appropriate emergency protocols. Ask the provider what they do in the event of an adverse reaction and confirm their staff carries injectable epinephrine.

**What's the difference between a Myers Cocktail and a NAD+ drip?**
A Myers Cocktail is a balanced general-wellness mix (B-complex, vitamin C, magnesium, calcium) costing $165–$375. NAD+ is a specialty longevity protocol delivering nicotinamide adenine dinucleotide at much higher cost ($350–$1,000+) and over a much longer infusion window.

## Ready to find a clinic?

Browse our full Canadian directory on the [main search page](/search), or take the [60-second drip quiz](/quiz) to see what protocol matches your goals. For the most-developed regional resource, the [Toronto complete guide](/blog/iv-therapy-toronto-complete-guide) is the best place to start.`
  },
];

for (const p of posts) {
  const wc = p.content.split(/\s+/).filter(Boolean).length;
  console.log(`  ${p.slug.padEnd(45)} ${wc} words`);
  if (wc < 800) {
    console.error(`  ✗ ABORT — ${p.slug} only ${wc} words, below 800 threshold`);
    process.exit(1);
  }
}

const { count: before } = await supabase.from('blog_posts').select('*', { count: 'exact', head: true });
console.log(`\nblog_posts BEFORE: ${before} rows`);

const rows = posts.map((p) => ({
  slug: p.slug,
  title: p.title,
  content: p.content,
  excerpt: p.excerpt,
  category: p.slug.includes('canada-complete') ? 'Guides' : 'City Guides',
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

console.log('\nVerification:');
for (const p of posts) {
  const { data } = await supabase.from('blog_posts').select('slug, title').eq('slug', p.slug).single();
  console.log(`  ${data ? '✓' : '✗'} ${p.slug}`);
}
