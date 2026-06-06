/**
 * POST /api/admin/places-inspect
 *
 * Research-only Google Places lookup for a list of provider slugs.
 * Reports current Places state per slug (name, address, business_status,
 * types, website, phone) and a verdict — keep_iv_clinic / maybe_not_iv /
 * closed / no_listing — WITHOUT updating any DB row.
 *
 * Used for the operator's hold list: clinics where a redirect was
 * detected but the operator wants to confirm the business identity
 * before swapping the URL.
 *
 * Default slugs (no body): the 3 held by the operator on 2026-06-06.
 *
 * Auth: admin cookie OR Authorization: Bearer $CRON_SECRET.
 */
import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../../src/lib/admin-auth';
import { inspectPlaces } from '../../../../src/lib/places-enrich';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const DEFAULT_HELD_SLUGS = [
  'puredropiv-washington',
  'one-iv-hydration-and-medspa-riverview',
  'drip-suites-birmingham',
];

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

  let body: { slugs?: string[] } = {};
  try {
    const raw = await req.text();
    if (raw && raw.trim().length > 0) body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const slugs = Array.isArray(body.slugs) && body.slugs.length > 0 ? body.slugs : DEFAULT_HELD_SLUGS;

  const result = await inspectPlaces({ slugs });
  return NextResponse.json(result);
}
