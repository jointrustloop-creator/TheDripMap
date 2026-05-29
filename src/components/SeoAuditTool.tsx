'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  Search, Check, X, AlertTriangle, ArrowRight, Loader2,
  ShieldCheck, Mail, Globe, TrendingUp, Lock, Sparkles,
} from 'lucide-react';
import type { AuditResult, AuditCheck } from '../../app/api/seo-audit/route';
import { AUDIT_CITY_SUGGESTIONS } from '../lib/city-search-data';

const EMERALD = '#0F6E56';

function scoreColor(score: number): string {
  if (score >= 70) return EMERALD;
  if (score >= 50) return '#D97706'; // amber-600
  return '#E11D48'; // rose-600
}

function gradeLabel(grade: AuditResult['grade']): string {
  switch (grade) {
    case 'excellent': return 'Excellent — a strong technical SEO foundation';
    case 'good': return 'Good — a few fixable gaps to close';
    case 'needs-work': return 'Needs work — several issues worth addressing';
    default: return 'Poor — major technical SEO gaps to fix';
  }
}

function StatusIcon({ status }: { status: AuditCheck['status'] }) {
  if (status === 'pass') return <Check size={16} className="text-emerald-600 shrink-0" strokeWidth={3} />;
  if (status === 'warn') return <AlertTriangle size={15} className="text-amber-500 shrink-0" />;
  return <X size={16} className="text-rose-500 shrink-0" strokeWidth={3} />;
}

