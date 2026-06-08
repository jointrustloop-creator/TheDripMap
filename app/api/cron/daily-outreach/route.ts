import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMail } from '../../../../src/lib/mailer';
import { saveDrafts, type DraftPayload } from '../../../../src/lib/draft-saver';
import { isJunkEmail, isDomainMismatch } from '../../../../src/lib/outreach-quality';
import {
  cleanName,
  buildMultiLocationBody,
  pickSingleLocationBody,
  getProviderViews7d,
  TEMPLATE_MULTI_BASELINE_V1,
  isCanadian,
  outreachSubject,
  type ProviderRow,
} from '../../../../src/lib/outreach-templates';
import { applyOutreachCountryFilter, outreachScopeLabel } from '../../../../src/lib/outreach-config';

const DAILY_TARGET = 19;
const MIN_RATING = 4.5;
const MIN_REVIEWS = 10;

export const maxDuration = 60;

function isEligibleEmail(email: string | null | undefined): boolean {
  return !isJunkEmail(email);
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
  // Canadian inventory considered before US. The country filter (see
  // src/lib/outreach-config.ts) optionally narrows to a specific
  // country list; current setting Canada-only.
  const baseQuery = supabase
    .from('providers')
    .select('id, name, slug, rating, reviews, email, country, city, state, website')
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
  const { data, error } = await applyOutreachCountryFilter(baseQuery);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Existing rating/reviews filter (unrated rows allowed; rated rows must meet
  // threshold) + the new quality scrubbers: hard reject junk/catchall emails,
  // soft reject vendor-domain-mismatch emails.
  const candidates = (data as ProviderRow[]).filter((p) => {
    if (!isEligibleEmail(p.email)) return false;
    if (isDomainMismatch(p.email, p.website)) return false;
    return !p.rating || (Number(p.reviews) >= MIN_REVIEWS && Number(p.rating) >= MIN_RATING);
  });

  if (candidates.length === 0) {
    // Pool exhausted — still send a "0 drafts" report so the operator sees the state.
    const today = new Date().toISOString().slice(0, 10);
    try {
      await sendMail({
        from: 'TheDripMap <info@thedripmap.com>',
        to: 'info@thedripmap.com',
        subject: `[TheDripMap] 0 outreach drafts ready for review, pool exhausted`,
        text: `Daily outreach drafts, ${today}\n\nThe eligible outreach pool is exhausted. No new drafts prepared today.\n\nNext steps: source more emails for unclaimed listings, or expand inventory.`,
      });
    } catch (err) {
      console.error('outreach pool-exhausted report failed:', err);
    }
    return NextResponse.json({ ok: true, skipped: 'no eligible providers' });
  }

  // CASL suppression check: any email on the permanent suppression list
  // is hard-skipped here (no draft queued). Mark the provider with
  // outreach_skipped_reason so we don't keep evaluating it.
  const candidateEmails = Array.from(
    new Set(candidates.map((p) => (p.email || '').trim().toLowerCase()).filter(Boolean))
  );
  const suppressedSet = new Set<string>();
  if (candidateEmails.length > 0) {
    const { data: suppressedRows } = await supabase
      .from('email_suppressions')
      .select('email')
      .in('email', candidateEmails);
    for (const row of (suppressedRows || []) as Array<{ email: string }>) {
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
    // Stamp WHY we skipped, but DON'T set outreach_sent_at (would muddy
    // the conversion metric). outreach_skipped_reason + at are explicit.
    const ids = skippedSuppressed.map((s) => s.id);
    await supabase
      .from('providers')
      .update({
        outreach_skipped_reason: 'suppression_list',
        outreach_skipped_at: new Date().toISOString(),
      })
      .in('id', ids);
  }

  // Group by lowercased email; anchor = top-ranked provider in each group.
  const score = (p: ProviderRow) =>
    (Number(p.rating) || 0) * Math.log10((Number(p.reviews) || 0) + 1);
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

  // Build draft payloads. saveDrafts opens one IMAP connection and appends
  // each. For single-location sends we pick traffic-led vs baseline based on
  // the anchor's trailing-7d view count (pickSingleLocationBody handles the
  // selection + returns the matching templateId). Multi-location stays on
  // the baseline multi template.
  const drafts: DraftPayload[] = await Promise.all(selected.map(async ({ email, providers }) => {
    const anchor = providers[0];
    let text: string;
    let templateId: string;
    if (providers.length > 1) {
      text = buildMultiLocationBody(providers, email);
      templateId = TEMPLATE_MULTI_BASELINE_V1;
    } else {
      const views = await getProviderViews7d(supabase, anchor.id);
      const picked = pickSingleLocationBody(anchor, views);
      text = picked.body;
      templateId = picked.templateId;
    }
    return {
      from: 'TheDripMap <info@thedripmap.com>',
      to: email,
      replyTo: 'info@thedripmap.com',
      subject: outreachSubject(cleanName(anchor.name), providers.length),
      text,
      providerId: anchor.id,
      templateId,
    };
  }));

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
    `Daily outreach drafts, ${today}`,
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
    suppressedSkipped: skippedSuppressed.length,
    reportSent,
  });
}
