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
    { label: 'Symptoms', href: '/symptoms' },
    { label: 'Blog', href: '/blog' },
    { label: 'For Clinics', href: '/for-clinics' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/">
          <Logo />
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <LocationIndicator />
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-wellness-600 transition-colors">
                {link.label}
              </Link>
            ))}
            <Link 
              href="/quiz"
              className="bg-wellness-600 text-white px-6 py-2.5 rounded-full hover:bg-wellness-700 transition-all shadow-md shadow-wellness-100 flex items-center gap-2"
            >
              <Zap size={16} />
              Get Matched
            </Link>
          </div>

          <div className="flex items-center gap-3 md:hidden">
            <LocationIndicator />
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
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
                href="/quiz"
                onClick={() => setIsMenuOpen(false)}
                className="w-full bg-wellness-600 text-white px-6 py-4 rounded-2xl font-bold text-center flex items-center justify-center gap-2 mt-2"
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
