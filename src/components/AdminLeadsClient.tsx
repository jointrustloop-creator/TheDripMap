'use client';

import React, { useMemo, useState } from 'react';
import { Mail, Phone, MapPin, MessageSquare, UserCheck, Heart, Send, Download, Search, Sparkles } from 'lucide-react';
import type { LeadRow } from '../../app/admin/leads/page';

const TAB_LABELS: Record<LeadRow['source'], { label: string; icon: React.ReactNode }> = {
  upgrade: { label: 'Upgrade requests', icon: <Sparkles size={14} /> },
  claim: { label: 'Claim requests', icon: <UserCheck size={14} /> },
  'message-clinic': { label: 'Message clinic', icon: <MessageSquare size={14} /> },
  contact: { label: 'Contact form', icon: <Mail size={14} /> },
  subscribe: { label: 'Subscribers', icon: <Send size={14} /> },
  testimonial: { label: 'Testimonials', icon: <Heart size={14} /> },
};

const TABS: Array<'all' | LeadRow['source']> = ['all', 'upgrade', 'claim', 'message-clinic', 'contact', 'subscribe', 'testimonial'];

interface Props {
  initialLeads: LeadRow[];
  counts: Record<LeadRow['source'], number>;
}

export function AdminLeadsClient({ initialLeads, counts }: Props) {
  const [tab, setTab] = useState<'all' | LeadRow['source']>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    let rows = tab === 'all' ? initialLeads : initialLeads.filter((l) => l.source === tab);
    if (query.trim()) {
      const q = query.toLowerCase();
      rows = rows.filter((l) =>
        (l.email || '').toLowerCase().includes(q) ||
        (l.name || '').toLowerCase().includes(q) ||
        (l.message || '').toLowerCase().includes(q)
      );
    }
    return rows;
  }, [tab, query, initialLeads]);

  const exportCsv = () => {
    const header = 'created_at,source,name,email,phone,message\n';
    const rows = filtered.map((l) => {
      const phone = (l.meta?.phone as string) || '';
      const escape = (v: string) => `"${String(v || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;
      return [l.created_at, l.source, escape(l.name), escape(l.email), escape(phone), escape(l.message)].join(',');
    }).join('\n');
    const csv = header + rows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `thedripmap-leads-${tab}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Tabs */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {TABS.map((t) => {
          const total = t === 'all' ? initialLeads.length : counts[t as LeadRow['source']];
          const meta = t === 'all' ? null : TAB_LABELS[t as LeadRow['source']];
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all border-2 ${
                tab === t
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-900'
              }`}
            >
              {meta?.icon}
              {t === 'all' ? 'All' : meta?.label} ({total})
            </button>
          );
        })}
      </div>

      {/* Search + export */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, message…"
            className="w-full pl-10 pr-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-slate-900 placeholder:text-slate-400"
          />
        </div>
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-1.5 bg-white border-2 border-slate-200 hover:border-slate-900 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider"
        >
          <Download size={12} /> Export CSV ({filtered.length})
        </button>
      </div>

      {/* Rows */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <p className="text-slate-400 font-bold text-sm">
            No leads in this view.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((l) => (
            <LeadCard key={`${l.source}-${l.id}`} lead={l} />
          ))}
        </div>
      )}
    </>
  );
}

function LeadCard({ lead }: { lead: LeadRow }) {
  const meta = TAB_LABELS[lead.source];
  const phone = (lead.meta?.phone as string) || null;
  const status = (lead.meta?.status as string) || null;
  const rating = lead.meta?.rating as number | undefined;
  const listingId = (lead.meta?.listing_id as string) || null;

  // Strip the marker prefixes for cleaner display
  let body = lead.message;
  if (body.startsWith('[SUBSCRIBE] ')) body = body.slice('[SUBSCRIBE] '.length);
  if (body.startsWith('[Lead for ')) {
    const close = body.indexOf('] ');
    if (close > 0) body = body.slice(close + 2);
  }

  return (
    <article className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
            lead.source === 'upgrade' ? 'bg-amber-100 text-amber-800 border-amber-200 ring-2 ring-amber-200' :
            lead.source === 'claim' ? 'bg-amber-50 text-amber-700 border-amber-100' :
            lead.source === 'testimonial' ? 'bg-rose-50 text-rose-700 border-rose-100' :
            lead.source === 'message-clinic' ? 'bg-wellness-50 text-wellness-700 border-wellness-100' :
            lead.source === 'subscribe' ? 'bg-violet-50 text-violet-700 border-violet-100' :
            'bg-slate-100 text-slate-700 border-slate-200'
          }`}>
            {meta.icon} {meta.label}
          </span>
          {status && (
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              status: {status}
            </span>
          )}
          {rating !== undefined && (
            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
              {rating}/5★
            </span>
          )}
        </div>
        <time className="text-[11px] font-bold text-slate-400 shrink-0">
          {new Date(lead.created_at).toLocaleString()}
        </time>
      </div>

      <div>
        <div className="text-sm font-black text-slate-900">{lead.name}</div>
        <div className="text-xs font-bold text-slate-500 flex items-center flex-wrap gap-x-3 gap-y-1 mt-1">
          <a href={`mailto:${lead.email}`} className="hover:text-wellness-600 inline-flex items-center gap-1">
            <Mail size={11} /> {lead.email}
          </a>
          {phone && (
            <a href={`tel:${phone}`} className="hover:text-wellness-600 inline-flex items-center gap-1">
              <Phone size={11} /> {phone}
            </a>
          )}
          {listingId && (
            <span className="inline-flex items-center gap-1 text-slate-400">
              <MapPin size={11} /> listing: {listingId.slice(0, 8)}…
            </span>
          )}
        </div>
      </div>

      <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-3 border border-slate-100 whitespace-pre-line">
        {body}
      </p>
    </article>
  );
}
