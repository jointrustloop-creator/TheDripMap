'use client';

import React, { useState } from 'react';
import { CheckCircle2, Loader2, Sparkles, ArrowRight } from 'lucide-react';

interface Props {
  price: number;
}

export function UpgradeRequestForm({ price }: Props) {
  const [clinicName, setClinicName] = useState('');
  const [clinicUrl, setClinicUrl] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [monthlyVolume, setMonthlyVolume] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicName.trim() || !name.trim() || !email.trim()) {
      setError('Clinic name, your name, and email are required.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/upgrade-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicName: clinicName.trim(),
          clinicUrl: clinicUrl.trim(),
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          monthlyVolume,
          notes: notes.trim(),
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Could not submit request. Please try again.');
      }
      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div
        id="upgrade-form"
        className="bg-emerald-50 border-2 border-emerald-200 rounded-[2rem] p-8 text-center"
      >
        <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-white text-emerald-600 flex items-center justify-center shadow-sm">
          <CheckCircle2 size={28} />
        </div>
        <h3 className="text-2xl font-black text-emerald-900 mb-3 tracking-tight">
          Request received
        </h3>
        <p className="text-sm text-emerald-800 leading-relaxed mb-5">
          We&apos;ll review and respond within 24 hours from <span className="font-bold">info@thedripmap.com</span>.
          Your Featured listing typically goes live the same day we hear back from you.
        </p>
        <p className="text-xs text-emerald-700 font-bold">
          (No payment taken yet — billing setup happens in the response email.)
        </p>
      </div>
    );
  }

  return (
    <form
      id="upgrade-form"
      onSubmit={handleSubmit}
      className="bg-white border-2 border-amber-100 rounded-[2rem] p-7 md:p-8 shadow-2xl shadow-amber-100/40 space-y-4"
    >
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={16} className="text-amber-500" />
        <span className="text-[11px] font-black uppercase tracking-[0.25em] text-amber-700">
          Request upgrade
        </span>
      </div>
      <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight mb-1">
        Get featured for <span className="text-amber-600">${price}/mo</span>
      </h3>
      <p className="text-sm text-slate-500 leading-relaxed mb-5">
        2 minute form. We respond within 24 hours.
      </p>

      <div>
        <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">
          Clinic name <span className="text-rose-500">*</span>
        </label>
        <input
          required
          value={clinicName}
          onChange={(e) => setClinicName(e.target.value)}
          placeholder="Blue Cypress IV and Wellness"
          className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-medium text-sm text-slate-900 placeholder:text-slate-400"
        />
      </div>

      <div>
        <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">
          Your TheDripMap listing URL <span className="text-slate-400 font-medium normal-case">(optional)</span>
        </label>
        <input
          value={clinicUrl}
          onChange={(e) => setClinicUrl(e.target.value)}
          placeholder="thedripmap.com/providers/..."
          className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-medium text-sm text-slate-900 placeholder:text-slate-400"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">
            Your name <span className="text-rose-500">*</span>
          </label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Owner / manager"
            className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-medium text-sm text-slate-900 placeholder:text-slate-400"
          />
        </div>
        <div>
          <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">
            Phone <span className="text-slate-400 font-medium normal-case">(optional)</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 555 000-0000"
            className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-medium text-sm text-slate-900 placeholder:text-slate-400"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">
          Email <span className="text-rose-500">*</span>
        </label>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@clinic.com"
          className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-medium text-sm text-slate-900 placeholder:text-slate-400"
        />
      </div>

      <div>
        <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">
          Estimated monthly patients
        </label>
        <select
          value={monthlyVolume}
          onChange={(e) => setMonthlyVolume(e.target.value)}
          className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-medium text-sm text-slate-900 cursor-pointer"
        >
          <option value="">Not sure / prefer not to say</option>
          <option value="Under 50">Under 50 / mo</option>
          <option value="50–150">50 – 150 / mo</option>
          <option value="150–400">150 – 400 / mo</option>
          <option value="400+">400+ / mo</option>
        </select>
      </div>

      <div>
        <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">
          Anything we should know?
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Specific cities you serve, treatments you want highlighted, mobile vs in-clinic, etc."
          className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-medium text-sm text-slate-900 placeholder:text-slate-400 resize-none"
        />
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-bold">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !clinicName.trim() || !name.trim() || !email.trim()}
        className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 px-6 py-4 rounded-2xl font-black text-base transition-all shadow-lg shadow-amber-200/60 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Sending…
          </>
        ) : (
          <>
            Request my upgrade <ArrowRight size={16} />
          </>
        )}
      </button>

      <p className="text-[11px] text-slate-400 font-medium text-center leading-relaxed">
        No payment taken yet. We reply within 24h with onboarding + invoice details.
      </p>
    </form>
  );
}
