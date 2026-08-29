'use client';

import React, { useState } from 'react';
import { Loader2, CheckCircle2, Sparkles, Send } from 'lucide-react';

interface GetMatchedFormProps {
  /** Display name of the city the patient chose in the quiz. */
  city: string;
  /** The recommended treatment name from the quiz result. */
  treatment: string;
}

/**
 * One request -> up to 3 claimed clinics reply to the patient directly
 * (lead engine v1). POSTs to /api/get-matched; while the forward flag is
 * dark the team relays by hand, so the promise in the copy stays honest
 * ("we'll connect you") rather than claiming instant delivery.
 */
export const GetMatchedForm = ({ city, treatment }: GetMatchedFormProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [matched, setMatched] = useState<Array<{ name: string; slug: string | null }> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/get-matched', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          city,
          treatment,
          notes: notes.trim(),
          website,
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Could not send. Please try again.');
      setMatched(Array.isArray(result.matched) ? result.matched : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (matched !== null) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 p-8 md:p-10 text-center shadow-sm">
        <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <CheckCircle2 size={28} />
        </div>
        <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Request sent</h3>
        {matched.length > 0 ? (
          <p className="text-slate-500 leading-relaxed max-w-md mx-auto">
            We&apos;re connecting you with{' '}
            {matched.map((m, i) => (
              <span key={m.slug || i} className="font-bold text-slate-700">
                {m.name}
                {i < matched.length - 2 ? ', ' : i === matched.length - 2 ? ' and ' : ''}
              </span>
            ))}{' '}
            in {city}. You&apos;ll hear back by email, usually within 1 to 2 business days.
          </p>
        ) : (
          <p className="text-slate-500 leading-relaxed max-w-md mx-auto">
            No clinic in {city} can receive requests directly yet, so our team will find the best option for {treatment} near you and reply by email.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-wellness-50 to-white rounded-3xl border border-wellness-100 p-6 md:p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-wellness-600 text-white rounded-2xl flex items-center justify-center shrink-0">
          <Sparkles size={18} />
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">Get matched, skip the phone calls</h3>
          <p className="text-xs font-bold text-slate-500">
            One request. Up to 3 {city} clinics reply to you directly about {treatment}.
          </p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <input
          type="text"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            required
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-wellness-500 focus:ring-4 focus:ring-wellness-100 transition-all font-medium text-slate-900 placeholder:text-slate-400"
          />
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-wellness-500 focus:ring-4 focus:ring-wellness-100 transition-all font-medium text-slate-900 placeholder:text-slate-400"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone (optional)"
            className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-wellness-500 focus:ring-4 focus:ring-wellness-100 transition-all font-medium text-slate-900 placeholder:text-slate-400"
          />
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything else? (optional)"
            className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-wellness-500 focus:ring-4 focus:ring-wellness-100 transition-all font-medium text-slate-900 placeholder:text-slate-400"
          />
        </div>
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm font-bold">{error}</div>
        )}
        <button
          type="submit"
          disabled={isSubmitting || !name.trim() || !email.trim()}
          className="w-full bg-wellness-600 text-white px-6 py-3.5 rounded-2xl font-black text-sm hover:bg-wellness-700 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Sending…
            </>
          ) : (
            <>
              Get matched <Send size={14} />
            </>
          )}
        </button>
        <p className="text-[11px] text-slate-400 font-medium text-center leading-relaxed">
          Free for patients. Clinics reply to your email; we never share your details beyond the clinics matched to this request.
        </p>
      </form>
    </div>
  );
};
