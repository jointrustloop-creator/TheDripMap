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
  ];

  const symptomRoutes = USE_CASES.map((useCase) => ({
    url: `${baseUrl}/symptoms/${useCase.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
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
  const providerRoutes = providers
    .filter((p) => p.name)
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
  ];
  const CANADA_MATRIX_CITIES = ['Toronto', 'Vancouver', 'Calgary', 'Ottawa', 'Mississauga', 'Richmond Hill', 'North York', 'Oakville'];
  const topUSMatrixCities = cities
    .filter((c) => c.count > 0 && c.city && !CANADA_MATRIX_CITIES.includes(c.city))
    .sort((a, b) => (b.count || 0) - (a.count || 0))
    .slice(0, 20)
    .map((c) => c.city);
  const matrixCities = [...CANADA_MATRIX_CITIES, ...topUSMatrixCities];
  const matrixRoutes: MetadataRoute.Sitemap = [];
  for (const t of MATRIX_TREATMENT_SLUGS) {
    for (const city of matrixCities) {
      matrixRoutes.push({
        url: `${baseUrl}/iv-therapy/${t}/${slugify(city)}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      });
    }
  }

  return [...staticRoutes, ...audienceRoutes, ...symptomRoutes, ...stateRoutes, ...guideRoutes, ...cityRoutes, ...providerRoutes, ...blogRoutes, ...matrixRoutes];
}
