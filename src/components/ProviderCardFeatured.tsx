'use client';

import React from 'react';
import Link from 'next/link';
import { ResilientImage } from './ResilientImage';
import {
  MapPin,
  ArrowRight,
  Phone,
  Clock,
  Globe,
  CheckCircle2,
  Stethoscope,
  Gift,
  Star as StarIcon,
} from 'lucide-react';
import { Provider, OperatorProfile } from '../types';
import { ServicePill } from './ServicePill';
import { slugify } from '../lib/data';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface ProviderCardFeaturedProps {
  provider: Provider & { matchScore?: number };
  operatorProfile?: OperatorProfile;
  rank?: number;
  isPrimary?: boolean;
}

// Pull a one-line "credential" / differentiator from amenities (preferred),
// then fall back to the first amenity, then to a derived credibility line.
function deriveCredentialLine(provider: Provider): string | null {
  const amenities = (provider.amenities || []) as string[];
  // Look for the most authoritative-sounding amenity first
  const mdLine = amenities.find((a) =>
    /medical director|md\b|doctor|m\.d\.|physician|md-led/i.test(a)
  );
  if (mdLine) return 'MD-led practice';
  const rnLine = amenities.find((a) => /registered nurse|rn\b|nurse practitioner/i.test(a));
  if (rnLine) return 'RN-led practice';
  // Anything mentioning a specific year established
  const yearLine = amenities.find((a) => /\bsince\s+\d{4}\b/i.test(a));
  if (yearLine) return yearLine;
  return null;
}

// Open-now check based on working_hours JSON. Returns "Open till HH:MM"
// or null if closed / no hours data. Robust to either {Mon: "9am-5pm"} or
// {Mon: ["09:00", "17:00"]} shapes.
function deriveOpenStatus(provider: Provider): string | null {
  const wh = (provider as { working_hours?: Record<string, string | string[]> }).working_hours || provider.hours;
  if (!wh || typeof wh !== 'object') return null;
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = dayNames[new Date().getDay()];
  const todayValue = wh[today as keyof typeof wh];
  if (!todayValue) return null;
  const raw = Array.isArray(todayValue) ? todayValue.join(' - ') : String(todayValue);
  if (/closed/i.test(raw)) return null;
  // Extract closing time (last hh:mm or hAM/PM mentioned)
  const closingMatch = raw.match(/(\d{1,2}:?\d{0,2}\s*[ap]?m?)(?=\s*$|\s*\)|\s*$)/i);
  return closingMatch ? `Open today till ${closingMatch[1].trim()}` : 'Open today';
}

// Pull top drips from provider.services if real prices exist, else null.
function deriveDripMenu(provider: Provider) {
  const services = provider.services;
  if (!services || services.length === 0) return null;
  // Only use entries that have a real price (not empty, not "Call for pricing" or "TBD")
  const realPriced = services.filter(
    (s) => s.price && !/call|tbd|contact|inquire/i.test(s.price)
  );
  if (realPriced.length === 0) return null;
  return realPriced.slice(0, 3);
}

const initialsOf = (name: string): string =>
  name.split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase() || 'IV';

// Trust an image URL only if it's not a known-bad source. Claimed clinics may
// have logos legitimately stored under /blog-images/, so trust those.
const hasRealClinicImage = (provider: Provider): boolean => {
  const url = provider.imageUrl || provider.image_url || '';
  if (!url) return false;
  if (url.includes('unsplash.com')) return false;
  // 2026-06-11 Path 1B: trust /blog-images/ URLs for both featured AND
  // claimed clinics (e.g. Insight Naturopathic's logo). The bulk-misassigned
  // blog/unsplash concern only applies to fully unclaimed listings.
  if (url.includes('/blog-images/') && !(provider.is_featured || provider.is_claimed)) return false;
  if (url.includes('placeholder') || url.includes('picsum')) return false;
  return true;
};

