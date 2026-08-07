'use client';

import React, { useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

// Lead form for /for-clinics/open-a-clinic (monetization Lane 3).
export function FounderLeadForm() {
  const [form, setForm] = useState({ name: '', email: '', province: '', stage: '', note: '' });
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === 'sending') return;
    setState('sending');
    try {
      const res = await fetch('/api/founder-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setState(res.ok ? 'done' : 'error');
    } catch {
      setState('error');
    }
  };

  if (state === 'done') {
    return (
      <div className="bg-wellness-50 border border-wellness-200 rounded-3xl p-8 text-center">
        <CheckCircle2 className="mx-auto text-wellness-600 mb-3" size={32} />
        <p className="font-black text-slate-900 mb-1">Got it. Hubert will reply personally.</p>
        <p className="text-sm text-slate-600">Usually within one business day.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-4 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input required placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border border-slate-200 rounded-xl px-4 py-3 text-sm w-full" />
        <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="border border-slate-200 rounded-xl px-4 py-3 text-sm w-full" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <select required value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} className="border border-slate-200 rounded-xl px-4 py-3 text-sm w-full bg-white">
          <option value="">Province</option>
          {['Ontario', 'British Columbia', 'Alberta', 'Quebec', 'Manitoba', 'Saskatchewan', 'Nova Scotia', 'New Brunswick', 'Other'].map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select required value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} className="border border-slate-200 rounded-xl px-4 py-3 text-sm w-full bg-white">
          <option value="">Where are you at?</option>
          <option>Just researching</option>
          <option>Planning to open within 6 months</option>
          <option>Opening now, need a medical director</option>
          <option>Already open, need compliance help</option>
        </select>
      </div>
      <textarea placeholder="Anything specific? (optional)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={3} className="border border-slate-200 rounded-xl px-4 py-3 text-sm w-full" />
      <button type="submit" disabled={state === 'sending'} className="w-full bg-wellness-600 hover:bg-wellness-700 text-white font-black rounded-xl py-3.5 text-sm inline-flex items-center justify-center gap-2 transition-all disabled:opacity-60">
        {state === 'sending' ? 'Sending...' : 'Get pointed in the right direction'} <ArrowRight size={16} />
      </button>
      {state === 'error' && <p className="text-sm text-red-600 text-center">Something went wrong. Email info@thedripmap.com instead.</p>}
      <p className="text-[11px] text-slate-400 text-center leading-relaxed">Free. We may connect you with vetted medical directors, consultants, or suppliers; some partners pay us a referral fee, which never changes your price. Not legal or medical advice.</p>
    </form>
  );
}
