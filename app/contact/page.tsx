'use client';

import React, { useState } from 'react';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';
import { CheckCircle2, Send, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '../../src/lib/utils';

export default function ContactPage() {
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
      // For now, we'll simulate a submission to an API
      // If the user wants a real notification, we can connect this to Resend, SendGrid, or Formspree
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setIsSuccess(true);
      } else {
        throw new Error('Something went wrong. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#FDFDFB]">
        <Navbar />
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
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      
      <main className="max-w-3xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
            Get in <span className="text-wellness-600">Touch</span>
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed">
            Have questions about IV therapy or want to list your clinic? Fill out the form below and we&apos;ll get right back to you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl">
              <h3 className="text-xl font-black text-slate-900 mb-6 tracking-tight">Direct Contact</h3>
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Email Us</p>
                  <a href="mailto:thedripmap@gmail.com" className="text-lg font-bold text-wellness-600 hover:text-wellness-700 transition-all flex items-center gap-2">
                    thedripmap@gmail.com
                  </a>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Hours</p>
                  <p className="font-medium text-slate-600">Monday — Friday</p>
                  <p className="text-slate-500 text-sm">9:00 AM — 5:00 PM EST</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Social</p>
                  <div className="flex gap-4 mt-2">
                    <div className="w-8 h-8 bg-slate-50 rounded-lg border border-slate-100"></div>
                    <div className="w-8 h-8 bg-slate-50 rounded-lg border border-slate-100"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-wellness-600 p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              <h3 className="text-xl font-black mb-4 relative z-10">Add Your Clinic</h3>
              <p className="text-wellness-50 font-medium mb-6 relative z-10 leading-relaxed">
                Join our premium directory of IV therapy providers and reach more patients.
              </p>
              <a href="/for-clinics" className="inline-flex items-center gap-2 text-sm font-black bg-white text-wellness-600 px-6 py-3 rounded-xl hover:bg-wellness-50 transition-all relative z-10">
                Clinic Portal <ArrowRight size={16} />
              </a>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white p-8 md:p-12 rounded-[3rem] border border-slate-100 shadow-2xl relative overflow-hidden">
            {/* Decorative Background Element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-wellness-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
            
            <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tight flex items-center gap-3">
              <Send size={24} className="text-wellness-600" />
              Send a Message
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Full Name</label>
                  <input 
                    required
                    name="name"
                    type="text" 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-wellness-600/20 focus:border-wellness-600 transition-all font-medium text-slate-900 placeholder:text-slate-300" 
                    placeholder="John Doe" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Email Address</label>
                  <input 
                    required
                    name="email"
                    type="email" 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-wellness-600/20 focus:border-wellness-600 transition-all font-medium text-slate-900 placeholder:text-slate-300" 
                    placeholder="john@example.com" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Subject</label>
                <div className="relative">
                  <select 
                    required
                    name="subject"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-wellness-600/20 focus:border-wellness-600 transition-all appearance-none font-medium text-slate-900"
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Clinic Partnership">Clinic Partnership</option>
                    <option value="Technical Support">Technical Support</option>
                    <option value="Media Inquiry">Media Inquiry</option>
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Message</label>
                <textarea 
                  required
                  name="message"
                  rows={5} 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-wellness-600/20 focus:border-wellness-600 transition-all resize-none font-medium text-slate-900 placeholder:text-slate-300" 
                  placeholder="How can we help you?"
                ></textarea>
              </div>

              {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-sm font-bold">
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isSubmitting}
                className={cn(
                  "w-full bg-slate-900 text-white px-8 py-5 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3",
                  isSubmitting && "opacity-80 cursor-not-allowed"
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={24} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Message
                  </>
                )}
              </button>
              <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-6">
                Typically responds within 24 hours
              </p>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
