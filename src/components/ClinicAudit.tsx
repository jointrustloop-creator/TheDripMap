'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, Check, X, Star, ArrowRight, AlertCircle, Image as ImageIcon, Phone, Globe, ShieldCheck } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { slugify } from '../lib/data';

// Per-city monthly search demand (same data source as the prior calculator).
// Cities not in the list default to 30/mo as a conservative floor.
const CITY_SEARCHES: Record<string, number> = {
  houston: 604, 'new york': 450, toronto: 350, clearwater: 300, 'san francisco': 280,
  'san carlos': 181, 'san ramon': 141, 'del mar': 136, 'rochester hills': 123, miami: 110,
  'la jolla': 100, chicago: 80, 'los angeles': 80, 'san diego': 75, vancouver: 70,
  montreal: 65, ottawa: 60, calgary: 60, mississauga: 55, tampa: 50, 'washington dc': 50,
  fairfax: 45, fresno: 40, 'san jose': 40, glendale: 35, edmonton: 30, winnipeg: 25,
  austin: 25, denver: 25, nashville: 20, oakville: 20,
};

type MatchedProvider = {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string | null;
  rating: number | null;
  reviews: number | null;
  phone: string | null;
  website: string | null;
  image_url: string | null;
  description: string | null;
  specialties: string[] | null;
  is_featured: boolean | null;
};

// Score a listing on completeness (0–100). Higher = better claimed/maintained listing.
function scoreListing(p: MatchedProvider): { score: number; missing: string[]; has: string[] } {
  const has: string[] = [];
  const missing: string[] = [];
  let score = 0;

  if (p.image_url) { has.push('photo'); score += 25; } else { missing.push('photo'); }
  if (p.description && p.description.length > 30) { has.push('description'); score += 20; } else { missing.push('description'); }
  if (p.specialties && p.specialties.length >= 3) { has.push('services menu'); score += 15; } else { missing.push('services menu'); }
  if (p.phone) { has.push('phone'); score += 10; } else { missing.push('phone'); }
  if (p.website) { has.push('website'); score += 10; } else { missing.push('website'); }
  if (p.rating != null && p.rating > 0) { has.push('reviews'); score += 10; } else { missing.push('reviews'); }
  if (p.is_featured) { has.push('verified badge'); score += 10; } else { missing.push('verified badge'); }

  return { score, missing, has };
}

