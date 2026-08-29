#!/usr/bin/env node
/**
 * Lead engine v1 draft builder (PLAN-3, 2026-08-28). DRAFTS ONLY — sends nothing.
 *
 *  A) UNCLAIMED-LEAD NUDGES: unclaimed clinics whose listing received a real
 *     patient inquiry in the last 30 days get a "a patient tried to reach you"
 *     claim nudge. This is the strongest claim trigger we have (a real patient,
 *     not a pitch).
 *  B) CLAIMED BACKLOG RELAYS: claimed clinics with inquiries from the last 30
 *     days that were never auto-forwarded (bounced email, opted out, pre-launch
 *     leads) get a manual relay draft so no captured patient goes undelivered.
 *
 * GUARDS (all fail CLOSED):
 *  - BOTH suppression tables checked (email_suppressions + outreach_suppressions);
 *    a query error excludes the clinic rather than including it.
 *  - email_bounced=true excluded; reply_category=not_interested excluded.
 *  - Two-touch cold cap for (A): a clinic that already got outreach + follow-up
 *    is NOT emailed a third cold time. The nudge COUNTS as a touch, so it only
 *    goes to clinics with at most one prior touch.
 *  - FORMAT-REVIEW RULE: the nudge copy in (A) is a NEW format. Before the
 *    first real send, one [TEST] copy goes to info@ with the operator cc'd.
 *    The output file marks this loudly.
 *
 * Output: .audit-tmp/_lead-drafts.json + .audit-tmp/_lead-drafts-preview.txt
 * Run: node scripts/_lead-drafts.cjs
 */
require('dotenv').config({ path: '.env.local', quiet: true });
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');


// House-design HTML (approved 2026-08-23): white card, green button, no raw
// URLs in the body. Self-contained copy for this operator script (.cjs cannot
// import the TS renderer in src/lib/lead-forward.ts).
const FONT = "-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function houseHtml({ greeting, paras, buttonLabel, buttonUrl, footerLine, email }) {
  const p = (t) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#3D4F49;">${esc(t)}</p>`;
  const unsub = `https://www.thedripmap.com/api/newsletter/unsubscribe/${encodeURIComponent(email)}`;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"></head>`
    + `<body style="margin:0;padding:0;background-color:#F4F7F5;">`
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F7F5;"><tr><td align="center" style="padding:32px 16px;">`
    + `<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">`
    + `<tr><td style="padding:0 8px 18px;"><img src="https://www.thedripmap.com/logo.png" alt="TheDripMap" width="150" style="display:block;border:0;max-width:150px;height:auto;"></td></tr>`
    + `<tr><td style="background-color:#FFFFFF;border-radius:16px;padding:36px 40px;font-family:${FONT};">`
    + `<p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#1A2B26;">${esc(greeting)}</p>`
    + paras.map(p).join('')
    + `<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:16px auto 0;"><tr><td align="center" style="background-color:#0F6E56;border-radius:10px;">`
    + `<a href="${buttonUrl}" style="display:inline-block;padding:14px 34px;font-size:15px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:10px;">${esc(buttonLabel)}</a>`
    + `</td></tr></table>`
    + `<p style="margin:12px 0 28px;text-align:center;font-size:12.5px;color:#6E837B;">Free, takes about two minutes</p>`
    + `<p style="margin:0;font-size:15px;color:#3D4F49;">Warm regards,</p>`
    + `<p style="margin:4px 0 0;font-size:15px;line-height:1.5;color:#1A2B26;"><strong>Deborah</strong><br><span style="font-size:13.5px;color:#6E837B;">Founder, TheDripMap</span><br><a href="https://www.thedripmap.com" style="font-size:13.5px;color:#0F6E56;text-decoration:none;">thedripmap.com</a></p>`
    + `</td></tr>`
    + `<tr><td style="padding:22px 24px 0;font-size:12px;line-height:1.6;color:#8A9C94;text-align:center;font-family:${FONT};">`
    + `${esc(footerLine)}<br>TheDripMap, Caledon, Ontario, Canada &nbsp;&middot;&nbsp; <a href="${unsub}" style="color:#8A9C94;text-decoration:underline;">Unsubscribe</a>`
    + `</td></tr>`
    + `</table></td></tr></table></body></html>`;
}

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const DAYS = 30;

async function isSuppressed(email) {
  const lower = String(email || '').toLowerCase().trim();
  if (!lower) return true;
  try {
    const [a, b] = await Promise.all([
      sb.from('email_suppressions').select('email').eq('email', lower).maybeSingle(),
      sb.from('outreach_suppressions').select('email').eq('email', lower).maybeSingle(),
    ]);
    if (a.error || b.error) return true; // fail closed
    return Boolean(a.data || b.data);
  } catch {
    return true; // fail closed
  }
}

