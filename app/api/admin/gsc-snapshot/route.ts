/**
 * POST /api/admin/gsc-snapshot
 *
 * Calls buildGscReport() server-side (where GSC_SERVICE_ACCOUNT_KEY lives in
 * Vercel env) and returns the current search-analytics summary so the operator
 * can see top queries, top pages, totals, and WoW delta on demand from
 * /admin/tools without waiting for the Sunday digest email.
 *
 * Auth: admin cookie OR Authorization: Bearer $CRON_SECRET.
 *
 * The endpoint passes an empty sitemap URL list because we only need the
 * search-analytics portion (top queries / top pages / totals). URL inspection
 * is what consumes the sitemap; it runs separately via the weekly cron and
 * costs quota, so we skip it here.
 */
import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../../src/lib/admin-auth';
import { buildGscReport } from '../../../../src/lib/seo-health-gsc';

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
  try {
    const report = await buildGscReport([]);
    return NextResponse.json({ ok: true, report });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
