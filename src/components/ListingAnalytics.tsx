/**
 * ListingAnalytics
 *
 * Fires a single 'view' event per provider per session, deduped by a
 * 30-minute TTL in sessionStorage so refreshes / back-button bounces
 * don't inflate the count. Renders nothing — it's a side-effect-only
 * client component dropped into both the claimed and unclaimed render
 * paths of /providers/[slug].
 */
'use client';

import { useEffect } from 'react';
import { trackEvent } from '../lib/analytics-client';

const TTL_MS = 30 * 60 * 1000; // 30 minutes

interface Props {
  providerId: string;
}

export default function ListingAnalytics({ providerId }: Props) {
  useEffect(() => {
    if (!providerId) return;
    if (typeof window === 'undefined') return;

    const key = `tdm_viewed_${providerId}`;
    try {
      const raw = window.sessionStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as { ts?: number };
        if (parsed && typeof parsed.ts === 'number' && Date.now() - parsed.ts < TTL_MS) {
          // Already counted this provider in the last 30 minutes for
          // this session — skip.
          return;
        }
      }
      window.sessionStorage.setItem(key, JSON.stringify({ ts: Date.now() }));
    } catch {
      // sessionStorage can throw in private-mode Safari and embedded
      // webviews. If it does, just fire the event — at worst we
      // slightly over-count for one user.
    }

    trackEvent(providerId, 'view');
  }, [providerId]);

  return null;
}
