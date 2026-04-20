import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, ArrowRight } from 'lucide-react';
import { slugify } from '../lib/data';

interface CityGridProps {
  cities: { city: string, state: string, count: number, slug?: string }[];
  title?: string;
}

const CITY_IMAGES: Record<string, string> = {
  'new york': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80',
  'new york city': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80',
  'los angeles': 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=800&q=80',
  'miami': 'https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?w=800&q=80',
  'houston': 'https://images.unsplash.com/photo-1530089711124-9ca31fb9e863?w=800&q=80',
  'las vegas': 'https://images.unsplash.com/photo-1581351721010-8cf859cb14a4?w=800&q=80',
  'dallas': 'https://images.unsplash.com/photo-1545194445-dddb8f4487c6?w=800&q=80',
  'san francisco': 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80',
  'san diego': 'https://images.unsplash.com/photo-1538964173425-93884d739596?w=800&q=80',
  'seattle': 'https://images.unsplash.com/photo-1502175353174-a7a70e73b362?w=800&q=80',
  'atlanta': 'https://images.unsplash.com/photo-1575917649705-5b59aaa12e6b?w=800&q=80',
  'denver': 'https://images.unsplash.com/photo-1619468129361-605ebea04b44?w=800&q=80',
  'austin': 'https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=800&q=80',
  'nashville': 'https://images.unsplash.com/photo-1558618047-f4e90e57a6f6?w=800&q=80',
  'tampa': 'https://images.unsplash.com/photo-1605723517503-3cadb5818a0c?w=800&q=80',
};

const DEFAULT_CITY_IMAGE = 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80';

export const CityGrid = ({ cities, title = "Browse Top Cities" }: CityGridProps) => {
  return (
    <section className="py-24 px-6 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="max-w-2xl">
            <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-4 tracking-tight">{title}</h2>
            <p className="text-xl text-slate-500 leading-relaxed">
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
            const imageUrl = CITY_IMAGES[city.city.toLowerCase()] ?? DEFAULT_CITY_IMAGE;
            
            return (
              <Link 
                key={idx}
                href={`/cities/${city.slug || slugify(city.city)}`}
                className="group relative h-80 rounded-[2.5rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500"
              >
                <Image 
                  src={imageUrl}
                  alt={`IV Therapy in ${city.city}`}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />

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
