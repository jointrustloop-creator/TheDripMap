'use client';
import React from 'react';
import Link from 'next/link';
import { Logo } from './Logo';
import { MedicalDisclaimer } from './MedicalDisclaimer';

export const Footer = () => {
  const POPULAR_CITIES = [
    { city: 'San Francisco', state: 'CA', href: '/iv-therapy/california/san-francisco' },
    { city: 'Las Vegas', state: 'NV', href: '/iv-therapy/nevada/las-vegas' },
    { city: 'San Diego', state: 'CA', href: '/iv-therapy/california/san-diego' },
    { city: 'Chicago', state: 'IL', href: '/iv-therapy/illinois/chicago' },
    { city: 'New York', state: 'NY', href: '/iv-therapy/ny/new-york' },
    { city: 'Los Angeles', state: 'CA', href: '/iv-therapy/california/los-angeles' },
  ];

  return (
    <footer className="bg-white border-t border-slate-200 py-12 px-6 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
        <div className="lg:col-span-2">
          <Link href="/" className="inline-block mb-6">
            <Logo />
          </Link>
          <p className="text-slate-500 max-w-sm leading-relaxed">
            The premium directory for IV therapy and clinical wellness. We help you find the perfect provider based on your specific health goals and lifestyle needs.
          </p>
        </div>
        <div>
          <h4 className="font-bold mb-6 text-sm uppercase tracking-wider text-slate-400">Services</h4>
          <ul className="space-y-4 text-slate-600 text-sm">
            <li><Link href="/iv-therapy/treatment/nad-plus" className="hover:text-wellness-600 transition-colors">NAD+ Therapy</Link></li>
            <li><Link href="/iv-therapy/treatment/hangover" className="hover:text-wellness-600 transition-colors">Hangover IV</Link></li>
            <li><Link href="/iv-therapy/treatment/immune-support" className="hover:text-wellness-600 transition-colors">Immune Support</Link></li>
            <li><Link href="/iv-therapy/treatment/beauty-glow" className="hover:text-wellness-600 transition-colors">Beauty & Glow</Link></li>
            <li><Link href="/iv-therapy/treatment/weight-loss" className="hover:text-wellness-600 transition-colors">Weight Loss Drips</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-6 text-sm uppercase tracking-wider text-slate-400">Popular Hubs</h4>
          <ul className="space-y-4 text-slate-600 text-sm">
            {POPULAR_CITIES.map((city, idx) => (
              <li key={idx}>
                <Link 
                  href={city.href} 
                  className="hover:text-wellness-600 transition-colors"
                  onClick={() => {
                    const newLoc = {
                      city: city.city,
                      state: city.state,
                      country: 'US',
                      isPrecise: false,
                      detectedAt: Date.now()
                    };
                    sessionStorage.setItem('tdm_location', JSON.stringify(newLoc));
                    window.dispatchEvent(new CustomEvent('tdm_location_change', { detail: newLoc }));
                  }}
                >
                  {city.city}, {city.state}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/search" className="text-wellness-600 font-bold hover:underline">
                View All Cities
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-6 text-sm uppercase tracking-wider text-slate-400">Company</h4>
          <ul className="space-y-4 text-slate-600 text-sm">
            <li><Link href="/iv-therapy-for" className="hover:text-wellness-600 transition-colors">Symptoms Hub</Link></li>
            <li><Link href="/about" className="hover:text-wellness-600 transition-colors">About Us</Link></li>
            <li><Link href="/contact" className="hover:text-wellness-600 transition-colors">Contact</Link></li>
            <li><Link href="/privacy" className="hover:text-wellness-600 transition-colors">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-wellness-600 transition-colors">Terms of Service</Link></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-100 flex flex-col items-center gap-8">
        <MedicalDisclaimer />
        <div className="text-slate-400 text-sm">
          © 2026 TheDripMap. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
