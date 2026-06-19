'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Star as StarIcon, Navigation, ShieldCheck, CheckCircle2, MapPin, Stethoscope, Phone, Calendar } from 'lucide-react';
import { Provider } from '../types';
import { slugify } from '../lib/data';
import { cn } from '../lib/utils';
import { ResilientImage } from './ResilientImage';
import { getStatus } from '../lib/hours';
import { motion } from 'motion/react';
import { useClaimListing } from '../context/ClaimListingContext';
import { CompareToggle } from './CompareToggle';

interface ProviderCardProps {
  provider: Provider;
  className?: string;
}

// Per-clinic accent palette. Each entry is a COMPLETE literal class string so
// Tailwind's content scanner generates the utilities (never build these by
// fragment concatenation, or JIT won't see them). A clinic is mapped to a
// stable accent by hashing its slug/name, so the same listing always gets the
// same colour and three cards side-by-side never look alike.
const ACCENTS = [
  { cover: 'bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-600', monoBg: 'bg-teal-50', monoText: 'text-teal-700' },
  { cover: 'bg-gradient-to-br from-sky-500 via-cyan-500 to-teal-500', monoBg: 'bg-sky-50', monoText: 'text-sky-700' },
  { cover: 'bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600', monoBg: 'bg-indigo-50', monoText: 'text-indigo-700' },
  { cover: 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600', monoBg: 'bg-emerald-50', monoText: 'text-emerald-700' },
  { cover: 'bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600', monoBg: 'bg-violet-50', monoText: 'text-violet-700' },
  { cover: 'bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-600', monoBg: 'bg-cyan-50', monoText: 'text-cyan-700' },
  { cover: 'bg-gradient-to-br from-rose-500 via-pink-500 to-orange-500', monoBg: 'bg-rose-50', monoText: 'text-rose-700' },
  { cover: 'bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500', monoBg: 'bg-amber-50', monoText: 'text-amber-700' },
];

function accentFor(key: string) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (Math.imul(h, 31) + key.charCodeAt(i)) | 0;
  return ACCENTS[Math.abs(h) % ACCENTS.length];
}

// A real logo/photo, not a recycled stock image. Most unclaimed rows share a
// generic Unsplash photo, so those must NOT be treated as brand imagery.
function hasRealLogo(provider: Provider): boolean {
  const url = (provider.imageUrl || provider.image_url || '').toLowerCase();
  if (!url) return false;
  if (url.includes('unsplash.com') || url.includes('picsum') || url.includes('placeholder')) return false;
  return true;
}

// Conservative credential line — only assert what the data actually supports.
// Order matters: most specific first. Returns null when nothing is derivable.
function credentialOf(provider: Provider): string | null {
  const team = (provider.medical_team || []) as Array<{ name?: string; role?: string }>;
  const teamBlob = team.map((t) => `${t?.name || ''} ${t?.role || ''}`).join(' ');
  const hay = `${provider.description || ''} ${(provider.specialties || []).join(' ')} ${teamBlob}`;
  if (/medical director|\bMD\b|\bD\.?O\.?\b|physician/i.test(hay)) return 'Physician-led care';
  if (/nurse practitioner|\bNP\b/i.test(hay)) return 'NP on staff';
  if (/registered nurse|\bRN\b/i.test(hay)) return 'RN on staff';
  if (/naturopath|\bN\.?D\.?\b/i.test(hay)) return 'Naturopath-led';
  if (team.length > 0) return 'Medically supervised';
  return null;
}

const getInitials = (name: string) => {
  if (!name) return 'IV';
  let words = name
    .trim()
    .split(/\s+/)
    .filter((w) => /^[a-zA-Z]/.test(w));
  if (words.length > 1 && ['the', 'a', 'an'].includes(words[0].toLowerCase())) {
    words = words.slice(1);
  }
  const first = words[0]?.[0] || '';
  const second = words[1]?.[0] || '';
  return (first + second).toUpperCase().slice(0, 2) || 'IV';
};

