import React from 'react';
import Link from 'next/link';
import { MapPin, Droplets, Zap } from 'lucide-react';
import { LocationIndicator } from './LocationIndicator';

export const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative w-10 h-10 bg-wellness-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-wellness-200 group-hover:scale-105 transition-transform">
            <MapPin size={22} className="absolute" />
            <Droplets size={14} className="absolute mb-1 text-wellness-200" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">TheDripMap</span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="md:hidden">
            <LocationIndicator />
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <LocationIndicator />
            <Link href="/search" className="hover:text-wellness-600 transition-colors">Explore Clinics</Link>
            <Link href="/iv-therapy-for" className="hover:text-wellness-600 transition-colors">Symptoms</Link>
            <Link href="/blog" className="hover:text-wellness-600 transition-colors">Blog</Link>
            <Link href="/for-clinics" className="hover:text-wellness-600 transition-colors">For Clinics</Link>
            <Link 
              href="/quiz"
              className="bg-wellness-600 text-white px-6 py-2.5 rounded-full hover:bg-wellness-700 transition-all shadow-md shadow-wellness-100 flex items-center gap-2"
            >
              <Zap size={16} />
              Get Matched
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
