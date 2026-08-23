'use client';

/**
 * ProviderHero (2026-08) — the ONE clinic page header, used by BOTH render
 * paths (claimed via DefinitiveListingLayout, unclaimed via
 * app/providers/[slug]/page.tsx) so the site never shows two different heros.
 *
 * Two states, same layout skeleton:
 *  - WITH image_url: a wide photo band (object-cover, capped ~320px desktop)
 *    with a legibility gradient and a subtle bottom fade into the page
 *    background. Plain <img loading="lazy"> because clinic domains are unknown
 *    to next/image remotePatterns; onError drops to the no-image treatment.
 *  - WITHOUT image (or on error): a deliberately designed panel — layered
 *    wellness-green gradient, soft glows, a large clinic monogram — never an
 *    empty grey box.
 *
 * Trust markers are the point of the header (verification is the
 * differentiator): Safety Verified badge (parent must gate it through
 * isSafetyVerified(), never the raw flag), the Regulator-inspected premises
 * line (parent computes premisesVerification()), the Transparency Score chip,
 * and the rating / review count.
 *
 * Content rules: no en or em dashes, no medical or outcome claims.
 */

import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, MapPin, Star } from 'lucide-react';
import { TransparencyChip } from './TransparencyChip';

// A usable hero image is a real clinic asset, not a scraped stock placeholder.
// Stock URLs fall through to the designed no-image treatment.
function isUsableHeroImage(url: string | null | undefined): url is string {
  return !!url && !/unsplash\.com|picsum\.photos|placeholder|loremflickr|pravatar/i.test(url);
}

export interface ProviderHeroPremises {
  register: string;
  outcome: string | null;
  url: string | null;
  checkedAt: string | null;
}

export interface ProviderHeroProps {
  displayName: string;
  city: string;
  stateCode: string;
  /** providers.image_url (enriched imageUrl). Null or stock => designed panel. */
  imageUrl: string | null;
  /** Precomputed server side; carries the "(photo from the clinic's website)" attribution when decision_drivers.image_source exists. */
  imageAlt: string;
  initials: string;
  /** MUST come from isSafetyVerified() in src/lib/safety.ts, never the raw column. */
  safetyVerified: boolean;
  /** Result of premisesVerification() from src/lib/safety.ts (plain object, serializable). */
  premises: ProviderHeroPremises | null;
  /** Stored providers.transparency_score. Chip renders nothing when null. */
  transparencyScore: number | null;
  rating: number;
  reviewCount: number;
  /** e.g. "Google reviews", "patient testimonials", "reviews" */
  ratingLabel?: string;
  isClaimed?: boolean;
  statusLabel?: string | null;
  statusOpen?: boolean;
  priceRange?: string | null;
  /** Page background the hero fades into (claimed page is cream, unclaimed near-white). */
  pageBackground?: string;
  /** Extra bottom padding inside the hero (claimed layout overlaps the gallery onto it). */
  extraBottomPadding?: boolean;
}

