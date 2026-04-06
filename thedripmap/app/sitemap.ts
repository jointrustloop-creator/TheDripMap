import { MetadataRoute } from 'next';
import { getAllCities, getBlogPosts, slugify, getAllListings } from '../src/lib/data';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thedripmap.com';

  // Core Pages
  const routes = [
    '',
    '/search',
    '/quiz',
    '/blog',
    '/for-clinics',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // City Pages
  const cities = await getAllCities();
  const cityRoutes = cities
    .filter(c => c.state && c.city)
    .map((c) => ({
      url: `${baseUrl}/iv-therapy/${slugify(c.state)}/${slugify(c.city)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

  // Provider Pages
  const providers = await getAllListings();
  const providerRoutes = providers.map((p) => ({
    url: `${baseUrl}/provider/${slugify(p.name)}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // Blog Pages
  const posts = await getBlogPosts();
  const blogRoutes = posts.map((p) => ({
    url: `${baseUrl}/blog/${p.slug}`,
    lastModified: p.date ? new Date(p.date) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  // Use Case Pages
  const useCases = [
    'hangover', 'jet-lag', 'fatigue', 'cold-and-flu',
    'sports-recovery', 'migraine', 'weight-loss', 'skin-glow',
    'stress', 'immunity', 'morning-sickness', 'event-prep',
    'dehydration', 'brain-fog'
  ];
  const useCaseRoutes = useCases.map((u) => ({
    url: `${baseUrl}/iv-therapy-for/${u}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Service Pages
  const services = [
    'nad-plus', 'hangover', 'immune-support', 'beauty-glow', 
    'weight-loss', 'hydration', 'recovery', 'myers-cocktail'
  ];
  const serviceRoutes = services.map((s) => ({
    url: `${baseUrl}/iv-therapy/treatment/${s}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [
    ...routes,
    ...cityRoutes,
    ...providerRoutes,
    ...blogRoutes,
    ...useCaseRoutes,
    ...serviceRoutes,
  ];
}
