/**
 * /admin/listing-gaps — what every CLAIMED listing is still missing.
 *
 * Why this page exists (2026-09-08): we tell clinic owners on /for-clinics that
 * claiming makes their listing complete and prominent, but only 3 of 29 claimed
 * Canadian clinics actually render complete. Worse, 19 have NO stored /finish
 * answers even though several answered our questions BY EMAIL: those answers
 * were never written anywhere, so the listing looks unfinished and the Safety
 * Verified badge silently lapsed (the Signature Beauty case). The gap was
 * invisible because it took a hand-written script to see it. Now it is a page.
 *
 * Two actions per clinic:
 *   - Record answers: opens the clinic's real /finish form in OPERATOR MODE, so
 *     answers the owner already gave us by email get written through the exact
 *     same validated path the owner uses. No second write path to drift, and the
 *     save is stamped operator-recorded (see FinishListingForm provenance).
 *   - Owner link: the clinic's own private link, to paste into an email so the
 *     owner can finish it themselves. Always prefer this when the owner is
 *     responsive; recording is for answers already sitting in a thread.
 *
 * Read-only: this page never writes. Admin-cookie authenticated.
 */
import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { isAdminRequest } from '../../../src/lib/admin-auth';
import { manageUrlFrom } from '../../../src/lib/manage-token';
import { assessCompleteness, type CompletenessRow } from '../../../src/lib/display-complete';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

interface Row {
  id: string;
  name: string;
  slug: string | null;
  email: string | null;
  city: string | null;
  working_hours: unknown;
  price_range: string | null;
  image_url: string | null;
  photos: unknown;
  decision_drivers: unknown;
  manage_token?: string | null;
  safety_verified: boolean | null;
  safety_review_status: string | null;
}

