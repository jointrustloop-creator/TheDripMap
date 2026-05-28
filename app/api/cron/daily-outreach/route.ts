import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMail } from '../../../../src/lib/mailer';

const SITE_URL = 'https://www.thedripmap.com';
const DAILY_TARGET = 19;
const MIN_RATING = 4.5;
const MIN_REVIEWS = 10;

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
  rating: number;
  reviews: string | number;
  email: string | null;
}

// GET /api/cron/daily-outreach
// Vercel Cron entrypoint. Sends up to 19 outreach emails to the highest-ranked
// unclaimed clinics with email-on-file that have not yet been emailed.
// Marks providers.outreach_sent=true after each send so we never re-email.
// Emails a daily summary to info@thedripmap.com.
//
// Auth: Vercel Cron requests include Authorization: Bearer <CRON_SECRET>.
// Set CRON_SECRET env var in Vercel.
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

  // Staggered sending: this cron fires every 2 minutes during the 9am-ET
  // window (vercel.json: "*/2 13 * * *") and sends exactly ONE email per
  // invocation. That produces a natural ~38-minute drip (one every 2 min)
  // instead of a 19-email burst — lower spam-folder risk — without ever
  // approaching Vercel's function timeout.
  //
  // The daily cap is enforced by counting today's sends: once DAILY_TARGET
  // is reached, later invocations in the window no-op.
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const { count: sentTodayCount } = await supabase
    .from('providers')
    .select('id', { count: 'exact', head: true })
    .gte('outreach_sent_at', startOfDay.toISOString());
  const sentToday = sentTodayCount || 0;

  if (sentToday >= DAILY_TARGET) {
    return NextResponse.json({ ok: true, skipped: 'daily target reached', sentToday });
  }

  // Pull a pool 5x the target so we can rank and filter.
  const { data, error } = await supabase
    .from('providers')
    .select('name, slug, rating, reviews, email')
    .neq('availability', false)
    .eq('is_featured', false)
    .neq('outreach_sent', true)
    .neq('email_bounced', true)
    .or(`rating.gte.${MIN_RATING},rating.is.null`)
    .not('email', 'is', null)
    .neq('email', '')
    .order('rating', { ascending: false, nullsFirst: false })
    .limit(DAILY_TARGET * 10);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Rank by rating × log10(reviews + 1). Null-rating clinics sort last (score=0)
  // but are still eligible — they just get sent after the rated ones.
  const score = (p: ProviderRow) =>
    (Number(p.rating) || 0) * Math.log10((Number(p.reviews) || 0) + 1);
  const ranked = (data as ProviderRow[])
    .filter(
      (p) =>
        p.email &&
        // Include if it meets the threshold OR has no rating data at all
        (!p.rating || (Number(p.reviews) >= MIN_REVIEWS && Number(p.rating) >= MIN_RATING))
    )
    .sort((a, b) => {
      const s = score(b) - score(a);
      return s !== 0 ? s : a.slug.localeCompare(b.slug);
    })
    .slice(0, DAILY_TARGET);

  // Nothing eligible left — the pool is exhausted (report already sent on
  // the run that drained it). No-op.
  if (ranked.length === 0) {
    return NextResponse.json({ ok: true, skipped: 'no eligible clinics remaining', sentToday });
  }

  // Send exactly ONE email this invocation — the highest-ranked unsent clinic.
  const p = ranked[0];
  const display = cleanName(p.name);
  const listingUrl = `${SITE_URL}/providers/${p.slug}`;
  const claimUrl = `${listingUrl}?claim=1`;
  const hasRating = p.rating && Number(p.reviews) > 0;
  const subject = `Your ${display} listing on TheDripMap`;
  const ratingLine = hasRating
    ? `Your listing is live with your real Google rating of ${p.rating}★.`
    : `Your listing is live — but right now it's unclaimed, so visitors see a generic placeholder instead of your photos, hours, services, and description.`;
  const followLine = hasRating
    ? `Right now it's unclaimed, which means visitors see a generic placeholder instead of your photos, hours, services, and description. Claiming is free and takes 2 minutes.`
    : `Claiming is free and takes 2 minutes — you control your description, hours, services, and photos so prospective patients see your clinic at its best.`;
  const text = `Hi ${display} team,

We added ${display} to TheDripMap — North America's directory for IV therapy clinics. ${ratingLine}

${followLine}

Claim your listing here:
${claimUrl}

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
    .update({ outreach_sent: true, outreach_sent_at: new Date().toISOString() })
    .eq('slug', p.slug);

  // Decide whether today's batch is complete. Only the run that sends the
  // final email trips this (the daily cap is hit, or no eligible remain),
  // so the report fires exactly once per day.
  const newSentToday = sentToday + 1;
  const batchDone = newSentToday >= DAILY_TARGET || ranked.length <= 1;
  const today = new Date().toISOString().slice(0, 10);

  let reportSent = false;
  if (batchDone) {
    const { data: todaySends } = await supabase
      .from('providers')
      .select('name, slug, email, outreach_sent_at')
      .gte('outreach_sent_at', startOfDay.toISOString())
      .order('outreach_sent_at', { ascending: true });
    const sends = todaySends || [];
    const reportLines = [
      `Daily outreach report — ${today}`,
      '',
      `Sent today: ${sends.length}`,
      `Stopped because: ${newSentToday >= DAILY_TARGET ? 'daily target reached' : 'eligible pool exhausted'}`,
      '',
      'Recipients (in send order):',
      ...sends.map((r) => `✓ ${cleanName(r.name)} — ${r.email}`),
      '',
      `View all listings: ${SITE_URL}/admin`,
    ];
    try {
      await sendMail({
        from: 'TheDripMap <info@thedripmap.com>',
        to: 'info@thedripmap.com',
        subject: `[TheDripMap] Daily outreach report — ${today} — ${sends.length} sent`,
        text: reportLines.join('\n'),
      });
      reportSent = true;
    } catch (err) {
      console.error('daily report email failed:', err);
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
