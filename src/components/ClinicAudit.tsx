'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, Check, X, Star, ArrowRight, ShieldCheck, Eye, MousePointerClick, Users } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { slugify } from '../lib/data';

/**
 * Free listing audit on /for-clinics (rebuilt 2026-09-20).
 *
 * Every number here is measured, not modelled. The old version multiplied a
 * hard-coded city search table by 3% and 45% and called the result "patients
 * seeing your listing"; that is exactly the inflated figure the house rules
 * forbid. Now /api/listing-audit returns what our tracking recorded for the
 * clinic in the last 90 days (page opens, clicks to call, site or book), the
 * same for the Safety Verified clinics in its city, and the seven Transparency
 * checks the public page really renders.
 */

type Match = { id: string; name: string; slug: string; city: string; state: string | null; rating: number | null; reviews: number | null; is_claimed: boolean | null };
type Audit = {
  id: string; name: string; slug: string; city: string; state: string | null;
  claimed: boolean; safetyVerified: boolean; windowDays: number; views: number; clicks: number;
  peers: { verifiedCount: number; avgViews: number | null; avgClicks: number | null };
  score: number; checks: { key: string; label: string; passed: boolean }[];
};

const HUMAN: Record<string, string> = {
  oversight: 'Prescriber checked against their college register',
  administrator: 'Who places your IVs',
  screening: 'Health screening before a drip',
  ingredients: 'What is in your drips',
  pricing: 'Your prices',
  business: 'Address and phone',
  booking: 'How to book',
};

