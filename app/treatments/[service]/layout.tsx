import type { Metadata } from "next";
import React from "react";

const SERVICES = [
  { name: 'NAD+ Plus', slug: 'nad-plus', aliases: ['nad'] },
  { name: 'Hangover', slug: 'hangover' },
  { name: 'Immune Support', slug: 'immune-support' },
  { name: 'Beauty Glow', slug: 'beauty-glow' },
  { name: 'Weight Loss', slug: 'weight-loss' },
  { name: 'Hydration', slug: 'hydration' },
  { name: 'Recovery', slug: 'recovery' },
  { name: 'Myers Cocktail', slug: 'myers-cocktail' },
];

export async function generateMetadata({ params }: { params: Promise<{ service: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const serviceSlug = resolvedParams.service.toLowerCase();
  const service = SERVICES.find(s => s.slug === serviceSlug || (s.aliases && s.aliases.includes(serviceSlug)));
  const serviceName = service ? service.name : serviceSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  
  const title = `${serviceName} IV Therapy Near Me — Top Rated Clinics | TheDripMap`;
  const description = `Find and compare the best ${serviceName} IV therapy providers. Browse top-rated clinics and mobile services specializing in ${serviceName} protocols to help you reach your wellness goals.`;
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
