import { Metadata } from 'next';

const title = 'Contact TheDripMap — IV Therapy Matching Platform Support';
const description = 'Get in touch with TheDripMap. Questions about your clinic listing, partnerships, or finding the right IV therapy clinic? Our team is here to help.';
const url = 'https://www.thedripmap.com/contact';
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

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
