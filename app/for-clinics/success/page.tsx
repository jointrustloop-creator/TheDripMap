'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, Mail, Home } from 'lucide-react';
import { Logo } from '../../../src/components/Logo';

export default function SuccessPage() {
  const [email, setEmail] = useState<string | null>(null);
  // "sent" only when the server confirmed the verification email went out.
  // Anything else gets the honest version: we have the request and a person
  // follows up. (Until 2026-10-06 this page always said "we just emailed you",
  // even when nothing had been sent.)
  // null until the query string is read, so the first paint never claims an
  // email went out.
  const [sent, setSent] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      setEmail(localStorage.getItem('operator_email'));
    } catch { /* storage blocked: the page still reads fine without it */ }
    const verify = new URLSearchParams(window.location.search).get('verify');
    setSent(verify === 'sent');
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFDFB] flex flex-col">
      <header className="px-6 py-4 border-b border-slate-50 bg-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>
          <Link href="/" className="text-xs font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest flex items-center gap-2">
            <Home size={14} /> Back Home
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-xl w-full text-center">
          <div className="w-24 h-24 bg-wellness-50 text-wellness-600 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-xl shadow-wellness-100/20">
            <CheckCircle2 size={48} />
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
            {sent === null ? 'Thanks for claiming your clinic' : sent ? 'Check your inbox' : 'We have your claim'}
          </h1>

          {sent !== null && (
          <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm mb-10 text-left">
            <p className="text-lg text-slate-600 leading-relaxed mb-6">
              {sent
                ? 'We just emailed you a link to confirm you own this clinic. Click it to verify, and we will send your private link to finish the listing yourself. It takes about two minutes and goes live the instant you save.'
                : 'Your details reached us, but we could not send your verification link automatically. A person on our team will email you within one business day to finish the claim. There is nothing more you need to do.'}
            </p>

            {email && (
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-100 text-slate-400 shadow-sm">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-0.5">{sent ? 'Verification link sent to' : 'We will write to'}</p>
                  <p className="font-bold text-slate-900">{email}</p>
                </div>
              </div>
            )}

            <p className="text-slate-500 mt-6 text-sm">
              {sent
                ? 'No email after a few minutes? Check your spam folder, or write to info@thedripmap.com and we will help.'
                : 'Want it sooner? Write to info@thedripmap.com from the same address.'}
            </p>
          </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/"
              className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-slate-900 text-white font-black hover:bg-slate-800 transition-all shadow-lg"
            >
              Return Home
            </Link>
            <Link 
              href="/dashboard"
              className="w-full sm:w-auto px-10 py-4 rounded-2xl border-2 border-slate-100 text-slate-600 font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              View My Status <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-8 px-6 text-center border-t border-slate-50">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">© 2026 TheDripMap</p>
      </footer>
    </div>
  );
}
