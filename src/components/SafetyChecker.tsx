'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Loader2, ShieldCheck, ShieldAlert, Star, ArrowRight, MapPin, Check, X } from 'lucide-react';
import type { SafetyMatch } from '../../app/api/safety-check/route';
import { slugify } from '../lib/data';

const EMERALD = '#0F6E56';

interface Result {
  query: { name: string; city: string };
  notFound: boolean;
  matches: SafetyMatch[];
  alternatives: SafetyMatch[];
}

function providerHref(m: SafetyMatch) {
  return `/providers/${m.slug || slugify(m.name)}`;
}

function ClinicCard({ m, alt = false }: { m: SafetyMatch; alt?: boolean }) {
  return (
    <Link
      href={providerHref(m)}
      className="group block bg-white rounded-2xl border border-slate-200/80 p-5 hover:border-emerald-300 hover:shadow-lg hover:shadow-slate-200/50 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-black text-slate-900 leading-snug truncate group-hover:text-[#0F6E56] transition-colors">{m.name}</div>
          <div className="text-xs text-slate-400 font-medium mt-0.5">
            {m.city}{m.state ? `, ${m.state}` : ''}
          </div>
        </div>
        {m.claimed && m.rating != null && m.rating > 0 && (
          <span className="flex items-center gap-1 text-sm font-bold text-slate-700 shrink-0">
            <Star size={13} fill="currentColor" className="text-amber-400" />
            {m.rating.toFixed(1)}
            {m.reviews ? <span className="text-slate-400 font-medium">({m.reviews})</span> : null}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-3">
        {m.safetyVerified ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full">
            <ShieldCheck size={11} /> Safety Verified
          </span>
        ) : m.claimed ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full">
            <Check size={11} strokeWidth={3} /> Claimed
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full">
            Unclaimed
          </span>
        )}
      </div>
      {!alt && (
        <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#0F6E56]">
          View profile <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
        </div>
      )}
    </Link>
  );
}

export const SafetyChecker = () => {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/safety-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, city }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || 'Something went wrong. Please try again.');
      else setResult(data as Result);
    } catch {
      setError('Could not reach the checker. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={run} className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/40 p-5 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_200px_auto] gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Clinic name (e.g. Hydrate IV Bar)"
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={17} />
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City (optional)"
              className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-black text-white text-sm transition-all disabled:opacity-60 whitespace-nowrap"
            style={{ backgroundColor: EMERALD }}
          >
            {loading ? <Loader2 size={17} className="animate-spin" /> : <ShieldCheck size={17} />}
            {loading ? 'Checking…' : 'Check clinic'}
          </button>
        </div>
        {error && <p className="text-sm font-semibold text-rose-600 mt-3 px-1">{error}</p>}
      </form>

      {loading && (
        <div className="text-center py-12">
          <Loader2 size={26} className="animate-spin mx-auto text-emerald-600 mb-3" />
          <p className="text-slate-500 font-semibold">Checking our matching platform…</p>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-6">
          {!result.notFound ? (
            <>
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-600" />
                <span className="text-sm font-bold text-slate-700">
                  Found {result.matches.length} match{result.matches.length === 1 ? '' : 'es'} for &quot;{result.query.name}&quot;
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.matches.map((m) => <ClinicCard key={m.slug || m.name} m={m} />)}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                A <span className="font-bold text-emerald-700">Safety Verified</span> badge reflects the clinic&apos;s written answers to our safety
                questionnaire (who administers IVs, who provides medical oversight, and where ingredients are sourced), not an independent medical
                audit. &quot;Claimed&quot; means the owner manages the listing. Unclaimed listings haven&apos;t been confirmed by the clinic yet.
              </p>
            </>
          ) : (
            <div className="space-y-5">
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-start gap-3">
                <ShieldAlert size={20} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-black text-amber-900">This clinic isn&apos;t in our matching platform.</div>
                  <div className="text-sm text-amber-800/80 mt-0.5">
                    We couldn&apos;t find &quot;{result.query.name}&quot;{result.query.city ? ` in ${result.query.city}` : ''}. That doesn&apos;t mean it&apos;s unsafe — but here are verified alternatives you can trust.
                  </div>
                </div>
              </div>
              {result.alternatives.length > 0 && (
                <>
                  <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F6E56]">Verified alternatives{result.query.city ? ` near ${result.query.city}` : ''}</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {result.alternatives.map((m) => <ClinicCard key={m.slug || m.name} m={m} alt />)}
                  </div>
                </>
              )}
              <Link href="/search" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black text-white text-sm" style={{ backgroundColor: EMERALD }}>
                Browse all clinics <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>
      )}

      {!result && !loading && (
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-semibold text-slate-400">
          <span className="flex items-center gap-1.5"><Check size={14} className="text-emerald-600" strokeWidth={3} /> Real-time platform check</span>
          <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-600" /> Verification status</span>
          <span className="flex items-center gap-1.5"><X size={14} className="text-slate-300" strokeWidth={3} /> No signup</span>
        </div>
      )}
    </div>
  );
};
