/**
 * GET /api/cron/onboarding-nudge
 *
 * W1 onboarding day-7 nudge. For onboarding_requests rows with status 'sent',
 * sent_at >= 7 days ago, nudge_sent_at null, and no reply recorded: send the
 * one-time nudge email and mark status 'nudged'. One nudge ever, then never
 * again (rows in 'nudged' status are terminal for email purposes).
 *
 * Entirely gated by ONBOARDING_AUTOSEND in src/lib/onboarding.ts, the same
 * gate as the onboarding email itself. While false this cron early-returns 0,
 * the same pattern as the paused outreach crons.
 *
 * This is a transactional follow-on to the onboarding email, NOT marketing
 * outreach; it is separate from the (zeroed) followup-outreach cron and does
 * not touch outreach_* columns.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMail } from '../../../../src/lib/mailer';
import {
  ONBOARDING_AUTOSEND,
  buildOnboardingNudge,
} from '../../../../src/lib/onboarding';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NUDGE_AFTER_DAYS = 7;
const MAX_NUDGES_PER_RUN = 10;

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  if ((req.headers.get('authorization') || '') !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!ONBOARDING_AUTOSEND) {
    return NextResponse.json({
      ok: true,
      gated: true,
      nudged: 0,
      message: 'onboarding autosend gate is closed (ONBOARDING_AUTOSEND = false in src/lib/onboarding.ts).',
    });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const cutoff = new Date(Date.now() - NUDGE_AFTER_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data: due, error } = await supabase
    .from('onboarding_requests')
    .select('id, provider_id, owner_email, owner_name, status, sent_at, nudge_sent_at, reply_received_at')
    .eq('status', 'sent')
    .lte('sent_at', cutoff)
    .is('nudge_sent_at', null)
    .is('reply_received_at', null)
    .limit(MAX_NUDGES_PER_RUN);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!due || due.length === 0) return NextResponse.json({ ok: true, nudged: 0 });

  let nudged = 0;
  const results: Array<{ provider_id: string; ok: boolean; error?: string }> = [];
  for (const row of due) {
    if (!row.owner_email) {
      results.push({ provider_id: row.provider_id, ok: false, error: 'no owner_email' });
      continue;
    }
    const { data: provider } = await supabase
      .from('providers')
      .select('id, name, slug, city')
      .eq('id', row.provider_id)
      .maybeSingle();
    if (!provider) {
      results.push({ provider_id: row.provider_id, ok: false, error: 'provider missing' });
      continue;
    }
    const email = buildOnboardingNudge(provider, row.owner_name);
    const res = await sendMail({
      from: 'TheDripMap <info@thedripmap.com>',
      to: row.owner_email,
      replyTo: 'info@thedripmap.com',
      subject: email.subject,
      text: email.text,
    });
    if (res.ok) {
      // Mark BEFORE moving on; scoped to this row id + still-'sent' status so
      // a concurrent run cannot double-nudge.
      await supabase
        .from('onboarding_requests')
        .update({ status: 'nudged', nudge_sent_at: new Date().toISOString() })
        .eq('id', row.id)
        .eq('status', 'sent');
      nudged++;
    }
    results.push({ provider_id: row.provider_id, ok: res.ok, error: res.error });
  }

  return NextResponse.json({ ok: true, nudged, results });
}
