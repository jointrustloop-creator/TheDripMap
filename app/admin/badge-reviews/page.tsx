/**
 * /admin/badge-reviews - Safety Verified review queue.
 *
 * Safety Verified is human-reviewed (2026-07-25). Completing the /finish safety
 * section sets providers.safety_review_status = 'pending' and stores the answers
 * (providers.decision_drivers.manage). The badge (safety_verified) only turns on
 * when the operator clicks Approve here. Decline records a reason and leaves the
 * badge off. This is the ONLY badge-granting surface.
 */
import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { isAdminRequest } from '../../../src/lib/admin-auth';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Badge Reviews | TheDripMap', robots: { index: false, follow: false } };

interface Row {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  state: string | null;
  country: string | null;
  is_claimed: boolean | null;
  safety_verified: boolean | null;
  safety_review_status: string | null;
  safety_reviewed_at: string | null;
  safety_review_reason: string | null;
  safety_review_requested_at: string | null;
  decision_drivers: Record<string, unknown> | null;
}

function answers(dd: Record<string, unknown> | null) {
  const manage = (dd && typeof dd === 'object' ? (dd as { manage?: unknown }).manage : null) as
    | { team?: { whoPlaces?: string[]; oversight?: string }; sourcing?: string[] }
    | null;
  const who = Array.isArray(manage?.team?.whoPlaces) ? manage!.team!.whoPlaces!.join(', ') : '';
  const oversight = typeof manage?.team?.oversight === 'string' ? manage!.team!.oversight! : '';
  const sourcing = Array.isArray(manage?.sourcing) ? manage!.sourcing!.join(', ') : '';
  return { who, oversight, sourcing };
}

export default async function BadgeReviewsPage() {
  if (!(await isAdminRequest())) {
    redirect('/admin/login?next=/admin/badge-reviews');
  }

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data, error } = await sb
    .from('providers')
    .select('id,name,slug,city,state,country,is_claimed,safety_verified,safety_review_status,safety_reviewed_at,safety_review_reason,safety_review_requested_at,decision_drivers')
    .in('safety_review_status', ['pending', 'incomplete'])
    .order('safety_review_status', { ascending: true })
    .order('name', { ascending: true });

  const tableMissing = !!error && /safety_review_status/.test(error.message || '');
  const rows = (data || []) as Row[];

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-black text-slate-900 mb-2">Badge Reviews</h1>
      <p className="text-sm text-slate-500 mb-6 max-w-2xl">
        Safety Verified is granted only here, by you. Approving flips the badge on and stamps who reviewed it.
        Declining records a reason and leaves the badge off. US clinics stay pending while the US pause holds.
      </p>

      {tableMissing && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
          The review columns do not exist yet. Paste scripts/create-badge-review-columns.sql into the Supabase SQL
          editor, then run scripts/_reconcile-badges.cjs to queue the machine-granted badges.
        </div>
      )}

      {!tableMissing && rows.length === 0 && (
        <div className="text-slate-500 text-sm">No clinics awaiting review.</div>
      )}

      <div className="space-y-4">
        {rows.map((r) => {
          const a = answers(r.decision_drivers);
          const isUS = (r.country || '').toLowerCase().includes('united states');
          return (
            <div key={r.id} className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    r.safety_review_status === 'incomplete' ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {r.safety_review_status === 'incomplete' ? 'completion requested' : 'pending'}
                </span>
                {r.safety_review_requested_at && (
                  <span className="text-[11px] font-bold text-slate-400">
                    asked {new Date(r.safety_review_requested_at).toISOString().slice(0, 10)}
                  </span>
                )}
                <span className="font-black text-slate-900">{r.name}</span>
                <span className="text-slate-400 text-sm">
                  {[r.city, r.state].filter(Boolean).join(', ')}
                </span>
                {isUS && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[11px] font-bold">
                    US, keep pending during pause
                  </span>
                )}
                {r.is_claimed !== true && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">
                    not claimed
                  </span>
                )}
                <a href={`/providers/${r.slug}`} target="_blank" className="text-wellness-700 text-sm font-bold underline underline-offset-2">
                  preview listing
                </a>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 mb-4 text-sm space-y-1.5">
                <div className="font-bold text-slate-700 mb-1 text-xs uppercase tracking-wide">Questionnaire answers</div>
                <div className="text-slate-700"><span className="font-semibold">Who administers IVs:</span> {a.who || <em className="text-slate-400">not answered</em>}</div>
                <div className="text-slate-700"><span className="font-semibold">Medical oversight:</span> {a.oversight || <em className="text-slate-400">not answered</em>}</div>
                <div className="text-slate-700"><span className="font-semibold">Ingredient sourcing:</span> {a.sourcing || <em className="text-slate-400">not answered</em>}</div>
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                <form action="/api/admin/badge-review-action" method="post">
                  <input type="hidden" name="action" value="approve" />
                  <input type="hidden" name="provider_id" value={r.id} />
                  <button
                    disabled={r.is_claimed !== true}
                    className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
                    title={r.is_claimed !== true ? 'Only claimed clinics can be approved' : 'Grant the Safety Verified badge'}
                  >
                    Approve badge
                  </button>
                </form>
                <form action="/api/admin/badge-review-action" method="post">
                  <input type="hidden" name="action" value="request_completion" />
                  <input type="hidden" name="provider_id" value={r.id} />
                  <button
                    className="px-4 py-2 rounded-lg bg-sky-600 text-white text-xs font-black hover:bg-sky-700"
                    title="Ask the clinic to finish its safety answers. Emails you a draft; nothing goes to the clinic automatically."
                  >
                    Request completion
                  </button>
                </form>
                <form action="/api/admin/badge-review-action" method="post" className="flex gap-2 items-center">
                  <input type="hidden" name="action" value="decline" />
                  <input type="hidden" name="provider_id" value={r.id} />
                  <input name="reason" placeholder="decline reason" className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs w-48" />
                  <button className="px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-black hover:bg-rose-700">
                    Decline
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
