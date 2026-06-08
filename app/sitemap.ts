import { MetadataRoute } from 'next';
import { getAllListings, getBlogPosts, getAllCities, slugify } from '../src/lib/data';
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
    { url: `${baseUrl}/cities`,                 priority: 0.9, changeFrequency: 'daily',   lastModified: new Date() },
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
  const cityRoutes = cities
    .filter((c) => c.count > 0 && c.city)
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
    .filter((p) => p.name && !isOrphanStub(p as { is_claimed?: boolean; decision_drivers?: unknown }))
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

  // Treatment x city matrix: 10 treatments × (Canada-first + top US cities by
  // provider count). Canada is our uncontested lane so it leads.
  const MATRIX_TREATMENT_SLUGS = [
    'hydration', 'nad-plus', 'myers-cocktail', 'hangover-recovery', 'immune-support',
    'beauty-glow', 'athletic-recovery', 'mobile-iv', 'weight-loss', 'vitamin-c',
    'glutathione', 'glp-1-weight-loss', 'iron-infusion',
  ];
  const CANADA_MATRIX_CITIES = ['Toronto', 'Vancouver', 'Calgary', 'Ottawa', 'Mississauga', 'Richmond Hill', 'North York', 'Oakville', 'Edmonton', 'Montreal', 'Quebec City', 'Winnipeg', 'Halifax', 'Victoria', 'Kelowna', 'Red Deer'];
  const topUSMatrixCities = cities
    .filter((c) => c.count > 0 && c.city && !CANADA_MATRIX_CITIES.includes(c.city))
    .sort((a, b) => (b.count || 0) - (a.count || 0))
    .slice(0, 20)
    .map((c) => c.city);
  const matrixCities = [...CANADA_MATRIX_CITIES, ...topUSMatrixCities];

  // Gate each treatment × city pair on having at least 1 matching provider.
  // The page (app/iv-therapy/[treatment]/[city]/page.tsx:120) noindexes when
  // count === 0, which created sitemap entries that GSC flagged as
  // "Excluded by noindex tag." Sitemap must list only indexable URLs.
  //
  // Most matrix treatments are "core" services every IV clinic offers —
  // for those, the existing cityRoutes filter (count > 0) already guarantees
  // at least one provider in the city. The non-core treatments below need
  // an explicit per-treatment keyword check against the provider's
  // specialties / services / description / mobile flag.
  type ProviderLike = {
    city?: string | null;
    specialties?: unknown;
    services?: unknown;
    description?: string | null;
    mobile_service?: boolean;
    type?: string | null;
  };
  const providersByCityKey = new Map<string, ProviderLike[]>();
  for (const p of providers as ProviderLike[]) {
    const key = (p.city || '').toLowerCase().trim();
    if (!key) continue;
    if (!providersByCityKey.has(key)) providersByCityKey.set(key, []);
    providersByCityKey.get(key)!.push(p);
  }
  const treatmentBlob = (p: ProviderLike): string => {
    const specs = Array.isArray(p.specialties) ? p.specialties.filter((s): s is string => typeof s === 'string') : [];
    const services = Array.isArray(p.services)
      ? p.services.map((s) => typeof s === 'string' ? s : (s && typeof s === 'object' && 'name' in s ? String((s as { name: unknown }).name) : '')).filter(Boolean)
      : [];
    return [...specs, ...services, p.description || ''].join(' ').toLowerCase();
  };
  // Non-core treatments require an explicit keyword/feature match.
  const NON_CORE_TREATMENT_CHECK: Record<string, (p: ProviderLike) => boolean> = {
    'mobile-iv': (p) => p.mobile_service === true || (p.type || '').toLowerCase() === 'mobile',
    'glutathione': (p) => treatmentBlob(p).includes('glutathione'),
    'iron-infusion': (p) => /\biron\b/.test(treatmentBlob(p)),
  };

  // Sitemap thin-page guard: only advertise matrix routes when there are
  // genuinely 3+ relevant providers in the city. The page itself emits
  // robots:noindex for count < 3 (see app/iv-therapy/[treatment]/[city]/page.tsx),
  // so sitemap and page-level robots stay in sync. Pages stay reachable via
  // direct URL, just not crawl-prioritized.
  const MIN_PROVIDERS_FOR_SITEMAP = 3;
  const matrixRoutes: MetadataRoute.Sitemap = [];
  for (const t of MATRIX_TREATMENT_SLUGS) {
    const checker = NON_CORE_TREATMENT_CHECK[t];
    for (const city of matrixCities) {
      const cityProviders = providersByCityKey.get(city.toLowerCase().trim()) || [];
      if (cityProviders.length < MIN_PROVIDERS_FOR_SITEMAP) continue;
      if (checker && cityProviders.filter(checker).length < MIN_PROVIDERS_FOR_SITEMAP) continue;
      matrixRoutes.push({
        url: `${baseUrl}/iv-therapy/${t}/${slugify(city)}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      });
    }
  }

  return [...staticRoutes, ...audienceRoutes, ...symptomRoutes, ...treatmentHubRoutes, ...stateRoutes, ...guideRoutes, ...cityRoutes, ...providerRoutes, ...blogRoutes, ...matrixRoutes];
}
