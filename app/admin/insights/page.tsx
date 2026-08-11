/**
 * /admin/insights
 *
 * Per-listing analytics dashboard. Read-only, admin-gated, noindex.
 * First-party capture from /api/track -> public.listing_events (see
 * scripts/sql/listing_events.sql). Server-rendered.
 *
 * Controls (URL params):
 *   ?window=month|30d|all   time window (default: 30d)
 *   ?seg=all|claimed|unclaimed   segment (default: all)
 *
 * - month / all read the pre-aggregated public.listing_events_monthly view.
 * - 30d reads raw events for a rolling 30-day window.
 * - The "claimed" segment lists EVERY claimed provider, zero-filled, so the
 *   operator sees the complete claimed roster and its stats (even 0-activity).
 *
 * The owner-facing premium "profile insights" surface is intentionally NOT
 * built here — this is the operator read view + the source of outreach "ammo"
 * (e.g. "your listing got N views/M website clicks").
 */
import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { isAdminRequest } from '../../../src/lib/admin-auth';
import { getPerProviderCounts, EVENT_TYPES, type EventType, type EventCountsByType } from '../../../src/lib/analytics-query';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

interface ProviderRow {
  id: string;
  name: string | null;
  city: string | null;
  state: string | null;
  slug: string | null;
  is_claimed: boolean | null;
}

interface InsightRow extends EventCountsByType {
  provider_id: string;
  name: string;
  city: string;
  state: string;
  slug: string;
  is_claimed: boolean;
  total_clicks: number;
  leads: number; // real submitted message-clinic leads (from inquiries)
}

type WindowKey = 'month' | '30d' | 'all';
type SegKey = 'all' | 'claimed' | 'unclaimed';

function zero(): EventCountsByType {
  return { view: 0, book_click: 0, booking_click: 0, call_click: 0, website_click: 0, directions_click: 0, message_click: 0 };
}

// Paginate the pre-aggregated monthly rollup. monthEq filters to one calendar
// month (YYYY-MM-DD of the month start); omit for all-time.
async function fetchRollup(sb: SupabaseClient, monthEq?: string): Promise<{ map: Map<string, EventCountsByType>; error: boolean }> {
  const map = new Map<string, EventCountsByType>();
  let from = 0;
  const page = 1000;
  for (let i = 0; i < 200; i++) {
    let q = sb.from('listing_events_monthly').select('provider_id, event_type, count').range(from, from + page - 1);
    if (monthEq) q = q.eq('month', monthEq);
    const { data, error } = await q;
    if (error) return { map, error: true };
    if (!data || data.length === 0) break;
    for (const r of data as Array<{ provider_id: string; event_type: string; count: number }>) {
      if (!map.has(r.provider_id)) map.set(r.provider_id, zero());
      const c = map.get(r.provider_id)!;
      if ((EVENT_TYPES as readonly string[]).includes(r.event_type)) {
        c[r.event_type as EventType] += Number(r.count || 0);
      }
    }
    if (data.length < page) break;
    from += page;
  }
  return { map, error: false };
}

// Real submitted message-clinic LEADS per provider, from the inquiries table.
// A lead is an inquiry whose body carries the "Lead for ... clinicId=" marker
// the message-clinic route writes (covers plain leads and [BOOKING ...] ones).
// This is the true "a patient actually contacted this clinic" count, and is
// deliberately separate from the message_click intent event (which fires the
// moment the Message button is tapped, before anything is submitted).
async function fetchLeadCounts(sb: SupabaseClient, sinceIso?: string): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  let from = 0;
  for (let i = 0; i < 50; i++) {
    let q = sb
      .from('inquiries')
      .select('listing_id, created_at, message')
      .ilike('message', '%Lead for %')
      .not('listing_id', 'is', null)
      .range(from, from + 999);
    if (sinceIso) q = q.gte('created_at', sinceIso);
    const { data, error } = await q;
    if (error || !data) break;
    for (const r of data as Array<{ listing_id: string | null }>) {
      if (r.listing_id) map.set(r.listing_id, (map.get(r.listing_id) || 0) + 1);
    }
    if (data.length < 1000) break;
    from += 1000;
  }
  return map;
}

