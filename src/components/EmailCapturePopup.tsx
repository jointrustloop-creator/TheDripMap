'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePathname } from 'next/navigation';
import { X, Mail, Bell, Loader2, CheckCircle2, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'tdm_subscribe_dismissed';
const SUBMITTED_KEY = 'tdm_subscribe_submitted';
const SESSION_SEEN_KEY = 'tdm_subscribe_seen_session';
const DISMISS_DAYS = 14;

// Don't show popup on these routes (already conversion-focused / friction)
const BLOCKED_PATHS = [
  '/contact',
  '/quiz',
  '/for-clinics',
  '/verify-claim',
  '/api',
];

export const EmailCapturePopup = () => {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Decide whether this user is eligible for the popup at all
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (BLOCKED_PATHS.some((p) => pathname?.startsWith(p))) return;
    if (localStorage.getItem(SUBMITTED_KEY)) return;

    const dismissedAt = localStorage.getItem(STORAGE_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - Number(dismissedAt);
      if (elapsed < DISMISS_DAYS * 24 * 60 * 60 * 1000) return;
    }

    if (sessionStorage.getItem(SESSION_SEEN_KEY)) return;

    let triggered = false;
    const trigger = () => {
      if (triggered) return;
      triggered = true;
      sessionStorage.setItem(SESSION_SEEN_KEY, '1');
      setIsVisible(true);
    };

    // Desktop: exit-intent (mouse leaves top of viewport)
    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) trigger();
    };

    // Mobile/all: 45-second timer fallback
    const timer = window.setTimeout(trigger, 45_000);

    // Scroll fallback: 60% of page
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0 && window.scrollY / max > 0.6) trigger();
    };

    document.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('scroll', onScroll);
    };
  }, [pathname]);

  const close = () => {
    setIsVisible(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSubmitting(true);
    setError(null);

    try {
      let city: string | null = null;
      try {
        const cached = sessionStorage.getItem('tdm_location');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.city) city = parsed.city;
        }
      } catch {}

      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          source: pathname || 'popup',
          city,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Could not subscribe. Try again.');
      }

      localStorage.setItem(SUBMITTED_KEY, '1');
      setIsSuccess(true);
      window.setTimeout(close, 2200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
            className="fixed inset-0 z-[201] flex items-end md:items-center justify-center p-0 md:p-6 pointer-events-none"
          >
            <div className="bg-white w-full md:max-w-md rounded-t-[2rem] md:rounded-[2rem] shadow-2xl pointer-events-auto overflow-hidden">
              {/* Gradient header strip */}
              <div className="relative bg-gradient-to-br from-wellness-500 to-wellness-700 px-8 pt-10 pb-8 text-white">
                <button
                  onClick={close}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white shrink-0"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-12 -mt-12 blur-2xl" />
                <div className="relative">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-5">
                    <Bell size={26} />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black tracking-tight mb-2 leading-tight">
                    Get alerted when new IV clinics open near you.
                  </h3>
                  <p className="text-white/85 text-sm font-medium leading-relaxed">
                    One short email a month. No spam, no upsells. Just new clinics, pricing changes, and treatment guides for your city.
                  </p>
                </div>
              </div>

              {isSuccess ? (
                <div className="px-8 py-10 text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 size={28} />
                  </div>
                  <p className="text-lg font-black text-slate-900 mb-1 tracking-tight">
                    You&apos;re in.
                  </p>
                  <p className="text-sm text-slate-500 font-medium">
                    Watch your inbox for the first update.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="px-8 py-7">
                  <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-2 block">
                    Your email
                  </label>
                  <div className="relative mb-4">
                    <Mail
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="w-full pl-11 pr-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-wellness-500 focus:ring-4 focus:ring-wellness-100 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                    />
                  </div>

                  {error && (
                    <div className="mb-4 px-3 py-2 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-xs font-bold">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || !email.trim()}
                    className="w-full bg-slate-900 text-white px-6 py-3.5 rounded-xl font-black text-sm hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Subscribing…
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} /> Notify me
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={close}
                    className="w-full text-center mt-3 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    No thanks
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
