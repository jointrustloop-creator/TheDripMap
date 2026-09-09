'use client';

/**
 * PatientActionBar (Activation Plan step 4): the phone user's decision bar.
 *
 * GSC: mobile is 40% of our impressions but 71% of our clicks, at position
 * 14.6 vs 33.7 on desktop. A phone visitor on a clinic page wants to decide
 * NOW, and the conversion controls were below 1,500 words of content. This is
 * a small fixed bar on mobile only: Compare | Call | Book. Nothing is buried.
 *
 * Claimed clinic pages only: those carry the booking link and are the pages
 * we tell owners will convert. Unclaimed pages keep the claim rail (owner-
 * facing) so the two bars never collide. Call and Book are TrackedLinks, so
 * they land in listing_events like every other contact click.
 */
import React from 'react';
import Link from 'next/link';
import { Phone, CalendarCheck, Scale, MessageSquare } from 'lucide-react';
import TrackedLink from './TrackedLink';
import { bookingUrlOf } from '../lib/card-signals';
import { slugify } from '../lib/data';
import type { Provider } from '../types';

export function PatientActionBar({ provider }: { provider: Provider }) {
  const bookingUrl = bookingUrlOf(provider);
  const phone = (provider.phone || '').trim();
  const compareHref = provider.city ? `/cities/${slugify(provider.city)}` : '/search';
  // Book: the clinic's own booking page when it has one, otherwise the on-page
  // booking request (anchor rendered by the claimed layout).
  const bookHref = bookingUrl || '#book';

  return (
    <nav
      aria-label="Quick actions"
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-slate-200 shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.25)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid grid-cols-3 gap-2 px-3 py-2">
        <Link
          href={compareHref}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-[13px] font-black py-3"
        >
          <Scale size={16} className="text-slate-500" /> Compare
        </Link>
        {phone ? (
          <TrackedLink
            providerId={provider.id}
            eventType="call_click"
            href={`tel:${phone}`}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-[13px] font-black py-3"
            ariaLabel={`Call ${provider.name}`}
          >
            <Phone size={16} className="text-wellness-700" /> Call
          </TrackedLink>
        ) : (
          <Link
            href="#message"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-[13px] font-black py-3"
          >
            <MessageSquare size={16} className="text-wellness-700" /> Message
          </Link>
        )}
        {bookingUrl ? (
          <TrackedLink
            providerId={provider.id}
            eventType="book_click"
            href={bookHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-wellness-500 to-wellness-700 text-white text-[13px] font-black py-3 shadow-[0_10px_22px_-12px_rgba(13,148,136,0.7)]"
            ariaLabel={`Book at ${provider.name}`}
          >
            <CalendarCheck size={16} /> Book
          </TrackedLink>
        ) : (
          <Link
            href={bookHref}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-wellness-500 to-wellness-700 text-white text-[13px] font-black py-3 shadow-[0_10px_22px_-12px_rgba(13,148,136,0.7)]"
          >
            <CalendarCheck size={16} /> Book
          </Link>
        )}
      </div>
    </nav>
  );
}

export default PatientActionBar;
