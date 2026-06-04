/**
 * POST /api/admin/refresh-verified-ratings
 *
 * Refreshes Google rating + review count for every VERIFIED/claimed clinic
 * (is_claimed = true OR is_featured = true). Logic lives in
 * src/lib/places-refresh.ts so the daily cron at
 * /api/cron/refresh-verified-ratings can call the exact same engine.
 *
 * Auth: admin cookie OR Authorization: Bearer $CRON_SECRET (matches the
 * pattern used in app/api/admin/regenerate-outreach/route.ts).
 *
 * Body (optional JSON):
 *   { dry_run?: boolean, limit?: number }
 *
 * Returns:
 *   { ok, dryRun, totalProviders, totalUpdated, totalFailed, updated, failed }
 *
 * Idempotent: re-runs simply refresh.
 */
import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../../src/lib/admin-auth';
import { refreshVerifiedRatings } from '../../../../src/lib/places-refresh';

export const maxDuration = 300;

interface RefreshRequest {
  dry_run?: boolean;
  limit?: number;
}

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

  let body: RefreshRequest = {};
  try {
    const raw = await req.text();
    if (raw && raw.trim().length > 0) {
      body = JSON.parse(raw) as RefreshRequest;
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const result = await refreshVerifiedRatings({
    dryRun: body.dry_run === true,
    limit: typeof body.limit === 'number' && body.limit > 0 ? body.limit : null,
  });

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status || 500 });
  }
  return NextResponse.json(result);
}
