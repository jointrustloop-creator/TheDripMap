import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMail } from '../../../../src/lib/mailer';

const SITE_URL = 'https://www.thedripmap.com';
const DAILY_TARGET = 15;
const FOLLOWUP_DAYS = 7;

export const maxDuration = 30;

function cleanName(n: string): string {
  return n
    .split(' - ')[0]
    .split(' | ')[0]
    .split(', A Division of')[0]
    .replace(/\s+IV (Hydration|Therapy).*$/i, '')
    .trim();
}

interface ProviderRow {
  name: string;
  slug: string;
  rating: number | null;
  reviews: string | number | null;
  email: string | null;
  outreach_sent_at: string | null;
}

// GET /api/cron/followup-outreach
// Sends a second-touch email to clinics that:
//   - received first outreach (outreach_sent = true)
//   - were emailed >= 7 days ago (outreach_sent_at)
//   - did NOT claim (is_featured = false)
//   - did NOT bounce (email_bounced != true)
//   - have not received a follow-up yet (followup_sent != true)
//
// Industry data: a 7-day follow-up roughly doubles cold-outreach conversion.
// Cron schedule (vercel.json): 14:00 UTC daily, an hour after first-touch cron.
//
// Auth: Vercel attaches Authorization: Bearer ${CRON_SECRET}
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

  // Staggered sending: fires every 2 min during the 10am-ET window
  // (vercel.json: "*/2 14 * * *") and sends ONE follow-up per invocation —
  // a natural ~30-minute drip rather than a 15-email burst. Daily cap is
  // enforced by counting today's follow-ups already sent.
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const { count: sentTodayCount } = await supabase
    .from('providers')
    .select('id', { count: 'exact', head: true })
    .gte('followup_sent_at', startOfDay.toISOString());
  const sentToday = sentTodayCount || 0;

  if (sentToday >= DAILY_TARGET) {
    return NextResponse.json({ ok: true, skipped: 'daily target reached', sentToday });
  }

  const cutoff = new Date(Date.now() - FOLLOWUP_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('providers')
    .select('name, slug, rating, reviews, email, outreach_sent_at')
    .neq('availability', false)
    .eq('is_featured', false)
    .eq('outreach_sent', true)
    .neq('followup_sent', true)
    .neq('email_bounced', true)
    .lte('outreach_sent_at', cutoff)
    .not('email', 'is', null)
    .neq('email', '')
    .order('outreach_sent_at', { ascending: true })
    .limit(DAILY_TARGET * 5);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Re-rank inside the eligible set by rating (still prioritize best clinics)
  const score = (p: ProviderRow) =>
    (Number(p.rating) || 0) * Math.log10((Number(p.reviews) || 0) + 1);
  const ranked = (data as ProviderRow[])
    .sort((a, b) => {
      const s = score(b) - score(a);
      return s !== 0 ? s : a.slug.localeCompare(b.slug);
    })
    .slice(0, DAILY_TARGET);

  if (ranked.length === 0) {
    return NextResponse.json({ ok: true, skipped: 'no eligible follow-ups remaining', sentToday });
  }

  // Send exactly ONE follow-up this invocation — the highest-ranked eligible.
  const p = ranked[0];
  const display = cleanName(p.name);
  const claimUrl = `${SITE_URL}/providers/${p.slug}?claim=1`;
  const subject = `Following up — your ${display} listing on TheDripMap`;
  const text = `Hi ${display} team,

Following up on the note I sent last week about claiming your free listing on TheDripMap — I know inboxes can be busy.

Quick recap: your clinic is live on our directory, but it's currently unclaimed. Visitors see a generic placeholder instead of your real photos, hours, services, and description. Claiming gives you full control and takes 2 minutes:

${claimUrl}

If I'm reaching the wrong person, would you mind forwarding this to whoever handles marketing or the front desk?

Warmly,
Deborah Triandafilou
TheDripMap
info@thedripmap.com`;

  let mailOk = false;
  let mailError: string | undefined;
  try {
    const mail = await sendMail({
      from: 'TheDripMap <info@thedripmap.com>',
      to: p.email!,
      replyTo: 'info@thedripmap.com',
      subject,
      text,
    });
    mailOk = mail.ok;
    mailError = mail.error;
  } catch (err) {
    mailError = err instanceof Error ? err.message : String(err);
  }

  // On failure, DON'T mark sent — the next 2-minute run retries this clinic.
  if (!mailOk) {
    return NextResponse.json({ ok: false, sent: false, slug: p.slug, error: mailError });
  }

  await supabase
    .from('providers')
    .update({ followup_sent: true, followup_sent_at: new Date().toISOString() })
    .eq('slug', p.slug);

  const newSentToday = sentToday + 1;
  const batchDone = newSentToday >= DAILY_TARGET || ranked.length <= 1;
  const today = new Date().toISOString().slice(0, 10);

  let reportSent = false;
  if (batchDone) {
    const { data: todaySends } = await supabase
      .from('providers')
      .select('name, slug, email, followup_sent_at')
      .gte('followup_sent_at', startOfDay.toISOString())
      .order('followup_sent_at', { ascending: true });
    const sends = todaySends || [];
    const reportLines = [
      `Daily FOLLOW-UP outreach report — ${today}`,
      '',
      `Sent today: ${sends.length}`,
      `Stopped because: ${newSentToday >= DAILY_TARGET ? 'daily target reached' : 'eligible pool exhausted'}`,
      '',
      'Recipients (in send order):',
      ...sends.map((r) => `✓ ${cleanName(r.name)} — ${r.email}`),
    ];
    try {
      await sendMail({
        from: 'TheDripMap <info@thedripmap.com>',
        to: 'info@thedripmap.com',
        subject: `[TheDripMap] Daily follow-up report — ${today} — ${sends.length} sent`,
        text: reportLines.join('\n'),
      });
      reportSent = true;
    } catch (err) {
      console.error('followup report email failed:', err);
    }
  }

  return NextResponse.json({
    ok: true,
    date: today,
    sent: true,
    slug: p.slug,
    name: display,
    sentToday: newSentToday,
    batchDone,
    reportSent,
  });
}
