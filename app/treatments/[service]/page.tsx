import type { Metadata } from "next";
import { Suspense } from "react";
import { permanentRedirect } from "next/navigation";
import ServicePageClient from "./ServicePageClient";

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
  const description = `Find ${serviceName} IV therapy clinics near you. Compare top-rated providers, see pricing, and book your ${serviceName} drip session in-clinic or mobile.`;
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

  // ServicePageClient calls useSearchParams() (reads ?city=). Without a Suspense
  // boundary that opts the WHOLE route into dynamic rendering, which streams the
  // generateMetadata output (title/canonical/description) into the <body> instead
  // of <head> (Google may then ignore the canonical). Wrapping the dynamic child
  // in Suspense lets the shell + <head> render statically so metadata lands in
  // <head>. See SEO crawler finding "metadata rendered outside <head>" (2026-07).
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFDFB]" />}>
      <ServicePageClient serviceSlug={service} />
    </Suspense>
  );
}
