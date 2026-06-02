import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminRequest } from '../../../../src/lib/admin-auth';
import { sendMail } from '../../../../src/lib/mailer';
import { deleteDraftsBySubject } from '../../../../src/lib/draft-saver';
import {
  cleanName,
  buildSingleLocationBody,
  buildMultiLocationBody,
  outreachSubject,
  type ProviderRow as TplProviderRow,
} from '../../../../src/lib/outreach-templates';

const SITE_URL = 'https://www.thedripmap.com';

function cleanNameLegacy(n: string): string {
  return n
    .split(' - ')[0]
    .split(' | ')[0]
    .split(', A Division of')[0]
    .replace(/\s+IV (Hydration|Therapy).*$/i, '')
    .trim();
}

interface RankProviderRow {
  name: string;
  slug: string;
  rating: number;
  reviews: string | number;
  email: string | null;
}

// Auth: accept admin cookie OR Authorization: Bearer <CRON_SECRET>.
// Mirrors the daily-outreach cron pattern so the operator can fire this from
// a curl loop without first hitting the admin login.
async function isAuthed(req: Request): Promise<boolean> {
  if (await isAdminRequest()) return true;
  const expected = process.env.CRON_SECRET;
  if (expected && (req.headers.get('authorization') || '') === `Bearer ${expected}`) {
    return true;
  }
  return false;
}

// Crude classifier: treat any synchronous SMTP failure (or send error) as a
// "bounce candidate" for purposes of the 5% safety threshold. Real NDRs arrive
// asynchronously and are handled separately by the unsubscribe/bounce cron;
// this is just the fast-path circuit breaker.
function isLikelyBounceError(err: string | undefined): boolean {
  if (!err) return false;
  const s = err.toLowerCase();
  return (
    /\b5\d\d\b/.test(s) ||
    s.includes('mailbox') ||
    s.includes('no such user') ||
    s.includes('user unknown') ||
    s.includes('does not exist') ||
    s.includes('recipient') ||
    s.includes('relay') ||
    s.includes('rejected') ||
    s.includes('blocked') ||
    s.includes('invalid') ||
    s.includes('bounce')
  );
}

