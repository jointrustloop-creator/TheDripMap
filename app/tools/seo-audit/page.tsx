import type { Metadata } from 'next';
import { Navbar } from '../../../src/components/Navbar';
import { Footer } from '../../../src/components/Footer';
import { SeoAuditTool } from '../../../src/components/SeoAuditTool';

const title = 'Free IV Clinic SEO Audit — Score Your Website in 60 Seconds | TheDripMap';
const description =
  'See how your IV therapy clinic ranks online. A free, instant audit of your website SEO, mobile speed, structured data, and TheDripMap listing — with the exact fixes to win more patients.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://www.thedripmap.com/tools/seo-audit' },
  robots: { index: true, follow: true },
  openGraph: {
    title,
    description,
    url: 'https://www.thedripmap.com/tools/seo-audit',
    type: 'website',
    images: [{ url: 'https://www.thedripmap.com/og-image.png', width: 1200, height: 630, alt: 'TheDripMap Free SEO Audit' }],
  },
  twitter: { card: 'summary_large_image', title, description, images: ['https://www.thedripmap.com/og-image.png'] },
};

export default function SeoAuditPage() {
  return (
    <div className="min-h-screen bg-[#F8F7F3]">
      <Navbar />
      <SeoAuditTool />
      <Footer />
    </div>
  );
}
