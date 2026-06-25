/**
 * GET /api/cron/weekly-report
 *
 * Schedule (vercel.json): "0 22 * * 0" = 22:00 UTC every Sunday.
 *
 * 7-day rollup with trend vs prior 7 days, outreach-to-claim conversion
 * rate, a leads-this-week block (patient messages + how many auto-forwarded,
 * plus top clinics by contact clicks), top 10 listings by views/clicks from
 * listing_events, and the latest SEO health snapshot. Delivered via email +
 * Telegram, same as the daily report.
 *
 * Auth: Authorization: Bearer ${CRON_SECRET}.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMail } from '../../../../src/lib/mailer';
import { sendTelegram } from '../../../../src/lib/telegram';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

interface ProviderLite {
  id: string;
  name: string | null;
  slug: string | null;
  city: string | null;
  state: string | null;
}

function nDaysAgo(d: Date, n: number): Date {
  const out = new Date(d);
  out.setUTCDate(out.getUTCDate() - n);
  out.setUTCHours(0, 0, 0, 0);
  return out;
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function trend(current: number, prior: number): string {
  if (prior === 0 && current === 0) return 'flat (0 -> 0)';
  if (prior === 0) return `+${current} (from 0)`;
  const delta = current - prior;
  const pct = Math.round((delta / prior) * 100);
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta} vs last week (${sign}${pct}%)`;
}

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  if ((req.headers.get('authorization') || '') !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: 'Supabase env missing' }, { status: 500 });
  }
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const now = new Date();
  const weekStart = nDaysAgo(now, 7); // start of 7-day window inclusive
  const priorStart = nDaysAgo(now, 14);

  // Claims this week + prior week
  const { data: claimsThisRaw } = await supabase
    .from('claim_requests')
    .select('id, listing_id, status, created_at, verified_at')
    .gte('created_at', weekStart.toISOString());
  const { data: claimsPriorRaw } = await supabase
    .from('claim_requests')
    .select('id, listing_id, status, created_at, verified_at')
    .gte('created_at', priorStart.toISOString())
    .lt('created_at', weekStart.toISOString());

  const claimsThis = claimsThisRaw || [];
  const claimsPrior = claimsPriorRaw || [];
  const verifsThis = claimsThis.filter(
    (c) => c.verified_at && new Date(c.verified_at) >= weekStart,
  );
  const verifsPrior = claimsPrior.filter(
    (c) =>
      c.verified_at &&
      new Date(c.verified_at) >= priorStart &&
      new Date(c.verified_at) < weekStart,
  );

  // Drafts prepared this week + prior week (use outreach_sent_at window)
  const { count: draftsThis } = await supabase
    .from('providers')
    .select('id', { count: 'exact', head: true })
    .gte('outreach_sent_at', weekStart.toISOString());
  const { count: draftsPrior } = await supabase
    .from('providers')
    .select('id', { count: 'exact', head: true })
    .gte('outreach_sent_at', priorStart.toISOString())
    .lt('outreach_sent_at', weekStart.toISOString());

  // Totals
  const { count: totalVerified } = await supabase
    .from('providers')
    .select('id', { count: 'exact', head: true })
    .eq('is_claimed', true);
  const { count: totalListings } = await supabase
    .from('providers')
    .select('id', { count: 'exact', head: true });

  // Conversion: claims this week / drafts this week
  const conv =
    (draftsThis || 0) > 0
      ? `${claimsThis.length} / ${draftsThis} = ${Math.round(
          (claimsThis.length / (draftsThis || 1)) * 100,
        )}%`
      : `${claimsThis.length} / 0 drafts (n/a)`;

  // Top listings by views/clicks from listing_events this week
  const { data: eventsRaw } = await supabase
    .from('listing_events')
    .select('provider_id, event_type')
    .gte('created_at', weekStart.toISOString());

  // Direct-contact "lead" clicks — the patient-intent signal that powers the
  // claimed-clinic value prop (and the auto-forward feature): book / call /
  // website only. Views + directions are weaker signals, scored separately.
  const LEAD_CLICK_TYPES = new Set(['book_click', 'call_click', 'website_click']);
  const eventTally = new Map<string, { views: number; clicks: number }>();
  const leadTally = new Map<string, number>();
  let totalLeadClicks = 0;
  for (const ev of eventsRaw || []) {
    const pid = (ev as { provider_id: string }).provider_id;
    const et = (ev as { event_type: string }).event_type;
    if (!pid) continue;
    if (!eventTally.has(pid)) eventTally.set(pid, { views: 0, clicks: 0 });
    const t = eventTally.get(pid)!;
    if (et === 'view') t.views += 1;
    else t.clicks += 1;
    if (LEAD_CLICK_TYPES.has(et)) {
      leadTally.set(pid, (leadTally.get(pid) || 0) + 1);
      totalLeadClicks += 1;
    }
  }
  const ranked = [...eventTally.entries()]
    .map(([pid, t]) => ({ pid, views: t.views, clicks: t.clicks, score: t.views + t.clicks * 3 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  const rankedLeads = [...leadTally.entries()]
    .map(([pid, n]) => ({ pid, n }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 10);

  // Patient messages (Message Clinic leads) this week + how many auto-forwarded
  // straight to the clinic. Resilient to the forward_status column being absent.
  let messagesThis = 0;
  let forwardedThis = 0;
  {
    let rows: Array<{ message?: string | null; forward_status?: string | null }> | null = null;
    const full = await supabase
      .from('inquiries')
      .select('message, forward_status')
      .gte('created_at', weekStart.toISOString())
      .limit(2000);
    if (full.error) {
      const lite = await supabase
        .from('inquiries')
        .select('message')
        .gte('created_at', weekStart.toISOString())
        .limit(2000);
      rows = (lite.data || null) as typeof rows;
    } else {
      rows = (full.data || null) as typeof rows;
    }
    for (const r of rows || []) {
      if (typeof r.message === 'string' && r.message.startsWith('[Lead for ')) {
        messagesThis += 1;
        if (r.forward_status === 'sent') forwardedThis += 1;
      }
    }
  }

  const topProviderMap = new Map<string, ProviderLite>();
  const nameIds = [...new Set([...ranked.map((r) => r.pid), ...rankedLeads.map((r) => r.pid)])];
  if (nameIds.length) {
    const { data: provs } = await supabase
      .from('providers')
      .select('id, name, slug, city, state')
      .in('id', nameIds);
    for (const p of (provs || []) as ProviderLite[]) topProviderMap.set(p.id, p);
  }

  // Reply funnel this week (drafts -> replies, opt-outs, bounces).
  const { data: repliesThisRaw } = await supabase
    .from('email_replies')
    .select('id, category, received_at')
    .gte('received_at', weekStart.toISOString());
  const repliesThis = (repliesThisRaw || []) as Array<{ category: string }>;
  const { data: suppressionsThisRaw } = await supabase
    .from('email_suppressions')
    .select('id, reason, suppressed_at')
    .gte('suppressed_at', weekStart.toISOString());
  const suppressionsThis = (suppressionsThisRaw || []) as Array<{ reason: string }>;
  const drafts = draftsThis || 0;
  const optOutsThis = suppressionsThis.filter((s) => s.reason === 'unsubscribe').length;
  const bouncesThis = suppressionsThis.filter((s) => s.reason === 'hard_bounce').length;
  const respRate = drafts > 0 ? `${repliesThis.length} / ${drafts} = ${Math.round((repliesThis.length / drafts) * 100)}%` : `${repliesThis.length} / 0 drafts (n/a)`;
  const optRate  = drafts > 0 ? `${optOutsThis} / ${drafts} = ${Math.round((optOutsThis / drafts) * 100)}%` : `${optOutsThis} / 0 drafts (n/a)`;
  const bounceRate = drafts > 0 ? `${bouncesThis} / ${drafts} = ${Math.round((bouncesThis / drafts) * 100)}%` : `${bouncesThis} / 0 drafts (n/a)`;

  // SEO health snapshot
  let seoLine = 'No SEO baseline row found.';
  try {
    const { data: seoRow } = await supabase
      .from('seo_health_baseline')
      .select('payload')
      .eq('id', 1)
      .maybeSingle();
    if (seoRow?.payload) {
      const p = seoRow.payload as {
        lastRunIso?: string;
        totalUrls?: number;
        issues?: Array<{ type: string }>;
      };
      const issueCount = Array.isArray(p.issues) ? p.issues.length : 0;
      const totalUrls = p.totalUrls || 0;
      const last = p.lastRunIso ? p.lastRunIso.slice(0, 10) : 'n/a';
      seoLine = `Last crawl ${last}: ${totalUrls} URLs, ${issueCount} open issues.`;
    }
  } catch {
    // ignore — surface as the default line
  }

  // Onboarding funnel (lifetime): verified -> completed questionnaire -> safety
  // badge. Completed = decision_drivers.manage (written only by /api/finish-listing).
  const { data: claimedForFunnel } = await supabase
    .from('providers')
    .select('id, safety_verified, decision_drivers')
    .eq('is_claimed', true);
  const funnelRows = (claimedForFunnel || []) as Array<{ safety_verified: boolean | null; decision_drivers: Record<string, unknown> | null }>;
  const verifiedCount = funnelRows.length;
  const completedQuestionnaire = funnelRows.filter((p) => {
    const dd = (p.decision_drivers && typeof p.decision_drivers === 'object') ? (p.decision_drivers as Record<string, unknown>) : {};
    return !!(dd.manage && typeof dd.manage === 'object');
  }).length;
  const safetyBadge = funnelRows.filter((p) => p.safety_verified === true).length;
  const pctOf = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);

  const lines: string[] = [];
  lines.push(`TheDripMap weekly summary — week of ${fmtDate(weekStart)}`);
  lines.push('');
  lines.push('THIS WEEK');
  lines.push(`  New claims:        ${claimsThis.length}`);
  lines.push(`  New verifications: ${verifsThis.length}`);
  lines.push(`  Outreach drafts:   ${draftsThis || 0}`);
  lines.push('');
  lines.push('TREND vs LAST WEEK');
  lines.push(`  Claims:        ${trend(claimsThis.length, claimsPrior.length)}`);
  lines.push(`  Verifications: ${trend(verifsThis.length, verifsPrior.length)}`);
  lines.push(`  Drafts:        ${trend(draftsThis || 0, draftsPrior || 0)}`);
  lines.push('');
  lines.push(`OUTREACH -> CLAIM CONVERSION (this week): ${conv}`);
  lines.push('');
  lines.push('REPLY FUNNEL (this week)');
  lines.push(`  Response rate: ${respRate}`);
  lines.push(`  Opt-out rate:  ${optRate}`);
  lines.push(`  Bounce rate:   ${bounceRate}`);
  lines.push('');
  lines.push('ONBOARDING FUNNEL (lifetime)');
  lines.push(`  Verified clinics:        ${verifiedCount}`);
  lines.push(`  Completed questionnaire: ${completedQuestionnaire} (${pctOf(completedQuestionnaire, verifiedCount)}% of verified)`);
  lines.push(`  Safety Verified badge:   ${safetyBadge} (${pctOf(safetyBadge, verifiedCount)}% of verified)`);
  lines.push('');
  lines.push('TOTALS');
  lines.push(`  Verified clinics: ${totalVerified || 0}`);
  lines.push(`  Total listings:   ${totalListings || 0}`);
  lines.push('');
  lines.push('LEADS THIS WEEK (patient intent)');
  lines.push(`  Patient messages:  ${messagesThis}${messagesThis > 0 ? ` (${forwardedThis} auto-forwarded to clinics)` : ''}`);
  lines.push(`  Contact clicks:    ${totalLeadClicks} (book + call + website)`);
  if (rankedLeads.length) {
    lines.push('  Top clinics by contact clicks:');
    for (const r of rankedLeads) {
      const p = topProviderMap.get(r.pid);
      const name = p?.name || r.pid.slice(0, 8);
      const loc = [p?.city, p?.state].filter(Boolean).join(', ');
      lines.push(`    - ${name}${loc ? ' (' + loc + ')' : ''} — ${r.n} contact clicks`);
    }
  }
  lines.push('');
  lines.push('TOP 10 LISTINGS THIS WEEK (views + 3x clicks)');
  if (ranked.length === 0) {
    lines.push('  No tracked listing events yet.');
  } else {
    for (const r of ranked) {
      const p = topProviderMap.get(r.pid);
      const name = p?.name || r.pid.slice(0, 8);
      const loc = [p?.city, p?.state].filter(Boolean).join(', ');
      lines.push(`  - ${name}${loc ? ' (' + loc + ')' : ''} — ${r.views} views, ${r.clicks} clicks`);
    }
  }
  lines.push('');
  lines.push('SEO HEALTH');
  lines.push(`  ${seoLine}`);
  lines.push('');
  lines.push('— TheDripMap automation');

  const body = lines.join('\n');
  const subject = `[TheDripMap] Weekly summary — week of ${fmtDate(weekStart)}`;

  const mailResult = await sendMail({
    from: 'TheDripMap <info@thedripmap.com>',
    to: 'info@thedripmap.com',
    subject,
    text: body,
  });

  const tgResult = await sendTelegram(body);

  return NextResponse.json({
    ok: true,
    weekStart: fmtDate(weekStart),
    counts: {
      claimsThis: claimsThis.length,
      verifsThis: verifsThis.length,
      draftsThis: draftsThis || 0,
      claimsPrior: claimsPrior.length,
      verifsPrior: verifsPrior.length,
      draftsPrior: draftsPrior || 0,
      totalVerified: totalVerified || 0,
      totalListings: totalListings || 0,
      messagesThis,
      forwardedThis,
      totalLeadClicks,
      repliesThis: repliesThis.length,
      optOutsThis,
      bouncesThis,
      completedQuestionnaire,
      safetyBadge,
    },
    mail: mailResult,
    telegram: tgResult,
  });
}
