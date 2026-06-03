/**
 * POST /api/track
 *
 * Fire-and-forget capture endpoint for first-party listing analytics.
 * Inserts one row into public.listing_events using the service role
 * key. Validates input, drops obvious bots, never logs PII.
 *
 * Contract:
 *   body: { provider_id: string (uuid), event_type: string, referrer?: string }
 *   200/204 on accept (no body)
 *   400    on validation failure
 *   never  5xx — DB errors are swallowed so a transient outage cannot
 *                surface as a console error on the public site
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_EVENTS = new Set([
  'view',
  'book_click',
  'call_click',
  'website_click',
  'directions_click',
  'message_click',
]);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Coarse bot filter. Not exhaustive — pragmatic. Matches the user-agent
// strings of the top crawlers + headless tooling that would otherwise
// pollute the dashboard. Case-insensitive.
const BOT_RE = /(bot|crawler|spider|slurp|googlebot|bingbot|ahrefsbot|semrush|mj12bot|duckduckbot|yandex|baiduspider|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|headless|phantomjs|puppeteer|playwright|chrome-lighthouse|curl|wget|python-requests|node-fetch|axios|go-http-client|java\/|httpclient)/i;

// Strip a referrer string to hostname only. Defensive — never throws.
function coarseReferrer(input: unknown): string | null {
  if (typeof input !== 'string' || !input) return null;
  // Caller already strips to hostname, but double-check in case a future
  // client posts a full URL.
  try {
    if (input.includes('://')) {
      const u = new URL(input);
      return u.hostname || null;
    }
    // Allow bare hostnames a-z 0-9 . - up to 253 chars.
    const trimmed = input.trim().slice(0, 253);
    if (/^[a-z0-9.\-]+$/i.test(trimmed)) return trimmed;
    return null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  // Bot filter at the route. Return 204 (success-shaped) so bots don't
  // retry or flag this endpoint as unhealthy.
  const ua = req.headers.get('user-agent') || '';
  if (!ua || BOT_RE.test(ua)) {
    return new NextResponse(null, { status: 204 });
  }

  // Parse body. sendBeacon sends Content-Type application/json with the
  // Blob we constructed, so req.json() works in both the beacon and the
  // fetch fallback path.
  let body: { provider_id?: unknown; event_type?: unknown; referrer?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const provider_id = typeof body.provider_id === 'string' ? body.provider_id.trim() : '';
  const event_type = typeof body.event_type === 'string' ? body.event_type.trim() : '';

  if (!UUID_RE.test(provider_id)) {
    return NextResponse.json({ error: 'invalid provider_id' }, { status: 400 });
  }
  if (!ALLOWED_EVENTS.has(event_type)) {
    return NextResponse.json({ error: 'invalid event_type' }, { status: 400 });
  }

  const referrer = coarseReferrer(body.referrer);

  // Insert. Fire-and-forget — never throws back to the client. If the
  // service-role env vars are missing we silently 204 so a misconfigured
  // preview deploy can't loud-fail in the browser console.
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) {
      const supabase = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      await supabase.from('listing_events').insert({
        provider_id,
        event_type,
        referrer,
      });
    }
  } catch {
    // swallow — capture is opportunistic, never load-bearing
  }

  return new NextResponse(null, { status: 204 });
}
