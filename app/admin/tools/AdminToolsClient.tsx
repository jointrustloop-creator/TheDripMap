'use client';

import React, { useState } from 'react';
import { Loader2, Mail, Star, Clock, Link as LinkIcon, Search, MapPin, Trash2, Sparkles } from 'lucide-react';
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

type GscRow = { query?: string; page?: string; clicks: number; impressions: number; ctr: number; position: number };
type GscReportOk = {
  kind: 'ok';
  property: string;
  data: {
    searchAnalytics: {
      totals: { clicks: number; impressions: number; ctr: number; position: number };
      wow: { clicks: number; impressions: number };
      topQueries: GscRow[];
      topPages: GscRow[];
    };
  };
};
type GscReportStub = { kind: 'stub'; message: string; setupSteps: string[] };
type GscSnapshotResponse = { ok: boolean; report?: GscReportOk | GscReportStub; error?: string };

type KitResponse = {
  ok: boolean;
  clinic?: { name: string; city: string | null; website: string | null; slug: string | null };
  placesFound?: boolean;
  websiteFetched?: boolean;
  placeholders?: string[];
  warnings?: string[];
  markdown?: string;
  error?: string;
};

export function AdminToolsClient() {
  const [ratingsState, setRatingsState] = useState<ButtonState<RefreshResponse>>({ loading: false, result: null, error: null });
  const [hoursState, setHoursState] = useState<ButtonState<EnrichHoursResponse>>({ loading: false, result: null, error: null });
  const [rescueState, setRescueState] = useState<ButtonState<Rescue404Response>>({ loading: false, result: null, error: null });
  const [inspectState, setInspectState] = useState<ButtonState<InspectResponse>>({ loading: false, result: null, error: null });
  const [gscState, setGscState] = useState<ButtonState<GscSnapshotResponse>>({ loading: false, result: null, error: null });
  const [kitSlug, setKitSlug] = useState('');
  const [kitState, setKitState] = useState<ButtonState<KitResponse>>({ loading: false, result: null, error: null });

  // 2026-06-12 admin audit: the old-template outreach draft buttons
  // ("Generate 10", "Wipe drafts + rebuild 50") and the stale "Queue 4
  // pending-claim drafts" button were retired. The endpoints behind the
  // outreach ones are hard-paused by OUTREACH_DRAFTS_PAUSED; the AUTOPILOT
  // morning routine owns new-template outreach drafts now, and W4 inbox
  // triage owns pending-claim follow-ups.

  const generateKit = async () => {
    const slug = kitSlug.trim();
    if (!slug) {
      setKitState({ loading: false, result: null, error: 'Enter a provider slug first.' });
      return;
    }
    setKitState({ loading: true, result: null, error: null });
    try {
      const r = await fetch('/api/admin/generate-get-found-kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });
      const data = (await r.json()) as KitResponse;
      if (!r.ok) setKitState({ loading: false, result: null, error: data.error || `HTTP ${r.status}` });
      else setKitState({ loading: false, result: data, error: null });
    } catch (err) {
      setKitState({ loading: false, result: null, error: err instanceof Error ? err.message : String(err) });
    }
  };

  const pullGscSnapshot = async () => {
    setGscState({ loading: true, result: null, error: null });
    try {
      const r = await fetch('/api/admin/gsc-snapshot', { method: 'POST' });
      const data = (await r.json()) as GscSnapshotResponse;
      if (!r.ok) setGscState({ loading: false, result: null, error: data.error || `HTTP ${r.status}` });
      else setGscState({ loading: false, result: data, error: null });
    } catch (err) {
      setGscState({ loading: false, result: null, error: err instanceof Error ? err.message : String(err) });
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
        title="Pull live Google Search Console snapshot"
        description="Hits the GSC API right now and shows totals (clicks, impressions, CTR, avg position) for the last 28 days, week-over-week deltas, top 10 queries, top 10 pages. Same source the Sunday digest email uses, just on demand. Requires GSC_SERVICE_ACCOUNT_KEY in Vercel env (already set)."
        icon={<Search size={18} />}
      >
        <button
          type="button"
          onClick={pullGscSnapshot}
          disabled={gscState.loading}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-black text-sm transition-all"
        >
          {gscState.loading ? (<><Loader2 size={16} className="animate-spin" />Pulling GSC dataâ€¦</>) : 'Pull live GSC snapshot'}
        </button>

        {gscState.error && (
          <div className="mt-5 px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-sm font-bold">
            Error: {gscState.error}
          </div>
        )}

        {gscState.result?.report?.kind === 'stub' && (
          <div className="mt-5 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-sm">
            <div className="font-bold mb-2">GSC not configured</div>
            <div className="text-xs font-medium">{gscState.result.report.message}</div>
          </div>
        )}

        {gscState.result?.report?.kind === 'ok' && (() => {
          const sa = gscState.result.report.data.searchAnalytics;
          const wowClicks = sa.totals.clicks - sa.wow.clicks;
          const wowImps = sa.totals.impressions - sa.wow.impressions;
          const fmtPct = (n: number) => (n * 100).toFixed(2) + '%';
          const fmtNum = (n: number) => n.toLocaleString();
          const fmtDelta = (n: number) => (n > 0 ? '+' : '') + fmtNum(n);
          return (
            <div className="mt-5">
              <div className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Last 28 days totals</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="text-2xl font-black text-slate-900">{fmtNum(sa.totals.clicks)}</div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Clicks</div>
                  <div className={`text-xs font-bold mt-1 ${wowClicks >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>WoW {fmtDelta(wowClicks)}</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="text-2xl font-black text-slate-900">{fmtNum(sa.totals.impressions)}</div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Impressions</div>
                  <div className={`text-xs font-bold mt-1 ${wowImps >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>WoW {fmtDelta(wowImps)}</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="text-2xl font-black text-slate-900">{fmtPct(sa.totals.ctr)}</div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">CTR</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="text-2xl font-black text-slate-900">{sa.totals.position.toFixed(1)}</div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Avg position</div>
                </div>
              </div>

              <div className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Top 10 queries</div>
              <div className="overflow-x-auto mb-6">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">
                      <th className="py-2 pr-4">Query</th>
                      <th className="py-2 pr-4">Clicks</th>
                      <th className="py-2 pr-4">Impressions</th>
                      <th className="py-2 pr-4">CTR</th>
                      <th className="py-2">Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sa.topQueries.map((q, i) => (
                      <tr key={(q.query || '') + i} className="border-b border-slate-100">
                        <td className="py-2 pr-4 font-bold text-slate-800">{q.query}</td>
                        <td className="py-2 pr-4 text-slate-700">{q.clicks}</td>
                        <td className="py-2 pr-4 text-slate-700">{fmtNum(q.impressions)}</td>
                        <td className="py-2 pr-4 text-slate-700">{fmtPct(q.ctr)}</td>
                        <td className="py-2 text-slate-700">{q.position.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Top 10 pages</div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">
                      <th className="py-2 pr-4">Page</th>
                      <th className="py-2 pr-4">Clicks</th>
                      <th className="py-2 pr-4">Impressions</th>
                      <th className="py-2 pr-4">CTR</th>
                      <th className="py-2">Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sa.topPages.map((p, i) => {
                      const path = (p.page || '').replace('https://www.thedripmap.com', '').replace('https://thedripmap.com', '');
                      return (
                        <tr key={(p.page || '') + i} className="border-b border-slate-100">
                          <td className="py-2 pr-4 font-bold text-slate-800 max-w-xs truncate" title={p.page}>{path || '/'}</td>
                          <td className="py-2 pr-4 text-slate-700">{p.clicks}</td>
                          <td className="py-2 pr-4 text-slate-700">{fmtNum(p.impressions)}</td>
                          <td className="py-2 pr-4 text-slate-700">{fmtPct(p.ctr)}</td>
                          <td className="py-2 text-slate-700">{p.position.toFixed(1)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
      </Card>

      <Card
        title="Generate Get Found Kit for a clinic (test)"
        description="Operator test path for the Get Found Kit generator. Enter any provider slug from the DB and we'll pull their Google Places data, fetch their website, and produce a Markdown kit grounded only in real data. Hard guardrails: marketing copy only, no health claims, [clinic to confirm] placeholders for missing fields, no em-dashes. Default DRAFT, never auto-sends."
        icon={<Sparkles size={18} />}
      >
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            value={kitSlug}
            onChange={(e) => setKitSlug(e.target.value)}
            placeholder="provider slug, e.g. bay-wellness-centre-vancouver"
            className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-wellness-500 focus:border-transparent transition-all text-sm"
          />
          <button
            type="button"
            onClick={generateKit}
            disabled={kitState.loading || !kitSlug.trim()}
            className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-black text-sm transition-all"
          >
            {kitState.loading ? (<><Loader2 size={16} className="animate-spin" />Generatingâ€¦</>) : 'Generate kit'}
          </button>
        </div>

        {kitState.error && (
          <div className="mt-3 px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-sm font-bold">
            Error: {kitState.error}
          </div>
        )}

        {kitState.result?.markdown && (
          <div className="mt-3 space-y-3">
            <div className="text-sm font-bold text-slate-700">
              {kitState.result.clinic?.name} Â· {kitState.result.clinic?.city}
              {' Â· '}Places {kitState.result.placesFound ? 'OK' : 'miss'}
              {' Â· '}Website {kitState.result.websiteFetched ? 'OK' : 'miss'}
            </div>
            {(kitState.result.placeholders || []).length > 0 && (
              <div className="px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-sm">
                <div className="font-black text-xs uppercase tracking-widest mb-1">Placeholders to fill before delivery</div>
                <ul className="list-disc pl-5">
                  {(kitState.result.placeholders || []).map((p, i) => <li key={p + i}>{p}</li>)}
                </ul>
              </div>
            )}
            {(kitState.result.warnings || []).length > 0 && (
              <div className="px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-sm">
                <div className="font-black text-xs uppercase tracking-widest mb-1">Warnings</div>
                <ul className="list-disc pl-5">
                  {(kitState.result.warnings || []).map((w, i) => <li key={w + i}>{w}</li>)}
                </ul>
              </div>
            )}
            <details className="bg-slate-50 rounded-xl border border-slate-200" open>
              <summary className="cursor-pointer px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-700">
                Generated kit Markdown
              </summary>
              <pre className="px-4 py-3 text-xs text-slate-800 overflow-x-auto whitespace-pre-wrap max-h-[600px] overflow-y-auto">{kitState.result.markdown}</pre>
            </details>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(kitState.result?.markdown || '')}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-bold text-xs transition-all"
            >
              Copy Markdown
            </button>
          </div>
        )}
      </Card>

      <Card
        title="Research: clinic owner pains"
        description="Internal knowledge base of IV clinic owner pains, refreshed weekly by cron. Demoted out of the main nav 2026-06-12; lives here now. Old-template outreach buttons (Generate 10, Wipe + rebuild 50, Queue pending-claim drafts) were retired the same day: AUTOPILOT morning drafts + W4 triage replace them, and the server endpoints are pause-gated."
        icon={<Mail size={18} />}
      >
        <a
          href="/admin/clinic-owner-pains"
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-black text-sm transition-all"
        >
          Open owner pains research
        </a>
      </Card>
      <Card
        title="Refresh verified ratings now"
        description="Hits Google Places for every claimed/featured clinic and updates rating + review count + last_refreshed_at. Same endpoint the 2am ET cron calls â€” this just runs it on demand."
        icon={<Star size={18} />}
      >
        <button
          type="button"
          onClick={refreshRatings}
          disabled={ratingsState.loading}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-black text-sm transition-all"
        >
          {ratingsState.loading ? (<><Loader2 size={16} className="animate-spin" />Refreshingâ€¦</>) : 'Refresh verified ratings now'}
        </button>

        {ratingsState.error && (
          <div className="mt-5 px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-sm font-bold">
            Error: {ratingsState.error}
          </div>
        )}

        {ratingsState.result && (
          <div className="mt-5">
            <div className="text-sm text-slate-700 font-bold mb-3">
              Checked {ratingsState.result.totalProviders ?? 0} clinics Â· {ratingsState.result.totalUpdated ?? 0} updated/no-change
              {ratingsState.result.totalFailed ? ` Â· ${ratingsState.result.totalFailed} failed` : ''}
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
                          <td className="py-2 pr-4 text-slate-500 font-medium">{u.oldRating ?? 'â€“'} / {u.oldReviews ?? 'â€“'}</td>
                          <td className="py-2 pr-4 text-slate-800 font-bold">{u.newRating ?? 'â€“'} / {u.newReviews ?? 'â€“'}</td>
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
          {hoursState.loading ? (<><Loader2 size={16} className="animate-spin" />Pulling hoursâ€¦</>) : 'Backfill claimed clinic hours'}
        </button>
        {hoursState.error && (
          <div className="mt-5 px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-sm font-bold">Error: {hoursState.error}</div>
        )}
        {hoursState.result && (
          <div className="mt-5">
            <div className="text-sm text-slate-700 font-bold mb-3">Considered {hoursState.result.totalConsidered ?? 0} Â· Filled {hoursState.result.filled ?? 0}</div>
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
            {rescueState.loading ? (<><Loader2 size={16} className="animate-spin" />Rescuing batchâ€¦</>) : `Rescue next 50 (offset ${rescueOffset})`}
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
              Batch: offset {rescueState.result.offset} / total {rescueState.result.totalCandidates} Â· {rescueState.result.updated ?? 0} URL{(rescueState.result.updated ?? 0) === 1 ? '' : 's'} updated Â· {rescueState.result.noListing ?? 0} no Google listing
              {rescueState.result.nextOffset === null ? ' Â· DONE' : ` Â· next offset ${rescueState.result.nextOffset}`}
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
          {inspectState.loading ? (<><Loader2 size={16} className="animate-spin" />Looking up on Placesâ€¦</>) : 'Inspect 3 held clinics'}
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
                    <div><strong>Places name:</strong> {r.places.name || 'â€“'}</div>
                    <div><strong>Status:</strong> {r.places.business_status || 'â€“'}</div>
                    <div className="md:col-span-2"><strong>Address:</strong> {r.places.address || 'â€“'}</div>
                    <div className="md:col-span-2"><strong>Website on Places:</strong> {r.places.website || 'â€“'}</div>
                    <div><strong>Phone:</strong> {r.places.phone || 'â€“'}</div>
                    <div><strong>Rating:</strong> {r.places.rating ?? 'â€“'} ({r.places.user_ratings_total ?? 0} reviews)</div>
                    <div className="md:col-span-2"><strong>Types:</strong> {r.places.types.join(', ') || 'â€“'}</div>
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
