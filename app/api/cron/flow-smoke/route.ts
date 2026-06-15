/**
 * GET /api/cron/flow-smoke
 *
 * Synthetic health monitor for the critical owner/patient-facing flows.
 * READ-ONLY. It exercises the same things a real owner hits, so a regression
 * (like the finish-link token clobber that silently broke a fresh signup) is
 * caught within hours instead of by a real clinic.
 *
 * Checks (each isolated, never throws the whole run):
 *   1. finish-link-renders - newest claimed clinic's /finish link shows the
 *      form (not the "This link is not valid" page). Catches token clobber /
 *      finish-page regressions.
 *   2. provider-page       - that clinic's public page returns 200 with a title.
 *   3. sitemap             - /sitemap.xml returns 200 with a sane URL count.
 *   4. inbox-watcher       - process-replies stamped a heartbeat in the last 4h.
 *
 * Emails + Telegrams ONLY on failure (no-noise). Schedule (vercel.json): every
 * 6h. Auth: Authorization: Bearer ${CRON_SECRET}.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMail } from '../../../../src/lib/mailer';
import { sendTelegram } from '../../../../src/lib/telegram';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const SITE = 'https://www.thedripmap.com';
const UA = { 'User-Agent': 'dripmap-flow-smoke' };

interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
}

async function runCheck(name: string, fn: () => Promise<string>): Promise<CheckResult> {
  try {
    return { name, ok: true, detail: await fn() };
  } catch (e) {
    return { name, ok: false, detail: e instanceof Error ? e.message : String(e) };
  }
}

// One retry on network error to avoid alarming on a single transient blip.
async function fetchText(url: string, timeoutMs = 15000): Promise<{ status: number; text: string }> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetch(url, { headers: UA, cache: 'no-store', signal: AbortSignal.timeout(timeoutMs) });
      return { status: r.status, text: await r.text() };
    } catch (err) {
      if (attempt === 1) throw err;
    }
  }
  throw new Error('unreachable');
}

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  if ((req.headers.get('authorization') || '') !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'Supabase env missing' }, { status: 500 });
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  // Sample = the newest claimed clinic (the one most at risk of a fresh-token bug).
  const { data: sampleData } = await supabase
    .from('providers')
    .select('*')
    .eq('is_claimed', true)
    .order('claimed_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const sample = sampleData as
    | { id?: string; name?: string; slug?: string; manage_token?: unknown; decision_drivers?: unknown }
    | null;

  const results: CheckResult[] = [];

  results.push(await runCheck('finish-link-renders', async () => {
    if (!sample?.id) throw new Error('no claimed clinic to test');
    const dd = (sample.decision_drivers && typeof sample.decision_drivers === 'object')
      ? (sample.decision_drivers as Record<string, unknown>)
      : {};
    const token = (typeof sample.manage_token === 'string' && sample.manage_token)
      ? sample.manage_token
      : (typeof dd.manage_token === 'string' ? dd.manage_token : '');
    if (!token) throw new Error(`${sample.name}: no manage_token (finish link cannot exist)`);
    const { status, text } = await fetchText(`${SITE}/finish/${sample.id}.${token}`);
    if (text.includes('This link is not valid')) throw new Error(`${sample.name}: finish link shows the invalid-link page`);
    if (status !== 200) throw new Error(`${sample.name}: finish page HTTP ${status}`);
    return `${sample.name}: questionnaire form renders`;
  }));

  results.push(await runCheck('provider-page', async () => {
    if (!sample?.slug) throw new Error('no claimed clinic slug to test');
    const { status, text } = await fetchText(`${SITE}/providers/${sample.slug}`);
    if (status !== 200) throw new Error(`/providers/${sample.slug} HTTP ${status}`);
    if (!/<title>[^<]*TheDripMap/i.test(text)) throw new Error(`/providers/${sample.slug} missing a TheDripMap <title>`);
    return `/providers/${sample.slug}: 200 + title`;
  }));

  results.push(await runCheck('sitemap', async () => {
    const { status, text } = await fetchText(`${SITE}/sitemap.xml`, 20000);
    if (status !== 200) throw new Error(`sitemap HTTP ${status}`);
    const locs = (text.match(/<loc>/g) || []).length;
    if (locs < 1000) throw new Error(`sitemap only has ${locs} URLs (expected 1000+)`);
    return `${locs} URLs`;
  }));

  results.push(await runCheck('inbox-watcher', async () => {
    const { data: cur } = await supabase
      .from('email_replies_cursor')
      .select('last_run_at')
      .eq('id', 1)
      .maybeSingle();
    const last = cur?.last_run_at ? new Date(cur.last_run_at as string) : null;
    if (!last) throw new Error('process-replies has no recorded run');
    const hrs = (Date.now() - last.getTime()) / 3_600_000;
    if (hrs > 4) throw new Error(`process-replies last ran ${hrs.toFixed(1)}h ago (runs every 2h)`);
    return `process-replies ran ${hrs.toFixed(1)}h ago`;
  }));

  results.push(await runCheck('search-page', async () => {
    const { status, text } = await fetchText(`${SITE}/search`);
    if (status !== 200) throw new Error(`/search HTTP ${status}`);
    if (!/<title>/i.test(text)) throw new Error('/search missing a title');
    return '/search: 200';
  }));

  results.push(await runCheck('quiz-page', async () => {
    const { status } = await fetchText(`${SITE}/quiz`);
    if (status !== 200) throw new Error(`/quiz HTTP ${status}`);
    return '/quiz: 200';
  }));

  results.push(await runCheck('city-page', async () => {
    const { status, text } = await fetchText(`${SITE}/cities/toronto`);
    if (status !== 200) throw new Error(`/cities/toronto HTTP ${status}`);
    if (!/<title>[^<]*Toronto/i.test(text)) throw new Error('/cities/toronto title missing or wrong');
    return '/cities/toronto: 200 + title';
  }));

  const failures = results.filter((r) => !r.ok);
  if (failures.length > 0) {
    const body = [
      `TheDripMap FLOW SMOKE CHECK - ${failures.length} FAILURE(S)`,
      '',
      ...failures.map((f) => `FAIL  ${f.name}: ${f.detail}`),
      '',
      'Still passing:',
      ...results.filter((r) => r.ok).map((r) => `  ok  ${r.name}: ${r.detail}`),
      '',
      '- TheDripMap automation',
    ].join('\n');
    await sendMail({
      from: 'TheDripMap <info@thedripmap.com>',
      to: 'info@thedripmap.com',
      subject: `[TheDripMap] FLOW SMOKE CHECK FAILED (${failures.length})`,
      text: body,
    });
    await sendTelegram(body);
  }

  return NextResponse.json({ ok: failures.length === 0, results });
}
