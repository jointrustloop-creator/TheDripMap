/**
 * POST /api/admin/places-enrich-hours
 *
 * Backfills working_hours for every CLAIMED clinic that currently has
 * none, using Google Places opening_hours.weekday_text via the place_id
 * stored on each row from the daily rating refresh. Skip list: clinics
 * the operator has explicitly marked as already complete (e.g.
 * bay-wellness-centre-vancouver).
 *
 * Auth: admin cookie OR Authorization: Bearer $CRON_SECRET.
 *
 * Body (optional JSON):
 *   { skip?: string[] }   // slugs to skip
 *
 * Returns the per-clinic verdict so the operator can read it inline.
 */
import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../../src/lib/admin-auth';
import { enrichClaimedHours } from '../../../../src/lib/places-enrich';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

async function isAuthorized(req: Request): Promise<boolean> {
  if (await isAdminRequest()) return true;
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const auth = req.headers.get('authorization') || '';
  return auth === `Bearer ${expected}`;
}

export async function POST(req: Request) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    return NextResponse.json({ error: 'GOOGLE_PLACES_API_KEY not configured' }, { status: 500 });
  }

  let body: { skip?: string[] } = {};
  try {
    const raw = await req.text();
    if (raw && raw.trim().length > 0) body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Default skip: Bay Wellness (operator confirmed complete).
  const skip = Array.isArray(body.skip) && body.skip.length > 0
    ? body.skip
    : ['bay-wellness-centre-vancouver'];

  const result = await enrichClaimedHours({ skipSlugs: skip });
  return NextResponse.json(result);
}
