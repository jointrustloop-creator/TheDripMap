import type { Metadata } from 'next';
import React from 'react';
import { getStateBySlug } from '../../../src/lib/states';
import { getListingsByState } from '../../../src/lib/data';

const SITE_URL = 'https://www.thedripmap.com';

export async function generateMetadata({ params }: { params: Promise<{ state: string }> }): Promise<Metadata> {
  const { state: stateSlug } = await params;
  const state = getStateBySlug(stateSlug);

  if (!state) {
    return { title: 'State Not Found | TheDripMap' };
  }

  const providers = await getListingsByState(state.name);
  const total = providers.length;

  const cityCountMap = new Map<string, number>();
  providers.forEach((p) => {
    if (p.city) cityCountMap.set(p.city, (cityCountMap.get(p.city) || 0) + 1);
  });
  const cityCount = cityCountMap.size;
  const topCities = Array.from(cityCountMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([city]) => city);

  const title = `IV Therapy in ${state.name} — ${total} Top-Rated Clinics in ${cityCount} Cities | TheDripMap`;
  const description = `Find IV therapy clinics across ${state.name}. Compare ${total} top-rated providers in ${topCities.join(', ')}, and more. Book hangover recovery, NAD+, immune support, and hydration drips.`;
  const url = `${SITE_URL}/states/${state.slug}`;
  const ogImage = `${SITE_URL}/og-image.png`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      siteName: 'TheDripMap',
      images: [{ url: ogImage, width: 1200, height: 630, alt: `IV Therapy in ${state.name}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default function StateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
