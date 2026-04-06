import React from 'react';
import { Metadata } from 'next';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';

export const metadata: Metadata = {
  title: "Privacy Policy | TheDripMap",
  description: "Our commitment to protecting your privacy and medical data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-black text-slate-900 mb-8">Privacy Policy</h1>
        <div className="prose prose-slate max-w-none">
          <p>Last updated: April 5, 2024</p>
          <p>At TheDripMap, we take your privacy seriously. This policy describes how we collect, use, and protect your personal information.</p>
          <h2>1. Information We Collect</h2>
          <p>We collect information you provide directly to us, such as when you take our clinical matching quiz or contact us for support.</p>
          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect to provide, maintain, and improve our services, and to match you with appropriate IV therapy providers.</p>
          <h2>3. Data Security</h2>
          <p>We implement reasonable security measures to protect your information from unauthorized access or disclosure.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
