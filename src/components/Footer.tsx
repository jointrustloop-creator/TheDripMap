'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Logo } from './Logo';
import { MedicalDisclaimer } from './MedicalDisclaimer';

const POPULAR_CITIES_STATIC = [
  { name: 'Toronto & GTA', slug: 'toronto' },
  { name: 'New York', slug: 'new-york' },
  { name: 'Los Angeles', slug: 'los-angeles' },
  { name: 'Chicago', slug: 'chicago' },
  { name: 'Houston', slug: 'houston' },
  { name: 'San Diego', slug: 'san-diego' },
  { name: 'Washington DC', slug: 'washington' },
  { name: 'Clearwater', slug: 'clearwater' },
];

export const Footer = () => {
  const [citiesWithCounts, setCitiesWithCounts] = useState<{name: string, slug: string, count?: number}[]>(POPULAR_CITIES_STATIC);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const { getPopularCities } = await import('../lib/data');
        const data = await getPopularCities();
        if (data && data.length > 0) {
          setCitiesWithCounts(data);
        }
      } catch (err) {
        console.error('Error fetching footer city counts:', err);
      }
    };
    fetchCounts();
  }, []);

  return (
    <footer className="bg-white border-t border-slate-200 py-12 px-6 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
        <div className="lg:col-span-2 flex flex-col items-start text-left">
          <Link href="/" className="inline-flex mb-6 self-start">
            <Logo />
          </Link>
          <p className="text-slate-500 max-w-sm leading-relaxed">
            The IV therapy matching platform. We match you with the right clinic based on your specific health goals, location, and budget — in under 60 seconds.
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
            {citiesWithCounts.map((city, idx) => (
              <li key={idx} className="flex items-center justify-between group max-w-[200px]">
                <Link 
                  href={`/cities/${city.slug}`} 
                  className="hover:text-wellness-600 transition-colors"
                >
                  {city.name}
                </Link>
                {city.count !== undefined && city.count > 0 && (
                  <span className="text-[10px] bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded-full font-bold group-hover:bg-wellness-50 group-hover:text-wellness-600 transition-colors">
                    {city.count}
                  </span>
                )}
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
