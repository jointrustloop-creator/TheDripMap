import type { Metadata } from "next";
import ServicePageClient from "./ServicePageClient";

// Source of truth for service display names + canonical slug + aliases.
// Kept here (a server component) so generateMetadata can render the right
// title/description/canonical before the page is shipped to the client.
// Mirrored in ServicePageClient.tsx for client-side rendering / icon mapping.
const SERVICES = [
  { name: 'NAD+ Plus',           slug: 'nad-plus',             aliases: ['nad', 'nad-plus-therapy'] },
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

export async function generateMetadata({ params }: { params: Promise<{ service: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const serviceSlug = resolvedParams.service.toLowerCase();
  const service = SERVICES.find(s => s.slug === serviceSlug || (s.aliases && s.aliases.includes(serviceSlug)));
  const serviceName = service ? service.name : serviceSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  // Compliant, matching-platform, Canada-first framing. No medical or efficacy
  // claims, generic cost language only. Unique per treatment via serviceName.
  const title = `${serviceName} IV Therapy Clinics | Compare and Book | TheDripMap`;
  const description = `Compare ${serviceName} IV therapy clinics across Canada and the US, see typical pricing, and book on TheDripMap, the IV therapy matching platform.`;
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
  return <ServicePageClient serviceSlug={service} />;
}
