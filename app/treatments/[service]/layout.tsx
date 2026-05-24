import type { Metadata } from "next";
import React from "react";

const SERVICES = [
  { name: 'NAD+ Plus',      slug: 'nad-plus',       aliases: ['nad', 'nad-plus-therapy'] },
  { name: 'Hangover',       slug: 'hangover',       aliases: ['hangover-recovery'] },
  { name: 'Immune Support', slug: 'immune-support', aliases: [] },
  { name: 'Beauty Glow',    slug: 'beauty-glow',    aliases: [] },
  { name: 'Weight Loss',    slug: 'weight-loss',    aliases: [] },
  { name: 'Hydration',      slug: 'hydration',      aliases: [] },
  { name: 'Recovery',       slug: 'recovery',       aliases: ['athletic-recovery'] },
  { name: 'Myers Cocktail', slug: 'myers-cocktail', aliases: [] },
  { name: 'Jet Lag',        slug: 'jet-lag',        aliases: [] },
  { name: 'Energy Boost',   slug: 'energy-boost',   aliases: [] },
];

export async function generateMetadata({ params }: { params: Promise<{ service: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const serviceSlug = resolvedParams.service.toLowerCase();
  const service = SERVICES.find(s => s.slug === serviceSlug || (s.aliases && s.aliases.includes(serviceSlug)));
  const serviceName = service ? service.name : serviceSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  const title = `${serviceName} IV Therapy Clinics Near Me | TheDripMap`;
  const description = `Find ${serviceName} IV therapy clinics near you. Compare top-rated providers, see pricing, and book your ${serviceName} drip session — in-clinic or mobile.`;
  const siteUrl = 'https://www.thedripmap.com';

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/treatments/${resolvedParams.service}`,
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/treatments/${resolvedParams.service}`,
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

export default function ServiceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