function nudgeDraft(p, inquiryCount, newestAt) {
  const when = new Date(newestAt).toLocaleDateString('en-CA', { month: 'long', day: 'numeric' });
  return {
    to: p.email,
    subject: `A patient tried to reach ${p.name} through TheDripMap`,
    body: `Hi ${p.name} team,

On ${when}, a patient browsing IV therapy clinics in ${p.city} sent a message to your listing on TheDripMap. Because the listing is not yet claimed, the message is waiting with us instead of in your inbox.

Claiming is free and takes about two minutes. Once claimed, patient messages go straight to you and the patient can reply to you directly:

https://www.thedripmap.com/for-clinics

If you would rather we pass this patient's message along without claiming, just reply to this email and we will forward it.

Warm regards,
Deborah
TheDripMap
https://www.thedripmap.com

If you do not want to hear from us again, reply with the word UNSUBSCRIBE.`,
    html: houseHtml({
      greeting: `Hi ${p.name} team,`,
      paras: [
        `On ${when}, a patient browsing IV therapy clinics in ${p.city} sent a message to your listing on TheDripMap. Because the listing is not yet claimed, the message is waiting with us instead of in your inbox.`,
        `Claiming is free and takes about two minutes. Once claimed, patient messages go straight to you and the patient can reply to you directly.`,
        `If you would rather we pass this patient's message along without claiming, just reply to this email and we will forward it.`,
      ],
      buttonLabel: 'Claim your free listing',
      buttonUrl: 'https://www.thedripmap.com/for-clinics',
      footerLine: `You are receiving this because ${p.name} is listed on TheDripMap, the Canadian IV therapy matching platform.`,
      email: p.email,
    }),
    meta: { providerId: p.id, inquiries: inquiryCount },
  };
}

function relayDraft(p, inq) {
  return {
    to: p.email,
    subject: `Patient message waiting for ${p.name} (via TheDripMap)`,
    body: `Hi ${p.name} team,

A patient sent your clinic this message through your TheDripMap listing and it has not reached your inbox yet, so we are passing it along by hand:

From: ${inq.name} <${inq.email}>${inq.phone ? `\nPhone: ${inq.phone}` : ''}
Sent: ${String(inq.created_at).slice(0, 10)}

"${String(inq.message).replace(/^\[[^\]]*\]\s*/, '')}"

You can reply to the patient directly at ${inq.email}.

Warm regards,
Deborah
TheDripMap
https://www.thedripmap.com`,
    meta: { providerId: p.id, inquiryId: inq.id },
  };
}

(async () => {
  const sinceIso = new Date(Date.now() - DAYS * 24 * 3600e3).toISOString();
  const { data: inqs, error } = await sb
    .from('inquiries')
    .select('id, name, email, phone, message, created_at, listing_id, forward_status')
    .gte('created_at', sinceIso)
    .not('listing_id', 'is', null)
    .order('created_at', { ascending: false });
  if (error) throw error;

  const byListing = new Map();
  for (const q of inqs || []) {
    if (!byListing.has(q.listing_id)) byListing.set(q.listing_id, []);
    byListing.get(q.listing_id).push(q);
  }
  if (!byListing.size) {
    console.log(`No inquiries in the last ${DAYS} days. Nothing to draft.`);
    return;
  }

  const { data: provs } = await sb
    .from('providers')
    .select('id, name, city, email, is_claimed, is_hidden, email_bounced, reply_category, outreach_sent, followup_sent')
    .in('id', [...byListing.keys()]);

  const nudges = [];
  const relays = [];
  const skipped = [];
  for (const p of provs || []) {
    const qs = byListing.get(p.id) || [];
    const reason = (r) => skipped.push(`${p.name}: ${r}`);
    if (p.is_hidden) { reason('hidden'); continue; }
    if (!p.email) { reason('no email'); continue; }
    if (p.email_bounced) { reason('bounced'); continue; }
    // ANY recorded reply means a human conversation exists. A templated nudge
    // into a live thread reads as spam; handle those personally instead.
    if (p.reply_category) { reason(`already replied (${p.reply_category}) — handle personally, not templated`); continue; }
    if (await isSuppressed(p.email)) { reason('suppressed (or check failed — fail closed)'); continue; }

    if (!p.is_claimed) {
      // Two-touch cold cap: outreach + follow-up already used both slots.
      if (p.outreach_sent && p.followup_sent) { reason('two-touch cap reached'); continue; }
      nudges.push(nudgeDraft(p, qs.length, qs[0].created_at));
    } else {
      for (const q of qs) {
        if (q.forward_status === 'sent') continue; // already delivered
        relays.push(relayDraft(p, q));
      }
    }
  }

  const out = {
    generatedAt: new Date().toISOString(),
    FORMAT_REVIEW:
      'The unclaimed-nudge copy is a NEW email format. Per the standing rule, send ONE [TEST] to info@thedripmap.com cc hubertzyworonek BEFORE the first real send. The relay format reuses the approved manual-relay style.',
    unclaimedNudges: nudges,
    claimedBacklogRelays: relays,
    skipped,
  };
  fs.mkdirSync('.audit-tmp', { recursive: true });
  fs.writeFileSync('.audit-tmp/_lead-drafts.json', JSON.stringify(out, null, 2));
  const preview = [
    `Lead drafts — ${out.generatedAt}`,
    `Unclaimed nudges: ${nudges.length} | Claimed backlog relays: ${relays.length} | Skipped: ${skipped.length}`,
    '',
    ...nudges.flatMap((d) => [`=== NUDGE -> ${d.to} ===`, `Subject: ${d.subject}`, d.body, '']),
    ...relays.flatMap((d) => [`=== RELAY -> ${d.to} ===`, `Subject: ${d.subject}`, d.body, '']),
    'SKIPPED:',
    ...skipped.map((s) => `  - ${s}`),
  ].join('\n');
  fs.writeFileSync('.audit-tmp/_lead-drafts-preview.txt', preview);
  console.log(`Nudges: ${nudges.length}, relays: ${relays.length}, skipped: ${skipped.length}.`);
  console.log('Wrote .audit-tmp/_lead-drafts.json and _lead-drafts-preview.txt');
  if (nudges.length) console.log('REMINDER: nudge copy needs the one-time [TEST] format review before first real send.');
})();
