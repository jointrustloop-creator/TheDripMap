/**
 * POST /api/admin/opportunity-update
 *
 * Persist the editable fields on a clinic_opportunities row from the
 * pitch-tracker UI. Operator-set fields only: outreach_status,
 * last_contacted_at, notes. Assessed-by-script fields (gaps, solid,
 * recommendation, manual_check, assessed_at) are NEVER overwritten here.
 *
 * Auth: admin cookie OR Bearer ${CRON_SECRET}.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminRequest } from '../../../../src/lib/admin-auth';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

const ALLOWED_STATUS = new Set(['not_contacted', 'pitched', 'replied', 'sold', 'declined', 'not_a_fit']);

async function isAuthorized(req: Request): Promise<boolean> {
  if (await isAdminRequest()) return true;
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  return (req.headers.get('authorization') || '') === `Bearer ${expected}`;
}

interface UpdatePayload {
  id?: string;
  outreach_status?: string;
  last_contacted_at?: string | null;
  notes?: string;
}

export async function POST(req: Request) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let body: UpdatePayload;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }

  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  if (body.outreach_status && !ALLOWED_STATUS.has(body.outreach_status)) {
    return NextResponse.json({ error: 'invalid outreach_status' }, { status: 400 });
  }

  const patch: Record<string, string | null> = {
    updated_at: new Date().toISOString(),
  };
  if (body.outreach_status !== undefined) patch.outreach_status = body.outreach_status;
  if (body.last_contacted_at !== undefined) patch.last_contacted_at = body.last_contacted_at || null;
  if (body.notes !== undefined) patch.notes = body.notes;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { error } = await supabase.from('clinic_opportunities').update(patch).eq('id', body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