export default async function AdminInsightsPage({ searchParams }: { searchParams: Promise<{ window?: string; seg?: string }> }) {
  if (!(await isAdminRequest())) {
    redirect('/admin/login?next=/admin/insights');
  }

  const sp = await searchParams;
  const window: WindowKey = sp.window === 'month' || sp.window === 'all' ? sp.window : '30d';
  const seg: SegKey = sp.seg === 'claimed' || sp.seg === 'unclaimed' ? sp.seg : 'all';

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);

  // Build per-provider counts for the selected window.
  let counts = new Map<string, EventCountsByType>();
  let rolloutPending = false;
  if (window === '30d') {
    const sinceIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const per = await getPerProviderCounts({ sinceIso, client: supabase });
    for (const p of per) counts.set(p.provider_id, p.counts);
  } else {
    const { map, error } = await fetchRollup(supabase, window === 'month' ? monthStart : undefined);
    counts = map;
    rolloutPending = error;
  }

  // Real submitted leads for the same window (separate signal from message_click).
  const leadSinceIso = window === '30d'
    ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    : window === 'month' ? monthStart + 'T00:00:00Z' : undefined;
  const leadsByProvider = await fetchLeadCounts(supabase, leadSinceIso);
  // A clinic can have a submitted lead without a tracked event in this window;
  // make sure it still surfaces (zero-filled) so a real lead is never dropped.
  for (const id of leadsByProvider.keys()) if (!counts.has(id)) counts.set(id, zero());

  // Determine which providers to render.
  const activeIds = Array.from(counts.keys());
  const provInfo = new Map<string, ProviderRow>();
  if (activeIds.length > 0) {
    // chunk the .in() to stay well under URL limits
    for (let i = 0; i < activeIds.length; i += 300) {
      const chunk = activeIds.slice(i, i + 300);
      const { data } = await supabase.from('providers').select('id, name, city, state, slug, is_claimed').in('id', chunk);
      for (const p of (data || []) as ProviderRow[]) provInfo.set(p.id, p);
    }
  }
  // For the claimed segment, include EVERY claimed provider (zero-filled) so the
  // operator sees the full claimed roster, not just those with activity.
  if (seg === 'claimed') {
    const { data } = await supabase.from('providers').select('id, name, city, state, slug, is_claimed').eq('is_claimed', true);
    for (const p of (data || []) as ProviderRow[]) {
      provInfo.set(p.id, p);
      if (!counts.has(p.id)) counts.set(p.id, zero());
    }
  }

  // Materialize rows, applying the segment filter.
  const rows: InsightRow[] = [];
  for (const [provider_id, c] of counts.entries()) {
    const info = provInfo.get(provider_id);
    const claimed = !!info?.is_claimed;
    if (seg === 'claimed' && !claimed) continue;
    if (seg === 'unclaimed' && claimed) continue;
    // Actions set (= monetization "actions"): booking_click (in-app booking form
    // opens) counts alongside book_click (outbound booking-link clicks).
    const total_clicks = c.book_click + c.booking_click + c.call_click + c.website_click + c.directions_click + c.message_click;
    rows.push({
      provider_id,
      name: info?.name || '(unknown)',
      city: info?.city || '',
      state: info?.state || '',
      slug: info?.slug || '',
      is_claimed: claimed,
      total_clicks,
      leads: leadsByProvider.get(provider_id) || 0,
      ...c,
    });
  }

  rows.sort((a, b) => (b.view !== a.view ? b.view - a.view : b.total_clicks - a.total_clicks || a.name.localeCompare(b.name)));

  const totals = rows.reduce((acc, r) => {
    for (const t of EVENT_TYPES) acc[t] += r[t];
    return acc;
  }, zero());
  const totalClicks = totals.book_click + totals.booking_click + totals.call_click + totals.website_click + totals.directions_click + totals.message_click;
  const totalLeads = rows.reduce((acc, r) => acc + r.leads, 0);

  const windowLabel = window === 'month'
    ? new Date(monthStart + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    : window === '30d' ? 'Last 30 days' : 'All time';

  const tab = (key: string, label: string, current: string, param: 'window' | 'seg') => {
    const params = new URLSearchParams({ window, seg });
    params.set(param, key);
    const active = current === key;
    return (
      <Link
        key={key}
        href={`/admin/insights?${params.toString()}`}
        className={'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ' + (active ? 'bg-[#0F6E56] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100')}
      >
        {label}
      </Link>
    );
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-sm font-black text-slate-900 hover:text-wellness-600">TheDripMap</Link>
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Admin / Insights</span>
          </div>
          <form action="/api/admin/logout" method="POST">
            <button className="text-xs font-bold text-slate-500 hover:text-rose-600">Sign out</button>
          </form>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-baseline gap-6 mb-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Listing insights</h1>
          <span className="text-sm font-bold text-slate-500">{windowLabel}</span>
        </div>
        <p className="text-sm text-slate-500 mb-5">
          First-party capture from /api/track. {rows.length} {seg === 'all' ? 'clinics' : seg + ' clinics'} shown. Use these numbers as outreach proof for unclaimed clinics.
        </p>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-1">Window</span>
          {tab('30d', 'Last 30 days', window, 'window')}
          {tab('month', 'This month', window, 'window')}
          {tab('all', 'All time', window, 'window')}
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 mr-1">Segment</span>
          {tab('all', 'All', seg, 'seg')}
          {tab('claimed', 'Claimed', seg, 'seg')}
          {tab('unclaimed', 'Unclaimed', seg, 'seg')}
        </div>

        {rolloutPending && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-900">
            <b className="font-black">View not found.</b> Run the DDL at
            <code className="mx-1 px-1.5 py-0.5 bg-amber-100 rounded text-[12px]">scripts/sql/listing_events.sql</code>
            in the Supabase SQL editor to create the listing_events_monthly view.
          </div>
        )}

        {/* Totals strip. "Leads" (real submitted messages) is highlighted and
            kept distinct from "Msg clicks" (button taps, intent only). */}
        <div className="grid grid-cols-2 md:grid-cols-9 gap-3 mb-3">
          {([
            ['Leads', totalLeads, true],
            ['Views', totals.view, false],
            ['All clicks', totalClicks, false],
            ['Book', totals.book_click, false],
            ['Book form', totals.booking_click, false],
            ['Call', totals.call_click, false],
            ['Website', totals.website_click, false],
            ['Directions', totals.directions_click, false],
            ['Msg clicks', totals.message_click, false],
          ] as [string, number, boolean][]).map(([label, n, highlight]) => (
            <div key={label} className={'rounded-2xl p-4 border ' + (highlight ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200')}>
              <div className={'text-[10px] font-black uppercase tracking-widest ' + (highlight ? 'text-emerald-700' : 'text-slate-400')}>{label}</div>
              <div className={'text-2xl font-black mt-1 ' + (highlight ? 'text-emerald-700' : 'text-slate-900')}>{n}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mb-8"><b className="text-slate-500">Leads</b> = patients who actually submitted the Message Clinic form (saved in full, shown in <Link href="/admin/leads" className="text-wellness-700 font-bold hover:underline">/admin/leads</Link>). <b className="text-slate-500">Msg clicks</b> = taps on the Message button (intent only, no message sent). They will differ whenever someone opens the form and does not send.</p>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-black text-slate-700">Clinic</th>
                  <th className="text-left px-4 py-3 font-black text-slate-700">City</th>
                  <th className="text-center px-3 py-3 font-black text-slate-700">Status</th>
                  <th className="text-right px-3 py-3 font-black text-emerald-700">Leads</th>
                  <th className="text-right px-3 py-3 font-black text-slate-700">Views</th>
                  <th className="text-right px-3 py-3 font-black text-slate-700">Clicks</th>
                  <th className="text-right px-3 py-3 font-black text-slate-700">Book</th>
                  <th className="text-right px-3 py-3 font-black text-slate-700">Book form</th>
                  <th className="text-right px-3 py-3 font-black text-slate-700">Call</th>
                  <th className="text-right px-3 py-3 font-black text-slate-700">Website</th>
                  <th className="text-right px-3 py-3 font-black text-slate-700">Direction</th>
                  <th className="text-right px-3 py-3 font-black text-slate-700">Msg clicks</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={12} className="px-4 py-12 text-center text-sm text-slate-400 font-medium">
                      No listing activity captured yet for this window/segment.
                    </td>
                  </tr>
                )}
                {rows.map((r) => (
                  <tr key={r.provider_id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      {r.slug ? (
                        <Link href={`/providers/${r.slug}`} target="_blank" rel="noopener noreferrer" className="font-bold text-slate-900 hover:text-wellness-600">
                          {r.name}
                        </Link>
                      ) : (
                        <span className="font-bold text-slate-900">{r.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.city}{r.state ? `, ${r.state}` : ''}</td>
                    <td className="px-3 py-3 text-center">
                      {r.is_claimed ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700">CLAIMED</span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-500">unclaimed</span>
                      )}
                    </td>
                    <td className={'px-3 py-3 text-right tabular-nums font-black ' + (r.leads > 0 ? 'text-emerald-700' : 'text-slate-300')}>{r.leads}</td>
                    <td className="px-3 py-3 text-right tabular-nums font-bold text-slate-900">{r.view}</td>
                    <td className="px-3 py-3 text-right tabular-nums font-bold text-slate-900">{r.total_clicks}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-700">{r.book_click}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-700">{r.booking_click}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-700">{r.call_click}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-700">{r.website_click}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-700">{r.directions_click}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-700">{r.message_click}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
