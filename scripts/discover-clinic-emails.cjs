/**
 * Find contact addresses for Canadian clinics we have no email for.
 *
 * WHY (2026-08-23): the daily report showed Canadian outreach runway at ZERO.
 * Every Canadian clinic with a usable address has already had its first touch,
 * so the list cannot grow from copy alone. 77 active Canadian listings have no
 * email at all, and all 77 have a website. Those addresses ARE the runway.
 *
 * WINDOWS + NODE HARD LESSON (CLAUDE.md): concurrent HTTPS workers die
 * silently on this machine, exit 0, partway through. Strictly sequential,
 * AbortController timeout, polite delay, state saved after EVERY clinic so a
 * death is resumable.
 *
 * WHAT IT WILL AND WILL NOT ACCEPT. A wrong address is worse than none: it
 * bounces, it drags sender reputation down, and it can put a stranger on a
 * mailing list. So an address is only kept when its domain matches the clinic's
 * own website domain. A Gmail or Outlook address found on the page is reported
 * for human review but never auto-applied, because it cannot be tied to the
 * business by domain alone. Platform noise (wix, squarespace, godaddy, sentry),
 * no-reply mailboxes and image filenames that look like addresses are dropped
 * outright.
 *
 * Run: node scripts/discover-clinic-emails.cjs [--limit N] [--apply]
 *      (dry run by default; --apply writes only the domain-matched addresses)
 */
require('dotenv').config({ path: '.env.local', override: true });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const STATE = path.join('.audit-tmp', '_email-discovery-state.json');
const APPLY = process.argv.includes('--apply');
const li = process.argv.indexOf('--limit');
const LIMIT = li > -1 ? Number(process.argv[li + 1]) : Infinity;
const DELAY_MS = 600;
const TIMEOUT_MS = 15000;
const PATHS = ['', '/contact', '/contact-us', '/contactez-nous', '/about', '/about-us'];

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,24}/g;
// Hosts that belong to the website builder or a tracker, never to the clinic.
const PLATFORM = /(wix|wixpress|squarespace|godaddy|shopify|sentry|cloudflare|google|gstatic|schema\.org|w3\.org|example|yourdomain|domain\.com|email\.com|jimdo|weebly|webflow|duda|sentry\.io)/i;
const BAD_LOCAL = /^(no-?reply|donotreply|postmaster|abuse|hostmaster|webmaster|mailer-daemon|bounce|unsubscribe|privacy|dmca|sentry)/i;
// "logo@2x.png" and friends match the email shape but are filenames.
const FILE_TAIL = /\.(png|jpe?g|gif|svg|webp|css|js|woff2?|ico|avif)$/i;
const FREEMAIL = /^(gmail|googlemail|yahoo|hotmail|outlook|live|icloud|aol|protonmail|me)\./i;

function rootDomain(host) {
  const h = String(host || '').toLowerCase().replace(/^www\./, '');
  const parts = h.split('.');
  if (parts.length <= 2) return h;
  // Handle .co.uk / .qc.ca style suffixes by keeping the last three labels.
  const twoLevel = /^(co|com|net|org|gov|edu|ac|qc|on|bc|ab)\.[a-z]{2}$/i;
  return twoLevel.test(parts.slice(-2).join('.')) ? parts.slice(-3).join('.') : parts.slice(-2).join('.');
}

function scoreLocal(local) {
  const l = local.toLowerCase();
  if (/^(info|contact|hello|bonjour|admin|reception|frontdesk|office)$/.test(l)) return 3;
  if (/^(booking|appointments?|clinic|care|team|welcome|inquiries|enquiries)$/.test(l)) return 2;
  return 1;
}

async function fetchText(url) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ac.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'TheDripMapBot/1.0 (+https://www.thedripmap.com; clinic contact lookup)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    if (!res.ok) return null;
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (!ct.includes('html')) return null;
    return await res.text();
  } catch { return null; } finally { clearTimeout(t); }
}