export function ProviderHero({
  displayName,
  city,
  stateCode,
  imageUrl,
  imageAlt,
  initials,
  safetyVerified,
  premises,
  transparencyScore,
  rating,
  reviewCount,
  ratingLabel = 'reviews',
  isClaimed = false,
  statusLabel = null,
  statusOpen = false,
  priceRange = null,
  pageBackground = '#FDFDFB',
  extraBottomPadding = false,
}: ProviderHeroProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const hasImage = isUsableHeroImage(imageUrl) && !imageFailed;

  const content = (
    <div
      className={`relative z-[2] max-w-7xl mx-auto px-6 w-full flex flex-col justify-end pt-16 ${
        extraBottomPadding ? 'pb-12 md:pb-14' : 'pb-8 md:pb-10'
      }`}
    >
      {/* Trust markers row: verification first, always visually prominent */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {safetyVerified && (
          <a
            href="#safety-verified"
            title="Completed TheDripMap's safety questionnaire, reviewed by our team. Tap to see the breakdown."
            className="inline-flex items-center gap-1.5 bg-gradient-to-b from-amber-200 to-amber-300 text-amber-950 text-[11px] font-black uppercase tracking-[0.14em] px-3 py-1.5 rounded-full shadow-lg ring-1 ring-white/40"
          >
            <ShieldCheck size={13} /> Safety Verified
          </a>
        )}
        {premises && (
          premises.url ? (
            <a
              href={premises.url}
              target="_blank"
              rel="noopener noreferrer"
              title={`This location appears on ${premises.register}${premises.checkedAt ? `, checked ${premises.checkedAt}` : ''}. The inspection was carried out and published by the college, not by TheDripMap.`}
              className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1.5 rounded-full ring-1 ring-white/25 transition-colors"
            >
              <ShieldCheck size={13} className="text-emerald-300" /> Regulator-inspected premises
            </a>
          ) : (
            <span
              title={`This location appears on ${premises.register}${premises.checkedAt ? `, checked ${premises.checkedAt}` : ''}.`}
              className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1.5 rounded-full ring-1 ring-white/25"
            >
              <ShieldCheck size={13} className="text-emerald-300" /> Regulator-inspected premises
            </span>
          )
        )}
        {isClaimed && (
          <span
            title="Ownership confirmed by the clinic"
            className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white/80 text-[11px] font-bold px-3 py-1.5 rounded-full ring-1 ring-white/15"
          >
            <CheckCircle2 size={13} /> Claimed
          </span>
        )}
      </div>

      <div className="flex items-end gap-4 md:gap-5">
        {/* Monogram tile leads the no-image state; hidden when a photo carries the header */}
        {!hasImage && (
          <div
            aria-hidden
            className="hidden sm:flex flex-none w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-white/10 backdrop-blur-sm ring-1 ring-white/25 shadow-2xl items-center justify-center"
          >
            <span className="text-3xl md:text-4xl font-black text-white/95 tracking-tight">{initials}</span>
          </div>
        )}
        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-[1.05] text-balance min-w-0">
          {displayName}
        </h1>
      </div>

      {/* Key facts row */}
      <div className="flex flex-wrap items-center gap-2 mt-4">
        {rating > 0 && reviewCount > 0 && (
          <span className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-sm text-slate-900 px-3 py-1.5 rounded-full text-[13px] font-bold shadow-md">
            <Star size={13} fill="currentColor" className="text-amber-500" />
            {rating.toFixed(1)} · {reviewCount} {ratingLabel}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-sm text-slate-900 px-3 py-1.5 rounded-full text-[13px] font-bold shadow-md">
          <MapPin size={13} className="text-wellness-600" />
          {city}, {stateCode}
        </span>
        <TransparencyChip
          score={transparencyScore}
          className="!bg-white/95 !text-slate-700 !px-3 !py-1.5 !text-[13px] shadow-md backdrop-blur-sm"
        />
        {statusLabel && (
          <span className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-sm text-slate-900 px-3 py-1.5 rounded-full text-[13px] font-bold shadow-md">
            <span className={statusOpen ? 'text-emerald-500' : 'text-amber-500'}>●</span>
            {statusLabel}
          </span>
        )}
        {priceRange && (
          <span className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-sm text-slate-900 px-3 py-1.5 rounded-full text-[13px] font-bold shadow-md">
            <span className="text-wellness-600">$</span>
            {priceRange}
          </span>
        )}
      </div>
    </div>
  );

  if (hasImage) {
    return (
      <section className="relative w-full overflow-hidden flex min-h-[240px] md:h-[320px]">
        {/* Plain <img>: clinic domains are unknown to next/image remotePatterns.
            Lazy loaded; a broken URL falls back to the designed panel below. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl as string}
          alt={imageAlt}
          loading="lazy"
          onError={() => setImageFailed(true)}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Legibility scrim for the overlaid name and trust markers */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-slate-950/10 pointer-events-none" />
        {/* Subtle fade into the page background */}
        <div
          className="absolute inset-x-0 bottom-0 h-10 pointer-events-none"
          style={{ background: `linear-gradient(to top, ${pageBackground}, transparent)`, opacity: 0.35 }}
        />
        {content}
      </section>
    );
  }

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-br from-wellness-950 via-wellness-800 to-emerald-950">
      {/* Layered glows for depth in the brand palette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(70% 90% at 12% -10%, rgba(123,171,151,0.35), transparent 60%)' }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(75% 95% at 92% -15%, rgba(52,211,153,0.18), transparent 58%)' }}
      />
      {/* Fine dot texture */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }}
      />
      {/* Oversized monogram watermark, right side */}
      <div
        aria-hidden
        className="absolute right-[-0.05em] bottom-[-0.28em] text-[11rem] md:text-[15rem] font-black leading-none text-white/[0.06] select-none pointer-events-none tracking-tighter"
      >
        {initials}
      </div>
      {/* Bottom fade into the page background */}
      <div
        className="absolute inset-x-0 bottom-0 h-10 pointer-events-none"
        style={{ background: `linear-gradient(to top, ${pageBackground}, transparent)`, opacity: 0.25 }}
      />
      <div className="min-h-[220px] md:min-h-[280px] flex">{content}</div>
    </section>
  );
}

export default ProviderHero;
