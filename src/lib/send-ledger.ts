/**
 * Outreach send ledger for the admin home: how many emails left, per day and
 * per stream, from email_send_log (the audit row every send path writes).
 * Operator asked 2026-09-12: "how many outreach emails did we send out today
 * and yesterday? can we make this visible somewhere".
 */
import type { SupabaseClient } from '@supabase/supabase-js';

export interface SendDay {
  day: string; // YYYY-MM-DD, Toronto date
  cold: number;      // Part B cold outreach (admin button or daily cron)
  warm: number;      // warm "we built your profile"
  nudge: number;     // owner finish-your-listing nudge
  newsletter: number;
  replies: number;   // one-off operator replies via send-mail
  tests: number;     // [TEST] copies to the operator (not counted in total)
  total: number;
}

function torontoDay(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });
}

function streamOf(channel: string, note: string): keyof Omit<SendDay, 'day' | 'total'> {
  const n = note.toLowerCase();
  if (channel === 'newsletter') return 'newsletter';
  if (channel === 'finish_nudge') return 'nudge';
  if (n.includes('warm_outreach')) return 'warm';
  if (n.includes('operator reply')) return 'replies';
  return 'cold';
}

export async function sendLedger(sb: SupabaseClient, days = 7): Promise<SendDay[]> {
  const since = new Date(Date.now() - days * 864e5).toISOString();
  const { data, error } = await sb
    .from('email_send_log')
    .select('created_at, channel, action, recipient_count, note')
    .gte('created_at', since)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  const byDay = new Map<string, SendDay>();
  for (const r of data as Array<{ created_at: string; channel: string; action: string; recipient_count: number | null; note: string | null }>) {
    const day = torontoDay(r.created_at);
    const row = byDay.get(day) || { day, cold: 0, warm: 0, nudge: 0, newsletter: 0, replies: 0, tests: 0, total: 0 };
    const n = r.recipient_count || 0;
    if (r.action === 'test') row.tests += n;
    else { row[streamOf(r.channel, r.note || '')] += n; row.total += n; }
    byDay.set(day, row);
  }
  return [...byDay.values()].sort((a, b) => (a.day < b.day ? 1 : -1));
}
