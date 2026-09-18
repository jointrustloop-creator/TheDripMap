import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const rawBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thedripmap.com';
  const baseUrl = rawBaseUrl.replace(/^https?:\/\/thedripmap\.com/, 'https://www.thedripmap.com');

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // /verify-claim completes a clinic claim when the URL is loaded, and
      // /finish and /get-verified carry private tokens. All three already emit
      // noindex; the disallow exists so a crawler holding a token URL cannot
      // trigger the action (GSC showed token URLs being crawled, 2026-09-18).
      disallow: ['/api/', '/admin/', '/verify-claim', '/get-verified', '/finish/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
