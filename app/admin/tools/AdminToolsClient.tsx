'use client';

import React, { useState } from 'react';
import { Loader2, Mail, Star, Clock, Link as LinkIcon } from 'lucide-react';

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

type EnrichHoursRow = { slug: string; name: string; status: string; message?: string };
type EnrichHoursResponse = { ok: boolean; totalConsidered?: number; filled?: number; rows?: EnrichHoursRow[]; error?: string };

type Rescue404Row = { slug: string; name: string; city: string | null; beforeUrl: string | null; afterUrl: string | null; status: string };
type Rescue404Response = { ok: boolean; total?: number; updated?: number; noListing?: number; rows?: Rescue404Row[]; offset?: number; limit?: number; nextOffset?: number | null; totalCandidates?: number; error?: string };

export function AdminToolsClient() {
  const [draftsState, setDraftsState] = useState<ButtonState<RegenerateResponse>>({ loading: false, result: null, error: null });
  const [ratingsState, setRatingsState] = useState<ButtonState<RefreshResponse>>({ loading: false, result: null, error: null });
  const [hoursState, setHoursState] = useState<ButtonState<EnrichHoursResponse>>({ loading: false, result: null, error: null });
  const [rescueState, setRescueState] = useState<ButtonState<Rescue404Response>>({ loading: false, result: null, error: null });

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

  const enrichHours = async () => {
    setHoursState({ loading: true, result: null, error: null });
    try {
      const r = await fetch('/api/admin/places-enrich-hours', { method: 'POST' });
      const data = (await r.json()) as EnrichHoursResponse;
      if (!r.ok) setHoursState({ loading: false, result: null, error: data.error || `HTTP ${r.status}` });
      else setHoursState({ loading: false, result: data, error: null });
    } catch (err) {
      setHoursState({ loading: false, result: null, error: err instanceof Error ? err.message : String(err) });
    }
  };

  const [rescueOffset, setRescueOffset] = useState(0);
  const rescueBatch = async (offset: number) => {
    setRescueState({ loading: true, result: null, error: null });
    try {
      const r = await fetch('/api/admin/places-rescue-404', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offset, limit: 50 }),
      });
      const data = (await r.json()) as Rescue404Response;
      if (!r.ok) setRescueState({ loading: false, result: null, error: data.error || `HTTP ${r.status}` });
      else {
        setRescueState({ loading: false, result: data, error: null });
        if (typeof data.nextOffset === 'number') setRescueOffset(data.nextOffset);
        else setRescueOffset(0);
      }
    } catch (err) {
      setRescueState({ loading: false, result: null, error: err instanceof Error ? err.message : String(err) });
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

      <Card
        title="Backfill missing hours for claimed clinics"
        description="Hits Google Place Details for each claimed clinic that has no working_hours yet, parses weekday_text into the DB shape, writes ONLY when the field is empty. Skips Bay Wellness by default (operator confirmed complete)."
        icon={<Clock size={18} />}
      >
        <button
          type="button"
          onClick={enrichHours}
          disabled={hoursState.loading}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-black text-sm transition-all"
        >
          {hoursState.loading ? (<><Loader2 size={16} className="animate-spin" />Pulling hours…</>) : 'Backfill claimed clinic hours'}
        </button>
        {hoursState.error && (
          <div className="mt-5 px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-sm font-bold">Error: {hoursState.error}</div>
        )}
        {hoursState.result && (
          <div className="mt-5">
            <div className="text-sm text-slate-700 font-bold mb-3">Considered {hoursState.result.totalConsidered ?? 0} · Filled {hoursState.result.filled ?? 0}</div>
            <ul className="text-sm text-slate-700 space-y-1.5">
              {(hoursState.result.rows || []).map((r) => (
                <li key={r.slug} className="flex items-center gap-2">
                  <span className={'text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ' + (
                    r.status === 'filled' ? 'bg-emerald-100 text-emerald-800' :
                    r.status === 'skipped_present' ? 'bg-slate-100 text-slate-600' :
                    'bg-amber-100 text-amber-800'
                  )}>{r.status.replace(/_/g, ' ')}</span>
                  <span className="font-bold">{r.name}</span>
                  {r.message && <span className="text-xs text-rose-600">{r.message}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <Card
        title="Rescue dead-link URLs via Google Places"
        description="For each provider in the bundled dead-link list (from the latest Tier 2 link scan), search Google Places by name + city. If a current website is found on Google, update the URL. Never deletes. Processes 50 per click, paginated. Click again to walk the next batch."
        icon={<LinkIcon size={18} />}
      >
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => rescueBatch(rescueOffset)}
            disabled={rescueState.loading}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-black text-sm transition-all"
          >
            {rescueState.loading ? (<><Loader2 size={16} className="animate-spin" />Rescuing batch…</>) : `Rescue next 50 (offset ${rescueOffset})`}
          </button>
          <button
            type="button"
            onClick={() => setRescueOffset(0)}
            disabled={rescueState.loading}
            className="text-xs font-bold text-slate-500 hover:text-slate-900 underline-offset-2 hover:underline"
          >
            Reset offset to 0
          </button>
        </div>
        {rescueState.error && (
          <div className="mt-5 px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-sm font-bold">Error: {rescueState.error}</div>
        )}
        {rescueState.result && (
          <div className="mt-5">
            <div className="text-sm text-slate-700 font-bold mb-3">
              Batch: offset {rescueState.result.offset} / total {rescueState.result.totalCandidates} · {rescueState.result.updated ?? 0} URL{(rescueState.result.updated ?? 0) === 1 ? '' : 's'} updated · {rescueState.result.noListing ?? 0} no Google listing
              {rescueState.result.nextOffset === null ? ' · DONE' : ` · next offset ${rescueState.result.nextOffset}`}
            </div>
            <ul className="text-sm text-slate-700 space-y-1.5">
              {(rescueState.result.rows || []).map((r) => (
                <li key={r.slug}>
                  <span className={'text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mr-2 ' + (
                    r.status === 'updated' ? 'bg-emerald-100 text-emerald-800' :
                    r.status === 'no_listing' ? 'bg-rose-100 text-rose-800' :
                    r.status === 'same_url' ? 'bg-slate-100 text-slate-600' :
                    'bg-amber-100 text-amber-800'
                  )}>{r.status.replace(/_/g, ' ')}</span>
                  <span className="font-bold">{r.name}</span>
                  {r.status === 'updated' && (
                    <div className="ml-16 text-xs text-slate-500 font-medium">
                      <div>was: {r.beforeUrl}</div>
                      <div>now: {r.afterUrl}</div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </>
  );
}
