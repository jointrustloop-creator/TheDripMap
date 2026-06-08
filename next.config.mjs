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
      //
      // Single-hop treatment redirects MUST come before the generic
      // /iv-therapy/:city catch-all below. Otherwise '/iv-therapy/nad-plus'
      // gets matched as :city and sent to /cities/nad-plus, which then
      // double-redirects via the treatment-slug safety net in
      // app/cities/[slug]/page.tsx. SEO best practice is single-hop.
      ...[
        'nad-plus', 'hangover', 'hangover-recovery', 'immune-support',
        'beauty-glow', 'weight-loss', 'glp-1-weight-loss', 'hydration',
        'recovery', 'athletic-recovery', 'myers-cocktail', 'jet-lag',
        'energy-boost', 'iron-infusion', 'vitamin-d', 'b12-shot',
        'glutathione', 'high-dose-vitamin-c', 'vitamin-c', 'cold-and-flu',
        'migraine-relief', 'hormone-therapy', 'mobile-iv',
      ].map((slug) => ({
        source: `/iv-therapy/${slug}`,
        destination: `/treatments/${slug}`,
        permanent: true,
      })),
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
      // Blog canonical URL renames (kept). Blog -> blog redirects only.
      // -----------------------------------------------------------------
      // C17 Insurance / Canada: the Ontario-specific blog URL was renamed
      // to the Canada-wide canonical post slug. Both target blog content,
      // so the redirect is a legitimate URL canonicalization, not a
      // content-suppression redirect like the C1 through C16 entries were.
      {
        source: '/blog/iv-therapy-insurance-ontario',
        destination: '/blog/iv-therapy-insurance-coverage-canada',
        permanent: true,
      },
      // -----------------------------------------------------------------
      // 2026-06-05: peptide therapy decommission. The /treatments/peptide-therapy
      // page and the Peptide chip/filter were removed from the site. Soft-land
      // any inbound link on the treatments index instead of 404ing. The
      // matrix /iv-therapy/peptide-therapy/{city} pages were never in
      // MATRIX_TREATMENT_SLUGS so they require no redirect.
      // -----------------------------------------------------------------
      {
        source: '/treatments/peptide-therapy',
        destination: '/treatments',
        permanent: true,
      },
      // -----------------------------------------------------------------
      // 2026-06-03: The 19 blog -> /cities/* and blog -> /iv-therapy/*
      // redirects added during the C1-C17 consolidation work
      // (2026-05-31) have been REMOVED. Those redirects suppressed
      // 14+ real, fully-written 2,000 to 4,400 word guides that still
      // live in the blog_posts table. The consolidation moved unique
      // editorial content into the canonical city/treatment pages but
      // never deleted the source posts, so users hitting /blog/{slug}
      // were permanently redirected away from real content. Removing
      // the redirects restores blog display. The duplicate-content
      // concern (city page + blog post both render similar editorial)
      // is resolved separately, via canonical tags or a content diff
      // pass, not via 308.
      // -----------------------------------------------------------------
    ];
  },
};

export default nextConfig;
