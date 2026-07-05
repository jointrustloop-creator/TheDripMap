import React from 'react';
import Link from 'next/link';
import { ShieldCheck, CalendarDays, UserRound } from 'lucide-react';

interface GuideBylineProps {
  /** Display name of the author. Defaults to the editorial team. */
  author?: string;
  /** ISO date (YYYY-MM-DD) the guide content was last updated. */
  lastUpdated?: string;
  /** Medical reviewer display name, e.g. "Jane Doe, RN". Renders only when set. */
  reviewedBy?: string;
}

const DATE_FORMAT: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-CA', DATE_FORMAT);
}

/**
 * E-E-A-T byline for editorial guides: visible author, optional medical
 * reviewer slot, visible last-updated date, and a link to the verification
 * methodology. Server-rendered, fixed height, no layout shift.
 */
export const GuideByline = ({ author, lastUpdated, reviewedBy }: GuideBylineProps) => {
  const displayAuthor = author || 'TheDripMap Editorial Team';
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500 font-medium border-y border-slate-100 py-3 my-6">
      <span className="inline-flex items-center gap-1.5">
        <UserRound size={15} className="text-slate-400" />
        <span>By {displayAuthor}</span>
      </span>
      {reviewedBy && (
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck size={15} className="text-wellness-600" />
          <span>Medically reviewed by {reviewedBy}</span>
        </span>
      )}
      {lastUpdated && (
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays size={15} className="text-slate-400" />
          <span>Updated {formatDate(lastUpdated)}</span>
        </span>
      )}
      <Link
        href="/about#how-we-verify"
        className="inline-flex items-center gap-1.5 text-wellness-700 hover:text-wellness-800 font-bold transition-colors"
      >
        <ShieldCheck size={15} />
        <span>How we verify clinics</span>
      </Link>
    </div>
  );
};

/**
 * Methodology note for guide footers. Every guide ends with the same
 * independent-trust statement and a link to the full methodology.
 */
export const MethodologyNote = () => (
  <div className="mt-16 rounded-2xl bg-slate-50 border border-slate-100 px-6 py-5 text-sm text-slate-600 leading-relaxed">
    <p>
      <strong className="text-slate-900">About this guide.</strong> TheDripMap is an independent
      IV therapy matching platform for Canada. We do not sell treatments and we do not accept
      payment for rankings. Clinic information comes from clinic-verified profiles and public
      data, and the Safety Verified badge is granted only after a clinic attests to its medical
      direction and credentials.{' '}
      <Link href="/about#how-we-verify" className="font-bold text-wellness-700 hover:text-wellness-800">
        Read how we verify clinics
      </Link>
      . Nothing on this page is medical advice; talk to a healthcare professional about what is
      right for you.
    </p>
  </div>
);
