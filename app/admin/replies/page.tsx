/**
 * /admin/replies
 *
 * Admin-gated, noindex. Last 50 inbound replies with classification +
 * matched clinic + Gmail thread link + a "Mark handled" form.
 *
 * Linked from /admin/insights and /admin/tools.
 */
import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { isAdminRequest } from '../../../src/lib/admin-auth';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

interface ReplyRow {
  id: string;
  from_email: string;
  from_name: string | null;
  subject: string | null;
  snippet: string | null;
  category: string;
  needs_human: boolean;
  matched_provider_ids: string[] | null;
  matched_via: string | null;
  gmail_thread_url: string | null;
  handled_at: string | null;
  received_at: string;
}

function categoryBadge(cat: string): { label: string; cls: string } {
  switch (cat) {
    case 'interested':     return { label: 'INTERESTED',     cls: 'bg-emerald-100 text-emerald-800' };
    case 'question':       return { label: 'QUESTION',       cls: 'bg-amber-100 text-amber-800' };
    case 'not_interested': return { label: 'OPT-OUT',        cls: 'bg-rose-100 text-rose-800' };
    case 'bounce':         return { label: 'BOUNCE',         cls: 'bg-slate-200 text-slate-700' };
    case 'auto_reply':     return { label: 'AUTO/OOO',       cls: 'bg-sky-100 text-sky-800' };
    case 'unclear':        return { label: 'UNCLEAR',        cls: 'bg-yellow-100 text-yellow-800' };
    default:               return { label: cat.toUpperCase(), cls: 'bg-slate-100 text-slate-700' };
  }
}

export default async function AdminRepliesPage() {
  if (!(await isAdminRequest())) {
    redirect('/admin/login?next=/admin/replies');
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: rowsRaw } = await supabase
    .from('email_replies')
    .select('id, from_email, from_name, subject, snippet, category, needs_human, matched_provider_ids, matched_via, gmail_thread_url, handled_at, received_at')
    .order('received_at', { ascending: false })
    .limit(50);
  const rows = (rowsRaw || []) as ReplyRow[];

  // Resolve clinic names for the first matched provider on each row.
  const providerIds = Array.from(
    new Set(rows.flatMap((r) => r.matched_provider_ids || []).filter(Boolean)),
  );
  const provMap = new Map<string, { name: string | null; city: string | null; state: string | null; slug: string | null }>();
  if (providerIds.length > 0) {
    const { data: provs } = await supabase
      .from('providers')
      .select('id, name, slug, city, state')
      .in('id', providerIds);
    for (const p of (provs || []) as Array<{ id: string; name: string | null; slug: string | null; city: string | null; state: string | null }>) {
      provMap.set(p.id, { name: p.name, city: p.city, state: p.state, slug: p.slug });
    }
  }

  const counts = {
    total: rows.length,
    needsResponse: rows.filter((r) => !r.handled_at && (r.needs_human || r.category === 'interested' || r.category === 'question')).length,
    interested: rows.filter((r) => r.category === 'interested').length,
    optOut:     rows.filter((r) => r.category === 'not_interested').length,
    bounced:    rows.filter((r) => r.category === 'bounce').length,
    auto:       rows.filter((r) => r.category === 'auto_reply').length,
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm font-black text-slate-900 hover:text-wellness-600">
              TheDripMap
            </Link>
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
              Admin / Replies
            </span>
            <Link href="/admin/insights" className="text-xs font-bold text-slate-500 hover:text-wellness-600">
              Insights →
            </Link>
            <Link href="/admin/tools" className="text-xs font-bold text-slate-500 hover:text-wellness-600">
              Tools →
            </Link>
            <Link href="/admin/leads" className="text-xs font-bold text-slate-500 hover:text-wellness-600">
              Leads →
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
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Inbound replies</h1>
        <p className="text-sm text-slate-500 mb-6">
          Last 50 inbound messages to info@thedripmap.com, matched to clinics where possible.
          {' '}{counts.total} total · {counts.needsResponse} needs response · {counts.interested} interested · {counts.optOut} opt-out · {counts.bounced} bounce · {counts.auto} auto/OOO
        </p>

        {rows.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 px-8 py-16 text-center">
            <p className="text-sm font-medium text-slate-500">
              No replies yet. The hourly cron will populate this table the next time an inbound message arrives.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="text-left px-4 py-3 font-bold">Date</th>
                  <th className="text-left px-4 py-3 font-bold">Clinic</th>
                  <th className="text-left px-4 py-3 font-bold">From</th>
                  <th className="text-left px-4 py-3 font-bold">Category</th>
                  <th className="text-left px-4 py-3 font-bold">Snippet</th>
                  <th className="text-left px-4 py-3 font-bold">Thread</th>
                  <th className="text-left px-4 py-3 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const pid = (r.matched_provider_ids || [])[0];
                  const p = pid ? provMap.get(pid) : undefined;
                  const clinic = p?.name || (r.matched_provider_ids && r.matched_provider_ids.length > 0 ? '(no name)' : '(unmatched)');
                  const loc = [p?.city, p?.state].filter(Boolean).join(', ');
                  const badge = categoryBadge(r.category);
                  const isNeedsResponse = !r.handled_at && (r.needs_human || r.category === 'interested' || r.category === 'question');
                  return (
                    <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50/60 align-top">
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(r.received_at).toISOString().slice(0, 16).replace('T', ' ')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{clinic}</div>
                        {loc && <div className="text-xs text-slate-500">{loc}</div>}
                        {(r.matched_provider_ids || []).length > 1 && (
                          <div className="text-xs text-amber-700">+{(r.matched_provider_ids || []).length - 1} more</div>
                        )}
                        {r.matched_via && (
                          <div className="text-[10px] uppercase tracking-wider text-slate-400 mt-1">via {r.matched_via}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {r.from_name && <div className="font-medium text-slate-700">{r.from_name}</div>}
                        <div className="text-slate-500">{r.from_email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 max-w-md">
                        {r.subject && <div className="font-medium text-slate-700 mb-0.5">{r.subject}</div>}
                        {r.snippet ? r.snippet.slice(0, 160) + (r.snippet.length > 160 ? '...' : '') : '(no snippet)'}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {r.gmail_thread_url ? (
                          <a
                            href={r.gmail_thread_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-wellness-600 hover:underline font-medium"
                          >
                            Open in Gmail
                          </a>
                        ) : (
                          <span className="text-slate-400">no link</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {r.handled_at ? (
                          <span className="text-slate-500">handled</span>
                        ) : isNeedsResponse ? (
                          <form action="/api/admin/mark-reply-handled" method="POST">
                            <input type="hidden" name="id" value={r.id} />
                            <button
                              className="px-2 py-1 rounded bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-slate-700"
                              type="submit"
                            >
                              Mark handled
                            </button>
                          </form>
                        ) : (
                          <span className="text-slate-400">auto</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
