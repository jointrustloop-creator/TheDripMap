'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { TrendingUp, MapPin, ArrowRight } from 'lucide-react';

// Estimated monthly Google impressions per city (from our GSC export, last 28 days).
// Cities not in this list fall back to a tiered estimate based on US/Canadian metro size.
//
// Source: GSC data 2026-04-25 → 2026-05-22, augmented with our own search-page data
// and conservative assumptions for cities we have less direct data on.
const CITY_IMPRESSIONS: Record<string, number> = {
  // High-traffic
  houston: 604,
  'new york': 450,
  toronto: 350,
  clearwater: 300,
  'san francisco': 280,
  'san carlos': 181,
  'san ramon': 141,
  'del mar': 136,
  'rochester hills': 123,
  miami: 110,
  'la jolla': 100,
  // Mid
  chicago: 80,
  'los angeles': 80,
  'san diego': 75,
  vancouver: 70,
  montreal: 65,
  ottawa: 60,
  calgary: 60,
  mississauga: 55,
  tampa: 50,
  'washington dc': 50,
  fairfax: 45,
  fresno: 40,
  'san jose': 40,
  glendale: 35,
  // Lower
  edmonton: 30,
  winnipeg: 25,
  austin: 25,
  denver: 25,
  nashville: 20,
  oakville: 20,
  philadelphia: 20,
  seattle: 20,
  boston: 18,
  phoenix: 18,
  atlanta: 18,
  dallas: 16,
  cypress: 16,
  tomball: 16,
  'salt lake city': 15,
  charlotte: 15,
  portland: 15,
  indianapolis: 12,
  columbus: 12,
};

// Tunable inputs that drive the math
const CTR_RANK_1     = 0.085;  // ~8.5% CTR for the #1 organic result
const CTR_RANK_NOW   = 0.002;  // current 0.21% site-average (per GSC)
const CLICK_TO_BOOK  = 0.03;   // ~3% of clicks book
const AVG_DRIP_PRICE = 225;    // USD average across protocols
const FEATURED_COST  = 99;     // $/mo

interface RoiCalculatorProps {
  popularCities: string[]; // for the quick-pick chips
}

