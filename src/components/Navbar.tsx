'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Zap, Menu, X, ChevronDown } from 'lucide-react';
import { Logo } from './Logo';
import { LocationIndicator } from './LocationIndicator';
import { motion, AnimatePresence } from 'motion/react';

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Explore Clinics', href: '/search' },
    { label: 'Treatments', href: '/treatments' },
    { label: 'Blog', href: '/blog' },
  ];

  const whoWeServe = [
    { label: 'Patients & Wellness Seekers', href: '/for/patients' },
    { label: 'Hangover Recovery', href: '/for/hangover-recovery' },
    { label: 'Athletes & Performance', href: '/for/athletes' },
    { label: 'Business Travelers', href: '/for/business-travelers' },
    { label: 'Seniors & Longevity', href: '/for/seniors' },
    { label: 'Brides & Wedding Parties', href: '/for/weddings' },
    { label: 'Mobile IV Nurses & Practitioners', href: '/for/practitioners' },
    { label: 'Clinic Owners', href: '/for-clinics' },
  ];

  // Guides leads, then a divider before the resource hubs/tools.
  const resources = [
    { label: 'Guides', href: '/guide' },
    { label: 'For Patients', href: '/resources' },
    { label: 'For Clinic Owners', href: '/resources/clinic-owners' },
    { label: 'Free SEO Audit', href: '/tools/seo-audit' },
    { label: 'AI Copy Generator', href: '/tools/brand-voice' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-slate-100">
      {/* pl-4 on the outer container gives the logo room to sit further left
          than the page content's max-w-7xl center column, so it hugs the
          viewport edge on wider screens. pr-4/6 keeps the CTA from clipping. */}
      <div className="mx-auto flex items-center justify-between pl-4 md:pl-6 pr-4 md:pr-6 py-3 max-w-[1400px]">
        {/* h-10 on mobile (desktop unchanged at h-16): at the default h-14 the
            ~212px-wide logo + location pill + hamburger exceed 375px and force
            sideways scroll on every page (2026-07-05 UX audit). */}
        <Link href="/" className="shrink-0">
          <Logo imgClassName="h-10 md:h-16" />
        </Link>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden md:flex items-center gap-5 lg:gap-6 text-sm font-bold text-slate-700">
            <LocationIndicator />
            {navLinks.map((link) => (
              <React.Fragment key={link.href}>
                <Link
                  href={link.href}
                  className="hover:text-wellness-600 transition-colors whitespace-nowrap"
                >
                  {link.label}
                </Link>
                {link.href === '/treatments' && (
                  <div className="relative group">
                    <button
                      type="button"
                      className="flex items-center gap-1 hover:text-wellness-600 transition-colors whitespace-nowrap"
                    >
                      Who We Serve
                      <ChevronDown size={14} className="group-hover:rotate-180 transition-transform" />
                    </button>
                    <div className="absolute left-1/2 -translate-x-1/2 top-full pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-150 z-50">
                      <div className="bg-white rounded-2xl shadow-2xl shadow-slate-300/40 border border-slate-100 p-2 w-72">
                        {whoWeServe.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="block px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-wellness-50 hover:text-wellness-700 transition-colors"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {link.href === '/treatments' && (
                  <div className="relative group">
                    <button
                      type="button"
                      className="flex items-center gap-1 hover:text-wellness-600 transition-colors whitespace-nowrap"
                    >
                      Resources
                      <ChevronDown size={14} className="group-hover:rotate-180 transition-transform" />
                    </button>
                    <div className="absolute left-1/2 -translate-x-1/2 top-full pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-150 z-50">
                      <div className="bg-white rounded-2xl shadow-2xl shadow-slate-300/40 border border-slate-100 p-2 w-60">
                        {resources.map((item, i) => (
                          <React.Fragment key={item.href}>
                            <Link
                              href={item.href}
                              className="block px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-wellness-50 hover:text-wellness-700 transition-colors"
                            >
                              {item.label}
                            </Link>
                            {i === 0 && <div className="my-1 h-px bg-slate-100" />}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
            <Link
              href="/for-clinics"
              className="border-2 border-slate-900 text-slate-900 px-4 py-1.5 rounded-full hover:bg-slate-900 hover:text-white transition-all whitespace-nowrap"
            >
              For Clinics
            </Link>
            <Link
              href="/quiz"
              className="bg-wellness-600 text-white px-5 py-2 rounded-full hover:bg-wellness-700 transition-all shadow-md shadow-wellness-100/60 flex items-center gap-1.5 whitespace-nowrap"
            >
              <Zap size={14} />
              Get Matched
            </Link>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <LocationIndicator />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-slate-50 overflow-hidden"
          >
            <div className="flex flex-col p-6 gap-4">
              {navLinks.map((link) => (
                <React.Fragment key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="text-lg font-bold text-slate-900 hover:text-wellness-600 transition-colors py-2"
                  >
                    {link.label}
                  </Link>
                  {link.href === '/treatments' && (
                    <div className="border-l-2 border-slate-100 pl-4 -mt-1 flex flex-col gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 pt-1">
                        Who We Serve
                      </span>
                      {whoWeServe.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className="text-base font-bold text-slate-600 hover:text-wellness-600 transition-colors py-1"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                  {link.href === '/treatments' && (
                    <div className="border-l-2 border-slate-100 pl-4 -mt-1 flex flex-col gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 pt-1">
                        Resources
                      </span>
                      {resources.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className="text-base font-bold text-slate-600 hover:text-wellness-600 transition-colors py-1"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </React.Fragment>
              ))}
              <Link
                href="/for-clinics"
                onClick={() => setIsMenuOpen(false)}
                className="w-full border-2 border-slate-900 text-slate-900 px-6 py-4 rounded-2xl font-bold text-center mt-2"
              >
                For Clinics
              </Link>
              <Link
                href="/quiz"
                onClick={() => setIsMenuOpen(false)}
                className="w-full bg-wellness-600 text-white px-6 py-4 rounded-2xl font-bold text-center flex items-center justify-center gap-2"
              >
                <Zap size={20} />
                Get Matched
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
