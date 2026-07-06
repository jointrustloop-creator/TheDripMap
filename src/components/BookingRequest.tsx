'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarCheck, CheckCircle2, Loader2, X } from 'lucide-react';
import { Provider } from '../types';
import { trackEvent } from '../lib/analytics-client';

// V1 in-product booking request. Rides the existing /api/message-clinic
// pipeline (save to inquiries + auto-forward to claimed clinics with
// reply-to patient + info@ copy) with a structured booking payload, so the
// clinic receives a confirmable request instead of a free-text message.

const DEFAULT_TREATMENTS = [
  'IV vitamin drip',
  'Hydration drip',
  "Myers' Cocktail",
  'NAD+',
  'Immune support',
  'B12 shot',
  'Not sure yet',
];

const TIME_WINDOWS = [
  'Weekday morning',
  'Weekday afternoon',
  'Weekday evening',
  'Weekend',
];

interface BookingRequestButtonProps {
  provider: Provider;
  /** Clinic-specific treatment names (from its verified menu) shown as choices. */
  treatments?: string[];
  className?: string;
  label?: string;
}

export const BookingRequestButton = ({ provider, treatments, className, label }: BookingRequestButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (provider?.id) trackEvent(provider.id, 'booking_click');
          setIsOpen(true);
        }}
        className={
          className ||
          'w-full bg-wellness-600 text-white px-6 py-4 rounded-2xl font-black text-base hover:bg-wellness-700 transition-all shadow-lg shadow-wellness-200/50 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2'
        }
      >
        <CalendarCheck size={18} /> {label || 'Request a booking'}
      </button>
      <BookingRequestModal
        provider={provider}
        treatments={treatments}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
};

interface BookingRequestModalProps {
  provider: Provider;
  treatments?: string[];
  isOpen: boolean;
  onClose: () => void;
}

export const BookingRequestModal = ({ provider, treatments, isOpen, onClose }: BookingRequestModalProps) => {
  const options = (treatments && treatments.length ? [...treatments.slice(0, 8), 'Not sure yet'] : DEFAULT_TREATMENTS);
  const [treatment, setTreatment] = useState('');
  const [times, setTimes] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  // Mirrors MessageClinicModal: only claim "sent to the clinic" when the API
  // actually auto-forwarded; otherwise say the team will relay it.
  const [forwarded, setForwarded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleTime = (t: string) =>
    setTimes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const reset = () => {
    setTreatment(''); setTimes([]); setName(''); setEmail(''); setPhone(''); setNote('');
    setIsSuccess(false); setForwarded(false); setError(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const canSubmit = treatment && times.length > 0 && name.trim() && email.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    const message = `Booking request. Treatment: ${treatment}. Availability: ${times.join(', ')}.${note.trim() ? ` Note: ${note.trim()}` : ''}`;
    try {
      const res = await fetch('/api/message-clinic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId: provider.id,
          clinicName: provider.name,
          clinicSlug: provider.slug,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          message,
          booking: { treatment, times },
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Something went wrong.');
      setForwarded(json.forwardStatus === 'sent');
      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
            className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-wellness-600">Request a booking</div>
                <div className="text-lg font-black text-slate-900 leading-tight">{provider.name}</div>
              </div>
              <button type="button" onClick={handleClose} aria-label="Close" className="p-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors">
                <X size={20} />
              </button>
            </div>

            {isSuccess ? (
              <div className="px-6 py-10 text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-wellness-50 text-wellness-600 flex items-center justify-center">
                  <CheckCircle2 size={28} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Request sent</h3>
                <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
                  {forwarded ? (
                    <>Your booking request went straight to {provider.name}. They&apos;ll email you to confirm a time, usually within 1 business day.</>
                  ) : (
                    <>We&apos;ve received your request and our team will make sure {provider.name} gets it. You&apos;ll hear back by email soon.</>
                  )}
                </p>
                <button type="button" onClick={handleClose} className="mt-6 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-slate-800 transition-colors">
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
                <div>
                  <div className="text-sm font-black text-slate-900 mb-2">What are you booking?</div>
                  <div className="flex flex-wrap gap-2">
                    {options.map((t) => (
                      <button
                        key={t} type="button" onClick={() => setTreatment(t)}
                        className={`px-3.5 py-2 rounded-xl text-sm font-bold border transition-colors ${treatment === t ? 'bg-wellness-600 text-white border-wellness-600' : 'bg-white text-slate-700 border-slate-200 hover:border-wellness-300'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-black text-slate-900 mb-2">When works for you? <span className="text-slate-400 font-bold">(pick any)</span></div>
                  <div className="flex flex-wrap gap-2">
                    {TIME_WINDOWS.map((t) => (
                      <button
                        key={t} type="button" onClick={() => toggleTime(t)}
                        className={`px-3.5 py-2 rounded-xl text-sm font-bold border transition-colors ${times.includes(t) ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 outline-none focus:border-wellness-500 focus:ring-2 focus:ring-wellness-500/15 placeholder:text-slate-400 placeholder:font-medium"
                  />
                  <input
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email for confirmation"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 outline-none focus:border-wellness-500 focus:ring-2 focus:ring-wellness-500/15 placeholder:text-slate-400 placeholder:font-medium"
                  />
                </div>
                <input
                  type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone (optional)"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 outline-none focus:border-wellness-500 focus:ring-2 focus:ring-wellness-500/15 placeholder:text-slate-400 placeholder:font-medium"
                />
                <textarea
                  value={note} onChange={(e) => setNote(e.target.value)} rows={2}
                  placeholder="Anything the clinic should know? (optional)"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 outline-none focus:border-wellness-500 focus:ring-2 focus:ring-wellness-500/15 placeholder:text-slate-400 resize-none"
                />

                {error && <div className="text-sm font-bold text-red-600">{error}</div>}

                <button
                  type="submit" disabled={!canSubmit || isSubmitting}
                  className="w-full bg-wellness-600 text-white px-6 py-4 rounded-2xl font-black text-base hover:bg-wellness-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CalendarCheck size={18} />}
                  {isSubmitting ? 'Sending…' : 'Send booking request'}
                </button>
                <p className="text-[11px] text-slate-400 leading-relaxed text-center">
                  The clinic confirms your time by email. No payment is taken on TheDripMap.
                </p>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
