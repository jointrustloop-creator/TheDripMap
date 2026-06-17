// Autopilot cold-outreach engine.
//
// One compliant first-touch email per eligible Canadian clinic, sent in small
// batches inside business hours, behind a DB-backed kill switch that is
// re-read immediately before every individual send (fail closed). Every send
// is claimed in outbound_message_log BEFORE it goes out, so a double send is
// impossible even under concurrent cron runs.
//
// This module is self-contained on purpose: it carries its own approved
// Template A copy and CASL footer rather than importing outreach-templates.ts,
// so it stays compliant regardless of that file's state. No medical claims,
// no em/en dashes, "matching platform" never "directory".
//
// supabase is typed loosely (any) so callers can pass a service-role client
// without dragging in the generated Database type.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createHmac } from 'crypto';
import { sendMail } from './mailer';

export const SITE_URL = 'https://www.thedripmap.com';
export const FROM = 'TheDripMap <info@thedripmap.com>';
export const REPLY_TO = 'info@thedripmap.com';
export const KIND = 'autopilot_outreach';
export const TEMPLATE_ID = 'autopilot_a_v1';
export const BATCH_SIZE = 5;
export const DEFAULT_DAILY_CAP = 20;

export interface Candidate {
  id: string;
  name: string;
  slug: string;
  email: string;
  city: string | null;
  rating: number | null;
  reviews: number | string | null;
}

// ---------------------------------------------------------------------------
// Settings (DB-backed so the Telegram /start /stop commands take effect at
// runtime without a redeploy).
// ---------------------------------------------------------------------------
const SETTINGS = 'outreach_autopilot_settings';

// Fail CLOSED: any error, missing row, or anything other than an explicit
// 'true' returns false. The cron calls this immediately before every send.
export async function readEnabled(supabase: any): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from(SETTINGS).select('value').eq('key', 'outreach_autopilot_enabled').single();
    if (error || !data) return false;
    return String(data.value).trim().toLowerCase() === 'true';
  } catch {
    return false;
  }
}

export async function readDailyCap(supabase: any): Promise<number> {
  try {
    const { data } = await supabase
      .from(SETTINGS).select('value').eq('key', 'outreach_daily_cap').single();
    const n = Number(data?.value);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : DEFAULT_DAILY_CAP;
  } catch {
    return DEFAULT_DAILY_CAP;
  }
}

export async function setEnabled(supabase: any, on: boolean): Promise<void> {
  await supabase.from(SETTINGS).upsert(
    { key: 'outreach_autopilot_enabled', value: on ? 'true' : 'false', updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  );
}

// ---------------------------------------------------------------------------
// Time window: Mon to Fri, 09:00 to 17:00 America/Toronto. Computed from the
// real Toronto wall clock via Intl, so DST is handled without a tz library.
// ---------------------------------------------------------------------------
export function torontoParts(d: Date = new Date()) {
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto', weekday: 'short',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  const m: Record<string, string> = {};
  for (const p of f.formatToParts(d)) m[p.type] = p.value;
  return {
    weekday: m.weekday || '',
    hour: Number(m.hour) % 24,
    minute: Number(m.minute),
    second: Number(m.second),
  };
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
export function isBusinessDay(weekday: string): boolean {
  return WEEKDAYS.some((w) => weekday.startsWith(w));
}
export function isWithinWindow(d: Date = new Date()): boolean {
  const t = torontoParts(d);
  return isBusinessDay(t.weekday) && t.hour >= 9 && t.hour < 17;
}
// The 17:00 slot, just after the window closes, is where the daily summary
// fires (once: the :00 run, not the :30 one).
export function isSummarySlot(d: Date = new Date()): boolean {
  const t = torontoParts(d);
  return isBusinessDay(t.weekday) && t.hour === 17 && t.minute < 30;
}
// UTC instant of the most recent Toronto midnight (for "today's sends").
export function torontoDayStart(d: Date = new Date()): Date {
  const t = torontoParts(d);
  const msSinceMidnight = ((t.hour * 60 + t.minute) * 60 + t.second) * 1000 + d.getMilliseconds();
  return new Date(d.getTime() - msSinceMidnight);
}

// ---------------------------------------------------------------------------
// Validation + naming.
// ---------------------------------------------------------------------------
export function isValidEmail(e: string | null | undefined): boolean {
  return typeof e === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e.trim());
}
export function cleanName(n: string): string {
  return n.split(' - ')[0].split(' | ')[0].split(', A Division of')[0]
    .replace(/\s*\([^)]*\)/g, '').replace(/\s+IV (Hydration|Therapy).*$/i, '').trim();
}

