/**
 * POST /api/admin/activation-run   body or form: { provider_id }
 *
 * Runs the Clinic Activation Engine for ONE claimed clinic (see
 * src/lib/activation-engine.ts): reads the clinic's website, extracts the
 * facts a patient compares, auto-applies empty low-risk fields (phone,
 * booking link, hours) with provenance, and STAGES treatments/prices and
 * practitioners for the owner to confirm on /finish.
 *
 * Admin-cookie authenticated. Form posts (from /admin/listing-gaps) redirect
 * back; JSON posts get the structured result. Never sends email.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminRequest } from '../../../../src/lib/admin-auth';
import { runActivation } from '../../../../src/lib/activation-engine';
import { machineTokenOk } from '../../../../src/lib/machine-token';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  // Admin cookie, or the operator-side machine token (src/lib/machine-token.ts).
  if (!(await isAdminRequest()) && !machineTokenOk(req.headers.get('authorization'))) {
    // Safe diagnostics for the operator-side runner (never the value): is a
    // token configured on this deployment, and did the presented one match in
    // length? Only returned when a Bearer header was actually presented.
    const presented = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
    const expected = (process.env.ACTIVATION_RUN_TOKEN || '').trim();
    return NextResponse.json(
      presented
        ? { error: 'Unauthorized', tokenConfigured: expected.length > 0, lengthMatch: presented.length === expected.length }
        : { error: 'Unauthorized' },
      { status: 401 },
    );
  }

  let providerId = '';
  let isForm = false;
  let dryRun = false;
  // Warm outreach (Activation Plan step 5) pre-builds the profile of an
  // UNCLAIMED clinic before we write to them: "we already found your menu,
  // claim it and confirm". JSON callers opt in explicitly; the form on
  // /admin/listing-gaps only ever runs claimed clinics.
  let allowUnclaimed = false;
  const ct = req.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    const body = await req.json().catch(() => ({}));
    providerId = String(body?.provider_id || body?.providerId || '').trim();
    dryRun = body?.dry_run === true;
    allowUnclaimed = body?.allow_unclaimed === true;
  } else {
    isForm = true;
    const form = await req.formData();
    providerId = String(form.get('provider_id') || '').trim();
  }
  if (!providerId) return NextResponse.json({ error: 'provider_id required' }, { status: 400 });

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: prov } = await sb.from('providers').select('id, is_claimed').eq('id', providerId).maybeSingle();
  if (!prov) return NextResponse.json({ error: 'provider not found' }, { status: 404 });
  // Claimed clinics by default: the point is an owner confirming their own facts.
  if ((prov as { is_claimed?: boolean }).is_claimed !== true && !allowUnclaimed) {
    return NextResponse.json({ error: 'provider is not claimed' }, { status: 400 });
  }

  const result = await runActivation(sb, providerId, { dryRun });
  if (isForm) {
    const q = new URLSearchParams({
      ran: providerId,
      ok: result.ok ? '1' : '0',
      staged: String(result.staged.treatments),
      applied: result.autoApplied.join(','),
      err: result.errors.join('; ').slice(0, 160),
    });
    return NextResponse.redirect(new URL(`/admin/listing-gaps?${q.toString()}`, req.url), 303);
  }
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
