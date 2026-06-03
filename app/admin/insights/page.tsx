/**
 * /admin/insights
 *
 * Per-listing analytics dashboard. Read-only, admin-gated, noindex.
 * Pulls the current-month rollup from public.listing_events_monthly
 * (a view defined in scripts/sql/listing_events.sql) and joins to
 * providers for clinic name + city + slug. Server-rendered.
 *
 * The owner-facing premium "profile insights" surface is intentionally
 * NOT built yet — this is the operator's read view so we can verify the
 * capture layer is working before we expose anything to clinics.
 */
import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { isAdminRequest } from '../../../src/lib/admin-auth';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

type EventType =
  | 'view'
  | 'book_click'
  | 'call_click'
  | 'website_click'
  | 'directions_click'
  | 'message_click';

interface MonthlyRow {
  provider_id: string;
  month: string;
  event_type: EventType;
  count: number;
}

interface ProviderRow {
  id: string;
  name: string | null;
  city: string | null;
  state: string | null;
  slug: string | null;
}

interface InsightRow {
  provider_id: string;
  name: string;
  city: string;
  state: string;
  slug: string;
  view: number;
  book_click: number;
  call_click: number;
  website_click: number;
  directions_click: number;
  message_click: number;
}

export default async function AdminInsightsPage() {
  if (!(await isAdminRequest())) {
    redirect('/admin/login?next=/admin/insights');
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // First day of the current calendar month, UTC. listing_events_monthly
  // bucket key is date_trunc('month', created_at)::date, so we filter
  // server-side on that exact value.
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);

  // Pull the current-month rollup. Capped at 5,000 rows (≈ 833 clinics
  // worth of activity), which is well above our current ceiling.
  const monthlyRes = await supabase
    .from('listing_events_monthly')
    .select('provider_id, month, event_type, count')
    .eq('month', monthStart)
    .limit(5000);

  // Defensive: if the view doesn't exist yet (operator hasn't run the
  // DDL), don't 500 — render the page with an empty-state banner.
  const rolloutPending = !!monthlyRes.error;
  const monthly = (monthlyRes.data || []) as MonthlyRow[];

  // Aggregate per provider.
  const byProvider = new Map<string, InsightRow>();
  for (const row of monthly) {
    let r = byProvider.get(row.provider_id);
    if (!r) {
      r = {
        provider_id: row.provider_id,
        name: '',
        city: '',
        state: '',
        slug: '',
        view: 0,
        book_click: 0,
        call_click: 0,
        website_click: 0,
        directions_click: 0,
        message_click: 0,
      };
      byProvider.set(row.provider_id, r);
    }
    if (row.event_type in r) {
      (r as unknown as Record<EventType, number>)[row.event_type] =
        ((r as unknown as Record<EventType, number>)[row.event_type] || 0) +
        Number(row.count || 0);
    }
  }

  const ids = Array.from(byProvider.keys());

  if (ids.length > 0) {
    const provRes = await supabase
      .from('providers')
      .select('id, name, city, state, slug')
      .in('id', ids);
    const provs = (provRes.data || []) as ProviderRow[];
    for (const p of provs) {
      const r = byProvider.get(p.id);
      if (!r) continue;
      r.name = p.name || '(unknown)';
      r.city = p.city || '';
      r.state = p.state || '';
      r.slug = p.slug || '';
    }
  }

  // Default sort: views desc, then book clicks desc, then name.
  const rows = Array.from(byProvider.values()).sort((a, b) => {
    if (b.view !== a.view) return b.view - a.view;
    if (b.book_click !== a.book_click) return b.book_click - a.book_click;
    return a.name.localeCompare(b.name);
  });

  const monthLabel = new Date(monthStart + 'T00:00:00Z').toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  // Totals for the header strip.
  const totals = rows.reduce(
    (acc, r) => {
      acc.view += r.view;
      acc.book_click += r.book_click;
      acc.call_click += r.call_click;
      acc.website_click += r.website_click;
      acc.directions_click += r.directions_click;
      acc.message_click += r.message_click;
      return acc;
    },
    {
      view: 0,
      book_click: 0,
      call_click: 0,
      website_click: 0,
      directions_click: 0,
      message_click: 0,
    }
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-black text-slate-900 hover:text-wellness-600"
            >
              TheDripMap
            </Link>
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
              Admin / Insights
            </span>
            <Link
              href="/admin/leads"
              className="text-xs font-bold text-slate-500 hover:text-wellness-600"
            >
              Leads
            </Link>
            <Link
              href="/admin/testimonials"
              className="text-xs font-bold text-slate-500 hover:text-wellness-600"
            >
              Testimonials
            </Link>
          </div>
          <form action="/api/admin/logout" method="POST">
            <button className="text-xs font-bold text-slate-500 hover:text-rose-600">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-baseline gap-6 mb-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Listing insights
          </h1>
          <span className="text-sm font-bold text-slate-500">{monthLabel}</span>
        </div>
        <p className="text-sm text-slate-500 mb-8">
          First-party capture from /api/track. {rows.length} clinics with activity this month. Sorted by views.
        </p>

        {rolloutPending && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-900">
            <b className="font-black">View not found.</b> Run the DDL at
            <code className="mx-1 px-1.5 py-0.5 bg-amber-100 rounded text-[12px]">
              scripts/sql/listing_events.sql
            </code>
            in the Supabase SQL editor to create the table and the
            listing_events_monthly view.
          </div>
        )}

        {/* Totals strip */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
          {(
            [
              ['Views', totals.view],
              ['Book', totals.book_click],
              ['Call', totals.call_click],
              ['Website', totals.website_click],
              ['Directions', totals.directions_click],
              ['Message', totals.message_click],
            ] as [string, number][]
          ).map(([label, n]) => (
            <div
              key={label}
              className="bg-white border border-slate-200 rounded-2xl p-4"
            >
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {label}
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1">{n}</div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-black text-slate-700">
                    Clinic
                  </th>
                  <th className="text-left px-4 py-3 font-black text-slate-700">
                    City
                  </th>
                  <th className="text-right px-3 py-3 font-black text-slate-700">
                    Views
                  </th>
                  <th className="text-right px-3 py-3 font-black text-slate-700">
                    Book
                  </th>
                  <th className="text-right px-3 py-3 font-black text-slate-700">
                    Call
                  </th>
                  <th className="text-right px-3 py-3 font-black text-slate-700">
                    Website
                  </th>
                  <th className="text-right px-3 py-3 font-black text-slate-700">
                    Directions
                  </th>
                  <th className="text-right px-3 py-3 font-black text-slate-700">
                    Message
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-12 text-center text-sm text-slate-400 font-medium"
                    >
                      No listing activity captured yet for {monthLabel}.
                    </td>
                  </tr>
                )}
                {rows.map((r) => (
                  <tr
                    key={r.provider_id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                  >
                    <td className="px-4 py-3">
                      {r.slug ? (
                        <Link
                          href={`/providers/${r.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-slate-900 hover:text-wellness-600"
                        >
                          {r.name || '(unknown)'}
                        </Link>
                      ) : (
                        <span className="font-bold text-slate-900">
                          {r.name || '(unknown)'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {r.city}
                      {r.state ? `, ${r.state}` : ''}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums font-bold text-slate-900">
                      {r.view}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-700">
                      {r.book_click}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-700">
                      {r.call_click}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-700">
                      {r.website_click}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-700">
                      {r.directions_click}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-700">
                      {r.message_click}
                    </td>
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
