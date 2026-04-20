import React from 'react';
import Link from 'next/link';
import { MapPin, ArrowRight } from 'lucide-react';
import { slugify } from '../lib/data';

interface NearbyCitiesProps {
  cities: { city: string, state: string, count: number }[];
  currentState: string;
}

export const NearbyCities = ({ cities }: NearbyCitiesProps) => {
  return (
    <section className="py-24 px-6 bg-slate-50 border-y border-slate-100">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-black text-slate-900 mb-12 tracking-tight">Explore Nearby Cities</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {cities.map((city, idx) => (
            <Link 
              key={idx}
              href={`/iv-therapy/${slugify(city.city)}`}
              className="group bg-white rounded-2xl p-6 border border-slate-100 hover:border-wellness-100 hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-wellness-50 rounded-xl flex items-center justify-center text-wellness-600 group-hover:scale-110 transition-transform">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 group-hover:text-wellness-600 transition-colors">{city.city}</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{city.count} Clinics</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-wellness-600 font-bold text-[10px] uppercase tracking-widest group-hover:text-wellness-700 transition-colors">
                Browse Clinics <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
