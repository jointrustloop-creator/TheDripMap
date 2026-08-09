/**
 * TransparencyChip (Transparency Score, 2026-08)
 *
 * Compact "5/7 Transparency" chip for city page clinic cards and match
 * results. Server safe (no client JS): the tooltip uses the native title
 * attribute so it works inside server-rendered cards. Reads the stored score
 * only; renders nothing when the score has not been computed yet.
 *
 * Reports disclosure, never quality. No dashes, no medical claims.
 */
import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { TRANSPARENCY_TOTAL, TRANSPARENCY_TOOLTIP } from '../lib/transparency-score';

export function TransparencyChip({
  score,
  className = '',
}: {
  score: number | null | undefined;
  className?: string;
}) {
  if (score == null || Number.isNaN(score)) return null;
  return (
    <span
      title={TRANSPARENCY_TOOLTIP}
      className={`inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-[11px] font-bold ${className}`}
    >
      <ShieldCheck size={11} className="text-slate-400" />
      {score}/{TRANSPARENCY_TOTAL} Transparency
    </span>
  );
}