export const ProviderCardFeatured = ({
  provider,
  operatorProfile,
  isPrimary = true,
}: ProviderCardFeaturedProps) => {
  const slug = provider.slug || slugify(provider.name);
  const hasImage = hasRealClinicImage(provider);

  // Real, derived signals only — no fabricated prices.
  const credentialLine = deriveCredentialLine(provider);
  const openStatus = deriveOpenStatus(provider);
  const dripMenu = deriveDripMenu(provider);
  const firstTimeOffer = provider.special_offers?.[0];
  const bookingUrl = (provider as { online_booking_url?: string }).online_booking_url;
  const lead = provider.medical_team?.[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={cn(
        'group relative bg-white rounded-[2.5rem] overflow-hidden border transition-all duration-500',
        // 2026-06-11 Path 1B: claimed clinics (free-tier or featured) get
        // the premium teal shadow. Only fully unclaimed listings keep the
        // plain treatment, which the directory now filters out anyway.
        (provider.is_featured || provider.is_claimed)
          ? 'border-wellness-500/30 shadow-[0_30px_60px_-25px_rgba(20,184,166,0.25),0_8px_20px_-10px_rgba(15,23,42,0.1)] hover:shadow-[0_40px_80px_-25px_rgba(20,184,166,0.35),0_12px_25px_-10px_rgba(15,23,42,0.15)]'
          : 'border-slate-100 shadow-lg hover:shadow-xl'
      )}
    >
      <div className={cn('flex flex-col', isPrimary ? 'md:flex-row' : '')}>
        {/* Image Section */}
        <div
          className={cn(
            'relative overflow-hidden',
            isPrimary ? 'md:w-96 h-72 md:h-auto md:min-h-[420px]' : 'h-56'
          )}
        >
          <Link href={`/providers/${slug}`} className="block h-full relative">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-wellness-50/40" />
            {hasImage ? (
              <div className="absolute inset-0 flex items-center justify-center p-8 md:p-12">
                <ResilientImage
                  src={provider.imageUrl || provider.image_url!}
                  alt={`${provider.name} IV therapy clinic in ${provider.city}`}
                  width={400}
                  height={400}
                  className="max-h-[60%] max-w-[60%] w-auto h-auto object-contain group-hover:scale-105 transition-transform duration-700"
                  fallbackSrc=""
                />
              </div>
            ) : (
              // No real photo — render the gradient + clinic initials. Guaranteed
              // to always display something clean; no broken-image alt text.
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-5xl md:text-6xl font-black text-wellness-700/80 tracking-tight">
                  {initialsOf(provider.name)}
                </span>
              </div>
            )}
          </Link>

          {/* Bottom-left: optional distance chip */}
          {provider.distance !== undefined && (
            <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur-md text-slate-900 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg">
              {provider.distance} miles away
            </div>
          )}
        </div>

        {/* Content Section */}
        <div
          className={cn(
            'flex-1 flex flex-col',
            isPrimary ? 'p-8 md:p-10' : 'p-6'
          )}
        >
          {/* Title + Location + inline VERIFIED + rating */}
          <div className="mb-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <Link href={`/providers/${slug}`} className="block min-w-0 flex-1">
                <h3
                  className={cn(
                    'font-black text-slate-900 group-hover:text-wellness-700 transition-colors leading-[1.1] tracking-tight',
                    isPrimary ? 'text-2xl md:text-3xl' : 'text-xl'
                  )}
                >
                  <span>{provider.name}</span>
                  {/* 2026-06-11 Path 1B: "Verified" inline badge gates on the
                      CLAIM signal (is_claimed for free tier, is_featured for
                      grandfathered paid tier). It does NOT read safety_verified
                      and should not be confused with that separate flag. */}
                  {(provider.is_featured || provider.is_claimed) && (
                    <span className="inline-flex items-center gap-1 align-middle ml-2 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-black tracking-[0.18em] uppercase border border-emerald-100 whitespace-nowrap">
                      <CheckCircle2 size={10} className="text-emerald-600" />
                      Verified
                    </span>
                  )}
                </h3>
              </Link>
            </div>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-sm text-slate-500 font-semibold">
                <MapPin size={13} className="text-slate-400" />
                <span>
                  {provider.address && provider.address.length < 60
                    ? provider.address.split(',').slice(0, 2).join(',')
                    : `${provider.city}${provider.state ? `, ${provider.state}` : ''}`}
                </span>
              </div>
              {/* 2026-06-11 Path 1B: show rating + reviewCount whenever the
                  clinic is claimed (free tier or featured). Rating comes from
                  the live Google data refresh; gating it on is_featured alone
                  hid real ratings for free-tier claims. */}
              {(provider.is_featured || provider.is_claimed) && provider.rating > 0 && (
                <div className="flex items-center gap-1.5 text-sm font-black text-slate-900">
                  <StarIcon size={14} className="text-amber-500" fill="currentColor" />
                  {provider.rating}
                  <span className="text-slate-300 font-bold">·</span>
                  <span className="text-slate-500 font-bold">{provider.reviewCount || 0}</span>
                </div>
              )}
            </div>
          </div>

          {/* Credential + Open status strip */}
          {(credentialLine || openStatus) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-5 pb-5 border-b border-slate-100">
              {credentialLine && (
                <div className="flex items-center gap-1.5 text-xs font-black text-wellness-700">
                  <Stethoscope size={13} />
                  {credentialLine}
                </div>
              )}
              {openStatus && (
                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-600">
                  <Clock size={13} />
                  {openStatus}
                </div>
              )}
            </div>
          )}

          {/* Operator one-liner if available */}
          {operatorProfile?.profile_data.oneLiner && (
            <div className="mb-5 bg-gradient-to-br from-wellness-50 to-sky-50/60 p-4 rounded-2xl border border-wellness-100/60">
              <p className="text-sm text-slate-700 font-bold italic leading-relaxed">
                &ldquo;{operatorProfile.profile_data.oneLiner}&rdquo;
              </p>
            </div>
          )}

          {/* Drip menu with real prices — only if data exists */}
          {dripMenu && dripMenu.length > 0 ? (
            <div className="mb-5">
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-3">
                Popular Drips
              </div>
              <div className="grid grid-cols-3 gap-2">
                {dripMenu.map((drip, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50 hover:bg-wellness-50 transition-colors p-3 rounded-2xl border border-slate-100"
                  >
                    <div className="text-[11px] font-black text-slate-900 leading-tight mb-1.5 line-clamp-2">
                      {drip.name}
                    </div>
                    <div className="text-sm font-black text-wellness-700">
                      {drip.price}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Fallback: top 3 specialties as pills
            (provider.specialties || []).length > 0 && (
              <div className="mb-5">
                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-3">
                  Specialties
                </div>
                <div className="flex flex-wrap gap-2">
                  {(provider.specialties || []).slice(0, 4).map((specialty, idx) => (
                    <ServicePill key={idx} service={specialty} />
                  ))}
                </div>
              </div>
            )
          )}

          {/* Description (slimmed to 2 lines) */}
          {provider.description && (
            <p className="text-slate-600 text-sm leading-relaxed mb-5 line-clamp-2">
              {provider.description}
            </p>
          )}

          {/* First-time offer if present */}
          {firstTimeOffer && (
            <div className="mb-5 flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200/60 rounded-2xl">
              <Gift size={14} className="text-amber-600 shrink-0" />
              <span className="text-[12px] font-black text-amber-800">
                {firstTimeOffer.title}
              </span>
            </div>
          )}

          {/* Practitioner name (text-only — photo handled on detail page) */}
          {lead && (
            <div className="mb-5 flex items-center gap-2 text-[11px] font-semibold text-slate-500">
              <span className="text-slate-400">Led by</span>
              <span className="font-black text-slate-700">{lead.name}</span>
              {lead.role && (
                <>
                  <span className="text-slate-300">·</span>
                  <span>{lead.role}</span>
                </>
              )}
            </div>
          )}

          {/* CTA row — primary depends on whether booking URL exists */}
          <div className="flex flex-col sm:flex-row items-stretch gap-3 mt-auto">
            {bookingUrl ? (
              <a
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-gradient-to-br from-wellness-500 to-wellness-700 hover:from-wellness-400 hover:to-wellness-600 text-white px-6 py-3.5 rounded-2xl font-black text-sm transition-all shadow-[0_15px_30px_-10px_rgba(20,184,166,0.5)] hover:shadow-[0_20px_40px_-10px_rgba(20,184,166,0.65)] hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                Book Online <ArrowRight size={18} />
              </a>
            ) : (
              <Link
                href={`/providers/${slug}`}
                className="flex-1 bg-gradient-to-br from-wellness-500 to-wellness-700 hover:from-wellness-400 hover:to-wellness-600 text-white px-6 py-3.5 rounded-2xl font-black text-sm transition-all shadow-[0_15px_30px_-10px_rgba(20,184,166,0.5)] hover:shadow-[0_20px_40px_-10px_rgba(20,184,166,0.65)] hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                View Details <ArrowRight size={18} />
              </Link>
            )}
            <div className="flex items-center gap-2">
              {provider.phone && (
                <a
                  href={`tel:${provider.phone}`}
                  className="flex-1 sm:flex-none bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 px-5 py-3.5 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2"
                  aria-label="Call"
                >
                  <Phone size={16} />
                  <span className="sm:hidden md:inline">Call</span>
                </a>
              )}
              {provider.website && (
                <a
                  href={provider.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 px-5 py-3.5 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2"
                  aria-label="Website"
                >
                  <Globe size={16} />
                  <span className="sm:hidden md:inline">Website</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
