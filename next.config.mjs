/** @type {import('next').NextConfig} */
// Fresh build trigger v4 — 2026-05-25, forcing rebuild after stuck deploy pipeline
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'loremflickr.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'qaqzwfnjajyejehmdvuw.supabase.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.mapbox.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'signaturebeautylounge.ca',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.signaturebeautylounge.ca',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'signaturemedispa.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.signaturemedispa.com',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      // Map static-style /og-image.png URL to the dynamic ImageResponse route
      {
        source: '/og-image.png',
        destination: '/og-image',
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'thedripmap.com' }],
        destination: 'https://www.thedripmap.com/:path*',
        permanent: true,
      },
      // Singular /provider/* → plural /providers/*. Catch-all (:slug*) so it
      // covers nested paths too, fixing ~459 legacy 404s Google crawled at the
      // old singular path.
      {
        source: '/provider/:slug*',
        destination: '/providers/:slug*',
        permanent: true,
      },
      // SPECIFIC rule must come before the /iv-therapy/:state/:city catch-all
      // below. Otherwise '/iv-therapy/treatment/<service>' gets interpreted as
      // state=treatment, city=<service> and redirected to /cities/<service>
      // which 404s. Land users on the real treatment page instead.
      {
        source: '/iv-therapy/treatment/:service',
        destination: '/treatments/:service',
        permanent: true,
      },
      {
        source: '/iv-therapy/:state/:city',
        destination: '/cities/:city',
        permanent: true,
      },
      {
        source: '/iv-therapy/:city',
        destination: '/cities/:city',
        permanent: true,
      },
      {
        source: '/iv-therapy/:state',
        destination: '/cities',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
