/**
 * /admin/onboarding - W1 onboarding queue.
 *
 * One line per clinic in the onboarding pipeline: status, preview link,
 * assembled safety evidence, and the operator's click-actions (send now,
 * park, mark replied/published, flip safety_verified). This page's
 * flip_safety_verified action is a manual/backfill path only, NOT the
 * primary one: since 2026-06-19 the badge auto-grants when a claimed owner
 * completes the safety section of the /finish questionnaire (see
 * src/lib/safety.ts, app/api/finish-listing/route.ts). Human eyes on
 * badged clinics come from the monthly spot check in the weekly report,
 * not from a per-claim review gate here.
 */
import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { isAdminRequest } from '../../../src/lib/admin-auth';
import { ONBOARDING_AUTOSEND } from '../../../src/lib/onboarding';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

interface QueueRow {
  id: string;
  provider_id: string;
  owner_email: string | null;
  owner_name: string | null;
  status: string;
  sent_at: string | null;
  nudge_sent_at: string | null;
  reply_received_at: string | null;
  published_at: string | null;
  answers: Record<string, unknown> | null;
  assets: Record<string, unknown> | null;
  safety_evidence: Record<string, unknown> | null;
  parked_reason: string | null;
  operator_notes: string | null;
  created_at: string;
}

interface ProviderLite {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  safety_verified: boolean | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending_send: 'bg-amber-100 text-amber-800',
  sent: 'bg-sky-100 text-sky-800',
  nudged: 'bg-sky-50 text-sky-600',
  replied: 'bg-violet-100 text-violet-800',
  parked: 'bg-rose-100 text-rose-800',
  published: 'bg-emerald-100 text-emerald-800',
};

function fmt(d: string | null): string {
  if (!d) return '';
  return new Date(d).toISOString().slice(0, 10);
}

export default async function AdminOnboardingPage() {
  if (!(await isAdminRequest())) {
    redirect('/admin/login?next=/admin/onboarding');
  }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: rows, error } = await sb
    .from('onboarding_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  const tableMissing = !!error && /onboarding_requests/.test(error.message || '');
  const queue = (rows || []) as QueueRow[];

  const providerIds = queue.map((r) => r.provider_id);
  const providersById = new Map<string, ProviderLite>();
  if (providerIds.length > 0) {
    const { data: provs } = await sb
      .from('providers')
      .select('id, name, slug, city, safety_verified')
      .in('id', providerIds);
    for (const p of (provs || []) as ProviderLite[]) providersById.set(p.id, p);
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-black text-slate-900 mb-2">Onboarding queue</h1>
      <p className="text-sm text-slate-500 mb-6">
        Auto-send gate:{' '}
        <span className={ONBOARDING_AUTOSEND ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
          {ONBOARDING_AUTOSEND ? 'OPEN (emails fire on verify)' : 'CLOSED (rows queue only; use Send now)'}
        </span>
      </p>

      {tableMissing && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
          The onboarding_requests table does not exist yet. Paste
          scripts/create-onboarding-engine-tables.sql into the Supabase SQL editor.
        </div>
      )}

      {!tableMissing && queue.length === 0 && (
        <div className="text-slate-500 text-sm">Queue is empty.</div>
      )}

      <div className="space-y-4">
        {queue.map((r) => {
          const p = providersById.get(r.provider_id);
          const evidence = r.safety_evidence ? Object.entries(r.safety_evidence) : [];
          return (
            <div key={r.id} className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[r.status] || 'bg-slate-100 text-slate-600'}`}>
                  {r.status}
                </span>
                <span className="font-black text-slate-900">{p?.name || r.provider_id}</span>
                {p?.city && <span className="text-slate-400 text-sm">{p.city}</span>}
                {p && (
                  <a
                    href={`/providers/${p.slug}`}
                    target="_blank"
                    className="text-wellness-700 text-sm font-bold underline underline-offset-2"
                  >
                    preview listing
                  </a>
                )}
                {p?.safety_verified === true && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold">
                    safety_verified
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-500 mb-3">
                {r.owner_name || 'unknown owner'} &lt;{r.owner_email || 'no email'}&gt;
                {r.sent_at && <> | sent {fmt(r.sent_at)}</>}
                {r.nudge_sent_at && <> | nudged {fmt(r.nudge_sent_at)}</>}
                {r.reply_received_at && <> | replied {fmt(r.reply_received_at)}</>}
                {r.published_at && <> | published {fmt(r.published_at)}</>}
                {r.parked_reason && <> | parked: {r.parked_reason}</>}
              </div>

              {evidence.length > 0 && (
                <div className="bg-slate-50 rounded-xl p-3 mb-3 text-xs">
                  <div className="font-bold text-slate-700 mb-1">Safety evidence</div>
                  {evidence.map(([k, v]) => (
                    <div key={k} className="text-slate-600">
                      <span className="font-semibold">{k}:</span> {typeof v === 'string' ? v : JSON.stringify(v)}
                    </div>
                  ))}
                </div>
              )}

              {r.operator_notes && (
                <div className="text-xs text-slate-500 mb-3 italic">{r.operator_notes}</div>
              )}

              <div className="flex flex-wrap gap-2">
                {r.status === 'pending_send' && (
                  <form action="/api/admin/onboarding-action" method="post">
                    <input type="hidden" name="action" value="send_now" />
                    <input type="hidden" name="request_id" value={r.id} />
                    <button className="px-3 py-1.5 rounded-lg bg-wellness-600 text-white text-xs font-bold hover:bg-wellness-700">
                      Send onboarding email now
                    </button>
                  </form>
                )}
                {(r.status === 'sent' || r.status === 'nudged') && (
                  <form action="/api/admin/onboarding-action" method="post">
                    <input type="hidden" name="action" value="mark_replied" />
                    <input type="hidden" name="request_id" value={r.id} />
                    <button className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-bold hover:bg-violet-700">
                      Mark replied
                    </button>
                  </form>
                )}
                {r.status === 'replied' && (
                  <form action="/api/admin/onboarding-action" method="post">
                    <input type="hidden" name="action" value="mark_published" />
                    <input type="hidden" name="request_id" value={r.id} />
                    <button className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700">
                      Mark published
                    </button>
                  </form>
                )}
                {r.status !== 'parked' && r.status !== 'published' && (
                  <form action="/api/admin/onboarding-action" method="post" className="flex gap-2 items-center">
                    <input type="hidden" name="action" value="park" />
                    <input type="hidden" name="request_id" value={r.id} />
                    <input
                      name="reason"
                      placeholder="park reason"
                      className="border border-slate-200 rounded-lg px-2 py-1 text-xs"
                    />
                    <button className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700">
                      Park
                    </button>
                  </form>
                )}
                {r.status === 'parked' && (
                  <form action="/api/admin/onboarding-action" method="post">
                    <input type="hidden" name="action" value="unpark" />
                    <input type="hidden" name="request_id" value={r.id} />
                    <button className="px-3 py-1.5 rounded-lg bg-slate-600 text-white text-xs font-bold hover:bg-slate-700">
                      Unpark
                    </button>
                  </form>
                )}
                {p && p.safety_verified !== true && (r.status === 'replied' || r.status === 'published') && (
                  <form action="/api/admin/onboarding-action" method="post">
                    <input type="hidden" name="action" value="flip_safety_verified" />
                    <input type="hidden" name="request_id" value={r.id} />
                    <button className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800">
                      Flip safety_verified
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
