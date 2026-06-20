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
  ShieldCheck,
  Stethoscope,
  Leaf,
  Gift,
  Calendar,
  Star as StarIcon,
} from 'lucide-react';
import { Provider, OperatorProfile } from '../types';
import { slugify } from '../lib/data';
import { practitionerType } from '../lib/practitioner';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface ProviderCardFeaturedProps {
  provider: Provider & { matchScore?: number; offersRecommended?: boolean };
  operatorProfile?: OperatorProfile;
  rank?: number;
  isPrimary?: boolean;
  // Treatment the quiz recommended, shown as an "Offers …" chip ONLY when this
  // clinic actually matched it (offersRecommended). Never claimed otherwise.
  recommendedTreatment?: string;
}

const isStock = (url?: string | null): boolean =>
  !url || /unsplash\.com|picsum|placeholder/i.test(url);

// A genuine clinic PHOTO (not a logo, not stock) to anchor the card. Logos live
// in imageUrl; real photography, when present, lives in `photos`.
const firstRealPhoto = (provider: Provider): string | null => {
  const photos = Array.isArray((provider as { photos?: unknown }).photos)
    ? ((provider as { photos?: string[] }).photos as string[])
    : [];
  const photo = photos.find((p) => typeof p === 'string' && !isStock(p));
  return photo || null;
};

// A real uploaded logo (claimed clinics store these under /blog-images/). Stock
// Unsplash fillers are never treated as brand imagery.
const realLogo = (provider: Provider): string | null => {
  const url = provider.imageUrl || provider.image_url || '';
  if (isStock(url)) return null;
  if (url.includes('/blog-images/') && !(provider.is_featured || provider.is_claimed)) return null;
  return url;
};

const initialsOf = (name: string): string =>
  name.split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase() || 'IV';

// Open-now from working_hours JSON. Robust to {Mon:"9am-5pm"} or {Mon:["09:00","17:00"]}.
function deriveOpenStatus(provider: Provider): string | null {
  const wh = (provider as { working_hours?: Record<string, string | string[]> }).working_hours || provider.hours;
  if (!wh || typeof wh !== 'object') return null;
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = dayNames[new Date().getDay()];
  const todayValue = wh[today as keyof typeof wh];
  if (!todayValue) return null;
  const raw = Array.isArray(todayValue) ? todayValue.join(' - ') : String(todayValue);
  if (/closed/i.test(raw)) return null;
  const closingMatch = raw.match(/(\d{1,2}:?\d{0,2}\s*[ap]?m?)(?=\s*$|\s*\))/i);
  return closingMatch ? `Open till ${closingMatch[1].trim()}` : 'Open today';
}

// Top drips with REAL prices, else null (no fabricated pricing).
function deriveDripMenu(provider: Provider) {
  const services = provider.services;
  if (!services || services.length === 0) return null;
  const realPriced = services.filter((s) => s.price && !/call|tbd|contact|inquire/i.test(s.price));
  return realPriced.length ? realPriced.slice(0, 3) : null;
}

