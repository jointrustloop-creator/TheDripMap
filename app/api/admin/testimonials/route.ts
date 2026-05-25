import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminRequest } from '../../../../src/lib/admin-auth';

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await req.json();
    const id = String(data?.id || '').trim();
    const action = String(data?.action || '').trim();

    if (!id || !['approve', 'reject', 'delete'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid params.' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (action === 'delete') {
      const { error } = await supabase.from('testimonials').delete().eq('id', id);
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    const updates: Record<string, unknown> = {
      status: action === 'approve' ? 'approved' : 'rejected',
      moderation_token: '__used__',
    };
    if (action === 'approve') updates.approved_at = new Date().toISOString();
    else updates.rejected_at = new Date().toISOString();

    const { error } = await supabase.from('testimonials').update(updates).eq('id', id);
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Admin moderation error:', err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
