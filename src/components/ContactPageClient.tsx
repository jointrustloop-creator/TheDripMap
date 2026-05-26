'use client';

import React, { useState } from 'react';
import { CheckCircle2, Send, Loader2, ArrowRight, Instagram } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface ContactPageClientProps {
  providerCount: number;
}

export function ContactPageClient({ providerCount }: ContactPageClientProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setIsSuccess(true);
      } else {
        throw new Error(result.error || result.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-32 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-8">
          <CheckCircle2 size={40} />
        </div>
        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Message Sent!</h1>
        <p className="text-xl text-slate-500 mb-10 max-w-md">
          Thank you for reaching out. A member of the TheDripMap team will get back to you within 24 hours.
        </p>
        <button
          onClick={() => setIsSuccess(false)}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all"
        >
          Send Another Message
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tighter leading-[0.9]">
          Let&apos;s get <span className="text-wellness-600">started.</span>
        </h1>
        <p className="text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto">
          Whether you&apos;re a patient seeking care or a clinic looking to join our network, we&apos;re here to help you navigate the world of IV therapy.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: Contact Info & Action */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-4 space-y-6"
        >
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Direct Contact</h3>

            <div className="space-y-10">
              <div className="group">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Email Address</p>
                <a
                  href="mailto:info@thedripmap.com"
                  className="text-xl font-bold text-slate-900 hover:text-wellness-600 transition-colors break-words block"
                >
                  info@thedripmap.com
                </a>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Office Hours</p>
                <div className="space-y-1">
                  <p className="font-bold text-slate-900">Monday — Friday</p>
                  <p className="text-slate-500 text-sm font-medium">9:00 AM — 5:00 PM EST</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Follow Along</p>
                <a
                  href="https://www.instagram.com/thedripmap/"
                  target="_blank"
                  rel="me noopener noreferrer"
                  aria-label="TheDripMap on Instagram (@thedripmap)"
                  title="Follow @thedripmap on Instagram"
                  className="inline-flex items-center gap-3 px-4 py-2.5 bg-slate-50 hover:bg-wellness-50 border border-slate-100 hover:border-wellness-200 rounded-xl text-slate-600 hover:text-wellness-700 transition-all group"
                >
                  <Instagram size={18} strokeWidth={2.25} />
                  <span className="text-sm font-bold">@thedripmap</span>
                </a>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-wellness-600/20 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <h3 className="text-xl font-black mb-4 relative z-10">Clinic Partnerships</h3>
            <p className="text-slate-400 font-medium mb-8 relative z-10 leading-relaxed text-sm">
              Ready to scale your IV hydration clinic? Join {providerCount}+ providers already on TheDripMap.
            </p>
            <a
              href="/for-clinics"
              className="inline-flex items-center gap-3 text-sm font-bold bg-wellness-600 text-white px-8 py-4 rounded-2xl hover:bg-wellness-500 transition-all relative z-10 w-full justify-center group"
            >
              Get Started <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </motion.div>

        {/* Right Column: Contact Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="lg:col-span-8 bg-white p-6 md:p-14 rounded-[3.5rem] border border-slate-100 shadow-[0_30px_70px_rgba(0,0,0,0.08)] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-wellness-50 rounded-full -mr-32 -mt-32 blur-[100px] opacity-60" />

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-wellness-50 text-wellness-600 rounded-2xl flex items-center justify-center">
                <Send size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Drop us a line</h3>
                <p className="text-slate-400 font-medium text-sm">We typically respond within a few hours.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700 ml-1">Your Name</label>
                  <input
                    required
                    name="name"
                    type="text"
                    className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-wellness-500 focus:ring-4 focus:ring-wellness-100 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                    placeholder="Your full name"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                  <input
                    required
                    name="email"
                    type="email"
                    className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-wellness-500 focus:ring-4 focus:ring-wellness-100 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                    placeholder="you@email.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700 ml-1">Phone <span className="text-slate-400 font-medium">(optional)</span></label>
                  <input
                    name="phone"
                    type="tel"
                    className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-wellness-500 focus:ring-4 focus:ring-wellness-100 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700 ml-1">I&apos;m interested in...</label>
                  <div className="relative">
                    <select
                      required
                      name="subject"
                      className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-wellness-500 focus:ring-4 focus:ring-wellness-100 transition-all appearance-none font-medium text-slate-900 cursor-pointer pr-12"
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Clinic Listing">Listing my Clinic</option>
                      <option value="Partnership">Partnership Opportunities</option>
                      <option value="Press">Press & Media</option>
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 ml-1">Your Message</label>
                <textarea
                  required
                  name="message"
                  rows={5}
                  className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-wellness-500 focus:ring-4 focus:ring-wellness-100 transition-all resize-none font-medium text-slate-900 placeholder:text-slate-400"
                  placeholder="Tell us what's on your mind..."
                ></textarea>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-5 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-sm font-bold flex items-center gap-3"
                >
                  <div className="w-1.5 h-1.5 bg-rose-600 rounded-full animate-pulse" />
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "w-full bg-slate-900 text-white px-10 py-6 rounded-[2rem] font-black text-xl hover:bg-slate-800 transition-all shadow-[0_20px_40px_rgba(0,0,0,0.1)] flex items-center justify-center gap-4 group",
                  isSubmitting && "opacity-80 cursor-not-allowed"
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={24} className="animate-spin text-wellness-400" />
                    Processing...
                  </>
                ) : (
                  <>
                    Send Message
                    <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
