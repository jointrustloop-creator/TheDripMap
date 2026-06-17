import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTelegram } from '../../../../src/lib/telegram';
import {
  readEnabled, readDailyCap, isWithinWindow, isSummarySlot,
  selectCandidates, todaySentCount, claimAndSend, isSuppressed, isValidEmail,
  torontoParts, torontoDayStart, BATCH_SIZE, KIND,
} from '../../../../src/lib/outreach-autopilot';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// GET /api/cron/outreach-autopilot
//
// Fires every 30 min across a wide UTC band (vercel.json); the route itself
// enforces the exact Mon to Fri, 09:00 to 17:00 America/Toronto window. Each
// run sends up to BATCH_SIZE (5) emails, subject to the daily cap. The control
// flag is re-read immediately before EVERY individual send and the run fails
// closed (aborts that send) if the flag is off or unreadable.
export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  if ((req.headers.get('authorization') || '') !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date();

  // Daily summary just after the window closes (17:00 Toronto, once).
  if (isSummarySlot(now)) {
    return summary(supabase, now);
  }

  // Hard window gate.
  if (!isWithinWindow(now)) {
    return NextResponse.json({ mode: 'idle', reason: 'outside business window', toronto: torontoParts(now) });
  }

  // Gate: master flag.
  if (!(await readEnabled(supabase))) {
    return NextResponse.json({ mode: 'batch', aborted: 'flag off (fail closed)' });
  }

  // Gate: daily cap.
  const cap = await readDailyCap(supabase);
  const already = await todaySentCount(supabase);
  const remaining = Math.max(0, cap - already);
  if (remaining <= 0) {
    return NextResponse.json({ mode: 'batch', aborted: 'daily cap reached', sentToday: already, cap });
  }

  const target = Math.min(BATCH_SIZE, remaining);
  // Over-fetch so per-email skips (suppressed/invalid/raced) still let us reach
  // the target without a second query.
  const candidates = await selectCandidates(supabase, target * 4);

  const sent: { slug: string; email: string }[] = [];
  const skipped: { slug: string; reason: string }[] = [];

  for (const p of candidates) {
    if (sent.length >= target) break;

    // Re-read the flag immediately before THIS send. Fail closed.
    if (!(await readEnabled(supabase))) {
      skipped.push({ slug: p.slug, reason: 'flag turned off mid-batch' });
      break;
    }
    // Re-check the window (a long batch must not spill past close).
    if (!isWithinWindow(new Date())) {
      skipped.push({ slug: p.slug, reason: 'window closed mid-batch' });
      break;
    }
    const email = (p.email || '').trim();
    if (!isValidEmail(email)) { skipped.push({ slug: p.slug, reason: 'invalid email' }); continue; }
    // Fresh suppression check (someone may have unsubscribed since selection).
    if (await isSuppressed(supabase, email)) { skipped.push({ slug: p.slug, reason: 'suppressed' }); continue; }

    const r = await claimAndSend(supabase, p);
    if (r.ok) sent.push({ slug: p.slug, email });
    else skipped.push({ slug: p.slug, reason: r.reason });
  }

  // Per-batch Telegram ping with count + recipients.
  if (sent.length > 0) {
    const lines = sent.map((x) => `- ${x.slug} (${x.email})`).join('\n');
    await sendTelegram(
      `TheDripMap autopilot: sent ${sent.length} outreach email${sent.length === 1 ? '' : 's'} ` +
      `(${already + sent.length}/${cap} today)\n${lines}`
    );
  }

  return NextResponse.json({
    mode: 'batch',
    sentCount: sent.length,
    sent, skipped,
    sentToday: already + sent.length,
    cap,
  });
}

async function summary(supabase: ReturnType<typeof createClient>, now: Date) {
  const { count: total } = await supabase
    .from('outbound_message_log')
    .select('id', { count: 'exact', head: true })
    .eq('kind', KIND).eq('status', 'sent')
    .gte('sent_at', torontoDayStart(now).toISOString());
  const cap = await readDailyCap(supabase);
  const enabled = await readEnabled(supabase);
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', dateStyle: 'medium' }).format(now);

  await sendTelegram(
    `TheDripMap autopilot daily summary, ${day}\n` +
    `Sent today: ${total || 0} of cap ${cap}\n` +
    `Flag is currently ${enabled ? 'ON' : 'OFF'}.`
  );
  return NextResponse.json({ mode: 'summary', sentToday: total || 0, cap, enabled });
}
