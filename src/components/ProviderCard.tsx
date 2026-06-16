'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, Star as StarIcon, ShieldCheck, MapPin, Stethoscope, Phone, Calendar } from 'lucide-react';
import { Provider } from '../types';
import { slugify } from '../lib/data';
import { cn } from '../lib/utils';
import { ResilientImage } from './ResilientImage';
import { ClinicMedia } from './ClinicMedia';
import { ClinicTrustBadge } from './ClinicTrustBadge';
import { CompareToggle } from './CompareToggle';
import { useClaimListing } from '../context/ClaimListingContext';
import {
  realPhotoUrl,
  realLogoUrl,
  whoAdministersChip,
  isSafetyVerified,
  isClaimedState,
  bookingUrlOf,
} from '../lib/clinic-media';

interface ProviderCardProps {
  provider: Provider;
  className?: string;
}

// ONE calm, gradient-free, trust-forward card. Identical chrome for every
// clinic, no per-clinic colour. Everything below the media renders only when
// its real data exists, so an incomplete clinic is simply a shorter card with
// no empty gaps. The old ACCENTS hash-by-slug gradient system is gone.
export const ProviderCard = ({ provider, className }: ProviderCardProps) => {
  const { openClaimModal } = useClaimListing();
  const slug = provider.slug || slugify(provider.name);

  const rating = Number(provider.rating) || 0;
  const reviews = Number(provider.reviewCount) || 0;
  const verified = isSafetyVerified(provider);
  const claimed = isClaimedState(provider);
  const chip = whoAdministersChip(provider);

  // Services: real names only, up to four plus an overflow count.
  const specs = (provider.specialties || []).filter(Boolean) as string[];
  const namedServices = (provider.services || []).map((s) => s?.name).filter(Boolean) as string[];
  const tags = (specs.length ? specs : namedServices).filter(Boolean);

  const bookingUrl = bookingUrlOf(provider);
  const logoUrl = realLogoUrl(provider);
  const hasPhoto = !!realPhotoUrl(provider);
  const showLogoAvatar = hasPhoto && !!logoUrl; // avatar only overlaps a real photo
  const locationLine = [provider.city, provider.state].filter(Boolean).join(', ');

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={cn(
        'group relative flex flex-col h-full rounded-3xl bg-white border border-slate-200/70 overflow-hidden',
        'shadow-[0_14px_34px_-22px_rgba(15,23,42,0.25)] hover:shadow-[0_26px_54px_-26px_rgba(15,23,42,0.38)] transition-shadow duration-300',
        className
      )}
    >
      {/* MEDIA — fixed 3:2 so the grid never shifts on load */}
      <div className="relative shrink-0">
        <Link href={`/providers/${slug}`} aria-label={provider.name} className="block">
          <ClinicMedia
            provider={provider}
            className="aspect-[3/2]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        </Link>

        {/* Trust badge, top-left, only when its data exists */}
        <div className="absolute top-3 left-3 z-10">
          <ClinicTrustBadge provider={provider} />
        </div>

        {/* Rating pill, top-right, only when a rating exists */}
        {rating > 0 && (
          <div className="absolute top-3 right-3 z-10 inline-flex items-center gap-1 bg-white/95 backdrop-blur text-slate-900 text-xs font-black px-2.5 py-1 rounded-full shadow">
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

        {/* Compare — subtle ghost icon, off the rating and the badge */}
        <div className="absolute bottom-3 right-3 z-10">
          <CompareToggle provider={provider} />
        </div>

        {/* Overlapping logo avatar — ONLY when a real photo is the media */}
        {showLogoAvatar && (
          <span className="absolute -bottom-5 left-4 z-10 h-12 w-12 rounded-full bg-white ring-[3px] ring-white shadow-[0_6px_16px_-6px_rgba(25,36,28,0.5)] overflow-hidden">
            <ResilientImage
              src={logoUrl!}
              fallbackSrc=""
              alt={`${provider.name} logo`}
              width={48}
              height={48}
              unoptimized
              className="h-full w-full object-contain p-1.5"
            />
          </span>
        )}
      </div>

      {/* BODY — height adapts to content; nothing reserved for missing data */}
      <div className={cn('px-5 pb-5 flex flex-col flex-1', showLogoAvatar ? 'pt-8' : 'pt-4')}>
        <Link href={`/providers/${slug}`} className="block">
          <h3 className="text-lg font-black text-slate-900 leading-tight tracking-tight group-hover:text-wellness-700 transition-colors line-clamp-2">
            {provider.name}
            {verified && (
              <ShieldCheck
                size={15}
                strokeWidth={2.5}
                className="inline-block align-middle ml-1.5 text-[#0F6E56]"
                aria-label="Safety verified"
              />
            )}
          </h3>
        </Link>

        {locationLine && (
          <div className="mt-1 flex items-center gap-1.5 text-[13px] font-semibold text-slate-500">
            <MapPin size={13} className="text-slate-400 shrink-0" />
            <span className="truncate">{locationLine}</span>
          </div>
        )}

        {/* Trust chip — derived who-administers value, only when present */}
        {chip && (
          <div className="mt-3">
            <span className="inline-flex items-center gap-1.5 bg-wellness-50 text-wellness-700 border border-wellness-100 px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-tight">
              <Stethoscope size={12} /> {chip}
            </span>
          </div>
        )}

        {/* Services — up to four plus +N, only when present */}
        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.slice(0, 4).map((t, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-50 text-slate-700 border border-slate-200 truncate max-w-[150px]"
              >
                {t}
              </span>
            ))}
            {tags.length > 4 && (
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-black text-wellness-700 bg-wellness-50 border border-wellness-100">
                +{tags.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-4 flex items-center gap-2">
          <Link
            href={`/providers/${slug}`}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0F6E56] hover:bg-[#0A5742] text-white font-black text-sm px-4 py-3 transition-colors"
          >
            View profile <ArrowRight size={15} />
          </Link>
          {bookingUrl && (
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Book online"
              title="Book online"
              className="h-11 w-11 inline-flex items-center justify-center rounded-2xl border border-slate-200 text-slate-500 hover:text-[#0F6E56] hover:border-[#0F6E56]/40 transition-colors"
            >
              <Calendar size={17} />
            </a>
          )}
          {provider.phone && (
            <a
              href={`tel:${provider.phone}`}
              aria-label="Call"
              title="Call"
              className="h-11 w-11 inline-flex items-center justify-center rounded-2xl border border-slate-200 text-slate-500 hover:text-[#0F6E56] hover:border-[#0F6E56]/40 transition-colors"
            >
              <Phone size={17} />
            </a>
          )}
        </div>

        {/* Unclaimed-only, low-emphasis claim affordance (kept from the prior
            card so the claim funnel is not silently dropped; now subtle). */}
        {!claimed && (
          <button
            onClick={() => openClaimModal(provider)}
            className="mt-3 self-start text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 hover:text-[#0F6E56] transition-colors"
          >
            Own this clinic? Claim it
          </button>
        )}
      </div>
    </motion.div>
  );
};
