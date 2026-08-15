import type { Metadata } from "next";
import { Suspense } from "react";
import { permanentRedirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import ServicePageClient from "./ServicePageClient";
import { getListingsByService, getTopHubs } from "../../../src/lib/data";
import { TREATMENT_HUBS } from "../../../src/lib/treatment-hub-content";

// Regenerate the static pages hourly so the server-rendered clinic list stays
// fresh without a redeploy (pairs with the server fetch in ServicePage below).
export const revalidate = 3600;

// Source of truth for service display names + canonical slug + aliases.
// Kept here (a server component) so generateMetadata can render the right
// title/description/canonical before the page is shipped to the client.
// Mirrored in ServicePageClient.tsx for client-side rendering / icon mapping.
const SERVICES = [
  // titleName overrides the menu name in <title>/description only: "NAD+ Plus
  // IV Therapy" reads as "NAD plus plus" in a SERP, and searchers query "NAD+".
  { name: 'NAD+ Plus',           titleName: 'NAD+', slug: 'nad-plus',             aliases: ['nad', 'nad-plus-therapy'] },
  { name: 'Hangover',            slug: 'hangover',             aliases: ['hangover-recovery'] },
  { name: 'Immune Support',      slug: 'immune-support',       aliases: [] },
  { name: 'Beauty Glow',         slug: 'beauty-glow',          aliases: [] },
  { name: 'Weight Loss',         slug: 'weight-loss',          aliases: [] },
  { name: 'Hydration',           slug: 'hydration',            aliases: [] },
  { name: 'Recovery',            slug: 'recovery',             aliases: ['athletic-recovery'] },
  { name: 'Myers Cocktail',      slug: 'myers-cocktail',       aliases: [] },
  { name: 'Jet Lag',             slug: 'jet-lag',              aliases: [] },
  { name: 'Energy Boost',        slug: 'energy-boost',         aliases: [] },
  { name: 'GLP-1 Weight Loss',   slug: 'glp-1-weight-loss',    aliases: ['glp-1', 'glp1', 'semaglutide', 'tirzepatide', 'ozempic', 'wegovy', 'mounjaro'] },
  { name: 'Iron Infusion',       slug: 'iron-infusion',        aliases: ['iron', 'iv-iron'] },
  { name: 'Vitamin D',           slug: 'vitamin-d',            aliases: ['vitamin-d-injection', 'vitamin-d3', 'd3'] },
  { name: 'B12 Shot',            slug: 'b12-shot',             aliases: ['b12', 'vitamin-b12', 'b-12'] },
  { name: 'Glutathione',         slug: 'glutathione',          aliases: ['glutathione-push', 'gsh'] },
  { name: 'High-Dose Vitamin C', slug: 'high-dose-vitamin-c',  aliases: ['vitamin-c', 'ivc', 'high-dose-vitamin-c-iv'] },
  { name: 'Cold & Flu',          slug: 'cold-and-flu',         aliases: ['cold-flu', 'sick-day', 'flu', 'cold'] },
  { name: 'Migraine Relief',     slug: 'migraine-relief',      aliases: ['migraine', 'headache', 'migraine-cocktail'] },
  { name: 'Hormone Therapy',     slug: 'hormone-therapy',      aliases: ['trt', 'hrt', 'testosterone', 'hormone', 'bhrt'] },
];

// Prerender the canonical service pages as static HTML. Without this the route
// is rendered on-demand (dynamic), and Next 15.5 streams generateMetadata output
// (title/canonical) into the <body> instead of <head>. Static generation, paired
// with the Suspense boundary around the useSearchParams client child, inlines the
// metadata in <head> (matching the already-static /iv-therapy and /cities pages).
// Aliases + unknown slugs still render on-demand (dynamicParams stays true) and
// 308-redirect to their canonical, which is static.
export function generateStaticParams() {
  return SERVICES.map((s) => ({ service: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ service: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const serviceSlug = resolvedParams.service.toLowerCase();
  const service = SERVICES.find(s => s.slug === serviceSlug || (s.aliases && s.aliases.includes(serviceSlug)));
  const serviceName = service ? ((service as { titleName?: string }).titleName || service.name) : serviceSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  const title = `${serviceName} IV Therapy Clinics Near Me | TheDripMap`;
  // Hub pages carry the honest-triage voice (2026-08-15 Move 1): the
  // description promises comparison + real data + verification, not a booking
  // pitch. Non-hub slugs keep the legacy line.
  const hasHub = !!(service && TREATMENT_HUBS[service.slug]);
  const description = hasHub
    ? `${serviceName} IV therapy in Canada: the honest verdict, real prices from clinic menus we captured, and how to check who prescribes before you book.`
    : `Find ${serviceName} IV therapy clinics near you. Compare top-rated providers, see pricing, and book your ${serviceName} drip session in-clinic or mobile.`;
  const siteUrl = 'https://www.thedripmap.com';
  const canonicalUrl = `${siteUrl}/treatments/${service ? service.slug : serviceSlug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'TheDripMap',
      type: 'website',
      images: [
        {
          url: `${siteUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: `${serviceName} IV Therapy`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${siteUrl}/og-image.png`],
    },
  };
}

export default async function ServicePage({ params }: { params: Promise<{ service: string }> }) {
  const { service } = await params;

  // Alias slugs (e.g. /treatments/nad-plus-therapy, /treatments/b12) used to
  // render as full 200 duplicates of the canonical page, relying on the
  // canonical tag alone. Google indexed them as "Alternate page with proper
  // canonical tag" (323 pages in the 2026-07-04 GSC coverage export) and
  // showed them in SERPs at diluted positions. A permanent redirect (308)
  // consolidates every alias onto the one canonical URL.
  const slug = service.toLowerCase();
  const match = SERVICES.find((s) => s.slug === slug || (s.aliases && s.aliases.includes(slug)));
  if (match && slug !== match.slug) {
    permanentRedirect(`/treatments/${match.slug}`);
  }

  // Server-rendered initial content (2026-08-07 deep-check fix): these pages
  // previously shipped ZERO clinics in the HTML (everything fetched client-side
  // in useEffect), so Google indexed 19 empty treatment hubs. We now fetch a
  // Canada-first national list + Canadian hub cities on the server and pass
  // them down; the client keeps its geo personalization on top.
  const svcName = match ? match.name : slug;
  let initialListings: Awaited<ReturnType<typeof getListingsByService>> = [];
  let initialHubs: Awaited<ReturnType<typeof getTopHubs>> = [];
  try {
    const [national, hubs] = await Promise.all([
      getListingsByService(svcName, 60),
      getTopHubs(8),
    ]);
    initialListings = (national as Array<{ country?: string }>).filter((p) => p.country === 'Canada').slice(0, 24) as typeof national;
    initialHubs = hubs;
  } catch {
    // Never fail the page over the initial fetch; the client path still loads.
  }

  // Hub editorial (Move 1 of the 2026-08-15 audit) + live captured price stats
  // from clinic_drips for this treatment's formula. Tolerant: stats are null if
  // the table is absent or empty, and the page renders without them.
  const hubContent = match ? TREATMENT_HUBS[match.slug] : undefined;
  let priceStats: { n: number; min: number; max: number } | null = null;
  if (hubContent?.formulaId && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
      const { data } = await sb
        .from('clinic_drips')
        .select('price_cad')
        .eq('formula_id', hubContent.formulaId)
        .eq('is_active', true)
        .not('price_cad', 'is', null);
      const prices = (data || []).map((r) => Number(r.price_cad)).filter((n) => n > 0);
      if (prices.length) priceStats = { n: prices.length, min: Math.min(...prices), max: Math.max(...prices) };
    } catch { /* stats are optional */ }
  }

  // FAQPage JSON-LD: rendered as a sibling of the Suspense boundary so it
  // exists in the server HTML AND survives hydration (fallback-only content
  // disappears from the rendered DOM once the client component mounts).
  const faqJsonLd = hubContent
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: hubContent.faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      }
    : null;

  // ServicePageClient calls useSearchParams() (reads ?city=). Without a Suspense
  // boundary that opts the WHOLE route into dynamic rendering, which streams the
  // generateMetadata output (title/canonical/description) into the <body> instead
  // of <head> (Google may then ignore the canonical). Wrapping the dynamic child
  // in Suspense lets the shell + <head> render statically so metadata lands in
  // <head>. See SEO crawler finding "metadata rendered outside <head>" (2026-07).
  // The Suspense fallback IS the crawlable content. Because ServicePageClient
  // calls useSearchParams(), Next renders only the fallback into the static
  // HTML and hydrates the real component in the browser. A blank fallback meant
  // Google indexed 19 empty treatment hubs (2026-08-07 audit). Rendering the
  // real, server-fetched Canadian clinic list as the fallback puts genuine
  // content + internal links in the HTML, then the client takes over on load.
  const fallback = (
    <div className="min-h-screen bg-[#FDFDFB]">
      <main className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
          {svcName} IV therapy clinics in Canada
        </h1>
        {hubContent && (
          <section className="max-w-3xl mb-10">
            <h2 className="text-sm font-black uppercase tracking-widest text-wellness-700 mb-2">The honest verdict</h2>
            {hubContent.verdict.map((p, i) => (
              <p key={i} className="text-slate-700 leading-relaxed mb-3">{p}</p>
            ))}
            {priceStats && priceStats.n > 0 && (
              <p className="text-sm text-slate-500 mb-3">
                Real prices from Canadian clinic menus we captured: {priceStats.n === 1 ? `$${priceStats.min}` : `$${priceStats.min} to $${priceStats.max}`} across {priceStats.n} published menu {priceStats.n === 1 ? 'item' : 'items'}. See the <a href="/iv-prices" className="text-wellness-700 font-bold">price index</a> for city detail.
              </p>
            )}
            <ul className="mb-6">
              {hubContent.links.map((l) => (
                <li key={l.href}><a href={l.href} className="text-wellness-700 font-bold text-sm">{l.label}</a></li>
              ))}
            </ul>
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-2">Frequently asked questions</h2>
            {hubContent.faqs.map((f) => (
              <div key={f.q} className="mb-4">
                <h3 className="font-bold text-slate-900">{f.q}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{f.a}</p>
              </div>
            ))}
          </section>
        )}
        {initialListings.length > 0 ? (
          <>
            <p className="text-lg text-slate-600 mb-8">
              {initialListings.length} {initialListings.length === 1 ? 'clinic' : 'clinics'} offering {svcName.toLowerCase()} on TheDripMap. Claimed and Safety Verified clinics are listed first.
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
              {initialListings.map((p) => (
                <li key={p.id} className="bg-white border border-slate-200 rounded-2xl p-5">
                  <a href={`/providers/${p.slug || ''}`} className="font-black text-slate-900 hover:text-wellness-700">{p.name}</a>
                  <div className="text-sm text-slate-500 mt-1">
                    {[p.city, p.state].filter(Boolean).join(', ')}
                    {Number(p.rating) > 0 ? ` · ${Number(p.rating).toFixed(1)} stars` : ''}
                    {p.is_featured ? ' · Featured' : p.is_claimed ? ' · Claimed' : ''}
                    {(p as { safety_verified?: boolean }).safety_verified ? ' · Safety Verified' : ''}
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-lg text-slate-600 mb-8">
            Loading {svcName.toLowerCase()} clinics. Browse all clinics by city on <a href="/cities" className="text-wellness-700 font-bold">TheDripMap</a>.
          </p>
        )}
        {initialHubs.length > 0 && (
          <nav aria-label="Cities" className="border-t border-slate-200 pt-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-3">{svcName} by city</h2>
            <div className="flex flex-wrap gap-2">
              {initialHubs.map((h) => (
                <a key={h.city} href={`/cities/${h.city.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-sm font-bold text-slate-700">
                  {h.city} <span className="text-slate-400">{h.count}</span>
                </a>
              ))}
            </div>
          </nav>
        )}
      </main>
    </div>
  );

  return (
    <>
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <Suspense fallback={fallback}>
        <ServicePageClient
          serviceSlug={service}
          initialListings={initialListings}
          initialHubs={initialHubs}
          hub={hubContent}
          priceStats={priceStats}
        />
      </Suspense>
    </>
  );
}
