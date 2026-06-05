'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, Mail, Check, X, Link as LinkIcon, Trash2, Loader2, Send, Reply } from 'lucide-react';

export type BacklinkStatus =
  | 'researched'
  | 'drafted'
  | 'sent'
  | 'replied'
  | 'linked'
  | 'rejected';

export interface BacklinkRow {
  id: string;
  url: string;
  domain: string;
  target_type: string;
  page_title: string | null;
  contact_name: string | null;
  contact_email: string | null;
  article_to_pitch: string;
  reason: string;
  domain_authority: number | null;
  status: BacklinkStatus;
  researched_at: string | null;
  drafted_at: string | null;
  sent_at: string | null;
  linked_at: string | null;
}

const STATUS_TABS: BacklinkStatus[] = [
  'researched',
  'drafted',
  'sent',
  'replied',
  'linked',
  'rejected',
];

const TYPE_LABELS: Record<string, string> = {
  nursing_school: 'Nursing School',
  healthcare_law: 'Healthcare Law',
  wellness_publication: 'Wellness Pub',
  nurse_entrepreneur: 'Nurse Entrepreneur',
  medical_director_match: 'MD Match',
  nyc_wellness_blog: 'NYC Wellness Blog',
  nyc_fitness_studio: 'NYC Fitness Studio',
  nyc_hospitality_concierge: 'NYC Concierge',
  nyc_local_press: 'NYC Local Press',
  nyc_corporate_wellness: 'NYC Corp Wellness',
};

const STATUS_COLOR: Record<BacklinkStatus, string> = {
  researched: 'bg-slate-100 text-slate-700',
  drafted: 'bg-amber-100 text-amber-800',
  sent: 'bg-blue-100 text-blue-800',
  replied: 'bg-violet-100 text-violet-800',
  linked: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-rose-100 text-rose-800',
};

interface Props {
  initialRows: BacklinkRow[];
}

export function AdminBacklinksClient({ initialRows }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<BacklinkStatus>('drafted');
  const [pendingId, setPendingId] = useState<string | null>(null);

  const counts = STATUS_TABS.reduce<Record<string, number>>((acc, s) => {
    acc[s] = initialRows.filter((r) => r.status === s).length;
    return acc;
  }, {});

  const linkedTotal = counts.linked || 0;
  const sentTotal = (counts.sent || 0) + (counts.replied || 0) + (counts.linked || 0);

  const rows = initialRows.filter((r) => r.status === tab);

  async function act(id: string, action: string) {
    if (action === 'delete' && !confirm('Delete this backlink target permanently?')) return;
    setPendingId(id);
    try {
      const res = await fetch('/api/admin/backlinks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      if (!res.ok) {
        const out = await res.json().catch(() => ({}));
        alert(out.error || 'Action failed.');
        return;
      }
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  return (
    <>
      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">In pipeline</p>
          <p className="text-3xl font-black text-slate-900">{initialRows.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Drafts ready</p>
          <p className="text-3xl font-black text-amber-700">{counts.drafted || 0}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Sent total</p>
          <p className="text-3xl font-black text-blue-700">{sentTotal}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Links acquired</p>
          <p className="text-3xl font-black text-emerald-700">{linkedTotal}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all border-2 ${
              tab === s
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-900'
            }`}
          >
            {s} ({counts[s] || 0})
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <p className="text-slate-400 font-bold">No {tab} targets.</p>
          {tab === 'drafted' && (
            <p className="text-xs text-slate-400 mt-2">
              Open Gmail Drafts each morning to review and send these.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((r) => (
            <article
              key={r.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
            >
              <header className="flex items-start justify-between gap-4 mb-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${STATUS_COLOR[r.status]}`}
                    >
                      {r.status}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-widest">
                      {TYPE_LABELS[r.target_type] || r.target_type}
                    </span>
                    {typeof r.domain_authority === 'number' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                        DA {r.domain_authority}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">
                    {r.page_title || r.domain}
                  </h3>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-wellness-600 mt-1 break-all"
                  >
                    {r.url}
                    <ExternalLink size={11} />
                  </a>
                </div>
                <button
                  onClick={() => act(r.id, 'delete')}
                  disabled={pendingId === r.id}
                  className="text-slate-300 hover:text-rose-600 transition-colors p-2"
                  aria-label="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </header>

              <p className="text-sm text-slate-600 leading-relaxed mb-3">{r.reason}</p>

              <dl className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 text-xs">
                <div>
                  <dt className="font-black uppercase tracking-widest text-slate-400 mb-0.5">
                    Contact
                  </dt>
                  <dd className="text-slate-700 font-medium">
                    {r.contact_name || '—'}
                    {r.contact_email && (
                      <a
                        href={`mailto:${r.contact_email}`}
                        className="block text-wellness-700 font-bold hover:underline truncate"
                      >
                        {r.contact_email}
                      </a>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="font-black uppercase tracking-widest text-slate-400 mb-0.5">
                    Article
                  </dt>
                  <dd>
                    <a
                      href={`/blog/${r.article_to_pitch}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-wellness-700 font-bold hover:underline break-words"
                    >
                      /{r.article_to_pitch}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="font-black uppercase tracking-widest text-slate-400 mb-0.5">
                    Timestamps
                  </dt>
                  <dd className="text-slate-500 font-medium space-y-0.5">
                    {r.researched_at && (
                      <div>R {new Date(r.researched_at).toISOString().slice(0, 10)}</div>
                    )}
                    {r.drafted_at && (
                      <div>D {new Date(r.drafted_at).toISOString().slice(0, 10)}</div>
                    )}
                    {r.sent_at && <div>S {new Date(r.sent_at).toISOString().slice(0, 10)}</div>}
                    {r.linked_at && (
                      <div className="text-emerald-700 font-black">
                        L {new Date(r.linked_at).toISOString().slice(0, 10)}
                      </div>
                    )}
                  </dd>
                </div>
              </dl>

              {/* Quick actions per status */}
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
                {r.status === 'drafted' && (
                  <a
                    href="https://mail.google.com/mail/u/0/#drafts"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-black hover:bg-slate-700"
                  >
                    <Mail size={12} /> Open Gmail Drafts
                  </a>
                )}
                {(r.status === 'researched' || r.status === 'drafted') && (
                  <button
                    onClick={() => act(r.id, 'mark_sent')}
                    disabled={pendingId === r.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600 text-white text-xs font-black hover:bg-blue-500 disabled:opacity-50"
                  >
                    {pendingId === r.id ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                    Mark sent
                  </button>
                )}
                {r.status === 'sent' && (
                  <button
                    onClick={() => act(r.id, 'mark_replied')}
                    disabled={pendingId === r.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-600 text-white text-xs font-black hover:bg-violet-500 disabled:opacity-50"
                  >
                    <Reply size={12} /> Mark replied
                  </button>
                )}
                {(r.status === 'sent' || r.status === 'replied') && (
                  <button
                    onClick={() => act(r.id, 'mark_linked')}
                    disabled={pendingId === r.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-black hover:bg-emerald-500 disabled:opacity-50"
                  >
                    <LinkIcon size={12} /> Mark linked
                  </button>
                )}
                {r.status !== 'rejected' && r.status !== 'linked' && (
                  <button
                    onClick={() => act(r.id, 'mark_rejected')}
                    disabled={pendingId === r.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border-2 border-slate-200 text-slate-600 text-xs font-black hover:border-rose-300 hover:text-rose-700 disabled:opacity-50"
                  >
                    <X size={12} /> Reject
                  </button>
                )}
                {r.status === 'linked' && (
                  <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700">
                    <Check size={12} /> Link acquired
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