export const ClinicAudit = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Match[]>([]);
  const [selected, setSelected] = useState<Match | null>(null);
  const [audit, setAudit] = useState<Audit | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!query || query.length < 2 || selected || !configured) { setResults([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const { data, error } = await supabase
        .from('providers')
        .select('id, name, slug, city, state, rating, reviews, is_claimed')
        .ilike('name', `%${query}%`)
        .eq('is_hidden', false)
        .order('is_claimed', { ascending: false })
        .order('rating', { ascending: false, nullsFirst: false })
        .limit(8);
      if (!error && data) setResults(data as Match[]);
      setSearching(false);
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, selected, configured]);

  useEffect(() => {
    if (!selected) { setAudit(null); return; }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/listing-audit?id=${encodeURIComponent(selected.id)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (!cancelled) setAudit(j); })
      .catch(() => { if (!cancelled) setAudit(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selected]);

  if (!configured) {
    return <div className="bg-slate-100 rounded-3xl p-10 text-center text-slate-500 font-medium">Search temporarily unavailable.</div>;
  }

  const href = selected ? `/providers/${selected.slug || slugify(selected.name)}` : '/for-clinics/setup';
  const missing = audit ? audit.checks.filter((c) => !c.passed) : [];
  const peerViews = audit?.peers.avgViews ?? null;
  const barMax = Math.max(audit?.views || 0, peerViews || 0, 1);

  return (
    <div className="bg-[#14261c] rounded-[2.5rem] overflow-hidden text-white">
      <div className="p-8 md:p-12">
        <div className="flex items-center gap-2 mb-3">
          <Search size={18} className="text-wellness-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-wellness-400">Free listing audit</span>
        </div>
        <h3 className="text-3xl md:text-4xl font-black mb-3 tracking-tight">Find your clinic. See the real numbers.</h3>
        <p className="text-base text-slate-300 mb-8 max-w-2xl leading-relaxed">
          Type your clinic name. You will see how many patients opened your page in the last 90 days, how that compares with the verified clinics in your city, and the details patients look for that your page does not show yet. No signup.
        </p>

        <div className="relative max-w-xl mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
          <input
            type="text"
            placeholder="Your clinic name, for example Signature Beauty or Drip Bar"
            value={selected ? selected.name : query}
            onChange={(e) => { setSelected(null); setQuery(e.target.value); }}
            className="w-full pl-11 pr-4 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-slate-500 focus:outline-none focus:border-wellness-400 font-bold transition-all"
          />
          {!selected && results.length > 0 && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-10 max-h-96 overflow-y-auto">
              {results.map((r) => (
                <button key={r.id} type="button" onClick={() => { setSelected(r); setQuery(''); }} className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-900 text-sm truncate">{r.name}</div>
                    <div className="text-xs text-slate-400 truncate">{r.city}{r.state ? `, ${r.state}` : ''}</div>
                  </div>
                  {r.is_claimed && <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full shrink-0">Claimed</span>}
                </button>
              ))}
            </div>
          )}
          {!selected && query.length >= 2 && !searching && results.length === 0 && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-slate-100 px-4 py-4 z-10">
              <div className="text-sm font-bold text-slate-900 mb-1">No match found.</div>
              <div className="text-xs text-slate-500">Your clinic is not on TheDripMap yet. <Link href="/for-clinics/setup" className="text-wellness-600 font-bold">Add it free</Link></div>
            </div>
          )}
        </div>

        {selected && loading && <div className="text-sm text-slate-400 font-medium">Reading your page numbers...</div>}

        {selected && audit && !loading && (
          <div className="space-y-5">
            {/* The number that matters, big. */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 bg-white rounded-3xl p-6 md:p-8 text-slate-900">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">
                  <Eye size={13} /> Last {audit.windowDays} days on TheDripMap
                </div>
                <div className="flex items-end gap-3 flex-wrap">
                  <div className="text-[64px] md:text-[80px] leading-none font-black tracking-[-0.04em] text-[#0F6E56]">{audit.views}</div>
                  <div className="pb-2 text-lg font-bold text-slate-700">{audit.views === 1 ? 'patient opened' : 'patients opened'} {audit.name}&apos;s page</div>
                </div>
                <div className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                  <MousePointerClick size={14} className="text-[#0F6E56]" /> {audit.clicks} {audit.clicks === 1 ? 'click' : 'clicks'} through to call, visit your site or book
                </div>

                {peerViews !== null && (
                  <div className="mt-6">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 flex items-center gap-1.5"><Users size={12} /> Compared with the {audit.peers.verifiedCount} Safety Verified {audit.peers.verifiedCount === 1 ? 'clinic' : 'clinics'} in {audit.city}</div>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-600 mb-1"><span>{audit.name}</span><span>{audit.views}</span></div>
                        <div className="h-3 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-slate-400" style={{ width: `${Math.max(3, (audit.views / barMax) * 100)}%` }} /></div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-600 mb-1"><span>Verified clinics, average</span><span>{peerViews}</span></div>
                        <div className="h-3 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-[#0F6E56]" style={{ width: `${Math.max(3, (peerViews / barMax) * 100)}%` }} /></div>
                      </div>
                    </div>
                    <p className="mt-2 text-[12px] text-slate-500">Measured on our own tracking over the same {audit.windowDays} days. Verified pages rank first in their city and show prices, so they get opened more.</p>
                  </div>
                )}
              </div>

              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-7">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">What patients can see</div>
                  <div className="text-xs font-black text-wellness-300">{audit.score} of 7</div>
                </div>
                <ul className="space-y-2">
                  {audit.checks.map((c) => (
                    <li key={c.key} className="flex items-start gap-2 text-[13px]">
                      {c.passed ? <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" /> : <X size={14} className="text-rose-400 shrink-0 mt-0.5" />}
                      <span className={c.passed ? 'text-slate-200' : 'text-slate-400'}>{HUMAN[c.key] || c.label}</span>
                    </li>
                  ))}
                </ul>
                {audit.safetyVerified && (
                  <div className="mt-4 inline-flex items-center gap-1.5 bg-amber-400 text-amber-950 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.12em]"><ShieldCheck size={12} /> Safety Verified</div>
                )}
              </div>
            </div>

            {/* One next step, depending on where the clinic is. */}
            <div className="bg-wellness-400/10 border border-wellness-400/30 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-4 justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-wellness-400 mb-1">
                  {audit.claimed ? (missing.length ? `${missing.length} ${missing.length === 1 ? 'detail' : 'details'} still missing` : 'Complete page') : 'Not claimed yet'}
                </div>
                <p className="text-white font-medium text-base md:text-lg">
                  {audit.claimed
                    ? missing.length
                      ? `Add ${HUMAN[missing[0].key].toLowerCase()} and your page moves to ${audit.score + 1} of 7.`
                      : `${audit.name} shows everything patients look for. Keep prices current and post an offer when you have openings.`
                    : `Claim ${audit.name} free, add ${missing.length ? HUMAN[missing[0].key].toLowerCase() : 'your details'}, and your page joins the verified clinics at the top of ${audit.city}.`}
                </p>
              </div>
              <Link href={href} className="inline-flex items-center justify-center gap-2 bg-wellness-400 text-slate-900 px-6 py-3 rounded-xl font-black text-sm hover:bg-wellness-300 transition-colors shrink-0">
                {audit.claimed ? 'Open your page' : `Claim ${audit.name} free`} <ArrowRight size={16} />
              </Link>
            </div>
            {selected.rating != null && selected.rating > 0 && (
              <p className="text-xs text-slate-400 flex items-center gap-1.5"><Star size={12} className="text-amber-400" fill="currentColor" /> Google rating on your page: {selected.rating} from {selected.reviews || 0} reviews.</p>
            )}
          </div>
        )}

        {!selected && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
            <p className="text-slate-400 font-medium text-sm">Type your clinic name above to see your real numbers.</p>
          </div>
        )}
      </div>
    </div>
  );
};
