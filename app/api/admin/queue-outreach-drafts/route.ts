import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminRequest } from '../../../../src/lib/admin-auth';
import { saveDrafts, type DraftPayload } from '../../../../src/lib/draft-saver';

const SITE_URL = 'https://www.thedripmap.com';

// Clean noisy clinic names for the subject + body
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

// POST /api/admin/queue-outreach-drafts?limit=20
// Admin-only. Reads top-N unclaimed clinics by rating × log(reviews),
// generates a free-claim outreach email for each, saves to Drafts in
// info@thedripmap.com Gmail. Returns count + per-clinic result.
export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);
  const minReviews = Number(searchParams.get('minReviews')) || 50;
  const minRating = Number(searchParams.get('minRating')) || 4.7;

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return NextResponse.json(
      { error: 'SMTP_USER and SMTP_PASS required (Workspace App Password)' },
      { status: 500 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: candidates, error } = await supabase
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

  const ranked = (candidates as ProviderRow[])
    .filter((p) => p.rating && p.reviews && Number(p.reviews) >= minReviews && p.email)
    .sort((a, b) => score(b) - score(a))
    .slice(0, limit);

  if (ranked.length === 0) {
    return NextResponse.json({
      ok: true,
      drafted: 0,
      message: 'No qualifying clinics with email on file. Run email-finder first.',
    });
  }

  const payloads: DraftPayload[] = ranked.map((p) => {
    const display = cleanName(p.name);
    const listingUrl = `${SITE_URL}/providers/${p.slug}`;
    const claimUrl = `${listingUrl}?claim=1`;
    const reviews = Number(p.reviews).toLocaleString();
    return {
      from: 'TheDripMap <info@thedripmap.com>',
      to: p.email!,
      replyTo: 'info@thedripmap.com',
      subject: `Your ${display} listing on TheDripMap`,
      text: `Hi there,

I run TheDripMap (https://www.thedripmap.com) — North America's directory for IV therapy clinics. We added ${display} to our directory and your listing is now live: ${listingUrl}

Your page shows your real Google rating of ${p.rating}★ from ${reviews} patient reviews — but right now it's an unclaimed listing, which means anyone visiting sees a generic placeholder instead of your clinic's photos, hours, services, or one-line pitch.

Claiming is completely free and takes about 2 minutes. Once claimed you control everything on the page — description, drip menu, photos, contact CTAs. Direct link to claim: ${claimUrl}

Warmly,
Deborah Triandafilou
TheDripMap
info@thedripmap.com
https://www.thedripmap.com`,
    };
  });

  try {
    const results = await saveDrafts(payloads);
    return NextResponse.json({
      ok: true,
      drafted: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      results,
    });
  } catch (err) {
    console.error('queue-outreach-drafts error', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
