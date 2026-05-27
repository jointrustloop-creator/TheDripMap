'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, Loader2, CheckCircle2, Heart } from 'lucide-react';
import { Provider } from '../types';

interface SubmitTestimonialModalProps {
  provider: Provider;
  isOpen: boolean;
  onClose: () => void;
}

export const SubmitTestimonialModal = ({ provider, isOpen, onClose }: SubmitTestimonialModalProps) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setRating(0); setHoverRating(0);
    setAuthorName(''); setAuthorEmail('');
    setTitle(''); setBody(''); setVisitDate('');
    setIsSuccess(false); setError(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || !authorName.trim() || !authorEmail.trim() || body.trim().length < 30) {
      setError('Please complete every required field. Tell us at least a few sentences about your visit.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/testimonials/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: provider.id,
          providerName: provider.name,
          providerSlug: provider.slug,
          authorName: authorName.trim(),
          authorEmail: authorEmail.trim(),
          rating,
          title: title.trim() || null,
          body: body.trim(),
          visitDate: visitDate || null,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Could not submit testimonial.');
      }
      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
          />

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            className="fixed inset-0 z-[101] flex items-end md:items-center justify-center p-0 md:p-6 pointer-events-none"
          >
            <div className="bg-white w-full md:max-w-xl rounded-t-[2rem] md:rounded-[2rem] shadow-2xl pointer-events-auto max-h-[92vh] overflow-y-auto">
              {isSuccess ? (
                <div className="p-10 text-center">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
                    Thank you
                  </h3>
                  <p className="text-slate-500 mb-2 leading-relaxed">
                    Your testimonial has been submitted for review.
                  </p>
                  <p className="text-slate-500 mb-8 text-sm">
                    We&apos;ll publish it on {provider.name}&apos;s profile within 24 hours.
                  </p>
                  <button
                    onClick={close}
                    className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-slate-800 transition-all"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <div className="px-6 md:px-8 pt-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 bg-wellness-50 text-wellness-700 rounded-2xl flex items-center justify-center shrink-0">
                        <Heart size={20} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-black text-slate-900 tracking-tight truncate">
                          Share your experience
                        </h3>
                        <p className="text-xs font-bold text-slate-500 truncate">
                          {provider.name}, {provider.city}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={close}
                      className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 shrink-0"
                      aria-label="Close"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5">
                    {/* Rating */}
                    <div>
                      <label className="text-sm font-bold text-slate-700 mb-3 block">
                        Your rating <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((n) => {
                          const active = (hoverRating || rating) >= n;
                          return (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setRating(n)}
                              onMouseEnter={() => setHoverRating(n)}
                              onMouseLeave={() => setHoverRating(0)}
                              className="p-1 transition-transform hover:scale-110"
                              aria-label={`${n} stars`}
                            >
                              <Star
                                size={32}
                                fill={active ? 'currentColor' : 'none'}
                                className={active ? 'text-amber-500' : 'text-slate-300'}
                                strokeWidth={1.5}
                              />
                            </button>
                          );
                        })}
                        {rating > 0 && (
                          <span className="ml-3 text-sm font-black text-slate-700">
                            {rating === 5 ? 'Excellent' : rating === 4 ? 'Very good' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-bold text-slate-700 mb-2 block">
                          Your name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          value={authorName}
                          onChange={(e) => setAuthorName(e.target.value)}
                          placeholder="Your full name"
                          className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-wellness-500 focus:ring-4 focus:ring-wellness-100 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-bold text-slate-700 mb-2 block">
                          Email <span className="text-rose-500">*</span>
                        </label>
                        <input
                          required
                          type="email"
                          value={authorEmail}
                          onChange={(e) => setAuthorEmail(e.target.value)}
                          placeholder="you@email.com"
                          className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-wellness-500 focus:ring-4 focus:ring-wellness-100 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                        />
                        <p className="text-[11px] text-slate-400 font-medium mt-1.5">
                          Not published. Only used to verify you&apos;re real.
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-bold text-slate-700 mb-2 block">
                        Headline <span className="text-slate-400 font-medium">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={80}
                        placeholder="e.g. Best NAD+ drip in Toronto"
                        className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-wellness-500 focus:ring-4 focus:ring-wellness-100 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-bold text-slate-700 mb-2 block">
                        Tell us about your visit <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={5}
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        minLength={30}
                        maxLength={2000}
                        placeholder="What treatment did you get? How did you feel? Would you go back? The more specific, the more helpful for the next patient."
                        className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-wellness-500 focus:ring-4 focus:ring-wellness-100 transition-all resize-none font-medium text-slate-900 placeholder:text-slate-400"
                      />
                      <p className="text-[11px] text-slate-400 font-medium mt-1.5">
                        {body.length < 30 ? `${30 - body.length} more characters needed` : `${body.length} / 2000 characters`}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-bold text-slate-700 mb-2 block">
                        When did you visit? <span className="text-slate-400 font-medium">(optional)</span>
                      </label>
                      <input
                        type="month"
                        value={visitDate}
                        onChange={(e) => setVisitDate(e.target.value)}
                        max={new Date().toISOString().slice(0, 7)}
                        className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-wellness-500 focus:ring-4 focus:ring-wellness-100 transition-all font-medium text-slate-900"
                      />
                    </div>

                    {error && (
                      <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm font-bold">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting || !rating || !authorName.trim() || !authorEmail.trim() || body.trim().length < 30}
                      className="w-full bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-base hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" /> Submitting…
                        </>
                      ) : (
                        <>Submit testimonial</>
                      )}
                    </button>

                    <p className="text-[11px] text-slate-400 font-medium text-center leading-relaxed">
                      Testimonials are reviewed by our team before going live. We don&apos;t publish your email or sell your data.
                    </p>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
