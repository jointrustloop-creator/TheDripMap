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
 * Redesign 2026-09-18 (Hubert: the hub felt built for mobile): the saving is
 * lifted out of the owner's sentence into a headline ("20% off", "Save 10%")
 * so a desktop grid reads at a glance; the sentence stays verbatim under it.
 * When no figure can be read from the text, the headline is "Clinic offer".
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
import { ArrowRight, CalendarDays, Droplets, MapPin, ShieldCheck, Ticket } from 'lucide-react';
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

/** "Save 10%", "20% off", "$25 off": the figure the owner wrote, nothing invented. */
export function offerHeadline(title: string): { big: string; small: string } | null {
  const pct = title.match(/(\d{1,2})\s*%\s*off/i) || title.match(/save\s*(\d{1,2})\s*%/i);
  if (pct) return { big: `${pct[1]}%`, small: 'off' };
  const dollars = title.match(/\$\s?(\d{1,4})\s*off/i) || title.match(/save\s*\$\s?(\d{1,4})/i);
  if (dollars) return { big: `$${dollars[1]}`, small: 'off' };
  return null;
}

export function DealCard({ deal, showCity = true }: { deal: LiveDeal; showCity?: boolean }) {
  const validity = formatValidity(deal.offer.expires);
  const cityLabel = [deal.city, deal.state].filter(Boolean).join(', ');
  const title = cleanDashes(deal.offer.title);
  const headline = offerHeadline(title);

  return (
    <Link
      href={`/providers/${deal.slug}`}
      className="group relative bg-white rounded-[22px] border border-[rgba(25,36,28,0.1)] hover:border-[#0F6E56]/40 hover:shadow-[0_18px_40px_-20px_rgba(15,110,86,0.45)] transition-all flex flex-col overflow-hidden"
    >
      {/* Saving band: the one thing a scanning eye should catch. */}
      <div className="relative px-6 pt-6 pb-5 bg-[linear-gradient(135deg,#f3f7f2_0%,#e7f1ec_100%)] border-b border-[rgba(15,110,86,0.12)]">
        <Droplets size={84} strokeWidth={1} className="absolute -right-3 -top-4 text-[#0F6E56]/[0.08] rotate-12" aria-hidden />
        <div className="flex items-start justify-between gap-3">
          {headline ? (
            <div className="flex items-baseline gap-1.5 text-[#0F6E56]">
              <span className="text-[40px] leading-none font-black tracking-[-0.04em]">{headline.big}</span>
              <span className="font-serif italic text-[22px] leading-none text-[#0F6E56]/80">{headline.small}</span>
            </div>
          ) : (
            <div className="font-serif italic text-[26px] leading-none text-[#0F6E56]">Clinic offer</div>
          )}
          {deal.safetyVerified && (
            <span
              className="inline-flex items-center gap-1 text-[10.5px] font-black uppercase tracking-[0.1em] text-wellness-700 bg-white/80 border border-wellness-200 rounded-full px-2 py-0.5 shrink-0"
              title="Safety Verified by TheDripMap"
            >
              <ShieldCheck size={11} /> Safety Verified
            </span>
          )}
        </div>
      </div>

      <div className="px-6 pt-5 pb-6 flex flex-col flex-1">
        <p className="text-[16px] font-bold text-slate-900 leading-snug flex-1">{title}</p>

        {(deal.offer.code || validity) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {deal.offer.code && (
              <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#6b4a12] bg-[#fbf3df] border border-dashed border-[#d9b566] rounded-lg px-2.5 py-1">
                <Ticket size={12} /> Code <span className="font-mono tracking-wide">{deal.offer.code}</span>
              </span>
            )}
            {validity && (
              <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                <CalendarDays size={12} /> Until {validity}
              </span>
            )}
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <span className="min-w-0">
            <span className="block text-[14px] font-black text-slate-900 truncate group-hover:text-[#0F6E56] transition-colors">
              {deal.name}
            </span>
            {showCity && cityLabel && (
              <span className="mt-0.5 inline-flex items-center gap-1 text-[11.5px] font-bold text-slate-400">
                <MapPin size={11} /> {cityLabel}
              </span>
            )}
          </span>
          <span className="w-9 h-9 rounded-full bg-[#0F6E56] text-white inline-flex items-center justify-center shrink-0 group-hover:translate-x-0.5 transition-transform">
            <ArrowRight size={15} />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default DealCard;
