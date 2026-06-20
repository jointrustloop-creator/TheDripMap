'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Instagram, Facebook, Linkedin, Twitter } from 'lucide-react';
import { Logo } from './Logo';
import { MedicalDisclaimer } from './MedicalDisclaimer';

type FooterCity = { name: string; slug: string; count?: number; suburbs?: FooterCity[] };

const POPULAR_CITIES_STATIC: FooterCity[] = [
  { name: 'New York', slug: 'new-york' },
  { name: 'Houston', slug: 'houston' },
  { name: 'San Diego', slug: 'san-diego' },
  { name: 'Clearwater', slug: 'clearwater' },
  { name: 'Los Angeles', slug: 'los-angeles' },
  {
    name: 'Toronto & GTA',
    slug: 'toronto',
    suburbs: [
      { name: 'Mississauga', slug: 'mississauga' },
      { name: 'Richmond Hill', slug: 'richmond-hill' },
      { name: 'Vaughan', slug: 'vaughan' },
      { name: 'Markham', slug: 'markham' },
      { name: 'Brampton', slug: 'brampton' },
    ],
  },
  { name: 'Las Vegas', slug: 'las-vegas' },
  { name: 'Washington DC', slug: 'washington' },
];

export const Footer = () => {
  const [citiesWithCounts, setCitiesWithCounts] = useState<FooterCity[]>(POPULAR_CITIES_STATIC);

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
    <footer className="bg-white border-t-2 border-[#0F6E56] py-12 px-6 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12">
        <div className="lg:col-span-2 flex flex-col items-start text-left">
          <Link href="/" className="inline-flex mb-6 self-start">
            <Logo />
          </Link>
          <p className="text-[15px] text-slate-500 max-w-sm leading-relaxed">
            The IV therapy matching platform. We match you with the right clinic based on your specific health goals, location, and budget — in under 60 seconds.
          </p>
          <div className="mt-5 flex items-center gap-2">
            <a
              href="https://www.instagram.com/thedripmap/"
              target="_blank"
              rel="me noopener noreferrer"
              aria-label="TheDripMap on Instagram (@thedripmap)"
              className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 text-slate-400 hover:text-wellness-700 hover:border-wellness-200 hover:bg-wellness-50 transition-all"
            >
              <Instagram size={16} strokeWidth={2} />
            </a>
            <a
              href="#"
              aria-label="TheDripMap on Facebook"
              className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 text-slate-400 hover:text-wellness-700 hover:border-wellness-200 hover:bg-wellness-50 transition-all"
            >
              <Facebook size={16} strokeWidth={2} />
            </a>
            <a
              href="#"
              aria-label="TheDripMap on LinkedIn"
              className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 text-slate-400 hover:text-wellness-700 hover:border-wellness-200 hover:bg-wellness-50 transition-all"
            >
              <Linkedin size={16} strokeWidth={2} />
            </a>
            <a
              href="#"
              aria-label="TheDripMap on X (Twitter)"
              className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 text-slate-400 hover:text-wellness-700 hover:border-wellness-200 hover:bg-wellness-50 transition-all"
            >
              <Twitter size={16} strokeWidth={2} />
            </a>
          </div>
        </div>
        <div>
          <h4 className="font-bold mb-6 text-sm uppercase tracking-wider text-slate-400">Services</h4>
          <ul className="space-y-4 text-slate-600 text-sm">
            <li><Link href="/treatments" className="hover:text-wellness-600 transition-colors font-bold text-slate-900">All Treatments →</Link></li>
            <li><Link href="/treatments/nad-plus" className="hover:text-wellness-600 transition-colors">NAD+ Therapy</Link></li>
            <li><Link href="/treatments/myers-cocktail" className="hover:text-wellness-600 transition-colors">Myers Cocktail</Link></li>
            <li><Link href="/treatments/immune-support" className="hover:text-wellness-600 transition-colors">Vitamin C IV</Link></li>
            <li><Link href="/treatments/hydration" className="hover:text-wellness-600 transition-colors">Hydration Drips</Link></li>
            <li><Link href="/search?type=Mobile" className="hover:text-wellness-600 transition-colors">Mobile IV</Link></li>
            <li><Link href="/treatments/hangover" className="hover:text-wellness-600 transition-colors">Hangover Relief</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-6 text-sm uppercase tracking-wider text-slate-400">Popular Hubs</h4>
          <ul className="space-y-4 text-slate-600 text-sm">
            {citiesWithCounts.map((city, idx) => (
              <li key={idx}>
                <div className="flex items-center justify-between group max-w-[200px]">
                  <Link
                    href={`/cities/${city.slug}`}
                    className="hover:text-wellness-600 transition-colors"
                  >
                    {city.name}
                  </Link>
                  {city.count !== undefined && city.count > 0 && (
                    <span className="text-[10px] bg-slate-50 text-[#0F6E56] px-1.5 py-0.5 rounded-full font-bold group-hover:bg-wellness-50 group-hover:text-wellness-700 transition-colors">
                      {city.count}
                    </span>
                  )}
                </div>
                {city.suburbs && city.suburbs.length > 0 && (
                  <ul className="mt-3 ml-1 pl-3 border-l-2 border-wellness-100 space-y-2.5">
                    {city.suburbs.map((su, i) => (
                      <li key={i} className="flex items-center justify-between group max-w-[190px]">
                        <Link
                          href={`/cities/${su.slug}`}
                          className="text-[13px] text-slate-500 hover:text-wellness-600 transition-colors"
                        >
                          {su.name}
                        </Link>
                        {su.count !== undefined && su.count > 0 && (
                          <span className="text-[10px] bg-slate-50 text-[#0F6E56] px-1.5 py-0.5 rounded-full font-bold group-hover:bg-wellness-50 group-hover:text-wellness-700 transition-colors">
                            {su.count}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
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
            <li><Link href="/guide" className="hover:text-wellness-600 transition-colors">Guides</Link></li>
            <li><Link href="/blog" className="hover:text-wellness-600 transition-colors">Blog</Link></li>
            <li><Link href="/symptoms" className="hover:text-wellness-600 transition-colors">Symptoms Hub</Link></li>
            <li><Link href="/for-clinics" className="hover:text-wellness-600 transition-colors">For Clinics</Link></li>
            <li><Link href="/contact" className="hover:text-wellness-600 transition-colors">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-6 text-sm uppercase tracking-wider text-slate-400">Resources</h4>
          <ul className="space-y-4 text-slate-600 text-sm">
            <li><Link href="/resources" className="hover:text-wellness-600 transition-colors">Patient Resources</Link></li>
            <li><Link href="/resources/clinic-owners" className="hover:text-wellness-600 transition-colors">For Clinic Owners</Link></li>
            <li><Link href="/tools/seo-audit" className="hover:text-wellness-600 transition-colors">Free SEO Audit</Link></li>
            <li><Link href="/blog/iv-therapy-safety-side-effects-guide" className="hover:text-wellness-600 transition-colors">Safety Compliance</Link></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-100 flex flex-col items-center gap-8">
        <MedicalDisclaimer />
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-5 text-sm text-slate-500">
            <Link href="/privacy" className="hover:text-wellness-600 transition-colors">Privacy Policy</Link>
            <span className="text-slate-300">·</span>
            <Link href="/terms" className="hover:text-wellness-600 transition-colors">Terms of Service</Link>
          </div>
          <div className="text-slate-400 text-sm">
            © 2026 TheDripMap. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
