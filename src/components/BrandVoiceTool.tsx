'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Check, Loader2, ArrowRight, Copy, Mail, ShieldCheck, BadgeCheck } from 'lucide-react';
import type { BrandVoiceResult, BrandVoiceListing } from '../../app/api/brand-voice/route';
import { slugify } from '../lib/data';

const EMERALD = '#0F6E56';

const TREATMENTS = ['Hydration', 'NAD+', 'Myers Cocktail', 'Hangover', 'Beauty Glow', 'Weight Loss', 'Mobile IV', 'Athletic Recovery', 'Immune Support', 'Other'];
const VIBES = ['Medical & clinical', 'Luxury spa-like', 'Warm & friendly', 'Athletic & performance', 'Modern & minimalist'];
const PATIENTS = ['Busy professionals', 'Athletes', 'New moms & families', 'Executives', 'Party & event crowd', 'General wellness'];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard unavailable */ }
  };
  return (
    <button
      type="button" onClick={copy}
      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
        copied ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-300 hover:text-emerald-700'
      }`}
    >
      {copied ? <><Check size={13} strokeWidth={3} /> Copied</> : <><Copy size={13} /> Copy</>}
    </button>
  );
}

function ResultCard({ label, text, count }: { label: string; text: string; count?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</span>
        <div className="flex items-center gap-2">
          {count && <span className="text-[11px] font-bold text-slate-400 tabular-nums">{count}</span>}
          <CopyButton text={text} />
        </div>
      </div>
      <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{text}</p>
    </div>
  );
}

export const BrandVoiceTool = () => {
  const [clinicName, setClinicName] = useState('');
  const [city, setCity] = useState('');
  const [treatments, setTreatments] = useState<string[]>([]);
  const [vibe, setVibe] = useState('');
  const [patient, setPatient] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BrandVoiceResult | null>(null);
  const [listing, setListing] = useState<BrandVoiceListing | null>(null);

  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sentMsg, setSentMsg] = useState<string | null>(null);
  const [claimedListing, setClaimedListing] = useState<{ name: string; slug: string | null; city: string | null } | null>(null);

  const [applyEmail, setApplyEmail] = useState('');
  const [applySending, setApplySending] = useState(false);
  const [applyMsg, setApplyMsg] = useState<string | null>(null);
  const [applyDone, setApplyDone] = useState(false);

  const toggleTreatment = (t: string) => {
    setTreatments((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : prev.length >= 3 ? prev : [...prev, t]);
  };
  const canGenerate = clinicName.trim() && city.trim() && treatments.length > 0 && vibe && patient;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canGenerate) return;
    setLoading(true); setError(null); setResult(null); setListing(null); setSentMsg(null); setClaimedListing(null);
    try {
      const res = await fetch('/api/brand-voice', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicName, city, treatments, vibe, patient }),
      });
      const data = await res.json();
      if (!res.ok) {
        // The API returns a 503 when the generator is unavailable (e.g. missing
        // ANTHROPIC_API_KEY). Surface a friendly, on-brand message instead of a
        // raw/blank error state.
        if (res.status === 503) {
          setError('Brand voice generation is temporarily unavailable. Please check back shortly or email info@thedripmap.com');
        } else {
          setError(data.error || 'Something went wrong. Please try again.');
        }
        return;
      }
      setResult(data.result); setListing(data.listing);
      // Stash for the claim/setup prefill.
      try {
        sessionStorage.setItem('tdm_brandvoice_prefill', JSON.stringify({
          clinicName, city, oneLiner: data.result.listingDescription,
          tagline: data.result.tagline, founderStatement: data.result.welcomeEmail?.paragraph || '',
        }));
      } catch { /* ignore */ }
    } catch {
      setError('Could not reach the generator. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendKit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!result) return;
    setSending(true); setSentMsg(null);
    try {
      const res = await fetch('/api/brand-voice/lead', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, clinicName, city, result }),
      });
      const data = await res.json();
      if (!res.ok) { setSentMsg(data.error || 'Could not send. Please try again.'); return; }
      setSentMsg(data.emailed ? 'Sent — your copy kit is on its way to your inbox.' : 'Saved — we\'ll get your copy kit to you shortly.');
      if (data.claimedListing) setClaimedListing(data.claimedListing);
    } catch {
      setSentMsg('Could not send. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const applyToListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!result || !listing?.slug) return;
    setApplySending(true); setApplyMsg(null);
    try {
      const res = await fetch('/api/brand-voice/apply', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: listing.slug, email: applyEmail, listingDescription: result.listingDescription }),
      });
      const data = await res.json();
      if (!res.ok) { setApplyMsg(data.error || 'Could not start the apply request. Please try again.'); return; }
      setApplyDone(true);
      setApplyMsg(`Almost done — check ${data.email || 'your inbox'} for a one-click link to publish this to your listing. It expires in 1 hour.`);
    } catch {
      setApplyMsg('Could not reach the server. Please try again.');
    } finally {
      setApplySending(false);
    }
  };

  const claimHref = listing?.slug ? `/providers/${listing.slug}?claim=1&prefill=brandvoice` : '/for-clinics/setup?prefill=brandvoice';

  return (
    <div>
      {/* ===== FORM ===== */}
      <form onSubmit={handleGenerate} className="space-y-7">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-2">Clinic name</label>
            <input type="text" required value={clinicName} onChange={(e) => setClinicName(e.target.value)} placeholder="e.g. Glow Drip Co."
              className="w-full px-4 py-3.5 rounded-2xl bg-white border border-slate-200 font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition-all" />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-2">City</label>
            <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Austin"
              className="w-full px-4 py-3.5 rounded-2xl bg-white border border-slate-200 font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition-all" />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-2">
            Top treatments <span className="text-slate-300 normal-case tracking-normal">· pick up to 3 ({treatments.length}/3)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {TREATMENTS.map((t) => {
              const active = treatments.includes(t); const disabled = !active && treatments.length >= 3;
              return (
                <button key={t} type="button" onClick={() => toggleTreatment(t)} disabled={disabled}
                  className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${active ? 'text-white border-transparent' : disabled ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'}`}
                  style={active ? { backgroundColor: EMERALD } : undefined}>
                  {active && <Check size={13} className="inline -mt-0.5 mr-1" strokeWidth={3} />}{t}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-2">Clinic vibe</label>
          <div className="flex flex-wrap gap-2">
            {VIBES.map((v) => (
              <button key={v} type="button" onClick={() => setVibe(v)}
                className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${vibe === v ? 'text-white border-transparent' : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'}`}
                style={vibe === v ? { backgroundColor: EMERALD } : undefined}>{v}</button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-2">Ideal patient</label>
          <div className="flex flex-wrap gap-2">
            {PATIENTS.map((p) => (
              <button key={p} type="button" onClick={() => setPatient(p)}
                className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${patient === p ? 'text-white border-transparent' : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'}`}
                style={patient === p ? { backgroundColor: EMERALD } : undefined}>{p}</button>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <button type="submit" disabled={!canGenerate || loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black text-white text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: EMERALD }}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            {loading ? 'Writing your copy…' : 'Generate My Copy'}
            {!loading && <ArrowRight size={18} />}
          </button>
          {!canGenerate && <p className="text-xs text-slate-400 mt-3">Fill in all five fields to generate your copy kit.</p>}
          {error && <p className="text-sm font-semibold text-rose-600 mt-3">{error}</p>}
        </div>
      </form>

      {/* ===== RESULTS ===== */}
      {result && (
        <div className="mt-10 pt-8 border-t border-slate-100 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} style={{ color: EMERALD }} />
            <h2 className="text-lg font-black text-[#0A0B0D]">Your copy kit for {clinicName}</h2>
          </div>

          <ResultCard label="TheDripMap Listing Description" text={result.listingDescription} />
          <ResultCard label="Google Business · About" text={result.gbpAbout} count={`${result.gbpAbout.length}/250`} />
          <ResultCard label="Instagram Bio" text={result.instagramBio} count={`${result.instagramBio.length}/150`} />

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Instagram Captions</span>
            <div className="mt-3 space-y-4">
              {(result.instagramCaptions || []).map((c, i) => (
                <div key={i} className="border-l-2 border-emerald-100 pl-4">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">{c.tone}</span>
                    <CopyButton text={c.text} />
                  </div>
                  <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{c.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Welcome Email</span>
              <CopyButton text={`Subject: ${result.welcomeEmail?.subject || ''}\n\n${result.welcomeEmail?.paragraph || ''}`} />
            </div>
            <p className="text-slate-900 font-bold mb-1">{result.welcomeEmail?.subject}</p>
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{result.welcomeEmail?.paragraph}</p>
          </div>

          <ResultCard label="Website Hero Headline" text={result.heroHeadline} />
          <ResultCard label="Brand Tagline" text={result.tagline} count={`${result.tagline.trim().split(/\s+/).length} words`} />

          {/* ===== LISTING INTEGRATION ===== */}
          <div className="mt-6">
            {listing?.found && listing.claimed && (
              <div className="rounded-3xl p-6 md:p-7 text-white" style={{ backgroundColor: '#0A3D2B' }}>
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck size={18} className="text-emerald-300" />
                  <span className="text-[11px] font-black uppercase tracking-[0.12em] text-emerald-200">Your verified listing</span>
                </div>
                <h3 className="text-xl font-black mb-2">{listing.name}{listing.city ? ` · ${listing.city}` : ''}</h3>
                <p className="text-emerald-50/80 text-sm leading-relaxed mb-4">Publish this copy straight to your listing description. Enter the email you claimed with — we&apos;ll send a one-click confirmation link, then your listing updates automatically.</p>
                {!applyDone && (
                  <form onSubmit={applyToListing} className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email" required value={applyEmail} onChange={(e) => setApplyEmail(e.target.value)}
                      placeholder="Your claimed email"
                      className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-emerald-200/50 font-semibold focus:outline-none focus:border-emerald-300"
                    />
                    <button type="submit" disabled={applySending}
                      className="inline-flex items-center justify-center gap-2 bg-white text-[#0A3D2B] px-6 py-3 rounded-xl font-black text-sm disabled:opacity-60 whitespace-nowrap">
                      {applySending ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                      Apply to my listing
                    </button>
                  </form>
                )}
                {applyMsg && <p className="text-sm font-semibold text-emerald-200 mt-3">{applyMsg}</p>}
              </div>
            )}
            {listing?.found && !listing.claimed && (
              <div className="rounded-3xl p-6 md:p-7 bg-amber-50 border border-amber-100">
                <h3 className="text-lg font-black text-amber-900 mb-1">{listing.name}{listing.city ? ` · ${listing.city}` : ''} — unclaimed</h3>
                <p className="text-amber-800/80 text-sm leading-relaxed mb-4">Your listing is unclaimed. Claim it free to publish this copy straight to your profile — we&apos;ll pre-fill it with what you just generated.</p>
                <Link href={claimHref} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-black text-white text-sm" style={{ backgroundColor: EMERALD }}>
                  Claim it free &amp; publish this copy <ArrowRight size={16} />
                </Link>
              </div>
            )}
            {listing && !listing.found && (
              <div className="rounded-3xl p-6 md:p-7 bg-[#F8F7F3] border border-slate-200">
                <h3 className="text-lg font-black text-slate-900 mb-1">Not on TheDripMap yet?</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-4">Claim your free listing and publish this copy to reach patients searching in {city}. We&apos;ll pre-fill your profile with what you just generated.</p>
                <Link href="/for-clinics/setup?prefill=brandvoice" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-black text-white text-sm" style={{ backgroundColor: EMERALD }}>
                  Claim your free listing <ArrowRight size={16} />
                </Link>
              </div>
            )}
          </div>

          {/* ===== EMAIL GATE ===== */}
          <div className="mt-6 rounded-3xl bg-gradient-to-br from-[#0A0B0D] to-[#11221C] p-6 md:p-7">
            <div className="flex items-center gap-2 mb-2">
              <Mail size={16} className="text-emerald-400" />
              <span className="text-[11px] font-black uppercase tracking-[0.12em] text-emerald-400">Save your copy kit</span>
            </div>
            <p className="text-slate-300 text-sm mb-4">We&apos;ll email all seven pieces of copy so you have them on hand.</p>
            <form onSubmit={sendKit} className="flex flex-col sm:flex-row gap-3 max-w-lg">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@yourclinic.com"
                className="flex-1 px-4 py-3.5 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-slate-500 font-semibold focus:outline-none focus:border-emerald-400 transition-all" />
              <button type="submit" disabled={sending}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-black text-sm bg-emerald-400 text-[#0A0B0D] hover:bg-emerald-300 transition-all disabled:opacity-60 whitespace-nowrap">
                {sending ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                Send me my copy kit
              </button>
            </form>
            {sentMsg && <p className="text-sm font-semibold text-emerald-300 mt-3">{sentMsg}</p>}
            {claimedListing && (
              <div className="mt-4 flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4">
                <BadgeCheck size={20} className="text-emerald-300 shrink-0" />
                <div className="flex-1 text-sm text-slate-200">
                  That email is linked to your claimed listing, <span className="font-bold text-white">{claimedListing.name}</span>.
                </div>
                <Link href={`/providers/${claimedListing.slug || slugify(claimedListing.name)}?claim=1&prefill=brandvoice`} className="text-xs font-black text-emerald-300 whitespace-nowrap">
                  Apply copy →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
