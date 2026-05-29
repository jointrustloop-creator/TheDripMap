import React from 'react';

const FEEDBACK_TOOLTIP =
  'This tool is in beta. Results may vary. Send feedback to info@thedripmap.com';

/**
 * Small amber "BETA" pill for in-progress tools.
 * Server-safe (no hooks). Pass an optional className to tweak placement.
 */
export function BetaBadge({ className = '' }: { className?: string }) {
  return (
    <span
      title={FEEDBACK_TOOLTIP}
      className={`inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide align-middle ${className}`}
    >
      BETA
    </span>
  );
}

export default BetaBadge;
