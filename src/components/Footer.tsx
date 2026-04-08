import React from 'react';
import Link from 'next/link';
import { Droplets } from 'lucide-react';
import { MedicalDisclaimer } from './MedicalDisclaimer';

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-200 py-12 px-6 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-wellness-600 rounded-lg flex items-center justify-center text-white">
              <Droplets size={18} />
            </div>
            <span className="text-lg font-bold tracking-tight">TheDripMap</span>
          </div>
          <p className="text-slate-500 max-w-sm leading-relaxed">
            The premium directory for IV therapy and clinical wellness. We help you find the perfect provider based on your specific health goals and lifestyle needs.
          </p>
        </div>
        <div>
          <h4 className="font-bold mb-6 text-sm uppercase tracking-wider text-slate-400">Services</h4>
          <ul className="space-y-4 text-slate-600 text-sm">
            <li><Link href="/iv-therapy/treatment/nad-plus" className="hover:text-wellness-600">NAD+ Therapy</Link></li>
            <li><Link href="/iv-therapy/treatment/hangover" className="hover:text-wellness-600">Hangover IV</Link></li>
            <li><Link href="/iv-therapy/treatment/immune-support" className="hover:text-wellness-600">Immune Support</Link></li>
            <li><Link href="/iv-therapy/treatment/beauty-glow" className="hover:text-wellness-600">Beauty & Glow</Link></li>
            <li><Link href="/iv-therapy/treatment/weight-loss" className="hover:text-wellness-600">Weight Loss Drips</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-6 text-sm uppercase tracking-wider text-slate-400">Cities</h4>
          <ul className="space-y-4 text-slate-600 text-sm">
            <li><Link href="/iv-therapy/new-york/new-york" className="hover:text-wellness-600">New York</Link></li>
            <li><Link href="/iv-therapy/california/los-angeles" className="hover:text-wellness-600">Los Angeles</Link></li>
            <li><Link href="/iv-therapy/florida/miami" className="hover:text-wellness-600">Miami</Link></li>
            <li><Link href="/iv-therapy/illinois/chicago" className="hover:text-wellness-600">Chicago</Link></li>
            <li><Link href="/iv-therapy/district-of-columbia/washington" className="hover:text-wellness-600">Washington</Link></li>
            <li><Link href="/iv-therapy/texas/austin" className="hover:text-wellness-600">Austin</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-6 text-sm uppercase tracking-wider text-slate-400">Company</h4>
          <ul className="space-y-4 text-slate-600">
            <li><Link href="/iv-therapy-for" className="hover:text-wellness-600">Symptoms Hub</Link></li>
            <li><Link href="/about" className="hover:text-wellness-600">About Us</Link></li>
            <li><Link href="/contact" className="hover:text-wellness-600">Contact</Link></li>
            <li><Link href="/privacy" className="hover:text-wellness-600">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-wellness-600">Terms of Service</Link></li>
          </ul>
        </div>
      </div>
      <MedicalDisclaimer />
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-100 text-center text-slate-400 text-sm">
        © 2026 TheDripMap. All rights reserved.
      </div>
    </footer>
  );
};
