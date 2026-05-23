import { MetadataRoute } from 'next';
import { getAllListings, getBlogPosts, getAllCities, slugify } from '../src/lib/data';
import { USE_CASES } from '../src/lib/use-cases';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thedripmap.com';

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`,                       priority: 1.0, changeFrequency: 'daily',   lastModified: new Date() },
    { url: `${baseUrl}/search`,                 priority: 0.9, changeFrequency: 'daily',   lastModified: new Date() },
    { url: `${baseUrl}/cities`,                 priority: 0.9, changeFrequency: 'daily',   lastModified: new Date() },
    { url: `${baseUrl}/quiz`,                   priority: 0.8, changeFrequency: 'monthly', lastModified: new Date() },
    { url: `${baseUrl}/blog`,                   priority: 0.8, changeFrequency: 'daily',   lastModified: new Date() },
    { url: `${baseUrl}/about`,                  priority: 0.6, changeFrequency: 'monthly', lastModified: new Date() },
    { url: `${baseUrl}/for-clinics`,            priority: 0.7, changeFrequency: 'monthly', lastModified: new Date() },
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

  return [...staticRoutes, ...symptomRoutes, ...cityRoutes, ...providerRoutes, ...blogRoutes];
}
