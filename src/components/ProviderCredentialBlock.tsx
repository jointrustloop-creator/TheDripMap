import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, ShieldAlert, Check, Stethoscope } from 'lucide-react';
import { Provider, OperatorProfile } from '../types';
import { cn } from '../lib/utils';

/*
 * Trust & Credentials block — the #1 trust signal patients want
 * (see scripts/product-research.md). Combines the "Verified WHO",
 * the credential checklist, and the safety badge into one section.
 *
 * Reads clinic-provided data + TheDripMap-verified flags from the
 * operator profile's profile_data. Verified flags are admin-set — a
 * clinic can't tick its own boxes, which is what makes the badge
 * trustworthy (the Psychology Today verification model).
 */

interface CredentialData {
  medicalDirectorName?: string;
  medicalDirectorCredentials?: string;
  licenseModel?: string;
  yearsInPractice?: number | string;
  practitionerPhotoUrl?: string;
  founderStatement?: string;
  administerType?: string;
  // TheDripMap-verified flags (admin-set)
  verifiedMedicalDirector?: boolean;
  verifiedClinician?: boolean;
  verifiedCompoundingPharmacy?: boolean;
  verifiedLiabilityInsurance?: boolean;
  verifiedStateBoard?: boolean;
}

// Derive the license model ("RN-led" etc.) from whatever we know.
function deriveLicenseModel(pd: CredentialData): string | null {
  if (pd.licenseModel) return pd.licenseModel;
  const hay = `${pd.administerType || ''} ${pd.medicalDirectorCredentials || ''}`.toLowerCase();
  if (/\bmd\b|physician|doctor|d\.o\.|\bdo\b/.test(hay)) return 'MD-led practice';
  if (/nurse practitioner|\bnp\b/.test(hay)) return 'NP-led practice';
  if (/registered nurse|\brn\b/.test(hay)) return 'RN-led practice';
  return null;
}

const CHECKLIST: { key: keyof CredentialData; label: string }[] = [
  { key: 'verifiedMedicalDirector',     label: 'Medical director verified' },
  { key: 'verifiedClinician',           label: 'RN / NP / MD administers every drip' },
  { key: 'verifiedCompoundingPharmacy', label: 'Bags from a licensed compounding pharmacy' },
  { key: 'verifiedLiabilityInsurance',  label: 'Liability insurance confirmed' },
  { key: 'verifiedStateBoard',          label: 'State board compliant' },
];

export function ProviderCredentialBlock({
  provider,
  profile,
}: {
  provider: Provider;
  profile?: OperatorProfile;
}) {
  const isClaimed = provider.is_featured === true || provider.is_claimed === true;
  const pd = ((profile?.profile_data as unknown) as CredentialData) || {};

  const licenseModel = deriveLicenseModel(pd);
  const directorName = pd.medicalDirectorName?.trim();
  const directorCreds = pd.medicalDirectorCredentials?.trim();
  const years = pd.yearsInPractice;
  const photo = pd.practitionerPhotoUrl?.trim();
  const statement = pd.founderStatement?.trim();

  const checks = CHECKLIST.map((c) => ({ ...c, done: pd[c.key] === true }));
  // The badge itself must read the canonical providers.safety_verified
  // column, not the legacy 5-flag checklist below (which predates the
  // 2026-06-19 questionnaire flow and is often unpopulated for clinics that
  // earned the badge the current way). The checklist stays as supplementary
  // detail; it no longer gates the header label.
  const allVerified = (provider as { safety_verified?: boolean }).safety_verified === true;

  // ── UNCLAIMED / UNVERIFIED state ──────────────────────────────────
  if (!isClaimed) {
    return (
      <section className="rounded-3xl border border-amber-200 bg-amber-50/60 p-6 md:p-8">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <ShieldAlert size={22} />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700 mb-1">
              Medical oversight not verified
            </div>
            <p className="text-sm text-amber-900/80 font-medium leading-relaxed max-w-xl">
              We haven&apos;t confirmed who administers care at {provider.name}. Ask the clinic to
              verify credentials before booking.
            </p>
          </div>
        </div>

        <ul className="space-y-2.5 mb-6">
          {CHECKLIST.map((c) => (
            <li key={c.key} className="flex items-center gap-3 text-sm text-slate-400">
              <span className="w-5 h-5 rounded-full border-2 border-slate-200 flex items-center justify-center shrink-0" />
              <span className="font-medium">{c.label}</span>
            </li>
          ))}
        </ul>

        <Link
          href="/for-clinics/setup"
          className="inline-flex items-center gap-2 text-sm font-black text-amber-700 hover:text-amber-800 transition-colors"
        >
          Own this clinic? Claim it to get verified →
        </Link>
      </section>
    );
  }

  // ── CLAIMED state ─────────────────────────────────────────────────
  return (
    <section className="rounded-3xl border border-wellness-100 bg-white shadow-[0_20px_45px_-25px_rgba(15,110,86,0.25)] overflow-hidden">
      {/* Header: safety badge + license model */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 md:px-8 py-5 border-b border-slate-100 bg-gradient-to-r from-wellness-50/70 to-white">
        <div className="inline-flex items-center gap-2">
          <div
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
              allVerified ? 'bg-wellness-600 text-white' : 'bg-amber-100 text-amber-700'
            )}
          >
            <ShieldCheck size={18} />
          </div>
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">
            {allVerified ? 'Safety Verified' : 'Verification in progress'}
          </span>
        </div>
        {licenseModel && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-wellness-50 text-wellness-700 border border-wellness-100 text-[11px] font-black uppercase tracking-wide">
            <Stethoscope size={12} />
            {licenseModel}
          </span>
        )}
      </div>

      {/* WHO block — practitioner photo + name + statement */}
      {(directorName || statement || photo) && (
        <div className="px-6 md:px-8 py-6 border-b border-slate-100 flex items-start gap-5">
          {photo ? (
            <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden shrink-0 bg-slate-100">
              <Image src={photo} alt={directorName || provider.name} fill className="object-cover" referrerPolicy="no-referrer" />
            </div>
          ) : directorName ? (
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-wellness-50 text-wellness-700 flex items-center justify-center font-black text-2xl shrink-0">
              {directorName.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
            </div>
          ) : null}
          <div className="min-w-0">
            {directorName && (
              <div className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                {directorName}{directorCreds ? `, ${directorCreds}` : ''}
              </div>
            )}
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Medical Director{years ? ` · ${years} years in practice` : ''}
            </div>
            {statement && (
              <p className="text-sm text-slate-600 leading-relaxed italic line-clamp-3">
                &ldquo;{statement}&rdquo;
              </p>
            )}
          </div>
        </div>
      )}

      {/* Credential checklist */}
      <div className="px-6 md:px-8 py-6">
        <ul className="space-y-3">
          {checks.map((c) => (
            <li
              key={c.key}
              className={cn(
                'flex items-center gap-3 text-sm',
                c.done ? 'text-slate-800 font-bold' : 'text-slate-400 font-medium'
              )}
            >
              <span
                className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center shrink-0',
                  c.done ? 'bg-wellness-600 text-white' : 'border-2 border-slate-200'
                )}
              >
                {c.done && <Check size={12} strokeWidth={3.5} />}
              </span>
              {c.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
