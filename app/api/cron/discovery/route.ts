/**
 * GET /api/cron/discovery
 *
 * Weekly slow discovery. One Canadian city per week (ISO-week rotation), a hard
 * cap on upstream API calls, and a diff that never deletes.
 *
 * Auth: Authorization: Bearer ${CRON_SECRET}
 * Query params:
 *   ?city=Toronto  force a specific city (used for the first run)
 *   ?dry=1         run the search + diff, write NOTHING
 *
 * Kill switch: DISCOVERY_ENABLED=false disables the run (default is enabled).
 * Quota: MAX_CALLS is a hard ceiling; the count actually used is logged to
 * discovery_runs and emailed, because silent quota burn has bitten us before.
 *
 * Outcomes:
 *   NEW      -> unclaimed Canadian listing with the honest template (no staffing
 *               or safety claims), eligible for the normal first-touch draft queue.
 *   CLOSED   -> discovery_flag set for operator review. Never auto-deleted.
 *   CHANGED  -> phone/address updated silently and logged.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMail } from '../../../../src/lib/mailer';
import { REPORT_TO } from '../../../../src/lib/report-recipient';
import { PlacesSource } from '../../../../src/lib/discovery-places';
import { runFirecrawl, PROVINCE } from '../../../../src/lib/discovery-run';
import {
  DISCOVERY_QUERIES,
  cityForWeek,
  citiesForRun,
  diffPlaces,
  honestDescription,
  type ExistingLite,
} from '../../../../src/lib/discovery';
import { slugify } from '../../../../src/lib/data';
import { notCanadianReason } from '../../../../src/lib/discovery-guard';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const MAX_CALLS = 60;

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  if ((req.headers.get('authorization') || '') !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (String(process.env.DISCOVERY_ENABLED || 'true').toLowerCase() === 'false') {
    return NextResponse.json({ ok: true, skipped: 'DISCOVERY_ENABLED=false' });
  }

  const url = new URL(req.url);
  const dry = url.searchParams.get('dry') === '1';
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // MULTI-CITY DAILY SWEEP (2026-08-30). Discovery used to do one city per
  // WEEK, which at 15 cities meant a national pass every 15 weeks and a couple
  // of new clinics a month. Outreach fuel is now exhausted (every Canadian
  // clinic holding an email has been contacted), so discovery is the growth
  // ceiling for the whole business. Runs daily over several cities, bounded by
  // a wall-clock guard so it always returns inside Vercel's 300s cap.
  const fcKeyEarly = process.env.FIRECRAWL_API_KEY;
  const forced = url.searchParams.get('city');
  if (fcKeyEarly && !forced) {
    const perRun = Math.max(1, Math.min(6, Number(url.searchParams.get('cities') || 3)));
    const cities = citiesForRun(perRun);
    const started = Date.now();
    const BUDGET_MS = 230_000;
    const runs: Array<Record<string, unknown>> = [];
    for (const c of cities) {
      if (Date.now() - started > BUDGET_MS) {
        runs.push({ city: c, skipped: 'time budget reached' });
        continue;
      }
      const res = await runFirecrawl(sb, fcKeyEarly, c, PROVINCE[c] || null, dry, { silent: true });
      runs.push({ ...res });
    }
    const totalNew = runs.reduce((s, r) => s + (Number(r.created) || 0), 0);
    const names = runs.flatMap((r) => (Array.isArray(r.names) ? (r.names as string[]) : []));
    try {
      await sendMail({
        from: 'TheDripMap <info@thedripmap.com>',
        to: REPORT_TO,
        subject: `[TheDripMap] Discovery: ${totalNew} new across ${cities.length} cities`,
        text: [
          `Discovery run ${dry ? '(DRY) ' : ''}over ${cities.join(', ')} via Firecrawl.`,
          '',
          ...runs.map((r) =>
            r.skipped
              ? `  ${r.city}: skipped (${r.skipped})`
              : `  ${r.city}: ${r.created} new, ${r.candidates} domains seen, ${r.verified} pages verified`,
          ),
          '',
          `Total new clinics: ${totalNew}${names.length ? ' -> ' + names.join(', ') : ''}`,
          '',
          'Every insert passed all three checks on its own site (unambiguous IV',
          'service, the city named on the page, no US location) and is flagged',
          'firecrawl_needs_review, so it is EXCLUDED from outreach until a human',
          'confirms the name. Nothing was ever deleted.',
        ].join('\n'),
      });
    } catch { /* reporting must never fail the run */ }
    return NextResponse.json({ ok: true, dry, source: 'firecrawl', cities, totalNew, runs });
  }

  const city = forced || cityForWeek();
  const province = PROVINCE[city] || null;

  // FIRECRAWL FIRST (2026-08-27). The Places path below has returned
  // REQUEST_DENIED on every run since mid-July — the Google Cloud project has
  // no billing account and standing one up has stalled repeatedly. Firecrawl
  // is the engine that found the +43 clinic batch in July, we already pay for
  // it, and it needs no Google anything. Places remains as the fallback so the
  // day billing exists, removing FIRECRAWL_API_KEY restores the richer source
  // (address, geo, ratings, closed-detection) with no code change.
  const fcKey = process.env.FIRECRAWL_API_KEY;
  if (fcKey) {
    return NextResponse.json(await runFirecrawl(sb, fcKey, city, province, dry));
  }

  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return NextResponse.json({ error: 'Neither FIRECRAWL_API_KEY nor GOOGLE_PLACES_API_KEY is set' }, { status: 500 });
  const source = new PlacesSource(key);

  // 1. Search this week's city within budget.
  const { places, apiCalls: searchCalls, notes } = await source.search(city, DISCOVERY_QUERIES(city), MAX_CALLS);
  let apiCalls = searchCalls;

  // 2. Load the existing Canadian rows for this city (plus any row already
  //    carrying a place_id we might match on).
  const { data: existingRaw } = await sb
    .from('providers')
    .select('id,name,address,phone,place_id,business_status,city')
    .eq('country', 'Canada')
    .ilike('city', city);
  const existing = (existingRaw || []) as ExistingLite[];

  // 3. Diff. place_id first, then name+address fuzzy.
  const diff = diffPlaces(places, existing);

  // 4. Apply. Details calls (phone/website) only for genuinely new clinics, and
  //    only while budget remains, so a big city can never blow the cap.
  const created: string[] = [];
  const updated: string[] = [];
  const flagged: string[] = [];
  const nowIso = new Date().toISOString();

  if (!dry) {
    for (const p of diff.isNew) {
      if (!p.name) continue;
      let phone: string | null = null, website: string | null = null;
      if (apiCalls < MAX_CALLS) {
        const d = await source.details(p.sourceId);
        apiCalls++;
        phone = d.phone; website = d.website;
      }
      const slug = `${slugify(p.name)}-${slugify(city)}`;
      const { error } = await sb.from('providers').insert({
        name: p.name,
        slug,
        city,
        state: province,
        country: 'Canada',
        address: p.address || null,
        phone,
        website,
        latitude: p.lat ?? null,
        longitude: p.lng ?? null,
        place_id: p.sourceId,
        business_status: p.businessStatus || null,
        description: honestDescription(p.name, city),
        rating: p.rating ?? null,
        reviews: p.reviews ?? null,
        is_claimed: false,
        is_hidden: false,
        discovery_source: source.name,
        discovery_seen_at: nowIso,
      });
      if (!error) created.push(p.name);
    }

    for (const u of diff.updates) {
      const { error } = await sb.from('providers')
        .update({ ...u.changes, discovery_source: source.name, discovery_seen_at: nowIso })
        .eq('id', u.id);
      if (!error) updated.push(`${u.place.name}: ${Object.keys(u.changes).join(', ')}`);
    }

    for (const c of diff.closed) {
      // Flag only. Never hide or delete: that is the operator's call.
      const { error } = await sb.from('providers')
        .update({ business_status: c.status, discovery_flag: 'closed_needs_review', discovery_seen_at: nowIso })
        .eq('id', c.id);
      if (!error) flagged.push(`${c.name} (${c.status})`);
    }

    await sb.from('discovery_runs').insert({
      city, source: source.name, api_calls: apiCalls, results_seen: places.length,
      new_clinics: created.length, updated: updated.length, flagged: flagged.length,
      notes: notes.join(' | ') || null,
    });
  }

  const lines = [
    `Discovery run ${dry ? '(DRY) ' : ''}for ${city}`,
    '',
    `API calls used: ${apiCalls} of ${MAX_CALLS}`,
    `Results seen: ${places.length}`,
    `New clinics: ${created.length}${created.length ? ' -> ' + created.join(', ') : ''}`,
    `Updated (phone/address): ${updated.length}${updated.length ? ' -> ' + updated.join('; ') : ''}`,
    `Flagged closed, needs your review: ${flagged.length}${flagged.length ? ' -> ' + flagged.join('; ') : ''}`,
    '',
    'New clinics enter the normal first-touch draft queue. Nothing was deleted.',
    notes.length ? `Notes: ${notes.join(' | ')}` : '',
  ].filter(Boolean);

  try {
    await sendMail({
      from: 'TheDripMap <info@thedripmap.com>',
      to: REPORT_TO,
      subject: `[TheDripMap] Discovery ${city}: ${created.length} new, ${apiCalls}/${MAX_CALLS} API calls`,
      text: lines.join('\n'),
    });
  } catch { /* reporting must never fail the run */ }

  return NextResponse.json({
    ok: true, city, dry, apiCalls, maxCalls: MAX_CALLS,
    resultsSeen: places.length, created: created.length, updated: updated.length, flagged: flagged.length, notes,
  });
}