// ---------------------------------------------------------------------------
// Unsubscribe link: signed so only a real recipient link can suppress, and the
// suppression is per the recipient's own address.
// ---------------------------------------------------------------------------
function unsubSecret(): string {
  return process.env.UNSUBSCRIBE_SECRET || process.env.CRON_SECRET || '';
}
export function unsubToken(email: string): string {
  const secret = unsubSecret();
  if (!secret) return '';
  return createHmac('sha256', secret).update(email.toLowerCase().trim()).digest('hex').slice(0, 32);
}
export function verifyUnsubToken(email: string, token: string): boolean {
  const expected = unsubToken(email);
  return !!expected && !!token && expected === token;
}
export function unsubscribeUrl(email: string): string {
  return `${SITE_URL}/unsubscribe?e=${encodeURIComponent(email)}&t=${unsubToken(email)}`;
}

// ---------------------------------------------------------------------------
// Email body: approved Template A. Mailing address + working unsubscribe in the
// CASL footer. "matching platform" never "directory". No em/en dashes.
// ---------------------------------------------------------------------------
function personalOpener(p: Candidate): string {
  const reviews = Number(p.reviews);
  const city = (p.city || '').trim() || 'your area';
  if (p.rating && Number.isFinite(reviews) && reviews >= 10) {
    return `Your ${p.rating} rating across ${reviews} Google reviews is one of the stronger ones we see for IV therapy in ${city}.\n\n`;
  }
  return '';
}

export function buildOutreachEmail(p: Candidate): { subject: string; text: string } {
  const display = cleanName(p.name);
  const city = (p.city || '').trim();
  const cityLabel = city || 'your area';
  const providerUrl = `${SITE_URL}/providers/${p.slug}`;
  const claimUrl = `${SITE_URL}/providers/${p.slug}?claim=1`;
  const unsub = unsubscribeUrl(p.email);

  const subject = city ? `Your ${city} clinic is already on TheDripMap` : `Your clinic is already on TheDripMap`;

  const text = `Hi ${display} team,

${personalOpener(p)}I run TheDripMap, the IV therapy matching platform for Canada and the US. ${display} is already listed, and people searching IV therapy in ${cityLabel} are landing on this page right now:

${providerUrl}

The listing is a bare placeholder. No photos, no prices, no team. Most people who land on a thin profile click away to the next clinic.

Claiming it is free and takes about two minutes:

${claimUrl}

Once you verify, we fill in the page properly: your logo, photos, your most popular drips with your real prices, who is on your team, and the answers patients actually search for. Clinics with complete pages get noticeably more clicks than bare ones, we see it in our own data.

If you would rather we simply correct something on the listing, reply and tell us what to change. And if you want the listing removed, one reply does that too.

Warmly,
TheDripMap Team
info@thedripmap.com

--
TheDripMap | info@thedripmap.com | Caledon, Ontario, Canada
You are receiving this one-time note because ${display} is publicly listed as an IV therapy provider on our matching platform. To stop hearing from us, unsubscribe here: ${unsub} or reply with the word unsubscribe.`;

  return { subject, text };
}

