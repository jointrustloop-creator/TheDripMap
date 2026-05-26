import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminRequest } from '../../../../src/lib/admin-auth';
import { sendMail } from '../../../../src/lib/mailer';
import { deleteDraftsBySubject } from '../../../../src/lib/draft-saver';

const SITE_URL = 'https://www.thedripmap.com';

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

// POST /api/admin/send-outreach-batch?limit=5&offset=0
// Sends the next `limit` outreach emails starting at `offset` in the ranked
// list of unclaimed clinics with email-on-file. For each one: sends via SMTP
// and deletes the matching Gmail draft (so we don't double-state).
// Driver script calls this 4× with 5-min sleeps to roll all 19.
export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get('limit')) || 5, 20);
  const offset = Number(searchParams.get('offset')) || 0;
  const minReviews = Number(searchParams.get('minReviews')) || 50;
  const minRating = Number(searchParams.get('minRating')) || 4.7;

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return NextResponse.json(
      { error: 'SMTP_USER and SMTP_PASS required' },
      { status: 500 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('providers')
    .select('name, slug, rating, reviews, email')
    .neq('availability', false)
    .eq('is_featured', false)
    .gte('rating', minRating)
    .order('rating', { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const score = (p: ProviderRow) =>
    (Number(p.rating) || 0) * Math.log10((Number(p.reviews) || 0) + 1);

  // Stable sort: score desc, slug asc as tiebreaker (so offsets are deterministic across calls)
  const ranked = (data as ProviderRow[])
    .filter((p) => p.rating && p.reviews && Number(p.reviews) >= minReviews && p.email)
    .sort((a, b) => {
      const s = score(b) - score(a);
      return s !== 0 ? s : a.slug.localeCompare(b.slug);
    });

  const slice = ranked.slice(offset, offset + limit);
  const results: Array<{ to: string; sent: boolean; draftDeleted: number; error?: string }> = [];

  for (const p of slice) {
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
      const mailResult = await sendMail({
        from: 'TheDripMap <info@thedripmap.com>',
        to: p.email!,
        replyTo: 'info@thedripmap.com',
        subject,
        text,
      });

      if (mailResult.ok) {
        // Clear matching draft so Gmail doesn't double-state
        let draftDeleted = 0;
        try {
          draftDeleted = await deleteDraftsBySubject(subject);
        } catch (err) {
          console.error('draft delete failed for', subject, err);
        }
        results.push({ to: p.email!, sent: true, draftDeleted });
      } else {
        results.push({ to: p.email!, sent: false, draftDeleted: 0, error: mailResult.error });
      }
    } catch (err) {
      results.push({
        to: p.email!,
        sent: false,
        draftDeleted: 0,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({
    ok: true,
    offset,
    limit,
    totalRanked: ranked.length,
    nextOffset: offset + limit < ranked.length ? offset + limit : null,
    sentCount: results.filter((r) => r.sent).length,
    failedCount: results.filter((r) => !r.sent).length,
    results,
  });
}
