'use client';
import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, ArrowRight, Building2, User, Mail, Info, Sparkles } from 'lucide-react';
import { Navbar } from '../../../src/components/Navbar';
import { Footer } from '../../../src/components/Footer';
import { supabase, isSupabaseConfigured } from '../../../src/lib/supabase';

function SetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clinicId = searchParams.get('clinicId');
  const clinicName = searchParams.get('clinicName');
  const clinicCity = searchParams.get('clinicCity');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    clinicName: clinicName || '',
    ownerName: '',
    email: '',
  });

  const canSubmit = !!formData.clinicName.trim() && !!formData.ownerName.trim() && !!formData.email.trim();

  // CANONICAL CLAIM PATH: claiming is intentionally light — it only has to
  // prove the clinic is yours and get your private link out to you. Everything
  // else (drips, prices, team, safety, photos, deals) is collected on /finish,
  // which publishes the instant you save. The rich multi-step intake that used
  // to live here duplicated /finish and made "claim in 2 minutes" untrue, so it
  // was removed 2026-06-15. handleSubmit still converges on /api/notify-operator
  // exactly as before (claim_requests row + verification email + orphan stub).
  const handleSubmit = async () => {
    if (!isSupabaseConfigured()) {
      alert('Listings are temporarily unavailable. Please email info@thedripmap.com and we will claim it for you.');
      return;
    }
    setIsSubmitting(true);
    try {
      // operator_profiles is a best-effort audit trail; never block the claim on it.
      const { error: pingError } = await supabase.from('operator_profiles').select('id').limit(1);
      if (pingError && pingError.code !== 'PGRST116') {
        console.warn('Database connection warning:', pingError);
      }
      const { data: { user } } = await supabase.auth.getUser();
      const profilePayload: Record<string, unknown> = {
        owner_name: formData.ownerName,
        email: formData.email,
        profile_data: { ...formData, user_id: user?.id || null },
      };
      if (clinicId) profilePayload.clinic_id = clinicId;
      if (user?.id) profilePayload.user_id = user.id;
      const { error: profErr } = await supabase.from('operator_profiles').insert([profilePayload]).select();
      if (profErr) {
        console.error('operator_profiles insert (non-fatal):', profErr.code, profErr.message);
      }

      // Canonical: create the claim_requests row + send the verification email.
      let claimSucceeded = false;
      try {
        let providerSlug: string | null = null;
        let providerCity: string | null = clinicCity || null;
        let providerState: string | null = null;
        let providerAddress: string | null = null;
        if (clinicId) {
          const { data: prov } = await supabase
            .from('providers')
            .select('slug, city, state, address')
            .eq('id', clinicId)
            .maybeSingle();
          if (prov) {
            providerSlug = prov.slug || null;
            providerCity = providerCity || prov.city || null;
            providerState = prov.state || null;
            providerAddress = prov.address || null;
          }
        }

        const notifyRes = await fetch('/api/notify-operator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clinicName: formData.clinicName,
            ownerName: formData.ownerName,
            email: formData.email,
            listingId: clinicId || null,
            providerSlug,
            address: providerAddress,
            city: providerCity,
            state: providerState,
          }),
        });
        claimSucceeded = notifyRes.ok;
        if (!notifyRes.ok) console.error('notify-operator returned non-OK:', notifyRes.status);
      } catch (notifyErr) {
        console.error('Failed to call /api/notify-operator:', notifyErr);
      }

      localStorage.setItem('operator_email', formData.email);
      router.push(`/for-clinics/success${claimSucceeded ? '?verify=sent' : ''}`);
    } catch (err: unknown) {
      console.error('Final registration error:', err);
      router.push('/for-clinics/success');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />

      <main className="max-w-2xl mx-auto px-6 py-20">
        {/* Claiming-an-existing-listing banner */}
        {clinicId && clinicName && (
          <div className="mb-8 bg-wellness-50 border border-wellness-200 p-4 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 bg-wellness-600 rounded-xl flex items-center justify-center text-white shrink-0">
              <Info size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-wellness-900">You are claiming: {clinicName}</p>
              <p className="text-xs text-wellness-700">in {clinicCity || 'your city'}</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-10">
          <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] py-1.5 px-3 rounded-full bg-wellness-50 text-wellness-700 border border-wellness-200 mb-5">
            <ShieldCheck size={14} /> Free forever · no credit card
          </span>
          <h1 className="text-[clamp(2rem,6vw,3rem)] font-black text-slate-900 tracking-tight leading-[1.02]">
            Claim your listing
          </h1>
          <p className="text-slate-500 mt-3 leading-relaxed">
            Two minutes. Confirm the clinic is yours and we send your private link, then you finish the listing yourself and it goes live the instant you save.
          </p>
        </div>

        {/* The claim form — ownership essentials only */}
        <div className="bg-white rounded-[1.75rem] border border-slate-200 shadow-[0_12px_34px_-22px_rgba(25,40,28,0.4)] p-6 md:p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Building2 size={16} /> Clinic name
            </label>
            <input
              type="text"
              value={formData.clinicName}
              onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
              placeholder="e.g. Wellness Drip NYC"
              readOnly={!!clinicId}
              className={`w-full p-4 rounded-2xl border border-slate-200 focus:border-wellness-600 focus:ring-2 focus:ring-wellness-100 outline-none transition-all ${clinicId ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <User size={16} /> Your name
            </label>
            <input
              type="text"
              value={formData.ownerName}
              onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
              placeholder="Full name"
              className="w-full p-4 rounded-2xl border border-slate-200 focus:border-wellness-600 focus:ring-2 focus:ring-wellness-100 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Mail size={16} /> Work email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="owner@clinic.com"
              className="w-full p-4 rounded-2xl border border-slate-200 focus:border-wellness-600 focus:ring-2 focus:ring-wellness-100 outline-none transition-all"
            />
            <p className="text-xs text-slate-400">We send your verification link here. Use the email on your clinic domain if you can, it verifies faster.</p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !canSubmit}
            className="w-full inline-flex items-center justify-center gap-2 bg-wellness-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-wellness-700 transition-all shadow-lg shadow-wellness-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Sending your link...' : (<>Claim my listing <ArrowRight size={18} /></>)}
          </button>
        </div>

        {/* What happens next — sets the expectation that the rich part is fast,
            self-serve, and instant (and previews the deals hook). */}
        <div className="mt-8">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 mb-4">What happens next</p>
          <div className="space-y-3">
            {[
              { Icon: Mail, head: 'Verify your email', sub: 'We send a quick confirmation link so only you can claim the clinic. Free, no account, no card.' },
              { Icon: ShieldCheck, head: 'Open your private link', sub: 'It is yours to keep. No password to remember, reopen it anytime.' },
              { Icon: Sparkles, head: 'Finish in 2 minutes, live on save', sub: 'Tap your drips, prices, team, photos, even a slow-day deal. It publishes to your page the instant you save.' },
            ].map((s, i) => (
              <div key={s.head} className="flex items-start gap-4 bg-white rounded-2xl border border-slate-200 p-5">
                <span className="flex-none w-9 h-9 rounded-xl bg-wellness-50 text-wellness-600 flex items-center justify-center font-black">{i + 1}</span>
                <div>
                  <div className="text-[15px] font-black text-slate-900 flex items-center gap-2"><s.Icon size={15} className="text-wellness-600" /> {s.head}</div>
                  <p className="text-[13px] text-slate-500 leading-relaxed mt-0.5">{s.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function OperatorSetupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FDFDFB] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-wellness-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SetupContent />
    </Suspense>
  );
}
