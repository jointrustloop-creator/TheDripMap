/** @type {import('next').NextConfig} */
// Fresh build trigger
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'loremflickr.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  async redirects() {
    return [
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
