// On-demand ISR revalidation endpoint.
// Use when DB-only changes (new providers, count updates, content edits) haven't
// busted the city/provider/blog page caches.
//
// Usage: GET /api/revalidate?path=/cities/houston&secret=<token>
// Multiple paths: /api/revalidate?path=/cities/houston&path=/cities/los-angeles
//
// Set REVALIDATE_SECRET in Vercel env vars before relying on this. Without a
// secret, the endpoint refuses to revalidate (prevents random unauthenticated cache busts).

import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const secret = url.searchParams.get('secret');
  const expected = process.env.REVALIDATE_SECRET;

  // Always require a secret. If REVALIDATE_SECRET isn't configured yet, also reject.
  if (!expected) {
    return NextResponse.json({ error: 'REVALIDATE_SECRET not configured' }, { status: 500 });
  }
  if (secret !== expected) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  // searchParams.getAll() returns every value for a repeated key
  const paths = url.searchParams.getAll('path').filter(Boolean);
  if (paths.length === 0) {
    return NextResponse.json({ error: 'No paths provided. Use ?path=/cities/xyz' }, { status: 400 });
  }

  const revalidated: string[] = [];
  for (const p of paths) {
    try {
      revalidatePath(p);
      revalidated.push(p);
    } catch (e) {
      return NextResponse.json({ error: `Failed to revalidate ${p}: ${String(e)}` }, { status: 500 });
    }
  }

  return NextResponse.json({ revalidated, count: revalidated.length, at: new Date().toISOString() });
}
