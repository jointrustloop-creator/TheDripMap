/**
 * GET /api/cron/refresh-verified-ratings
 *
 * Scheduled daily at 06:00 UTC (2am ET) by vercel.json. Thin wrapper around
 * src/lib/places-refresh.ts — same engine that powers the manual
 * /api/admin/refresh-verified-ratings endpoint. Refreshes Google rating +
 * review count for every claimed/verified clinic.
 *
 * Auth: Authorization: Bearer ${CRON_SECRET} (Vercel Cron sends this
 * automatically when CRON_SECRET is set in env).
 */
import { NextResponse } from 'next/server';
import { refreshVerifiedRatings } from '../../../../src/lib/places-refresh';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  if ((req.headers.get('authorization') || '') !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await refreshVerifiedRatings({ dryRun: false, limit: null });

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status || 500 });
  }
  return NextResponse.json(result);
}
