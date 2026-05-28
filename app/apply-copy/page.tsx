import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';
import { slugify } from '../../src/lib/data';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Apply Your Copy | TheDripMap',
  robots: { index: false, follow: false },
};

const SITE_URL = 'https://www.thedripmap.com';

interface PageProps {
  searchParams: Promise<{ c?: string; t?: string }>;
}

type Outcome =
  | { status: 'success'; clinicName: string; slug: string | null }
  | { status: 'error'; reason: 'missing' | 'not_found' | 'invalid' | 'expired' | 'server_error' };

async function applyCopy(clinicId: string | undefined, token: string | undefined): Promise<Outcome> {
  if (!clinicId || !token) return { status: 'error', reason: 'missing' };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { status: 'error', reason: 'server_error' };
  const sb = createClient(url, key);

  const { data: prof, error } = await sb
    .from('operator_profiles')
    .select('id, clinic_id, profile_data')
    .eq('clinic_id', clinicId)
    .maybeSingle();
  if (error) return { status: 'error', reason: 'server_error' };
  if (!prof) return { status: 'error', reason: 'not_found' };

  const pd = (prof.profile_data || {}) as Record<string, unknown>;
  const pending = pd.pendingBrandVoice as { token?: string; oneLiner?: string; expiresAt?: number } | undefined;
  if (!pending || !pending.token || pending.token !== token) return { status: 'error', reason: 'invalid' };
  if (!pending.expiresAt || Date.now() > pending.expiresAt) {
    // Clear the stale token.
    const cleared: Record<string, unknown> = { ...pd };
    delete cleared.pendingBrandVoice;
    await sb.from('operator_profiles').update({ profile_data: cleared }).eq('id', prof.id);
    return { status: 'error', reason: 'expired' };
  }

  const newCopy = pending.oneLiner || '';
  const newPd: Record<string, unknown> = { ...pd, oneLiner: newCopy };
  delete newPd.pendingBrandVoice;
  const { error: updProf } = await sb.from('operator_profiles').update({ profile_data: newPd }).eq('id', prof.id);
  if (updProf) return { status: 'error', reason: 'server_error' };

  // Also update the public listing description on the provider row.
  const { data: provider } = await sb
    .from('providers')
    .select('name, slug')
    .eq('id', clinicId)
    .maybeSingle();
  await sb.from('providers').update({ description: newCopy }).eq('id', clinicId);

  return { status: 'success', clinicName: provider?.name || 'your clinic', slug: provider?.slug || (provider?.name ? slugify(provider.name) : null) };
}

export default async function ApplyCopyPage({ searchParams }: PageProps) {
  const { c, t } = await searchParams;
  const outcome = await applyCopy(c, t);

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-32">
        {outcome.status === 'success' ? (
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl p-12 text-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-600">
              <CheckCircle2 size={40} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Copy applied! 🎉</h1>
            <p className="text-lg text-slate-600 leading-relaxed mb-10 max-w-xl mx-auto">
              Your new listing description is now live on <span className="font-bold text-slate-900">{outcome.clinicName}</span>.
            </p>
            {outcome.slug && (
              <Link href={`/providers/${outcome.slug}`} className="inline-flex items-center gap-3 bg-wellness-600 hover:bg-wellness-700 text-white px-10 py-5 rounded-2xl font-black text-lg transition-all shadow-xl">
                View your live listing <ArrowRight size={20} />
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl p-12 text-center">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-8 text-amber-600">
              <AlertCircle size={40} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
              {outcome.reason === 'missing' && 'Missing link details'}
              {outcome.reason === 'not_found' && 'Listing not found'}
              {outcome.reason === 'invalid' && 'Invalid or used link'}
              {outcome.reason === 'expired' && 'Link expired'}
              {outcome.reason === 'server_error' && 'Something went wrong'}
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed mb-10 max-w-xl mx-auto">
              {outcome.reason === 'missing' && 'This page expects a confirmation link from your apply email. Please use the link we sent you.'}
              {outcome.reason === 'not_found' && 'We could not find the listing this link points to.'}
              {outcome.reason === 'invalid' && 'This confirmation link is invalid or has already been used. Generate your copy again to get a fresh apply link.'}
              {outcome.reason === 'expired' && 'This confirmation link is older than an hour and has expired. Generate your copy again to get a fresh apply link.'}
              {outcome.reason === 'server_error' && 'Something went wrong on our end. Please try again shortly or email info@thedripmap.com.'}
            </p>
            <Link href="/tools/brand-voice" className="inline-flex items-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl">
              Back to the copy generator <ArrowRight size={20} />
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
