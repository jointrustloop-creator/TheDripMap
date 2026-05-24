import React from 'react';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';
import { ContactPageClient } from '../../src/components/ContactPageClient';
import { getSiteStats } from '../../src/lib/data';

export const revalidate = 3600;

export default async function ContactPage() {
  const stats = await getSiteStats();

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      <ContactPageClient providerCount={stats.total} />
      <Footer />
    </div>
  );
}
