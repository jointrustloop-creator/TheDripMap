import React from 'react';
import { Metadata } from 'next';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';

const termsTitle = "Terms of Service | TheDripMap";
const termsDescription = "The rules and guidelines for using TheDripMap platform.";
const termsOgImage = 'https://www.thedripmap.com/og-image.png';

export const metadata: Metadata = {
  title: termsTitle,
  description: termsDescription,
  alternates: { canonical: 'https://www.thedripmap.com/terms' },
  openGraph: {
    title: termsTitle,
    description: termsDescription,
    url: 'https://www.thedripmap.com/terms',
    type: 'website',
    siteName: 'TheDripMap',
    images: [{ url: termsOgImage, width: 1200, height: 630, alt: 'TheDripMap' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: termsTitle,
    description: termsDescription,
    images: [termsOgImage],
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-black text-slate-900 mb-8">Terms of Service</h1>
        <div className="prose prose-slate max-w-none">
          <p>Last updated: April 5, 2025</p>
          <p>By using TheDripMap, you agree to these terms. Please read them carefully.</p>
          <h2>1. Use of Our Services</h2>
          <p>You must follow any policies made available to you within the Services.</p>
          <h2>2. Medical Disclaimer</h2>
          <p>The content on TheDripMap is for informational purposes only and is not intended as medical advice. Always seek the advice of a qualified healthcare provider.</p>
          <h2>3. Limitation of Liability</h2>
          <p>TheDripMap is not liable for any damages arising from your use of our platform or the services provided by third-party clinics.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
