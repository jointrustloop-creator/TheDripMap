/**
 * TransparencyPanel (Transparency Score, 2026-08)
 *
 * The 7 check panel on provider pages. Reads the STORED transparency_checks
 * (decision_drivers.manage, which the checks derive from, is stripped from the
 * public shape, so the panel cannot recompute). Reports disclosure facts only.
 *
 * Low scores render in a non shaming way: "This clinic has not yet disclosed X
 * of 7 transparency details" plus a claim CTA. No dashes, no medical claims,
 * never "directory".
 */
import React from 'react';
import Link from 'next/link';
import { Check, Circle, ShieldCheck, ArrowRight } from 'lucide-react';
import {
  TRANSPARENCY_TOTAL,
  TRANSPARENCY_TOOLTIP,
  type TransparencyCheck,
} from '../lib/transparency-score';

interface TransparencyPanelProps {
  score: number | null | undefined;
  checks: TransparencyCheck[] | null | undefined;
  isClaimed?: boolean;
  clinicName?: string;
}

export function TransparencyPanel({ score, checks, isClaimed, clinicName }: TransparencyPanelProps) {
  // Nothing computed yet (pre first recompute): render nothing rather than a
  // misleading zero.
  if (score == null || !Array.isArray(checks) || checks.length === 0) return null;

  const unmet = checks.filter((c) => !c.passed).length;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 md:p-7">
      <div className="flex items-center justify-between gap-4 mb-1">
        <h2 className="text-[19px] font-black text-slate-900 tracking-tight flex items-center gap-2">
          <ShieldCheck size={18} className="text-slate-400" />
          Transparency Score
        </h2>
        <span className="text-[15px] font-black text-slate-900 tabular-nums">
          {score}/{TRANSPARENCY_TOTAL}
        </span>
      </div>
      <p className="text-[12.5px] text-slate-500 leading-relaxed mb-5">
        {TRANSPARENCY_TOOLTIP}{' '}
        <Link href="/transparency" className="font-bold text-wellness-700 hover:underline">
          How this works
        </Link>
      </p>

      <ul className="space-y-2.5">
        {checks.map((c) => (
          <li key={c.key} className="flex items-center gap-2.5 text-[14px]">
            {c.passed ? (
              <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Check size={13} strokeWidth={3} />
              </span>
            ) : (
              <span className="w-5 h-5 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center shrink-0">
                <Circle size={9} />
              </span>
            )}
            <span className={c.passed ? 'text-slate-800 font-medium' : 'text-slate-400'}>{c.label}</span>
          </li>
        ))}
      </ul>

      {unmet > 0 && (
        <div className="mt-5 pt-5 border-t border-slate-100">
          <p className="text-[13px] text-slate-500 leading-relaxed">
            {clinicName || 'This clinic'} has not yet disclosed {unmet} of {TRANSPARENCY_TOTAL}{' '}
            transparency details.
            {!isClaimed && ' Own this clinic? Claiming is free and lets you complete these.'}
          </p>
          {!isClaimed && (
            <Link
              href="/for-clinics"
              className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-black text-wellness-700 hover:gap-2.5 transition-[gap]"
            >
              Claim this listing <ArrowRight size={14} />
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
