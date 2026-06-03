/**
 * Accessible tap-to-expand definition for a single treatment chip.
 *
 * Uses native <details>/<summary> so the full definition text is server-rendered
 * (crawlable by Google + AI assistants) and works without JavaScript or hover.
 * Mobile-friendly tap target. No client-side state needed.
 *
 * Two visual variants:
 *  - "claimed"   → sage-on-cream chip matching DefinitiveListingLayout drip menu
 *  - "unclaimed" → white pill chip matching app/providers/[slug]/page.tsx
 *                 Services section
 *
 * Renders nothing special (just the children) when no definition is provided —
 * graceful fallback so unmatched chips look identical to today.
 */
import React from 'react';
import Link from 'next/link';
import { Droplets, Info, ArrowRight } from 'lucide-react';
import type { TreatmentDefinition } from '../lib/treatment-definitions';

type Variant = 'claimed' | 'unclaimed';

interface Props {
  name: string;
  /** From findDefinition(name); null/undefined = render plain chip with no disclosure. */
  definition?: TreatmentDefinition | null;
  /** Optional price ($X / "$X") rendered on the right of the claimed chip. */
  price?: string | null;
  variant?: Variant;
}

export function TreatmentDefinitionDisclosure({
  name,
  definition,
  price,
  variant = 'claimed',
}: Props) {
  // No definition → render the same chip the caller used to render, untouched.
  if (!definition) {
    if (variant === 'unclaimed') {
      return (
        <span
          className="px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-sm bg-white border border-slate-100 text-slate-700 hover:border-wellness-200 hover:text-wellness-600 inline-flex items-center gap-2"
        >
          {name}
        </span>
      );
    }
    return (
      <div className="flex items-center gap-[11px] bg-[#fffefa] border border-[rgba(25,36,28,0.09)] rounded-[13px] py-[14px] px-4 font-medium text-[14.5px] transition hover:border-[#d4e0cb] hover:bg-[#ebf1e5]">
        <Droplets size={17} className="text-[#b08a3e] flex-none" />
        <span className="min-w-0 truncate">{name}</span>
        {price && (
          <span className="ml-auto text-[12.5px] text-[#5c685e] font-semibold whitespace-nowrap">
            {price.startsWith('$') ? price : `$${price}`}
          </span>
        )}
      </div>
    );
  }

  const learnMoreHref = definition.slug ? `/iv-therapy/${definition.slug}` : null;

  if (variant === 'unclaimed') {
    return (
      <details className="group rounded-2xl bg-white border border-slate-100 shadow-sm transition-all open:shadow-md open:border-wellness-200 open:bg-wellness-50/40">
        <summary
          className="list-none cursor-pointer px-6 py-3 rounded-2xl font-bold text-sm text-slate-700 inline-flex items-center gap-2 select-none [&::-webkit-details-marker]:hidden group-hover:text-wellness-600 group-hover:border-wellness-200"
          aria-label={`Show definition of ${definition.name}`}
        >
          <span>{name}</span>
          <Info
            size={14}
            className="text-slate-400 group-hover:text-wellness-500 group-open:text-wellness-600 transition-colors"
            aria-hidden="true"
          />
        </summary>
        <div className="px-6 pb-4 pt-1 text-sm text-slate-600 leading-relaxed max-w-prose">
          <p>{definition.definition}</p>
          {learnMoreHref && (
            <Link
              href={learnMoreHref}
              className="inline-flex items-center gap-1 mt-2 text-wellness-700 font-bold text-xs hover:underline"
            >
              Learn more about {definition.name.toLowerCase()}
              <ArrowRight size={12} aria-hidden="true" />
            </Link>
          )}
        </div>
      </details>
    );
  }

  // Claimed (sage / cream) variant.
  return (
    <details className="group bg-[#fffefa] border border-[rgba(25,36,28,0.09)] rounded-[13px] transition open:border-[#b08a3e]/40 open:bg-[#fdfbf2] hover:border-[#d4e0cb] hover:bg-[#ebf1e5] open:hover:bg-[#fdfbf2]">
      <summary
        className="list-none cursor-pointer flex items-center gap-[11px] py-[14px] px-4 font-medium text-[14.5px] select-none [&::-webkit-details-marker]:hidden rounded-[13px]"
        aria-label={`Show definition of ${definition.name}`}
      >
        <Droplets size={17} className="text-[#b08a3e] flex-none" aria-hidden="true" />
        <span className="min-w-0 truncate">{name}</span>
        <Info
          size={14}
          className="text-[#b08a3e]/70 flex-none group-open:text-[#b08a3e] transition-colors"
          aria-hidden="true"
        />
        {price && (
          <span className="ml-auto text-[12.5px] text-[#5c685e] font-semibold whitespace-nowrap">
            {price.startsWith('$') ? price : `$${price}`}
          </span>
        )}
      </summary>
      <div className="px-4 pb-[14px] pt-0 text-[13.5px] text-[#5c685e] leading-relaxed border-t border-[rgba(25,36,28,0.06)] mt-1">
        <p className="pt-3">{definition.definition}</p>
        {learnMoreHref && (
          <Link
            href={learnMoreHref}
            className="inline-flex items-center gap-1 mt-2 text-[#1f3a27] font-semibold text-[12.5px] hover:text-[#b08a3e]"
          >
            Learn more about {definition.name.toLowerCase()}
            <ArrowRight size={12} aria-hidden="true" />
          </Link>
        )}
      </div>
    </details>
  );
}
