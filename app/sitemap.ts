import { MetadataRoute } from 'next';
import { getAllListings, getBlogPosts, slugify } from '../src/lib/data';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thedripmap.com';

  // Static routes
  const routes = [
    '',
    '/search',
    '/about',
    '/blog',
    '/quiz',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Provider routes
  const providers = await getAllListings();
  const providerRoutes = providers.map((p) => ({
    url: `${baseUrl}/provider/${slugify(p.name)}`,
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

  return [...routes, ...providerRoutes, ...blogRoutes];
}
