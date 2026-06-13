import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';
import { slugify } from '../../src/lib/data';
import { sendMail } from '../../src/lib/mailer';
import { autoEnrichProvider } from '../../src/lib/auto-enrich';
import { enqueueOnboarding, sendVerificationOnboardingEmail, SEND_5Q_WITH_CONFIRMATION } from '../../src/lib/onboarding';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Verify Your Claim | TheDripMap',
  robots: { index: false, follow: false },
};

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

  // Use SERVICE_ROLE_KEY here, not anon. verify-claim is a server component
  // (force-dynamic) and needs to bypass RLS to SELECT claim_requests by token
  // and UPDATE providers.is_claimed/is_featured. The service key never leaves
  // the server. Same pattern the daily-outreach cron uses.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase env missing in verify-claim, need NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY');
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
  if (new Date(claim.expires_at) < new Date()) {
    // Look up the provider so the expired-link page can offer a one-click
    // "Request a new verification link" deep-link back to their claim modal.
    const { data: prov } = await supabase
      .from('providers')
      .select('slug, name')
      .eq('id', claim.listing_id)
      .maybeSingle();
    return {
      status: 'error',
      reason: 'expired',
      providerSlug: prov?.slug || null,
      clinicName: prov?.name,
    };
  }

  const { data: provider, error: provErr } = await supabase
    .from('providers')
    .select('id, name, slug, city, is_claimed')
    .eq('id', claim.listing_id)
    .maybeSingle();

  if (provErr || !provider) {
    console.error('verify-claim: provider lookup error', provErr);
    return { status: 'error', reason: 'server_error' };
  }

  if (provider.is_claimed) {
    return { status: 'error', reason: 'already_verified' };
  }

  // Stage 1 tier-split (2026-06-01): claim flips is_claimed ONLY. is_featured
  // stays false until manual operator upgrade or a paid Featured purchase,
  // unblocking a real "claimed (free) vs Featured (paid)" distinction.
  const { error: updProvErr } = await supabase
    .from('providers')
    .update({ is_claimed: true })
    .eq('id', provider.id);

  if (updProvErr) {
    console.error('verify-claim: provider update error', updProvErr);
    return { status: 'error', reason: 'server_error' };
  }

  // claimed_at (2026-06-05): stamp the moment of claim so /search can sort
  // verified clinics newest-first. Only writes when null so hand-set
  // grandfathered dates from the 2026-06-05 backfill aren't overwritten if
  // an operator re-clicks the verify link. Non-fatal if it errors — the
  // claim itself already succeeded above.
  await supabase
    .from('providers')
    .update({ claimed_at: new Date().toISOString() })
    .eq('id', provider.id)
    .is('claimed_at', null);

  const { error: updClaimErr } = await supabase
    .from('claim_requests')
    .update({ status: 'verified', verified_at: new Date().toISOString() })
    .eq('id', claim.id);

  if (updClaimErr) {
    console.error('verify-claim: claim update error', updClaimErr);
  }

  // Fire-and-forget public-data enrichment. Runs in the background so the
  // owner's redirect + welcome email aren't blocked on Nominatim or a slow
  // clinic website. Errors are logged, never thrown. Daily report surfaces
  // success/failure the next morning.
  Promise.resolve()
    .then(() => autoEnrichProvider(provider.id))
    .then((res) => {
      if (!res.ok) {
        console.error('auto-enrich failed', { providerId: provider.id, errors: res.errors });
      } else {
        console.log('auto-enrich complete', {
          providerId: provider.id,
          filled: res.filled,
          skipped: res.skipped,
        });
      }
    })
    .catch((err) => {
      console.error('auto-enrich crashed', err);
    });

  const providerSlug = provider.slug || slugify(provider.name);
  const listingUrl = `${SITE_URL}/providers/${providerSlug}`;
  const onboardingProvider = {
    id: provider.id,
    name: provider.name,
    slug: providerSlug,
    city: provider.city,
  };

  // W1 onboarding. Default (2026-06-13, operator-approved): the verification
  // confirmation email IS the 5-questions onboarding email, so the owner gets
  // one touch at the moment of verify. sendVerificationOnboardingEmail records
  // the onboarding_requests row for W1 tracking, sends the combined email, and
  // marks it sent. Awaited but never throws, so a mail/queue failure cannot
  // break the owner's verification moment.
  let onboardingNote = '';
  if (SEND_5Q_WITH_CONFIRMATION) {
    const res = await sendVerificationOnboardingEmail(
      supabase,
      onboardingProvider,
      claim.email,
      claim.owner_name
    );
    onboardingNote = res.sent
      ? `The verification + 5-questions onboarding email was sent to ${claim.email}. Tracked in /admin/onboarding (status: sent), awaiting their reply.`
      : `Onboarding email was NOT sent (${res.error || 'unknown'}). Check /admin/onboarding.`;
    console.log('onboarding combined send', { providerId: provider.id, ...res });
  } else {
    // Legacy path: queue (gated) + bland confirmation email.
    Promise.resolve()
      .then(() => enqueueOnboarding(supabase, onboardingProvider, claim.email, claim.owner_name))
      .then((res) => console.log('onboarding enqueue', { providerId: provider.id, ...res }))
      .catch((err) => console.error('onboarding enqueue crashed', err));
    await sendMail({
      from: 'TheDripMap <info@thedripmap.com>',
      to: claim.email,
      replyTo: 'info@thedripmap.com',
      subject: `Your claim for ${provider.name} is now Claimed on TheDripMap`,
      text: `Hi ${claim.owner_name || 'there'},

Your claim for ${provider.name} on TheDripMap is now Claimed. Your free listing is live with your own logo, contact info, and map.

View your listing: ${listingUrl}

TheDripMap Team
`,
    });
    onboardingNote = 'Legacy confirmation sent; 5-questions onboarding is queued (gated).';
  }

  await sendMail({
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

${onboardingNote}

Status: claimed (free tier). Manually set is_featured=true if approved for a Featured upgrade.
`,
  });

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
              Check your inbox: we just emailed you five quick questions. Reply with a few details and your logo, and we will build out your full page for you, usually within two business days.
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
