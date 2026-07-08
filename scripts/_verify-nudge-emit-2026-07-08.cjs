// Emit personalized Safety Verified nudge draft payloads (2026-07-08).
// Reads the diagnostic JSON, targets NUDGE + FIRST_invite buckets, EXCLUDES
// Allies (freshly re-contacted today) and anything already excluded upstream
// (suppressed/bounced/submitted). Writes payloads for Gmail draft creation.
// Sends nothing. Relationship email to owners who claimed -> soft opt-out, not
// the cold-outreach CASL block. No dashes, no medical claims.
const fs = require('fs');
const path = require('path');
const IN = path.join(__dirname, '..', '.audit-tmp', '_verify-nudge-2026-07-08.json');
const OUT = path.join(__dirname, '..', '.audit-tmp', '_verify-nudge-payloads-2026-07-08.json');

function greeting(ownerName, clinic) {
  const n = (ownerName || '').trim();
  if (!n || n.toLowerCase() === clinic.toLowerCase()) return `Hi ${clinic} team,`;
  const noSuffix = n.replace(/,?\s*(ND|NP|MD|RN|R\.?N\.?|BSc|PhD)\.?$/i, '').trim();
  const parts = noSuffix.split(/\s+/);
  if (/^dr\.?$/i.test(parts[0]) && parts.length >= 2) return `Hi Dr. ${parts[parts.length - 1]},`;
  return `Hi ${parts[0]},`;
}

function body(r, isFirst) {
  const g = greeting(r.ownerName, r.name);
  const city = r.city || 'your area';
  const resumeLine = isFirst
    ? ''
    : `\n\nIf you started it already, the same link picks up right where you left off.`;
  return `${g}

Thank you for claiming ${r.name} on TheDripMap. Your listing is live, and there is one step left that makes it stand out: your Safety Verified badge.

It is the gold shield patients look for, and it visibly lifts your listing above unverified clinics when people in ${city} are choosing where to book. The questionnaire is quick, multiple choice plus a couple of photos, about two minutes, on your own private page:

${r.finishLink}${resumeLine}

Once you submit it, we review and add your badge. While you are there you can also fill in your services, real prices, and team, so your page is complete. Complete listings get noticeably more clicks than bare ones, we see it in our own data.

Any trouble with the link or a question, just reply and we will sort it out.

Warmly,
TheDripMap
info@thedripmap.com

--
You are receiving this because you claimed ${r.name} on TheDripMap, the IV therapy matching platform for Canada. If you would rather not get these owner updates, just reply and we will stop.`;
}

function subject(r) {
  const n = (r.ownerName || '').trim();
  const noSuffix = n.replace(/,?\s*(ND|NP|MD|RN|R\.?N\.?|BSc|PhD)\.?$/i, '').trim();
  const first = noSuffix && noSuffix.toLowerCase() !== r.name.toLowerCase()
    ? (/^dr\.?$/i.test(noSuffix.split(/\s+/)[0]) ? 'Dr. ' + noSuffix.split(/\s+/).pop() : noSuffix.split(/\s+/)[0])
    : '';
  return first
    ? `${first}, your Safety Verified badge is one step away`
    : `${r.name}: your Safety Verified badge is one step away`;
}

const rows = JSON.parse(fs.readFileSync(IN, 'utf8'));
const targets = rows.filter((r) =>
  (r.bucket === 'NUDGE' || r.bucket === 'FIRST_invite') &&
  r.name !== 'Allies Integrated Health' &&
  r.to && r.finishLink
);

const payloads = targets.map((r) => ({
  slug: r.slug, name: r.name, city: r.city, to: r.to, ownerName: r.ownerName,
  bucket: r.bucket, subject: subject(r), body: body(r, r.bucket === 'FIRST_invite'),
}));

fs.writeFileSync(OUT, JSON.stringify(payloads, null, 1));
console.log(`emitted ${payloads.length} nudge payloads -> ${OUT}`);
for (const p of payloads) console.log(`  [${p.bucket}] ${p.to.padEnd(34)} | ${p.subject}`);
