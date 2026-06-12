import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMail } from '../../../../src/lib/mailer';
import { saveDrafts, type DraftPayload } from '../../../../src/lib/draft-saver';
import { isJunkEmail, isDomainMismatch, CASL_FOOTER } from '../../../../src/lib/outreach-quality';
import { applyOutreachCountryFilter } from '../../../../src/lib/outreach-config';

const SITE_URL = 'https://www.thedripmap.com';
const DAILY_TARGET = 15;
const FOLLOWUP_DAYS = 7;

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
  website: string | null;
  outreach_sent_at: string | null;
}

function isCanadian(country?: string | null): boolean {
  return (country || '').trim().toLowerCase() === 'canada';
}

function isEligibleEmail(email: string | null | undefined): boolean {
  // Delegates to the shared junk-scrubber in outreach-quality.ts.
  return !isJunkEmail(email);
}

function buildSingleFollowupBody(p: ProviderRow): string {
  const display = cleanName(p.name);
  const claimUrl = `${SITE_URL}/providers/${p.slug}?claim=1`;
  const city = (p.city || '').trim();
  const hasRating = !!(p.rating && Number(p.reviews) > 0);

  const recap = hasRating
    ? `Quick recap: ${display} is live on TheDripMap with your real Google rating of ${p.rating}★ across ${p.reviews} reviews, but the listing is still unclaimed, so visitors in ${city || 'your area'} see a generic placeholder instead of your photos, hours, services, and description.`
    : `Quick recap: ${display} is live on TheDripMap among the trusted IV therapy clinics in ${city || 'your area'}, but it's still unclaimed, so visitors see a generic placeholder instead of your real photos, hours, services, and description.`;

  return `Hi ${display} team,

Following up on the note I sent last week about claiming your free listing on TheDripMap. I know inboxes can be busy.

${recap} Claiming gives you full control and takes 2 minutes:

${claimUrl}

If I'm reaching the wrong person, would you mind forwarding this to whoever handles marketing or the front desk?

Warmly,
TheDripMap Team
info@thedripmap.com

${CASL_FOOTER}`;
}

function buildMultiLocationFollowupBody(providers: ProviderRow[], email: string): string {
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
    return `  • ${cleanName(p.name)} - ${locationLabel(p)}\n    ${url}`;
  }).join('\n');

  return `Hi ${brand} team,

Following up on the note I sent last week about your ${count} ${brand} locations across ${cityPhrase} on TheDripMap. I know inboxes can be busy. All ${count} are still unclaimed:

${locations}

Quick recap: visitors see a generic placeholder on each one instead of your real photos, hours, services, and description. Claiming each is free and takes 2 minutes.

I sent this once to ${email.toLowerCase().trim()} because all ${count} locations share that email, so you only hear from me once, not ${count} times.

If I'm reaching the wrong person, would you mind forwarding this to whoever handles marketing or the front desk?

Warmly,
TheDripMap Team
info@thedripmap.com

${CASL_FOOTER}`;
}

