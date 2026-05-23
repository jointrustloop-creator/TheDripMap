import React from 'react';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';
import { slugify } from '../../src/lib/data';

export const dynamic = 'force-dynamic';

const SITE_URL = 'https://www.thedripmap.com';

interface VerifyClaimPageProps {
  searchParams: Promise<{ token?: string }>;
}

type Outcome =
  | { status: 'success'; clinicName: string; providerSlug: string | null }
  | {
      status: 'error';
      reason: 'missing_token' | 'not_found' | 'already_verified' | 'expired' | 'server_error';
      providerSlug?: string | null;
      clinicName?: string;
    };

async function processClaim(token: string | undefined): Promise<Outcome> {
  if (!token) return { status: 'error', reason: 'missing_token' };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase env missing in verify-claim');
    return { status: 'error', reason: 'server_error' };
  }
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: claim, error: claimErr } = await supabase
    .from('claim_requests')
    .select('id, listing_id, email, owner_name, owner_phone, expires_at, status')
    .eq('token', token)
    .maybeSingle();

  if (claimErr) {
    console.error('verify-claim: claim lookup error', claimErr);
    return { status: 'error', reason: 'server_error' };
  }
  if (!claim) return { status: 'error', reason: 'not_found' };
  if (claim.status === 'verified') return { status: 'error', reason: 'already_verified' };
  if (new Date(claim.expires_at) < new Date()) return { status: 'error', reason: 'expired' };

  const { data: provider, error: provErr } = await supabase
    .from('providers')
    .select('id, name, slug, is_claimed')
    .eq('id', claim.listing_id)
    .maybeSingle();

  if (provErr || !provider) {
    console.error('verify-claim: provider lookup error', provErr);
    return { status: 'error', reason: 'server_error' };
  }

  if (provider.is_claimed) {
    return { status: 'error', reason: 'already_verified' };
  }

  const { error: updProvErr } = await supabase
    .from('providers')
    .update({ is_claimed: true })
    .eq('id', provider.id);

  if (updProvErr) {
    console.error('verify-claim: provider update error', updProvErr);
    return { status: 'error', reason: 'server_error' };
  }

  const { error: updClaimErr } = await supabase
    .from('claim_requests')
    .update({ status: 'verified', verified_at: new Date().toISOString() })
    .eq('id', claim.id);

  if (updClaimErr) {
    console.error('verify-claim: claim update error', updClaimErr);
  }

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const providerSlug = provider.slug || slugify(provider.name);
    const listingUrl = `${SITE_URL}/providers/${providerSlug}`;

    try {
      await resend.emails.send({
        from: 'TheDripMap <info@thedripmap.com>',
        to: claim.email,
        replyTo: 'info@thedripmap.com',
        subject: `Your claim for ${provider.name} is verified`,
        text: `Hi ${claim.owner_name || 'there'},

Your claim for ${provider.name} on TheDripMap has been verified.

Our team will review and activate your profile within 24 hours. You'll be able to upgrade to a Featured listing for full benefits soon after.

View your listing: ${listingUrl}

— The TheDripMap Team
`,
      });
    } catch (e) {
      console.error('verify-claim: owner confirmation email error', e);
    }

    try {
      await resend.emails.send({
        from: 'TheDripMap <info@thedripmap.com>',
        to: 'info@thedripmap.com',
        replyTo: claim.email,
        subject: `Claim VERIFIED: ${provider.name}`,
        text: `A clinic claim has been verified.

Clinic: ${provider.name}
Owner name: ${claim.owner_name || 'Not provided'}
Owner email: ${claim.email}
Owner phone: ${claim.owner_phone || 'Not provided'}

Listing ID: ${provider.id}
Public listing: ${listingUrl}

Next step: review and set is_featured = true if approved.
`,
      });
    } catch (e) {
      console.error('verify-claim: operator confirmation email error', e);
    }
  }

  return {
    status: 'success',
    clinicName: provider.name,
    providerSlug: provider.slug || slugify(provider.name),
  };
}

export default async function VerifyClaimPage({ searchParams }: VerifyClaimPageProps) {
  const { token } = await searchParams;
  const outcome = await processClaim(token);

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
              Claim verified!
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed mb-10 max-w-xl mx-auto">
              Your listing for <span className="font-bold text-slate-900">{outcome.clinicName}</span> is claimed. Our team will review and activate your profile within 24 hours.
            </p>
            {outcome.providerSlug && (
              <Link
                href={`/providers/${outcome.providerSlug}`}
                className="inline-flex items-center gap-3 bg-wellness-600 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-wellness-700 transition-all shadow-xl"
              >
                View your listing <ArrowRight size={20} />
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
            <Link
              href="/search"
              className="inline-flex items-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl"
            >
              Browse clinics <ArrowRight size={20} />
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
