/**
 * GET /api/cron/daily-report
 *
 * Schedule (vercel.json): "0 22 * * *" = 22:00 UTC daily = 6pm ET in summer,
 * 5pm ET in winter. The operator can shift this in vercel.json without
 * touching code.
 *
 * Pulls today's lifecycle activity from Supabase:
 *   - New claims today (with source: outreach vs organic)
 *   - New verifications today (who went live)
 *   - Pending claims awaiting verify (with days waiting)
 *   - Drafts prepared today
 *   - Totals: verified clinics, total listings
 *
 * Sends via BOTH email (info@thedripmap.com) AND Telegram (if bot token set).
 *
 * Auth: Authorization: Bearer ${CRON_SECRET}.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMail } from '../../../../src/lib/mailer';
import { sendTelegram } from '../../../../src/lib/telegram';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

interface ClaimRow {
  id: string;
  listing_id: string;
  email: string | null;
  owner_name: string | null;
  status: string | null;
  created_at: string;
  verified_at: string | null;
}

interface ProviderLite {
  id: string;
  name: string | null;
  slug: string | null;
  city: string | null;
  state: string | null;
  outreach_sent: boolean | null;
  outreach_sent_at: string | null;
  is_claimed: boolean | null;
}

function startOfUtcDay(d = new Date()): Date {
  const out = new Date(d);
  out.setUTCHours(0, 0, 0, 0);
  return out;
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function pluralize(n: number, singular: string, plural?: string): string {
  return n === 1 ? `1 ${singular}` : `${n} ${plural || singular + 's'}`;
}

function daysBetween(a: Date, b: Date): number {
  return Math.max(0, Math.floor((a.getTime() - b.getTime()) / (24 * 60 * 60 * 1000)));
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
  const sod = startOfUtcDay(now);
  const sodIso = sod.toISOString();
  const todayStr = fmtDate(sod);

  // 1. New claims today
  const { data: newClaimsRaw } = await supabase
    .from('claim_requests')
    .select('id, listing_id, email, owner_name, status, created_at, verified_at')
    .gte('created_at', sodIso)
    .order('created_at', { ascending: true });
  const newClaims = (newClaimsRaw || []) as ClaimRow[];

  // 2. New verifications today
  const { data: newVerifiedRaw } = await supabase
    .from('claim_requests')
    .select('id, listing_id, email, owner_name, status, created_at, verified_at')
    .eq('status', 'verified')
    .gte('verified_at', sodIso)
    .order('verified_at', { ascending: true });
  const newVerified = (newVerifiedRaw || []) as ClaimRow[];

  // 3. Pending claims awaiting verify (status=pending, not yet verified)
  const { data: pendingRaw } = await supabase
    .from('claim_requests')
    .select('id, listing_id, email, owner_name, status, created_at, verified_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  const pending = (pendingRaw || []) as ClaimRow[];

  // 4. Drafts prepared today (providers row touched by daily-outreach)
  const { count: draftsPreparedToday } = await supabase
    .from('providers')
    .select('id', { count: 'exact', head: true })
    .gte('outreach_sent_at', sodIso);

  // 5. Totals
  const { count: totalVerified } = await supabase
    .from('providers')
    .select('id', { count: 'exact', head: true })
    .eq('is_claimed', true);
  const { count: totalListings } = await supabase
    .from('providers')
    .select('id', { count: 'exact', head: true });

  // 6. Resolve provider rows referenced by today's claims + pending claims
  const listingIds = Array.from(
    new Set(
      [...newClaims, ...newVerified, ...pending]
        .map((c) => c.listing_id)
        .filter(Boolean),
    ),
  );
  const providerMap = new Map<string, ProviderLite>();
  if (listingIds.length) {
    const { data: provs } = await supabase
      .from('providers')
      .select('id, name, slug, city, state, outreach_sent, outreach_sent_at, is_claimed')
      .in('id', listingIds);
    for (const p of (provs || []) as ProviderLite[]) providerMap.set(p.id, p);
  }

  // Build body
  const lines: string[] = [];
  lines.push(`TheDripMap daily report — ${todayStr}`);
  lines.push('');

  // New claims
  lines.push(`NEW CLAIMS TODAY (${newClaims.length})`);
  if (newClaims.length === 0) {
    lines.push('  None.');
  } else {
    for (const c of newClaims) {
      const p = providerMap.get(c.listing_id);
      const name = p?.name || '(unknown clinic)';
      const loc = [p?.city, p?.state].filter(Boolean).join(', ');
      const source = p?.outreach_sent ? 'outreach' : 'organic';
      lines.push(`  - ${name}${loc ? ' (' + loc + ')' : ''}`);
      lines.push(`      contact: ${c.owner_name || '(no name)'} <${c.email || 'no email'}>`);
      lines.push(`      source:  ${source}`);
    }
  }
  lines.push('');

  // Verifications
  lines.push(`NEW VERIFICATIONS TODAY (${newVerified.length})`);
  if (newVerified.length === 0) {
    lines.push('  None.');
  } else {
    for (const c of newVerified) {
      const p = providerMap.get(c.listing_id);
      const name = p?.name || '(unknown clinic)';
      const loc = [p?.city, p?.state].filter(Boolean).join(', ');
      lines.push(`  - ${name}${loc ? ' (' + loc + ')' : ''}`);
    }
  }
  lines.push('');

  // Pending claims awaiting verify
  lines.push(`PENDING CLAIMS AWAITING VERIFY (${pending.length})`);
  if (pending.length === 0) {
    lines.push('  None.');
  } else {
    for (const c of pending) {
      const p = providerMap.get(c.listing_id);
      const name = p?.name || '(unknown clinic)';
      const created = new Date(c.created_at);
      const days = daysBetween(now, created);
      const waiting = days === 0 ? 'today' : pluralize(days, 'day');
      lines.push(`  - ${name} — ${c.email || 'no email'} — waiting ${waiting}`);
    }
  }
  lines.push('');

  // Replies needing personal response (Gmail IMAP scan is its own beast —
  // surface a placeholder pointer for now so the operator knows where to look)
  lines.push('REPLIES NEEDING PERSONAL RESPONSE');
  lines.push('  (Open Gmail; outreach replies land in the standard inbox.');
  lines.push('   Automated reply-classification is a future build — pending.)');
  lines.push('');

  // Drafts + totals
  lines.push(`OUTREACH DRAFTS PREPARED TODAY: ${draftsPreparedToday || 0}`);
  lines.push('');
  lines.push('TOTALS');
  lines.push(`  Verified clinics: ${totalVerified || 0}`);
  lines.push(`  Total listings:   ${totalListings || 0}`);
  lines.push('');
  lines.push('— TheDripMap automation');

  const body = lines.join('\n');
  const subject = `[TheDripMap] Daily report — ${todayStr}`;

  const mailResult = await sendMail({
    from: 'TheDripMap <info@thedripmap.com>',
    to: 'info@thedripmap.com',
    subject,
    text: body,
  });

  const tgResult = await sendTelegram(body);

  return NextResponse.json({
    ok: true,
    date: todayStr,
    counts: {
      newClaims: newClaims.length,
      newVerified: newVerified.length,
      pending: pending.length,
      draftsPreparedToday: draftsPreparedToday || 0,
      totalVerified: totalVerified || 0,
      totalListings: totalListings || 0,
    },
    mail: mailResult,
    telegram: tgResult,
  });
}
