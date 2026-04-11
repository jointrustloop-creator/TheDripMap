import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, ArrowRight } from 'lucide-react';
import { slugify } from '../lib/data';

interface CityGridProps {
  cities: { city: string, state: string, count: number }[];
  title?: string;
}

const CITY_IMAGES: Record<string, string> = {
  'New York': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80',
  'Miami': 'https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?w=800&q=80',
  'Los Angeles': 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=800&q=80',
  'Chicago': 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80',
  'Houston': 'https://images.unsplash.com/photo-1530089711124-9ca31fb9e863?w=800&q=80',
  'Las Vegas': 'https://images.unsplash.com/photo-1581351721010-8cf859cb14a4?w=800&q=80',
};

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
          {cities.map((city, idx) => {
            const imageUrl = CITY_IMAGES[city.city];
            
            return (
              <Link 
                key={idx}
                href={`/iv-therapy/${slugify(city.state)}/${slugify(city.city)}`}
                className="group relative h-80 rounded-[2.5rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500"
              >
                {imageUrl ? (
                  <>
                    <Image 
                      src={imageUrl}
                      alt={`IV Therapy in ${city.city}`}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-wellness-600 to-teal-500 flex items-center justify-center">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)]" />
                  </div>
                )}

                <div className="absolute inset-0 p-8 flex flex-col justify-end">
                  <div className="relative z-10">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white mb-4 border border-white/20 group-hover:scale-110 transition-transform">
                      <MapPin size={20} />
                    </div>
                    <h3 className="text-3xl font-black text-white mb-1 tracking-tight">
                      {city.city}
                    </h3>
                    <p className="text-white/80 font-bold text-sm">
                      {city.count} Providers
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-white font-black text-[10px] uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                      Explore Hub <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