function Gauge({ score }: { score: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const color = scoreColor(score);
  return (
    <div className="relative w-[140px] h-[140px] shrink-0">
      <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#E7E5E0" strokeWidth="11" />
        <circle
          cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="11"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black tracking-tight" style={{ color }}>{score}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">/ 100</span>
      </div>
    </div>
  );
}

export const SeoAuditTool = () => {
  const [url, setUrl] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditResult | null>(null);

  const [email, setEmail] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [emailNote, setEmailNote] = useState<string | null>(null);

  const resultRef = useRef<HTMLDivElement | null>(null);

  const runAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setUnlocked(false);
    setEmail('');
    setEmailNote(null);
    try {
      const res = await fetch('/api/seo-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, city }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
      } else {
        setResult(data as AuditResult);
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
      }
    } catch {
      setError('Could not reach the audit service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const unlockReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!result) return;
    setUnlocking(true);
    setEmailNote(null);
    try {
      const res = await fetch('/api/seo-audit/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, result }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEmailNote(data.error || 'Could not send your report. Please try again.');
      } else {
        setUnlocked(true);
        setEmailNote(
          data.reportEmailed
            ? 'Done — your full report is on screen and on its way to your inbox.'
            : 'Done — your full report is unlocked below.'
        );
      }
    } catch {
      setEmailNote('Could not send your report. Please try again.');
    } finally {
      setUnlocking(false);
    }
  };

  const claimUrl = result?.listing.slug
    ? `/providers/${result.listing.slug}?claim=1`
    : '/for-clinics/setup';

  return (
    <main className="max-w-4xl mx-auto px-6 pt-16 pb-24">
      {/* ===== HERO / INPUT ===== */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 mb-5">
          <Sparkles size={13} className="text-emerald-700" />
          <span className="text-[11px] font-black uppercase tracking-[0.15em] text-emerald-700">
            Free · For Clinic Owners
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-[#0A0B0D] tracking-tight leading-[1.05] mb-5">
          How does your clinic rank
          <span className="block italic font-serif" style={{ color: EMERALD }}>online?</span>
        </h1>
        <p className="text-lg text-slate-500 leading-relaxed">
          Get an instant, honest audit of your website and your visibility to patients searching
          in your city — plus the exact fixes that win more bookings. Takes 60 seconds. No signup to see your score.
        </p>
      </div>

      <form onSubmit={runAudit} className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/40 p-5 md:p-6 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_220px_auto] gap-3">
          <div className="relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            <input
              type="text"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="yourclinic.com"
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
            />
          </div>
          <div className="relative">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City (optional)"
              list="audit-cities"
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
            />
            <datalist id="audit-cities">
              {AUDIT_CITY_SUGGESTIONS.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-black text-white text-sm transition-all disabled:opacity-60 whitespace-nowrap"
            style={{ backgroundColor: EMERALD }}
          >
            {loading ? <Loader2 size={17} className="animate-spin" /> : <Search size={17} />}
            {loading ? 'Auditing…' : 'Run free audit'}
          </button>
        </div>
        {error && <p className="text-sm font-semibold text-rose-600 mt-3 px-1">{error}</p>}
      </form>
      <p className="text-center text-xs text-slate-400 font-medium mb-4">
        We check HTTPS, mobile-friendliness, Google PageSpeed, structured data, title &amp; meta tags, your H1 heading, social preview tags, and indexability — all real ranking signals.
      </p>

      {loading && (
        <div className="text-center py-16">
          <Loader2 size={28} className="animate-spin mx-auto text-emerald-600 mb-4" />
          <p className="text-slate-500 font-semibold">Fetching your site &amp; checking Google PageSpeed…</p>
          <p className="text-xs text-slate-400 mt-1">This can take up to 20 seconds.</p>
        </div>
      )}

      {/* ===== RESULTS ===== */}
      {result && !loading && (
        <div ref={resultRef} className="scroll-mt-24">
          {/* Score header */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/40 overflow-hidden mb-6">
            <div className="p-7 md:p-9 flex flex-col sm:flex-row items-center gap-7">
              <Gauge score={result.score} />
              <div className="text-center sm:text-left">
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 mb-1">
                  SEO &amp; Visibility Score
                </div>
                <div className="text-2xl font-black text-[#0A0B0D] mb-2 leading-snug">
                  {gradeLabel(result.grade)}
                </div>
                <div className="text-sm text-slate-500 font-medium break-all">{result.finalUrl}</div>
                {!result.reachable && (
                  <div className="mt-2 text-xs font-semibold text-amber-600">
                    We couldn&apos;t fully load your site — website checks may be incomplete.
                  </div>
                )}
              </div>
            </div>

            {/* Checks */}
            <div className="border-t border-slate-100 divide-y divide-slate-100">
              {result.checks.map((c) => (
                <div key={c.key} className="px-7 md:px-9 py-3.5 flex items-start gap-3">
                  <div className="mt-0.5"><StatusIcon status={c.status} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-bold text-slate-800 text-sm">{c.label}</span>
                      <span className={`text-xs font-black tabular-nums shrink-0 ${
                        c.counted === false ? 'text-slate-400' : c.status === 'pass' ? 'text-emerald-600' : c.status === 'warn' ? 'text-amber-600' : 'text-rose-500'
                      }`}>
                        {c.counted === false ? 'Not measured' : `${c.earned}/${c.max}`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{c.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ===== EMAIL GATE ===== */}
          {!unlocked ? (
            <div className="relative bg-gradient-to-br from-[#0A0B0D] to-[#11221C] rounded-3xl p-7 md:p-9 overflow-hidden">
              <div className="flex items-center gap-2 mb-3">
                <Lock size={15} className="text-emerald-400" />
                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-400">
                  Unlock your full report
                </span>
              </div>
              <h3 className="text-2xl font-black text-white mb-2 tracking-tight">
                Your top 3 fixes + your city breakdown
              </h3>
              <p className="text-slate-300 text-sm mb-6 max-w-lg leading-relaxed">
                See exactly what to fix first, how your city&apos;s search demand looks, and how
                you stack up against other clinics. We&apos;ll email you a copy too.
              </p>
              <form onSubmit={unlockReport} className="flex flex-col sm:flex-row gap-3 max-w-lg">
                <div className="relative flex-1">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={17} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@yourclinic.com"
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-slate-500 font-semibold focus:outline-none focus:border-emerald-400 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={unlocking}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-black text-sm bg-emerald-400 text-[#0A0B0D] hover:bg-emerald-300 transition-all disabled:opacity-60 whitespace-nowrap"
                >
                  {unlocking ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                  {unlocking ? 'Sending…' : 'Get my report'}
                </button>
              </form>
              {emailNote && <p className="text-sm font-semibold text-rose-300 mt-3">{emailNote}</p>}
            </div>
          ) : (
            <div className="space-y-6">
              {emailNote && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 flex items-center gap-3">
                  <Check size={18} className="text-emerald-600 shrink-0" strokeWidth={3} />
                  <span className="text-sm font-bold text-emerald-800">{emailNote}</span>
                </div>
              )}

              {/* Top fixes */}
              {result.topFixes.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-lg shadow-slate-200/40 p-7 md:p-9">
                  <div className="flex items-center gap-2 mb-5">
                    <TrendingUp size={16} style={{ color: EMERALD }} />
                    <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Top fixes — ranked by impact
                    </span>
                  </div>
                  <ol className="space-y-4">
                    {result.topFixes.map((f, i) => (
                      <li key={i} className="flex items-start gap-4">
                        <span
                          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-black"
                          style={{ backgroundColor: EMERALD }}
                        >
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <p className="font-bold text-slate-800 leading-snug">{f.title}</p>
                          <span className="text-xs font-black text-emerald-600">+{f.gain} points</span>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* City insight + claim CTA */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-lg shadow-slate-200/40 p-7 md:p-9">
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 mb-3">
                  Your city · &quot;iv therapy {result.cityInsight.name || 'your area'}&quot;
                </div>
                <div className="flex flex-wrap gap-8 mb-6">
                  <div>
                    <div className="text-3xl font-black text-[#0A0B0D]">~{result.cityInsight.searchesPerMonth}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">searches / month</div>
                  </div>
                  <div>
                    <div className="text-3xl font-black text-[#0A0B0D]">{result.cityInsight.competitors}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">clinics listed here</div>
                  </div>
                </div>

                {result.listing.listed && !result.listing.claimed && (
                  <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-5">
                    <p className="text-slate-700 font-medium mb-4 leading-relaxed">
                      TheDripMap covers {result.cityInsight.name || 'your city'} — but your listing is{' '}
                      <span className="font-black text-rose-600">unclaimed</span>. Patients comparing clinics
                      see a placeholder instead of your photos, hours, and services.
                    </p>
                    <Link href={claimUrl} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm text-white" style={{ backgroundColor: EMERALD }}>
                      Claim your free listing <ArrowRight size={16} />
                    </Link>
                  </div>
                )}
                {!result.listing.listed && (
                  <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-5">
                    <p className="text-slate-700 font-medium mb-4 leading-relaxed">
                      Your clinic isn&apos;t on TheDripMap yet — patients searching here can&apos;t find you.
                      Adding your listing is free and takes 2 minutes.
                    </p>
                    <Link href="/for-clinics/setup" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm text-white" style={{ backgroundColor: EMERALD }}>
                      Add your free listing <ArrowRight size={16} />
                    </Link>
                  </div>
                )}
                {result.listing.listed && result.listing.claimed && (
                  <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-5 flex items-center gap-3">
                    <ShieldCheck size={20} className="text-emerald-600 shrink-0" />
                    <p className="text-slate-700 font-medium leading-relaxed">
                      Your listing is claimed and verified — nice work. Keep it complete to keep winning clicks.
                    </p>
                  </div>
                )}
              </div>

              <p className="text-center text-xs text-slate-400">
                Want to audit another clinic? Edit the URL above and run it again.
              </p>
            </div>
          )}
        </div>
      )}
    </main>
  );
};
