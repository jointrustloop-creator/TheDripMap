'use client';
import React, { useState } from 'react';
import { Building2, MapPin, Mail, Phone, CheckCircle2, ArrowRight } from 'lucide-react';

export function FeaturedWaitlistForm() {
  const [clinicName, setClinicName] = useState('');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/featured-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinic_name: clinicName,
          city,
          email,
          phone,
          notes,
          source: 'web',
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || 'Something went wrong, please try again.');
        setSubmitting(false);
        return;
      }
      setDone(true);
    } catch {
      setError('Network error, please try again.');
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-3xl border border-wellness-200 bg-wellness-50 p-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-wellness-600 rounded-2xl flex items-center justify-center text-white shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-wellness-900 mb-2">You are on the list.</h2>
            <p className="text-sm text-wellness-800 leading-relaxed">
              We will email {email || 'you'} when Featured placement opens in {city || 'your city'}.
              No promo emails in between, no pricing teaser, no sales call. Just one note when your city is up.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-8 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Building2 size={16} /> Clinic name
          </label>
          <input
            type="text"
            required
            value={clinicName}
            onChange={(e) => setClinicName(e.target.value)}
            placeholder="e.g. Bay Wellness Centre"
            className="w-full p-4 rounded-2xl border border-slate-200 focus:border-wellness-600 focus:ring-2 focus:ring-wellness-100 outline-none transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <MapPin size={16} /> City
          </label>
          <input
            type="text"
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Toronto"
            className="w-full p-4 rounded-2xl border border-slate-200 focus:border-wellness-600 focus:ring-2 focus:ring-wellness-100 outline-none transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Mail size={16} /> Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="owner@clinic.com"
            className="w-full p-4 rounded-2xl border border-slate-200 focus:border-wellness-600 focus:ring-2 focus:ring-wellness-100 outline-none transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Phone size={16} /> Phone <span className="font-medium text-slate-400">(optional)</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 555 5555"
            className="w-full p-4 rounded-2xl border border-slate-200 focus:border-wellness-600 focus:ring-2 focus:ring-wellness-100 outline-none transition-all"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-700">
          Anything we should know? <span className="font-medium text-slate-400">(optional)</span>
        </label>
        <textarea
          maxLength={1000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Multiple locations, specific treatments, mobile only, etc."
          className="w-full p-4 h-28 rounded-2xl border border-slate-200 focus:border-wellness-600 focus:ring-2 focus:ring-wellness-100 outline-none transition-all resize-none"
        />
      </div>

      {error && (
        <div className="text-sm font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-2xl p-4">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Adding you…' : 'Join the waitlist'} <ArrowRight size={20} />
        </button>
      </div>
    </form>
  );
}
