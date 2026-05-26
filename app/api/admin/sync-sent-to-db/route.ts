import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminRequest } from '../../../../src/lib/admin-auth';
import { listRecipientsBySubject } from '../../../../src/lib/draft-saver';

// POST /api/admin/sync-sent-to-db
// Reads Gmail Sent folder for outreach emails ("listing on TheDripMap" subject),
// extracts recipient addresses, and marks matching providers as outreach_sent=true.
// Backfills the tracking state from historical sends before the cron existed.
export async function POST() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return NextResponse.json({ error: 'SMTP_USER/SMTP_PASS required' }, { status: 500 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const all = await listRecipientsBySubject('[Gmail]/Sent Mail', 'listing on TheDripMap');
  const ourAddrs = new Set(['info@thedripmap.com', 'hubertzyworonek@gmail.com']);
  const recipients = [...new Set(all)].filter((e) => !ourAddrs.has(e));

  if (recipients.length === 0) {
    return NextResponse.json({ ok: true, scanned: all.length, marked: 0 });
  }

  const { data: matched, error } = await supabase
    .from('providers')
    .select('slug, name, email, outreach_sent')
    .in('email', recipients);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const unmatched = recipients.filter(
    (e) => !matched!.find((m) => (m.email || '').toLowerCase() === e)
  );
  const toUpdate = matched!.filter((m) => !m.outreach_sent).map((m) => m.email);

  if (toUpdate.length > 0) {
    const { error: updErr } = await supabase
      .from('providers')
      .update({ outreach_sent: true, outreach_sent_at: new Date().toISOString() })
      .in('email', toUpdate);
    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    ok: true,
    scanned: all.length,
    uniqueRecipients: recipients.length,
    providerRowsMatched: matched!.length,
    markedNew: toUpdate.length,
    alreadyMarked: matched!.length - toUpdate.length,
    unmatched,
  });
}
