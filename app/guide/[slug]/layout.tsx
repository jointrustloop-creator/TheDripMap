import type { Metadata } from 'next';
import React from 'react';
import { getGuideBySlug } from '../../../src/lib/guides';

const SITE_URL = 'https://www.thedripmap.com';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    return { title: 'Guide Not Found | TheDripMap' };
  }

  const title = `${guide.metaTitle} | TheDripMap`;
  const description = guide.metaDescription;
  const url = `${SITE_URL}/guide/${guide.slug}`;
  const ogImage = `${SITE_URL}/og-image.png`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      siteName: 'TheDripMap',
      images: [{ url: ogImage, width: 1200, height: 630, alt: guide.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
