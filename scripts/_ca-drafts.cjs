/**
 * Build the not-yet-emailed Canadian list + prepare N claim-your-listing drafts.
 *
 * A/B TEST (added 2026-06-24): each draft is assigned a variant, alternating:
 *   A = control  — the original generic template (signed "TheDripMap")
 *   B = treatment — personalized opener + tighter body, signed by Adrianne Trenton
 * The chosen variant is recorded in providers.decision_drivers.outreach_variant
 * so conversion can be compared later (node scripts/_ca-ab-report.cjs).
 * Drafts only; the operator sends. Run _ca-ab-report.cjs to read the experiment.
 *
 *   node scripts/_ca-drafts.cjs            # DRY: list + a sample of A and B
 *   node scripts/_ca-drafts.cjs emit 20    # write payloads (with variant) for the MCP draft path
 *   node scripts/_ca-drafts.cjs apply 20   # create drafts via IMAP + mark + record variant
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local'), override: true });
const fs = require('fs');
const path = require('path');
const { ImapFlow } = require('imapflow');
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY = process.argv[2] === 'apply';
const N = parseInt(process.argv[3] || '20', 10);
const LIST = path.join(__dirname, '..', '.audit-tmp', '_ca-not-emailed-list.json');
const PAY = path.join(__dirname, '..', '.audit-tmp', '_ca-draft-payloads.json');

const CAabbr = new Set(['on', 'bc', 'ab', 'qc', 'mb', 'sk', 'ns', 'nb', 'nl', 'pe', 'nt', 'yt', 'nu']);
const CAname = new Set(['ontario', 'british columbia', 'alberta', 'quebec', 'manitoba', 'saskatchewan', 'nova scotia', 'new brunswick', 'newfoundland and labrador', 'newfoundland', 'prince edward island', 'northwest territories', 'yukon', 'nunavut']);
const isCA = (r) => { const c = (r.country || '').trim().toLowerCase(); if (/^(ca|can|canada)$/.test(c)) return true; if (/^(us|usa|united states.*)$/.test(c)) return false; const st = (r.state || '').trim().toLowerCase(); return CAabbr.has(st) || CAname.has(st); };
const has = (v) => v !== null && v !== undefined && String(v).trim() !== '';
// Reject scrape artifacts that slipped into the email field: image/asset
// filenames (fancybox_loading@2x.gif), and known non-clinic domains (the site's
// web-design agency, builders, error trackers). Prevents emailing junk/wrong people.
const validEmail = (e) => {
  e = (e || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(e)) return false;
  if (/\.(gif|png|jpe?g|svg|webp|css|js|ico|mp4|woff2?)$/.test(e)) return false;
  if (/@\dx\.|loading@|sprite|placeholder|@example\./.test(e)) return false;
  if (/@(stagheaddesigns|wixpress|sentry\.|godaddy|squarespace|cloudflare|domain|yourdomain|email|website)\./.test(e)) return false;
  return true;
};

// Intent score: email the clinics most likely to care about (and claim) an IV
// listing FIRST. A reputation-conscious, IV-focused clinic in a high-search city
// converts better than a small-town naturopath who does IV on the side. Used to
// order the not-emailed queue (was newest-first). Independent of the A/B split,
// so both variants still get a balanced mix across the intent range.
const BIG_CITY = /\b(toronto|vancouver|calgary|ottawa|montreal|edmonton|mississauga|winnipeg|hamilton|brampton|surrey|markham|vaughan|north york|scarborough|etobicoke|burlington|richmond hill|laval|halifax|london|kitchener|windsor|oakville|burnaby|saskatoon|regina|kelowna)\b/;
function intentScore(p) {
  let sc = 0;
  const rating = Number(p.rating) || 0, rev = Number(p.reviews) || 0;
  if (rating >= 4 && rev >= 5) sc += 30;                 // a reputation to protect/showcase
  sc += Math.min(20, rev / 5);                            // busier = more established (cap 20)
  const name = (p.name || '').toLowerCase();
  const blob = `${name} ${p.description || ''} ${(p.specialties || []).join(' ')}`.toLowerCase();
  if (/\biv\b|drip|infusion|hydration|wellness/.test(name)) sc += 18; // IV/wellness IS their identity
  else if (/\biv\b|drip|infusion/.test(blob)) sc += 8;   // IV is at least a named service
  if (/mobile|concierge|in-home/.test(blob)) sc += 8;     // growth-minded
  if (BIG_CITY.test((p.city || '').toLowerCase())) sc += 12; // more local search volume = more value to them
  return Math.round(sc);
}
const CASL_FOOTER = `\n--\nTheDripMap | info@thedripmap.com | Caledon, Ontario, Canada\nYou're receiving this one-time note because your clinic is publicly listed as an IV therapy provider on our matching platform. If you'd rather not hear from us, reply 'unsubscribe' and you will never hear from us again.`;

// ---------- VARIANT A (control: original template, signed TheDripMap) ----------
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
  return `Hi ${p.name} team,\n\n${openerA(p)}\n\nI run TheDripMap, the IV therapy matching platform for Canada and the US. ${p.name} is already listed, and people searching IV therapy in ${city} are landing on this page right now:\n\n${url}\n\nThe listing is a bare placeholder. No photos, no prices, no team. Most people who land on a thin profile click away to the next clinic.\n\nClaiming it is free and takes about two minutes:\n\n${claim}\n\nOnce you verify, we fill in the page properly: your logo, photos, your most popular drips with your real prices, who is on your team, and the answers patients actually search for. Clinics with complete pages get noticeably more clicks than bare ones, we see it in our own data.\n\nIf you would rather we simply correct something on the listing, reply and tell me what to change. And if you want the listing removed, one reply does that too.\n\nWarmly,\nTheDripMap\ninfo@thedripmap.com\n${CASL_FOOTER}`;
}
const subjA = (p) => `Your ${p.city} clinic is already on TheDripMap`;

// ---------- VARIANT B (treatment: personalized + tighter, signed Adrianne) ----------
// Picks the most specific REAL signal we have per clinic. The ratings backfill
// is the multiplier: more clinics with a rating -> more get the strong opener.
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
  return `Hi ${p.name} team,\n\n${openerB(p)} The catch: your page on TheDripMap, the IV therapy matching platform for Canada, is blank right now, so most of those people click straight to the next clinic.\n\nClaiming it is free and takes about two minutes:\n\n${claim}\n\nThen we build it out properly with you: your services, your real prices, and your team, plus the questions patients actually ask. Complete pages get noticeably more clicks than blank ones, we see it in our own data.\n\nNot interested, or something to fix? Just reply, and one line removes the listing too.\n\nAdrianne Trenton\nTheDripMap\ninfo@thedripmap.com\n${CASL_FOOTER}`;
}
const subjB = (p) => `Quick one about ${p.name}'s listing on TheDripMap`;

const variantOf = (i) => (i % 2 === 0 ? 'A' : 'B');
const buildEmail = (p, v) => (v === 'B' ? { subject: subjB(p), body: bodyB(p) } : { subject: subjA(p), body: bodyA(p) });

(async () => {
  let all = [], from = 0;
  while (true) { const { data } = await s.from('providers').select('id,slug,name,city,state,country,rating,reviews,email,description,specialties,outreach_sent,outreach_sent_at,email_bounced,reply_category,is_hidden,is_claimed,decision_drivers,created_at').range(from, from + 999); all = all.concat(data || []); if (!data || data.length < 1000) break; from += 1000; }
  // HARD GUARD: never draft to an address on the suppression list (unsubscribe OR
  // hard_bounce). The provider-row flags (email_bounced / reply_category) can miss
  // this — e.g. a brand-new listing that reuses an email that unsubscribed under a
  // DIFFERENT listing. email_suppressions is the source of truth for opt-outs, so we
  // consult it directly and drop any match. Added 2026-07-05.
  const suppressed = new Set();
  for (const tbl of ['email_suppressions', 'outreach_suppressions']) {
    let sf = 0;
    while (true) {
      const { data, error } = await s.from(tbl).select('email').range(sf, sf + 999);
      if (error) { console.error(`FATAL: could not load ${tbl} — refusing to draft. ` + error.message); process.exit(1); }
      for (const r of data || []) suppressed.add(String(r.email).toLowerCase().trim());
      if (!data || data.length < 1000) break;
      sf += 1000;
    }
  }
  const isSuppressed = (r) => r.email && suppressed.has(String(r.email).toLowerCase().trim());
  const list = all.filter((r) => !r.is_hidden && r.is_claimed !== true && isCA(r) && has(r.email) && validEmail(r.email) && r.outreach_sent !== true && !r.email_bounced && r.reply_category !== 'not_interested' && !isSuppressed(r) && r.slug);
  const droppedSup = all.filter((r) => has(r.email) && isSuppressed(r) && r.outreach_sent !== true && !r.is_hidden && r.is_claimed !== true).length;
  if (droppedSup) console.log(`suppression guard: excluded ${droppedSup} otherwise-eligible provider(s) on the unsubscribe/bounce list`);
  // highest-intent first (then newest) so the best prospects get emailed first
  list.sort((a, b) => intentScore(b) - intentScore(a) || new Date(b.created_at || 0) - new Date(a.created_at || 0));
  fs.writeFileSync(LIST, JSON.stringify(list.map((p) => ({ name: p.name, city: p.city, state: p.state, email: p.email, slug: p.slug })), null, 1));
  console.log(`not-yet-emailed CA list (email + sendable): ${list.length}  -> ${LIST}`);

  const batch = list.slice(0, N);
  console.log(`\npreparing ${batch.length} drafts (A/B alternating):`);
  batch.forEach((p, i) => console.log(`  [${variantOf(i)}|intent ${String(intentScore(p)).padStart(2)}] ${p.name} [${p.city}, ${p.state}] -> ${p.email}`));

  if (process.argv[2] === 'emit') {
    const payloads = batch.map((p, i) => { const v = variantOf(i); const e = buildEmail(p, v); return { id: p.id, slug: p.slug, name: p.name, city: p.city, to: p.email, variant: v, subject: e.subject, body: e.body }; });
    fs.writeFileSync(PAY, JSON.stringify(payloads, null, 1));
    console.log(`\nemitted ${payloads.length} payloads (A/B) -> ${PAY}`);
    process.exit(0);
  }
  if (!APPLY) {
    const ai = batch.findIndex((_, i) => variantOf(i) === 'A');
    const bi = batch.findIndex((_, i) => variantOf(i) === 'B');
    if (ai >= 0) { const e = buildEmail(batch[ai], 'A'); console.log('\n--- SAMPLE A (control) ---\nSubject: ' + e.subject + '\n' + e.body); }
    if (bi >= 0) { const e = buildEmail(batch[bi], 'B'); console.log('\n--- SAMPLE B (treatment, Adrianne) ---\nSubject: ' + e.subject + '\n' + e.body); }
    console.log('\nDRY. Re-run with "emit 20" (MCP path) or "apply 20" (IMAP path).');
    process.exit(0);
  }

  const user = process.env.SMTP_USER, pass = process.env.SMTP_PASS;
  if (!user || !pass) { console.log('MISSING SMTP_USER/SMTP_PASS — cannot create drafts via IMAP.'); process.exit(1); }
  const client = new ImapFlow({ host: 'imap.gmail.com', port: 993, secure: true, auth: { user, pass }, logger: false });
  await client.connect();
  const drafted = [];
  try {
    await client.mailboxOpen('[Gmail]/Drafts');
    for (let i = 0; i < batch.length; i++) {
      const p = batch[i]; const v = variantOf(i); const e = buildEmail(p, v);
      const msg = `From: TheDripMap <info@thedripmap.com>\r\nTo: ${p.email}\r\nReply-To: info@thedripmap.com\r\nSubject: ${e.subject}\r\nDate: ${new Date().toUTCString()}\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n${e.body}`;
      try { await client.append('[Gmail]/Drafts', msg, ['\\Draft']); drafted.push({ p, v }); }
      catch (err) { console.log('  draft FAIL ' + p.email + ': ' + err.message); }
    }
  } finally { await client.logout(); }

  // mark drafted providers + record the A/B variant (merge, don't clobber decision_drivers)
  const now = new Date().toISOString();
  for (const { p, v } of drafted) {
    const dd = { ...(p.decision_drivers && typeof p.decision_drivers === 'object' ? p.decision_drivers : {}), outreach_variant: v };
    await s.from('providers').update({ outreach_sent: true, outreach_sent_at: now, decision_drivers: dd }).eq('id', p.id);
  }
  const aN = drafted.filter((d) => d.v === 'A').length;
  console.log(`\nCREATED ${drafted.length} Gmail drafts (${aN} A / ${drafted.length - aN} B) + marked outreach_sent. Remaining not-emailed: ${list.length - drafted.length}`);
  process.exit(0);
})().catch((e) => { console.log('FATAL', e.message); process.exit(1); });
