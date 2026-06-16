// ClinicTrustBadge — the ONE trust signal every clinic-card surface uses.
//
// Gating (never inferred from is_claimed for the safety shield):
//   safety_verified === true        -> prominent "Safety verified" badge
//   claimed but not safety_verified -> quiet "Claimed" tag (no shield)
//   otherwise                        -> nothing
//
// Server-compatible (no hooks).

import React from 'react';
import { ShieldCheck, Check } from 'lucide-react';
import { isSafetyVerified, isClaimedState, type ClinicLike } from '../lib/clinic-media';
import { cn } from '../lib/utils';

interface ClinicTrustBadgeProps {
  provider: ClinicLike;
  className?: string;
}

export function ClinicTrustBadge({ provider, className }: ClinicTrustBadgeProps) {
  if (isSafetyVerified(provider)) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0F6E56] text-white text-[10px] font-black uppercase tracking-[0.08em] shadow-sm',
          className
        )}
      >
        <ShieldCheck size={11} strokeWidth={2.5} /> Safety verified
      </span>
    );
  }
  if (isClaimedState(provider)) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/95 text-slate-600 text-[10px] font-bold uppercase tracking-[0.08em] border border-slate-200 shadow-sm',
          className
        )}
      >
        <Check size={10} strokeWidth={2.5} /> Claimed
      </span>
    );
  }
  return null;
}
