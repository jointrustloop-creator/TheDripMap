'use client';

import React, { useState } from 'react';
import { Loader2, Mail, Star, Clock, Link as LinkIcon, Search, MapPin, Trash2 } from 'lucide-react';
import { OUTREACH_COUNTRY_FILTER, outreachScopeLabel } from '@/src/lib/outreach-config';

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
  clean?: boolean;
  preDeleted?: number;
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

type InspectRow = {
  slug: string;
  name: string;
  listedCity: string | null;
  listedWebsite: string | null;
  places: null | { name: string | null; address: string | null; types: string[]; business_status: string | null; website: string | null; phone: string | null; place_id: string | null; rating: number | null; user_ratings_total: number | null; cityMatch: boolean; looksLikeIvClinic: boolean };
  verdict: string;
  notes: string[];
};
type InspectResponse = { ok: boolean; rows?: InspectRow[]; error?: string };

export function AdminToolsClient() {
  const [draftsState, setDraftsState] = useState<ButtonState<RegenerateResponse>>({ loading: false, result: null, error: null });
  const [cleanBatchState, setCleanBatchState] = useState<ButtonState<RegenerateResponse>>({ loading: false, result: null, error: null });
  const [pendingClaimState, setPendingClaimState] = useState<ButtonState<{ ok: boolean; drafted?: number; failed?: number; deletedPriorDrafts?: number; recipients?: { to: string; subject: string }[]; error?: string }>>({ loading: false, result: null, error: null });
  const [ratingsState, setRatingsState] = useState<ButtonState<RefreshResponse>>({ loading: false, result: null, error: null });
  const [hoursState, setHoursState] = useState<ButtonState<EnrichHoursResponse>>({ loading: false, result: null, error: null });
  const [rescueState, setRescueState] = useState<ButtonState<Rescue404Response>>({ loading: false, result: null, error: null });
  const [inspectState, setInspectState] = useState<ButtonState<InspectResponse>>({ loading: false, result: null, error: null });

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

  const queuePendingClaimDrafts = async () => {
    setPendingClaimState({ loading: true, result: null, error: null });
    try {
      const r = await fetch('/api/admin/queue-pending-claim-drafts', { method: 'POST' });
      const data = await r.json();
      if (!r.ok) setPendingClaimState({ loading: false, result: null, error: data.error || `HTTP ${r.status}` });
      else setPendingClaimState({ loading: false, result: data, error: null });
    } catch (err) {
      setPendingClaimState({ loading: false, result: null, error: err instanceof Error ? err.message : String(err) });
    }
  };

  const cleanRegenerate50 = async () => {
    if (!window.confirm('This will DELETE every outreach draft currently in Gmail Drafts (initial sends + 7-day follow-ups) and rebuild exactly 50 Canadian unclaimed-clinic drafts. Continue?')) return;
    setCleanBatchState({ loading: true, result: null, error: null });
    try {
      const r = await fetch('/api/admin/regenerate-outreach?mode=next&limit=50&clean=1', { method: 'POST' });
      const data = (await r.json()) as RegenerateResponse;
      if (!r.ok) {
        setCleanBatchState({ loading: false, result: null, error: data.error || `HTTP ${r.status}` });
      } else {
        setCleanBatchState({ loading: false, result: data, error: null });
      }
    } catch (err) {
      setCleanBatchState({ loading: false, result: null, error: err instanceof Error ? err.message : String(err) });
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

  const inspectHeld = async () => {
    setInspectState({ loading: true, result: null, error: null });
    try {
      const r = await fetch('/api/admin/places-inspect', { method: 'POST' });
      const data = (await r.json()) as InspectResponse;
      if (!r.ok) setInspectState({ loading: false, result: null, error: data.error || `HTTP ${r.status}` });
      else setInspectState({ loading: false, result: data, error: null });
    } catch (err) {
      setInspectState({ loading: false, result: null, error: err instanceof Error ? err.message : String(err) });
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

  const scope = outreachScopeLabel();
  const isCanadaOnly = OUTREACH_COUNTRY_FILTER.length === 1 && OUTREACH_COUNTRY_FILTER[0] === 'Canada';
  const isAllCountries = OUTREACH_COUNTRY_FILTER.length === 0;

  return (
    <>
      <div className={`mb-6 rounded-2xl border p-4 flex items-start gap-3 ${isCanadaOnly ? 'bg-red-50 border-red-200' : isAllCountries ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isCanadaOnly ? 'bg-red-100 text-red-700' : isAllCountries ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
          <MapPin size={16} />
        </div>
        <div className="flex-1">
          <div className={`text-sm font-black ${isCanadaOnly ? 'text-red-900' : isAllCountries ? 'text-amber-900' : 'text-blue-900'}`}>
            Outreach scope: {scope}
          </div>
          <div className={`text-xs font-medium mt-0.5 ${isCanadaOnly ? 'text-red-700' : isAllCountries ? 'text-amber-700' : 'text-blue-700'}`}>
            {isCanadaOnly && 'All outreach buttons + crons (daily, follow-up, queue, regenerate) target Canadian providers only. Flip in src/lib/outreach-config.ts to change.'}
            {isAllCountries && 'No country filter applied. All providers in the pool are eligible.'}
            {!isCanadaOnly && !isAllCountries && 'Scope is multi-country. Flip in src/lib/outreach-config.ts to change.'}
          </div>
        </div>
      </div>

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
        title="Clean regenerate 50 Canadian outreach drafts"
        description="DESTRUCTIVE. Deletes every outreach draft currently in info@thedripmap.com Gmail Drafts (initial sends + 7-day follow-ups), then rebuilds exactly 50 Canadian unclaimed-clinic drafts using the current traffic-led template selector. Daily + follow-up crons are paused, so nothing will refill these overnight. Use this when you want a fixed, hand-curated batch to send out."
        icon={<Trash2 size={18} />}
      >
        <button
          type="button"
          onClick={cleanRegenerate50}
          disabled={cleanBatchState.loading}
          className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-black text-sm transition-all"
        >
          {cleanBatchState.loading ? (<><Loader2 size={16} className="animate-spin" />Wiping drafts and rebuilding 50…</>) : 'Wipe drafts + rebuild 50 (Canada only)'}
        </button>

        {cleanBatchState.error && (
          <div className="mt-5 px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-sm font-bold">
            Error: {cleanBatchState.error}
          </div>
        )}

        {cleanBatchState.result && (
          <div className="mt-5">
            <div className="text-sm text-slate-700 font-bold mb-3">
              Pre-deleted {cleanBatchState.result.preDeleted ?? 0} existing drafts · Drafted {cleanBatchState.result.drafted ?? 0} of {(cleanBatchState.result.recipients || []).length} target recipients
              {cleanBatchState.result.failed ? ` · ${cleanBatchState.result.failed} failed` : ''}
            </div>
            {cleanBatchState.result.message && (
              <div className="text-sm text-slate-500 font-medium mb-3">{cleanBatchState.result.message}</div>
            )}
            {(cleanBatchState.result.recipients || []).length > 0 && (
              <ol className="text-sm text-slate-700 space-y-1.5 list-decimal pl-5">
                {(cleanBatchState.result.recipients || []).map((r, i) => (
                  <li key={r.email + i} className="font-medium">
                    <span className="font-black">{r.brand}</span>
                    {r.city ? ` · ${r.city}` : ''}{r.country ? ` (${r.country})` : ''}
                    {r.locations > 1 ? ` · ${r.locations} locations` : ''}
                    <span className="text-slate-400 font-normal"> · {r.email}</span>
                  </li>
                ))}
              </ol>
            )}
            {(cleanBatchState.result.failures || []).length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-black uppercase tracking-widest text-rose-600 mb-2">Failures</div>
                <ul className="text-xs text-rose-700 space-y-1">
                  {(cleanBatchState.result.failures || []).map((f, i) => (
                    <li key={f.email + i}>{f.email}: {f.error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Card>

      <Card
        title="Queue 4 pending-claim follow-up drafts"
        description="Saves 4 manual follow-up emails to Gmail Drafts for the 5 rows currently in claim_requests (Knead's two submissions deduped to one): BeYouty (expired token re-send ask), Tri-Health (1d remaining nudge), Insight (welcome / activation tips since claim is already verified), Knead (2d remaining nudge). Idempotent: re-running deletes prior copies first. Operator sends each manually after review."
        icon={<Mail size={18} />}
      >
        <button
          type="button"
          onClick={queuePendingClaimDrafts}
          disabled={pendingClaimState.loading}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-black text-sm transition-all"
        >
          {pendingClaimState.loading ? (<><Loader2 size={16} className="animate-spin" />Saving 4 drafts…</>) : 'Queue 4 pending-claim drafts'}
        </button>

        {pendingClaimState.error && (
          <div className="mt-5 px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-sm font-bold">
            Error: {pendingClaimState.error}
          </div>
        )}

        {pendingClaimState.result && (
          <div className="mt-5">
            <div className="text-sm text-slate-700 font-bold mb-3">
              Drafted {pendingClaimState.result.drafted ?? 0} · Deleted {pendingClaimState.result.deletedPriorDrafts ?? 0} prior copies
              {pendingClaimState.result.failed ? ` · ${pendingClaimState.result.failed} failed` : ''}
            </div>
            {(pendingClaimState.result.recipients || []).length > 0 && (
              <ol className="text-sm text-slate-700 space-y-1.5 list-decimal pl-5">
                {(pendingClaimState.result.recipients || []).map((r, i) => (
                  <li key={r.to + i} className="font-medium">
                    <span className="text-slate-400 font-normal">{r.to}</span>
                    {' · '}
                    <span className="font-bold">{r.subject}</span>
                  </li>
                ))}
              </ol>
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

      <Card
        title="Inspect 3 held redirects (research only, no writes)"
        description="puredropiv-washington (acquired by Baseline), one-iv-hydration-and-medspa-riverview (TRT brand redirect), drip-suites-birmingham (dead JaneApp link). Looks each up by name + city on Google Places and reports: name, address, business status, types, current website. Nothing is updated."
        icon={<Search size={18} />}
      >
        <button
          type="button"
          onClick={inspectHeld}
          disabled={inspectState.loading}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-black text-sm transition-all"
        >
          {inspectState.loading ? (<><Loader2 size={16} className="animate-spin" />Looking up on Places…</>) : 'Inspect 3 held clinics'}
        </button>
        {inspectState.error && (
          <div className="mt-5 px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-sm font-bold">Error: {inspectState.error}</div>
        )}
        {inspectState.result && (
          <div className="mt-5 space-y-4">
            {(inspectState.result.rows || []).map((r) => (
              <div key={r.slug} className="border border-slate-200 rounded-2xl p-5 bg-slate-50/40">
                <div className="flex items-center gap-3 mb-3">
                  <span className={'text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ' + (
                    r.verdict === 'keep_iv_clinic' ? 'bg-emerald-100 text-emerald-800' :
                    r.verdict === 'maybe_not_iv' ? 'bg-amber-100 text-amber-800' :
                    r.verdict === 'closed' ? 'bg-rose-100 text-rose-800' :
                    'bg-slate-100 text-slate-700'
                  )}>{r.verdict.replace(/_/g, ' ')}</span>
                  <span className="font-black text-slate-900">{r.name}</span>
                  <span className="text-xs text-slate-500">{r.listedCity}</span>
                </div>
                <div className="text-xs text-slate-500 mb-2"><strong>Listed website:</strong> {r.listedWebsite || '(none)'}</div>
                {r.places ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-700">
                    <div><strong>Places name:</strong> {r.places.name || '–'}</div>
                    <div><strong>Status:</strong> {r.places.business_status || '–'}</div>
                    <div className="md:col-span-2"><strong>Address:</strong> {r.places.address || '–'}</div>
                    <div className="md:col-span-2"><strong>Website on Places:</strong> {r.places.website || '–'}</div>
                    <div><strong>Phone:</strong> {r.places.phone || '–'}</div>
                    <div><strong>Rating:</strong> {r.places.rating ?? '–'} ({r.places.user_ratings_total ?? 0} reviews)</div>
                    <div className="md:col-span-2"><strong>Types:</strong> {r.places.types.join(', ') || '–'}</div>
                  </div>
                ) : (
                  <div className="text-xs text-rose-700 font-bold">No Google Places result.</div>
                )}
                {r.notes.length > 0 && (
                  <ul className="mt-3 text-xs text-amber-800 list-disc pl-5 space-y-1">
                    {r.notes.map((n, i) => <li key={i}>{n}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
