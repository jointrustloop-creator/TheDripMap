import { Metadata } from 'next';

const title = 'IV Therapy Treatments by Need — Find Your Match | TheDripMap';
const description = 'Explore IV therapy options for hangover recovery, immune support, athletic performance, beauty, and wellness goals. Find clinics near you that specialize in what you need.';
const url = 'https://www.thedripmap.com/iv-therapy-for';
const ogImage = 'https://www.thedripmap.com/og-image.png';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: {
    title,
    description,
    url,
    type: 'website',
    siteName: 'TheDripMap',
    images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [ogImage],
  },
};

export default function IvTherapyForLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