// ---------------------------------------------------------------------------
// Suppression.
// ---------------------------------------------------------------------------
export async function isSuppressed(supabase: any, email: string): Promise<boolean> {
  const { data } = await supabase
    .from('outreach_suppressions').select('email').ilike('email', email.trim()).limit(1);
  return !!(data && data.length);
}
export async function suppressEmail(supabase: any, email: string, source = 'unsubscribe_link'): Promise<void> {
  // Idempotent: a duplicate-key error (already suppressed) is fine to ignore.
  // Supabase returns the error in the result rather than throwing, so we just
  // do not act on it.
  await supabase.from('outreach_suppressions')
    .insert({ email: email.toLowerCase().trim(), reason: 'unsubscribed', source });
}

// ---------------------------------------------------------------------------
// Candidate selection: Canadian, valid email, unclaimed, not bounced/hidden/
// featured/unavailable, not suppressed, no prior outbound_message_log row.
// ---------------------------------------------------------------------------
async function loadSets(supabase: any) {
  const supp = new Set<string>();
  const { data: s } = await supabase.from('outreach_suppressions').select('email');
  (s || []).forEach((r: any) => supp.add(String(r.email || '').toLowerCase().trim()));

  const pids = new Set<string>();
  const emails = new Set<string>();
  let from = 0;
  while (true) {
    const { data } = await supabase.from('outbound_message_log').select('provider_id,to_email').range(from, from + 999);
    (data || []).forEach((r: any) => {
      if (r.provider_id) pids.add(r.provider_id);
      if (r.to_email) emails.add(String(r.to_email).toLowerCase().trim());
    });
    if (!data || data.length < 1000) break;
    from += 1000;
  }
  return { supp, pids, emails };
}

export async function selectCandidates(supabase: any, limit: number): Promise<Candidate[]> {
  const { supp, pids, emails } = await loadSets(supabase);
  const { data } = await supabase.from('providers')
    .select('id,name,slug,email,city,rating,reviews')
    .eq('country', 'Canada').eq('is_claimed', false).eq('is_featured', false)
    .neq('is_hidden', true).neq('email_bounced', true).neq('availability', false)
    .not('email', 'is', null).neq('email', '')
    .order('reviews', { ascending: false, nullsFirst: false })
    .limit(Math.max(limit * 6, 60));
  const out: Candidate[] = [];
  for (const p of data || []) {
    const e = String(p.email || '').toLowerCase().trim();
    if (!isValidEmail(p.email)) continue;
    if (supp.has(e)) continue;
    if (pids.has(p.id) || emails.has(e)) continue;
    out.push(p as Candidate);
    if (out.length >= limit) break;
  }
  return out;
}

export async function todaySentCount(supabase: any): Promise<number> {
  const { count } = await supabase.from('outbound_message_log')
    .select('id', { count: 'exact', head: true })
    .eq('kind', KIND).eq('status', 'sent')
    .gte('sent_at', torontoDayStart().toISOString());
  return count || 0;
}

// ---------------------------------------------------------------------------
// Claim-first send. Insert a pending row (unique provider_id index prevents a
// double claim), send, then confirm. On any send failure the row stays as
// 'failed' so the clinic is never retried: better to under-send than double
// send.
// ---------------------------------------------------------------------------
export async function claimAndSend(
  supabase: any, p: Candidate
): Promise<{ ok: boolean; skipped?: boolean; reason: string }> {
  const email = p.email.trim();
  const { subject, text } = buildOutreachEmail(p);

  const { error: claimErr } = await supabase.from('outbound_message_log').insert({
    provider_id: p.id, to_email: email, subject,
    kind: KIND, template_id: TEMPLATE_ID, status: 'pending', sent_at: new Date().toISOString(),
  });
  if (claimErr) {
    return { ok: false, skipped: true, reason: 'already_logged' };
  }

  const res = await sendMail({ from: FROM, to: email, replyTo: REPLY_TO, subject, text });

  await supabase.from('outbound_message_log').update({
    status: res.ok ? 'sent' : 'failed',
    message_id: res.id || null,
    body_preview: text.slice(0, 200),
  }).eq('provider_id', p.id);

  return res.ok ? { ok: true, reason: 'sent' } : { ok: false, reason: `send_failed:${res.error || 'unknown'}` };
}
