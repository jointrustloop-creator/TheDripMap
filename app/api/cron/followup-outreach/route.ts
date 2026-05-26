import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMail } from '../../../../src/lib/mailer';

const SITE_URL = 'https://www.thedripmap.com';
const DAILY_TARGET = 15;
const FOLLOWUP_DAYS = 7;

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

  const results: Array<{
    slug: string;
    name: string;
    email: string;
    sent: boolean;
    error?: string;
  }> = [];

  for (const p of ranked) {
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
          .update({ followup_sent: true, followup_sent_at: new Date().toISOString() })
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

  const reportLines = [
    `Daily FOLLOW-UP outreach report — ${today}`,
    '',
    `Sent: ${sentCount}`,
    `Failed: ${failedCount}`,
    `Eligible follow-up pool: ${data!.length}`,
    '',
    'Recipients:',
    ...results.map(
      (r) =>
        `${r.sent ? '✓' : '✗'} ${r.name} — ${r.email}${r.error ? ` — ${r.error}` : ''}`
    ),
  ];

  try {
    await sendMail({
      from: 'TheDripMap <info@thedripmap.com>',
      to: 'info@thedripmap.com',
      subject: `[TheDripMap] Daily follow-up report — ${today} — ${sentCount} sent`,
      text: reportLines.join('\n'),
    });
  } catch (err) {
    console.error('followup report email failed:', err);
  }

  return NextResponse.json({
    ok: true,
    date: today,
    sentCount,
    failedCount,
    poolSize: data!.length,
    results,
  });
}
