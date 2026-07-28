/**
 * Generate the "finish your safety answers" DRAFTS for the badge queue's
 * completion-request batch. Drafts only, nothing is sent.
 *
 * Mirrors src/lib/badge-review.ts (buildCompletionRequestEmail) so the batch and
 * the /admin/badge-reviews button produce identical copy.
 *
 *   node scripts/_badge-completion-drafts.cjs        # print drafts
 *   node scripts/_badge-completion-drafts.cjs emit   # write to .audit-tmp JSON
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local'), override: true });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const EMIT = process.argv[2] === 'emit';
const SITE = 'https://www.thedripmap.com';
const OUT = path.join(__dirname, '..', '.audit-tmp', '_badge-completion-drafts.json');

// The completion-request batch (operator decision 2026-07-27): blank or thin
// safety answers get a completion request instead of a decline.
const SLUGS = [
  'bay-wellness-centre-vancouver',
  'signature-beauty-lounge-downtown-toronto',
  'signature-beauty-lounge-richmond-hill',
  'tri-health-wellness-centre-vaughan',
  'drs-mobile-therapy-brampton',
];

const CASL_FOOTER = `--
TheDripMap, the IV therapy matching platform for Canada | info@thedripmap.com | Caledon, Ontario, Canada
You are receiving this because your clinic claimed its listing on TheDripMap. Reply 'unsubscribe' to stop hearing from us.`;

function missingParts(manage) {
  const m = manage && typeof manage === 'object' ? manage : {};
  const out = [];
  const who = m.team && Array.isArray(m.team.whoPlaces) ? m.team.whoPlaces : [];
  const ov = m.team && typeof m.team.oversight === 'string' ? m.team.oversight : '';
  const src = Array.isArray(m.sourcing) ? m.sourcing : [];
  if (!who.length) out.push('who starts the IV');
  if (!ov.trim()) out.push('your medical oversight');
  if (!src.length) out.push('where your ingredients come from');
  return out;
}

function buildEmail(name, finishUrl, missing) {
  const missingLine = missing.length
    ? `Looking at your listing, these are the parts we still need: ${missing.join(', ')}.`
    : 'Looking at your listing, the safety section is not filled in yet.';
  const text = `Hi ${name} team,

Good news first: your listing is claimed and live on TheDripMap.

We have just moved the Safety Verified badge to a human review process. Every badge is now checked by our team rather than granted automatically, so it means more to the patients who look for it.

${missingLine} It takes about a minute to add them here:

${finishUrl}

Once you submit, we review within a week and your badge goes live if everything checks out. Nothing else changes about your listing in the meantime.

If anything looks off or you have questions, just reply to this note.

Warmly,
TheDripMap

${CASL_FOOTER}`;
  return { subject: `Finishing your Safety Verified review for ${name}`, text };
}

(async () => {
  const { data, error } = await s
    .from('providers')
    .select('id,name,slug,email,manage_token,decision_drivers')
    .in('slug', SLUGS);
  if (error) { console.log('FATAL', error.message); process.exit(1); }

  const drafts = [];
  for (const slug of SLUGS) {
    const p = (data || []).find((x) => x.slug === slug);
    if (!p) { console.log(`  MISSING provider for slug ${slug}`); continue; }
    const finishUrl = p.manage_token ? `${SITE}/finish/${p.id}.${p.manage_token}` : `${SITE}/get-verified?id=${p.id}&name=${encodeURIComponent(p.name)}`;
    const missing = missingParts((p.decision_drivers || {}).manage);
    const e = buildEmail(p.name, finishUrl, missing);
    drafts.push({ slug, name: p.name, to: p.email || '(no email on file)', missing, subject: e.subject, body: e.text });
  }

  // compliance guard: no dashes, never "directory"
  const bad = drafts.filter((d) => /[‒–—―]/.test(d.subject + d.body) || /\bdirectory\b/i.test(d.subject + d.body));
  console.log(`drafts: ${drafts.length} | compliance failures: ${bad.length}`);
  drafts.forEach((d) => console.log(`  ${d.name} -> ${d.to} | missing: ${d.missing.join(', ') || '(none flagged)'}`));
  if (drafts[0]) console.log('\n--- SAMPLE ---\nTo: ' + drafts[0].to + '\nSubject: ' + drafts[0].subject + '\n\n' + drafts[0].body);

  if (EMIT) {
    if (bad.length) { console.log('ABORT: compliance failures.'); process.exit(1); }
    fs.writeFileSync(OUT, JSON.stringify(drafts, null, 1));
    console.log(`\nemitted ${drafts.length} drafts -> ${OUT} (DRAFTS ONLY; operator sends)`);
  } else {
    console.log('\nDRY. Re-run with "emit" to write the drafts JSON. Nothing is sent.');
  }
})().catch((e) => { console.log('FATAL', e.message); process.exit(1); });
