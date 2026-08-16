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
    | {
        team?: {
          whoPlaces?: string[];
          oversight?: string;
          prescriberName?: string;
          prescriberCredential?: string;
          prescriberRegNum?: string;
          prescriberNdIvit?: boolean;
        };
        sourcing?: string[];
      }
    | null;
  const who = Array.isArray(manage?.team?.whoPlaces) ? manage!.team!.whoPlaces!.join(', ') : '';
  const oversight = typeof manage?.team?.oversight === 'string' ? manage!.team!.oversight! : '';
  const sourcing = Array.isArray(manage?.sourcing) ? manage!.sourcing!.join(', ') : '';
  const t = manage?.team;
  const prescriber = t?.prescriberName
    ? `${t.prescriberName}${t.prescriberCredential ? ` (${t.prescriberCredential})` : ''}${t.prescriberRegNum ? ` · reg# ${t.prescriberRegNum}` : ' · NO REG#'}${t.prescriberNdIvit ? ' · IVIT confirmed' : ''}`
    : '';
  return { who, oversight, sourcing, prescriber };
}

// Operator-verified prescriber record (Transparency Score rule 2026-08-16).
// Written only by the record_prescriber action; the score's oversight point
// counts ONLY when verified=true with a name and reg#.
function prescriberRecord(dd: Record<string, unknown> | null) {
  const p = (dd && typeof dd === 'object' ? (dd as { prescriber_verification?: unknown }).prescriber_verification : null) as
    | { name?: string; credential?: string; reg_num?: string; verified?: boolean; verified_at?: string | null }
    | null;
  if (!p || (!p.name && !p.reg_num)) return null;
  return {
    name: p.name || '',
    credential: p.credential || '',
    regNum: p.reg_num || '',
    verified: p.verified === true,
    verifiedAt: p.verified_at ? String(p.verified_at).slice(0, 10) : null,
  };
}

