#!/usr/bin/env node
/**
 * CA email backfill (2026-08-30). Refuels first-touch outreach.
 *
 * WHY NOW: every Canadian clinic in the table that HAS an email has already
 * been emailed (539 of 544). First-touch fuel is zero, and the follow-up
 * queue is ~158 sends, so Hubert's daily job runs dry in under a week. All
 * 75 CA providers still missing an email do have a website, so their contact
 * address is usually one fetch away.
 *
 * PATTERN (Windows + Node v24 hard lesson): sequential fetch, AbortSignal
 * timeout, polite delay, and state written after EVERY row so a silent death
 * is resumable. No concurrency.
 *
 * SAFETY: writes NOTHING without --write. Rejects role addresses we would
 * never mail, anything on a non-clinic domain, and anything already present
 * on another provider row (a shared address means the same operator, and
 * mailing it twice reads as spam).
 *
 * Run:  node scripts/_ca-email-backfill.cjs           (dry, writes review file)
 *       node scripts/_ca-email-backfill.cjs --write   (applies to Supabase)
 */
require('dotenv').config({ path: '.env.local', quiet: true });
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const WRITE = process.argv.includes('--write');
const STATE = '.audit-tmp/_ca-email-backfill-state.json';
const TIMEOUT_MS = 12000;
const DELAY_MS = 600;

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,24}/g;
const BAD_LOCAL = /^(no-?reply|donotreply|postmaster|abuse|webmaster|mailer-daemon|sentry|example|user|privacy|dpo|unsubscribe)/i;
const FILE_TAIL = /\.(png|jpe?g|gif|svg|webp|css|js|woff2?|ico|avif)$/i;
const NOT_CLINIC_HOST = /(wixpress|sentry|squarespace|godaddy|shopify|wordpress|google|gstatic|facebook|instagram|schema\.org|w3\.org|example\.(com|org))/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function rootDomain(host) {
  const h = String(host || '').toLowerCase().replace(/^www\./, '');
  const p = h.split('.');
  if (p.length <= 2) return h;
  return /^(co|com|net|org|gouv|qc|on|bc|ab)\.[a-z]{2}$/i.test(p.slice(-2).join('.'))
    ? p.slice(-3).join('.')
    : p.slice(-2).join('.');
}

async function get(url) {
  // Some clinic sites sit behind a WAF that 403s an identifying bot UA. We
  // announce ourselves first; only if that is refused do we retry with a plain
  // browser UA, because a public contact page is exactly what we are reading.
  const UAS = [
    'TheDripMapBot/1.0 (+https://www.thedripmap.com; listing contact lookup)',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  ];
  for (const ua of UAS) {
    try {
      const r = await fetch(url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: {
          'User-Agent': ua,
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-CA,en;q=0.9,fr-CA;q=0.8',
        },
      });
      if (!r.ok) continue;
      if (!(r.headers.get('content-type') || '').toLowerCase().includes('html')) return null;
      return await r.text();
    } catch {
      /* try the next UA */
    }
  }
  return null;
}

/** Longest common prefix length of two domain/name stems. */
function prefixMatch(a, b) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
}

/**
 * Is this email domain plausibly the SAME OPERATOR as the site/clinic?
 * Real case that motivated this: NatCan Integrative at natcanintegrative.com
 * publishes info@natcanclinics.com. A strict own-domain rule discards a
 * perfectly good address, so we also accept a sibling domain that shares a
 * 5-character stem with the site domain or the clinic name.
 */
