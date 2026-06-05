/**
 * POST /api/admin/mark-reply-handled
 *
 * Admin-cookie gated. Marks a single email_replies row as handled
 * (sets handled_at = now() and handled_by = 'admin'). Used by the
 * "Mark handled" form on /admin/replies.
 *
 * Body: application/x-www-form-urlencoded, id=<uuid>
 * Redirects back to /admin/replies on success.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminRequest } from '../../../../src/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let id: string | null = null;
  const ct = req.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    try {
      const body = await req.json();
      id = body?.id || null;
    } catch {
      // ignore
    }
  } else {
    const form = await req.formData();
    const v = form.get('id');
    if (typeof v === 'string') id = v;
  }

  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase
    .from('email_replies')
    .update({ handled_at: new Date().toISOString(), handled_by: 'admin' })
    .eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // For form posts, redirect back to /admin/replies.
  return NextResponse.redirect(new URL('/admin/replies', req.url), { status: 303 });
}
