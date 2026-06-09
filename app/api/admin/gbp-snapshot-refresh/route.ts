/**
 * POST /api/admin/gbp-snapshot-refresh
 *
 * Run a fresh GBP snapshot for one clinic (by slug) on demand. Used by the
 * Refresh button on the per-row action menu in /admin/opportunities. Same
 * snapshot pipeline as the monthly cron, but for a single clinic. Auth:
 * admin cookie OR Bearer ${CRON_SECRET}.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminRequest } from '../../../../src/lib/admin-auth';
import { snapshotOneClinic } from '../../../../src/lib/gbp-snapshot';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

async function isAuthorized(req: Request): Promise<boolean> {
  if (await isAdminRequest()) return true;
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  return (req.headers.get('authorization') || '') === `Bearer ${expected}`;
}

export async function POST(req: Request) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    return NextResponse.json({ error: 'GOOGLE_PLACES_API_KEY not configured' }, { status: 500 });
  }

  let body: { slug?: string; clinicId?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Resolve the clinic.
  const q = sb
    .from('providers')
    .select('id, name, slug, city, state, country, is_claimed, decision_drivers')
    .limit(1);
  const { data, error } = body.clinicId
    ? await q.eq('id', body.clinicId).maybeSingle()
    : body.slug
    ? await q.eq('slug', body.slug).maybeSingle()
    : { data: null, error: { message: 'slug or clinicId required' } as { message: string } };
  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'Provider not found' }, { status: 404 });
  }

  const driver = data.decision_drivers as Record<string, unknown> | null | undefined;
  const storedPlaceId = (driver && (driver.place_id || driver.placeId)) as string | undefined;

  const r = await snapshotOneClinic({
    clinicId: data.id,
    name: data.name,
    city: data.city,
    state: data.state,
    storedPlaceId: storedPlaceId || null,
  });
  if ('error' in r && r.error) return NextResponse.json({ error: r.error, callsUsed: r.callsUsed }, { status: 500 });
  if (!r.ok) return NextResponse.json({ error: 'snapshot failed', callsUsed: r.callsUsed }, { status: 500 });

  return NextResponse.json({
    ok: true,
    slug: data.slug,
    name: data.name,
    placesCallsUsed: r.callsUsed,
    place_id: r.place_id,
    gaps: r.gaps,
  });
}