// The premises record, if an operator has looked the clinic up on the CONO
// IVIT Premises Register (L5 mirror; docs/badge-standard.md §4.5).
function premises(dd: Record<string, unknown> | null) {
  const p = (dd && typeof dd === 'object' ? (dd as { premises?: unknown }).premises : null) as
    | { status?: string; outcome?: string | null; checked_at?: string | null }
    | null;
  if (!p || !p.status) return null;
  return { status: String(p.status), outcome: p.outcome || null, checkedAt: p.checked_at || null };
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

  // All claimed clinics, for the prescriber-verification panel below. Renewal
  // replies come from already-approved clinics that are NOT in the review
  // queue, so this list is the entry point for recording their credentials.
  const { data: claimedData } = await sb
    .from('providers')
    .select('id,name,slug,city,state,country,is_claimed,safety_verified,safety_review_status,safety_reviewed_at,safety_review_reason,safety_review_requested_at,decision_drivers,transparency_score')
    .eq('is_claimed', true)
    .eq('is_hidden', false)
    .order('name', { ascending: true });
  const claimedRows = (claimedData || []) as (Row & { transparency_score: number | null })[];

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
                <div className="text-slate-700"><span className="font-semibold">Prescriber:</span> {a.prescriber || a.oversight || <em className="text-slate-400">not answered</em>}</div>
                <div className="text-slate-700"><span className="font-semibold">Ingredient sourcing:</span> {a.sourcing || <em className="text-slate-400">not answered</em>}</div>
                <div className="text-[11px] text-slate-500 pt-1.5 border-t border-slate-200 mt-2">
                  Check the registration before approving:{' '}
                  <a href="https://register.cpso.on.ca/" target="_blank" className="underline font-semibold">CPSO</a>{' · '}
                  <a href="https://registry.cno.org/" target="_blank" className="underline font-semibold">CNO</a>{' · '}
                  <a href="https://cono.alinityapp.com/client/publicdirectory" target="_blank" className="underline font-semibold">CONO ND</a>{' · '}
                  <a href="https://cono.alinityapp.com/client/findcorporationdirectory" target="_blank" className="underline font-semibold">CONO IVIT premises</a>
                </div>
              </div>

              {/* Premises record (L5). Shows what has been recorded; the form
                  below records a fresh lookup. Only 'authorized' ever renders
                  on the public listing. */}
              {(() => {
                const pv = premises(r.decision_drivers);
                return (
                  <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-4 mb-4 text-sm">
                    <div className="font-bold text-slate-700 mb-1 text-xs uppercase tracking-wide">
                      CONO IVIT premises (ND-prescriber clinics)
                    </div>
                    <div className="text-slate-700 mb-2">
                      {pv ? (
                        <>Recorded: <b>{pv.status}</b>{pv.outcome ? ` (${pv.outcome})` : ''}{pv.checkedAt ? `, checked ${pv.checkedAt}` : ''}</>
                      ) : (
                        <em className="text-slate-400">no lookup recorded yet</em>
                      )}
                    </div>
                    <form action="/api/admin/badge-review-action" method="post" className="flex flex-wrap gap-2 items-center">
                      <input type="hidden" name="action" value="record_premises" />
                      <input type="hidden" name="provider_id" value={r.id} />
                      <select name="premises_status" className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-white" defaultValue="authorized">
                        <option value="authorized">authorized (Active on register)</option>
                        <option value="not_listed">not listed (review item)</option>
                        <option value="unknown">unknown / not applicable</option>
                      </select>
                      <input name="premises_outcome" placeholder="outcome, e.g. Pass" className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs w-32" />
                      <input name="premises_note" placeholder="note (premise #, registrant seen...)" className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs w-64" />
                      <button className="px-3 py-2 rounded-lg bg-amber-600 text-white text-xs font-black hover:bg-amber-700">
                        Record lookup
                      </button>
                    </form>
                  </div>
                );
              })()}

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

      {/* PRESCRIBER VERIFICATION (Transparency Score rule, 2026-08-16).
          Separate from the review queue on purpose: badge-renewal replies come
          from clinics that are already approved, so they never appear above.
          Recording a name + reg# and ticking "verified" restores the clinic's
          7th transparency point; unticking removes it again. */}
      <div className="mt-14">
        <h2 className="text-2xl font-black text-slate-900 mb-2">Prescriber verification</h2>
        <p className="text-sm text-slate-500 mb-6 max-w-2xl">
          The 7th transparency point (&quot;Prescriber verified with their regulator&quot;) counts only when you
          record a prescriber name and registration number here and tick verified, having checked the public
          register yourself. Self-declared answers never earn it, so a clinic tops out at 6 of 7 until you do.
          Enter renewal replies here as they arrive.
        </p>
        <div className="text-[11px] text-slate-500 mb-5">
          Registers:{' '}
          <a href="https://register.cpso.on.ca/" target="_blank" className="underline font-semibold">CPSO</a>{' · '}
          <a href="https://registry.cno.org/" target="_blank" className="underline font-semibold">CNO</a>{' · '}
          <a href="https://cono.alinityapp.com/client/publicdirectory" target="_blank" className="underline font-semibold">CONO ND</a>{' · '}
          <a href="https://cchpbc.ca/find-a-registrant/" target="_blank" className="underline font-semibold">CCHPBC (BC)</a>
        </div>

        <div className="space-y-3">
          {claimedRows.map((c) => {
            const rec = prescriberRecord(c.decision_drivers);
            const a = answers(c.decision_drivers);
            return (
              <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-4">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <span className="font-black text-slate-900">{c.name}</span>
                  <span className="text-slate-400 text-sm">{[c.city, c.state].filter(Boolean).join(', ')}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      rec?.verified ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {rec?.verified ? `verified${rec.verifiedAt ? ` ${rec.verifiedAt}` : ''}` : 'not verified'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">
                    score {typeof c.transparency_score === 'number' ? `${c.transparency_score} of 7` : 'not scored'}
                  </span>
                  <a href={`/providers/${c.slug}`} target="_blank" className="text-wellness-700 text-xs font-bold underline underline-offset-2">
                    listing
                  </a>
                </div>
                {a.prescriber && (
                  <div className="text-[11px] text-slate-500 mb-2">
                    Owner stated: {a.prescriber}
                  </div>
                )}
                <form action="/api/admin/badge-review-action" method="post" className="flex flex-wrap gap-2 items-center">
                  <input type="hidden" name="action" value="record_prescriber" />
                  <input type="hidden" name="provider_id" value={c.id} />
                  <input
                    name="prescriber_name"
                    placeholder="prescriber full name"
                    defaultValue={rec?.name || ''}
                    className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs w-56"
                  />
                  <input
                    name="prescriber_credential"
                    placeholder="MD / NP / ND"
                    defaultValue={rec?.credential || ''}
                    className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs w-28"
                  />
                  <input
                    name="prescriber_reg_num"
                    placeholder="registration number"
                    defaultValue={rec?.regNum || ''}
                    className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs w-44"
                  />
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <input type="checkbox" name="prescriber_verified" defaultChecked={rec?.verified === true} />
                    I checked the register
                  </label>
                  <button className="px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-black hover:bg-slate-800">
                    Save
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
