'use client';

import React, { useMemo, useState } from 'react';
import { Copy, Check, ShieldCheck } from 'lucide-react';

interface BadgeEmbedCardProps {
  /** Full public listing URL, e.g. https://www.thedripmap.com/providers/x-toronto */
  listingUrl: string;
  clinicName: string;
}

/**
 * "Add your badge to your website" card (PLAN-5). The snippet is a linked
 * image: the SVG at /api/badge/[slug] reflects the clinic's LIVE status
 * (Safety Verified -> Verified Listing -> plain) through the same gate the
 * site renders with, and the anchor is a followed link back to the listing.
 */
export const BadgeEmbedCard = ({ listingUrl, clinicName }: BadgeEmbedCardProps) => {
  const [copied, setCopied] = useState(false);

  const { badgeUrl, snippet } = useMemo(() => {
    const slug = listingUrl.split('/providers/')[1]?.replace(/[/?#].*$/, '') || '';
    const badgeUrl = `https://www.thedripmap.com/api/badge/${slug}`;
    const snippet =
      `<a href="${listingUrl}?utm_source=badge" title="${clinicName.replace(/"/g, '&quot;')} on TheDripMap">` +
      `<img src="${badgeUrl}" alt="${clinicName.replace(/"/g, '&quot;')} on TheDripMap" width="240" height="56" style="border:0;"></a>`;
    return { badgeUrl, snippet };
  }, [listingUrl, clinicName]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* clipboard unavailable; the user can select the text */ }
  };

  return (
    <section className="bg-white rounded-[1.75rem] border border-slate-200 shadow-[0_12px_34px_-22px_rgba(25,40,28,0.4)] p-6 md:p-8">
      <div className="flex items-start gap-3.5 mb-4">
        <span className="flex-none w-8 h-8 rounded-full bg-[#ebf1e5] text-[#0F6E56] flex items-center justify-center"><ShieldCheck size={16} /></span>
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">Add your badge to your website</h2>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Paste this once and it stays current on its own: it shows Safety Verified while your badge is active, and Verified Listing otherwise. Patients can click it to see your profile.
          </p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-start gap-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={badgeUrl} alt={`${clinicName} on TheDripMap`} width={240} height={56} className="shrink-0" />
        <div className="min-w-0 flex-1 w-full">
          <pre className="text-[11px] leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-3.5 overflow-x-auto whitespace-pre-wrap break-all text-slate-600">{snippet}</pre>
          <button
            type="button"
            onClick={copy}
            className="mt-3 inline-flex items-center gap-2 bg-[#0F6E56] text-white px-5 py-2.5 rounded-xl font-black text-[13px] hover:bg-[#0c5a47] transition-all"
          >
            {copied ? (<><Check size={14} /> Copied</>) : (<><Copy size={14} /> Copy embed code</>)}
          </button>
        </div>
      </div>
    </section>
  );
};