export const ClinicAudit = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MatchedProvider[]>([]);
  const [selected, setSelected] = useState<MatchedProvider | null>(null);
  const [competitors, setCompetitors] = useState<MatchedProvider[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingCompetitors, setLoadingCompetitors] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const configured = isSupabaseConfigured();

  // Debounced live search
  useEffect(() => {
    if (!query || query.length < 2 || selected || !configured) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const { data, error } = await supabase
        .from('providers')
        .select('id, name, slug, city, state, rating, reviews, phone, website, image_url, description, specialties, is_featured')
        .ilike('name', `%${query}%`)
        .order('is_featured', { ascending: false })
        .order('rating', { ascending: false, nullsFirst: false })
        .limit(8);
      if (!error && data) setResults(data as MatchedProvider[]);
      setSearching(false);
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, selected, configured]);

  // Load competitors when a clinic is selected
  useEffect(() => {
    if (!selected || !configured) return;
    setLoadingCompetitors(true);
    (async () => {
      const { data } = await supabase
        .from('providers')
        .select('id, name, slug, city, state, rating, reviews, phone, website, image_url, description, specialties, is_featured')
        .eq('city', selected.city)
        .neq('id', selected.id)
        .order('is_featured', { ascending: false })
        .order('rating', { ascending: false, nullsFirst: false })
        .limit(3);
      setCompetitors((data as MatchedProvider[] | null) || []);
      setLoadingCompetitors(false);
    })();
  }, [selected, configured]);

  const audit = useMemo(() => (selected ? scoreListing(selected) : null), [selected]);
  const citySearches = useMemo(() => {
    if (!selected) return 0;
    return CITY_SEARCHES[selected.city.toLowerCase()] ?? 30;
  }, [selected]);

  // Conservative share estimate: unclaimed listings get crumbs of the city's traffic;
  // a claimed + featured listing gets a meaningful chunk.
  const currentMonthlyVisitors = Math.max(1, Math.round(citySearches * 0.03));
  const claimedMonthlyVisitors = Math.round(citySearches * 0.45);
  const currentBookings = Math.round((currentMonthlyVisitors * 0.02) * 10) / 10;
  const claimedBookings = Math.round((claimedMonthlyVisitors * 0.03) * 10) / 10;

  if (!configured) {
    return (
      <div className="bg-slate-100 rounded-3xl p-10 text-center text-slate-500 font-medium">
        Search temporarily unavailable.
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[3rem] overflow-hidden">
      <div className="p-8 md:p-12">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <Search size={18} className="text-wellness-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-wellness-400">
            Free Listing Audit
          </span>
        </div>
        <h3 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
          Find your clinic. See what patients see.
        </h3>
        <p className="text-base text-slate-300 mb-8 max-w-2xl leading-relaxed">
          Type your clinic name to see your current TheDripMap listing — what&apos;s
          missing, who&apos;s ahead of you in your city, and what claiming would unlock.
          No signup. Takes 10 seconds.
        </p>

        {/* Search input */}
        <div className="relative max-w-xl mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
          <input
            type="text"
            placeholder="Type your clinic name — e.g. Signature Beauty, Hydrate, Drip Bar…"
            value={selected ? selected.name : query}
            onChange={(e) => {
              setSelected(null);
              setQuery(e.target.value);
            }}
            className="w-full pl-11 pr-4 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-slate-500 focus:outline-none focus:border-wellness-400 font-bold transition-all"
          />
          {!selected && results.length > 0 && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-10 max-h-96 overflow-y-auto">
              {results.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setSelected(r);
                    setQuery('');
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 flex items-center gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-900 text-sm truncate">{r.name}</div>
                    <div className="text-xs text-slate-400 truncate">{r.city}{r.state ? `, ${r.state}` : ''}</div>
                  </div>
                  {r.is_featured && (
                    <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                      ✓ Verified
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
          {!selected && query.length >= 2 && !searching && results.length === 0 && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-slate-100 px-4 py-4 z-10">
              <div className="text-sm font-bold text-slate-900 mb-1">No match found.</div>
              <div className="text-xs text-slate-500">Your clinic isn&apos;t on TheDripMap yet — but it can be. <Link href="/for-clinics/setup" className="text-wellness-600 font-bold">Add it free →</Link></div>
            </div>
          )}
        </div>

        {/* === RESULT: side-by-side audit === */}
        {selected && audit && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* LEFT — current listing */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 md:p-7">
                <div className="flex items-center gap-2 mb-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Your listing today
                  </div>
                  <div className="ml-auto text-xs font-black text-amber-400">
                    {audit.score}/100
                  </div>
                </div>
                <div className="text-lg font-black text-white mb-1 line-clamp-1">{selected.name}</div>
                <div className="text-xs text-slate-400 mb-5">
                  {selected.city}{selected.state ? `, ${selected.state}` : ''}
                </div>

                <ul className="space-y-2 mb-5">
                  {[
                    { label: 'Custom photo', has: !!selected.image_url, icon: <ImageIcon size={12} /> },
                    { label: 'Description', has: !!(selected.description && selected.description.length > 30), icon: <span className="text-[10px]">¶</span> },
                    { label: 'Services menu', has: !!(selected.specialties && selected.specialties.length >= 3), icon: <span className="text-[10px]">≡</span> },
                    { label: 'Phone', has: !!selected.phone, icon: <Phone size={12} /> },
                    { label: 'Website', has: !!selected.website, icon: <Globe size={12} /> },
                    { label: 'Reviews', has: selected.rating != null && selected.rating > 0, icon: <Star size={12} /> },
                    { label: 'Verified badge', has: !!selected.is_featured, icon: <ShieldCheck size={12} /> },
                  ].map((row) => (
                    <li key={row.label} className="flex items-center gap-2 text-sm">
                      {row.has ? (
                        <Check size={14} className="text-emerald-400 shrink-0" />
                      ) : (
                        <X size={14} className="text-rose-400 shrink-0" />
                      )}
                      <span className={row.has ? 'text-slate-300' : 'text-slate-500 line-through'}>{row.label}</span>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-white/10 pt-4 space-y-1">
                  <div className="text-2xl font-black text-white">~{currentMonthlyVisitors}/mo</div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                    Estimated patients seeing your listing
                  </div>
                  <div className="text-xs text-slate-400 pt-1">→ ~{currentBookings} bookings/mo</div>
                </div>
              </div>

              {/* RIGHT — claimed listing */}
              <div className="bg-gradient-to-br from-wellness-400/10 to-emerald-400/10 backdrop-blur-sm border-2 border-wellness-400/40 rounded-3xl p-6 md:p-7 relative overflow-hidden">
                <div className="absolute top-3 right-3 bg-wellness-400 text-slate-900 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full">
                  After claim
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-wellness-300">
                    Your listing claimed
                  </div>
                  <div className="ml-auto text-xs font-black text-emerald-400">
                    100/100
                  </div>
                </div>
                <div className="text-lg font-black text-white mb-1 line-clamp-1 flex items-center gap-2">
                  {selected.name}
                  <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                </div>
                <div className="text-xs text-slate-400 mb-5">
                  {selected.city}{selected.state ? `, ${selected.state}` : ''}
                </div>

                <ul className="space-y-2 mb-5">
                  {['Custom photo', 'Description', 'Services menu', 'Phone', 'Website', 'Reviews', 'Verified badge'].map((label) => (
                    <li key={label} className="flex items-center gap-2 text-sm">
                      <Check size={14} className="text-emerald-400 shrink-0" />
                      <span className="text-white">{label}</span>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-wellness-400/20 pt-4 space-y-1">
                  <div className="text-2xl font-black text-emerald-400">~{claimedMonthlyVisitors}/mo</div>
                  <div className="text-[10px] uppercase tracking-widest text-wellness-300 font-bold">
                    Estimated patients seeing your listing
                  </div>
                  <div className="text-xs text-wellness-300 pt-1">→ ~{claimedBookings} bookings/mo</div>
                </div>
              </div>
            </div>

            {/* CTA strip */}
            {selected.is_featured ? (
              <div className="bg-emerald-400/10 border border-emerald-400/30 rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-4 justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-1">
                    ✓ Already verified
                  </div>
                  <p className="text-white font-medium">
                    Nice — {selected.name} is already claimed. Want to upgrade visibility?
                  </p>
                </div>
                <Link
                  href={`/providers/${selected.slug || slugify(selected.name)}`}
                  className="inline-flex items-center justify-center gap-2 bg-emerald-400 text-slate-900 px-6 py-3 rounded-xl font-black text-sm hover:bg-emerald-300 transition-colors shrink-0"
                >
                  View your profile <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <div className="bg-wellness-400/10 border border-wellness-400/30 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-4 justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-wellness-400 mb-1">
                    {audit.missing.length} missing items · 2-minute fix
                  </div>
                  <p className="text-white font-medium text-base md:text-lg">
                    Claim {selected.name} free. Add what&apos;s missing. Show up where patients are searching.
                  </p>
                </div>
                <Link
                  href={`/providers/${selected.slug || slugify(selected.name)}`}
                  className="inline-flex items-center justify-center gap-2 bg-wellness-400 text-slate-900 px-6 py-3 rounded-xl font-black text-sm hover:bg-wellness-300 transition-colors shrink-0"
                >
                  Claim {selected.name} Free <ArrowRight size={16} />
                </Link>
              </div>
            )}

            {/* === COMPETITORS STRIP === */}
            {competitors.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-7">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle size={14} className="text-slate-400" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Top competitors in {selected.city}
                  </span>
                </div>
                <div className="space-y-3">
                  {competitors.slice(0, 3).map((c) => {
                    const cAudit = scoreListing(c);
                    return (
                      <div key={c.id} className="flex items-center gap-4 py-2 border-b border-white/5 last:border-b-0">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-bold text-white text-sm truncate">{c.name}</span>
                            {c.is_featured ? (
                              <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 px-1.5 py-0.5 rounded-full">
                                ✓ Verified
                              </span>
                            ) : (
                              <span className="text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-400/20 px-1.5 py-0.5 rounded-full">
                                Unclaimed
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                            {c.rating != null && c.rating > 0 ? (
                              <span className="flex items-center gap-1">
                                <Star size={10} fill="currentColor" className="text-amber-400" />
                                {c.rating} · {c.reviews || 0} reviews
                              </span>
                            ) : (
                              <span>No reviews yet</span>
                            )}
                            <span className="text-slate-600">·</span>
                            <span>Score {cAudit.score}/100</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-400 mt-4 italic">
                  Patients comparing {selected.city} clinics see all of these listings side-by-side. A complete, verified profile wins the click.
                </p>
              </div>
            )}
            {loadingCompetitors && (
              <div className="text-center text-xs text-slate-500 font-medium">Loading competitors in {selected.city}…</div>
            )}
          </div>
        )}

        {/* Empty state when nothing selected yet */}
        {!selected && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
            <p className="text-slate-400 font-medium text-sm">
              Type your clinic name above to see your live listing audit.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
