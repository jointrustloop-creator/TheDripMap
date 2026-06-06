/**
 * POST /api/admin/places-rescue-404
 *
 * For each provider slug in the request body, search Google Places by
 * the clinic's name + city, find the current website on its listing,
 * and update the website field if a new URL is found. Never deletes,
 * never modifies anything else.
 *
 * Use cases:
 *   - Recover providers whose listed website 404s but who still have
 *     an active Google listing under a new domain.
 *   - Surface providers where Google has no matching listing — those
 *     are the only "flag for review" candidates (do NOT auto-remove).
 *
 * Auth: admin cookie OR Authorization: Bearer $CRON_SECRET.
 *
 * Body (required JSON):
 *   { slugs: string[] }   // max 200 per call (enforced server-side)
 *
 * Returns the per-clinic verdict.
 */
import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../../src/lib/admin-auth';
import { rescue404Urls } from '../../../../src/lib/places-enrich';
import { DEAD_LINK_SLUGS } from '../../../../src/lib/_link-rescue-candidates';

export const maxDuration = 300;
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

  let body: { slugs?: string[]; offset?: number; limit?: number } = {};
  try {
    const raw = await req.text();
    if (raw && raw.trim().length > 0) body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Default to the bundled dead-link slug list from the latest Tier 2 scan
  // if the operator just wants to "click and run".
  const defaultList = [...DEAD_LINK_SLUGS];
  const baseSlugs = Array.isArray(body.slugs) && body.slugs.length > 0 ? body.slugs : defaultList;

  // Optional offset/limit for chunked runs (default: first 50 — keeps
  // each invocation under the Vercel function timeout while leaving
  // headroom for 250ms Places throttling).
  const offset = typeof body.offset === 'number' && body.offset >= 0 ? body.offset : 0;
  const limit = typeof body.limit === 'number' && body.limit > 0 ? Math.min(body.limit, 100) : 50;
  const slugs = baseSlugs.slice(offset, offset + limit);

  const result = await rescue404Urls({ slugs });
  return NextResponse.json({
    ...result,
    offset,
    limit,
    nextOffset: offset + limit < baseSlugs.length ? offset + limit : null,
    totalCandidates: baseSlugs.length,
  });
}
