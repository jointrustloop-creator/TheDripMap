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
      // -----------------------------------------------------------------
      // GSC 404 cleanup — 2026-05-30
      // -----------------------------------------------------------------
      // Routes Google indexed in the last 1–3 days that we removed since:
      //   1. Quiz archetype share-card OG route (c753b8e, 2026-05-30):
      //      6 archetype URLs (recovery-athlete, beauty-devotee,
      //      brain-fog-fighter, immunity-shield, hangover-warrior,
      //      longevity-seeker). Point all at /quiz so the user lands on
      //      the live result flow.
      //   2. Homepage v3 preview at /homepage-v2 (601903c, 2026-05-30):
      //      lived ~24h, was noindexed but Google may have crawled.
      //      Send to /.
      {
        source: '/api/quiz-card/:archetype*',
        destination: '/quiz',
        permanent: true,
      },
      {
        source: '/homepage-v2',
        destination: '/',
        permanent: true,
      },
      // "Who We Serve" clinic-owners entry → existing /for-clinics page.
      {
        source: '/for/clinic-owners',
        destination: '/for-clinics',
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
      // NOTE: the former '/iv-therapy/:state/:city' -> '/cities/:city' redirect was
      // removed so the treatment x city matrix can own '/iv-therapy/[treatment]/[city]'.
      // Legacy /iv-therapy/{state}/{city} URLs are handled inside that route (a
      // non-treatment first segment that is a US state redirects to /cities/{city}).
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
      // -----------------------------------------------------------------
      // Canadian cluster consolidation — 2026-05-31
      // -----------------------------------------------------------------
      // C8 Mississauga: two blog duplicates consolidated into the city
      // money page after a content merge (regulatory framework, CAD
      // pricing bands, neighbourhood clusters, Toronto comparison,
      // naturopathic insurance angle were lifted into /cities/mississauga).
      {
        source: '/blog/iv-therapy-mississauga',
        destination: '/cities/mississauga',
        permanent: true,
      },
      {
        source: '/blog/iv-therapy-mississauga-2026-guide',
        destination: '/cities/mississauga',
        permanent: true,
      },
      // C11 Vancouver: two blog duplicates consolidated into the city
      // money page after a content merge. /cities/vancouver content went
      // from null → 13,881 chars (BCCNM/CPSBC/CNPBC regulatory framework,
      // real 2026 CAD pricing bands, 8-signal clinic checklist, G6PD
      // safety, neighbourhood clusters).
      {
        source: '/blog/best-iv-therapy-vancouver-2026',
        destination: '/cities/vancouver',
        permanent: true,
      },
      {
        source: '/blog/iv-therapy-vancouver-2026-guide',
        destination: '/cities/vancouver',
        permanent: true,
      },
      // C13 Calgary: two blog duplicates consolidated into the city
      // money page. /cities/calgary content went from null → 14,932 chars
      // (CRNA/CPSA/CNDA/CLPNA framework, per-dose NAD+ CAD bands,
      // 7-neighbourhood cluster map, altitude-driven hydration context,
      // honest contraindications).
      {
        source: '/blog/best-iv-therapy-calgary-2026',
        destination: '/cities/calgary',
        permanent: true,
      },
      {
        source: '/blog/iv-therapy-calgary-2026-guide',
        destination: '/cities/calgary',
        permanent: true,
      },
      // C15 Ottawa: two blog duplicates consolidated into the city money
      // page. /cities/ottawa content went from null → 13,847 chars
      // (CPSO/CNO/CONO regulatory framework, real 2026 CAD bands,
      // 5-neighbourhood cluster map, the unique bilingual NCR + Gatineau
      // OIIQ/CMQ angle, compounding-pharmacy quality signal).
      {
        source: '/blog/best-iv-therapy-ottawa-2026',
        destination: '/cities/ottawa',
        permanent: true,
      },
      {
        source: '/blog/iv-therapy-ottawa-2026-guide',
        destination: '/cities/ottawa',
        permanent: true,
      },
      // C16 Montreal: two blog duplicates consolidated into the city
      // money page. /cities/montreal content went from null → 13,818
      // chars (OIIQ/CMQ regulatory framework, the Quebec-distinct
      // ordonnance collective mechanism, Bill 96 bilingual law, real
      // 2026 CAD bands, 5-neighbourhood cluster map, RAMQ coverage).
      {
        source: '/blog/best-iv-therapy-montreal-2026',
        destination: '/cities/montreal',
        permanent: true,
      },
      {
        source: '/blog/iv-therapy-montreal-2026-guide',
        destination: '/cities/montreal',
        permanent: true,
      },
      // C9 Oakville: two blog duplicates consolidated into the city money
      // page. Inserted a fresh row in the cities table (none existed —
      // page was resolving via the slug-aware provider fallback) with
      // 14,966 chars of merged content. Gold: Oakville-specific ND/CONO
      // angle, naturopathic high-dose vitamin C oncology-adjunct framing,
      // physician-vs-ND clinic model comparison, 4-neighbourhood map.
      {
        source: '/blog/iv-therapy-oakville',
        destination: '/cities/oakville',
        permanent: true,
      },
      {
        source: '/blog/iv-therapy-oakville-2026-guide',
        destination: '/cities/oakville',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
