/**
 * POST /api/log-search-gap   { city, state?, treatment }
 *
 * Records a quiz search that returned ZERO qualified clinics (no clinic in the
 * selected city lists the selected treatment). This is a coverage-gap signal:
 * it tells us which city+treatment combinations patients want that we cannot yet
 * serve, so outreach/expansion can be aimed at real demand.
 *
 * Writes to public.search_gaps (see scripts/sql/create-search-gaps.sql). The
 * insert is best-effort and tolerant: if the table has not been created yet the
 * route still returns ok so the quiz is never affected by logging.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function clean(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim().slice(0, max);
  return s || null;
}

export async function POST(req: Request) {
  let body: { city?: string; state?: string; treatment?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 }); }

  const city = clean(body.city, 120);
  const treatment = clean(body.treatment, 120);
  const state = clean(body.state, 120);
  // City + treatment are the point of the log; without them there is nothing
  // actionable to record.
  if (!city || !treatment) return NextResponse.json({ ok: true, logged: false });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ ok: true, logged: false });

  try {
    const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await supabase.from('search_gaps').insert({
      city,
      state,
      treatment,
      created_at: new Date().toISOString(),
    });
    if (error) {
      // Table not migrated yet (or transient) — do not fail the quiz.
      console.warn('log-search-gap: insert skipped', error.message);
      return NextResponse.json({ ok: true, logged: false });
    }
    return NextResponse.json({ ok: true, logged: true });
  } catch (err) {
    console.warn('log-search-gap: error', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ ok: true, logged: false });
  }
}
