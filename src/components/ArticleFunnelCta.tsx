/**
 * Article-to-clinic funnels (Activation Plan step 4).
 *
 * Our page-1 pages are informational posts (alcohol-after-IV, who-can-legally-
 * give-IV, insurance coverage). They were dead ends: a reader got the answer
 * and left. Each now ends with the logical NEXT answer for that intent, routed
 * to the page that actually delivers it. Rendered from the template by slug,
 * never by editing post bodies, so it covers every current and future post in
 * the cluster and stays honest about what each destination really offers.
 *
 * Not an advertisement. One eyebrow, one headline, one line, one button.
 */
import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Receipt, MapPin } from 'lucide-react';

export interface ArticleFunnel {
  eyebrow: string;
  headline: string;
  body: string;
  href: string;
  label: string;
  icon: 'shield' | 'receipt' | 'map';
}

// Destinations are the pages that genuinely deliver the promise:
//   /search    default view lists verified clinics first ("Verified First").
//   /iv-prices the IV Price Index: real published prices by city.
const LEGAL: ArticleFunnel = {
  eyebrow: 'The next question',
  headline: 'Now compare clinics whose credentials we checked',
  body: 'Every clinic in our verified view named who administers and who prescribes its IVs, and we checked that prescriber on the public college register. That is the check this article says to make.',
  href: '/search',
  label: 'Compare credential-verified clinics near you',
  icon: 'shield',
};
const INSURANCE: ArticleFunnel = {
  eyebrow: 'The next question',
  headline: 'Find clinics that publish their prices',
  body: 'Coverage starts with a real price and a proper receipt. The IV Price Index lists what clinics in your city actually charge, from their own menus, so you know the number before you ask your insurer.',
  href: '/iv-prices',
  label: 'See published prices by city',
  icon: 'receipt',
};
const AFTERCARE: ArticleFunnel = {
  eyebrow: 'The next question',
  headline: 'Compare local clinics and what they charge',
  body: 'If you are planning a session, the useful next step is seeing who is near you, what they offer, and what it costs, side by side.',
  href: '/search',
  label: 'Compare local clinics and prices',
  icon: 'map',
};

/** Blog slug -> funnel. Only the intents Google already trusts us on. */
export const ARTICLE_FUNNELS: Record<string, ArticleFunnel> = {
  'who-can-legally-give-iv-canada-rules-by-province-2026': LEGAL,
  'who-can-legally-give-iv-ontario-2026': LEGAL,
  'who-can-legally-give-iv-british-columbia-2026': LEGAL,
  'who-can-legally-give-iv-alberta-2026': LEGAL,
  'who-can-legally-give-iv-quebec-2026': LEGAL,
  'iv-therapy-insurance-coverage-canada': INSURANCE,
  'does-insurance-cover-iv-therapy-canada-2026': INSURANCE,
  'can-you-drink-alcohol-after-iv-therapy': AFTERCARE,
};

const ICONS = { shield: ShieldCheck, receipt: Receipt, map: MapPin } as const;

export function ArticleFunnelCta({ funnel }: { funnel: ArticleFunnel }) {
  const Icon = ICONS[funnel.icon];
  return (
    <aside className="mt-16 rounded-[2rem] bg-wellness-900 text-white p-8 md:p-10 relative overflow-hidden not-prose">
      <div className="absolute top-0 right-0 w-40 h-40 bg-wellness-800 rounded-bl-[6rem] -mr-10 -mt-10" aria-hidden="true" />
      <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-7 justify-between">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.15em] text-wellness-200 mb-3">
            <Icon size={14} /> {funnel.eyebrow}
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-3 leading-tight text-white">{funnel.headline}</h2>
          <p className="text-wellness-100 text-sm md:text-[15px] leading-relaxed">{funnel.body}</p>
        </div>
        <Link
          href={funnel.href}
          className="shrink-0 inline-flex items-center justify-center gap-2 bg-white text-wellness-900 px-7 py-4 rounded-xl font-black text-sm hover:bg-wellness-50 transition-all shadow-xl no-underline"
        >
          {funnel.label} <ArrowRight size={16} />
        </Link>
      </div>
    </aside>
  );
}
