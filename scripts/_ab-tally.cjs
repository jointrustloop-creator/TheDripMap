/**
 * Outreach template tally.
 *
 * Reports, by template_id and by week, the sent count plus the cohort reply
 * and claim outcomes pulled from the providers attribution columns
 * (reply_received_at, claimed_at). Cohort attribution: a provider's reply or
 * claim counts toward the (template_id, week) of the earliest message they
 * received from that template in that week.
 *
 * Usage: node scripts/_ab-tally.cjs [weeks_back=8]
 */
require('dotenv').config({ path: '.env.local' });
const sb = require('@supabase/supabase-js').createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const WEEKS_BACK = Number(process.argv[2]) || 8;

function mondayOf(d) {
  const x = new Date(d);
  const day = (x.getUTCDay() + 6) % 7;
  x.setUTCDate(x.getUTCDate() - day);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}
function pct(n, d) {
  if (!d) return '   -  ';
  return ((n / d) * 100).toFixed(1).padStart(4) + '%';
}

(async () => {
  const cutoff = new Date(Date.now() - WEEKS_BACK * 7 * 86400 * 1000).toISOString();

  // Pull all outbound_message_log rows since cutoff. If template_id column
  // doesn't exist yet (migration hasn't been applied), tell the operator how
  // to fix and bail cleanly.
  const { data: logs, error: logsErr } = await sb
    .from('outbound_message_log')
    .select('id, provider_id, template_id, subject, sent_at')
    .gte('sent_at', cutoff)
    .order('sent_at', { ascending: true });
  if (logsErr) {
    if (/template_id/i.test(logsErr.message)) {
      console.error('template_id column missing on outbound_message_log.');
      console.error('Apply this migration in the Supabase SQL editor first:');
      console.error('  alter table outbound_message_log add column if not exists template_id text;');
      console.error('  alter table outbound_message_log add column if not exists body_preview text;');
      process.exit(1);
    }
    console.error('outbound_message_log read failed:', logsErr.message);
    process.exit(1);
  }
  console.log('Outbound rows in last ' + WEEKS_BACK + ' weeks: ' + (logs?.length || 0));
  console.log();

  if (!logs || logs.length === 0) {
    console.log('No data yet. Once daily-outreach + followup-outreach + queue-outreach-drafts run with the new instrumentation, rows will appear here.');
    return;
  }

  // Pull providers attribution columns for everyone in the logs
  const providerIds = Array.from(new Set(logs.map((l) => l.provider_id).filter(Boolean)));
  const { data: providers } = await sb
    .from('providers')
    .select('id, slug, name, city, state, country, reply_received_at, reply_category, is_claimed, claimed_at, email_bounced')
    .in('id', providerIds);
  const pById = new Map(providers.map((p) => [p.id, p]));

  // Group logs by (template_id, week_start)
  // For each group: cohort = unique provider_ids in that group; sent = total rows
  const groups = new Map();
  for (const l of logs) {
    const tpl = l.template_id || '(no_template_id)';
    const wk = mondayOf(l.sent_at).toISOString().slice(0, 10);
    const key = tpl + '|' + wk;
    if (!groups.has(key)) groups.set(key, { templateId: tpl, week: wk, sent: 0, providers: new Set(), earliestSentByProv: new Map() });
    const g = groups.get(key);
    g.sent++;
    g.providers.add(l.provider_id);
    const prev = g.earliestSentByProv.get(l.provider_id);
    if (!prev || new Date(l.sent_at) < new Date(prev)) {
      g.earliestSentByProv.set(l.provider_id, l.sent_at);
    }
  }

  // Compute reply / claim / bounce per group
  const rows = [];
  for (const g of groups.values()) {
    let replies = 0, interested = 0, claimed = 0, bounced = 0;
    for (const pid of g.providers) {
      const p = pById.get(pid);
      if (!p) continue;
      const earliestSent = g.earliestSentByProv.get(pid);
      if (p.reply_received_at && new Date(p.reply_received_at) >= new Date(earliestSent)) {
        replies++;
        if (p.reply_category === 'interested') interested++;
      }
      if (p.claimed_at && new Date(p.claimed_at) >= new Date(earliestSent)) {
        claimed++;
      }
      if (p.email_bounced) bounced++;
    }
    rows.push({
      templateId: g.templateId,
      week: g.week,
      sent: g.sent,
      uniqProviders: g.providers.size,
      replies,
      interested,
      claimed,
      bounced,
    });
  }

  rows.sort((a, b) => {
    if (a.week !== b.week) return a.week.localeCompare(b.week);
    return a.templateId.localeCompare(b.templateId);
  });

  // Print
  console.log('=== Per (template_id, week) tally ===');
  console.log('  week_start  template_id                    sent  uniq  reply  rep%   int   claim  cl%    bounce');
  for (const r of rows) {
    console.log(
      '  ' + r.week +
      '  ' + r.templateId.padEnd(32) +
      String(r.sent).padStart(4) +
      '  ' + String(r.uniqProviders).padStart(4) +
      '  ' + String(r.replies).padStart(5) +
      '  ' + pct(r.replies, r.uniqProviders) +
      '  ' + String(r.interested).padStart(4) +
      '  ' + String(r.claimed).padStart(5) +
      '  ' + pct(r.claimed, r.uniqProviders) +
      '  ' + String(r.bounced).padStart(6)
    );
  }
  console.log();

  // Aggregate by template (lifetime in window)
  const byTpl = new Map();
  for (const r of rows) {
    if (!byTpl.has(r.templateId)) byTpl.set(r.templateId, { sent: 0, uniq: 0, replies: 0, interested: 0, claimed: 0, bounced: 0 });
    const a = byTpl.get(r.templateId);
    a.sent += r.sent;
    a.uniq += r.uniqProviders;
    a.replies += r.replies;
    a.interested += r.interested;
    a.claimed += r.claimed;
    a.bounced += r.bounced;
  }
  console.log('=== Rollup by template_id (last ' + WEEKS_BACK + ' weeks) ===');
  console.log('  template_id                       sent  uniq  reply  rep%   int   claim  cl%    bounce');
  const tplRows = Array.from(byTpl.entries()).sort((a, b) => b[1].sent - a[1].sent);
  for (const [tpl, a] of tplRows) {
    console.log(
      '  ' + tpl.padEnd(32) +
      '  ' + String(a.sent).padStart(4) +
      '  ' + String(a.uniq).padStart(4) +
      '  ' + String(a.replies).padStart(5) +
      '  ' + pct(a.replies, a.uniq) +
      '  ' + String(a.interested).padStart(4) +
      '  ' + String(a.claimed).padStart(5) +
      '  ' + pct(a.claimed, a.uniq) +
      '  ' + String(a.bounced).padStart(6)
    );
  }
  console.log();
  console.log('Notes:');
  console.log('  uniq = unique providers that received a message in that (template, week) cohort');
  console.log('  reply rate / claim rate use uniq as the denominator');
  console.log('  cohort attribution: a provider only counts toward the cohort of their earliest message in that week and template');
  console.log('  bounce reflects providers whose email is currently flagged bounced (not necessarily this cohort\'s send)');
})();
