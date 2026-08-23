/**
 * Reconcile emails sent by hand from Gmail back into the two-touch counter.
 *
 * WHY THIS EXISTS (2026-08-23): outreach that leaves through /admin/outreach
 * records itself (recordSentTouch). Outreach sent by hand from a Gmail draft
 * records nothing, so the counter silently under-counts and a clinic can be
 * emailed again. That happened the same day this was written: two follow-ups
 * went out in the morning and both providers still read followup_sent = null,
 * which put them straight back in the eligible pool.
 *
 * The real fix is to send from /admin/outreach. This is the safety net for
 * whatever still leaves by hand, and for the historical backlog.
 *
 * INPUT: a JSON file, an array of { email, sentAt, subject?, touch? }, produced
 * by reading the Gmail Sent folder. One entry per email actually sent.
 *
 * `touch` is 'first' or 'followup' and should be set whenever you know which
 * one a send was, because counting alone cannot tell you. Reading a one-week
 * window of Sent shows one email to a clinic, but that clinic may already have
 * had its first touch in June, so the send you are looking at is the second.
 * Without `touch` the script would see one send, see one recorded touch, and
 * conclude everything matched, leaving the follow-up unrecorded. That is
 * exactly the failure this script exists to catch.
 *
 * RULES, deliberately conservative:
 *   - only ever ADDS a touch, never clears one;
 *   - never pushes a provider past two touches;
 *   - if outreach_sent is already true and followup_sent is not, the record
 *     lands on followup_sent, matching how the cap is counted;
 *   - an existing timestamp is left alone, because the first send is the one
 *     that matters for cadence;
 *   - an address matching several listings (shared inbox) marks them all, since
 *     one email to that inbox is one conversation with that operator.
 *
 * Run: node scripts/reconcile-gmail-sends.cjs <sent.json> [--apply]
 *      (dry run by default; nothing is written without --apply)
 */
require('dotenv').config({ path: '.env.local', override: true });
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const [file] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const APPLY = process.argv.includes('--apply');
if (!file) {
  console.error('usage: node scripts/reconcile-gmail-sends.cjs <sent.json> [--apply]');
  process.exit(1);
}

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const records = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(records)) { console.error('input must be a JSON array'); process.exit(1); }

  // Earliest send per address: if we sent twice, the first is the first touch.
  const byEmail = new Map();
  for (const r of records) {
    const e = String(r.email || '').toLowerCase().trim();
    if (!e) continue;
    const at = r.sentAt ? new Date(r.sentAt).toISOString() : new Date().toISOString();
    const touch = r.touch === 'followup' || r.touch === 'first' ? r.touch : null;
    const cur = byEmail.get(e);
    if (!cur) byEmail.set(e, { first: at, last: at, count: 1, touches: new Set(touch ? [touch] : []) });
    else {
      cur.count++;
      if (at < cur.first) cur.first = at;
      if (at > cur.last) cur.last = at;
      if (touch) cur.touches.add(touch);
    }
  }
  console.log(`input: ${records.length} sends across ${byEmail.size} addresses`);

  let all = [], f = 0;
  for (;;) {
    const { data, error } = await s
      .from('providers')
      .select('id,slug,name,email,outreach_sent,outreach_sent_at,followup_sent,followup_sent_at')
      .range(f, f + 999);
    if (error) { console.error('READ FAIL', error.message); process.exit(1); }
    if (!data || !data.length) break;
    all = all.concat(data);
    if (data.length < 1000) break;
    f += 1000;
  }

  const index = new Map();
  for (const p of all) {
    const e = (p.email || '').toLowerCase().trim();
    if (!e) continue;
    if (!index.has(e)) index.set(e, []);
    index.get(e).push(p);
  }

  const planned = [];
  let unmatched = 0, alreadyOk = 0;
  for (const [email, info] of byEmail) {
    const rows = index.get(email);
    if (!rows) { unmatched++; continue; }
    for (const p of rows) {
      const touches = (p.outreach_sent ? 1 : 0) + (p.followup_sent ? 1 : 0);
      const patch = {};

      // An explicit touch label is authoritative: it says which of the two
      // sends this was, regardless of how many happen to fall in the window.
      if (info.touches.has('first') && !p.outreach_sent) {
        patch.outreach_sent = true;
        patch.outreach_sent_at = p.outreach_sent_at || info.first;
      }
      if (info.touches.has('followup') && !p.followup_sent) {
        patch.followup_sent = true;
        patch.followup_sent_at = p.followup_sent_at || info.last;
        // A follow-up implies a first touch happened, even if it was never
        // recorded. Backfill it rather than leave the cap under-counting.
        if (!p.outreach_sent) { patch.outreach_sent = true; patch.outreach_sent_at = p.outreach_sent_at || info.first; }
      }

      // No label: fall back to counting, which is only safe when the window
      // shows more sends than the row has recorded touches.
      if (!info.touches.size) {
        const observed = Math.min(info.count, 2);
        if (touches >= observed) { alreadyOk++; continue; }
        if (!p.outreach_sent) { patch.outreach_sent = true; patch.outreach_sent_at = p.outreach_sent_at || info.first; }
        if (observed >= 2 && !p.followup_sent) { patch.followup_sent = true; patch.followup_sent_at = p.followup_sent_at || info.last; }
      }

      if (!Object.keys(patch).length) { alreadyOk++; continue; }
      planned.push({ id: p.id, slug: p.slug, email, from: touches, to: touches + Object.keys(patch).filter((k) => k.endsWith('_sent')).length, patch });
    }
  }

  console.log(`matched and already correct : ${alreadyOk}`);
  console.log(`addresses with no listing   : ${unmatched}`);
  console.log(`NEEDS RECORDING             : ${planned.length}`);
  for (const x of planned.slice(0, 40)) console.log(`  ${x.slug}  ${x.from} -> ${x.to} touches  (${x.email})`);
  if (planned.length > 40) console.log(`  ... and ${planned.length - 40} more`);

  if (!planned.length) { console.log('\nNothing to reconcile. The counter matches what was sent.'); return; }
  if (!APPLY) { console.log('\nDry run. Re-run with --apply to write these.'); return; }

  let ok = 0, fail = 0;
  for (const x of planned) {
    const { error, count } = await s.from('providers').update(x.patch, { count: 'exact' }).eq('id', x.id);
    if (error || count !== 1) { fail++; console.error('  FAIL', x.slug, error ? error.message : `rows=${count}`); }
    else ok++;
  }
  console.log(`\napplied: ${ok} recorded, ${fail} failed.`);
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
