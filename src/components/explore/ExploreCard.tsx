'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Star, Clock, Navigation, Bookmark, Share2, Zap, ArrowRight } from 'lucide-react';
import { Provider } from '../../types';
import { cn } from '../../lib/utils';
import {
  isVerifiedClinic,
  isOpenNow,
  todayHours,
  topServices,
  priceIndicator,
  clinicHref,
  directionsUrl,
} from '../../lib/clinic-display';

const SITE = 'https://www.thedripmap.com';

interface ExploreCardProps {
  provider: Provider;
  /** Highlighted because its map pin is hovered/selected (or vice versa). */
  active?: boolean;
  onHover?: (id: string | null) => void;
  onSelect?: (id: string) => void;
}

export function ExploreCard({ provider: p, active, onHover, onSelect }: ExploreCardProps) {
  const router = useRouter();
  const verified = isVerifiedClinic(p);
  const sv = (p as { safety_verified?: boolean }).safety_verified === true;
  const open = isOpenNow(p.working_hours);
  const hours = todayHours(p.working_hours);
  const services = topServices(p, 3);
  const price = priceIndicator(p);
  const href = clinicHref(p);
  const rating = Number(p.rating) || 0;
  const reviews = Number(p.reviewCount) || 0;
  const dist = typeof p.distance === 'number' && p.distance < 9999 ? p.distance : null;

  const [saved, setSaved] = useState(false);
  useEffect(() => {
    try {
      const ids: string[] = JSON.parse(localStorage.getItem('tdm_saved') || '[]');
      setSaved(ids.includes(p.id));
    } catch {
      /* ignore */
    }
  }, [p.id]);

  const toggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const ids: string[] = JSON.parse(localStorage.getItem('tdm_saved') || '[]');
      const next = ids.includes(p.id) ? ids.filter((i) => i !== p.id) : [...ids, p.id];
      localStorage.setItem('tdm_saved', JSON.stringify(next));
      setSaved(next.includes(p.id));
    } catch {
      /* ignore */
    }
  };

  const share = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${SITE}${href}`;
    try {
      const nav = navigator as Navigator & { share?: (d: { title: string; url: string }) => Promise<void> };
      if (nav.share) await nav.share({ title: p.name, url });
      else await navigator.clipboard.writeText(url);
    } catch {
      /* user cancelled or unsupported */
    }
  };

  return (
    <div
      onMouseEnter={() => onHover?.(p.id)}
      onMouseLeave={() => onHover?.(null)}
      onClick={() => onSelect?.(p.id)}
      className={cn(
        'group relative bg-white rounded-3xl border p-5 transition-all cursor-pointer',
        active
          ? 'border-wellness-400 ring-2 ring-wellness-400/40 shadow-lg'
          : 'border-slate-100 hover:border-wellness-200 hover:shadow-md'
      )}
    >
      {/* Badge row — Safety Verified is the most prominent quality signal */}
      <div className="flex items-center justify-between mb-2.5">
        {verified ? (
          <span className="inline-flex items-center gap-1.5 bg-wellness-600 text-white text-[10px] font-black uppercase tracking-[0.14em] px-2.5 py-1 rounded-full">
            <ShieldCheck size={12} /> {sv ? 'Safety Verified' : 'Claimed'}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-[0.14em] px-2.5 py-1 rounded-full">
            Listed
          </span>
        )}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleSave}
            aria-label={saved ? 'Saved' : 'Save clinic'}
            className={cn('p-1.5 rounded-lg transition-colors', saved ? 'text-wellness-600' : 'text-slate-300 hover:text-slate-500')}
          >
            <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
          </button>
          <button onClick={share} aria-label="Share clinic" className="p-1.5 rounded-lg text-slate-300 hover:text-slate-500 transition-colors">
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* Name + location */}
      <Link href={href} onClick={(e) => e.stopPropagation()} className="block">
        <h3 className="text-base font-black text-slate-900 leading-snug tracking-tight group-hover:text-wellness-700 transition-colors line-clamp-2">
          {p.name}
        </h3>
      </Link>
      <div className="text-xs font-bold text-slate-400 mt-0.5">
        {[p.city, p.state].filter(Boolean).join(', ')}
        {dist != null ? ` · ${dist.toFixed(1)} km` : ''}
      </div>

      {/* Rating */}
      {rating > 0 && (
        <div className="flex items-center gap-1.5 mt-2">
          <Star size={14} className="text-amber-400 fill-amber-400" />
          <span className="text-sm font-black text-slate-900">{rating.toFixed(1)}</span>
          {reviews > 0 && <span className="text-xs font-bold text-slate-400">({reviews})</span>}
        </div>
      )}

      {/* Key services */}
      {services.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {services.map((s) => (
            <span key={s} className="text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Open-now + price */}
      {(p.working_hours || price) && (
        <div className="flex items-center gap-3 mt-3 text-xs font-bold">
          {p.working_hours && (
            <span className={cn('inline-flex items-center gap-1', open ? 'text-emerald-600' : 'text-slate-400')}>
              <Clock size={12} /> {open ? 'Open now' : 'Closed'}
              {hours ? ` · ${hours}` : ''}
            </span>
          )}
          {price && <span className="text-slate-500">{price}</span>}
        </div>
      )}

      {/* CTAs: Get Matched (primary) + Directions / detail */}
      <div className="flex items-center gap-2 mt-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push('/quiz');
          }}
          className="flex-1 inline-flex items-center justify-center gap-1.5 bg-wellness-600 hover:bg-wellness-700 text-white text-xs font-black py-2.5 rounded-xl transition-colors"
        >
          <Zap size={14} /> Get Matched
        </button>
        <a
          href={directionsUrl(p)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          aria-label="Directions"
          className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 text-slate-500 hover:border-wellness-300 hover:text-wellness-600 transition-colors"
        >
          <Navigation size={15} />
        </a>
        <Link
          href={href}
          onClick={(e) => e.stopPropagation()}
          aria-label="View clinic details"
          className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 text-slate-500 hover:border-wellness-300 hover:text-wellness-600 transition-colors"
        >
          <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}

export default ExploreCard;
