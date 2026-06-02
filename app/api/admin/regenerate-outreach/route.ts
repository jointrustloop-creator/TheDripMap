/**
 * POST /api/admin/regenerate-outreach?mode=today
 * POST /api/admin/regenerate-outreach?mode=next&limit=20
 *
 * mode=today  → Deletes existing outreach drafts whose Subject contains
 *               "listing on TheDripMap" or "locations on TheDripMap"
 *               (i.e. the morning batch), then re-saves clean drafts using
 *               the now-em-dash-free shared template for every provider
 *               with outreach_sent_at >= start of UTC today (grouped by
 *               shared email exactly like the daily cron).
 *
 * mode=next&limit=N → Skips today's batch + already-outreached providers,
 *               selects the next N candidates from the scrubbed pool with
 *               the same Canadian-first / email-grouping logic as the
 *               daily cron, and queues drafts. Marks them outreach_sent
 *               + outreach_sent_at = now so the follow-up cron picks them
 *               up on day 7 just like the cron-queued ones.
 *
 * Auth: accepts either a valid admin cookie (logged in to /admin UI) or
 * an Authorization: Bearer <CRON_SECRET> header for programmatic triggers.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminRequest } from '../../../../src/lib/admin-auth';
import { saveDrafts, deleteDraftsBySubject, type DraftPayload } from '../../../../src/lib/draft-saver';
import { isJunkEmail, isDomainMismatch } from '../../../../src/lib/outreach-quality';
import {
  cleanName,
  buildSingleLocationBody,
  buildMultiLocationBody,
  isCanadian,
  outreachSubject,
  type ProviderRow,
} from '../../../../src/lib/outreach-templates';

export const maxDuration = 60;

const MIN_RATING = 4.5;
const MIN_REVIEWS = 10;

async function isAuthorized(req: Request): Promise<boolean> {
  if (await isAdminRequest()) return true;
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const auth = req.headers.get('authorization') || '';
  return auth === `Bearer ${expected}`;
}

function startOfUtcDay(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function groupByEmail(rows: ProviderRow[]): { email: string; providers: ProviderRow[]; anchor: ProviderRow }[] {
  const score = (p: ProviderRow) =>
    (Number(p.rating) || 0) * Math.log10((Number(p.reviews) || 0) + 1);
  const groups = new Map<string, ProviderRow[]>();
  for (const p of rows) {
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
  return groupArr;
}

function buildDraftsForGroups(groups: { email: string; providers: ProviderRow[]; anchor: ProviderRow }[]): DraftPayload[] {
  return groups.map(({ email, providers }) => {
    const anchor = providers[0];
    const text = providers.length > 1
      ? buildMultiLocationBody(providers, email)
      : buildSingleLocationBody(anchor);
    return {
      from: 'TheDripMap <info@thedripmap.com>',
      to: email,
      replyTo: 'info@thedripmap.com',
      subject: outreachSubject(cleanName(anchor.name), providers.length),
      text,
    };
  });
}

export async function POST(req: Request) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return NextResponse.json({ error: 'SMTP_USER/SMTP_PASS required' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('mode') || 'today';
  const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 19, 1), 50);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (mode === 'today') {
    const { data, error } = await supabase
      .from('providers')
      .select('id, name, slug, rating, reviews, email, country, city, state, website')
      .gte('outreach_sent_at', startOfUtcDay())
      .not('email', 'is', null)
      .neq('email', '');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0) {
      return NextResponse.json({ ok: true, mode, message: 'No clinics with outreach_sent_at today.' });
    }

    const groups = groupByEmail(data as ProviderRow[]);

    // Wipe the morning batch's drafts before re-queuing. Two subject patterns
    // cover both single + multi-location templates.
    let deleted = 0;
    try {
      deleted += await deleteDraftsBySubject('listing on TheDripMap');
      deleted += await deleteDraftsBySubject('locations on TheDripMap');
    } catch (err) {
      return NextResponse.json({ error: `delete failed: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 });
    }

    const drafts = buildDraftsForGroups(groups);
    let results;
    try {
      results = await saveDrafts(drafts);
    } catch (err) {
      return NextResponse.json({ error: `saveDrafts failed: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 });
    }
    // We don't re-touch outreach_sent_at here; the morning value still represents
    // when the recipient was first prepared.
    return NextResponse.json({
      ok: true,
      mode,
      groups: groups.length,
      providersCovered: data.length,
      deleted,
      drafted: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      recipients: groups.map((g) => ({ email: g.email, brand: cleanName(g.anchor.name), locations: g.providers.length })),
    });
  }

  if (mode === 'next') {
    // Pull pool excluding already-outreached providers (today's morning batch
    // included), then apply same scrubbers + ranking as the daily cron.
    const { data, error } = await supabase
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
      .limit(limit * 30);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const candidates = (data as ProviderRow[]).filter((p) => {
      if (isJunkEmail(p.email)) return false;
      if (isDomainMismatch(p.email, p.website)) return false;
      return !p.rating || (Number(p.reviews) >= MIN_REVIEWS && Number(p.rating) >= MIN_RATING);
    });

    if (candidates.length === 0) {
      return NextResponse.json({ ok: true, mode, message: 'Pool exhausted, no eligible providers.' });
    }

    const groups = groupByEmail(candidates).slice(0, limit);
    const drafts = buildDraftsForGroups(groups);

    let results;
    try {
      results = await saveDrafts(drafts);
    } catch (err) {
      return NextResponse.json({ error: `saveDrafts failed: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 });
    }

    // Mark each saved draft's providers as outreach_sent so the follow-up cron
    // picks them up 7 days later, mirroring the daily cron.
    const nowIso = new Date().toISOString();
    let saved = 0;
    const failures: { email: string; error: string }[] = [];
    for (let i = 0; i < groups.length; i++) {
      const r = results[i];
      const { email, providers } = groups[i];
      if (!r.ok) {
        failures.push({ email, error: r.error || 'unknown' });
        continue;
      }
      const ids = providers.map((p) => p.id);
      const { error: upErr } = await supabase
        .from('providers')
        .update({ outreach_sent: true, outreach_sent_at: nowIso })
        .in('id', ids);
      if (upErr) {
        failures.push({ email, error: `db: ${upErr.message}` });
        continue;
      }
      saved += 1;
    }

    return NextResponse.json({
      ok: true,
      mode,
      limit,
      drafted: saved,
      failed: failures.length,
      failures,
      recipients: groups.map((g) => ({
        email: g.email,
        brand: cleanName(g.anchor.name),
        city: g.anchor.city,
        country: g.anchor.country,
        locations: g.providers.length,
      })),
    });
  }

  return NextResponse.json({ error: `Unknown mode '${mode}'. Use 'today' or 'next'.` }, { status: 400 });
}
