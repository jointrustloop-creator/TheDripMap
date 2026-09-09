import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { parseManageToken, secretsMatch } from '../../../src/lib/manage-token';
import { isAdminRequest } from '../../../src/lib/admin-auth';
import { assessCompleteness, type CompletenessRow } from '../../../src/lib/display-complete';
import { Logo } from '../../../src/components/Logo';
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
        <div className="flex justify-center mb-6"><Logo imgClassName="h-10" /></div>
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
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function FinishPage({ params, searchParams }: FinishPageProps) {
  const { token } = await params;
  const sp = (await searchParams) || {};
  const parsed = parseManageToken(token);
  if (!parsed) return <InvalidLink />;

  // OPERATOR MODE (2026-09-08). Many owners answered our questions by EMAIL and
  // those answers were never stored, so their listing looks unfinished and their
  // badge silently lapsed (the Signature Beauty case). This lets an operator
  // record what the owner already told us, through the exact same validated
  // write path the owner uses — no second source of truth to drift.
  //
  // Gated on a real admin session, never the query param alone, so an outsider
  // holding a manage link can never mark answers as operator-recorded. Two
  // things change in this mode: owner-engagement tracking is SKIPPED (an
  // operator open must never look like the owner returned, which would corrupt
  // the abandoned-claim reminder), and the saved answers carry provenance.
  const operatorMode = sp.src === 'operator' && (await isAdminRequest());

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return <InvalidLink />;
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: p } = await supabase
    .from('providers')
    .select('*')
    .eq('id', parsed.providerId)
    .maybeSingle();
  if (!p) return <InvalidLink />;

  const dd = (p.decision_drivers && typeof p.decision_drivers === 'object')
    ? (p.decision_drivers as Record<string, unknown>)
    : {};
  // Validate the URL secret against the durable manage_token column OR the
  // legacy decision_drivers copy, accepting either through the migration window.
  const colToken = typeof (p as { manage_token?: unknown }).manage_token === 'string' ? (p as { manage_token: string }).manage_token : null;
  const ddToken = typeof dd.manage_token === 'string' ? (dd.manage_token as string) : null;
  if (!secretsMatch(parsed.secret, colToken) && !secretsMatch(parsed.secret, ddToken)) {
    return <InvalidLink />;
  }

  // The owner clicked their private finish link and passed token validation, so
  // this is a genuine open of their onboarding page. Record it on the provider's
  // decision_drivers JSONB (merge-preserving, so it never clobbers the saved form
  // answers under `manage`). Fully swallowed: tracking must NEVER break the page.
  // Skipped in operator mode: an operator recording emailed answers is NOT the
  // owner returning, and counting it as such would wrongly silence the
  // abandoned-claim reminder and inflate owner-engagement reporting.
  if (!operatorMode) {
    try {
      const opens = typeof dd.finishOpenCount === 'number' ? (dd.finishOpenCount as number) : 0;
      const nowIso = new Date().toISOString();
      await supabase.from('providers').update({
        decision_drivers: {
          ...dd,
          finishOpenCount: opens + 1,
          lastFinishOpenAt: nowIso,
          ...(typeof dd.firstFinishOpenAt === 'string' ? {} : { firstFinishOpenAt: nowIso }),
        },
      }).eq('id', parsed.providerId);
    } catch { /* non-fatal */ }
  }

  const prefill = (dd.manage && typeof dd.manage === 'object') ? (dd.manage as Record<string, unknown>) : null;
  // Profile Strength from the ONE display-complete definition, computed on the
  // saved row (what patients actually see today), not on unsaved form state.
  const completeness = assessCompleteness(p as CompletenessRow);

  return (
    <FinishListingForm
      profileStrength={completeness.strength}
      profileMissing={completeness.missing.map((m) => ({ label: m.label, impact: m.impact }))}
      token={token}
      clinicName={p.name}
      city={p.city || ''}
      listingUrl={`${SITE_URL}/providers/${p.slug}`}
      hasLogo={!!p.image_url}
      photoCount={Array.isArray(p.photos) ? p.photos.length : 0}
      prefill={prefill}
      operatorMode={operatorMode}
    />
  );
}
