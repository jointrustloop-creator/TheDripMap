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

  // Replies needing personal response (Gmail IMAP scan is its own beast —
  // surface a placeholder pointer for now so the operator knows where to look)
  lines.push('REPLIES NEEDING PERSONAL RESPONSE');
  lines.push('  (Open Gmail; outreach replies land in the standard inbox.');
  lines.push('   Automated reply-classification is a future build — pending.)');
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
    },
    mail: mailResult,
    telegram: tgResult,
  });
}
