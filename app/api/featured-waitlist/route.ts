/**
 * POST /api/featured-waitlist
 *
 * Public form endpoint. Stores a row in featured_waitlist via the service-role
 * client. No pricing logic, no email send to the operator yet — this is just a
 * private interest list that we'll use to (1) prioritise which cities to open
 * paid placement in first and (2) give early-interest clinics first dibs.
 *
 * Honest-by-design: never promise pricing, a launch date, or guaranteed
 * placement here. The page copy must match.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function hashIp(req: Request): string | null {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    '';
  if (!ip) return null;
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 32);
}

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const clinic_name = String(body.clinic_name || '').trim().slice(0, 200);
  const city = String(body.city || '').trim().slice(0, 100);
  const email = String(body.email || '').trim().toLowerCase().slice(0, 200);
  const phone = String(body.phone || '').trim().slice(0, 50) || null;
  const notes = String(body.notes || '').trim().slice(0, 1000) || null;
  const source = String(body.source || 'web').trim().slice(0, 50);

  if (!clinic_name) return NextResponse.json({ error: 'clinic_name required' }, { status: 400 });
  if (!city) return NextResponse.json({ error: 'city required' }, { status: 400 });
  if (!email || !isValidEmail(email)) return NextResponse.json({ error: 'valid email required' }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase.from('featured_waitlist').insert({
    clinic_name,
    city,
    email,
    phone,
    notes,
    source,
    user_agent: req.headers.get('user-agent')?.slice(0, 500) || null,
    ip_hash: hashIp(req),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
