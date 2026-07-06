/**
 * V2 redo emitter (2026-07-06). The 45 claim-outreach drafts created on
 * 2026-07-05/06 pre-date the booking-request feature; the pitch is now
 * "claim to receive your own booking requests". This emits fresh v2 payloads
 * for exactly that batch so the drafts can be recreated in the DripMap Gmail
 * (old ones get deleted there by the operator or a later session).
 *
 * Selector: outreach_sent=true, unclaimed, CA, and EITHER outreach_sent_at is
 * null (the 07-05 batches were flag-only) OR outreach_sent_at >= 2026-07-04.
 * Suppression guard consulted fresh (fail closed), bounced/replied excluded.
 * Writes .audit-tmp/_ca-v2-redo-payloads.json. Sends nothing, drafts nothing.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local'), override: true });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const PAY = path.join(__dirname, '..', '.audit-tmp', '_ca-v2-redo-payloads.json');

const CASL_FOOTER = `\n--\nTheDripMap | info@thedripmap.com | Caledon, Ontario, Canada\nYou're receiving this one-time note because your clinic is publicly listed as an IV therapy provider on our matching platform. If you'd rather not hear from us, reply 'unsubscribe' and you will never hear from us again.`;

function openerA(p) {
  const city = p.city || 'your area';
  const rating = Number(p.rating) || 0, rev = Number(p.reviews) || 0;
  if (rating >= 4 && rev >= 5) return `Your ${rating} rating across ${rev} Google reviews in ${city} stands out, you are clearly looking after the people who come in.`;
  const blob = `${p.name} ${p.description || ''} ${(p.specialties || []).join(' ')}`.toLowerCase();
  if (/mobile|in-home|concierge/.test(blob)) return `Mobile and in-home IV is exactly what a lot of ${city} patients search for, and not many clinics offer it.`;
  return `${city} keeps coming up when people search IV therapy near them, and ${p.name} is one of the names they find.`;
}
function bodyA(p) {
  const url = `https://www.thedripmap.com/providers/${p.slug}`;
  const claim = `${url}?claim=1`;
  const city = p.city || 'your area';
  return `Hi ${p.name} team,\n\n${openerA(p)}\n\nI run TheDripMap, the IV therapy matching platform for Canada. ${p.name} is already listed, and people searching IV therapy in ${city} are landing on this page right now:\n\n${url}\n\nNew on TheDripMap: patients can now send a booking request from your page. They pick a treatment and the times that work for them, and the request goes to the clinic. Because your listing is unclaimed, those requests currently come to our team instead of straight to you.\n\nClaiming your listing is free and takes about two minutes:\n\n${claim}\n\nOnce you verify, booking requests and patient messages land in your inbox and you just reply to confirm a time. We also fill in the page properly: your drips with your real prices, your team, your photos. Complete pages get noticeably more clicks than bare ones, we see it in our own data.\n\nIf you would rather we simply correct something on the listing, reply and tell me what to change. And if you want the listing removed, one reply does that too.\n\nWarmly,\nTheDripMap\ninfo@thedripmap.com\n${CASL_FOOTER}`;
}
const subjA = (p) => `Your ${p.city} clinic is already on TheDripMap`;

function openerB(p) {
  const city = p.city || 'your area';
  const rating = Number(p.rating) || 0, rev = Number(p.reviews) || 0;
  if (rating >= 4 && rev >= 5) return `Your ${rating} rating from ${rev} Google reviews already makes ${p.name} one of the clinics ${city} patients search for.`;
  const blob = `${p.name} ${p.description || ''} ${(p.specialties || []).join(' ')}`.toLowerCase();
  if (/mobile|in-home|concierge/.test(blob)) return `Mobile and in-home IV is exactly what a lot of ${city} patients search for, and ${p.name} offers it.`;
  if (/naturopath/.test(blob) || /\bn\.?d\.?\b|naturopath/i.test(p.name || '')) return `Naturopathic IV therapy is one of the things ${city} patients search for, and ${p.name} is one of the places they find it.`;
  return `When ${city} patients search IV therapy, ${p.name} is one of the clinics that comes up.`;
}
function bodyB(p) {
  const url = `https://www.thedripmap.com/providers/${p.slug}`;
  const claim = `${url}?claim=1`;
  return `Hi ${p.name} team,\n\n${openerB(p)} Here is the part worth ten seconds of your day: patients can now send a booking request from your TheDripMap page, they pick a treatment and the times that work. Because your listing is unclaimed, those requests reach our team instead of you.\n\nClaim it free in about two minutes and they land in your inbox instead, you just reply to confirm a time:\n\n${claim}\n\nWe also build out your page with your services, real prices, and team, so people stop clicking away to the next clinic.\n\nNot interested, or something to fix? Just reply, and one line removes the listing too.\n\nAdrianne Trenton\nTheDripMap\ninfo@thedripmap.com\n${CASL_FOOTER}`;
}
const subjB = (p) => `Quick one about ${p.name}'s listing on TheDripMap`;

(async () => {
  // Load the recent-outreach batch.
  const { data: rows, error } = await s
    .from('providers')
    .select('id,slug,name,city,state,country,rating,reviews,email,description,specialties,outreach_sent,outreach_sent_at,email_bounced,reply_category,is_hidden,is_claimed')
    .eq('outreach_sent', true)
    .neq('is_claimed', true)
    .eq('country', 'Canada')
    .or('outreach_sent_at.is.null,outreach_sent_at.gte.2026-07-04');
  if (error) { console.error('FATAL query:', error.message); process.exit(1); }

  // Fresh suppression guard, fail closed (both tables).
  const suppressed = new Set();
  for (const tbl of ['email_suppressions', 'outreach_suppressions']) {
    const { data, error: e2 } = await s.from(tbl).select('email').range(0, 4999);
    if (e2) { console.error(`FATAL: could not load ${tbl} — refusing to emit. ` + e2.message); process.exit(1); }
    for (const r of data || []) suppressed.add(String(r.email).toLowerCase().trim());
  }

  const list = rows.filter((r) =>
    !r.is_hidden && r.email && !r.email_bounced && r.reply_category !== 'not_interested' &&
    !suppressed.has(String(r.email).toLowerCase().trim()) && r.slug
  );
  console.log(`recent-outreach batch: ${rows.length} rows -> ${list.length} eligible for v2 redo`);
  const names = new Set(list.map((r) => r.name));
  for (const expect of ['JPD Wellness', 'Markham Integrative Medicine', 'Dynamic Drips']) {
    console.log(`  sanity, contains "${expect}":`, names.has(expect));
  }
  if (list.length < 30 || list.length > 60) {
    console.error(`ABORT: batch size ${list.length} outside expected 30-60 — selector drift, review before emitting.`);
    process.exit(1);
  }

  list.sort((a, b) => (a.city || '').localeCompare(b.city || '') || (a.name || '').localeCompare(b.name || ''));
  const payloads = list.map((p, i) => {
    const v = i % 2 === 0 ? 'A' : 'B';
    return {
      id: p.id, slug: p.slug, name: p.name, city: p.city, to: p.email, variant: v,
      subject: v === 'B' ? subjB(p) : subjA(p),
      body: v === 'B' ? bodyB(p) : bodyA(p),
    };
  });
  fs.writeFileSync(PAY, JSON.stringify(payloads, null, 1));
  console.log(`\nemitted ${payloads.length} v2 booking-led payloads -> ${PAY}`);
  console.log('Next: connect the DripMap Gmail, delete the old v1 drafts, create these as fresh drafts.');
  process.exit(0);
})().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
