/**
 * POST /api/track-filter  — records a single filter-chip toggle for demand
 * analytics. Fire-and-forget from the client; never blocks the UI.
 *
 * Tolerant by design: if the filter_events table does not exist yet (migration
 * not pasted), we swallow the error and return ok. No auth — this is anonymous
 * usage telemetry with no PII (session_id is a random client id, not a user).
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_ACTIONS = new Set(['on', 'off']);
const ALLOWED_SURFACES = new Set(['search', 'city']);

export async function POST(req: Request) {
  let body: { filterId?: string; action?: string; surface?: string; city?: string; sessionId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const filterId = String(body.filterId || '').slice(0, 40);
  if (!filterId) return NextResponse.json({ ok: false }, { status: 400 });
  const action = ALLOWED_ACTIONS.has(String(body.action)) ? String(body.action) : 'on';
  const surface = ALLOWED_SURFACES.has(String(body.surface)) ? String(body.surface) : null;

  try {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    await sb.from('filter_events').insert({
      filter_id: filterId,
      action,
      surface,
      city: body.city ? String(body.city).slice(0, 80) : null,
      session_id: body.sessionId ? String(body.sessionId).slice(0, 64) : null,
    });
  } catch {
    // table may not exist yet, or a transient failure — telemetry must never
    // surface an error to the visitor.
  }
  return NextResponse.json({ ok: true });
}
