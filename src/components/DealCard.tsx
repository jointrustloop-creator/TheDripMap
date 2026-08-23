/**
 * DealCard
 *
 * The one card for a live clinic offer, shared by the /deals hub, city-page
 * deal modules, and any future deal surface. Server component, zero client JS.
 *
 * Renders ONLY real data passed in as a LiveDeal (which has already been
 * through the compliance gate in src/lib/deals.ts): clinic name linking to the
 * provider page, the offer text verbatim (en/em dashes normalized to hyphens
 * per house style), validity when present, a city chip, and the Safety
 * Verified badge when isSafetyVerified() passed upstream.
 *
 * Click tracking: deliberately a plain <Link>, not TrackedLink. TrackedLink's
 * event union (book/call/website/directions/message) is the provider-page CTA
 * taxonomy and /api/track rejects unknown event types; polluting those CTA
 * metrics with hub navigation would corrupt the weekly report. The click lands
 * on the provider page, where the existing view + CTA tracking measures what
 * matters (did the deal produce a booking action).
 */
import React from 'react';
import Link from 'next/link';
import { ArrowRight, Gift, MapPin, ShieldCheck } from 'lucide-react';
import type { LiveDeal } from '../lib/deals';

// House style: no en/em dashes anywhere in rendered copy, including
// owner-written offer text (otherwise verbatim).
const cleanDashes = (s: string) => s.replace(/[‒–—―−]/g, '-');

function formatValidity(expires?: string): string | null {
  if (!expires || !/^\d{4}-\d{2}-\d{2}$/.test(expires)) return expires || null;
  const d = new Date(`${expires}T00:00:00`);
  if (Number.isNaN(d.getTime())) return expires;
  return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function DealCard({ deal, showCity = true }: { deal: LiveDeal; showCity?: boolean }) {
  const validity = formatValidity(deal.offer.expires);
  const cityLabel = [deal.city, deal.state].filter(Boolean).join(', ');

  return (
    <Link
      href={`/providers/${deal.slug}`}
      className="group bg-white rounded-[1.5rem] border border-slate-200 p-6 hover:border-wellness-300 hover:shadow-xl transition-all flex flex-col"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="inline-flex items-center gap-2 text-[10.5px] font-black uppercase tracking-[0.14em] text-[#a9772a]">
          <Gift size={13} /> Clinic offer
        </span>
        {deal.safetyVerified && (
          <span
            className="inline-flex items-center gap-1 text-[10.5px] font-black uppercase tracking-[0.1em] text-wellness-700 bg-wellness-50 border border-wellness-200 rounded-full px-2 py-0.5 shrink-0"
            title="Safety Verified by TheDripMap"
          >
            <ShieldCheck size={11} /> Safety Verified
          </span>
        )}
      </div>

      <p className="text-[17px] font-black text-slate-900 leading-snug mb-3 flex-1">
        {cleanDashes(deal.offer.title)}
      </p>

      {(deal.offer.code || validity) && (
        <div className="text-[13px] text-slate-500 flex flex-wrap gap-x-3 gap-y-1 mb-4">
          {deal.offer.code && (
            <span>
              Code <b className="text-slate-700 font-mono tracking-wide">{deal.offer.code}</b>
            </span>
          )}
          {validity && <span>Valid until {validity}</span>}
        </div>
      )}

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
        <span className="min-w-0">
          <span className="block text-[14px] font-bold text-slate-900 truncate group-hover:text-wellness-700 transition-colors">
            {deal.name}
          </span>
          {showCity && cityLabel && (
            <span className="mt-0.5 inline-flex items-center gap-1 text-[11.5px] font-bold text-slate-400">
              <MapPin size={11} /> {cityLabel}
            </span>
          )}
        </span>
        <span className="text-[#0F6E56] inline-flex items-center gap-1 text-[13px] font-bold shrink-0">
          View <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </Link>
  );
}

export default DealCard;
