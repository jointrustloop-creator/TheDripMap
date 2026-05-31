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
      // C14 Calgary × Mobile: blog post consolidated into the treatment-city
      // money page. Unique content (Calgary mobile coverage to Airdrie/
      // Cochrane/Okotoks/Banff/Canmore + response times + travel fees) was
      // already captured in /cities/calgary's "Mobile IV Across Alberta"
      // section during the C13 merge.
      {
        source: '/blog/mobile-iv-therapy-calgary',
        destination: '/iv-therapy/mobile-iv/calgary',
        permanent: true,
      },
      // C12 Vancouver × NAD+: blog post consolidated into the treatment-city
      // money page. Unique content (BC-specific NAD+ 3-tier CAD pricing,
      // BCCNM/CPSBC/CNPBC scope rules for NAD+, safety considerations) was
      // already captured in /cities/vancouver during the C11 merge.
      {
        source: '/blog/nad-iv-therapy-vancouver-bc',
        destination: '/iv-therapy/nad-plus/vancouver',
        permanent: true,
      },
      // -----------------------------------------------------------------
      // Toronto treatment-city consolidations — 2026-05-31
      // -----------------------------------------------------------------
      // C3, C4, C5, C6: each blog post duplicates the corresponding
      // /iv-therapy/{treatment}/toronto money page which already renders
      // the real provider grid + treatment-specific FAQs + treatment
      // education. No content merge required — search intent (e.g.,
      // "NAD+ Toronto") maps cleanly to the directory page.
      // None of these redirects touch the Signature Beauty Lounge
      // Downtown Toronto claimed provider page at /providers/*.
      // C3 Toronto × NAD+
      {
        source: '/blog/nad-plus-therapy-toronto-guide',
        destination: '/iv-therapy/nad-plus/toronto',
        permanent: true,
      },
      // C4 Toronto × Hangover
      {
        source: '/blog/hangover-iv-therapy-toronto',
        destination: '/iv-therapy/hangover-recovery/toronto',
        permanent: true,
      },
      // C5 Toronto × Myers Cocktail
      {
        source: '/blog/myers-cocktail-toronto',
        destination: '/iv-therapy/myers-cocktail/toronto',
        permanent: true,
      },
      // C6 Toronto × Mobile IV
      {
        source: '/blog/mobile-iv-therapy-toronto-gta',
        destination: '/iv-therapy/mobile-iv/toronto',
        permanent: true,
      },
      // C17 Insurance / Canada: the Ontario-specific subset is redirected
      // into the Canada-wide keeper. Unique Ontario gold (year-end deadline,
      // family-coverage stacking, package-pricing tips) was lifted into the
      // keeper before redirect. The /blog/iv-therapy-canada-complete-guide-
      // 2026 umbrella post stays standalone (different intent per audit).
      {
        source: '/blog/iv-therapy-insurance-ontario',
        destination: '/blog/iv-therapy-insurance-coverage-canada',
        permanent: true,
      },
      // C7 Toronto × Glutathione: keeper is the new treatment-city page
      // built into the matrix in A1 (commit d71fa8d). Verified live —
      // /iv-therapy/glutathione/toronto returns HTTP 200 with title
      // "Glutathione IV in Toronto, ON (2026) — 7 Clinics". The
      // /blog/glutathione-iv-therapy-benefits treatment-generic post (no
      // city) is left alone per audit (different intent).
      {
        source: '/blog/glutathione-iv-therapy-toronto',
        destination: '/iv-therapy/glutathione/toronto',
        permanent: true,
      },
      // C1 Toronto general: two large blog duplicates consolidated into
      // the city money page. /cities/toronto.content rewritten 4,178 →
      // 11,840 chars (CONO IVIT framework, 2026 CAD bands, neighbourhood
      // landscape, 7 most-common drips with safety, mobile-vs-in-clinic,
      // red-flag checklist, naturopathic-insurance angle). Signature
      // Beauty Lounge Downtown's /providers/* page is unaffected and
      // continues to rank #1 in the city's listings grid (is_featured +
      // is_claimed = true).
      {
        source: '/blog/best-iv-therapy-toronto-2026',
        destination: '/cities/toronto',
        permanent: true,
      },
      {
        source: '/blog/iv-therapy-toronto-complete-guide',
        destination: '/cities/toronto',
        permanent: true,
      },
      // C2 Toronto sub-geo (North York): blog redirects into the city
      // money page after a fresh /cities/north-york row was inserted in
      // the cities table (no row had existed — page was resolving via
      // the slug-aware provider fallback). 5,396 chars of merged content
      // with explicit deference to /cities/toronto for the regulatory
      // framework. /blog/iv-therapy-yorkville-toronto stays standalone
      // per audit (true neighborhood, no /cities/yorkville exists).
      {
        source: '/blog/iv-therapy-north-york',
        destination: '/cities/north-york',
        permanent: true,
      },
      // C10 Richmond Hill: blog redirects into the city money page after
      // a fresh /cities/richmond-hill row was inserted (no row had existed —
      // page was resolving via the slug-aware provider fallback). 14,542
      // chars of merged content including the Signature Beauty Lounge
      // Richmond Hill spotlight section preserved verbatim from the
      // source. Eva's /providers/signature-beauty-lounge-richmond-hill
      // page is untouched; her clinic continues to rank #1 in the city's
      // listings grid via is_featured + is_claimed = true ordering.
      // Sacred safety: zero references to the redirect target found in
      // Signature RH's provider row.
      {
        source: '/blog/iv-therapy-richmond-hill-2026-guide',
        destination: '/cities/richmond-hill',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
