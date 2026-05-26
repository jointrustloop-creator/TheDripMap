import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMail } from '../../../../src/lib/mailer';

const SITE_URL = 'https://www.thedripmap.com';
const DAILY_TARGET = 19;
const MIN_RATING = 4.5;
const MIN_REVIEWS = 10;

export const maxDuration = 120;

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

  // Pull a pool 5x the target so we can rank and filter.
  const { data, error } = await supabase
    .from('providers')
    .select('name, slug, rating, reviews, email')
    .neq('availability', false)
    .eq('is_featured', false)
    .neq('outreach_sent', true)
    .neq('email_bounced', true)
    .gte('rating', MIN_RATING)
    .not('email', 'is', null)
    .order('rating', { ascending: false })
    .limit(DAILY_TARGET * 10);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Rank by rating × log10(reviews + 1), stable on slug.
  const score = (p: ProviderRow) =>
    (Number(p.rating) || 0) * Math.log10((Number(p.reviews) || 0) + 1);
  const ranked = (data as ProviderRow[])
    .filter((p) => p.rating && p.reviews && Number(p.reviews) >= MIN_REVIEWS && p.email)
    .sort((a, b) => {
      const s = score(b) - score(a);
      return s !== 0 ? s : a.slug.localeCompare(b.slug);
    })
    .slice(0, DAILY_TARGET);

  const results: Array<{
    slug: string;
    name: string;
    email: string;
    sent: boolean;
    error?: string;
  }> = [];

  for (const p of ranked) {
    const display = cleanName(p.name);
    const listingUrl = `${SITE_URL}/providers/${p.slug}`;
    const claimUrl = `${listingUrl}?claim=1`;
    const reviews = Number(p.reviews).toLocaleString();
    const subject = `Your ${display} listing on TheDripMap`;
    const text = `Hi ${display} team,

We added ${display} to TheDripMap — North America's directory for IV therapy clinics. Your listing is live with your real Google rating of ${p.rating}★ from ${reviews} patient reviews.

Right now it's unclaimed, which means visitors see a generic placeholder instead of your photos, hours, services, and description. Claiming is free and takes 2 minutes.

Claim your listing here:
${claimUrl}

Warmly,
Deborah Triandafilou
TheDripMap
info@thedripmap.com`;

    try {
      const mail = await sendMail({
        from: 'TheDripMap <info@thedripmap.com>',
        to: p.email!,
        replyTo: 'info@thedripmap.com',
        subject,
        text,
      });

      if (mail.ok) {
        await supabase
          .from('providers')
          .update({ outreach_sent: true, outreach_sent_at: new Date().toISOString() })
          .eq('slug', p.slug);
        results.push({ slug: p.slug, name: display, email: p.email!, sent: true });
      } else {
        results.push({
          slug: p.slug,
          name: display,
          email: p.email!,
          sent: false,
          error: mail.error,
        });
      }
    } catch (err) {
      results.push({
        slug: p.slug,
        name: display,
        email: p.email!,
        sent: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const sentCount = results.filter((r) => r.sent).length;
  const failedCount = results.filter((r) => !r.sent).length;
  const today = new Date().toISOString().slice(0, 10);

  // Email daily report to operator.
  const reportLines = [
    `Daily outreach report — ${today}`,
    '',
    `Sent: ${sentCount}`,
    `Failed: ${failedCount}`,
    `Pool size (eligible after filter): ${ranked.length}`,
    '',
    'Recipients:',
    ...results.map(
      (r) =>
        `${r.sent ? '✓' : '✗'} ${r.name} — ${r.email}${r.error ? ` — ${r.error}` : ''}`
    ),
    '',
    `View all listings: ${SITE_URL}/admin`,
  ];

  try {
    await sendMail({
      from: 'TheDripMap <info@thedripmap.com>',
      to: 'info@thedripmap.com',
      subject: `[TheDripMap] Daily outreach report — ${today} — ${sentCount} sent`,
      text: reportLines.join('\n'),
    });
  } catch (err) {
    console.error('daily report email failed:', err);
  }

  return NextResponse.json({
    ok: true,
    date: today,
    sentCount,
    failedCount,
    poolSize: ranked.length,
    results,
  });
}
