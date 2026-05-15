import { MetadataRoute } from 'next';
import { getAllListings, getBlogPosts, slugify } from '../src/lib/data';
import { USE_CASES } from '../src/lib/use-cases';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thedripmap.com';

  // Static routes
  const routes = [
    '',
    '/search',
    '/about',
    '/blog',
    '/quiz',
    '/cities/toronto',
    '/symptoms',
    '/iv-therapy-statistics',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '/iv-therapy-statistics' ? ('monthly' as const) : ('daily' as const),
    priority: route === '' ? 1 : 0.8,
  }));

  // Symptoms routes
  const symptomRoutes = USE_CASES.map((useCase) => ({
    url: `${baseUrl}/symptoms/${useCase.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Provider routes
  const providers = await getAllListings();
  const providerRoutes = providers.map((p) => ({
    url: `${baseUrl}/providers/${p.slug || slugify(p.name)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Blog routes
  const posts = await getBlogPosts();
  const blogRoutes = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...routes, ...symptomRoutes, ...providerRoutes, ...blogRoutes];
}
