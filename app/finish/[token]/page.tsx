import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { verifyManageToken } from '../../../src/lib/manage-token';
import { FinishListingForm } from './FinishListingForm';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Finish your listing | TheDripMap',
  robots: { index: false, follow: false },
};

const SITE_URL = 'https://www.thedripmap.com';

function InvalidLink() {
  return (
    <div className="min-h-screen bg-[#f8f5ee] flex items-center justify-center px-6">
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl p-12 text-center max-w-lg">
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-600">
          <AlertCircle size={32} />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">This link is not valid</h1>
        <p className="text-slate-500 leading-relaxed mb-8">
          This page opens from the private link in your verification email. If your link is not working, email
          info@thedripmap.com and we will send you a fresh one.
        </p>
        <Link href="/search" className="inline-flex items-center gap-2 bg-slate-900 text-white px-7 py-3.5 rounded-xl font-black text-sm hover:bg-slate-800 transition-all">
          Browse clinics
        </Link>
      </div>
    </div>
  );
}

interface FinishPageProps {
  params: Promise<{ token: string }>;
}

export default async function FinishPage({ params }: FinishPageProps) {
  const { token } = await params;
  const providerId = verifyManageToken(token);
  if (!providerId) return <InvalidLink />;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return <InvalidLink />;
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: p } = await supabase
    .from('providers')
    .select('id, name, slug, city, image_url, photos, decision_drivers')
    .eq('id', providerId)
    .maybeSingle();
  if (!p) return <InvalidLink />;

  const dd = (p.decision_drivers && typeof p.decision_drivers === 'object')
    ? (p.decision_drivers as Record<string, unknown>)
    : {};
  const prefill = (dd.manage && typeof dd.manage === 'object') ? (dd.manage as Record<string, unknown>) : null;

  return (
    <FinishListingForm
      token={token}
      clinicName={p.name}
      city={p.city || ''}
      listingUrl={`${SITE_URL}/providers/${p.slug}`}
      hasLogo={!!p.image_url}
      photoCount={Array.isArray(p.photos) ? p.photos.length : 0}
      prefill={prefill}
    />
  );
}
