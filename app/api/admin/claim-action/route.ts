/**
 * Admin claim resolution API (cookie-gated, no terminal needed).
 *
 *   GET  /api/admin/claim-action   -> the pending claim_requests + provider info
 *   POST /api/admin/claim-action   -> { action: 'resend'|'verify', claim_request_id }
 *
 * 'resend' re-fires the owner's verification email; 'verify' completes the claim
 * exactly as the owner clicking their link would (same verifyClaimByToken used by
 * /verify-claim). Lets the operator rescue a stuck claim with one button.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminRequest } from '../../../../src/lib/admin-auth';
import { verifyClaimByToken, resendVerificationEmail } from '../../../../src/lib/claim-verify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

interface PendingClaim {
  id: string;
  email: string;
  owner_name: string | null;
  listing_id: string | null;
  created_at: string;
  expires_at: string;
  clinicName: string | null;
  city: string | null;
  country: string | null;
  slug: string | null;
  expired: boolean;
  daysPending: number;
}

export async function GET() {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = db();
  const { data: claims } = await supabase
    .from('claim_requests')
    .select('id, email, owner_name, listing_id, created_at, expires_at, status')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  const rows: PendingClaim[] = [];
  const now = Date.now();
  for (const c of (claims || []) as Array<{ id: string; email: string; owner_name: string | null; listing_id: string | null; created_at: string; expires_at: string }>) {
    let clinicName: string | null = null, city: string | null = null, country: string | null = null, slug: string | null = null;
    if (c.listing_id) {
      const { data: p } = await supabase.from('providers').select('name, city, country, slug').eq('id', c.listing_id).maybeSingle();
      clinicName = p?.name ?? null; city = p?.city ?? null; country = p?.country ?? null; slug = p?.slug ?? null;
    }
    rows.push({
      id: c.id, email: c.email, owner_name: c.owner_name, listing_id: c.listing_id,
      created_at: c.created_at, expires_at: c.expires_at, clinicName, city, country, slug,
      expired: new Date(c.expires_at).getTime() < now,
      daysPending: Math.floor((now - new Date(c.created_at).getTime()) / 86400000),
    });
  }
  return NextResponse.json({ ok: true, claims: rows });
}

export async function POST(req: Request) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let body: { action?: string; claim_request_id?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }); }
  const id = (body.claim_request_id || '').trim();
  if (!id) return NextResponse.json({ error: 'claim_request_id required' }, { status: 400 });

  if (body.action === 'resend') {
    const r = await resendVerificationEmail(id);
    return NextResponse.json({ ok: r.ok, action: 'resend', to: r.to, error: r.error });
  }

  if (body.action === 'verify') {
    // Look up the token for this claim, then run the exact same verification the
    // public /verify-claim page runs when the owner clicks their link.
    const { data: claim } = await db()
      .from('claim_requests')
      .select('token, status')
      .eq('id', id)
      .maybeSingle();
    if (!claim) return NextResponse.json({ ok: false, action: 'verify', error: 'claim not found' }, { status: 404 });
    if (claim.status === 'verified') return NextResponse.json({ ok: false, action: 'verify', error: 'already verified' }, { status: 409 });
    const outcome = await verifyClaimByToken(claim.token);
    if (outcome.status === 'success') {
      return NextResponse.json({ ok: true, action: 'verify', clinicName: outcome.clinicName, providerSlug: outcome.providerSlug });
    }
    return NextResponse.json({ ok: false, action: 'verify', error: outcome.reason }, { status: 400 });
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 });
}
