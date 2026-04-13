import type { Metadata } from "next";
import React from "react";

const SERVICES = [
  { name: 'NAD+ Plus', slug: 'nad-plus' },
  { name: 'Hangover', slug: 'hangover' },
  { name: 'Immune Support', slug: 'immune-support' },
  { name: 'Beauty Glow', slug: 'beauty-glow' },
  { name: 'Weight Loss', slug: 'weight-loss' },
  { name: 'Hydration', slug: 'hydration' },
  { name: 'Recovery', slug: 'recovery' },
  { name: 'Myers Cocktail', slug: 'myers-cocktail' },
];

type Props = {
  params: Promise<{ service: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: { params: Promise<{ service: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const service = SERVICES.find(s => s.slug === resolvedParams.service);
  const serviceName = service ? service.name : resolvedParams.service.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  
  const title = `${serviceName} IV Therapy Near Me — Top Rated Clinics | TheDripMap`;
  const description = `Find and compare the best ${serviceName} IV therapy providers. Browse top-rated clinics and mobile services specializing in ${serviceName} protocols to help you reach your wellness goals.`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thedripmap.com';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl}/iv-therapy/treatment/${resolvedParams.service}`,
      siteName: 'TheDripMap',
      type: 'website',
      images: [
        {
          url: '/og-image.png',
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
      images: ['/og-image.png'],
    },
  };
}

export default function ServiceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
