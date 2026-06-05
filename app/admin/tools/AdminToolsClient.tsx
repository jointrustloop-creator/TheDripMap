'use client';

import React, { useState } from 'react';
import { Loader2, Mail, Star } from 'lucide-react';

type RegenerateRecipient = {
  email: string;
  brand: string;
  city?: string | null;
  country?: string | null;
  locations: number;
};
type RegenerateResponse = {
  ok: boolean;
  mode: string;
  drafted?: number;
  failed?: number;
  failures?: { email: string; error: string }[];
  recipients?: RegenerateRecipient[];
  message?: string;
  error?: string;
};

type RefreshUpdatedRow = {
  slug: string;
  name: string;
  oldRating: number | null;
  newRating: number | null;
  oldReviews: number | null;
  newReviews: number | null;
  status: 'updated' | 'no_change';
};
type RefreshResponse = {
  ok: boolean;
  dryRun?: boolean;
  totalProviders?: number;
  totalUpdated?: number;
  totalFailed?: number;
  updated?: RefreshUpdatedRow[];
  failed?: { slug: string; name: string; reason: string }[];
  error?: string;
};

type ButtonState<T> = {
  loading: boolean;
  result: T | null;
  error: string | null;
};

function Card({ title, description, icon, children }: { title: string; description: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 mb-6 shadow-sm">
      <div className="flex items-start gap-4 mb-5">
        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">{title}</h2>
          <p className="text-sm text-slate-500 font-medium mt-0.5">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export function AdminToolsClient() {
  const [draftsState, setDraftsState] = useState<ButtonState<RegenerateResponse>>({ loading: false, result: null, error: null });
  const [ratingsState, setRatingsState] = useState<ButtonState<RefreshResponse>>({ loading: false, result: null, error: null });

  const generateDrafts = async () => {
    setDraftsState({ loading: true, result: null, error: null });
    try {
      const r = await fetch('/api/admin/regenerate-outreach?mode=next&limit=10', { method: 'POST' });
      const data = (await r.json()) as RegenerateResponse;
      if (!r.ok) {
        setDraftsState({ loading: false, result: null, error: data.error || `HTTP ${r.status}` });
      } else {
        setDraftsState({ loading: false, result: data, error: null });
      }
    } catch (err) {
      setDraftsState({ loading: false, result: null, error: err instanceof Error ? err.message : String(err) });
    }
  };

  const refreshRatings = async () => {
    setRatingsState({ loading: true, result: null, error: null });
    try {
      const r = await fetch('/api/admin/refresh-verified-ratings', { method: 'POST' });
      const data = (await r.json()) as RefreshResponse;
      if (!r.ok) {
        setRatingsState({ loading: false, result: null, error: data.error || `HTTP ${r.status}` });
      } else {
        setRatingsState({ loading: false, result: data, error: null });
      }
    } catch (err) {
      setRatingsState({ loading: false, result: null, error: err instanceof Error ? err.message : String(err) });
    }
  };

  return (
    <>
      <Card
        title="Generate 10 outreach drafts"
        description="Picks the next 10 candidates from the scrubbed pool (Canadian-first, grouped by shared email). Saves drafts to info@thedripmap.com Gmail Drafts, signed 'TheDripMap Team'. Marks outreach_sent_at so the 7-day follow-up cron picks them up."
        icon={<Mail size={18} />}
      >
        <button
          type="button"
          onClick={generateDrafts}
          disabled={draftsState.loading}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-black text-sm transition-all"
        >
          {draftsState.loading ? (<><Loader2 size={16} className="animate-spin" />Preparing 10 drafts…</>) : 'Generate 10 outreach drafts'}
        </button>

        {draftsState.error && (
          <div className="mt-5 px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-sm font-bold">
            Error: {draftsState.error}
          </div>
        )}

        {draftsState.result && (
          <div className="mt-5">
            <div className="text-sm text-slate-700 font-bold mb-3">
              Drafted {draftsState.result.drafted ?? 0} of {(draftsState.result.recipients || []).length} target recipients
              {draftsState.result.failed ? ` · ${draftsState.result.failed} failed` : ''}
            </div>
            {draftsState.result.message && (
              <div className="text-sm text-slate-500 font-medium mb-3">{draftsState.result.message}</div>
            )}
            {(draftsState.result.recipients || []).length > 0 && (
              <ol className="text-sm text-slate-700 space-y-1.5 list-decimal pl-5">
                {(draftsState.result.recipients || []).map((r, i) => (
                  <li key={r.email + i} className="font-medium">
                    <span className="font-black">{r.brand}</span>
                    {r.city ? ` — ${r.city}` : ''}{r.country ? ` (${r.country})` : ''}
                    {r.locations > 1 ? ` · ${r.locations} locations` : ''}
                    <span className="text-slate-400 font-normal"> · {r.email}</span>
                  </li>
                ))}
              </ol>
            )}
            {(draftsState.result.failures || []).length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-black uppercase tracking-widest text-rose-600 mb-2">Failures</div>
                <ul className="text-xs text-rose-700 space-y-1">
                  {(draftsState.result.failures || []).map((f, i) => (
                    <li key={f.email + i}>{f.email}: {f.error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Card>

      <Card
        title="Refresh verified ratings now"
        description="Hits Google Places for every claimed/featured clinic and updates rating + review count + last_refreshed_at. Same endpoint the 2am ET cron calls — this just runs it on demand."
        icon={<Star size={18} />}
      >
        <button
          type="button"
          onClick={refreshRatings}
          disabled={ratingsState.loading}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-black text-sm transition-all"
        >
          {ratingsState.loading ? (<><Loader2 size={16} className="animate-spin" />Refreshing…</>) : 'Refresh verified ratings now'}
        </button>

        {ratingsState.error && (
          <div className="mt-5 px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-sm font-bold">
            Error: {ratingsState.error}
          </div>
        )}

        {ratingsState.result && (
          <div className="mt-5">
            <div className="text-sm text-slate-700 font-bold mb-3">
              Checked {ratingsState.result.totalProviders ?? 0} clinics · {ratingsState.result.totalUpdated ?? 0} updated/no-change
              {ratingsState.result.totalFailed ? ` · ${ratingsState.result.totalFailed} failed` : ''}
            </div>
            {(ratingsState.result.updated || []).length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">
                      <th className="py-2 pr-4">Clinic</th>
                      <th className="py-2 pr-4">Old</th>
                      <th className="py-2 pr-4">New</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(ratingsState.result.updated || []).map((u) => {
                      const changed = u.status === 'updated';
                      return (
                        <tr key={u.slug} className="border-b border-slate-100">
                          <td className="py-2 pr-4 font-bold text-slate-800">{u.name}</td>
                          <td className="py-2 pr-4 text-slate-500 font-medium">{u.oldRating ?? '–'} / {u.oldReviews ?? '–'}</td>
                          <td className="py-2 pr-4 text-slate-800 font-bold">{u.newRating ?? '–'} / {u.newReviews ?? '–'}</td>
                          <td className="py-2">
                            <span className={'text-xs font-black uppercase tracking-wider ' + (changed ? 'text-emerald-700' : 'text-slate-400')}>
                              {changed ? 'changed' : 'no change'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {(ratingsState.result.failed || []).length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-black uppercase tracking-widest text-rose-600 mb-2">Failures</div>
                <ul className="text-xs text-rose-700 space-y-1">
                  {(ratingsState.result.failed || []).map((f, i) => (
                    <li key={f.slug + i}>{f.name}: {f.reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Card>
    </>
  );
}