// POST /api/admin/send-outreach-batch?mode=today&limit=5&offset=0&bouncePct=5
// Two modes:
//   mode=today (recommended): sends the drafts queued THIS UTC day by the
//     daily-outreach cron. Groups by recipient email so multi-location operators
//     get one send (matching the draft). Uses the canonical outreach-templates
//     bodies so the SMTP send matches the Gmail draft we delete.
//   mode=rank (legacy default): re-ranks unclaimed clinics from scratch and
//     sends the next slice. Kept for backwards compatibility with task #52's
//     driver script.
//
// Bounce suppression: returns sentCount / failedCount / bouncePct so the caller
// can stop firing when the rolling bounce rate exceeds the configured threshold
// (default 5%). The caller is responsible for tracking cumulative state across
// pages — each call also returns the per-page failure rate.
//
// Pacing: this endpoint sends its slice in one shot (no internal sleeps so we
// stay under Vercel's function timeout). The CALLER spaces calls out across
// time, e.g. "5 every 5 min" via a shell loop with sleep.
export async function POST(req: Request) {
  if (!(await isAuthed(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const mode = (searchParams.get('mode') || 'rank').toLowerCase();
  const limit = Math.min(Number(searchParams.get('limit')) || 5, 20);
  const offset = Number(searchParams.get('offset')) || 0;
  const bouncePct = Math.max(0, Number(searchParams.get('bouncePct')) || 5);

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

  if (mode === 'today') {
    return sendTodayBatch(supabase, { limit, offset, bouncePct });
  }
  return sendRankBatch(supabase, req, { limit, offset });
}

// ---------------------------------------------------------------------------
// mode=today — sends drafts queued by the daily-outreach cron this UTC day.
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = any;

async function sendTodayBatch(
  supabase: AnySupabaseClient,
  opts: { limit: number; offset: number; bouncePct: number }
) {
  const { limit, offset, bouncePct } = opts;

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('providers')
    .select('id, name, slug, rating, reviews, email, country, city, state, website, outreach_sent_at, email_bounced, is_featured')
    .gte('outreach_sent_at', startOfDay.toISOString())
    .eq('is_featured', false)
    .neq('email_bounced', true)
    .not('email', 'is', null)
    .order('outreach_sent_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Group by lowercased email so we send ONE email per draft (matching how the
  // daily-outreach cron created drafts grouped by shared inbox).
  const byEmail = new Map<string, TplProviderRow[]>();
  for (const row of (data as unknown as TplProviderRow[]) || []) {
    const k = (row.email || '').trim().toLowerCase();
    if (!k) continue;
    if (!byEmail.has(k)) byEmail.set(k, []);
    byEmail.get(k)!.push(row);
  }

  // Stable order across calls: earliest outreach_sent_at first, slug as tiebreaker.
  const groups = Array.from(byEmail.entries()).map(([email, providers]) => ({
    email,
    providers,
  }));
  groups.sort((a, b) => (a.email || '').localeCompare(b.email || ''));

  const total = groups.length;
  const slice = groups.slice(offset, offset + limit);
  const results: Array<{
    to: string;
    subject: string;
    sent: boolean;
    draftDeleted: number;
    bounceClassified?: boolean;
    error?: string;
  }> = [];

  for (const { email, providers } of slice) {
    const anchor = providers[0];
    const subject = outreachSubject(cleanName(anchor.name), providers.length);
    const text = providers.length > 1
      ? buildMultiLocationBody(providers, email)
      : buildSingleLocationBody(anchor);

    try {
      const mailResult = await sendMail({
        from: 'TheDripMap <info@thedripmap.com>',
        to: email,
        replyTo: 'info@thedripmap.com',
        subject,
        text,
      });

      if (mailResult.ok) {
        // outreach_sent + outreach_sent_at were already set at draft time. We
        // do NOT need to re-mark, but we DO need to delete the matching Gmail
        // draft so the inbox doesn't show a stale unsent copy.
        let draftDeleted = 0;
        try {
          draftDeleted = await deleteDraftsBySubject(subject);
        } catch (err) {
          console.error('draft delete failed for', subject, err);
        }
        results.push({ to: email, subject, sent: true, draftDeleted });
      } else {
        const bounce = isLikelyBounceError(mailResult.error);
        if (bounce) {
          const ids = providers.map((p) => p.id);
          await supabase
            .from('providers')
            .update({ email_bounced: true })
            .in('id', ids);
        }
        results.push({
          to: email,
          subject,
          sent: false,
          draftDeleted: 0,
          bounceClassified: bounce,
          error: mailResult.error,
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const bounce = isLikelyBounceError(msg);
      if (bounce) {
        const ids = providers.map((p) => p.id);
        await supabase
          .from('providers')
          .update({ email_bounced: true })
          .in('id', ids);
      }
      results.push({
        to: email,
        subject,
        sent: false,
        draftDeleted: 0,
        bounceClassified: bounce,
        error: msg,
      });
    }
  }

  const sentCount = results.filter((r) => r.sent).length;
  const failedCount = results.filter((r) => !r.sent).length;
  const bounceCount = results.filter((r) => r.bounceClassified).length;
  const attempted = results.length;
  const pageBouncePct = attempted > 0 ? (bounceCount / attempted) * 100 : 0;

  // Cumulative rate across today's batch so the caller can decide to halt:
  // rolling failed / rolling attempted (offset + limit so far).
  const todayBounced = await countTodayBounced(supabase, startOfDay.toISOString());
  const rollingAttempted = offset + attempted;
  const rollingBouncePct = rollingAttempted > 0
    ? (todayBounced / rollingAttempted) * 100
    : 0;
  const haltAdvised = rollingBouncePct > bouncePct;

  return NextResponse.json({
    ok: true,
    mode: 'today',
    offset,
    limit,
    total,
    nextOffset: offset + limit < total ? offset + limit : null,
    sentCount,
    failedCount,
    bounceCount,
    pageBouncePct: Number(pageBouncePct.toFixed(2)),
    rollingBouncePct: Number(rollingBouncePct.toFixed(2)),
    bouncePctThreshold: bouncePct,
    haltAdvised,
    results,
  });
}

async function countTodayBounced(
  supabase: AnySupabaseClient,
  startIso: string
): Promise<number> {
  const { count } = await supabase
    .from('providers')
    .select('id', { count: 'exact', head: true })
    .gte('outreach_sent_at', startIso)
    .eq('email_bounced', true);
  return count || 0;
}

// ---------------------------------------------------------------------------
// mode=rank — original behavior: re-rank unclaimed pool and send next slice.
// Preserved for task #52 historical driver script + any ad-hoc calls.
// ---------------------------------------------------------------------------
async function sendRankBatch(
  supabase: AnySupabaseClient,
  req: Request,
  opts: { limit: number; offset: number }
) {
  const { limit, offset } = opts;
  const { searchParams } = new URL(req.url);
  const minReviews = Number(searchParams.get('minReviews')) || 50;
  const minRating = Number(searchParams.get('minRating')) || 4.7;

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

  const score = (p: RankProviderRow) =>
    (Number(p.rating) || 0) * Math.log10((Number(p.reviews) || 0) + 1);

  const ranked = (data as unknown as RankProviderRow[])
    .filter((p) => p.rating && p.reviews && Number(p.reviews) >= minReviews && p.email)
    .sort((a, b) => {
      const s = score(b) - score(a);
      return s !== 0 ? s : a.slug.localeCompare(b.slug);
    });

  const slice = ranked.slice(offset, offset + limit);
  const results: Array<{ to: string; sent: boolean; draftDeleted: number; error?: string }> = [];

  for (const p of slice) {
    const display = cleanNameLegacy(p.name);
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
        await supabase
          .from('providers')
          .update({ outreach_sent: true, outreach_sent_at: new Date().toISOString() })
          .eq('slug', p.slug);
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
    mode: 'rank',
    offset,
    limit,
    totalRanked: ranked.length,
    nextOffset: offset + limit < ranked.length ? offset + limit : null,
    sentCount: results.filter((r) => r.sent).length,
    failedCount: results.filter((r) => !r.sent).length,
    results,
  });
}
