/**
 * GET /api/cron/gbp-snapshot
 *
 * Monthly Get Found opportunity snapshot pass. Pulls Place Details for a
 * batch of clinics, computes gap flags, appends a row per clinic to
 * gbp_snapshots. NEVER overwrites prior rows; the first row per clinic is
 * the "before" baseline.
 *
 * Schedule (vercel.json): 1st of each month at 5am UTC.
 * Auth: Authorization: Bearer ${CRON_SECRET}.
 *
 * Cost-aware batching:
 *   - LIMIT cap per run (default 200) so a single tick stays under quota.
 *   - Canada providers first, then US.
 *   - is_claimed=true ranks above unclaimed within each country.
 *   - Within those: oldest snapshot first (or never-snapshotted first).
 *   - Logs callsUsed and per-tier counts to the response body.
 *
 * Query params:
 *   ?limit=N (1-1000)        cap clinics processed this run
 *   ?since=ISO_DATE          skip clinics whose latest snapshot is newer
 *                            than this date (default: 25 days ago)
 *   ?countryOnly=Canada      restrict batch to a single country
 *   ?dryRun=1                report which clinics would be processed,
 *                            do not call Places, do not insert
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { snapshotOneClinic } from '../../../../src/lib/gbp-snapshot';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 200;
const DEFAULT_FRESH_DAYS = 25; // skip clinics snapshotted within last 25 days

interface ProviderRow {
  id: string;
  name: string;
  slug: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  is_claimed: boolean | null;
  decision_drivers: unknown;
}

function extractPlaceId(driver: unknown): string | null {
  if (driver && typeof driver === 'object') {
    const obj = driver as Record<string, unknown>;
    if (typeof obj.place_id === 'string') return obj.place_id;
    if (typeof obj.placeId === 'string') return obj.placeId;
  }
  return null;
}

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  if ((req.headers.get('authorization') || '') !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    return NextResponse.json({ error: 'GOOGLE_PLACES_API_KEY not configured' }, { status: 500 });
  }

  const url = new URL(req.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || DEFAULT_LIMIT, 1), 1000);
  const sinceParam = url.searchParams.get('since');
  const freshSince = sinceParam ? new Date(sinceParam) : new Date(Date.now() - DEFAULT_FRESH_DAYS * 86400 * 1000);
  const countryOnly = url.searchParams.get('countryOnly');
  const dryRun = url.searchParams.get('dryRun') === '1';

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Eligible clinics: not hidden, has a name, optional country filter.
  let q = sb
    .from('providers')
    .select('id, name, slug, city, state, country, is_claimed, decision_drivers')
    .neq('is_hidden', true);
  if (countryOnly) q = q.eq('country', countryOnly);
  const { data: allProviders, error } = await q.limit(2000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const providers = (allProviders || []) as ProviderRow[];

  // 2. Pull the latest snapshot per clinic so we can skip the fresh ones.
  const ids = providers.map((p) => p.id);
  const latestByClinic = new Map<string, Date>();
  if (ids.length > 0) {
    // chunk in 500s to avoid PostgREST URL length cap
    for (let i = 0; i < ids.length; i += 500) {
      const slice = ids.slice(i, i + 500);
      const { data: snaps } = await sb
        .from('gbp_snapshots')
        .select('clinic_id, captured_at')
        .in('clinic_id', slice)
        .order('captured_at', { ascending: false });
      for (const row of (snaps || []) as Array<{ clinic_id: string; captured_at: string }>) {
        if (!latestByClinic.has(row.clinic_id)) {
          latestByClinic.set(row.clinic_id, new Date(row.captured_at));
        }
      }
    }
  }

  // 3. Filter to clinics that need a snapshot (never snapshotted OR last
  // snapshot older than freshSince).
  const needSnapshot = providers.filter((p) => {
    const latest = latestByClinic.get(p.id);
    return !latest || latest < freshSince;
  });

  // 4. Sort: Canada first, claimed first within country, oldest-snapshot
  // first within tier (never-snapshotted treated as oldest).
  needSnapshot.sort((a, b) => {
    const aCA = a.country === 'Canada' ? 0 : 1;
    const bCA = b.country === 'Canada' ? 0 : 1;
    if (aCA !== bCA) return aCA - bCA;
    const aClaimed = a.is_claimed ? 0 : 1;
    const bClaimed = b.is_claimed ? 0 : 1;
    if (aClaimed !== bClaimed) return aClaimed - bClaimed;
    const aAge = (latestByClinic.get(a.id) || new Date(0)).getTime();
    const bAge = (latestByClinic.get(b.id) || new Date(0)).getTime();
    return aAge - bAge;
  });

  const batch = needSnapshot.slice(0, limit);

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      totalProviders: providers.length,
      needSnapshot: needSnapshot.length,
      batchSize: batch.length,
      sample: batch.slice(0, 20).map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        country: p.country,
        is_claimed: !!p.is_claimed,
        previousSnapshot: latestByClinic.get(p.id)?.toISOString() || null,
      })),
    });
  }

  // 5. Run snapshots sequentially (cost-aware + Windows/Node safety per
  // the prior auto-memory feedback). 600ms polite delay between clinics.
  let processed = 0;
  let placesCallsTotal = 0;
  let failed = 0;
  const tierCounts: Record<string, number> = { high: 0, medium: 0, low: 0 };
  const failures: Array<{ slug: string; reason: string }> = [];
  for (const p of batch) {
    const r = await snapshotOneClinic({
      clinicId: p.id,
      name: p.name,
      city: p.city,
      state: p.state,
      storedPlaceId: extractPlaceId(p.decision_drivers),
    });
    placesCallsTotal += r.callsUsed;
    if ('error' in r && r.error) {
      failed++;
      failures.push({ slug: p.slug || p.id, reason: r.error });
    } else if (r.ok) {
      processed++;
      tierCounts[r.gaps.tier] = (tierCounts[r.gaps.tier] || 0) + 1;
    } else {
      failed++;
      failures.push({ slug: p.slug || p.id, reason: 'unknown' });
    }
    await new Promise((res) => setTimeout(res, 600));
  }

  return NextResponse.json({
    ok: true,
    totalProviders: providers.length,
    needSnapshot: needSnapshot.length,
    batchSize: batch.length,
    processed,
    failed,
    placesCallsTotal,
    tierCounts,
    failures: failures.slice(0, 25),
  });
}
