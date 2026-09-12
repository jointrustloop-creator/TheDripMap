/**
 * ListingReachTracker (Demand Pulse, phase 0)
 *
 * Records which sections of a listing a visitor actually reached: prices,
 * hours, care team, booking. That is the "where you lost them" line of the
 * Pulse ("6 of 9 left at the prices section"). Sections are marked in the
 * layout with data-reach="prices|hours|practitioner|book"; each fires at most
 * once per provider per tab session, when at least a third of it is visible.
 * Renders nothing. Never throws.
 */
'use client';

import { useEffect } from 'react';
import { trackIntentOnce } from '../lib/analytics-client';
import type { IntentKind } from '../lib/intent';

const KIND_FOR: Record<string, IntentKind> = {
  prices: 'reach_prices',
  hours: 'reach_hours',
  practitioner: 'reach_practitioner',
  book: 'reach_book',
};

export default function ListingReachTracker({ providerId }: { providerId: string }) {
  useEffect(() => {
    if (!providerId || typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reach]'));
    if (!nodes.length) return;
    const seen = new Set<string>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const section = (e.target as HTMLElement).dataset.reach || '';
        const kind = KIND_FOR[section];
        if (!kind || seen.has(section)) continue;
        seen.add(section);
        trackIntentOnce(`reach_${providerId}_${section}`, providerId, kind);
        io.unobserve(e.target);
      }
    }, { threshold: 0.34 });
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [providerId]);
  return null;
}
