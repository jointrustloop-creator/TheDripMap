'use client';

import { useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface FormState {
  clinicName: string;
  city: string;
  contactEmail: string;
  website: string;
  gbpUrl: string;
  notes: string;
}

const EMPTY: FormState = {
  clinicName: '',
  city: '',
  contactEmail: '',
  website: '',
  gbpUrl: '',
  notes: '',
};

export function OrderForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ orderId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const r = await fetch('/api/get-found-kit-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || `HTTP ${r.status}`);
        setSubmitting(false);
        return;
      }
      setDone({ orderId: data.orderId });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="bg-white rounded-3xl border border-emerald-200 shadow-sm p-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-3">Got it. Your kit is being built.</h2>
        <p className="text-slate-600 leading-relaxed mb-2">
          We will email your Get Found Kit to <span className="font-bold text-slate-900">{form.contactEmail}</span> within 48 hours.
        </p>
        <p className="text-sm text-slate-500 font-mono">Order ID: {done.orderId}</p>
      </div>
    );
  }

  const labelCls = 'block text-xs font-black uppercase tracking-[0.15em] text-slate-700 mb-2';
  const inputCls = 'w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-wellness-500 focus:border-transparent transition-all text-sm';

  return (
    <form onSubmit={submit} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 md:p-10 space-y-6">
      <div>
        <label className={labelCls} htmlFor="clinicName">Clinic name *</label>
        <input
          id="clinicName"
          required
          type="text"
          value={form.clinicName}
          onChange={(e) => set('clinicName', e.target.value)}
          className={inputCls}
          placeholder="e.g. Bay Wellness Centre"
        />
      </div>

      <div>
        <label className={labelCls} htmlFor="city">City *</label>
        <input
          id="city"
          required
          type="text"
          value={form.city}
          onChange={(e) => set('city', e.target.value)}
          className={inputCls}
          placeholder="e.g. Vancouver"
        />
      </div>

      <div>
        <label className={labelCls} htmlFor="contactEmail">Contact email *</label>
        <input
          id="contactEmail"
          required
          type="email"
          value={form.contactEmail}
          onChange={(e) => set('contactEmail', e.target.value)}
          className={inputCls}
          placeholder="you@yourclinic.com"
        />
        <p className="text-xs text-slate-500 font-medium mt-2">We will email the finished kit here within 48 hours.</p>
      </div>

      <div>
        <label className={labelCls} htmlFor="website">Website (optional but helps)</label>
        <input
          id="website"
          type="url"
          value={form.website}
          onChange={(e) => set('website', e.target.value)}
          className={inputCls}
          placeholder="https://yourclinic.com"
        />
      </div>

      <div>
        <label className={labelCls} htmlFor="gbpUrl">Google Business Profile URL (optional but helps)</label>
        <input
          id="gbpUrl"
          type="url"
          value={form.gbpUrl}
          onChange={(e) => set('gbpUrl', e.target.value)}
          className={inputCls}
          placeholder="https://maps.app.goo.gl/..."
        />
      </div>

      <div>
        <label className={labelCls} htmlFor="notes">Anything else we should know (optional)</label>
        <textarea
          id="notes"
          rows={3}
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          className={inputCls}
          placeholder="Languages spoken, specialty services, anything that would shape the copy"
        />
      </div>

      {error && (
        <div className="px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-sm font-bold">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all"
      >
        {submitting ? (<><Loader2 size={16} className="animate-spin" />Submitting…</>) : 'Submit kit order'}
      </button>

      <p className="text-xs text-slate-500 font-medium text-center">
        Your details stay on TheDripMap. We will never share them with third parties.
      </p>
    </form>
  );
}
