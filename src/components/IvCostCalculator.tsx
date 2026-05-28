'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, Home, Info, Check } from 'lucide-react';
import {
  IV_COSTS, MOBILE_PREMIUM, MEMBERSHIP_DISCOUNT, PRICE_FACTORS, COST_METHODOLOGY, COST_SOURCES,
} from '../lib/iv-cost-data';

const EMERALD = '#0F6E56';
const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

export const IvCostCalculator = () => {
  const [slug, setSlug] = useState('myers');
  const [mobile, setMobile] = useState(false);

  const tx = useMemo(() => IV_COSTS.find((t) => t.slug === slug) || IV_COSTS[0], [slug]);

  const low = tx.low + (mobile ? MOBILE_PREMIUM.low : 0);
  const high = tx.high + (mobile ? MOBILE_PREMIUM.high : 0);
  const typical = tx.typical + (mobile ? (MOBILE_PREMIUM.low + MOBILE_PREMIUM.high) / 2 : 0);
  const memberLow = Math.round(typical * (1 - MEMBERSHIP_DISCOUNT.high));
  const memberHigh = Math.round(typical * (1 - MEMBERSHIP_DISCOUNT.low));

  return (
    <div className="space-y-8">
      {/* Treatment picker */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-3">Choose a treatment</div>
        <div className="flex flex-wrap gap-2">
          {IV_COSTS.map((t) => {
            const active = t.slug === slug;
            return (
              <button
                key={t.slug}
                type="button"
                onClick={() => setSlug(t.slug)}
                className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${
                  active
                    ? 'text-white border-transparent'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:text-emerald-700'
                }`}
                style={active ? { backgroundColor: EMERALD } : undefined}
              >
                {t.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/40 p-7 md:p-9">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
          <div>
            <h2 className="text-2xl font-black text-[#0A0B0D] tracking-tight">{tx.name}</h2>
            <p className="text-sm text-slate-500 mt-1 max-w-md leading-relaxed">{tx.blurb}</p>
          </div>
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 whitespace-nowrap">
            {tx.unit === 'shot' ? 'Per shot' : 'Per session'}
          </span>
        </div>

        {/* Range bar */}
        <div className="bg-[#F8F7F3] rounded-2xl p-6">
          <div className="flex items-baseline justify-center gap-2 mb-1">
            <span className="text-5xl font-black tracking-tight" style={{ color: EMERALD }}>{money(typical)}</span>
            <span className="text-sm font-bold text-slate-400">typical</span>
          </div>
          <div className="text-center text-sm font-semibold text-slate-500 mb-5">
            range {money(low)} – {money(high)}{mobile ? ' (incl. mobile visit)' : ''}
          </div>
          <div className="relative h-2 rounded-full bg-slate-200 overflow-hidden">
            <div className="absolute inset-y-0 rounded-full" style={{ left: '8%', right: '8%', backgroundColor: EMERALD, opacity: 0.25 }} />
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white shadow"
              style={{ left: `${Math.max(8, Math.min(92, ((typical - low) / Math.max(1, high - low)) * 84 + 8))}%`, backgroundColor: EMERALD }}
            />
          </div>
          <div className="flex justify-between text-xs font-bold text-slate-400 mt-2">
            <span>{money(low)}</span>
            <span>{money(high)}</span>
          </div>
        </div>

        {/* Modifiers */}
        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => setMobile((m) => !m)}
            className={`flex-1 flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
              mobile ? 'border-emerald-300 bg-emerald-50/60' : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${mobile ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
              {mobile ? <Check size={18} strokeWidth={3} /> : <Home size={18} />}
            </div>
            <div>
              <div className="font-bold text-slate-800 text-sm">At-home / mobile visit</div>
              <div className="text-xs text-slate-500">Adds ~${MOBILE_PREMIUM.low}–{MOBILE_PREMIUM.high} for concierge service</div>
            </div>
          </button>
          <div className="flex-1 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">%</div>
            <div>
              <div className="font-bold text-slate-800 text-sm">With a membership</div>
              <div className="text-xs text-slate-500">Regulars typically pay {money(memberLow)}–{money(memberHigh)} ({Math.round(MEMBERSHIP_DISCOUNT.low * 100)}–{Math.round(MEMBERSHIP_DISCOUNT.high * 100)}% less)</div>
            </div>
          </div>
        </div>

        {(tx.note || tx.medical) && (
          <div className={`mt-5 flex items-start gap-2.5 rounded-2xl p-4 text-sm ${tx.medical ? 'bg-amber-50 border border-amber-100 text-amber-800' : 'bg-slate-50 border border-slate-100 text-slate-600'}`}>
            <Info size={16} className="shrink-0 mt-0.5" />
            <span>{tx.note}</span>
          </div>
        )}

        <div className="mt-6">
          <Link href="/search" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black text-white text-sm" style={{ backgroundColor: EMERALD }}>
            Compare clinics near you <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Price factors */}
      <div>
        <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F6E56] mb-4">What moves the price</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PRICE_FACTORS.map((f) => (
            <div key={f.title} className="bg-white rounded-2xl border border-slate-200/70 p-5">
              <div className="font-bold text-slate-900 text-sm mb-1">{f.title}</div>
              <div className="text-sm text-slate-500 leading-relaxed">{f.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Methodology + sources */}
      <div className="bg-[#F8F7F3] rounded-3xl border border-slate-100 p-6 md:p-7">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-3">How we got these numbers</h3>
        <p className="text-sm text-slate-500 leading-relaxed mb-4">{COST_METHODOLOGY}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {COST_SOURCES.map((s) => (
            <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-slate-500 hover:text-[#0F6E56] underline underline-offset-2">
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};