export const ProviderCard = ({ provider, className }: ProviderCardProps) => {
  const { openClaimModal } = useClaimListing();
  const slug = provider.slug || slugify(provider.name);

  const isMobile = provider.mobile_service ||
                   provider.type === 'Mobile' ||
                   provider.specialties?.some(s => (s?.toString() || '').toLowerCase().includes('mobile'));

  // A clinic is "claimed/verified-looking" if EITHER is_claimed (free-tier or
  // grandfathered) OR is_featured (paid tier).
  const isClaimed = provider.is_claimed === true || provider.is_featured === true;
  // Safety Verified is a separate, stronger signal than Claimed. The shield is
  // reserved for it; Claimed gets only a subtle check.
  const isSafetyVerified = provider.safety_verified === true;

  const initials = getInitials(provider.name);

  // ----------------------------------------------------------------------------
  // CLAIMED / VERIFIED — premium, per-clinic-distinct card
  // ----------------------------------------------------------------------------
  if (isClaimed) {
    const accent = accentFor(slug || provider.name || 'iv');
    const logo = hasRealLogo(provider);
    const logoUrl = provider.imageUrl || provider.image_url || '';
    const rating = Number(provider.rating) || 0;
    const reviews = Number(provider.reviewCount) || 0;
    const credential = credentialOf(provider);
    const team = (provider.medical_team || []) as Array<{ name?: string; role?: string }>;
    const lead = team[0];
    const specs = (provider.specialties || []).filter(Boolean);
    const namedServices = (provider.services || []).map((s) => s?.name).filter(Boolean) as string[];
    const tags = specs.length ? specs : namedServices;
    const bookingUrl = (provider as { online_booking_url?: string }).online_booking_url;

    const mode: 'credential' | 'services' | 'reputation' | 'basic' =
      credential || lead ? 'credential'
      : tags.length ? 'services'
      : reviews > 0 ? 'reputation'
      : 'basic';

    return (
      <motion.div
        whileHover={{ y: -6 }}
        className={cn(
          'group relative flex flex-col h-full rounded-3xl bg-white border border-slate-200/70 overflow-hidden',
          'shadow-[0_18px_40px_-22px_rgba(15,23,42,0.28)] hover:shadow-[0_30px_60px_-25px_rgba(15,23,42,0.4)] transition-shadow duration-300',
          className
        )}
      >
        {/* Colour cover band — the per-clinic identity */}
        <div className={cn('relative h-24 shrink-0', accent.cover)}>
          <div
            className="absolute inset-0 opacity-50"
            style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.28) 1px, transparent 1px)', backgroundSize: '10px 10px' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
          {/* Rating chip + compare, stacked top-right so the left stays clear */}
          <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2">
            {rating > 0 && (
              <div className="inline-flex items-center gap-1 bg-white/95 backdrop-blur text-slate-900 text-xs font-black px-2.5 py-1 rounded-full shadow">
                <StarIcon size={12} className="text-amber-500" fill="currentColor" />
                {rating.toFixed(1)}
                {reviews > 0 && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-500">{reviews}</span>
                  </>
                )}
              </div>
            )}
            <CompareToggle provider={provider} />
          </div>
        </div>

        {/* Body */}
        <div className="relative px-5 pb-5 pt-0 flex flex-col flex-1">
          {/* Logo / monogram avatar overlapping the band */}
          <div className={cn(
            'relative -mt-9 mb-3 h-16 w-16 rounded-2xl ring-4 ring-white shadow-lg flex items-center justify-center overflow-hidden',
            logo ? 'bg-white' : accent.monoBg
          )}>
            {logo ? (
              <ResilientImage
                src={logoUrl}
                fallbackSrc=""
                alt={`${provider.name} logo`}
                width={64}
                height={64}
                unoptimized
                className="h-full w-full object-contain p-2"
              />
            ) : (
              <span className={cn('text-2xl font-black', accent.monoText)}>{initials}</span>
            )}
            {isSafetyVerified ? (
              <span title="Completed TheDripMap's safety questionnaire" className="absolute -bottom-1.5 -right-1.5 h-6 w-6 rounded-full bg-amber-400 ring-2 ring-white flex items-center justify-center text-amber-950 shadow">
                <ShieldCheck size={12} />
              </span>
            ) : (
              <span title="Ownership confirmed by the clinic" className="absolute -bottom-1.5 -right-1.5 h-5 w-5 rounded-full bg-slate-200 ring-2 ring-white flex items-center justify-center text-slate-500">
                <CheckCircle2 size={11} />
              </span>
            )}
          </div>

          {/* Name + location */}
          <Link href={`/providers/${slug}`}>
            <h3 className="text-lg font-black text-slate-900 leading-tight tracking-tight group-hover:text-wellness-700 transition-colors line-clamp-2">
              {provider.name}
            </h3>
          </Link>
          <div className="mt-1 flex items-center gap-1.5 text-[13px] font-semibold text-slate-500">
            <MapPin size={13} className="text-slate-400 shrink-0" />
            <span className="truncate">
              {provider.distance ? `${provider.distance} mi` : provider.city}
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0" />
            <span className="shrink-0">{isMobile ? 'Mobile' : 'Clinic'}</span>
          </div>

          <div className="my-3 h-px bg-slate-100" />

          {/* Adaptive body — each card leads with its strongest real asset */}
          <div className="min-h-[80px]">
            {mode === 'credential' && (
              <>
                {credential && (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-tight">
                    <Stethoscope size={12} /> {credential}
                  </span>
                )}
                {lead?.name && (
                  <p className={cn('text-[13px] font-bold text-slate-700', credential ? 'mt-2.5' : '')}>
                    Led by <span className="text-slate-900">{lead.name}</span>
                    {lead.role ? <span className="font-semibold text-slate-400"> · {lead.role}</span> : null}
                  </p>
                )}
              </>
            )}

            {mode === 'services' && (
              <>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Popular services</div>
                <div className="flex flex-wrap gap-1.5">
                  {tags.slice(0, 4).map((t, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-50 text-slate-700 border border-slate-200 truncate max-w-[150px]">
                      {t}
                    </span>
                  ))}
                  {tags.length > 4 && (
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-black text-wellness-700 bg-wellness-50 border border-wellness-100">
                      +{tags.length - 4}
                    </span>
                  )}
                </div>
              </>
            )}

            {mode === 'reputation' && (
              <>
                <div className="flex items-center text-amber-500">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <StarIcon key={i} size={14} fill="currentColor" />
                  ))}
                </div>
                <p className="mt-2 text-[13px] font-bold text-slate-700">
                  <span className="text-slate-900 font-black">{reviews} reviews</span> · {rating.toFixed(1)} rating
                </p>
                <p className="mt-0.5 text-[12px] font-semibold text-slate-400">
                  {provider.city}{provider.state ? `, ${provider.state}` : ''}
                </p>
              </>
            )}

            {mode === 'basic' && (
              <>
                {isSafetyVerified ? (
                  <span title="Completed TheDripMap's safety questionnaire" className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-tight">
                    <ShieldCheck size={12} /> Safety Verified
                  </span>
                ) : (
                  <span title="Ownership confirmed by the clinic" className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-tight">
                    <CheckCircle2 size={12} /> Claimed
                  </span>
                )}
                <p className="mt-2.5 text-[13px] font-semibold text-slate-500">
                  IV therapy in {provider.city}{provider.state ? `, ${provider.state}` : ''}
                </p>
              </>
            )}
          </div>

          {/* CTA row */}
          <div className="mt-auto pt-4 flex items-center gap-2">
            <Link
              href={`/providers/${slug}`}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-wellness-500 to-wellness-700 text-white font-black text-sm px-4 py-3 shadow-[0_14px_26px_-12px_rgba(13,148,136,0.7)] hover:-translate-y-0.5 transition-transform"
            >
              View Profile <ArrowRight size={15} />
            </Link>
            {bookingUrl && (
              <a
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-11 w-11 inline-flex items-center justify-center rounded-2xl border border-slate-200 text-slate-500 hover:text-wellness-700 hover:border-wellness-300 transition-colors"
                aria-label="Book online"
                title="Book online"
              >
                <Calendar size={17} />
              </a>
            )}
            {provider.phone && (
              <a
                href={`tel:${provider.phone}`}
                className="h-11 w-11 inline-flex items-center justify-center rounded-2xl border border-slate-200 text-slate-500 hover:text-wellness-700 hover:border-wellness-300 transition-colors"
                aria-label="Call"
                title="Call"
              >
                <Phone size={17} />
              </a>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // ----------------------------------------------------------------------------
  // UNCLAIMED — muted treatment that nudges the owner to claim (unchanged)
  // ----------------------------------------------------------------------------
  const status = getStatus(provider.hours);
  const hasOversight = (() => {
    const mt = (provider as { medical_team?: unknown[] }).medical_team;
    if (Array.isArray(mt) && mt.length > 0) return true;
    const hay = `${provider.name || ''} ${provider.description || ''} ${(provider.specialties || []).join(' ')}`;
    return /\bMD\b|\bDO\b|\bNP\b|\bRN\b|physician|nurse practitioner|naturopath|registered nurse/i.test(hay);
  })();

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={cn(
        'group relative rounded-[2rem] border overflow-hidden transition-all duration-500 flex flex-col h-full',
        'border-slate-200 shadow-sm bg-slate-50 grayscale-[0.5] opacity-90 hover:grayscale-0 hover:opacity-100',
        className
      )}
    >
      <div className="relative z-10 flex flex-col h-full">
        {/* Photo Area */}
        <div className="relative h-[140px] shrink-0">
          <div className="absolute inset-0 bg-slate-100 flex items-center justify-center text-slate-300 font-black text-5xl select-none">
            {initials}
          </div>
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <span className="bg-slate-400 text-white px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-[0.1em] shadow-sm">
              UNCLAIMED LISTING
            </span>
          </div>
          <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
            <CompareToggle provider={provider} />
          </div>
        </div>

        {/* Card Body */}
        <div className="px-5 pb-5 flex-1 flex flex-col">
          <div className="flex justify-between items-start gap-2 mb-3">
            <Link href={`/providers/${slug}`} className="flex-1">
              <h3 className="text-xl font-black leading-tight line-clamp-2 transition-colors text-slate-600">
                {provider.name}
              </h3>
            </Link>
          </div>

          {/* Status Row */}
          <div className="flex items-center gap-3 mb-4">
            {provider.hours && (
              <div className={cn(
                'text-[10px] font-black uppercase tracking-tight',
                status.isOpen ? 'text-emerald-600' : 'text-amber-600'
              )}>
                {status.isOpen ? '● OPEN NOW' : '● CLOSED'}
              </div>
            )}
            {provider.hours && <div className="w-1 h-1 bg-slate-200 rounded-full" />}
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
              <Navigation size={12} className="text-slate-400" />
              {provider.distance ? `${provider.distance} mi` : provider.city}
            </div>
            <div className="w-1 h-1 bg-slate-200 rounded-full" />
            {isMobile ? (
              <span className="text-wellness-600 text-[10px] font-black uppercase tracking-tight">🚐 Mobile</span>
            ) : (
              <span className="text-slate-500 text-[10px] font-black uppercase tracking-tight">🏥 Clinic</span>
            )}
          </div>

          {/* Medical oversight badge — safety signal patients care about most */}
          {hasOversight && (
            <div className="mb-4 -mt-1">
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight">
                <ShieldCheck size={11} /> MD / NP on staff
              </span>
            </div>
          )}

          {/* Service Pills */}
          <div className="flex flex-wrap gap-1.5 mt-auto pt-4 border-t border-slate-100/50">
            {(provider.services || provider.specialties || []).slice(0, 2).map((s, idx) => {
              const name = typeof s === 'string' ? s : (s?.name || '');
              if (!name) return null;
              return (
                <span key={idx} className="px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors bg-transparent text-slate-400 border-slate-200">
                  {name}
                </span>
              );
            })}
          </div>
        </div>

        {/* Card Footer */}
        <div className="px-5 py-5 mt-auto flex flex-col gap-3 bg-transparent">
          <div className="flex gap-2">
            <Link
              href={`/providers/${slug}`}
              className="flex-1 px-4 py-3 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-sm bg-white border-2 border-slate-100 text-slate-600 hover:border-slate-300"
            >
              View Profile <ArrowRight size={14} />
            </Link>
          </div>

          <button
            onClick={() => openClaimModal(provider)}
            className="text-teal-600 text-[10px] font-black uppercase tracking-[0.1em] hover:underline transition-all py-1"
          >
            Own this clinic? Claim Listing →
          </button>
        </div>
      </div>
    </motion.div>
  );
};
