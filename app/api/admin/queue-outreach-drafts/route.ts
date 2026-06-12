import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminRequest } from '../../../../src/lib/admin-auth';
import { saveDrafts, deleteDraftsBySubject, type DraftPayload } from '../../../../src/lib/draft-saver';
import { applyOutreachCountryFilter, OUTREACH_DRAFTS_PAUSED } from '../../../../src/lib/outreach-config';

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
  id: string;
  name: string;
  slug: string;
  rating: number;
  reviews: string | number;
  email: string | null;
}

// POST /api/admin/queue-outreach-drafts?limit=20&replace=1
// Admin-only. Reads top-N unclaimed clinics by rating × log(reviews),
// generates a free-claim outreach email for each, saves to Drafts in
// info@thedripmap.com Gmail. Returns count + per-clinic result.
// With ?replace=1, first deletes any existing drafts whose Subject
// contains "listing on TheDripMap" so you don't end up with duplicates.
export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (OUTREACH_DRAFTS_PAUSED) {
    return NextResponse.json({
      ok: true,
      paused: true,
      drafted: 0,
      message:
        'Outreach draft creation is paused (OUTREACH_DRAFTS_PAUSED in src/lib/outreach-config.ts).',
    });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);
  const minReviews = Number(searchParams.get('minReviews')) || 50;
  const minRating = Number(searchParams.get('minRating')) || 4.7;
  const replace = searchParams.get('replace') === '1';

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

  // Country filter (see src/lib/outreach-config.ts) — current: Canada-only.
  const baseLegacyQuery = supabase
    .from('providers')
    .select('id, name, slug, rating, reviews, email')
    .neq('availability', false)
    .eq('is_featured', false)
    .gte('rating', minRating)
    .order('rating', { ascending: false })
    .limit(200);
  const { data: candidates, error } = await applyOutreachCountryFilter(baseLegacyQuery);

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
      text: `Hi ${display} team,

We added ${display} to TheDripMap, North America's matching platform for IV therapy clinics. Your listing is live with your real Google rating of ${p.rating}★ from ${reviews} patient reviews.

Right now it's unclaimed, which means visitors see a generic placeholder instead of your photos, hours, services, and description. Claiming is free and takes 2 minutes.

Claim your listing here:
${claimUrl}

Warmly,
TheDripMap Team
info@thedripmap.com`,
      providerId: p.id,
      templateId: 'legacy_queue_inline_v1',
    };
  });

  try {
    let deleted = 0;
    if (replace) {
      // Clear any prior outreach drafts to avoid duplicates after a template change.
      deleted = await deleteDraftsBySubject('listing on TheDripMap');
    }
    const results = await saveDrafts(payloads);
    return NextResponse.json({
      ok: true,
      replaced: replace,
      deleted,
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
