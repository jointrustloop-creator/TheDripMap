# Canada demand-intent SEO autopilot — audit

Mode: FULLY AUTONOMOUS, self-verifying. Demand data: ESTIMATED (no GSC service
account in env). To switch to real positions, add `GSC_SERVICE_ACCOUNT_KEY`
(service-account JSON) to the env and grant that service account read access to
the thedripmap.com property in Search Console.

## Page inventory (indexable, from repo + sitemap)
- City pages: `/cities/[slug]` (cities table, 3-provider gate)
- Treatment hubs: `/treatments/[slug]` (19 protocols)
- Treatment x city matrix: `/iv-therapy/[treatment]/[city]` (13 treatments x 16 CA cities, 3-clinic gate)
- Guides: `/guide/[slug]`, Symptoms: `/symptoms/[slug]`, States/Provinces: `/states/[slug]`
- Blog: `/blog/[slug]` (Supabase), Providers: `/providers/[slug]` (Supabase)

Content surface that is editable under the allowlist (no DB writes, no routing):
`src/lib/city-intros.ts` (city copy + per-city meta) and `src/lib/city-meta.ts`
(regulation note, use-case groupings, FAQs that become FAQPage JSON-LD, internal
links). Blog and city body content live in Supabase and are OUT of scope.

## Demand-intent query universe (Canada only, near-me excluded)
Cities (16 CA matrix cities) x treatments (13) x templates:
- COST / COMPARISON (intent weight 3): "iv therapy cost {city}", "{treatment} cost {city}", "best iv therapy {city}", "best {treatment} {city}"
- COMMERCIAL (2.5): "iv therapy {city}", "{treatment} {city}", "mobile iv therapy {city}", "group iv therapy {city}"
- INFORMATIONAL-COMMERCIAL (1.5): "is iv therapy worth it", "{treatment} benefits"
- EXCLUDED, near-me (weight 0): counted as wasted share only.

Approximate universe size: ~720 Canadian demand-intent queries (80 city-level + 624 city x treatment + 13 treatment-info + 1 general).

## Buckets (ESTIMATED, position-blind)
Without GSC, "striking distance" is proxied by: an existing high-demand page that
targets a high-value query but is MISSING the on-page elements that win it
(local cost range, city specifics, cost/legal FAQs + FAQPage JSON-LD, tightened
meta). City pages are the biggest lever: 16 CA city pages exist, but only Toronto
has a city-intro and city-meta. The other ~15 render generic copy with no local
cost range and only the 3 generic FAQs.

Striking-distance opportunities found (ESTIMATED): ~15 Canadian city pages
under-optimized for their "iv therapy {city}" / "iv therapy cost {city}" /
"best iv therapy {city}" queries (~75 high-value query slots).

Near-me wasted impression share (ESTIMATED): ~30 percent of Canadian IV-therapy
demand-intent impressions go to "near me" and map-pack queries that Google's
Local Pack owns. We do not chase these. GSC would confirm the exact figure.

## Scoring (intent x proximity x demand), top-5 selection
Proximity is ESTIMATED from "page exists but is thin for its target query."
Demand is ESTIMATED from clinic inventory (a strong proxy for market size and
the substance available to build a credible cost range and clinic count).

Selected fix targets (top 5 Canadian city pages by inventory, none currently
optimized):

| # | Page | Clinics | Province | Primary target query | Gap (what it is missing) |
|---|------|---------|----------|----------------------|--------------------------|
| 1 | /cities/calgary | 32 | AB | iv therapy cost calgary, best iv therapy calgary | no intro, no cost range, no city FAQs/JSON-LD, generic meta |
| 2 | /cities/edmonton | 26 | AB | iv therapy cost edmonton, best iv therapy edmonton | same |
| 3 | /cities/vancouver | 25 | BC | iv therapy cost vancouver, best iv therapy vancouver | same |
| 4 | /cities/ottawa | 23 | ON | iv therapy cost ottawa, best iv therapy ottawa | same |
| 5 | /cities/mississauga | 20 | ON | iv therapy cost mississauga, best iv therapy mississauga | same |

Runners-up (next pass): Winnipeg (16), Montreal (15, FR market), Victoria, Kelowna.

## Honesty constraints applied
- Verified/claimed clinics in these 5 cities = ~0, and there is NO structured
  price data. So copy references "the clinics listed in {city}" (not "verified"),
  and cost ranges are described as TYPICAL regional figures tied to "confirm with
  the clinic." No fabricated per-clinic prices, no medical claims, no em/en
  dashes, "matching platform" never "directory", Canada only.

## Fix applied per page (allowlisted only)
- city-intros.ts: localContext (city specifics), pricing (typical regional cost
  range), popularTreatments, tightened metaTitle + metaDescription.
- city-meta.ts: provincial regulationNote, 3-4 use-case groupings, 4-5 cost/legal/
  mobile FAQs (become FAQPage JSON-LD), internal links to treatment hubs.
