/**
 * GET /api/listing-audit?id=<provider uuid>
 *
 * Real numbers for the /for-clinics "Free listing audit" (2026-09-20). The
 * old audit multiplied a hard-coded city search table by 3% and 45% and called
 * the result "patients seeing your listing", which broke the no-inflated-
 * numbers rule. This returns what our own tracking recorded: page opens and
 * clicks in the last 90 days for the clinic, the same for the verified clinics
 * in its city, and the 7-point Transparency checks the page really renders.
 * Public, read-only, one provider per call, no PII.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { computeTransparencyScore } from '../../../src/lib/transparency-score';
import { isSafetyVerified } from '../../../src/lib/safety';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const WINDOW_DAYS = 90;

export async function GET(req: NextRequest) {
  const id = (req.nextUrl.searchParams.get('id') || '').trim();
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: p } = await sb.from('providers').select('*').eq('id', id).eq('is_hidden', false).maybeSingle();
  if (!p) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const since = new Date(Date.now() - WINDOW_DAYS * 86400000).toISOString();
  // Demand Pulse intent rows carry referrer 'i:%'; everything else counts. NULL safe.
  const { data: ev } = await sb.from('listing_events').select('event_type').eq('provider_id', id).gte('created_at', since).or('referrer.is.null,referrer.not.like.i:%');
  let views = 0, clicks = 0;
  for (const e of ev || []) { if (e.event_type === 'view') views++; else clicks++; }

  // Verified clinics in the same city: what a complete, badge-holding page gets.
  const { data: peers } = await sb.from('providers').select('id, safety_verified, safety_review_status').eq('is_hidden', false).eq('country', p.country).ilike('city', p.city || '').neq('id', id).limit(200);
  const verifiedPeers = (peers || []).filter((x) => isSafetyVerified(x));
  let peerViews = 0, peerClicks = 0;
  if (verifiedPeers.length) {
    const { data: pev } = await sb.from('listing_events').select('event_type, provider_id').in('provider_id', verifiedPeers.map((x) => x.id)).gte('created_at', since).or('referrer.is.null,referrer.not.like.i:%');
    for (const e of pev || []) { if (e.event_type === 'view') peerViews++; else peerClicks++; }
  }

  const t = computeTransparencyScore(p);
  return NextResponse.json({
    id: p.id, name: p.name, slug: p.slug, city: p.city, state: p.state,
    claimed: p.is_claimed === true, safetyVerified: isSafetyVerified(p),
    windowDays: WINDOW_DAYS, views, clicks,
    peers: { verifiedCount: verifiedPeers.length, avgViews: verifiedPeers.length ? Math.round(peerViews / verifiedPeers.length) : null, avgClicks: verifiedPeers.length ? Math.round(peerClicks / verifiedPeers.length) : null },
    score: t.score, checks: t.checks.map((c) => ({ key: c.key, label: c.label, passed: c.passed })),
  }, { headers: { 'Cache-Control': 'public, max-age=300' } });
}