export default async function ListingGapsPage() {
  if (!(await isAdminRequest())) redirect('/admin/login?next=/admin/listing-gaps');

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data, error } = await sb
    .from('providers')
    .select('*')
    .eq('country', 'Canada')
    .eq('is_claimed', true)
    .eq('is_hidden', false)
    .order('claimed_at', { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 p-10">
        <div className="max-w-3xl mx-auto p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 font-bold">
          Could not load listings: {error.message}
        </div>
      </main>
    );
  }

  const rows = (data || []) as Row[];

  // Older claims recorded the medical director on operator_profiles, not the
  // provider row; the completeness check reads both. One query, mapped by id.
  const { data: profs } = await sb
    .from('operator_profiles')
    .select('clinic_id, owner_name, profile_data')
    .in('clinic_id', rows.map((r) => r.id));
  const profileBy = new Map((profs || []).map((p) => [p.clinic_id as string, p]));

  const assessed = rows.map((r) => {
    const dd = (r.decision_drivers && typeof r.decision_drivers === 'object')
      ? (r.decision_drivers as Record<string, unknown>)
      : {};
    const manage = (dd.manage && typeof dd.manage === 'object')
      ? (dd.manage as Record<string, unknown>)
      : null;
    const hasAnswers = !!manage && Object.keys(manage).length > 0;
    const recordedVia = manage && typeof manage.recordedVia === 'string' ? (manage.recordedVia as string) : null;

    // ONE definition of display-complete (src/lib/display-complete.ts), shared
    // with the nightly report and the owner's Profile Strength. "answers" (the
    // safety questionnaire) is tracked here in addition, because it gates the
    // badge, but it is not part of display completeness.
    const c = assessCompleteness({ ...(r as unknown as CompletenessRow), operator_profile: profileBy.get(r.id) || null });
    const photoCount = Array.isArray(r.photos) ? (r.photos as unknown[]).length : 0;
    const missing: string[] = [...(hasAnswers ? [] : ['answers']), ...c.missing.map((m) => m.key)];
    const strength = c.strength;

    const badge = r.safety_verified === true && r.safety_review_status === 'approved'
      ? 'live'
      : (r.safety_review_status || 'none');

    // Read the token we already fetched rather than minting one: this page must
    // stay read-only. A row without a token shows no link (rare; /admin/tools
    // resend-finish-link mints one).
    const ddToken = typeof dd.manage_token === 'string' ? (dd.manage_token as string) : '';
    const token = (typeof r.manage_token === 'string' && r.manage_token) || ddToken || '';
    const ownerUrl = token ? manageUrlFrom(r.id, token) : null;

    return { r, missing, hasAnswers, recordedVia, badge, ownerUrl, photoCount, strength };
  });

  // Worst first: no answers is the deepest hole (it is what gates the badge),
  // then simply the count of missing pieces.
  const ranked = [...assessed].sort((a, b) => {
    if (a.hasAnswers !== b.hasAnswers) return a.hasAnswers ? 1 : -1;
    return b.missing.length - a.missing.length;
  });

  const complete = assessed.filter((a) => a.missing.length === 0).length;
  const noAnswers = assessed.filter((a) => !a.hasAnswers).length;
  const badgeLive = assessed.filter((a) => a.badge === 'live').length;
  const count = (k: string) => assessed.filter((a) => a.missing.includes(k)).length;

  const stats = [
    { label: 'Claimed', value: assessed.length, tone: 'text-slate-900' },
    { label: 'Display-complete', value: complete, tone: complete < assessed.length / 2 ? 'text-rose-600' : 'text-emerald-600' },
    { label: 'No stored answers', value: noAnswers, tone: noAnswers ? 'text-rose-600' : 'text-emerald-600' },
    { label: 'Badge live', value: badgeLive, tone: 'text-amber-600' },
    { label: 'No hours', value: count('hours'), tone: 'text-slate-700' },
    { label: 'No prices', value: count('prices'), tone: 'text-slate-700' },
    { label: 'No photo', value: count('photo'), tone: 'text-slate-700' },
    { label: 'No practitioner', value: count('practitioner'), tone: 'text-slate-700' },
    { label: 'No contact', value: count('contact'), tone: 'text-slate-700' },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-6 flex-wrap">
          <Link href="/" className="text-sm font-black text-slate-900 hover:text-wellness-600">TheDripMap</Link>
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">Admin / Listing gaps</span>
          <Link href="/admin/badge-reviews" className="text-xs font-bold text-slate-500 hover:text-wellness-600">Badge reviews →</Link>
          <Link href="/admin/outreach" className="text-xs font-bold text-slate-500 hover:text-wellness-600">Outreach →</Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">What claimed listings are missing</h1>
        <p className="text-sm text-slate-500 mb-7 max-w-3xl leading-relaxed">
          Every clinic that trusted us enough to claim. <b>Record answers</b> opens their real finish form in
          operator mode, for answers an owner already gave us by email; it saves through the same path the owner
          uses and is stamped as operator-recorded. <b>Owner link</b> is their private link to send them instead.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
          {stats.map((s) => (
            <div key={s.label} className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
              <div className={`text-2xl font-black tabular-nums ${s.tone}`}>{s.value}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden">
          {ranked.map(({ r, missing, hasAnswers, recordedVia, badge, ownerUrl, photoCount }) => (
            <div key={r.id} className="p-4 flex flex-wrap items-center gap-x-3 gap-y-2">
              <span
                title={missing.length ? `Missing ${missing.join(', ')}` : 'Nothing missing'}
                className={
                  'w-2.5 h-2.5 rounded-full shrink-0 ' +
                  (missing.length === 0 ? 'bg-emerald-500' : !hasAnswers ? 'bg-rose-500' : 'bg-amber-400')
                }
              />
              <div className="min-w-[220px] flex-1">
                <div className="text-sm font-black text-slate-900 leading-tight">{r.name}</div>
                <div className="text-[11px] font-bold text-slate-400">
                  {r.city || 'city unknown'} · {r.email || 'NO EMAIL'}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {missing.length === 0 ? (
                  <span className="text-[10px] font-black uppercase tracking-tight px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                    complete
                  </span>
                ) : (
                  missing.map((m) => (
                    <span
                      key={m}
                      className={
                        'text-[10px] font-black uppercase tracking-tight px-2 py-1 rounded-md border ' +
                        (m === 'answers'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-slate-50 text-slate-600 border-slate-200')
                      }
                    >
                      no {m}
                    </span>
                  ))
                )}
                <span
                  title="Safety Verified review state"
                  className={
                    'text-[10px] font-black uppercase tracking-tight px-2 py-1 rounded-md border ' +
                    (badge === 'live'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-white text-slate-400 border-slate-200')
                  }
                >
                  badge {badge}
                </span>
                {recordedVia === 'operator' && (
                  <span
                    title="These answers were recorded by an operator from another channel, not entered by the owner"
                    className="text-[10px] font-black uppercase tracking-tight px-2 py-1 rounded-md bg-sky-50 text-sky-700 border border-sky-200"
                  >
                    operator-recorded
                  </span>
                )}
                {photoCount > 0 && (
                  <span className="text-[10px] font-bold text-slate-400 px-1 py-1">{photoCount} photo{photoCount === 1 ? '' : 's'}</span>
                )}
              </div>

              <div className="flex items-center gap-2 ml-auto">
                {r.slug && (
                  <a
                    href={`/providers/${r.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-black text-slate-400 hover:text-slate-700"
                  >
                    View
                  </a>
                )}
                {ownerUrl ? (
                  <>
                    <a
                      href={`${ownerUrl}?src=operator`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-black px-3 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                    >
                      Record answers
                    </a>
                    <a
                      href={ownerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="The clinic's own private link. Send this to the owner."
                      className="text-[11px] font-black px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:border-wellness-300 hover:text-wellness-700"
                    >
                      Owner link
                    </a>
                  </>
                ) : (
                  <span className="text-[11px] font-bold text-rose-500">no manage link yet</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-[12px] text-slate-400 leading-relaxed max-w-3xl">
          Ordered worst first: clinics with no stored answers lead, since that is what keeps the Safety Verified
          badge out of reach and leaves the listing looking unfinished. Recording answers never grants the badge
          on its own; it queues the clinic for review at /admin/badge-reviews, where a person still decides.
        </p>
      </div>
    </main>
  );
}
