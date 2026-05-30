import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMail } from '../../../../src/lib/mailer';
import { saveDrafts, type DraftPayload } from '../../../../src/lib/draft-saver';

const SITE_URL = 'https://www.thedripmap.com';
const DAILY_TARGET = 19;
const MIN_RATING = 4.5;
const MIN_REVIEWS = 10;

export const maxDuration = 60;

function cleanName(n: string): string {
  return n
    .split(' - ')[0]
    .split(' | ')[0]
    .split(', A Division of')[0]
    .replace(/\s+IV (Hydration|Therapy).*$/i, '')
    .trim();
}

function locationLabel(p: ProviderRow): string {
  const city = (p.city || '').trim();
  const state = (p.state || '').trim();
  if (city && state) return `${city}, ${state}`;
  return city || state || 'location';
}

interface ProviderRow {
  id: string;
  name: string;
  slug: string;
  rating: number | null;
  reviews: string | number | null;
  email: string | null;
  country: string | null;
  city: string | null;
  state: string | null;
}

function isCanadian(country?: string | null): boolean {
  return (country || '').trim().toLowerCase() === 'canada';
}

function isEligibleEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const e = email.trim().toLowerCase();
  if (!e) return false;
  // Skip image-scrape garbage like "images-merchandise_..._site@2x.jpeg"
  if (/\.(jpe?g|png|gif|webp|svg)$/i.test(e)) return false;
  // Basic shape check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return false;
  return true;
}

function buildSingleLocationBody(p: ProviderRow): string {
  const display = cleanName(p.name);
  const claimUrl = `${SITE_URL}/providers/${p.slug}?claim=1`;
  const city = (p.city || '').trim();
  const hasRating = !!(p.rating && Number(p.reviews) > 0);

  // Personalized opener: cite the city + (when we have it) their real Google
  // rating, framed as "you're in a small group of clinics patients trust" —
  // which is TheDripMap's positioning (verified-quality directory).
  const opener = hasRating
    ? `I came across ${display} while researching the top-rated IV therapy clinics in ${city || 'your area'}. Your Google rating of ${p.rating}★ across ${p.reviews} reviews puts you in a small group of clinics patients actually trust — which is exactly the kind we feature on TheDripMap.`
    : `I came across ${display} while building out our ${city || 'local'} IV therapy listings on TheDripMap — North America's directory for IV therapy clinics.`;

  return `Hi ${display} team,

${opener}

We added your listing — but right now it's unclaimed, so visitors see a generic placeholder instead of your photos, hours, services, and description. Claiming is free and takes 2 minutes:
${claimUrl}

Warmly,
Deborah Triandafilou
TheDripMap
info@thedripmap.com

—
To unsubscribe from TheDripMap outreach emails, reply with 'unsubscribe' in the subject line or email info@thedripmap.com`;
}

function buildMultiLocationBody(providers: ProviderRow[], email: string): string {
  const brand = cleanName(providers[0].name);
  const count = providers.length;
  const cities = Array.from(
    new Set(
      providers
        .map((p) => (p.city || '').trim())
        .filter((c) => c.length > 0)
    )
  );
  const cityPhrase = cities.length === 0
    ? 'multiple cities'
    : cities.length === 1
      ? cities[0]
      : cities.length === 2
        ? `${cities[0]} and ${cities[1]}`
        : `${cities.slice(0, -1).join(', ')} and ${cities[cities.length - 1]}`;

  const locations = providers.map((p) => {
    const url = `${SITE_URL}/providers/${p.slug}?claim=1`;
    return `  • ${cleanName(p.name)} — ${locationLabel(p)}\n    ${url}`;
  }).join('\n');

  return `Hi ${brand} team,

I came across ${count} of your ${brand} locations across ${cityPhrase} while researching trusted IV therapy clinics for TheDripMap — North America's directory for IV therapy. All ${count} are live with us but currently unclaimed:

${locations}

Right now visitors see a generic placeholder on each one instead of your real photos, hours, services, and description. Claiming each listing is free and takes 2 minutes.

I sent this once to ${email.toLowerCase().trim()} because all ${count} locations share that email — so you only hear from me once, not ${count} times.

Warmly,
Deborah Triandafilou
TheDripMap
info@thedripmap.com

—
To unsubscribe from TheDripMap outreach emails, reply with 'unsubscribe' in the subject line or email info@thedripmap.com`;
}

