'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Zap, Menu, X } from 'lucide-react';
import { Logo } from './Logo';
import { LocationIndicator } from './LocationIndicator';
import { motion, AnimatePresence } from 'motion/react';

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Explore Clinics', href: '/search' },
    { label: 'Treatments', href: '/treatments' },
    { label: 'Guides', href: '/guide' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-slate-100">
      {/* pl-4 on the outer container gives the logo room to sit further left
          than the page content's max-w-7xl center column, so it hugs the
          viewport edge on wider screens. pr-4/6 keeps the CTA from clipping. */}
      <div className="mx-auto flex items-center justify-between pl-4 md:pl-6 pr-4 md:pr-6 py-3 max-w-[1400px]">
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden md:flex items-center gap-5 lg:gap-6 text-sm font-bold text-slate-700">
            <LocationIndicator />
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-wellness-600 transition-colors whitespace-nowrap"
              >
                {link.label}
              </Link>
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
                <Link 
                  key={link.href} 
                  href={link.href} 
                  onClick={() => setIsMenuOpen(false)}
                  className="text-lg font-bold text-slate-900 hover:text-wellness-600 transition-colors py-2"
                >
                  {link.label}
                </Link>
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
