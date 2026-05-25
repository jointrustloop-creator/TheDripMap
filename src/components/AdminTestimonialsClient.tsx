'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Star, Check, X, Trash2, ExternalLink, Loader2 } from 'lucide-react';

interface TestimonialRow {
  id: string;
  provider_id: string;
  author_name: string;
  author_email: string;
  rating: number;
  title: string | null;
  body: string;
  visit_date: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  provider?: { name: string; slug: string; city: string } | null;
}

const TABS: Array<TestimonialRow['status']> = ['pending', 'approved', 'rejected'];

export function AdminTestimonialsClient({ initialRows }: { initialRows: TestimonialRow[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<TestimonialRow['status']>('pending');
  const [pendingId, setPendingId] = useState<string | null>(null);

  const rows = initialRows.filter((r) => r.status === tab);

  const act = async (id: string, action: 'approve' | 'reject' | 'delete') => {
    if (action === 'delete' && !confirm('Permanently delete this testimonial?')) return;
    setPendingId(id);
    try {
      const res = await fetch('/api/admin/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      if (!res.ok) {
        const result = await res.json().catch(() => ({}));
        alert(result.error || 'Action failed.');
        return;
      }
      router.refresh();
    } finally {
      setPendingId(null);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all border-2 ${
              tab === t
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-900'
            }`}
          >
            {t} ({initialRows.filter((r) => r.status === t).length})
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <p className="text-slate-400 font-bold">No {tab} testimonials.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((r) => (
            <article
              key={r.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={14}
                        fill={n <= r.rating ? 'currentColor' : 'none'}
                        className={n <= r.rating ? 'text-amber-500' : 'text-slate-200'}
                      />
                    ))}
                    <span className="text-xs font-bold text-slate-500 ml-1">
                      {r.rating} / 5
                    </span>
                  </div>
                  {r.title && (
                    <h3 className="text-lg font-black text-slate-900 mb-1 tracking-tight">
                      &ldquo;{r.title}&rdquo;
                    </h3>
                  )}
                  <div className="text-xs font-bold text-slate-500">
                    <span className="text-slate-900">{r.author_name}</span>
                    <span className="mx-1 text-slate-300">·</span>
                    <span>{r.author_email}</span>
                    {r.visit_date && (
                      <>
                        <span className="mx-1 text-slate-300">·</span>
                        <span>visited {r.visit_date}</span>
                      </>
                    )}
                    <span className="mx-1 text-slate-300">·</span>
                    <span>{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  {r.provider && (
                    <div className="mt-2">
                      <Link
                        href={`/providers/${r.provider.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs font-black text-wellness-600 hover:text-wellness-700"
                      >
                        {r.provider.name} · {r.provider.city}
                        <ExternalLink size={11} />
                      </Link>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {r.status === 'pending' && (
                    <>
                      <button
                        disabled={pendingId === r.id}
                        onClick={() => act(r.id, 'approve')}
                        className="inline-flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-700 transition-all disabled:opacity-50"
                      >
                        {pendingId === r.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={14} />}
                        Approve
                      </button>
                      <button
                        disabled={pendingId === r.id}
                        onClick={() => act(r.id, 'reject')}
                        className="inline-flex items-center gap-1.5 bg-white border-2 border-rose-200 text-rose-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-rose-50 transition-all disabled:opacity-50"
                      >
                        <X size={14} /> Reject
                      </button>
                    </>
                  )}
                  {r.status === 'approved' && (
                    <button
                      disabled={pendingId === r.id}
                      onClick={() => act(r.id, 'reject')}
                      className="inline-flex items-center gap-1.5 bg-white border-2 border-amber-200 text-amber-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-amber-50 transition-all disabled:opacity-50"
                    >
                      <X size={14} /> Unpublish
                    </button>
                  )}
                  {r.status === 'rejected' && (
                    <button
                      disabled={pendingId === r.id}
                      onClick={() => act(r.id, 'approve')}
                      className="inline-flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-700 transition-all disabled:opacity-50"
                    >
                      <Check size={14} /> Reinstate
                    </button>
                  )}
                  <button
                    disabled={pendingId === r.id}
                    onClick={() => act(r.id, 'delete')}
                    className="w-9 h-9 rounded-xl border-2 border-slate-200 text-slate-400 hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-all disabled:opacity-50"
                    aria-label="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 rounded-xl p-4 border border-slate-100">
                {r.body}
              </p>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