export const ProviderCardFeatured = ({
  provider,
  operatorProfile,
  isPrimary = false,
  recommendedTreatment,
}: ProviderCardFeaturedProps) => {
  const slug = provider.slug || slugify(provider.name);
  const photo = firstRealPhoto(provider);
  const logo = realLogo(provider);
  const openStatus = deriveOpenStatus(provider);
  const dripMenu = deriveDripMenu(provider);
  const prac = practitionerType(provider);

  const firstTimeOffer = provider.special_offers?.find(
    (o) => o && o.title && o.active !== false && (!o.expires || o.expires >= new Date().toISOString().slice(0, 10))
  );
  const bookingUrl = (provider as { online_booking_url?: string }).online_booking_url;
  const isClaimed = provider.is_claimed === true || provider.is_featured === true;
  const isSafety = provider.safety_verified === true;
  const oneLiner = operatorProfile?.profile_data?.oneLiner;

  // Status badge — EVERY card carries exactly one, by priority. Safety Verified
  // (prominent) implies Claimed; unclaimed gets a neutral "Listed" pill so no
  // card is ever statusless.
  const badge = isSafety ? (
    <span title="Completed TheDripMap's safety questionnaire" className="inline-flex items-center gap-1 shrink-0 bg-amber-400 text-amber-950 px-2.5 py-1 rounded-full text-[10px] font-black tracking-[0.12em] uppercase border border-amber-500 shadow-sm whitespace-nowrap">
      <ShieldCheck size={12} className="text-amber-900" /> Safety Verified
    </span>
  ) : isClaimed ? (
    <span title="Ownership confirmed by the clinic" className="inline-flex items-center gap-1 shrink-0 bg-slate-50 text-slate-500 px-2 py-1 rounded-full text-[10px] font-bold tracking-[0.14em] uppercase border border-slate-200 whitespace-nowrap">
      <CheckCircle2 size={10} className="text-slate-400" /> Claimed
    </span>
  ) : (
    <span title="Public listing not yet claimed by the clinic" className="inline-flex items-center gap-1 shrink-0 bg-slate-50 text-slate-400 px-2 py-1 rounded-full text-[10px] font-bold tracking-[0.14em] uppercase border border-slate-100 whitespace-nowrap">
      Listed
    </span>
  );

  // Practitioner chip — scannable, and colour-coded by oversight level since it
  // now drives safety ranking. Prescriber-level (MD/NP) reads green; a
  // naturopath reads distinctly (leaf, amber) so it never looks equivalent.
  const pracChip = prac.label && (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-tight border',
        prac.isPrescriberLevel
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : prac.tier === 'naturopath'
            ? 'bg-amber-50 text-amber-800 border-amber-200'
            : 'bg-slate-50 text-slate-600 border-slate-200'
      )}
    >
      {prac.tier === 'naturopath' ? <Leaf size={12} /> : <Stethoscope size={12} />}
      {prac.label}
    </span>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={cn(
        'group relative bg-white rounded-3xl overflow-hidden border transition-all duration-300',
        isClaimed
          ? 'border-wellness-500/30 shadow-[0_22px_48px_-26px_rgba(20,184,166,0.28),0_6px_16px_-10px_rgba(15,23,42,0.1)] hover:shadow-[0_30px_60px_-26px_rgba(20,184,166,0.38)]'
          : 'border-slate-200 shadow-sm hover:shadow-md'
      )}
    >
      <div className={cn('flex flex-col', isPrimary && 'md:flex-row')}>
        {/* Visual anchor: photo cover -> logo panel -> initials panel. Solid
            brand-tinted panel (no washy gradient dead space). */}
        <Link
          href={`/providers/${slug}`}
          className={cn(
            'relative block shrink-0 overflow-hidden',
            isPrimary ? 'h-48 md:h-auto md:w-72' : 'h-40'
          )}
        >
          {photo ? (
            <ResilientImage
              src={photo}
              alt={`${provider.name} IV therapy clinic in ${provider.city}`}
              width={600}
              height={400}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
              fallbackSrc=""
            />
          ) : logo ? (
            <div className="absolute inset-0 bg-wellness-50 flex items-center justify-center p-6">
              <ResilientImage
                src={logo}
                alt={`${provider.name} logo`}
                width={240}
                height={240}
                unoptimized
                className="max-h-[78%] max-w-[78%] w-auto h-auto object-contain"
                fallbackSrc=""
              />
            </div>
          ) : (
            <div className="absolute inset-0 bg-wellness-600 flex items-center justify-center">
              <span className="text-4xl md:text-5xl font-black text-white/90 tracking-tight">
                {initialsOf(provider.name)}
              </span>
            </div>
          )}
        </Link>

        {/* Content */}
        <div className={cn('flex-1 flex flex-col min-w-0', isPrimary ? 'p-6 md:p-8' : 'p-5 md:p-6')}>
          {/* Name + status badge */}
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <Link href={`/providers/${slug}`} className="min-w-0">
              <h3 className={cn('font-black text-slate-900 group-hover:text-wellness-700 transition-colors leading-tight tracking-tight', isPrimary ? 'text-xl md:text-2xl' : 'text-lg md:text-xl')}>
                {provider.name}
              </h3>
            </Link>
            {badge}
          </div>

          {/* Location + rating */}
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <div className="flex items-center gap-1.5 text-sm text-slate-500 font-semibold min-w-0">
              <MapPin size={13} className="text-slate-400 shrink-0" />
              <span className="truncate">{provider.city}{provider.state ? `, ${provider.state}` : ''}</span>
            </div>
            {isClaimed && provider.rating > 0 && (
              <div className="flex items-center gap-1.5 text-sm font-black text-slate-900 shrink-0">
                <StarIcon size={14} className="text-amber-500" fill="currentColor" />
                {provider.rating}
                <span className="text-slate-500 font-bold">({provider.reviewCount || 0})</span>
              </div>
            )}
          </div>

          {/* Scannable signal row: practitioner type + offers-treatment + open */}
          {(pracChip || provider.offersRecommended || openStatus) && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {pracChip}
              {provider.offersRecommended && recommendedTreatment && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-tight bg-wellness-50 text-wellness-700 border border-wellness-200">
                  <CheckCircle2 size={12} /> Offers {recommendedTreatment}
                </span>
              )}
              {openStatus && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-emerald-600">
                  <Clock size={12} /> {openStatus}
                </span>
              )}
            </div>
          )}

          {/* One body block only (priority: owner one-liner -> priced drips ->
              specialties), to keep three cards from becoming an endless scroll. */}
          {oneLiner ? (
            <p className="text-sm text-slate-700 font-semibold italic leading-relaxed mb-5 line-clamp-2">
              &ldquo;{oneLiner}&rdquo;
            </p>
          ) : dripMenu ? (
            <div className="grid grid-cols-3 gap-2 mb-5">
              {dripMenu.map((drip, idx) => (
                <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="text-[11px] font-black text-slate-900 leading-tight mb-1 line-clamp-2">{drip.name}</div>
                  <div className="text-sm font-black text-wellness-700">{drip.price}</div>
                </div>
              ))}
            </div>
          ) : (provider.specialties || []).length > 0 ? (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {(provider.specialties || []).slice(0, 4).map((s, idx) => (
                <span key={idx} className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-50 text-slate-600 border border-slate-200 truncate max-w-[150px]">
                  {s}
                </span>
              ))}
            </div>
          ) : null}

          {/* Offer */}
          {firstTimeOffer && (
            <div className="mb-5 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200/60 rounded-xl">
              <Gift size={14} className="text-amber-600 shrink-0" />
              <span className="text-[12px] font-black text-amber-800 line-clamp-1">{firstTimeOffer.title}</span>
            </div>
          )}

          {/* CTA row — ONE consistent primary across every card ("View clinic"),
              then identically-styled secondary actions when the data exists. */}
          <div className="flex items-stretch gap-2 mt-auto">
            <Link
              href={`/providers/${slug}`}
              className="flex-1 bg-gradient-to-br from-wellness-500 to-wellness-700 hover:from-wellness-400 hover:to-wellness-600 text-white px-5 py-3 rounded-2xl font-black text-sm transition-all shadow-[0_14px_28px_-12px_rgba(20,184,166,0.55)] hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              View clinic <ArrowRight size={17} />
            </Link>
            {bookingUrl && (
              <a
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 px-4 py-3 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2"
                aria-label="Book online"
                title="Book online"
              >
                <Calendar size={16} />
              </a>
            )}
            {provider.phone && (
              <a
                href={`tel:${provider.phone}`}
                className="bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 px-4 py-3 rounded-2xl font-black text-sm transition-all flex items-center justify-center"
                aria-label="Call"
                title="Call"
              >
                <Phone size={16} />
              </a>
            )}
            {provider.website && (
              <a
                href={provider.website}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 px-4 py-3 rounded-2xl font-black text-sm transition-all flex items-center justify-center"
                aria-label="Website"
                title="Website"
              >
                <Globe size={16} />
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