function extract(html, siteRoot) {
  const found = new Map();
  // mailto: first, it is an explicit statement of "write to us here".
  const mailtos = html.match(/mailto:([^"'>\s?]+)/gi) || [];
  const raw = [...mailtos.map((m) => m.replace(/^mailto:/i, '')), ...(html.match(EMAIL_RE) || [])];
  for (const cand of raw) {
    const e = cand.trim().toLowerCase().replace(/[.,;:)]+$/, '');
    if (!EMAIL_RE.test(e)) { EMAIL_RE.lastIndex = 0; continue; }
    EMAIL_RE.lastIndex = 0;
    if (FILE_TAIL.test(e)) continue;
    const [local, host] = e.split('@');
    if (!local || !host) continue;
    if (BAD_LOCAL.test(local)) continue;
    if (PLATFORM.test(host)) continue;
    const dom = rootDomain(host);
    const matchesSite = dom === siteRoot;
    const free = FREEMAIL.test(host + '.');
    const prev = found.get(e);
    const score = scoreLocal(local) + (matchesSite ? 10 : 0) + (free ? -1 : 0);
    if (!prev || score > prev.score) found.set(e, { email: e, score, matchesSite, free });
  }
  return [...found.values()].sort((a, b) => b.score - a.score);
}

(async () => {
  let all = [], f = 0;
  for (;;) {
    const { data, error } = await s
      .from('providers')
      .select('id,slug,name,city,state,country,is_hidden,is_claimed,email,website,decision_drivers')
      .range(f, f + 999);
    if (error) { console.error('READ FAIL', error.message); process.exit(1); }
    if (!data || !data.length) break;
    all = all.concat(data);
    if (data.length < 1000) break;
    f += 1000;
  }

  // Never assign an address already in use, suppressed, or bounced elsewhere.
  const taken = new Set(all.map((p) => (p.email || '').toLowerCase().trim()).filter(Boolean));
  for (const t of ['email_suppressions', 'outreach_suppressions']) {
    const { data, error } = await s.from(t).select('email');
    if (error) { console.error(`Refusing to run: could not load ${t}: ${error.message}`); process.exit(1); }
    for (const r of data || []) taken.add(String(r.email).toLowerCase().trim());
  }

  const targets = all.filter((p) => !p.is_hidden && p.country === 'Canada' && !p.is_claimed && !p.email && p.website);
  let st; try { st = JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch { st = { done: {}, review: {}, none: {} }; }
  const pending = targets.filter((p) => !st.done[p.slug] && !st.none[p.slug]).slice(0, LIMIT);

  console.log(`Canadian clinics with no email : ${targets.length}`);
  console.log(`to process this run            : ${pending.length}`);
  if (!APPLY) console.log('(dry run, nothing will be written)\n');

  let applied = 0, review = 0, none = 0, i = 0;
  for (const p of pending) {
    i++;
    let siteRoot;
    try { siteRoot = rootDomain(new URL(p.website).hostname); } catch { st.none[p.slug] = 'bad website url'; none++; continue; }

    let best = null, seenAny = [];
    for (const suffix of PATHS) {
      const url = p.website.replace(/\/+$/, '') + suffix;
      const html = await fetchText(url);
      await sleep(DELAY_MS);
      if (!html) continue;
      const hits = extract(html, siteRoot).filter((h) => !taken.has(h.email));
      seenAny = seenAny.concat(hits);
      const onDomain = hits.find((h) => h.matchesSite);
      if (onDomain) { best = onDomain; break; } // explicit win, stop crawling
    }

    if (best) {
      if (APPLY) {
        const dd = (p.decision_drivers && typeof p.decision_drivers === 'object') ? p.decision_drivers : {};
        const { error, count } = await s
          .from('providers')
          .update({
            email: best.email,
            decision_drivers: { ...dd, email_source: { found_at: new Date().toISOString(), from: 'clinic website', domain_matched: true } },
          }, { count: 'exact' })
          .eq('id', p.id);
        if (error || count !== 1) { console.log(`  [${i}] DB FAIL ${p.slug}`); continue; }
      }
      taken.add(best.email);
      st.done[p.slug] = { email: best.email, at: new Date().toISOString() };
      applied++;
      console.log(`  [${i}/${pending.length}] ${APPLY ? 'SET ' : 'WOULD SET '}${p.slug} -> ${best.email}`);
    } else if (seenAny.length) {
      const top = seenAny.sort((a, b) => b.score - a.score)[0];
      st.review[p.slug] = { candidate: top.email, why: 'off-domain, needs a human eye', name: p.name, site: p.website };
      review++;
      console.log(`  [${i}/${pending.length}] REVIEW ${p.slug}: ${top.email} (not on ${siteRoot})`);
    } else {
      st.none[p.slug] = 'no address published';
      none++;
      console.log(`  [${i}/${pending.length}] none  ${p.slug}`);
    }
    fs.mkdirSync(path.dirname(STATE), { recursive: true });
    fs.writeFileSync(STATE, JSON.stringify(st, null, 2), 'utf8'); // after EVERY clinic
  }

  console.log(`\n${APPLY ? 'applied' : 'would apply'}: ${applied} | needs review: ${review} | nothing published: ${none}`);
  console.log(`state: ${STATE}`);
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
