/**
 * GET /api/cron/daily-report
 *
 * Schedule (vercel.json): "0 22 * * *" = 22:00 UTC daily = 6pm ET in summer,
 * 5pm ET in winter. The operator can shift this in vercel.json without
 * touching code.
 *
 * Pulls today's lifecycle activity from Supabase:
 *   - New claims today (with source: outreach vs organic)
 *   - New verifications today (who went live)
 *   - Pending claims awaiting verify (with days waiting)
 *   - Drafts prepared today
 *   - Totals: verified clinics, total listings
 *
 * Sends via BOTH email (info@thedripmap.com) AND Telegram (if bot token set).
 *
 * Auth: Authorization: Bearer ${CRON_SECRET}.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMail } from '../../../../src/lib/mailer';
import { sendTelegram } from '../../../../src/lib/telegram';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

interface ClaimRow {
  id: string;
  listing_id: string;
  email: string | null;
  owner_name: string | null;
  status: string | null;
  created_at: string;
  verified_at: string | null;
}

interface ProviderLite {
  id: string;
  name: string | null;
  slug: string | null;
  city: string | null;
  state: string | null;
  outreach_sent: boolean | null;
  outreach_sent_at: string | null;
  is_claimed: boolean | null;
}

interface DataCheckIssue {
  clinic: string;
  problem: string;
  action: string;
}

interface OnboardingAuditRow {
  clinic: string;
  ok: boolean;
  detail: string;
}

interface QuestionnaireRow {
  clinic: string;
  days: number;
  status: string;
  linkOk: boolean;
}

// Grandfather date for the C1-tier claimed-listings backfill (Eva, Mechelle,
// Kia etc.). Any provider row created before this AND flagged is_claimed or
// is_featured did NOT go through claim_requests — that's expected and not an
// anomaly. Adjust ONLY if a future migration changes the policy.
const SACRED_GRANDFATHER_DATE = '2026-06-01T00:00:00Z';
const SITE_URL = 'https://www.thedripmap.com';

function startOfUtcDay(d = new Date()): Date {
  const out = new Date(d);
  out.setUTCHours(0, 0, 0, 0);
  return out;
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function pluralize(n: number, singular: string, plural?: string): string {
  return n === 1 ? `1 ${singular}` : `${n} ${plural || singular + 's'}`;
}

function daysBetween(a: Date, b: Date): number {
  return Math.max(0, Math.floor((a.getTime() - b.getTime()) / (24 * 60 * 60 * 1000)));
}

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  if ((req.headers.get('authorization') || '') !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: 'Supabase env missing' }, { status: 500 });
  }
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const now = new Date();
  const sod = startOfUtcDay(now);
  const sodIso = sod.toISOString();
  const todayStr = fmtDate(sod);

  // 1. New claims today
  const { data: newClaimsRaw } = await supabase
    .from('claim_requests')
    .select('id, listing_id, email, owner_name, status, created_at, verified_at')
    .gte('created_at', sodIso)
    .order('created_at', { ascending: true });
  const newClaims = (newClaimsRaw || []) as ClaimRow[];

  // 2. New verifications today
  const { data: newVerifiedRaw } = await supabase
    .from('claim_requests')
    .select('id, listing_id, email, owner_name, status, created_at, verified_at')
    .eq('status', 'verified')
    .gte('verified_at', sodIso)
    .order('verified_at', { ascending: true });
  const newVerified = (newVerifiedRaw || []) as ClaimRow[];

  // 3. Pending claims awaiting verify (status=pending, not yet verified)
  const { data: pendingRaw } = await supabase
    .from('claim_requests')
    .select('id, listing_id, email, owner_name, status, created_at, verified_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  const pending = (pendingRaw || []) as ClaimRow[];

  // 4. Drafts prepared today (providers row touched by daily-outreach)
  const { count: draftsPreparedToday } = await supabase
    .from('providers')
    .select('id', { count: 'exact', head: true })
    .gte('outreach_sent_at', sodIso);

  // 5. Totals
  const { count: totalVerified } = await supabase
    .from('providers')
    .select('id', { count: 'exact', head: true })
    .eq('is_claimed', true);
  const { count: totalListings } = await supabase
    .from('providers')
    .select('id', { count: 'exact', head: true });

  // 5b. Data check — exceptions-only cross-validation of the lifecycle.
  // Output a single "all consistent" line when nothing is off, otherwise a
  // short bulleted list. Operator-facing, high-signal, zero noise.
  const dataCheck: DataCheckIssue[] = [];
  {
    // Pull all claims once, build a fast index.
    const { data: allClaimsRaw } = await supabase
      .from('claim_requests')
      .select('id, listing_id, email, owner_name, status, created_at');
    const allClaims = (allClaimsRaw || []) as ClaimRow[];
    const allListingIds = Array.from(
      new Set(allClaims.map((c) => c.listing_id).filter(Boolean)),
    );
    const allLinkedProviders = allListingIds.length
      ? (
          await supabase
            .from('providers')
            .select('id, name, slug, is_claimed')
            .in('id', allListingIds)
        ).data || []
      : [];
    const linkedById = new Map<string, { id: string; name: string | null; slug: string | null; is_claimed: boolean | null }>(
      allLinkedProviders.map((p) => [p.id, p]),
    );

    // CHECK 1. Orphan claims: claim_requests with no listing_id, or with a
    // listing_id that doesn't resolve to a providers row.
    for (const c of allClaims) {
      if (!c.listing_id) {
        dataCheck.push({
          clinic: '(no listing_id)',
          problem: `orphan claim ${c.id.slice(0, 8)}... has no listing_id`,
          action: `inspect claim_requests row (owner: ${c.owner_name || c.email || '?'})`,
        });
      } else if (!linkedById.has(c.listing_id)) {
        dataCheck.push({
          clinic: c.owner_name || c.email || '(unknown)',
          problem: `orphan claim, listing_id ${c.listing_id.slice(0, 8)}... not in providers`,
          action: 'create the provider listing or delete the claim',
        });
      }
    }

    // CHECK 2a. Verified claims whose provider isn't is_claimed=true.
    for (const c of allClaims.filter((c) => c.status === 'verified')) {
      const p = linkedById.get(c.listing_id);
      if (p && p.is_claimed === false) {
        dataCheck.push({
          clinic: p.name || p.slug || '(no name)',
          problem: 'verified claim but provider.is_claimed is false',
          action: `manually set providers.is_claimed = true for slug ${p.slug}`,
        });
      }
    }

    // CHECK 2b. Every claimed/featured clinic's public page returns 200.
    const { data: claimedForHttp } = await supabase
      .from('providers')
      .select('id, name, slug')
      .or('is_claimed.eq.true,is_featured.eq.true');
    for (const p of (claimedForHttp || []) as ProviderLite[]) {
      if (!p.slug) continue;
      try {
        const r = await fetch(`${SITE_URL}/providers/${p.slug}`, {
          method: 'HEAD',
          redirect: 'manual',
          signal: AbortSignal.timeout(8000),
        });
        if (r.status !== 200) {
          dataCheck.push({
            clinic: p.name || p.slug,
            problem: `live page /providers/${p.slug} returns HTTP ${r.status}`,
            action: 'investigate why the page is not returning 200',
          });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        dataCheck.push({
          clinic: p.name || p.slug,
          problem: `live page /providers/${p.slug} unreachable (${msg.slice(0, 40)})`,
          action: 'investigate why the page is unreachable',
        });
      }
    }

    // CHECK 3. Phantom verified listings: provider has is_claimed/is_featured
    // but NO matching claim_request. Grandfathered for pre-2026-06-01 rows
    // (the original sacred-clinic backfill predates the claim_request flow).
    const claimsByListing = new Set(allClaims.map((c) => c.listing_id).filter(Boolean));
    const { data: phantomCandidates } = await supabase
      .from('providers')
      .select('id, name, slug, created_at')
      .or('is_claimed.eq.true,is_featured.eq.true');
    for (const p of (phantomCandidates || []) as Array<{ id: string; name: string | null; slug: string | null; created_at: string | null }>) {
      if (claimsByListing.has(p.id)) continue;
      if (p.created_at && p.created_at < SACRED_GRANDFATHER_DATE) continue;
      dataCheck.push({
        clinic: p.name || p.slug || '(no name)',
        problem: 'provider is_claimed/is_featured but no claim_request exists',
        action: 'either create a claim_request retroactively or flip the flag back to false',
      });
    }

    // CHECK 4. Stuck pending claims (>7 days, no verification yet).
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    for (const c of allClaims.filter((c) => c.status === 'pending')) {
      if (new Date(c.created_at) >= sevenDaysAgo) continue;
      const p = linkedById.get(c.listing_id);
      const days = Math.floor((Date.now() - new Date(c.created_at).getTime()) / (24 * 60 * 60 * 1000));
      dataCheck.push({
        clinic: p?.name || c.owner_name || c.email || '(unknown)',
        problem: `claim pending ${days} days, no verification yet`,
        action: 'manually email the owner to nudge or close the claim',
      });
    }

    // CHECK 5. Claimed clinics missing key data (hours / services /
    // description / logo). Surfaces what needs a manual touch.
    const { data: claimedFull } = await supabase
      .from('providers')
      .select('id, name, slug, working_hours, specialties, description, image_url, imageUrl')
      .eq('is_claimed', true);
    for (const p of (claimedFull || []) as Array<{ id: string; name: string | null; slug: string | null; working_hours: Record<string, unknown> | null; specialties: unknown; description: string | null; image_url: string | null; imageUrl: string | null }>) {
      const missing: string[] = [];
      if (!p.working_hours || Object.keys(p.working_hours).length === 0) missing.push('hours');
      if (!Array.isArray(p.specialties) || p.specialties.length === 0) missing.push('services');
      if (!p.description || p.description.length < 50) missing.push('description');
      const img = p.image_url || p.imageUrl || '';
      const hasImage = img && !img.includes('picsum') && !img.includes('unsplash');
      if (!hasImage) missing.push('logo/photo');
      if (missing.length) {
        dataCheck.push({
          clinic: p.name || p.slug || '(no name)',
          problem: `missing ${missing.join(', ')}`,
          action: `enrich or ask owner to fill in: ${missing.join(', ')}`,
        });
      }
    }
  }

  // 5c. Onboarding email audit (READ-ONLY, additive — verification check only).
  // For every claim VERIFIED in the last 24h, confirm the "finish your listing"
  // onboarding email was sent to the owner's email within 5 minutes of
  // verified_at. The send is recorded by sendVerificationOnboardingEmail()
  // (src/lib/onboarding.ts) as onboarding_requests.status='sent' + sent_at.
  // This block ONLY reads; it never sends, modifies, or writes anything, and it
  // does not touch the existing send logic or templates.
  const onboardingAudit: OnboardingAuditRow[] = [];
  {
    const last24hIso = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const { data: verified24hRaw } = await supabase
      .from('claim_requests')
      .select('id, listing_id, email, owner_name, verified_at')
      .eq('status', 'verified')
      .gte('verified_at', last24hIso)
      .order('verified_at', { ascending: true });
    const verified24h = (verified24hRaw || []) as Array<{
      id: string;
      listing_id: string;
      email: string | null;
      owner_name: string | null;
      verified_at: string | null;
    }>;

    const auditProvIds = Array.from(
      new Set(verified24h.map((c) => c.listing_id).filter(Boolean)),
    );
    const obByProvider = new Map<string, { owner_email: string | null; status: string | null; sent_at: string | null }>();
    const auditNameById = new Map<string, { name: string | null; city: string | null; state: string | null }>();
    if (auditProvIds.length) {
      const { data: obRows } = await supabase
        .from('onboarding_requests')
        .select('provider_id, owner_email, status, sent_at')
        .in('provider_id', auditProvIds);
      for (const r of (obRows || []) as Array<{ provider_id: string; owner_email: string | null; status: string | null; sent_at: string | null }>) {
        obByProvider.set(r.provider_id, { owner_email: r.owner_email, status: r.status, sent_at: r.sent_at });
      }
      const { data: provs } = await supabase
        .from('providers')
        .select('id, name, city, state')
        .in('id', auditProvIds);
      for (const p of (provs || []) as Array<{ id: string; name: string | null; city: string | null; state: string | null }>) {
        auditNameById.set(p.id, { name: p.name, city: p.city, state: p.state });
      }
    }

    const FIVE_MIN_MS = 5 * 60 * 1000;
    const normEmail = (e: string | null | undefined) => (e || '').trim().toLowerCase();
    for (const c of verified24h) {
      const p = c.listing_id ? auditNameById.get(c.listing_id) : undefined;
      const locParts = [p?.city, p?.state].filter(Boolean);
      const clinic = `${p?.name || c.owner_name || '(unknown clinic)'}${locParts.length ? ' (' + locParts.join(', ') + ')' : ''}`;
      const ob = c.listing_id ? obByProvider.get(c.listing_id) : undefined;
      let ok = false;
      let detail = '';
      if (!c.listing_id) {
        detail = 'claim has no listing_id';
      } else if (!ob) {
        detail = 'no onboarding_requests row for this clinic';
      } else if (ob.status !== 'sent' || !ob.sent_at) {
        detail = `onboarding not marked sent (status=${ob.status || 'none'})`;
      } else if (!c.verified_at) {
        detail = 'claim missing verified_at';
      } else {
        const delayMs = new Date(ob.sent_at).getTime() - new Date(c.verified_at).getTime();
        const delaySec = Math.round(delayMs / 1000);
        const emailMatch = !c.email || normEmail(ob.owner_email) === normEmail(c.email);
        if (delayMs < -60 * 1000 || delayMs > FIVE_MIN_MS) {
          detail = `sent ${delaySec}s from verify, outside the 5 min window`;
        } else if (!emailMatch) {
          detail = `sent to ${ob.owner_email || '(none)'}, not owner ${c.email}`;
        } else {
          ok = true;
          detail = `sent ${delaySec}s after verify to ${ob.owner_email}`;
        }
      }
      onboardingAudit.push({ clinic, ok, detail });
    }
  }

  // 5d. Onboarding questionnaire completion audit (READ-ONLY, additive).
  // "Completed" = providers.decision_drivers.manage exists (written only by
  // /api/finish-listing when the owner submits). A claimed clinic with no
  // manage_token (durable column, or the decision_drivers fallback for rows
  // from before that column existed) has a BROKEN /finish link; that is
  // surfaced loudly in DATA CHECK. This block ONLY reads; it never sends,
  // modifies, or writes anything.
  //
  // FIXED 2026-07-11: this check only ever looked at decision_drivers.manage_token,
  // a path ensureManageToken() (src/lib/manage-token.ts) stopped writing to once
  // the durable providers.manage_token column shipped (2026-06-13). Every claimed
  // clinic checked (including one verified same-day) had a working column token
  // and a real, actively-submitted /finish payload; the report was 100% false
  // alarms for as long as this ran. Now checks the same two locations
  // ensureManageToken() itself treats as authoritative (colToken || ddToken).
  const questionnaireAwaiting: QuestionnaireRow[] = [];
  {
    const { data: claimedQ } = await supabase
      .from('providers')
      .select('id, name, city, state, claimed_at, decision_drivers, manage_token')
      .eq('is_claimed', true);
    const claimedRows = (claimedQ || []) as Array<{ id: string; name: string | null; city: string | null; state: string | null; claimed_at: string | null; decision_drivers: Record<string, unknown> | null; manage_token: string | null }>;
    const obStatusByProvider = new Map<string, string>();
    {
      const { data: obAll } = await supabase.from('onboarding_requests').select('provider_id, status');
      for (const r of (obAll || []) as Array<{ provider_id: string; status: string | null }>) {
        obStatusByProvider.set(r.provider_id, r.status || '');
      }
    }
    for (const p of claimedRows) {
      const dd = (p.decision_drivers && typeof p.decision_drivers === 'object') ? (p.decision_drivers as Record<string, unknown>) : {};
      const colToken = typeof p.manage_token === 'string' && p.manage_token.length > 0;
      const ddToken = typeof dd.manage_token === 'string' && (dd.manage_token as string).length > 0;
      const linkOk = colToken || ddToken;
      const completed = !!(dd.manage && typeof dd.manage === 'object');
      const status = obStatusByProvider.get(p.id) || '(no onboarding row)';
      // Alarm: a claimed clinic whose /finish link cannot work. This is the
      // exact failure that silently broke a fresh signup's questionnaire link.
      if (!linkOk) {
        dataCheck.push({
          clinic: p.name || '(no name)',
          problem: 'FINISH LINK BROKEN - no decision_drivers.manage_token, owner cannot open the questionnaire',
          action: 'mint a manage_token (ensureManageToken) then resend the finish email',
        });
      }
      // Awaiting-response: received the questionnaire (onboarding row exists) but
      // has not submitted. Grandfathered clinics (no onboarding row) are excluded.
      if (!completed && obStatusByProvider.has(p.id) && status !== 'submitted') {
        const claimed = p.claimed_at ? new Date(p.claimed_at) : null;
        const days = claimed ? daysBetween(now, claimed) : 0;
        const loc = [p.city, p.state].filter(Boolean).join(', ');
        questionnaireAwaiting.push({ clinic: `${p.name || '(no name)'}${loc ? ' (' + loc + ')' : ''}`, days, status, linkOk });
      }
    }
    questionnaireAwaiting.sort((a, b) => b.days - a.days);
  }

  // 5e. Cron heartbeat (READ-ONLY). The inbox watcher (process-replies, every
  // 2h) stamps email_replies_cursor.last_run_at on each run. If that is stale,
  // replies are piling up unseen -> surface it loudly in DATA CHECK.
  {
    const { data: cur } = await supabase
      .from('email_replies_cursor')
      .select('last_run_at')
      .eq('id', 1)
      .maybeSingle();
    const lastRun = cur?.last_run_at ? new Date(cur.last_run_at as string) : null;
    const hoursSince = lastRun ? (now.getTime() - lastRun.getTime()) / 3_600_000 : Infinity;
    if (!lastRun || hoursSince > 4) {
      dataCheck.push({
        clinic: 'process-replies cron (inbox watcher)',
        problem: lastRun
          ? `last ran ${hoursSince.toFixed(1)}h ago (runs every 2h) - inbound replies may be going unseen`
          : 'no recorded run - the inbox watcher may be down',
        action: 'check /api/cron/process-replies in the Vercel cron dashboard',
      });
    }
  }

  // 6. Resolve provider rows referenced by today's claims + pending claims
  const listingIds = Array.from(
    new Set(
      [...newClaims, ...newVerified, ...pending]
        .map((c) => c.listing_id)
        .filter(Boolean),
    ),
  );
  const providerMap = new Map<string, ProviderLite>();
  if (listingIds.length) {
    const { data: provs } = await supabase
      .from('providers')
      .select('id, name, slug, city, state, outreach_sent, outreach_sent_at, is_claimed')
      .in('id', listingIds);
    for (const p of (provs || []) as ProviderLite[]) providerMap.set(p.id, p);
  }

  // Build body
  const lines: string[] = [];
  lines.push(`TheDripMap daily report — ${todayStr}`);
  lines.push('');

  // New claims
  lines.push(`NEW CLAIMS TODAY (${newClaims.length})`);
  if (newClaims.length === 0) {
    lines.push('  None.');
  } else {
    for (const c of newClaims) {
      const p = providerMap.get(c.listing_id);
      const name = p?.name || '(unknown clinic)';
      const loc = [p?.city, p?.state].filter(Boolean).join(', ');
      const source = p?.outreach_sent ? 'outreach' : 'organic';
      lines.push(`  - ${name}${loc ? ' (' + loc + ')' : ''}`);
      lines.push(`      contact: ${c.owner_name || '(no name)'} <${c.email || 'no email'}>`);
      lines.push(`      source:  ${source}`);
    }
  }
  lines.push('');

  // Verifications
  lines.push(`NEW VERIFICATIONS TODAY (${newVerified.length})`);
  if (newVerified.length === 0) {
    lines.push('  None.');
  } else {
    for (const c of newVerified) {
      const p = providerMap.get(c.listing_id);
      const name = p?.name || '(unknown clinic)';
      const loc = [p?.city, p?.state].filter(Boolean).join(', ');
      lines.push(`  - ${name}${loc ? ' (' + loc + ')' : ''}`);
    }
  }
  lines.push('');

  // Onboarding email audit (read-only): confirm the finish-listing email went
  // out within 5 min of each verification in the last 24h. Missing sends are
  // flagged loudly so a silently-dropped confirmation never goes unnoticed.
  const onboardingMissing = onboardingAudit.filter((a) => !a.ok);
  lines.push(`ONBOARDING EMAIL AUDIT — claims verified last 24h (${onboardingAudit.length})`);
  if (onboardingAudit.length === 0) {
    lines.push('  No verifications in the last 24h.');
  } else {
    for (const a of onboardingAudit) {
      if (a.ok) {
        lines.push(`  - ${a.clinic}: onboarding email confirmed (${a.detail})`);
      } else {
        lines.push(`  - ${a.clinic}: ONBOARDING EMAIL MISSING — ${a.detail}`);
      }
    }
    lines.push(`  ${onboardingAudit.length - onboardingMissing.length}/${onboardingAudit.length} confirmed within 5 min; ${onboardingMissing.length} missing.`);
  }
  lines.push('');

  // Questionnaire completion (read-only): verified clinics that received the
  // onboarding questionnaire but have not submitted it yet. A [FINISH LINK
  // BROKEN] tag means their /finish link cannot open (no manage_token).
  lines.push(`ONBOARDING QUESTIONNAIRE NOT COMPLETED (${questionnaireAwaiting.length})`);
  if (questionnaireAwaiting.length === 0) {
    lines.push('  None — every verified clinic that received it has responded.');
  } else {
    for (const q of questionnaireAwaiting) {
      const wait = q.days === 0 ? 'verified today' : `verified ${pluralize(q.days, 'day')} ago`;
      const broken = q.linkOk ? '' : '  [FINISH LINK BROKEN]';
      lines.push(`  - ${q.clinic} — ${wait} — onboarding ${q.status}${broken}`);
    }
  }
  lines.push('');

  // Pending claims awaiting verify
  lines.push(`PENDING CLAIMS AWAITING VERIFY (${pending.length})`);
  if (pending.length === 0) {
    lines.push('  None.');
  } else {
    for (const c of pending) {
      const p = providerMap.get(c.listing_id);
      const name = p?.name || '(unknown clinic)';
      const created = new Date(c.created_at);
      const days = daysBetween(now, created);
      const waiting = days === 0 ? 'today' : pluralize(days, 'day');
      lines.push(`  - ${name} — ${c.email || 'no email'} — waiting ${waiting}`);
    }
  }
  lines.push('');

  // Replies today, populated from the email_replies table written by
  // /api/cron/process-replies. Two sub-buckets: needs your response
  // (interested/question/unclear AND unhandled) and handled automatically
  // (opt-outs suppressed, bounces suppressed, OOOs noted).
  {
    const { data: repliesTodayRaw } = await supabase
      .from('email_replies')
      .select('id, from_email, from_name, subject, snippet, category, needs_human, matched_provider_ids, gmail_thread_url, handled_at, received_at')
      .gte('received_at', sodIso)
      .order('received_at', { ascending: true });
    const repliesToday = (repliesTodayRaw || []) as Array<{
      id: string;
      from_email: string;
      from_name: string | null;
      subject: string | null;
      snippet: string | null;
      category: string;
      needs_human: boolean;
      matched_provider_ids: string[] | null;
      gmail_thread_url: string | null;
      handled_at: string | null;
      received_at: string;
    }>;

    // Resolve clinic names for matched providers.
    const replyProviderIds = Array.from(
      new Set(
        repliesToday
          .flatMap((r) => r.matched_provider_ids || [])
          .filter(Boolean),
      ),
    );
    const replyProviderMap = new Map<string, { name: string | null; city: string | null; state: string | null }>();
    if (replyProviderIds.length > 0) {
      const { data: provs } = await supabase
        .from('providers')
        .select('id, name, city, state')
        .in('id', replyProviderIds);
      for (const p of (provs || []) as Array<{ id: string; name: string | null; city: string | null; state: string | null }>) {
        replyProviderMap.set(p.id, { name: p.name, city: p.city, state: p.state });
      }
    }

    const needsResponse = repliesToday.filter(
      (r) =>
        !r.handled_at &&
        (r.needs_human ||
          r.category === 'interested' ||
          r.category === 'question'),
    );
    const handledAuto = repliesToday.filter((r) => !needsResponse.includes(r));

    lines.push(`REPLIES TODAY (${repliesToday.length})`);
    if (repliesToday.length === 0) {
      lines.push('  0 replies today.');
    } else {
      lines.push(`  Needs your response (${needsResponse.length})`);
      if (needsResponse.length === 0) {
        lines.push('    None.');
      } else {
        for (const r of needsResponse) {
          const pid = (r.matched_provider_ids || [])[0];
          const p = pid ? replyProviderMap.get(pid) : undefined;
          const clinic = p?.name || '(no clinic match)';
          const loc = [p?.city, p?.state].filter(Boolean).join(', ');
          const sender = r.from_name ? `${r.from_name} <${r.from_email}>` : r.from_email;
          const tag = r.category === 'interested' ? '[INTERESTED]'
                    : r.category === 'question' ? '[QUESTION]'
                    : '[UNCLEAR]';
          lines.push(`    ${tag} ${clinic}${loc ? ' (' + loc + ')' : ''}`);
          lines.push(`        from: ${sender}`);
          lines.push(`        re:   ${r.subject || '(no subject)'}`);
          if (r.snippet) lines.push(`        snip: ${r.snippet.slice(0, 200)}`);
          if (r.gmail_thread_url) lines.push(`        open: ${r.gmail_thread_url}`);
        }
      }
      lines.push(`  Handled automatically (${handledAuto.length})`);
      if (handledAuto.length === 0) {
        lines.push('    None.');
      } else {
        const optOuts = handledAuto.filter((r) => r.category === 'not_interested');
        const bounces = handledAuto.filter((r) => r.category === 'bounce');
        const autoreplies = handledAuto.filter((r) => r.category === 'auto_reply');
        const other = handledAuto.filter(
          (r) => !['not_interested','bounce','auto_reply'].includes(r.category),
        );
        if (optOuts.length) lines.push(`    Opt-outs suppressed: ${optOuts.length}`);
        if (bounces.length) lines.push(`    Bounces suppressed:  ${bounces.length}`);
        if (autoreplies.length) lines.push(`    Auto-replies/OOO:    ${autoreplies.length}`);
        if (other.length) lines.push(`    Other handled:       ${other.length}`);
      }
    }
  }
  lines.push('');

  // Drafts + totals
  lines.push(`OUTREACH DRAFTS PREPARED TODAY: ${draftsPreparedToday || 0}`);
  lines.push('');
  lines.push('TOTALS');
  lines.push(`  Verified clinics: ${totalVerified || 0}`);
  lines.push(`  Total listings:   ${totalListings || 0}`);
  lines.push('');

  // Data check — exceptions-only block. Short and high-signal.
  if (dataCheck.length === 0) {
    lines.push('DATA CHECK');
    lines.push('  Data check: all consistent.');
  } else {
    lines.push(`DATA CHECK (${dataCheck.length} ${dataCheck.length === 1 ? 'issue' : 'issues'})`);
    for (const i of dataCheck) {
      lines.push(`  - ${i.clinic}: ${i.problem}`);
      lines.push(`      → ${i.action}`);
    }
  }
  lines.push('');
  lines.push('— TheDripMap automation');

  const body = lines.join('\n');
  const subject = `[TheDripMap] Daily report — ${todayStr}`;

  const mailResult = await sendMail({
    from: 'TheDripMap <info@thedripmap.com>',
    to: 'info@thedripmap.com',
    subject,
    text: body,
  });

  const tgResult = await sendTelegram(body);

  return NextResponse.json({
    ok: true,
    date: todayStr,
    counts: {
      newClaims: newClaims.length,
      newVerified: newVerified.length,
      pending: pending.length,
      draftsPreparedToday: draftsPreparedToday || 0,
      totalVerified: totalVerified || 0,
      totalListings: totalListings || 0,
      dataCheckIssues: dataCheck.length,
      onboardingVerified24h: onboardingAudit.length,
      onboardingMissing: onboardingAudit.filter((a) => !a.ok).length,
      questionnaireNotCompleted: questionnaireAwaiting.length,
      finishLinksBroken: dataCheck.filter((i) => i.problem.startsWith('FINISH LINK BROKEN')).length,
    },
    mail: mailResult,
    telegram: tgResult,
  });
}
