import React from 'react';
import Link from 'next/link';
import { slugify } from '../lib/data';

interface City {
  city: string;
  state: string;
  stateAbbr: string;
  count: number;
}

interface CompactCityGridProps {
  cities: City[];
}

export const CompactCityGrid = ({ cities }: CompactCityGridProps) => {
  return (
    <section className="py-24 px-6 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-4 tracking-tight">
            Browse IV Therapy by City
          </h2>
          <p className="text-xl text-slate-500 leading-relaxed">
            Find top-rated clinics in {cities.length} cities across the United States
          </p>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {cities.map((city, idx) => (
            <Link
              key={idx}
              href={`/cities/${slugify(city.city)}`}
              className="bg-white border border-[#e8f0ec] rounded-[10px] p-[10px_14px] hover:border-wellness-600 hover:-translate-y-1 transition-all duration-300 group shadow-sm"
            >
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="font-bold text-[14px] text-slate-900 group-hover:text-wellness-600 transition-colors truncate">
                    {city.city}
                  </span>
                  <span className="text-[12px] text-slate-400 font-medium">
                    {city.state.split(' ')
                      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                      .join(' ')}
                  </span>
                </div>
                <span className="text-[12px] text-wellness-600 font-semibold">
                  {city.count} clinics
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-slate-500 font-medium">
            Don&apos;t see your city?{" "}
            <Link href="/quiz" className="text-wellness-600 hover:underline font-bold">
              We&apos;re expanding — take the quiz and we&apos;ll find the nearest option.
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
};
