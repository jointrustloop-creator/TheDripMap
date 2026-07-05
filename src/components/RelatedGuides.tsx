import React from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import { GUIDES } from '../lib/guides';

interface RelatedGuidesProps {
  /** City slug used to rank guides that explicitly relate to this city. */
  citySlug?: string;
  /** City display name for the heading, e.g. "Toronto". */
  cityName?: string;
  /** Maximum guides to show. */
  limit?: number;
}

/**
 * Internal-link module: surfaces editorial guides on city pages so Canadian
 * authority flows between the guide cluster and the geo cluster. Guides that
 * name this city in relatedCities rank first, then the rest fill remaining
 * slots. Server-rendered links only, no client JS.
 */
export const RelatedGuides = ({ citySlug, cityName, limit = 4 }: RelatedGuidesProps) => {
  const cityFirst = [...GUIDES].sort((a, b) => {
    const aHit = citySlug && a.relatedCities?.some((c) => c.slug === citySlug) ? 1 : 0;
    const bHit = citySlug && b.relatedCities?.some((c) => c.slug === citySlug) ? 1 : 0;
    return bHit - aHit;
  });
  const shown = cityFirst.slice(0, limit);
  if (!shown.length) return null;

  return (
    <section className="mt-16">
      <div className="flex items-center gap-2 mb-5">
        <BookOpen size={18} className="text-wellness-600" />
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          {cityName ? `IV therapy guides for ${cityName} patients` : 'IV therapy guides'}
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {shown.map((g) => (
          <Link
            key={g.slug}
            href={`/guide/${g.slug}`}
            className="flex items-center justify-between gap-3 px-5 py-4 rounded-2xl bg-white border border-slate-100 text-slate-800 font-bold text-sm hover:border-wellness-200 hover:text-wellness-700 transition-colors"
          >
            <span>{g.title}</span>
            <ArrowRight size={16} className="text-wellness-500 shrink-0" />
          </Link>
        ))}
      </div>
      <p className="mt-4 text-sm text-slate-500 font-medium">
        Part of{' '}
        <Link href="/canada" className="font-bold text-wellness-700 hover:text-wellness-800">
          TheDripMap Canada
        </Link>
        , the independent IV therapy matching platform for Canadian patients.
      </p>
    </section>
  );
};
