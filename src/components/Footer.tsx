'use client';
import React from 'react';
import Link from 'next/link';
import { Logo } from './Logo';
import { MedicalDisclaimer } from './MedicalDisclaimer';

export const Footer = () => {
  const POPULAR_CITIES = [
    { city: 'Toronto', state: 'ON', slug: 'toronto', country: 'Canada' },
    { city: 'New York', state: 'NY', slug: 'new-york', country: 'US' },
    { city: 'Clearwater', state: 'FL', slug: 'clearwater', country: 'US' },
    { city: 'Houston', state: 'TX', slug: 'houston', country: 'US' },
    { city: 'San Diego', state: 'CA', slug: 'san-diego', country: 'US' },
    { city: 'Tampa', state: 'FL', slug: 'tampa', country: 'US' },
    { city: 'Washington', state: 'DC', slug: 'washington', country: 'US' },
    { city: 'Kansas City', state: 'MO', slug: 'kansas-city', country: 'US' },
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
            <li><Link href="/search?specialty=NAD%2B+Plus" className="hover:text-wellness-600 transition-colors">NAD+ Therapy</Link></li>
            <li><Link href="/search?specialty=Myers+Cocktail" className="hover:text-wellness-600 transition-colors">Myers Cocktail</Link></li>
            <li><Link href="/search?specialty=Vitamin+C+IV" className="hover:text-wellness-600 transition-colors">Vitamin C IV</Link></li>
            <li><Link href="/search?specialty=Hydration" className="hover:text-wellness-600 transition-colors">Hydration Drips</Link></li>
            <li><Link href="/search?type=Mobile" className="hover:text-wellness-600 transition-colors">Mobile IV</Link></li>
            <li><Link href="/search?specialty=Hangover+Relief" className="hover:text-wellness-600 transition-colors">Hangover Relief</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-6 text-sm uppercase tracking-wider text-slate-400">Popular Hubs</h4>
          <ul className="space-y-4 text-slate-600 text-sm">
            {POPULAR_CITIES.map((city, idx) => (
              <li key={idx}>
                <Link 
                  href={`/cities/${city.slug}`} 
                  className="hover:text-wellness-600 transition-colors"
                >
                  {city.city}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/cities" className="text-wellness-600 font-bold hover:underline">
                View All Cities
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-6 text-sm uppercase tracking-wider text-slate-400">Company</h4>
          <ul className="space-y-4 text-slate-600 text-sm">
            <li><Link href="/about" className="hover:text-wellness-600 transition-colors">About</Link></li>
            <li><Link href="/blog" className="hover:text-wellness-600 transition-colors">Blog</Link></li>
            <li><Link href="/symptoms" className="hover:text-wellness-600 transition-colors">Symptoms Hub</Link></li>
            <li><Link href="/for-clinics" className="hover:text-wellness-600 transition-colors">For Clinics</Link></li>
            <li><Link href="/contact" className="hover:text-wellness-600 transition-colors">Contact</Link></li>
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