// GET /api/cron/daily-outreach
// Fires once daily (vercel.json: "0 13 * * *" = 9am ET). Prepares up to 19
// outreach DRAFTS (not sends) for human review in Gmail. Groups providers by
// shared email address so multi-location operators only get one draft, and
// prioritizes Canadian clinics so we dominate Canada first.
//
// Idempotent: if any outreach_sent_at already exists for today, this is a no-op
// (so the cron is safe to re-trigger or to manually invoke).
export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  if ((req.headers.get('authorization') || '') !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return NextResponse.json({ error: 'SMTP_USER/SMTP_PASS required' }, { status: 500 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Idempotency: if any outreach has been recorded today, no-op.
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const { count: preparedToday } = await supabase
    .from('providers')
    .select('id', { count: 'exact', head: true })
    .gte('outreach_sent_at', startOfDay.toISOString());
  if ((preparedToday || 0) > 0) {
    return NextResponse.json({ ok: true, skipped: 'drafts already prepared today', preparedToday });
  }

  // Pull a wide pool — grouping by email reduces effective count, and we want
  // Canadian inventory considered before US.
  const { data, error } = await supabase
    .from('providers')
    .select('id, name, slug, rating, reviews, email, country, city, state')
    .neq('availability', false)
    .eq('is_featured', false)
    .neq('outreach_sent', true)
    .neq('email_bounced', true)
    .in('email_quality', ['high', 'medium'])
    .or(`rating.gte.${MIN_RATING},rating.is.null`)
    .not('email', 'is', null)
    .neq('email', '')
    .order('rating', { ascending: false, nullsFirst: false })
    .limit(DAILY_TARGET * 30);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Existing rating/reviews filter (unrated rows allowed; rated rows must meet threshold).
  const candidates = (data as ProviderRow[]).filter((p) => {
    if (!isEligibleEmail(p.email)) return false;
    return !p.rating || (Number(p.reviews) >= MIN_REVIEWS && Number(p.rating) >= MIN_RATING);
  });

  if (candidates.length === 0) {
    // Pool exhausted — still send a "0 drafts" report so the operator sees the state.
    const today = new Date().toISOString().slice(0, 10);
    try {
      await sendMail({
        from: 'TheDripMap <info@thedripmap.com>',
        to: 'info@thedripmap.com',
        subject: `[TheDripMap] 0 outreach drafts ready for review — pool exhausted`,
        text: `Daily outreach drafts — ${today}\n\nThe eligible outreach pool is exhausted. No new drafts prepared today.\n\nNext steps: source more emails for unclaimed listings, or expand inventory.`,
      });
    } catch (err) {
      console.error('outreach pool-exhausted report failed:', err);
    }
    return NextResponse.json({ ok: true, skipped: 'no eligible providers' });
  }

  // Group by lowercased email; anchor = top-ranked provider in each group.
  const score = (p: ProviderRow) =>
    (Number(p.rating) || 0) * Math.log10((Number(p.reviews) || 0) + 1);
  const groups = new Map<string, ProviderRow[]>();
  for (const p of candidates) {
    const k = (p.email || '').trim().toLowerCase();
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(p);
  }
  for (const arr of groups.values()) {
    arr.sort((a, b) => {
      const s = score(b) - score(a);
      return s !== 0 ? s : (a.slug || '').localeCompare(b.slug || '');
    });
  }

  // Order groups: Canadian anchor first, then by anchor score within country.
  const groupArr = Array.from(groups.entries()).map(([email, providers]) => ({
    email, providers, anchor: providers[0],
  }));
  groupArr.sort((a, b) => {
    const aCa = isCanadian(a.anchor.country) ? 0 : 1;
    const bCa = isCanadian(b.anchor.country) ? 0 : 1;
    if (aCa !== bCa) return aCa - bCa;
    const s = score(b.anchor) - score(a.anchor);
    return s !== 0 ? s : (a.anchor.slug || '').localeCompare(b.anchor.slug || '');
  });

  const selected = groupArr.slice(0, DAILY_TARGET);

  // Build draft payloads. saveDrafts opens one IMAP connection and appends each.
  const drafts: DraftPayload[] = selected.map(({ email, providers }) => {
    const anchor = providers[0];
    const display = cleanName(anchor.name);
    const subject = providers.length > 1
      ? `Your ${display} locations on TheDripMap`
      : `Your ${display} listing on TheDripMap`;
    const text = providers.length > 1
      ? buildMultiLocationBody(providers, email)
      : buildSingleLocationBody(anchor);
    return {
      from: 'TheDripMap <info@thedripmap.com>',
      to: email,
      replyTo: 'info@thedripmap.com',
      subject,
      text,
    };
  });

  let draftResults;
  try {
    draftResults = await saveDrafts(drafts);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `saveDrafts failed: ${msg}` }, { status: 500 });
  }

  // For each saved draft, mark ALL associated providers as outreach_sent so the
  // followup cron picks up the whole group together 7 days later.
  const nowIso = new Date().toISOString();
  let savedDrafts = 0;
  let savedListings = 0;
  const failures: { email: string; error: string }[] = [];
  for (let i = 0; i < selected.length; i++) {
    const res = draftResults[i];
    const { email, providers } = selected[i];
    if (!res.ok) {
      failures.push({ email, error: res.error || 'unknown' });
      continue;
    }
    const ids = providers.map((p) => p.id);
    const { error: updErr } = await supabase
      .from('providers')
      .update({ outreach_sent: true, outreach_sent_at: nowIso })
      .in('id', ids);
    if (updErr) {
      failures.push({ email, error: `db: ${updErr.message}` });
      continue;
    }
    savedDrafts += 1;
    savedListings += providers.length;
  }

  const today = new Date().toISOString().slice(0, 10);
  const caDrafts = selected.filter((g) => isCanadian(g.anchor.country)).length;
  const usDrafts = selected.length - caDrafts;
  const reportLines = [
    `Daily outreach drafts — ${today}`,
    '',
    `Drafts prepared: ${savedDrafts} (covering ${savedListings} provider listings)`,
    `Canadian drafts: ${caDrafts}`,
    `US drafts: ${usDrafts}`,
    '',
    'Open Gmail Drafts to review and send:',
    'https://mail.google.com/mail/u/0/#drafts',
    '',
    'Recipients (in draft order):',
    ...selected.map(({ email, providers, anchor }) => {
      const tag = isCanadian(anchor.country) ? 'CA' : 'US';
      const brand = cleanName(anchor.name);
      const note = providers.length > 1 ? ` (${providers.length} listings)` : '';
      return `✓ [${tag}] ${brand} — ${email}${note}`;
    }),
    ...(failures.length ? ['', 'Failures:', ...failures.map((f) => `✗ ${f.email}: ${f.error}`)] : []),
    '',
    'Each draft mentions all listings that share its email address (no more duplicates).',
  ];
  let reportSent = false;
  try {
    await sendMail({
      from: 'TheDripMap <info@thedripmap.com>',
      to: 'info@thedripmap.com',
      subject: `[TheDripMap] ${savedDrafts} outreach drafts ready for review`,
      text: reportLines.join('\n'),
    });
    reportSent = true;
  } catch (err) {
    console.error('outreach drafts report email failed:', err);
  }

  return NextResponse.json({
    ok: true,
    date: today,
    drafts: savedDrafts,
    listings: savedListings,
    caDrafts,
    usDrafts,
    failures,
    reportSent,
  });
}
