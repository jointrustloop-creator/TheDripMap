import type { Metadata } from 'next';
import { Navbar } from '../../../../src/components/Navbar';
import { Footer } from '../../../../src/components/Footer';
import { OrderForm } from './OrderForm';

const SITE_URL = 'https://www.thedripmap.com';

export const metadata: Metadata = {
  title: 'Get Found Kit, intake | TheDripMap',
  description: 'Submit your clinic details so we can build your custom Get Found Kit. Delivered to your inbox within 48 hours.',
  alternates: { canonical: `${SITE_URL}/tools/get-found-kit/order` },
  // noindex the intake form so it doesn't get crawled or rank for searches.
  // The marketing card on /admin/tools (and any future public landing) is
  // what gets advertised.
  robots: { index: false, follow: false },
};

export default function GetFoundKitOrderPage() {
  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
            Tell us about your clinic
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Five quick fields and we will build your Get Found Kit. Delivered to your inbox within 48 hours, no follow-up calls.
          </p>
        </div>
        <OrderForm />
      </main>
      <Footer />
    </div>
  );
}