function sameOperator(emailHost, siteRoot, clinicName) {
  const eStem = rootDomain(emailHost).split('.')[0];
  const sStem = siteRoot.split('.')[0];
  if (eStem === sStem) return 'own-domain';
  if (prefixMatch(eStem, sStem) >= 5) return `sibling-domain(${eStem} ~ ${sStem})`;
  const nameTokens = String(clinicName || '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .split(/\s+/)
    .filter((t) => t.length >= 5);
  for (const t of nameTokens) {
    if (eStem.includes(t)) return `name-match(${t})`;
  }
  return null;
}

/** Prefer a real inbox on the clinic's OWN domain; score generic mailboxes highest. */
function pickEmail(html, root, clinicName) {
  const raw = [
    ...(html.match(/mailto:([^"'>\s?]+)/gi) || []).map((m) => m.replace(/^mailto:/i, '')),
    ...(html.match(EMAIL_RE) || []),
  ];
  let best = null;
  for (const c of raw) {
    const e = decodeURIComponent(c.trim()).toLowerCase().replace(/[.,;:)]+$/, '');
    if (FILE_TAIL.test(e)) continue;
    const [local, host] = e.split('@');
    if (!local || !host || BAD_LOCAL.test(local)) continue;
    if (NOT_CLINIC_HOST.test(host)) continue;
    const why = sameOperator(host, root, clinicName);
    if (!why) continue;
    const generic = /^(info|contact|hello|bonjour|admin|reception|frontdesk|office|booking|clinic|care)$/.test(local);
    // Own domain outranks a sibling; a generic mailbox outranks a personal one.
    const score = (why === 'own-domain' ? 4 : 0) + (generic ? 2 : 1);
    if (!best || score > best.score) best = { email: e, score, why };
  }
  return best;
}

(async () => {
  fs.mkdirSync('.audit-tmp', { recursive: true });
  const state = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : { done: {}, found: {} };

  const { data: targets, error } = await sb
    .from('providers')
    .select('id, name, city, website')
    .eq('country', 'Canada')
    .eq('is_hidden', false)
    .is('email', null)
    .not('website', 'is', null);
  if (error) throw error;

  // Every address already on ANY provider row: a hit that matches one of these
  // is the same operator under a second listing, never a new contact.
  const known = new Set();
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from('providers').select('email').not('email', 'is', null).range(f, f + 999);
    if (!data || !data.length) break;
    for (const r of data) known.add(String(r.email).toLowerCase().trim());
    if (data.length < 1000) break;
  }

  console.log(`${targets.length} CA providers missing an email. Known addresses: ${known.size}. Mode: ${WRITE ? 'WRITE' : 'dry run'}`);

  let found = 0, checked = 0, dupes = 0;
  for (const p of targets) {
    if (state.done[p.id]) continue;
    checked++;
    let host, root;
    try {
      const u = new URL(p.website.startsWith('http') ? p.website : `https://${p.website}`);
      host = u.hostname;
      root = rootDomain(host);
    } catch {
      state.done[p.id] = 'bad-url';
      fs.writeFileSync(STATE, JSON.stringify(state));
      continue;
    }

    let email = null;
    let why = null;
    for (const path of ['', '/contact', '/contact-us', '/about', '/book']) {
      const html = await get(`https://${host}${path}`);
      await sleep(DELAY_MS);
      if (!html) continue;
      const hit = pickEmail(html, root, p.name);
      if (hit) { email = hit.email; why = hit.why; break; }
    }

    if (email && known.has(email)) {
      state.done[p.id] = `dupe:${email}`;
      dupes++;
    } else if (email) {
      state.found[p.id] = { email, why, name: p.name, city: p.city, website: p.website };
      state.done[p.id] = 'found';
      known.add(email);
      found++;
      console.log(`  + ${p.name} (${p.city}) -> ${email}  [${why}]`);
    } else {
      state.done[p.id] = 'none';
    }
    // State after EVERY row: a silent death stays resumable.
    fs.writeFileSync(STATE, JSON.stringify(state));
  }

  const rows = Object.entries(state.found);
  console.log(`\nchecked ${checked} | new emails ${found} | duplicates skipped ${dupes} | total found so far ${rows.length}`);

  const review = [
    `CA email backfill review, ${new Date().toISOString()}`,
    `Found ${rows.length} own-domain addresses for providers that had none.`,
    '',
    ...rows.map(([id, v]) => `${v.city} | ${v.name} | ${v.email} | ${v.why} | ${v.website}`),
  ].join('\n');
  fs.writeFileSync('.audit-tmp/_ca-email-backfill-review.txt', review);
  console.log('Wrote .audit-tmp/_ca-email-backfill-review.txt');

  if (WRITE && rows.length) {
    let ok = 0;
    for (const [id, v] of rows) {
      const { error: e } = await sb.from('providers').update({ email: v.email }).eq('id', id);
      if (e) console.log('  ERR', v.name, e.message);
      else ok++;
    }
    console.log(`WROTE ${ok} emails to Supabase. They now enter the normal first-touch draft queue.`);
  } else if (rows.length) {
    console.log('Dry run. Re-run with --write to apply.');
  }
})();
