import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminRequest } from '../../../../src/lib/admin-auth';

const ALLOWED_STATUSES = new Set([
  'researched',
  'drafted',
  'sent',
  'replied',
  'linked',
  'rejected',
]);

// POST /api/admin/backlinks
// Body: { id: string, action: 'mark_sent'|'mark_replied'|'mark_linked'|'mark_rejected'|'delete' }
export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const data = await req.json();
    const id = String(data?.id || '').trim();
    const action = String(data?.action || '').trim();
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (action === 'delete') {
      const { error } = await supabase.from('backlink_targets').delete().eq('id', id);
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    const statusMap: Record<string, string> = {
      mark_sent: 'sent',
      mark_replied: 'replied',
      mark_linked: 'linked',
      mark_rejected: 'rejected',
    };
    const newStatus = statusMap[action];
    if (!newStatus || !ALLOWED_STATUSES.has(newStatus)) {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    const updates: Record<string, unknown> = { status: newStatus };
    if (newStatus === 'sent') updates.sent_at = new Date().toISOString();
    if (newStatus === 'linked') updates.linked_at = new Date().toISOString();

    const { error } = await supabase.from('backlink_targets').update(updates).eq('id', id);
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Admin backlinks update error:', err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
