'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  Search, Check, X, AlertTriangle, ArrowRight, Loader2,
  ShieldCheck, Mail, Globe, Lock, Sparkles, Copy, Clipboard,
  FileText, MessageSquareQuote, Map, Wrench, Target, Building2, User,
} from 'lucide-react';
import type { AuditResult, AuditCheck } from '../../app/api/seo-audit/route';
import { AUDIT_CITY_SUGGESTIONS } from '../lib/city-search-data';
import { BetaBadge } from './BetaBadge';

const EMERALD = '#0F6E56';

function scoreColor(score: number): string {
  if (score >= 70) return EMERALD;
  if (score >= 50) return '#D97706'; // amber-600
  return '#E11D48'; // rose-600
}

function StatusIcon({ status }: { status: AuditCheck['status'] }) {
  if (status === 'pass') return <Check size={16} className="text-emerald-600 shrink-0" strokeWidth={3} />;
  if (status === 'warn') return <AlertTriangle size={15} className="text-amber-500 shrink-0" />;
  return <X size={16} className="text-rose-500 shrink-0" strokeWidth={3} />;
}

/** Tiny inline component for any "copy to clipboard" button. */
function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback for browsers without permission: select-and-copy via a temp textarea.
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        // give up silently
      }
      document.body.removeChild(ta);
    }
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
        copied
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      }`}
    >
      {copied ? <Check size={12} strokeWidth={3} /> : <Copy size={12} />}
      {copied ? 'Copied' : label}
    </button>
  );
}

export const SeoAuditTool = () => {
  const [url, setUrl] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [gated, setGated] = useState(false);
  const [gatedLoading, setGatedLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [emailNote, setEmailNote] = useState<string | null>(null);

  const resultRef = useRef<HTMLDivElement | null>(null);

  const runAudit = async (e: React.FormEvent, opts?: { gatedRun?: boolean; businessName?: string; ownerName?: string }) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setUnlocked(false);
    setEmailNote(null);
    setGated(false);
    try {
      const res = await fetch('/api/seo-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          city,
          gated: !!opts?.gatedRun,
          businessName: opts?.businessName || businessName,
          ownerName: opts?.ownerName || ownerName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
      } else {
        setResult(data as AuditResult);
        if (opts?.gatedRun) setGated(true);
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
      }
    } catch {
      setError('Could not reach the audit service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // The gated upsell: capture business name + owner name + email, then RE-RUN
  // the audit with gated=true so the Places pillar runs and saves the lead.
  const unlockReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!result) return;
    setUnlocking(true);
    setEmailNote(null);
    setGatedLoading(true);

    try {
      // 1. Save the lead and email the report.
      const leadRes = await fetch('/api/seo-audit/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, businessName, ownerName, result }),
      });
      const leadData = await leadRes.json();
      if (!leadRes.ok) {
        setEmailNote(leadData.error || 'Could not send your report. Please try again.');
        return;
      }

      // 2. Re-run the audit in gated mode so the Places pillar runs.
      const auditRes = await fetch('/api/seo-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, city, gated: true, businessName, ownerName }),
      });
      const auditData = await auditRes.json();
      if (auditRes.ok) {
        setResult(auditData as AuditResult);
        setGated(true);
      }

      setUnlocked(true);
      setEmailNote(
        leadData.reportEmailed
          ? 'Done — your deep report is unlocked below and on its way to your inbox.'
          : 'Done — your deep report is unlocked below.'
      );
    } catch {
      setEmailNote('Could not unlock your report. Please try again.');
    } finally {
      setUnlocking(false);
      setGatedLoading(false);
    }
  };

  const claimUrl = result?.listing.slug
    ? `/providers/${result.listing.slug}?claim=1`
    : '/for-clinics/setup';

  return (
    <main className="max-w-5xl mx-auto px-6 pt-16 pb-24">
      {/* ===== HERO / INPUT ===== */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 mb-5">
          <Sparkles size={13} className="text-emerald-700" />
          <span className="text-[11px] font-black uppercase tracking-[0.15em] text-emerald-700">
            Free · For IV Clinic Owners
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-[#0A0B0D] tracking-tight leading-[1.05] mb-5">
          See exactly what to fix <BetaBadge className="ml-1 -translate-y-1" />
          <span className="block italic font-serif" style={{ color: EMERALD }}>in 60 seconds.</span>
        </h1>
        <p className="text-lg text-slate-500 leading-relaxed">
          Paste your clinic URL. We analyze your homepage, find the high-intent IV searches you&apos;re missing,
          and hand you the actual title tag, meta description, schema, and page outlines to paste in.
          No fluff — real copy, written for your city.
        </p>
      </div>

      <form onSubmit={(e) => runAudit(e)} className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/40 p-5 md:p-6 mb-4">
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
        Free instant scan covers paste-ready fixes, missing pages, patient questions, and JSON-LD schema.
        Unlock the local visibility (Google Business Profile) report with your email below.
      </p>

      {loading && (
        <div className="text-center py-16">
          <Loader2 size={28} className="animate-spin mx-auto text-emerald-600 mb-4" />
          <p className="text-slate-500 font-semibold">Fetching your site, running Google PageSpeed, and writing your fixes…</p>
          <p className="text-xs text-slate-400 mt-1">This can take up to 30 seconds.</p>
        </div>
      )}

      {/* ===== RESULTS ===== */}
      {result && !loading && (
        <div ref={resultRef} className="scroll-mt-24 space-y-6">
          {/* ========== IMPACT HEADLINE — THE BOTTOM LINE ========== */}
          <div className="relative bg-gradient-to-br from-[#0A0B0D] to-[#11221C] rounded-3xl p-7 md:p-10 overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <Target size={14} className="text-emerald-400" />
              <span className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-400">
                The bottom line
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-[1.1] mb-4 max-w-3xl">
              {result.llm?.impactHeadline || `You're missing ~${result.cityInsight.searchesPerMonth} monthly searches in ${result.cityInsight.name || 'your city'}.`}
            </h2>
            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-300">
              <div>
                <span className="font-black text-white text-2xl">~{result.cityInsight.searchesPerMonth}</span>
                <span className="ml-1.5 text-slate-400">monthly searches</span>
              </div>
              <div className="hidden sm:block w-px h-6 bg-white/10" />
              <div>
                <span className="font-black text-white text-2xl">{result.cityInsight.competitors}</span>
                <span className="ml-1.5 text-slate-400">clinics competing</span>
              </div>
              <div className="hidden sm:block w-px h-6 bg-white/10" />
              <div>
                <span className="font-black tabular-nums text-2xl" style={{ color: scoreColor(result.score) }}>{result.score}</span>
                <span className="ml-1.5 text-slate-400">tech SEO score</span>
              </div>
            </div>
            {!result.reachable && (
              <div className="mt-4 text-xs font-semibold text-amber-300">
                We couldn&apos;t fully load your site — some sections may be limited.
              </div>
            )}
          </div>

          {/* ========== PILLAR 1 (TOP 3 PASTE-READY FIXES — ABOVE THE FOLD) ========== */}
          {result.llm?.pasteReadyFixes && result.llm.pasteReadyFixes.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/40 p-7 md:p-9">
              <div className="flex items-center gap-2 mb-5">
                <Wrench size={16} style={{ color: EMERALD }} />
                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Paste-ready fixes · ranked by impact
                </span>
              </div>
              <p className="text-sm text-slate-500 mb-6 max-w-2xl">
                Each fix below is real copy written for your clinic in {result.city || 'your area'} —
                tap copy and paste it straight into your CMS.
              </p>
              <div className="space-y-4">
                {result.llm.pasteReadyFixes.slice(0, 6).map((f, i) => (
                  <div key={i} className="border border-slate-200 rounded-2xl p-5 bg-slate-50/40">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black"
                          style={{ backgroundColor: EMERALD }}
                        >
                          {i + 1}
                        </span>
                        <span className="font-black text-slate-800 text-sm uppercase tracking-wide">{f.field}</span>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                          f.impact === 3 ? 'bg-rose-100 text-rose-700' :
                          f.impact === 2 ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-200 text-slate-600'
                        }`}>
                          {f.impact === 3 ? 'High impact' : f.impact === 2 ? 'Medium' : 'Low'}
                        </span>
                      </div>
                      <CopyButton text={f.fix} />
                    </div>
                    {f.current && (
                      <div className="text-xs text-slate-400 mb-2">
                        <span className="font-bold uppercase tracking-wider">Current:</span>{' '}
                        <span className="italic">{f.current.slice(0, 140)}</span>
                      </div>
                    )}
                    <div className="bg-white border-l-4 rounded-r-lg px-4 py-3 mb-2" style={{ borderLeftColor: EMERALD }}>
                      <div className="text-[10px] font-black uppercase tracking-wider text-emerald-700 mb-1">Paste this</div>
                      <p className="text-sm font-semibold text-slate-800 leading-snug">{f.fix}</p>
                    </div>
                    {f.why && <p className="text-xs text-slate-500 italic">{f.why}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.llm?.state === 'stubbed' || result.llm?.state === 'error' ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-6 py-5">
              <div className="text-[11px] font-black uppercase tracking-wider text-amber-700 mb-1">AI section unavailable</div>
              <p className="text-sm font-semibold text-amber-900">
                {result.llm.reason || 'The AI-powered pillars are temporarily unavailable.'}
              </p>
            </div>
          ) : null}

          {/* ========== PILLAR 4 — SCHEMA GENERATOR (UPFRONT, INSTANT WIN) ========== */}
          {result.schemaPillar?.scriptTag && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-lg shadow-slate-200/40 p-7 md:p-9">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <FileText size={16} style={{ color: EMERALD }} />
                  <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Ready-to-paste schema · paste into your &lt;head&gt;
                  </span>
                </div>
                <CopyButton text={result.schemaPillar.scriptTag} label="Copy schema" />
              </div>
              <pre className="bg-slate-900 text-emerald-100 text-xs rounded-2xl p-5 overflow-x-auto leading-relaxed">
                <code>{result.schemaPillar.scriptTag}</code>
              </pre>
              {result.schemaPillar.notes && result.schemaPillar.notes.length > 0 && (
                <div className="mt-4 space-y-1.5">
                  {result.schemaPillar.notes.map((n, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-500">
                      <AlertTriangle size={12} className="text-amber-500 shrink-0 mt-0.5" />
                      <span>{n}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========== PILLAR 2 — MISSING PAGES ========== */}
          {result.llm?.missingPages && result.llm.missingPages.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-lg shadow-slate-200/40 p-7 md:p-9">
              <div className="flex items-center gap-2 mb-4">
                <Map size={16} style={{ color: EMERALD }} />
                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Pages you should build · ranked by patient intent
                </span>
              </div>
              <p className="text-sm text-slate-500 mb-6 max-w-2xl">
                These are the high-intent IV searches your site doesn&apos;t answer.
                Each card is a paste-ready brief — title, meta, H1, and outline.
              </p>
              <div className="space-y-5">
                {result.llm.missingPages.map((p, i) => (
                  <div key={i} className="border border-slate-200 rounded-2xl p-5 md:p-6 bg-slate-50/40">
                    <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                      <div className="font-mono text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1">
                        {p.suggestedPath}
                      </div>
                      {p.intent && <span className="text-[11px] font-semibold text-slate-500 italic">{p.intent}</span>}
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Title</div>
                          <p className="text-sm font-bold text-slate-800">{p.title}</p>
                        </div>
                        <CopyButton text={p.title} />
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Meta description</div>
                          <p className="text-sm text-slate-700">{p.metaDescription}</p>
                        </div>
                        <CopyButton text={p.metaDescription} />
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">H1</div>
                          <p className="text-sm font-bold text-slate-800">{p.h1}</p>
                        </div>
                        <CopyButton text={p.h1} />
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Page outline</div>
                        <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans leading-relaxed">{p.outline}</pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========== PILLAR 3 — PATIENT VOICE ========== */}
          {result.llm?.patientQuestions && result.llm.patientQuestions.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-lg shadow-slate-200/40 p-7 md:p-9">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquareQuote size={16} style={{ color: EMERALD }} />
                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Patient questions your site isn&apos;t answering
                </span>
              </div>
              <p className="text-sm text-slate-500 mb-6 max-w-2xl">
                Real questions IV patients in {result.city || 'your area'} ask before booking.
                Each is a content angle that captures bottom-funnel search intent.
              </p>
              <div className="space-y-3">
                {result.llm.patientQuestions.map((q, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl p-4 bg-slate-50/40">
                    <div className="flex items-center justify-between gap-3 mb-1.5 flex-wrap">
                      <p className="font-bold text-slate-800 text-sm flex-1 min-w-0">&ldquo;{q.question}&rdquo;</p>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {q.format}
                      </span>
                    </div>
                    {q.why && <p className="text-xs text-slate-500">{q.why}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========== PILLAR 5 — LOCAL VISIBILITY (GATED) ========== */}
          {!unlocked ? (
            <div className="relative bg-gradient-to-br from-[#0A0B0D] to-[#11221C] rounded-3xl p-7 md:p-9 overflow-hidden">
              <div className="flex items-center gap-2 mb-3">
                <Lock size={15} className="text-emerald-400" />
                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-400">
                  Unlock your deep report
                </span>
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-tight">
                Add Google Business Profile audit + NAP consistency.
              </h3>
              <p className="text-slate-300 text-sm mb-6 max-w-2xl leading-relaxed">
                The instant scan above is yours to keep. To unlock the local visibility pillar — your GBP
                presence, missing services/photos/hours, and NAP-consistency check — share your clinic
                name and email. We&apos;ll send the deep report to your inbox too.
              </p>
              <form onSubmit={unlockReport} className="grid gap-3 max-w-2xl">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Your clinic name"
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-slate-500 font-semibold focus:outline-none focus:border-emerald-400 transition-all"
                    />
                  </div>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    <input
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="Your name"
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-slate-500 font-semibold focus:outline-none focus:border-emerald-400 transition-all"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
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
                    {unlocking ? 'Unlocking…' : 'Unlock deep report'}
                  </button>
                </div>
              </form>
              {emailNote && <p className="text-sm font-semibold text-rose-300 mt-3">{emailNote}</p>}
              <p className="text-[11px] text-slate-500 mt-4">
                No spam. We email the report once. By submitting you agree to occasional product updates from TheDripMap (unsubscribe anytime).
              </p>
            </div>
          ) : (
            <>
              {emailNote && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 flex items-center gap-3">
                  <Check size={18} className="text-emerald-600 shrink-0" strokeWidth={3} />
                  <span className="text-sm font-bold text-emerald-800">{emailNote}</span>
                </div>
              )}

              {/* LOCAL VISIBILITY RESULT BLOCK */}
              {gatedLoading ? (
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-lg shadow-slate-200/40 p-8 text-center">
                  <Loader2 size={22} className="animate-spin mx-auto text-emerald-600 mb-3" />
                  <p className="text-sm font-semibold text-slate-600">Pulling your Google Business Profile data…</p>
                </div>
              ) : result.localVisibility ? (
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-lg shadow-slate-200/40 p-7 md:p-9">
                  <div className="flex items-center gap-2 mb-4">
                    <Clipboard size={16} style={{ color: EMERALD }} />
                    <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Local visibility · Google Business Profile
                    </span>
                  </div>

                  {result.localVisibility.state === 'setup-required' && (
                    <div className="border border-amber-200 bg-amber-50 rounded-2xl p-5">
                      <div className="font-black text-amber-900 mb-2">Setup required</div>
                      <p className="text-sm text-amber-900 mb-3">
                        The local visibility pillar uses the official Google Places API. Set{' '}
                        <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">{result.localVisibility.envVar}</code>{' '}
                        in your Vercel environment to enable it.
                      </p>
                      <ol className="text-xs text-amber-900 space-y-1 list-decimal list-inside">
                        {result.localVisibility.setupSteps?.map((s, i) => <li key={i}>{s}</li>)}
                      </ol>
                    </div>
                  )}

                  {result.localVisibility.state === 'not-found' && (
                    <div className="space-y-3">
                      {result.localVisibility.issues.map((iss, i) => (
                        <div key={i} className="border border-rose-200 bg-rose-50 rounded-xl p-4">
                          <p className="text-sm font-semibold text-rose-900">{iss}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {result.localVisibility.state === 'error' && (
                    <div className="border border-amber-200 bg-amber-50 rounded-2xl p-4">
                      <p className="text-sm font-semibold text-amber-900">
                        Local visibility check failed: {result.localVisibility.errorMessage}
                      </p>
                    </div>
                  )}

                  {result.localVisibility.state === 'ok' && result.localVisibility.place && (
                    <div className="space-y-5">
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">GBP match</div>
                        <div className="font-black text-slate-900 text-lg mb-1">{result.localVisibility.place.name}</div>
                        <div className="text-sm text-slate-600 mb-3">{result.localVisibility.place.formattedAddress}</div>
                        <div className="flex flex-wrap gap-4 text-xs">
                          <span><span className="font-black text-slate-900">{result.localVisibility.place.rating ?? '?'}★</span> <span className="text-slate-500">rating</span></span>
                          <span><span className="font-black text-slate-900">{result.localVisibility.place.reviewCount ?? 0}</span> <span className="text-slate-500">reviews</span></span>
                          <span><span className={`font-black ${result.localVisibility.place.hasHours ? 'text-emerald-700' : 'text-rose-600'}`}>{result.localVisibility.place.hasHours ? 'Hours set' : 'No hours'}</span></span>
                          <span><span className={`font-black ${result.localVisibility.place.hasPhotos ? 'text-emerald-700' : 'text-rose-600'}`}>{result.localVisibility.place.hasPhotos ? 'Photos present' : 'No photos'}</span></span>
                        </div>
                      </div>

                      {result.localVisibility.issues.length > 0 && (
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Issues to fix</div>
                          <div className="space-y-2">
                            {result.localVisibility.issues.map((iss, i) => (
                              <div key={i} className="flex items-start gap-2 border border-rose-200 bg-rose-50 rounded-xl p-3">
                                <X size={14} className="text-rose-600 shrink-0 mt-0.5" strokeWidth={3} />
                                <span className="text-sm text-rose-900">{iss}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.localVisibility.napConsistency?.notes && result.localVisibility.napConsistency.notes.length > 0 && (
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">NAP consistency</div>
                          <div className="space-y-2">
                            {result.localVisibility.napConsistency.notes.map((n, i) => (
                              <div key={i} className="flex items-start gap-2 border border-amber-200 bg-amber-50 rounded-xl p-3">
                                <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                                <span className="text-sm text-amber-900">{n}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.localVisibility.wins.length > 0 && (
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Wins</div>
                          <div className="space-y-2">
                            {result.localVisibility.wins.map((w, i) => (
                              <div key={i} className="flex items-start gap-2 border border-emerald-200 bg-emerald-50 rounded-xl p-3">
                                <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" strokeWidth={3} />
                                <span className="text-sm text-emerald-900">{w}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </>
          )}

          {/* ========== TECHNICAL SCORECARD (SECONDARY) ========== */}
          <details className="bg-white rounded-3xl border border-slate-200/80 shadow-lg shadow-slate-200/40 overflow-hidden group">
            <summary className="cursor-pointer p-7 md:p-9 flex items-center justify-between gap-4 list-none">
              <div className="flex items-center gap-4">
                <div className="text-3xl font-black tabular-nums" style={{ color: scoreColor(result.score) }}>
                  {result.score}
                  <span className="text-sm font-bold text-slate-400 ml-1">/100</span>
                </div>
                <div>
                  <div className="text-sm font-black text-slate-800">Technical SEO scorecard</div>
                  <div className="text-xs text-slate-500">Click to expand the 8 on-page checks</div>
                </div>
              </div>
              <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider group-open:rotate-180 transition-transform">
                ▼
              </div>
            </summary>
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
          </details>

          {/* ========== FEATURE FLAGS NOTICE (TRANSPARENCY) ========== */}
          {(!result.featureFlags.llmEnabled || !result.featureFlags.placesEnabled || result.featureFlags.serpRankEnabled === false) && (
            <div className="text-[11px] text-slate-400 text-center leading-relaxed">
              {!result.featureFlags.llmEnabled && <div>AI-generated fixes disabled (ANTHROPIC_API_KEY not set).</div>}
              {!result.featureFlags.placesEnabled && <div>Local visibility pillar in setup mode (GOOGLE_PLACES_API_KEY not set).</div>}
              {!result.featureFlags.serpRankEnabled && <div>Live SERP rank tracking is out of scope for v1 (SERP_RANK_ENABLED=false).</div>}
            </div>
          )}

          {/* ========== BIG CTA — "WANT US TO HANDLE THIS FOR YOU?" ========== */}
          <div className="bg-gradient-to-br from-emerald-50 to-white rounded-3xl border-2 border-emerald-200 p-7 md:p-10 text-center">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700 mb-3">
              Done reading? Skip the work.
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-3 tracking-tight max-w-2xl mx-auto">
              Want us to handle all of this for you?
            </h3>
            <p className="text-slate-600 mb-6 max-w-xl mx-auto leading-relaxed">
              Claim your free TheDripMap listing and we put your clinic in front of patients
              already searching for IV therapy in {result.city || 'your city'} — no schema to paste, no pages to build.
            </p>
            <Link
              href={claimUrl}
              className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl font-black text-white text-base transition-all"
              style={{ backgroundColor: EMERALD }}
            >
              {result.listing.listed && !result.listing.claimed
                ? 'Claim your existing listing'
                : 'Claim your free listing'}
              <ArrowRight size={18} />
            </Link>
            {result.listing.listed && result.listing.claimed && (
              <div className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-emerald-700">
                <ShieldCheck size={16} /> Your listing is already claimed — nice work.
              </div>
            )}
          </div>

          <p className="text-center text-xs text-slate-400">
            Want to audit another clinic? Edit the URL at the top and run it again.
          </p>
        </div>
      )}
    </main>
  );
};
