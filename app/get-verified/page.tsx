'use client';

import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Loader2, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { Logo } from '../../src/components/Logo';

function GetVerifiedInner() {
  const sp = useSearchParams();
  const providerId = (sp.get('id') || '').trim();
  const clinicName = (sp.get('name') || '').trim() || 'your clinic';

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !providerId || status === 'sending') return;
    setStatus('sending');
    setMessage('');
    try {
      const res = await fetch('/api/resend-finish-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, email: email.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus('sent');
        setMessage(json.message || 'If that email is on file, we just sent your private finish link to it.');
      } else {
        setStatus('error');
        setMessage(json.error || 'Something went wrong. Please try again or email info@thedripmap.com.');
      }
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please try again or email info@thedripmap.com.');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-wellness-50/40 to-white flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/" aria-label="TheDripMap home"><Logo /></Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          {status === 'sent' ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-wellness-100">
                <CheckCircle2 className="text-wellness-600" size={26} />
              </div>
              <h1 className="text-xl font-semibold text-slate-900 mb-2">Check your inbox</h1>
              <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
              <p className="text-xs text-slate-400 mt-4">
                The link only goes to the email already on file for this listing. Not seeing it? Check spam, or email{' '}
                <a className="text-wellness-600 underline" href="mailto:info@thedripmap.com">info@thedripmap.com</a>.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-5 flex items-center gap-2 text-wellness-700">
                <ShieldCheck size={20} />
                <span className="text-xs font-semibold uppercase tracking-wide">Get the Safety Verified badge</span>
              </div>
              <h1 className="text-xl font-semibold text-slate-900 mb-2">
                Finish your listing for {clinicName}
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed mb-5">
                Enter the email you used to claim this clinic and we will send your private link to finish your
                profile. Completing it earns the Safety Verified badge, which makes your listing stand out to
                patients searching your city.
              </p>

              <form onSubmit={submit} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@yourclinic.com"
                    className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2.5 text-sm text-slate-900 focus:border-wellness-500 focus:ring-2 focus:ring-wellness-500/30 outline-none"
                    autoComplete="email"
                  />
                </div>

                {status === 'error' && (
                  <p className="text-sm text-red-600">{message}</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'sending' || !providerId}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-wellness-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-wellness-700 disabled:opacity-60 transition-colors"
                >
                  {status === 'sending' ? (
                    <><Loader2 className="animate-spin" size={18} /> Sending</>
                  ) : (
                    <>Send my finish link <ArrowRight size={16} /></>
                  )}
                </button>
              </form>

              {!providerId && (
                <p className="text-xs text-amber-600 mt-3">
                  This page needs to be opened from your clinic listing. Email info@thedripmap.com and we will send
                  your link.
                </p>
              )}

              <p className="text-xs text-slate-400 mt-4 text-center">
                For your security, the link is only ever sent to the email already on file for this listing.
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function GetVerifiedPage() {
  return (
    <Suspense fallback={null}>
      <GetVerifiedInner />
    </Suspense>
  );
}
