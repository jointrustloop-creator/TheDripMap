import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';
import { verifyClaimByToken } from '../../src/lib/claim-verify';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Verify Your Claim | TheDripMap',
  robots: { index: false, follow: false },
};

const SITE_URL = 'https://www.thedripmap.com';

interface VerifyClaimPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyClaimPage({ searchParams }: VerifyClaimPageProps) {
  const { token } = await searchParams;
  const outcome = await verifyClaimByToken(token);

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-32">
        {outcome.status === 'success' ? (
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl p-12 text-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-600">
              <CheckCircle2 size={40} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
              Your listing is now live! 🎉
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed mb-4 max-w-xl mx-auto">
              Your listing for <span className="font-bold text-slate-900">{outcome.clinicName}</span> is now live on TheDripMap. Patients can find you right now
              {outcome.providerSlug && (
                <>
                  {' '}at{' '}
                  <a
                    href={`${SITE_URL}/providers/${outcome.providerSlug}`}
                    className="text-wellness-700 font-bold underline decoration-wellness-300/40 decoration-2 underline-offset-4 hover:decoration-wellness-600 break-all"
                  >
                    thedripmap.com/providers/{outcome.providerSlug}
                  </a>
                </>
              )}
              .
            </p>
            <p className="text-base text-slate-500 leading-relaxed mb-10 max-w-xl mx-auto">
              Check your inbox: we just emailed you a private link to finish your listing. It is all quick taps, about two minutes, and the page is always yours to update.
            </p>
            {outcome.providerSlug && (
              <Link
                href={`/providers/${outcome.providerSlug}`}
                className="inline-flex items-center gap-3 bg-wellness-600 hover:bg-wellness-700 text-white px-10 py-5 rounded-2xl font-black text-lg transition-all shadow-xl"
              >
                View Your Live Listing <ArrowRight size={20} />
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl p-12 text-center">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-8 text-amber-600">
              <AlertCircle size={40} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
              {outcome.reason === 'missing_token' && 'Missing verification link'}
              {outcome.reason === 'not_found' && 'Invalid verification link'}
              {outcome.reason === 'already_verified' && 'Already verified'}
              {outcome.reason === 'expired' && 'Link expired'}
              {outcome.reason === 'server_error' && 'Something went wrong'}
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed mb-10 max-w-xl mx-auto">
              {outcome.reason === 'missing_token' && 'This page expects a verification token in the URL. Please use the link from your verification email.'}
              {outcome.reason === 'not_found' && 'We could not find a claim matching this link. The link may be incorrect or expired.'}
              {outcome.reason === 'already_verified' && 'This claim has already been verified. No further action is needed.'}
              {outcome.reason === 'expired' && 'This verification link is older than 7 days and is no longer valid. Submit a new claim request to get a fresh link.'}
              {outcome.reason === 'server_error' && 'Something went wrong on our end. Please try again in a few minutes or email info@thedripmap.com.'}
            </p>
            {outcome.reason === 'expired' && outcome.providerSlug ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href={`/providers/${outcome.providerSlug}?claim=1`}
                  className="inline-flex items-center gap-3 bg-wellness-600 hover:bg-wellness-700 text-white px-10 py-5 rounded-2xl font-black text-lg transition-all shadow-xl"
                >
                  Request a new verification link <ArrowRight size={20} />
                </Link>
                <Link
                  href="/search"
                  className="inline-flex items-center gap-3 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 px-8 py-5 rounded-2xl font-black text-base transition-all"
                >
                  Browse clinics
                </Link>
              </div>
            ) : (
              <Link
                href="/search"
                className="inline-flex items-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl"
              >
                Browse clinics <ArrowRight size={20} />
              </Link>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
