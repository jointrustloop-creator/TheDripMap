import React from 'react';
import Link from 'next/link';
import { MapPin, ArrowRight } from 'lucide-react';
import { slugify } from '../lib/data';

interface CityGridProps {
  cities: { city: string, state: string, count: number }[];
  title?: string;
}

export const CityGrid = ({ cities, title = "Browse Top Cities" }: CityGridProps) => {
  return (
    <section className="py-24 px-6 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">{title}</h2>
            <p className="text-lg text-slate-500 leading-relaxed">
              Find top-rated IV therapy providers in these major wellness hubs.
            </p>
          </div>
          <Link 
            href="/search"
            className="flex items-center gap-2 text-wellness-600 font-bold hover:text-wellness-700 transition-colors"
          >
            View All Cities <ArrowRight size={20} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cities.map((city, idx) => (
            <Link 
              key={idx}
              href={`/iv-therapy/${slugify(city.state)}/${slugify(city.city)}`}
              className="group relative bg-slate-50 rounded-[2rem] p-8 hover:bg-wellness-600 transition-all duration-500 border border-slate-100 hover:border-wellness-500 hover:shadow-2xl hover:shadow-wellness-200"
            >
              <div className="flex flex-col h-full">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-wellness-600 mb-6 shadow-sm group-hover:scale-110 transition-transform">
                  <MapPin size={24} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2 group-hover:text-white transition-colors">
                  {city.city}
                </h3>
                <p className="text-slate-500 font-bold text-sm group-hover:text-wellness-100 transition-colors">
                  {city.count} Providers
                </p>
                <div className="mt-8 flex items-center gap-2 text-wellness-600 font-bold text-xs uppercase tracking-widest group-hover:text-white transition-colors">
                  Browse Clinics <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
