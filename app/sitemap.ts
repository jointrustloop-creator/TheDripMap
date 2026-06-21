import { MetadataRoute } from 'next';
import { getAllListings, getBlogPosts, getAllCities, slugify, getServiceFilter } from '../src/lib/data';
import { US_MARKET_ENABLED, marketOf } from '../src/lib/market';

// 2026-06-11: revalidate every 10 minutes so newly-added providers + cities
// surface in the sitemap quickly without a manual redeploy. Previously the
// sitemap was statically prerendered at build time, so 22 cities (including
// columbus, whitby, halifax + 19 pre-existing) were missing from the cached
// XML despite passing the 3-provider gate.
export const revalidate = 600;
import { USE_CASES } from '../src/lib/use-cases';
import { STATES } from '../src/lib/states';
import { GUIDES } from '../src/lib/guides';
import { AUDIENCES } from '../src/lib/audiences';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rawBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thedripmap.com';
  const baseUrl = rawBaseUrl.replace(/^https?:\/\/thedripmap\.com/, 'https://www.thedripmap.com');

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`,                       priority: 1.0, changeFrequency: 'daily',   lastModified: new Date() },
    { url: `${baseUrl}/search`,                 priority: 0.9, changeFrequency: 'daily',   lastModified: new Date() },
    { url: `${baseUrl}/deals`,                  priority: 0.85, changeFrequency: 'daily',  lastModified: new Date() },
    { url: `${baseUrl}/cities`,                 priority: 0.9, changeFrequency: 'daily',   lastModified: new Date() },
    { url: `${baseUrl}/canada`,                 priority: 0.9, changeFrequency: 'weekly',  lastModified: new Date() },
    { url: `${baseUrl}/states`,                 priority: 0.85, changeFrequency: 'weekly', lastModified: new Date() },
    { url: `${baseUrl}/guide`,                  priority: 0.85, changeFrequency: 'monthly', lastModified: new Date() },
    { url: `${baseUrl}/quiz`,                   priority: 0.8, changeFrequency: 'monthly', lastModified: new Date() },
    { url: `${baseUrl}/blog`,                   priority: 0.8, changeFrequency: 'daily',   lastModified: new Date() },
    { url: `${baseUrl}/about`,                  priority: 0.6, changeFrequency: 'monthly', lastModified: new Date() },
    { url: `${baseUrl}/for-clinics`,            priority: 0.7, changeFrequency: 'monthly', lastModified: new Date() },
    { url: `${baseUrl}/resources`,                    priority: 0.7, changeFrequency: 'monthly', lastModified: new Date() },
    { url: `${baseUrl}/resources/cost-calculator`,    priority: 0.75, changeFrequency: 'monthly', lastModified: new Date() },
    { url: `${baseUrl}/resources/safety-checker`,     priority: 0.7, changeFrequency: 'monthly', lastModified: new Date() },
    { url: `${baseUrl}/resources/clinic-owners`,      priority: 0.6, changeFrequency: 'monthly', lastModified: new Date() },
    { url: `${baseUrl}/resources/patient-acquisition`,priority: 0.65, changeFrequency: 'monthly', lastModified: new Date() },
    { url: `${baseUrl}/tools/seo-audit`,              priority: 0.6, changeFrequency: 'monthly', lastModified: new Date() },
    { url: `${baseUrl}/contact`,                priority: 0.6, changeFrequency: 'monthly', lastModified: new Date() },
    { url: `${baseUrl}/symptoms`,               priority: 0.7, changeFrequency: 'monthly', lastModified: new Date() },
    { url: `${baseUrl}/iv-therapy-statistics`,  priority: 0.6, changeFrequency: 'monthly', lastModified: new Date() },
    { url: `${baseUrl}/treatments`,             priority: 0.8, changeFrequency: 'monthly', lastModified: new Date() },
  ];

  const symptomRoutes = USE_CASES.map((useCase) => ({
    url: `${baseUrl}/symptoms/${useCase.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Treatment hub pages — one per protocol. Source of truth is the TREATMENTS
  // array in app/treatments/page.tsx. These are 200s in prod with full content
  // (hero + glossary + city finder) but were never advertised in the sitemap,
  // so Google couldn't crawl them. 22 pages added 2026-06-08 after an internal
  // crawl flagged the gap.
  const TREATMENT_HUB_SLUGS = [
    'nad-plus', 'hangover', 'immune-support', 'beauty-glow', 'weight-loss',
    'hydration', 'recovery', 'myers-cocktail', 'jet-lag', 'energy-boost',
    'glp-1-weight-loss', 'iron-infusion', 'vitamin-d', 'b12-shot',
    'glutathione', 'high-dose-vitamin-c', 'cold-and-flu', 'migraine-relief',
    'hormone-therapy',
  ];
  const treatmentHubRoutes = TREATMENT_HUB_SLUGS.map((slug) => ({
    url: `${baseUrl}/treatments/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.75,
  }));

  const cities = await getAllCities();
  // 3-provider gate (per the 2026-06-09 city-deepening spec). Cities with
  // fewer than 3 providers are URL-reachable but excluded from the sitemap
  // crawl-priority list AND emit robots:noindex on the page (see
  // app/cities/[slug]/page.tsx). The pair keeps Google's index focused on
  // the cities that actually have enough inventory to satisfy a searcher.
  const CITY_PROVIDER_GATE = 3;
  const cityRoutes = cities
    // US market off: keep US city pages out of the sitemap (they also emit
    // robots:noindex). Canadian cities are unaffected. Reversible via the flag.
    .filter((c) => (c.count ?? 0) >= CITY_PROVIDER_GATE && c.city && (US_MARKET_ENABLED || marketOf({ state: c.state }) !== 'US'))
    .map((c) => ({
      url: `${baseUrl}/cities/${slugify(c.city)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    }));

  const stateRoutes = STATES.map((s) => ({
    url: `${baseUrl}/states/${s.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }));

  const audienceRoutes = AUDIENCES.map((a) => ({
    url: `${baseUrl}/for/${a.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.75,
  }));

  const guideRoutes = GUIDES.map((g) => ({
    url: `${baseUrl}/guide/${g.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.75,
  }));

  const providers = await getAllListings();

  // Exclude orphan-claim stubs from the sitemap. These are placeholders the
  // owner submitted via /for-clinics/setup and hasn't verified yet — they
  // carry no real content, are flagged noindex on the provider page, and
  // should not be advertised to Google. Once the owner verifies (flips
  // is_claimed=true), they re-appear in the sitemap automatically.
  const isOrphanStub = (p: { is_claimed?: boolean; decision_drivers?: unknown }): boolean => {
    const dd = p.decision_drivers as { source?: string } | null | undefined;
    return dd?.source === 'orphan_claim_stub' && p.is_claimed !== true;
  };
  const providerRoutes = providers
    // US market off: keep US provider pages out of the sitemap. Reversible via the flag.
    .filter((p) => p.name && !isOrphanStub(p as { is_claimed?: boolean; decision_drivers?: unknown }) && (US_MARKET_ENABLED || marketOf({ country: (p as { country?: string }).country, state: p.state }) !== 'US'))
    .map((p) => ({
      url: `${baseUrl}/providers/${p.slug || slugify(p.name)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  const posts = await getBlogPosts();
  const blogRoutes = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // Treatment x city matrix. The page app/iv-therapy/[treatment]/[city] counts
  // clinics via getListingsByServiceAndCity(filter, city) and emits robots:noindex
  // when that count < 3. The sitemap MUST mirror that exact count so it never
  // advertises a noindexed URL (the "Unexpected noindex / Excluded by noindex"
  // GSC flag) and never hides an indexable one. We replicate the page's matcher
  // in-memory: getServiceFilter(filter) parsed into an OR-predicate over the
  // already-loaded providers, plus the same broad fallback the data layer uses
  // when a city has zero specific matches. Validated 1:1 against the live query
  // 2026-06-15 (.audit-tmp/_seo-matrix-analysis.cjs): removes 96 noindex-in-
  // sitemap mismatches and surfaces 47 indexable pages the old "any 3 providers
  // in the city" heuristic wrongly hid (mostly glutathione / iron / mobile-iv).
  const MATRIX_TREATMENT_FILTERS: Record<string, string> = {
    'hydration': 'Hydration', 'nad-plus': 'NAD+', 'myers-cocktail': 'Myers Cocktail',
    'hangover-recovery': 'Hangover', 'immune-support': 'Immune Support', 'beauty-glow': 'Beauty Glow',
    'athletic-recovery': 'Recovery', 'mobile-iv': 'Mobile', 'weight-loss': 'Weight Loss',
    'vitamin-c': 'Vitamin C', 'glutathione': 'Glutathione', 'glp-1-weight-loss': 'Peptide',
    'iron-infusion': 'Iron',
  };
  // Mirrors the zero-result fallback inside getListingsByServiceAndCity.
  const BROAD_FALLBACK_FILTER = 'name.ilike.%hydration%,description.ilike.%hydration%,name.ilike.%wellness%,description.ilike.%wellness%,name.ilike.%drip%,description.ilike.%iv%';
  const CANADA_MATRIX_CITIES = ['Toronto', 'Vancouver', 'Calgary', 'Ottawa', 'Mississauga', 'Richmond Hill', 'North York', 'Oakville', 'Edmonton', 'Montreal', 'Quebec City', 'Winnipeg', 'Halifax', 'Victoria', 'Kelowna', 'Red Deer'];
  const topUSMatrixCities = cities
    .filter((c) => c.count > 0 && c.city && !CANADA_MATRIX_CITIES.includes(c.city))
    .sort((a, b) => (b.count || 0) - (a.count || 0))
    .slice(0, 20)
    .map((c) => c.city);
  const matrixCities = [...CANADA_MATRIX_CITIES, ...topUSMatrixCities];

  // Parse a PostgREST .or() filter (only the ilike.%x% and cs.{"x"} forms that
  // getServiceFilter emits) into an in-memory OR-predicate. enrichProvider does
  // not alter name/description/subtypes/category, so matching the loaded
  // providers equals matching the raw rows the page queries.
  const normTxt = (x: unknown): string => (x == null ? '' : String(x)).toLowerCase();
  type MatrixProvider = { name?: unknown; description?: unknown; category?: unknown; subtypes?: unknown; specialties?: unknown; city?: unknown };
  const buildOrPredicate = (orStr: string): ((p: MatrixProvider) => boolean) => {
    const conds = orStr
      .split(',')
      .map((c) => c.trim())
      .map((c) => {
        let m = c.match(/^(\w+)\.ilike\.%(.*)%$/);
        if (m) return { field: m[1], op: 'ilike' as const, val: normTxt(m[2]) };
        m = c.match(/^(\w+)\.cs\.\{"(.*)"\}$/);
        if (m) return { field: m[1], op: 'cs' as const, val: m[2] };
        return null;
      })
      .filter((x): x is { field: string; op: 'ilike' | 'cs'; val: string } => x !== null);
    const asArr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
    return (p: MatrixProvider) =>
      conds.some((cd) => {
        if (cd.op === 'ilike') {
          if (cd.field === 'name') return normTxt(p.name).includes(cd.val);
          if (cd.field === 'description') return normTxt(p.description).includes(cd.val);
          if (cd.field === 'category') return normTxt(p.category).includes(cd.val);
          if (cd.field === 'subtypes') return asArr(p.subtypes).some((x) => normTxt(x).includes(cd.val));
          if (cd.field === 'specialties') return asArr(p.specialties).some((x) => normTxt(x).includes(cd.val));
          return false;
        }
        if (cd.field === 'subtypes') return asArr(p.subtypes).some((x) => normTxt(x) === normTxt(cd.val));
        return false;
      });
  };
  const broadPred = buildOrPredicate(BROAD_FALLBACK_FILTER);
  const cityContains = (pCity: unknown, city: string): boolean => normTxt(pCity).includes(normTxt(city));

  // Same gate the page applies: list the URL only when 3+ clinics match.
  const MIN_PROVIDERS_FOR_SITEMAP = 3;
  const matrixRoutes: MetadataRoute.Sitemap = [];
  for (const [slug, filter] of Object.entries(MATRIX_TREATMENT_FILTERS)) {
    const specificPred = buildOrPredicate(getServiceFilter(filter));
    for (const city of matrixCities) {
      const inCity = (providers as MatrixProvider[]).filter((p) => cityContains(p.city, city));
      let matches = inCity.filter(specificPred).length;
      if (matches === 0) matches = inCity.filter(broadPred).length;
      if (matches < MIN_PROVIDERS_FOR_SITEMAP) continue;
      matrixRoutes.push({
        url: `${baseUrl}/iv-therapy/${slug}/${slugify(city)}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      });
    }
  }

  return [...staticRoutes, ...audienceRoutes, ...symptomRoutes, ...treatmentHubRoutes, ...stateRoutes, ...guideRoutes, ...cityRoutes, ...providerRoutes, ...blogRoutes, ...matrixRoutes];
}
