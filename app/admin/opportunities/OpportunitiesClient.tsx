'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, RefreshCcw, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';

export interface OpportunityRow {
  clinicId: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  country: string;
  isClaimed: boolean;
  primaryType: string;
  types: string[];
  rating: number | null;
  reviewCount: number | null;
  photoCount: number | null;
  hasWebsite: boolean;
  hasPhone: boolean;
  hasHours: boolean;
  categoryGap: boolean;
  reviewsGap: boolean;
  photosGap: boolean;
  completenessGap: boolean;
  gapScore: number;
  tier: 'high' | 'medium' | 'low';
  gapList: string[];
  capturedAt: string;
}

export interface Summary {
  totalAnalyzed: number;
  needHelp: number;
  high: number;
  medium: number;
  low: number;
  canada: number;
  us: number;
  placesUnresolved: number;
}

type SortKey = 'gapScore' | 'name' | 'city' | 'reviewCount' | 'photoCount' | 'rating';

export function OpportunitiesClient({ rows, summary }: { rows: OpportunityRow[]; summary: Summary }) {
  const [country, setCountry] = useState<'all' | 'Canada' | 'United States'>('Canada');
  const [tier, setTier] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [claimedOnly, setClaimedOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('gapScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = rows;
    if (country !== 'all') list = list.filter((r) => r.country === country);
    if (tier !== 'all') list = list.filter((r) => r.tier === tier);
    if (claimedOnly) list = list.filter((r) => r.isClaimed);
    const dir = sortDir === 'desc' ? -1 : 1;
    list = [...list].sort((a, b) => {
      let av: number | string = 0;
      let bv: number | string = 0;
      switch (sortKey) {
        case 'gapScore': av = a.gapScore; bv = b.gapScore; break;
        case 'name': av = a.name.toLowerCase(); bv = b.name.toLowerCase(); break;
        case 'city': av = a.city.toLowerCase(); bv = b.city.toLowerCase(); break;
        case 'reviewCount': av = a.reviewCount ?? -1; bv = b.reviewCount ?? -1; break;
        case 'photoCount': av = a.photoCount ?? -1; bv = b.photoCount ?? -1; break;
        case 'rating': av = a.rating ?? -1; bv = b.rating ?? -1; break;
      }
      if (av < bv) return dir;
      if (av > bv) return -dir;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [rows, country, tier, claimedOnly, sortKey, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(k);
      setSortDir('desc');
    }
  };

  const refreshOne = async (slug: string) => {
    setRefreshing(slug);
    setRefreshMessage(null);
    try {
      const r = await fetch('/api/admin/gbp-snapshot-refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });
      const data = await r.json();
      if (!r.ok) {
        setRefreshMessage(`Refresh failed for ${slug}: ${data.error || r.status}`);
      } else {
        setRefreshMessage(`Refreshed ${slug}. ${data.placesCallsUsed} Places call(s). New tier: ${data.gaps?.tier}, score ${data.gaps?.gap_score}. Reload to see updated row.`);
      }
    } catch (err) {
      setRefreshMessage(`Refresh failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setRefreshing(null);
    }
  };

  const generateKit = (slug: string) => {
    const url = `/admin/tools#kit-${slug}`;
    window.open(url, '_blank');
  };

  return (
    <>
      {/* Summary strip */}
      <section className="grid grid-cols-2 md:grid-cols-7 gap-3 mb-8">
        <SummaryCard label="Analyzed" value={summary.totalAnalyzed} />
        <SummaryCard label="Need help" value={summary.needHelp} tone="amber" />
        <SummaryCard label="High" value={summary.high} tone="rose" />
        <SummaryCard label="Medium" value={summary.medium} tone="amber" />
        <SummaryCard label="Low" value={summary.low} tone="emerald" />
        <SummaryCard label="Canada" value={summary.canada} />
        <SummaryCard label="United States" value={summary.us} />
      </section>

      {/* Filters */}
      <section className="bg-white rounded-2xl border border-slate-200 p-4 mb-4 flex flex-wrap items-center gap-3">
        <FilterPill label="Country">
          <select value={country} onChange={(e) => setCountry(e.target.value as 'all' | 'Canada' | 'United States')} className="bg-transparent text-sm font-bold text-slate-900 focus:outline-none">
            <option value="Canada">Canada first</option>
            <option value="United States">United States</option>
            <option value="all">All</option>
          </select>
        </FilterPill>
        <FilterPill label="Tier">
          <select value={tier} onChange={(e) => setTier(e.target.value as 'all' | 'high' | 'medium' | 'low')} className="bg-transparent text-sm font-bold text-slate-900 focus:outline-none">
            <option value="all">All</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </FilterPill>
        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer ml-2">
          <input type="checkbox" checked={claimedOnly} onChange={(e) => setClaimedOnly(e.target.checked)} className="rounded" />
          Claimed only
        </label>
        <div className="ml-auto text-xs font-bold text-slate-500 uppercase tracking-widest">
          Showing {filtered.length} of {rows.length}
        </div>
      </section>

      {refreshMessage && (
        <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 mb-4 text-sm text-slate-700 font-medium">
          {refreshMessage}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <Th label="Clinic" sortKey="name" current={sortKey} dir={sortDir} onSort={toggleSort} />
              <Th label="City" sortKey="city" current={sortKey} dir={sortDir} onSort={toggleSort} />
              <th className="text-left py-3 px-3 text-xs font-black uppercase tracking-widest text-slate-500">Claimed</th>
              <th className="text-left py-3 px-3 text-xs font-black uppercase tracking-widest text-slate-500">Primary category</th>
              <Th label="Rating" sortKey="rating" current={sortKey} dir={sortDir} onSort={toggleSort} />
              <Th label="Reviews" sortKey="reviewCount" current={sortKey} dir={sortDir} onSort={toggleSort} />
              <Th label="Photos" sortKey="photoCount" current={sortKey} dir={sortDir} onSort={toggleSort} />
              <th className="text-left py-3 px-3 text-xs font-black uppercase tracking-widest text-slate-500">Complete</th>
              <th className="text-left py-3 px-3 text-xs font-black uppercase tracking-widest text-slate-500">Gaps</th>
              <Th label="Score" sortKey="gapScore" current={sortKey} dir={sortDir} onSort={toggleSort} />
              <th className="text-left py-3 px-3 text-xs font-black uppercase tracking-widest text-slate-500">Tier</th>
              <th className="text-left py-3 px-3 text-xs font-black uppercase tracking-widest text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.clinicId} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-2.5 px-3 font-bold text-slate-900">
                  <Link href={`/providers/${r.slug}`} target="_blank" className="hover:text-wellness-600">{r.name}</Link>
                </td>
                <td className="py-2.5 px-3 text-slate-700">{r.city}{r.state ? ', ' + r.state : ''}</td>
                <td className="py-2.5 px-3">
                  <span className={r.isClaimed ? 'inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100' : 'text-xs font-bold text-slate-400'}>
                    {r.isClaimed ? 'Claimed' : 'Unclaimed'}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <span className={r.categoryGap ? 'text-rose-700 font-bold' : 'text-slate-700'}>
                    {r.primaryType || '?'}
                    {r.categoryGap && <span className="ml-1.5 text-[10px] font-black uppercase">gap</span>}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-slate-700">{r.rating ?? '-'}</td>
                <td className={'py-2.5 px-3 ' + (r.reviewsGap ? 'text-rose-700 font-bold' : 'text-slate-700')}>{r.reviewCount ?? '-'}</td>
                <td className={'py-2.5 px-3 ' + (r.photosGap ? 'text-rose-700 font-bold' : 'text-slate-700')}>{r.photoCount ?? '-'}</td>
                <td className="py-2.5 px-3 text-xs">
                  <span className={r.hasWebsite ? 'text-emerald-700' : 'text-rose-700 font-bold'}>W{r.hasWebsite ? '✓' : '✗'}</span>{' '}
                  <span className={r.hasPhone ? 'text-emerald-700' : 'text-rose-700 font-bold'}>P{r.hasPhone ? '✓' : '✗'}</span>{' '}
                  <span className={r.hasHours ? 'text-emerald-700' : 'text-rose-700 font-bold'}>H{r.hasHours ? '✓' : '✗'}</span>
                </td>
                <td className="py-2.5 px-3 text-xs text-slate-600 font-medium">{r.gapList.length > 0 ? r.gapList.join(', ') : '-'}</td>
                <td className="py-2.5 px-3 font-black text-slate-900">{r.gapScore}</td>
                <td className="py-2.5 px-3">
                  <TierBadge tier={r.tier} />
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => refreshOne(r.slug)}
                      disabled={refreshing === r.slug}
                      title="Refresh Places data for this clinic"
                      className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-900 disabled:opacity-50 px-2 py-1 rounded-md hover:bg-slate-100"
                    >
                      {refreshing === r.slug ? <Loader2 size={12} className="animate-spin" /> : <RefreshCcw size={12} />}
                      Refresh
                    </button>
                    <button
                      type="button"
                      onClick={() => generateKit(r.slug)}
                      title="Open the Generate Kit card on /admin/tools, prefilled"
                      className="inline-flex items-center gap-1 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 px-2 py-1 rounded-md"
                    >
                      <Sparkles size={12} />
                      Generate kit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-10 text-center text-sm text-slate-500 font-medium">
            No clinics match the current filters.
          </div>
        )}
      </div>
    </>
  );
}

function Th({ label, sortKey, current, dir, onSort }: { label: string; sortKey: SortKey; current: SortKey; dir: 'asc' | 'desc'; onSort: (k: SortKey) => void }) {
  const isActive = current === sortKey;
  return (
    <th className="text-left py-3 px-3 text-xs font-black uppercase tracking-widest text-slate-500">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={'inline-flex items-center gap-1 ' + (isActive ? 'text-slate-900' : 'hover:text-slate-700')}
      >
        {label}
        {isActive && (dir === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}
      </button>
    </th>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone?: 'rose' | 'amber' | 'emerald' }) {
  const toneCls =
    tone === 'rose' ? 'bg-rose-50 text-rose-900 border-rose-100' :
    tone === 'amber' ? 'bg-amber-50 text-amber-900 border-amber-100' :
    tone === 'emerald' ? 'bg-emerald-50 text-emerald-900 border-emerald-100' :
    'bg-white text-slate-900 border-slate-200';
  return (
    <div className={'rounded-2xl border p-4 ' + toneCls}>
      <div className="text-2xl font-black tracking-tight">{value.toLocaleString()}</div>
      <div className="text-[10px] font-black uppercase tracking-[0.15em] mt-1 opacity-70">{label}</div>
    </div>
  );
}

function FilterPill({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 bg-slate-100 rounded-full pl-3 pr-2 py-1.5">
      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">{label}</span>
      {children}
    </div>
  );
}

function TierBadge({ tier }: { tier: 'high' | 'medium' | 'low' }) {
  const cls =
    tier === 'high' ? 'bg-rose-100 text-rose-800 border-rose-200' :
    tier === 'medium' ? 'bg-amber-100 text-amber-800 border-amber-200' :
    'bg-emerald-100 text-emerald-800 border-emerald-200';
  return (
    <span className={'text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ' + cls}>
      {tier}
    </span>
  );
}