// GET /api/cron/followup-outreach
// Fires once daily (vercel.json: "0 14 * * *" = 10am ET). Prepares up to 15
// follow-up DRAFTS for clinics that received first-touch outreach >= 7 days ago
// and have not claimed. Same email-grouping + Canadian-first ordering as the
// daily-outreach cron.
//
// Idempotent: if any followup_sent_at exists for today, no-op.
//
// PAUSED FLAG - leave true. Do NOT flip to false without explicit operator
// approval in the same instruction.
//
// History on this branch:
//   - 2026-06-08: operator paused both outreach crons via PAUSED=true.
//   - 2026-06-11 WS4 first pass: I flipped to PAUSED=false (incorrect).
//   - 2026-06-11 WS4 correction: PAUSED=true again. Only the
//     outreach_suppressions wiring was approved. Resuming the send path
//     is a separate decision not made.
const PAUSED = true;

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  if ((req.headers.get('authorization') || '') !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (PAUSED) {
    return NextResponse.json({
      ok: true,
      paused: true,
      drafted: 0,
      message: 'followup-outreach is paused (PAUSED = true in route.ts). Operator will batch-regenerate manually via /admin/tools.',
    });
  }
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return NextResponse.json({ error: 'SMTP_USER/SMTP_PASS required' }, { status: 500 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const { count: preparedToday } = await supabase
    .from('providers')
    .select('id', { count: 'exact', head: true })
    .gte('followup_sent_at', startOfDay.toISOString());
  if ((preparedToday || 0) > 0) {
    return NextResponse.json({ ok: true, skipped: 'followup drafts already prepared today', preparedToday });
  }

  const cutoff = new Date(Date.now() - FOLLOWUP_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // Country gate (see src/lib/outreach-config.ts) — current: Canada-only.
  const baseFollowupQuery = supabase
    .from('providers')
    .select('id, name, slug, rating, reviews, email, country, city, state, website, outreach_sent_at')
    .neq('availability', false)
    .eq('is_featured', false)
    .eq('outreach_sent', true)
    .neq('followup_sent', true)
    .neq('email_bounced', true)
    .in('email_quality', ['high', 'medium'])
    .lte('outreach_sent_at', cutoff)
    .not('email', 'is', null)
    .neq('email', '')
    .order('outreach_sent_at', { ascending: true })
    .limit(DAILY_TARGET * 30);
  const { data, error } = await applyOutreachCountryFilter(baseFollowupQuery);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Same scrub+mismatch filter as the daily cron, keeps the followup pool
  // consistent so we never follow up on a junk address we shouldn't have used.
  const candidates = (data as ProviderRow[]).filter((p) =>
    isEligibleEmail(p.email) && !isDomainMismatch(p.email, p.website)
  );

  if (candidates.length === 0) {
    const today = new Date().toISOString().slice(0, 10);
    try {
      await sendMail({
        from: 'TheDripMap <info@thedripmap.com>',
        to: 'info@thedripmap.com',
        subject: `[TheDripMap] 0 followup drafts ready for review, pool exhausted`,
        text: `Daily followup drafts, ${today}\n\nNo clinics eligible for a 7-day follow-up today.`,
      });
    } catch (err) {
      console.error('followup pool-exhausted report failed:', err);
    }
    return NextResponse.json({ ok: true, skipped: 'no eligible follow-ups' });
  }

  // CASL suppression check, same as daily-outreach. Skip any email on
  // the permanent suppression list and stamp WHY.
  const candidateEmails = Array.from(
    new Set(candidates.map((p) => (p.email || '').trim().toLowerCase()).filter(Boolean))
  );
  const suppressedSet = new Set<string>();
  if (candidateEmails.length > 0) {
    // WS4 (2026-06-11): read BOTH email_suppressions (legacy) and
    // outreach_suppressions (current). They exist in parallel and
    // both are authoritative. Skipping either lets a previously
    // suppressed email through and risks an embarrassing re-send.
    const [legacy, current] = await Promise.all([
      supabase.from('email_suppressions').select('email').in('email', candidateEmails),
      supabase.from('outreach_suppressions').select('email').in('email', candidateEmails),
    ]);
    for (const row of ((legacy.data || []) as Array<{ email: string }>)) {
      suppressedSet.add(row.email.toLowerCase());
    }
    for (const row of ((current.data || []) as Array<{ email: string }>)) {
      suppressedSet.add(row.email.toLowerCase());
    }
  }
  const skippedSuppressed: { id: string; email: string }[] = [];
  const filteredCandidates = candidates.filter((p) => {
    const k = (p.email || '').trim().toLowerCase();
    if (k && suppressedSet.has(k)) {
      skippedSuppressed.push({ id: p.id, email: k });
      return false;
    }
    return true;
  });
  if (skippedSuppressed.length > 0) {
    const ids = skippedSuppressed.map((s) => s.id);
    await supabase
      .from('providers')
      .update({
        outreach_skipped_reason: 'suppression_list',
        outreach_skipped_at: new Date().toISOString(),
      })
      .in('id', ids);
  }

  // Score by rating × log10(reviews+1), same as daily outreach.
  const score = (p: ProviderRow) =>
    (Number(p.rating) || 0) * Math.log10((Number(p.reviews) || 0) + 1);

  // Group by lowercased email.
  const groups = new Map<string, ProviderRow[]>();
  for (const p of filteredCandidates) {
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

  // Canadian first, then by anchor score.
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

  const drafts: DraftPayload[] = selected.map(({ email, providers }) => {
    const anchor = providers[0];
    const display = cleanName(anchor.name);
    const subject = providers.length > 1
      ? `Following up on your ${display} locations on TheDripMap`
      : `Following up on your ${display} listing on TheDripMap`;
    const text = providers.length > 1
      ? buildMultiLocationFollowupBody(providers, email)
      : buildSingleFollowupBody(anchor);
    return {
      from: 'TheDripMap <info@thedripmap.com>',
      to: email,
      replyTo: 'info@thedripmap.com',
      subject,
      text,
      providerId: anchor.id,
      templateId: providers.length > 1 ? 'followup_multi_v1' : 'followup_single_v1',
    };
  });

  let draftResults;
  try {
    draftResults = await saveDrafts(drafts);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `saveDrafts failed: ${msg}` }, { status: 500 });
  }

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
      .update({ followup_sent: true, followup_sent_at: nowIso })
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
    `Daily FOLLOW-UP drafts, ${today}`,
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
      return `✓ [${tag}] ${brand} - ${email}${note}`;
    }),
    ...(failures.length ? ['', 'Failures:', ...failures.map((f) => `✗ ${f.email}: ${f.error}`)] : []),
  ];
  let reportSent = false;
  try {
    await sendMail({
      from: 'TheDripMap <info@thedripmap.com>',
      to: 'info@thedripmap.com',
      subject: `[TheDripMap] ${savedDrafts} followup drafts ready for review`,
      text: reportLines.join('\n'),
    });
    reportSent = true;
  } catch (err) {
    console.error('followup drafts report email failed:', err);
  }

  return NextResponse.json({
    ok: true,
    date: today,
    drafts: savedDrafts,
    listings: savedListings,
    caDrafts,
    usDrafts,
    failures,
    suppressedSkipped: skippedSuppressed.length,
    reportSent,
  });
}
