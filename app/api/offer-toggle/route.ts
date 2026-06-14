/**
 * POST /api/offer-toggle
 *
 * One-tap ON/OFF for a clinic's slow-time offer, from their own /finish page.
 * Flips special_offers[0].active and revalidates the listing + the /deals hub
 * so the change shows (or hides) immediately. Token-validated, service-role
 * write after validation, never trusts the client beyond the boolean.
 *
 * Body: JSON { token: string, active: boolean }.
 */
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { parseManageToken, secretsMatch } from '../../../src/lib/manage-token';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'server not configured' }, { status: 500 });

  let body: { token?: string; active?: boolean };
  try { body = (await req.json()) as typeof body; } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }); }

  const parsed = parseManageToken(body.token);
  if (!parsed) return NextResponse.json({ error: 'invalid token' }, { status: 401 });

  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: provider } = await supabase
    .from('providers')
    .select('id, slug, decision_drivers, special_offers')
    .eq('id', parsed.providerId)
    .maybeSingle();
  if (!provider) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const dd = (provider.decision_drivers && typeof provider.decision_drivers === 'object')
    ? (provider.decision_drivers as Record<string, unknown>)
    : {};
  if (!secretsMatch(parsed.secret, typeof dd.manage_token === 'string' ? dd.manage_token : null)) {
    return NextResponse.json({ error: 'invalid token' }, { status: 401 });
  }

  const offers = Array.isArray(provider.special_offers) ? [...provider.special_offers] : [];
  if (!offers[0] || !offers[0].title) {
    return NextResponse.json({ error: 'no offer to toggle' }, { status: 400 });
  }
  const active = body.active !== false;
  offers[0] = { ...offers[0], active };

  const { error } = await supabase.from('providers').update({ special_offers: offers }).eq('id', provider.id);
  if (error) return NextResponse.json({ error: 'could not update' }, { status: 500 });

  try { revalidatePath(`/providers/${provider.slug}`); revalidatePath('/deals'); } catch { /* non-fatal */ }
  return NextResponse.json({ ok: true, active });
}
