/** @type {import('next').NextConfig} */
// Fresh build trigger v3 - forcing image cache bust
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
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'thedripmap.com' }],
        destination: 'https://www.thedripmap.com/:path*',
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
