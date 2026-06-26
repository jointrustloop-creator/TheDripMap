/**
 * GET /api/cron/claim-reminder
 *
 * Abandoned-claim recovery. Finds claim_requests still 'pending' (owner
 * submitted a claim but never clicked verify) that are between REMIND_AFTER_DAYS
 * and REMIND_CEILING_DAYS old and have not been reminded, then sends ONE
 * reminder: the still-valid verification link, or a fresh-start link if it
 * expired. Marks reminder_sent_at so a claim is reminded at most once.
 *
 * Gated by CLAIM_REMINDER_AUTOSEND in src/lib/claim-reminder.ts. While false the
 * cron is a DRY RUN: it returns the candidates it WOULD remind and sends
 * nothing, so the operator can review before flipping the gate.
 *
 * Requires the claim_requests.reminder_sent_at column
 * (scripts/create-claim-reminder-column.sql). Until that migration is applied,
 * the route reports needsMigration and sends nothing.
 *
 * Auth: Authorization: Bearer ${CRON_SECRET}.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMail } from '../../../../src/lib/mailer';
import {
  CLAIM_REMINDER_AUTOSEND,
  REMIND_AFTER_DAYS,
  REMIND_CEILING_DAYS,
  OPERATOR_EMAIL,
  buildClaimReminder,
  buildClaimRestart,
} from '../../../../src/lib/claim-reminder';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SITE_URL = 'https://www.thedripmap.com';
const MAX_PER_RUN = 25;

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

  const now = Date.now();
  const after = new Date(now - REMIND_AFTER_DAYS * 86400000).toISOString();
  const floor = new Date(now - REMIND_CEILING_DAYS * 86400000).toISOString();

  // reminder_sent_at IS NULL requires the migration. If the column is missing,
  // Supabase returns a 42703-style error; report it instead of crashing.
  const { data: due, error } = await supabase
    .from('claim_requests')
    .select('id, listing_id, email, owner_name, token, expires_at, created_at, reminder_sent_at')
    .eq('status', 'pending')
    .lte('created_at', after)
    .gte('created_at', floor)
    .is('reminder_sent_at', null)
    .order('created_at', { ascending: true })
    .limit(MAX_PER_RUN);

  if (error) {
    const needsMigration = /reminder_sent_at/.test(error.message);
    return NextResponse.json({
      ok: false,
      needsMigration,
      message: needsMigration
        ? 'Apply scripts/create-claim-reminder-column.sql (adds claim_requests.reminder_sent_at), then this cron works.'
        : error.message,
    }, { status: needsMigration ? 200 : 500 });
  }

  const candidates = due || [];

  // Resolve provider names/slugs for every candidate.
  const provMap = new Map<string, { name: string; slug: string; city: string | null }>();
  if (candidates.length) {
    const { data: provs } = await supabase
      .from('providers')
      .select('id, name, slug, city')
      .in('id', candidates.map((c) => c.listing_id));
    for (const p of (provs || []) as Array<{ id: string; name: string; slug: string; city: string | null }>) {
      provMap.set(p.id, { name: p.name, slug: p.slug, city: p.city });
    }
  }

  const preview = candidates.map((c) => {
    const p = provMap.get(c.listing_id);
    const expired = new Date(c.expires_at).getTime() < now;
    return {
      clinic: p?.name || c.listing_id.slice(0, 8),
      email: c.email,
      pendingSince: c.created_at.slice(0, 10),
      linkExpired: expired,
      kind: expired ? 'restart' : 'reminder',
    };
  });

  // DRY RUN while gated: show what would send, send nothing.
  if (!CLAIM_REMINDER_AUTOSEND) {
    return NextResponse.json({
      ok: true,
      gated: true,
      message: 'CLAIM_REMINDER_AUTOSEND is false (src/lib/claim-reminder.ts). Dry run, nothing sent.',
      wouldRemind: candidates.length,
      candidates: preview,
    });
  }

  let reminded = 0;
  const results: Array<{ clinic: string; ok: boolean; kind: string; error?: string }> = [];
  for (const c of candidates) {
    const p = provMap.get(c.listing_id);
    if (!p || !c.email) {
      results.push({ clinic: p?.name || c.listing_id.slice(0, 8), ok: false, kind: 'skip', error: 'missing provider or email' });
      continue;
    }
    const expired = new Date(c.expires_at).getTime() < now;
    const verifyUrl = `${SITE_URL}/verify-claim?token=${c.token}`;
    const email = expired
      ? buildClaimRestart({ name: p.name, slug: p.slug, city: p.city }, c.owner_name)
      : buildClaimReminder({ name: p.name, slug: p.slug, city: p.city }, c.owner_name, verifyUrl);

    const res = await sendMail({
      from: 'TheDripMap <info@thedripmap.com>',
      to: c.email,
      replyTo: OPERATOR_EMAIL,
      subject: email.subject,
      text: email.text,
    });

    if (res.ok) {
      // Mark BEFORE moving on, scoped to this id + still-'pending' status so a
      // concurrent run cannot double-remind.
      await supabase
        .from('claim_requests')
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq('id', c.id)
        .eq('status', 'pending');
      reminded++;
    }
    results.push({ clinic: p.name, ok: res.ok, kind: expired ? 'restart' : 'reminder', error: res.error });
  }

  return NextResponse.json({ ok: true, reminded, results });
}