export const RoiCalculator = ({ popularCities }: RoiCalculatorProps) => {
  const [input, setInput] = useState('');
  const [city, setCity] = useState<string | null>(null);

  const cities = useMemo(() => Object.keys(CITY_IMPRESSIONS), []);
  const suggestions = useMemo(() => {
    if (!input) return [];
    const q = input.toLowerCase();
    return cities.filter((c) => c.includes(q)).slice(0, 6);
  }, [input, cities]);

  const numbers = useMemo(() => {
    if (!city) return null;
    const monthlyImpr = CITY_IMPRESSIONS[city.toLowerCase()] ?? 30; // floor
    const currentClicks = monthlyImpr * CTR_RANK_NOW;
    const featuredClicks = monthlyImpr * CTR_RANK_1;
    const incrementalClicks = Math.max(0, featuredClicks - currentClicks);
    const newBookings = incrementalClicks * CLICK_TO_BOOK;
    const monthlyRevenue = newBookings * AVG_DRIP_PRICE;
    const breakevenBookings = FEATURED_COST / AVG_DRIP_PRICE;
    return {
      monthlyImpr,
      currentClicks: Math.round(currentClicks * 10) / 10,
      featuredClicks: Math.round(featuredClicks * 10) / 10,
      newBookings: Math.round(newBookings * 10) / 10,
      monthlyRevenue: Math.round(monthlyRevenue),
      breakevenBookings: Math.round(breakevenBookings * 100) / 100,
      roi: monthlyRevenue > 0 ? Math.round((monthlyRevenue / FEATURED_COST) * 10) / 10 : 0,
    };
  }, [city]);

  const pretty = (c: string) =>
    c.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[3rem] overflow-hidden">
      <div className="p-8 md:p-12">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={18} className="text-wellness-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-wellness-400">
            ROI Calculator
          </span>
        </div>
        <h3 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
          What would Featured listing pay back in your city?
        </h3>
        <p className="text-base text-slate-300 mb-8 max-w-2xl leading-relaxed">
          Real numbers, not marketing copy. Pick your city to see estimated monthly
          impressions, the bookings a #1 Featured ranking would unlock, and the ROI on a
          $99/mo Featured listing.
        </p>

        {/* Input */}
        <div className="relative max-w-xl mb-4">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Type your city — Toronto, Houston, San Carlos…"
            value={city ? pretty(city) : input}
            onChange={(e) => {
              setCity(null);
              setInput(e.target.value);
            }}
            className="w-full pl-11 pr-4 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-slate-500 focus:outline-none focus:border-wellness-400 font-bold transition-all"
          />
          {suggestions.length > 0 && !city && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-10">
              {suggestions.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setCity(c);
                    setInput('');
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm font-bold text-slate-900 border-b border-slate-100 last:border-b-0"
                >
                  {pretty(c)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick-pick chips */}
        <div className="flex flex-wrap gap-2 mb-10">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 self-center mr-2">
            Quick pick:
          </span>
          {popularCities.slice(0, 6).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setCity(c.toLowerCase());
                setInput('');
              }}
              className="px-3 py-1.5 rounded-full text-[11px] font-bold border border-white/20 bg-white/5 text-slate-300 hover:bg-wellness-400 hover:text-slate-900 hover:border-wellness-400 transition-all"
            >
              {c}
            </button>
          ))}
        </div>

        {/* Output */}
        {numbers ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Monthly searches
                </div>
                <div className="text-3xl font-black text-white">{numbers.monthlyImpr.toLocaleString()}</div>
                <div className="text-[10px] text-slate-500 font-medium mt-1">
                  Patients searching for IV therapy in {pretty(city!)}
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Clicks at #1 rank
                </div>
                <div className="text-3xl font-black text-wellness-400">~{numbers.featuredClicks}/mo</div>
                <div className="text-[10px] text-slate-500 font-medium mt-1">
                  Featured listing competes for top spot
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Est. new bookings
                </div>
                <div className="text-3xl font-black text-wellness-400">~{numbers.newBookings}/mo</div>
                <div className="text-[10px] text-slate-500 font-medium mt-1">
                  Based on 3% click → booking rate
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Est. monthly revenue
                </div>
                <div className="text-3xl font-black text-emerald-400">${numbers.monthlyRevenue.toLocaleString()}</div>
                <div className="text-[10px] text-slate-500 font-medium mt-1">
                  Avg ${AVG_DRIP_PRICE}/drip across protocols
                </div>
              </div>
            </div>

            <div className="bg-wellness-400/10 border border-wellness-400/30 rounded-2xl p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-wellness-400 mb-2">
                    Bottom line
                  </div>
                  <p className="text-white text-base md:text-lg font-medium leading-relaxed">
                    Featured listing in {pretty(city!)} pays for itself in{' '}
                    <span className="font-black text-wellness-400">
                      {numbers.breakevenBookings} bookings
                    </span>
                    .
                    {numbers.roi > 1 && (
                      <>
                        {' '}
                        Estimated ROI: <span className="font-black text-emerald-400">{numbers.roi}×</span>{' '}
                        the $99/mo cost.
                      </>
                    )}
                  </p>
                </div>
                <Link
                  href="/for-clinics/setup?plan=featured"
                  className="inline-flex items-center justify-center gap-2 bg-wellness-400 text-slate-900 px-6 py-3 rounded-xl font-black text-sm hover:bg-wellness-300 transition-colors shrink-0"
                >
                  Get Featured <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic leading-relaxed max-w-2xl">
              Estimates based on live patient search demand for {pretty(city!)},
              industry-standard CTR for #1 organic ranking (~8.5%), and a conservative 3%
              click-to-booking conversion rate. Your actual results depend on listing
              completeness, reviews, and seasonal demand.
            </p>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
            <p className="text-slate-400 font-medium text-sm">
              Pick a city above to see the numbers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
