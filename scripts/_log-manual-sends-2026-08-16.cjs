/**
 * Log the 10 hand-sent emails of 2026-08-16 into contact tracking.
 *
 * These went out from info@thedripmap.com via the Gmail API directly: not the
 * Resend mailer, not the drafts flow. Nothing recorded them, so automation had
 * no way to see that these clinics have an open conversation, and each
 * listing's contact history was missing a real touch.
 *
 * WHAT THIS DOES NOT DO: it never sets providers.outreach_sent or
 * followup_sent. Those two fields ARE the two-touch cold-outreach cap
 * (src/lib/partb-outreach.ts). Badge renewals are compliance/relationship mail
 * and the lead forward is transactional, so neither may consume a cold touch.
 * Every row is written with counts_toward_cap = false.
 *
 * Column tolerance: channel/campaign/counts_toward_cap arrive with
 * scripts/sql/add-contact-log-campaign-fields.sql. Until that is pasted the
 * script falls back to the existing kind/template_id columns and the SQL file
 * backfills the real ones. Probing uses a REAL select (a head-count probe
 * returns no error against a missing column/table).
 *
 * Idempotent: re-running matches on (message_id, provider_id) and skips.
 *
 * Run:  node scripts/_log-manual-sends-2026-08-16.cjs --dry
 *       node scripts/_log-manual-sends-2026-08-16.cjs
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const DRY = process.argv.includes('--dry');
const SENT_AT = '2026-08-16T11:57:00.000Z';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

// Real Gmail message ids, read back from the Sent folder of info@thedripmap.com.
const SENDS = [
  {
    messageId: '1a00a6cf1cee12d7',
    email: 'info@dripclub.ca',
    slugs: ['drip-club-toronto'],
    subject: 'A patient is trying to reach Drip Club through TheDripMap',
    campaign: 'lead_forward',
    note: 'Transactional: patient lead forward (Irene Dubelt) plus claim pitch. Does not count against the two-touch marketing cap.',
  },
  {
    messageId: '1a00a6d563c37983',
    email: 'info@kneadtherapy.ca',
    slugs: ['knead-therapy-clinic-nanaimo'],
    subject: 'Keeping your Safety Verified badge current: one registration number',
    campaign: 'badge_renewal_aug2026',
  },
  {
    messageId: '1a00a6d95f3365b6',
    email: 'hello@alliesintegrated.health',
    slugs: ['allies-integrated-health-victoria'],
    subject: 'Keeping your Safety Verified badge current: 3 quick facts',
    campaign: 'badge_renewal_aug2026',
  },
  {
    messageId: '1a00a6dd6a1854be',
    email: 'info@baywellnesscentre.com',
    slugs: ['bay-wellness-centre-vancouver'],
    subject: 'Keeping your Safety Verified badge current: 3 quick facts',
    campaign: 'badge_renewal_aug2026',
  },
  {
    messageId: '1a00a6e179ab4f33',
    email: 'admin@trihealth.ca',
    slugs: ['tri-health-wellness-centre-vaughan'],
    subject: 'Keeping your Safety Verified badge current: one registration number',
    campaign: 'badge_renewal_aug2026',
  },
  {
    messageId: '1a00a6e58ce6453e',
    email: 'drsmobiletherapy@gmail.com',
    slugs: ['drs-mobile-therapy-brampton'],
    subject: 'Keeping your Safety Verified badge current: 3 quick facts',
    campaign: 'badge_renewal_aug2026',
  },
  {
    messageId: '1a00a6e9d9c09403',
    email: 'erinmillshealth@bellnet.ca',
    slugs: ['erin-mills-optimum-health-mississauga'],
    subject: 'Keeping your Safety Verified badge current: 3 quick facts',
    campaign: 'badge_renewal_aug2026',
  },
  {
    messageId: '1a00a6ee088d1b64',
    email: 'info@aafiyataesthetics.com',
    slugs: ['aafiyat-aesthetics-mississauga'],
    subject: 'Keeping your Safety Verified badge current: 3 quick facts',
    campaign: 'badge_renewal_aug2026',
  },
  {
    // ONE email to a shared inbox covering BOTH Signature Beauty listings, so it
    // is logged against each listing with the same message id.
    messageId: '1a00a6f3132ce6b9',
    email: 'info@signaturebeautylounge.ca',
    slugs: ['signature-beauty-lounge-downtown-toronto', 'signature-beauty-lounge-richmond-hill'],
    subject: 'Your Safety Verified badge needs 3 quick facts to display again',
    campaign: 'badge_renewal_aug2026',
    note: 'Badge restore ask (Eva). One email, both listings.',
  },
];

// Send #2 went to the PATIENT, not a clinic: it must never enter clinic contact
// tracking. It is reconciled against the inquiries row instead.
const PATIENT_REPLY = {
  messageId: '1a00a6d188d50f58',
  email: 'everyprosperity@yahoo.ca',
  subject: 'Your inquiry about Drip Club on TheDripMap',
};

async function hasColumn(table, col) {
  const { error } = await sb.from(table).select(col).limit(1);
  return !error;
}

async function main() {
  const rich = await hasColumn('outbound_message_log', 'campaign');
  console.log(rich
    ? 'Schema: campaign/channel/counts_toward_cap present, writing full shape.'
    : 'Schema: campaign columns NOT present yet, writing kind/template_id fallback (SQL file backfills).');

  // Resolve slugs -> provider ids in one query.
  const allSlugs = SENDS.flatMap((s) => s.slugs);
  const { data: provs, error: provErr } = await sb
    .from('providers')
    .select('id,slug,name,email,is_claimed,outreach_sent,followup_sent')
    .in('slug', allSlugs);
  if (provErr) throw new Error('provider lookup failed: ' + provErr.message);
  const bySlug = new Map((provs || []).map((p) => [p.slug, p]));
  const missing = allSlugs.filter((s) => !bySlug.has(s));
  if (missing.length) throw new Error('slugs not found: ' + missing.join(', '));

  // Existing rows, for idempotency.
  const { data: existing, error: exErr } = await sb
    .from('outbound_message_log')
    .select('message_id,provider_id')
    .in('message_id', SENDS.map((s) => s.messageId));
  if (exErr) throw new Error('existing-row check failed: ' + exErr.message);
  const seen = new Set((existing || []).map((r) => `${r.message_id}|${r.provider_id}`));

  const rows = [];
  for (const s of SENDS) {
    s.slugs.forEach((slug, i) => {
      const p = bySlug.get(slug);
      // outbound_message_log.message_id is UNIQUE (one row per email). Eva's
      // single email covers TWO Signature Beauty listings and each listing must
      // show it in its own contact history, so extra listings get a composite
      // key '<gmailId>+<slug>'. The real Gmail id is always the part before '+'.
      const rowMessageId = i === 0 ? s.messageId : `${s.messageId}+${slug}`;
      if (seen.has(`${rowMessageId}|${p.id}`) || seen.has(`${s.messageId}|${p.id}`)) {
        console.log(`  skip (already logged) ${slug}`);
        return;
      }
      const base = {
        message_id: rowMessageId,
        provider_id: p.id,
        to_email: s.email,
        subject: s.subject,
        sent_at: SENT_AT,
        body_preview: s.note || (s.campaign === 'badge_renewal_aug2026'
          ? 'Badge renewal: asked for prescriber name, credential and registration number.'
          : null),
      };
      // Fallback shape uses template_id only. `kind` carries a CHECK constraint
      // whose vocabulary this batch does not belong to (every existing row is
      // null), so writing a campaign name there is rejected by the database.
      rows.push(rich
        ? { ...base, channel: 'gmail_manual', campaign: s.campaign, counts_toward_cap: false }
        : { ...base, template_id: `gmail_manual:${s.campaign}` });
    });
  }

  if (DRY) {
    console.log(`\n[dry run] would insert ${rows.length} contact-log rows:`);
    for (const r of rows) console.log('   ', r.to_email, '->', r.provider_id, r.campaign || r.kind);
    console.log('[dry run] no writes.');
    return;
  }

  if (rows.length) {
    const { error } = await sb.from('outbound_message_log').insert(rows);
    if (error) throw new Error('contact-log insert failed: ' + error.message);
    console.log(`Logged ${rows.length} contact-history rows.`);
  } else {
    console.log('Nothing new to log.');
  }

  // Batch-level audit row (mirrors what the send-gate writes for Resend batches).
  const { data: already } = await sb
    .from('email_send_log')
    .select('id')
    .eq('note', 'manual-gmail-batch-2026-08-16')
    .limit(1);
  if (!already || already.length === 0) {
    const payload = {
      channel: 'gmail_manual',
      action: 'send',
      actor: 'operator',
      recipient_count: 10,
      recipients: [...SENDS.map((s) => s.email), PATIENT_REPLY.email],
      subject: 'Badge renewal batch + patient lead forward (hand-sent via Gmail API)',
      note: 'manual-gmail-batch-2026-08-16',
    };
    if (await hasColumn('email_send_log', 'campaign')) payload.campaign = 'badge_renewal_aug2026';
    const { error } = await sb.from('email_send_log').insert(payload);
    if (error) console.error('  email_send_log insert failed:', error.message);
    else console.log('Wrote batch audit row to email_send_log.');
  } else {
    console.log('Batch audit row already present.');
  }

  // Patient reply: mark the Drip Club inquiry handled. No clinic-tracking row.
  const dripClub = bySlug.get('drip-club-toronto');
  const { data: inqs, error: inqErr } = await sb
    .from('inquiries')
    .select('id,listing_id,email,forwarded_to_clinic_at,forward_status')
    .eq('listing_id', dripClub.id)
    .eq('email', PATIENT_REPLY.email);
  if (inqErr) {
    console.error('  inquiry lookup failed:', inqErr.message);
  } else if (!inqs || inqs.length === 0) {
    console.log('  no matching Drip Club inquiry row found for the patient (nothing to reconcile).');
  } else {
    for (const inq of inqs) {
      if (inq.forwarded_to_clinic_at) { console.log(`  inquiry ${inq.id} already marked forwarded.`); continue; }
      const { error } = await sb
        .from('inquiries')
        .update({
          forwarded_to_clinic_at: SENT_AT,
          forwarded_to_clinic_email: 'info@dripclub.ca',
          forward_status: 'manual_gmail_2026-08-16',
        })
        .eq('id', inq.id);
      if (error) console.error('  inquiry update failed:', error.message);
      else console.log(`  inquiry ${inq.id} marked forwarded to the clinic + patient acknowledged.`);
    }
  }

  // Safety assertion: logging must never have consumed a cold-outreach touch.
  const { data: after } = await sb
    .from('providers')
    .select('slug,outreach_sent,followup_sent')
    .in('slug', allSlugs);
  const changed = (after || []).filter((p) => {
    const before = bySlug.get(p.slug);
    return before.outreach_sent !== p.outreach_sent || before.followup_sent !== p.followup_sent;
  });
  console.log(changed.length === 0
    ? 'Cap check OK: no provider outreach_sent/followup_sent value was modified.'
    : `CAP WARNING: ${changed.length} providers changed touch state: ${changed.map((c) => c.slug).join(', ')}`);
}

main().catch((e) => { console.error('ERR', e.message); process.exit(1); });
