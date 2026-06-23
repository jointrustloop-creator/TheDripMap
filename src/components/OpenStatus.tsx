'use client';

import React, { useEffect, useState } from 'react';
import { getStatus, type StatusResult } from '../lib/hours';

/**
 * Live "Open now / Closed" status.
 *
 * Open/closed is time-sensitive, but provider pages and cards are statically
 * rendered + cached on the server — so a server-computed status FREEZES at
 * build/revalidate time and goes stale (a clinic shows "Open" hours after it has
 * actually closed). This computes the status in the browser at view time and
 * refreshes every minute, so it is always current.
 *
 * Renders its own dot + label (style via props) so it works from BOTH server and
 * client parents (no function children across the server/client boundary).
 * Hydration-safe: renders `fallback` until mounted, then swaps in the live value.
 */
export function OpenStatus({
  hours,
  timezone,
  className = 'inline-flex items-center gap-1.5',
  dotBaseClass = 'w-[7px] h-[7px] rounded-full inline-block shrink-0',
  openDotClass = 'bg-emerald-500',
  closedDotClass = 'bg-amber-500',
  unknownDotClass = 'bg-slate-300',
  textClass,
  openText = 'Open now',
  closedText = 'Closed',
  showDot = true,
  fallback = null,
}: {
  hours: Record<string, string> | undefined;
  timezone?: string;
  className?: string;
  dotBaseClass?: string;
  openDotClass?: string;
  closedDotClass?: string;
  unknownDotClass?: string;
  textClass?: string;
  openText?: string;
  closedText?: string;
  showDot?: boolean;
  fallback?: React.ReactNode;
}) {
  const [status, setStatus] = useState<StatusResult | null>(null);

  useEffect(() => {
    const tick = () => setStatus(getStatus(hours, timezone));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [hours, timezone]);

  if (!status) return <>{fallback}</>;

  const label = status.isOpen ? openText : status.known ? closedText : 'Hours not listed';
  const dot = status.isOpen ? openDotClass : status.known ? closedDotClass : unknownDotClass;

  return (
    <span className={className}>
      {showDot && <span className={`${dotBaseClass} ${dot}`} />}
      <span className={textClass}>{label}</span>
    </span>
  );
}

export default OpenStatus;
