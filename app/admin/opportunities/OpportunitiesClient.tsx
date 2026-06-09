'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, Sparkles, Save, Flame } from 'lucide-react';

export type OutreachStatus =
  | 'not_contacted'
  | 'pitched'
  | 'replied'
  | 'sold'
  | 'declined'
  | 'not_a_fit';

const STATUS_LABELS: Record<OutreachStatus, string> = {
  not_contacted: 'Not contacted',
  pitched: 'Pitched',
  replied: 'Replied',
  sold: 'Sold',
  declined: 'Declined',
  not_a_fit: 'Not a fit',
};

export interface OpportunityRow {
  id: string;
  clinicId: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  country: string;
  isClaimed: boolean;
  email: string;
  warm: boolean;
  gaps: string[];
  recommendation: 'yes' | 'no' | 'maybe';
  outreachStatus: OutreachStatus;
  lastContactedAt: string | null;
  notes: string;
  assessedAt: string;
}

export interface Summary {
  total: number;
  notContacted: number;
  pitched: number;
  replied: number;
  sold: number;
  declined: number;
  notAFit: number;
  warmWithGap: number;
}

export function OpportunitiesClient({ rows: initialRows, summary: initialSummary }: { rows: OpportunityRow[]; summary: Summary }) {
  const [rows, setRows] = useState<OpportunityRow[]>(initialRows);
  const [country, setCountry] = useState<'all' | 'Canada' | 'United States'>('Canada');
  const [statusFilter, setStatusFilter] = useState<'all' | OutreachStatus>('all');
  const [warmOnly, setWarmOnly] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = rows;
    if (country !== 'all') list = list.filter((r) => r.country === country);
    if (statusFilter !== 'all') list = list.filter((r) => r.outreachStatus === statusFilter);
    if (warmOnly) list = list.filter((r) => r.warm);
    // Sort: warm + has gap first, then warm, then gaps count, then name.
    return [...list].sort((a, b) => {
      const aReady = a.warm && a.gaps.length > 0 ? 0 : 1;
      const bReady = b.warm && b.gaps.length > 0 ? 0 : 1;
      if (aReady !== bReady) return aReady - bReady;
      if (a.warm !== b.warm) return a.warm ? -1 : 1;
      if (b.gaps.length !== a.gaps.length) return b.gaps.length - a.gaps.length;
      return a.name.localeCompare(b.name);
    });
  }, [rows, country, statusFilter, warmOnly]);

  const summary: Summary = useMemo(() => ({
    total: rows.length,
    notContacted: rows.filter((r) => r.outreachStatus === 'not_contacted').length,
    pitched: rows.filter((r) => r.outreachStatus === 'pitched').length,
    replied: rows.filter((r) => r.outreachStatus === 'replied').length,
    sold: rows.filter((r) => r.outreachStatus === 'sold').length,
    declined: rows.filter((r) => r.outreachStatus === 'declined').length,
    notAFit: rows.filter((r) => r.outreachStatus === 'not_a_fit').length,
    warmWithGap: rows.filter((r) => r.warm && r.gaps.length > 0).length,
  }), [rows]);

  const updateLocal = (id: string, patch: Partial<OpportunityRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const saveRow = async (row: OpportunityRow) => {
    setSaving(row.id);
    setSaveMessage(null);
    try {
      const r = await fetch('/api/admin/opportunity-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: row.id,
          outreach_status: row.outreachStatus,
          last_contacted_at: row.lastContactedAt,
          notes: row.notes,
        }),
      });
      const data = await r.json();
      if (!r.ok) setSaveMessage('Save failed: ' + (data.error || r.status));
      else setSaveMessage('Saved ' + row.name + '.');
    } catch (err) {
      setSaveMessage('Save failed: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(null);
    }
  };

  const generateKit = (slug: string) => {
    window.open('/admin/tools#kit-' + slug, '_blank');
  };

  return (
    <>
      {/* Funnel summary */}
      <section className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
        <SummaryCard label="Total" value={summary.total} />
        <SummaryCard label="Not contacted" value={summary.notContacted} />
        <SummaryCard label="Pitched" value={summary.pitched} tone="amber" />
        <SummaryCard label="Replied" value={summary.replied} tone="amber" />
        <SummaryCard label="Sold" value={summary.sold} tone="emerald" />
        <SummaryCard label="Warm with gap" value={summary.warmWithGap} tone="rose" />
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
        <FilterPill label="Status">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | OutreachStatus)} className="bg-transparent text-sm font-bold text-slate-900 focus:outline-none">
            <option value="all">All</option>
            {(Object.keys(STATUS_LABELS) as OutreachStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </FilterPill>
        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer ml-2">
          <input type="checkbox" checked={warmOnly} onChange={(e) => setWarmOnly(e.target.checked)} className="rounded" />
          Warm only
        </label>
        <div className="ml-auto text-xs font-bold text-slate-500 uppercase tracking-widest">
          Showing {filtered.length} of {rows.length}
        </div>
      </section>

      {saveMessage && (
        <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 mb-4 text-sm text-slate-700 font-medium">
          {saveMessage}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-3 text-xs font-black uppercase tracking-widest text-slate-500">Clinic</th>
              <th className="text-left py-3 px-3 text-xs font-black uppercase tracking-widest text-slate-500">City</th>
              <th className="text-left py-3 px-3 text-xs font-black uppercase tracking-widest text-slate-500">Email</th>
              <th className="text-left py-3 px-3 text-xs font-black uppercase tracking-widest text-slate-500">Warm</th>
              <th className="text-left py-3 px-3 text-xs font-black uppercase tracking-widest text-slate-500">Gaps</th>
              <th className="text-left py-3 px-3 text-xs font-black uppercase tracking-widest text-slate-500">Status</th>
              <th className="text-left py-3 px-3 text-xs font-black uppercase tracking-widest text-slate-500">Last contacted</th>
              <th className="text-left py-3 px-3 text-xs font-black uppercase tracking-widest text-slate-500">Notes</th>
              <th className="text-left py-3 px-3 text-xs font-black uppercase tracking-widest text-slate-500">Assessed</th>
              <th className="text-left py-3 px-3 text-xs font-black uppercase tracking-widest text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50 align-top">
                <td className="py-2.5 px-3 font-bold text-slate-900">
                  <Link href={`/providers/${r.slug}`} target="_blank" className="hover:text-wellness-600">{r.name}</Link>
                </td>
                <td className="py-2.5 px-3 text-slate-700">{r.city}{r.state ? ', ' + r.state : ''}</td>
                <td className="py-2.5 px-3 text-slate-700 text-xs font-mono break-all">{r.email || '(none)'}</td>
                <td className="py-2.5 px-3">
                  {r.warm ? <Flame size={16} className="text-rose-600" /> : <span className="text-slate-300 text-xs">cold</span>}
                </td>
                <td className="py-2.5 px-3 max-w-xs">
                  {r.gaps.length === 0 ? <span className="text-slate-400 text-xs">no gaps</span> : (
                    <ul className="text-xs text-slate-700 font-medium space-y-0.5">
                      {r.gaps.slice(0, 4).map((g, i) => <li key={i}>{g}</li>)}
                    </ul>
                  )}
                </td>
                <td className="py-2.5 px-3">
                  <select
                    value={r.outreachStatus}
                    onChange={(e) => updateLocal(r.id, { outreachStatus: e.target.value as OutreachStatus })}
                    className="text-xs font-bold border border-slate-200 rounded-lg px-2 py-1 bg-white"
                  >
                    {(Object.keys(STATUS_LABELS) as OutreachStatus[]).map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </td>
                <td className="py-2.5 px-3">
                  <input
                    type="date"
                    value={r.lastContactedAt || ''}
                    onChange={(e) => updateLocal(r.id, { lastContactedAt: e.target.value || null })}
                    className="text-xs font-medium border border-slate-200 rounded-lg px-2 py-1 bg-white"
                  />
                </td>
                <td className="py-2.5 px-3 max-w-xs">
                  <textarea
                    value={r.notes}
                    onChange={(e) => updateLocal(r.id, { notes: e.target.value })}
                    rows={2}
                    className="text-xs w-full font-medium border border-slate-200 rounded-lg px-2 py-1 bg-white resize-y min-w-[160px]"
                    placeholder="notes"
                  />
                </td>
                <td className="py-2.5 px-3 text-xs text-slate-500 font-medium whitespace-nowrap">
                  {new Date(r.assessedAt).toISOString().slice(0, 10)}
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => saveRow(r)}
                      disabled={saving === r.id}
                      className="inline-flex items-center gap-1 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 px-2 py-1 rounded-md"
                    >
                      {saving === r.id ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => generateKit(r.slug)}
                      title="Open the Generate Kit card on /admin/tools, prefilled"
                      className="inline-flex items-center gap-1 text-xs font-bold bg-wellness-600 text-white hover:bg-wellness-700 px-2 py-1 rounded-md"
                    >
                      <Sparkles size={12} />
                      Kit
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
