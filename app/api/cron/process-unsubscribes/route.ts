import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { findUnsubscribeReplies, type UnsubscribeReply } from '../../../../src/lib/draft-saver';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

// GET /api/cron/process-unsubscribes
// Inbound unsubscribe processor (CAN-SPAM / CASL compliance). Reads the
// info@thedripmap.com mailbox via IMAP, finds replies whose subject/body contains
// "unsubscribe", matches the sender to a provider by email, and sets
// providers.email_bounced = true so the outreach + follow-up crons skip them
// (both filter on .neq('email_bounced', true)). Idempotent; safe to run repeatedly.
//
// Auth: Vercel Cron requests include Authorization: Bearer <CRON_SECRET>.
export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  const auth = req.headers.get('authorization') || '';
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return NextResponse.json({ error: 'SMTP_USER/SMTP_PASS required' }, { status: 500 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let replies: UnsubscribeReply[] = [];
  try {
    // Look back a week so a once-daily run never misses a reply.
    replies = await findUnsubscribeReplies(7);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error('process-unsubscribes IMAP error:', detail);
    return NextResponse.json({ error: 'Could not read mailbox', detail }, { status: 502 });
  }

  const senders: string[] = Array.from(new Set(replies.map((r) => r.from))).filter(Boolean);
  const unsubscribed: string[] = [];
  const alreadyFlagged: string[] = [];
  const unmatched: string[] = [];

  for (const from of senders) {
    const { data, error } = await supabase
      .from('providers')
      .select('id, name, email, email_bounced')
      .ilike('email', from)
      .limit(1);
    if (error) {
      console.error('provider lookup failed for', from, error.message);
      continue;
    }
    const row = (data || [])[0] as
      | { id: string; name: string; email: string | null; email_bounced: boolean | null }
      | undefined;
    if (!row) {
      unmatched.push(from);
      continue;
    }
    if (row.email_bounced) {
      alreadyFlagged.push(`${row.name} <${from}>`);
      continue;
    }
    const { error: upErr } = await supabase
      .from('providers')
      .update({ email_bounced: true })
      .eq('id', row.id);
    if (upErr) {
      console.error('failed to flag unsubscribe for', from, upErr.message);
      continue;
    }
    unsubscribed.push(`${row.name} <${from}>`);
  }

  const summary = {
    repliesScanned: replies.length,
    uniqueSenders: senders.length,
    newlyUnsubscribed: unsubscribed.length,
    unsubscribed,
    alreadyFlagged,
    unmatchedSenders: unmatched,
  };
  console.log('process-unsubscribes:', JSON.stringify(summary));
  return NextResponse.json(summary);
}
