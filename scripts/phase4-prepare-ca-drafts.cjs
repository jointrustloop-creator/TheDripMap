/**
 * Phase 4 — Prepare up to 100 CA-first outreach DRAFTS.
 *
 * Runs as a standalone script (NOT a cron). Uses the same Phase 1 scrubbers
 * and the same body-builder template as the daily-outreach cron, but with:
 *   - Canada-only candidate pool
 *   - email_quality = 'high' only (no medium)
 *   - target cap of 100 drafts
 *   - provincial spread (rough proportional fill across ON/BC/AB/QC/MB/NS/SK/NB/etc.)
 *
 * DRAFTS ONLY. Calls saveDrafts() — never sendMail() for outreach. The
 * existing internal-status-report sendMail to info@thedripmap.com is the
 * same pattern the cron uses and is allowed (it's internal, not outreach).
 *
 * Idempotent at the provider level — flags each drafted provider's
 * outreach_sent + outreach_sent_at so a re-run won't re-draft them.
 *
 * Usage: node scripts/phase4-prepare-ca-drafts.cjs
 *
 * Output: writes a summary log to stdout AND
 *   .audit-tmp/phase4-drafts-prepared.json
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Phase 1 helpers (re-implemented in CJS because the TS file is ESM-tagged
// for Next.js consumption; the logic is small enough to mirror cleanly).
const KNOWN_FREE = new Set([
  'gmail.com','yahoo.com','yahoo.ca','hotmail.com','hotmail.ca','outlook.com',
  'aol.com','icloud.com','me.com','mac.com','protonmail.com','proton.me',
  'live.com','msn.com','rogers.com','sympatico.ca','telus.net','shaw.ca',
]);
const VENDOR_CATCHALLS = [
  'growth99.com','thryv.com','janeapp.com','jane.app','mindbodyonline.com',
  'mywellnessliving.com','wellnessliving.com','meevo.com','vagaro.com',
  'fresha.com','mailerlite.com','mailchimp.com','constantcontact.com',
  'hubspot.com','squarespace-mail.com','stagheaddesigns.com','webador.com',
];
const PLACEHOLDER_LOCALS = new Set([
  'john','jane','test','tester','placeholder','noreply','no-reply',
  'donotreply','example','sample',
]);

function domainOf(e) { return e.slice(e.lastIndexOf('@') + 1).toLowerCase().trim(); }
function rootDom(h) { return h.replace(/^www\./, '').split('.').slice(-2).join('.'); }

function isJunkEmail(email) {
  if (!email) return true;
  const e = email.trim().toLowerCase();
  if (!e) return true;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return true;
  if (/\.(jpe?g|png|gif|webp|svg)$/i.test(e)) return true;
  const local = e.split('@')[0];
  const d = domainOf(e);
  if (e === 'john@doe.com' || e === 'jane@doe.com' || e === 'test@test.com') return true;
  if (PLACEHOLDER_LOCALS.has(local)) return true;
  if (/^(example|test|invalid|localhost|local)\.(com|net|org|io|ca)$/i.test(d)) return true;
  for (const v of VENDOR_CATCHALLS) {
    if (d === v || d === 'www.' + v) return true;
  }
  return false;
}

function isDomainMismatch(email, website) {
  if (!email || !website) return false;
  const e = email.trim().toLowerCase();
  if (!e || !/@/.test(e)) return false;
  const eD = domainOf(e);
  if (!eD) return false;
  if (KNOWN_FREE.has(eD)) return false;
  let host = '';
  try {
    const w = website.trim();
    const ws = /^https?:\/\//i.test(w) ? w : 'https://' + w;
    host = new URL(ws).hostname.toLowerCase().replace(/^www\./, '');
  } catch { return false; }
  if (!host) return false;
  if (eD === host) return false;
  if (rootDom(eD) === rootDom(host)) return false;
  return true;
}

// Mailing-address identification line stripped 2026-06-01 per operator
// instruction. Footer is no longer fully CASL-compliant — only unsubscribe
// block remains.
const CASL_FOOTER = `\n—\nYou're receiving this because your clinic was identified as an IV therapy provider in our directory. To stop receiving these emails, reply with 'unsubscribe' in the subject line, or email info@thedripmap.com with 'unsubscribe'.`;

// --- Body builders (mirror of app/api/cron/daily-outreach/route.ts) -------

const SITE_URL = 'https://www.thedripmap.com';
const DRAFT_CAP = 100;

function cleanName(n) {
  return (n || '')
    .split(' - ')[0]
    .split(' | ')[0]
    .split(', A Division of')[0]
    .replace(/\s+IV (Hydration|Therapy).*$/i, '')
    .trim();
}

function locationLabel(p) {
  const city = (p.city || '').trim();
  const state = (p.state || '').trim();
  if (city && state) return `${city}, ${state}`;
  return city || state || 'location';
}

function buildSingleBody(p) {
  const display = cleanName(p.name);
  const claimUrl = `${SITE_URL}/providers/${p.slug}?claim=1`;
  const city = (p.city || '').trim();
  const hasRating = !!(p.rating && Number(p.reviews) > 0);
  const opener = hasRating
    ? `I came across ${display} while researching the top-rated IV therapy clinics in ${city || 'your area'}. Your Google rating of ${p.rating}★ across ${p.reviews} reviews puts you in a small group of clinics patients actually trust — which is exactly the kind we feature on TheDripMap.`
    : `I came across ${display} while building out our ${city || 'local'} IV therapy listings on TheDripMap — North America's directory for IV therapy clinics.`;
  return `Hi ${display} team,

${opener}

We added your listing — but right now it's unclaimed, so visitors see a generic placeholder instead of your photos, hours, services, and description. Claiming is free and takes 2 minutes:
${claimUrl}

Warmly,
Deborah Triandafilou
TheDripMap
info@thedripmap.com
${CASL_FOOTER}`;
}

function buildMultiBody(providers, email) {
  const brand = cleanName(providers[0].name);
  const count = providers.length;
  const cities = Array.from(new Set(providers.map(p => (p.city || '').trim()).filter(Boolean)));
  const cityPhrase = cities.length === 0
    ? 'multiple cities'
    : cities.length === 1 ? cities[0]
    : cities.length === 2 ? `${cities[0]} and ${cities[1]}`
    : `${cities.slice(0, -1).join(', ')} and ${cities[cities.length - 1]}`;
  const locations = providers.map(p => {
    const url = `${SITE_URL}/providers/${p.slug}?claim=1`;
    return `  • ${cleanName(p.name)} — ${locationLabel(p)}\n    ${url}`;
  }).join('\n');
  return `Hi ${brand} team,

I came across ${count} of your ${brand} locations across ${cityPhrase} while researching trusted IV therapy clinics for TheDripMap — North America's directory for IV therapy. All ${count} are live with us but currently unclaimed:

${locations}

Right now visitors see a generic placeholder on each one instead of your real photos, hours, services, and description. Claiming each listing is free and takes 2 minutes.

I sent this once to ${email.toLowerCase().trim()} because all ${count} locations share that email — so you only hear from me once, not ${count} times.

Warmly,
Deborah Triandafilou
TheDripMap
info@thedripmap.com
${CASL_FOOTER}`;
}

// --- Draft saver — minimal IMAP append, mirrors src/lib/draft-saver.ts ----

const { ImapFlow } = require('imapflow');

function buildRfc822({ from, to, replyTo, subject, text }) {
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    ...(replyTo ? [`Reply-To: ${replyTo}`] : []),
    `Subject: ${subject}`,
    `Date: ${new Date().toUTCString()}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
  ];
  return headers.join('\r\n') + '\r\n\r\n' + text;
}

async function saveDraftsBatch(drafts) {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) throw new Error('SMTP_USER / SMTP_PASS env vars required');
  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: { user, pass },
    logger: false,
  });
  const results = [];
  await client.connect();
  try {
    await client.mailboxOpen('[Gmail]/Drafts');
    for (const d of drafts) {
      try {
        await client.append('[Gmail]/Drafts', buildRfc822(d), ['\\Draft']);
        results.push({ ok: true, to: d.to });
      } catch (err) {
        results.push({ ok: false, to: d.to, error: err.message });
      }
    }
  } finally {
    await client.logout();
  }
  return results;
}

// --- Main -------------------------------------------------------------

const MIN_RATING = 4.5;
const MIN_REVIEWS = 10;
const PROVINCE_TARGET = {
  Ontario: 38,
  'British Columbia': 24,
  Alberta: 14,
  Quebec: 10,
  Manitoba: 4,
  'Nova Scotia': 4,
  Saskatchewan: 3,
  'New Brunswick': 2,
  'Newfoundland and Labrador': 1,
};

function score(p) {
  return (Number(p.rating) || 0) * Math.log10((Number(p.reviews) || 0) + 1);
}

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('=== Phase 4: prepare up to ' + DRAFT_CAP + ' CA-first drafts ===\n');

  // Pull the eligibility pool — Canada-only, high-quality only.
  const { data, error } = await sb.from('providers')
    .select('id, name, slug, rating, reviews, email, country, city, state, website')
    .eq('country', 'Canada')
    .eq('email_quality', 'high')
    .neq('availability', false)
    .eq('is_featured', false)
    .neq('outreach_sent', true)
    .neq('email_bounced', true)
    .not('email', 'is', null)
    .neq('email', '')
    .order('rating', { ascending: false, nullsFirst: false })
    .limit(2000);

  if (error) {
    console.error('Pool query failed:', error.message);
    process.exit(1);
  }
  console.log('Step 0: DB pool: ' + data.length);

  const stepRating = data.filter(p =>
    !p.rating || (Number(p.reviews) >= MIN_REVIEWS && Number(p.rating) >= MIN_RATING)
  );
  console.log('Step 1: rating filter: ' + stepRating.length);
  const stepJunk = stepRating.filter(p => !isJunkEmail(p.email));
  console.log('Step 2: junk-scrub: ' + stepJunk.length);
  const stepClean = stepJunk.filter(p => !isDomainMismatch(p.email, p.website));
  console.log('Step 3: domain-mismatch-scrub: ' + stepClean.length);

  // Group by lowercased email so multi-location chains get ONE draft.
  const groups = new Map();
  for (const p of stepClean) {
    const k = (p.email || '').trim().toLowerCase();
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(p);
  }
  for (const arr of groups.values()) {
    arr.sort((a, b) => score(b) - score(a) || (a.slug || '').localeCompare(b.slug || ''));
  }

  // Build the group array with each group's anchor (top-rated provider).
  let groupArr = Array.from(groups.entries()).map(([email, providers]) => ({
    email,
    providers,
    anchor: providers[0],
  }));

  // Sort by anchor score within each province.
  groupArr.sort((a, b) => score(b.anchor) - score(a.anchor));

  // Provincial spread: pick up to PROVINCE_TARGET[X] from each province first,
  // then backfill any remaining slots from the highest-scored leftovers.
  const taken = [];
  const takenIds = new Set();
  const remaining = new Map();
  for (const [prov, target] of Object.entries(PROVINCE_TARGET)) {
    let n = 0;
    for (const g of groupArr) {
      if (g.anchor.state !== prov) continue;
      if (taken.length >= DRAFT_CAP || n >= target) break;
      if (takenIds.has(g.anchor.id)) continue;
      taken.push(g);
      takenIds.add(g.anchor.id);
      n++;
    }
    if (n < target) remaining.set(prov, target - n);
  }
  // Backfill any unused province slots from highest-scoring leftover groups.
  for (const g of groupArr) {
    if (taken.length >= DRAFT_CAP) break;
    if (takenIds.has(g.anchor.id)) continue;
    taken.push(g);
    takenIds.add(g.anchor.id);
  }

  console.log('\nSelected: ' + taken.length + ' drafts');
  const byProv = {};
  for (const g of taken) byProv[g.anchor.state || '(none)'] = (byProv[g.anchor.state || '(none)'] || 0) + 1;
  console.log('Provincial breakdown:', JSON.stringify(byProv));

  // Build draft payloads.
  const drafts = taken.map(({ email, providers }) => {
    const anchor = providers[0];
    const display = cleanName(anchor.name);
    const subject = providers.length > 1
      ? `Your ${display} locations on TheDripMap`
      : `Your ${display} listing on TheDripMap`;
    const text = providers.length > 1
      ? buildMultiBody(providers, email)
      : buildSingleBody(anchor);
    return {
      from: 'TheDripMap <info@thedripmap.com>',
      to: email,
      replyTo: 'info@thedripmap.com',
      subject,
      text,
    };
  });

  if (drafts.length === 0) {
    console.log('\nNo eligible drafts to save. Exiting.');
    return;
  }

  // Save in batches of 20, mark provider rows after each batch.
  const BATCH = 20;
  const nowIso = new Date().toISOString();
  const summary = { startedAt: nowIso, saved: [], failures: [] };

  for (let i = 0; i < drafts.length; i += BATCH) {
    const slice = drafts.slice(i, i + BATCH);
    const slicePicked = taken.slice(i, i + BATCH);
    console.log('\nBatch ' + (Math.floor(i / BATCH) + 1) + ' — saving ' + slice.length + ' drafts…');
    const results = await saveDraftsBatch(slice);
    for (let j = 0; j < results.length; j++) {
      const r = results[j];
      const g = slicePicked[j];
      if (r.ok) {
        summary.saved.push({
          email: g.email,
          anchor: cleanName(g.anchor.name),
          city: g.anchor.city,
          state: g.anchor.state,
          providerIds: g.providers.map(p => p.id),
        });
        // Flag every provider in the group as outreach_sent.
        const ids = g.providers.map(p => p.id);
        await sb.from('providers')
          .update({ outreach_sent: true, outreach_sent_at: nowIso })
          .in('id', ids);
      } else {
        summary.failures.push({ email: g.email, error: r.error });
      }
    }
    // Persist partial progress after every batch.
    fs.mkdirSync(path.dirname('.audit-tmp/phase4-drafts-prepared.json'), { recursive: true });
    fs.writeFileSync('.audit-tmp/phase4-drafts-prepared.json', JSON.stringify(summary, null, 2));
    // 1.5s pause between batches to be polite to IMAP + Supabase.
    if (i + BATCH < drafts.length) {
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  summary.finishedAt = new Date().toISOString();
  fs.writeFileSync('.audit-tmp/phase4-drafts-prepared.json', JSON.stringify(summary, null, 2));

  // Final report.
  console.log('\n=== PHASE 4 SUMMARY ===');
  console.log('Saved drafts:    ' + summary.saved.length);
  console.log('Failed drafts:   ' + summary.failures.length);
  const finalByProv = {};
  for (const s of summary.saved) finalByProv[s.state || '(none)'] = (finalByProv[s.state || '(none)'] || 0) + 1;
  console.log('By province:    ' + JSON.stringify(finalByProv));
  if (summary.failures.length) {
    console.log('\nFailures:');
    for (const f of summary.failures) console.log('  ✗ ' + f.email + ' — ' + f.error);
  }
  console.log('\nFull details:    .audit-tmp/phase4-drafts-prepared.json');
}

main().catch(err => {
  console.error('\nFatal error:', err.message);
  process.exit(1);
});
