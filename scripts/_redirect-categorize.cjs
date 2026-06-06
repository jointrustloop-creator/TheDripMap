/**
 * Categorize the 20 off-domain redirects from the Tier 2 link scan into:
 *   - SAFE auto-fix: clear same-business (www/.ca/.com variant, typo fix,
 *     franchise locations subdomain move). Update URL.
 *   - JUDGMENT: ambiguous (acquisition / rebrand / completely different
 *     business). Flag for operator, do NOT touch.
 *
 * Rules for SAFE classification:
 *   - finalDomain shares a meaningful substring with the original
 *     (both contain the same core word after stripping .ca/.com/.net/
 *     /www/locations/etc.)
 *   - OR the change is purely www<->root, .ca<->.com on same root
 *
 * Anything where the brand name is different (durandhealth.com ->
 * durand.clinic is fine because "durand" is in both; but
 * thrivewellnesscenter -> thriveforlife is NOT safe because the brand
 * name changed) is JUDGMENT.
 *
 * Output: a plan that lists SAFE and JUDGMENT separately. No DB writes
 * yet — those happen in the apply step after this preview.
 */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const sb = require('@supabase/supabase-js').createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// Latest Tier 2 scan
function latestScan() {
  const dir = path.join('scripts', '_receipts');
  const files = fs.readdirSync(dir).filter((f) => f.startsWith('tier-2-link-scan-')).sort();
  return JSON.parse(fs.readFileSync(path.join(dir, files[files.length - 1]), 'utf8'));
}

function rootDomain(u) {
  try {
    return new URL(u).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

// Extract the core brand token from a hostname: drop locations.* subdomain,
// strip TLD, return the remaining first label.
function coreToken(host) {
  const stripped = host.replace(/^(locations|www|go)\./, '');
  const labels = stripped.split('.');
  return labels[0] || '';
}

// Levenshtein on the core tokens — close == same brand
function similar(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  // common substring of length >= 6 in both directions
  if (a.length >= 6 && b.includes(a)) return true;
  if (b.length >= 6 && a.includes(b)) return true;
  return false;
}

function classify(item) {
  const orig = rootDomain(item.website);
  const finalD = rootDomain(item.finalUrl);
  if (!orig || !finalD) return { verdict: 'judgment', reason: 'cannot parse domain' };

  const oCore = coreToken(orig);
  const fCore = coreToken(finalD);

  // Same root + only www vs. locations.* subdomain swap (franchise location moves)
  if (orig === finalD) {
    return { verdict: 'safe', reason: 'protocol/path-only change, same root' };
  }
  if (orig.replace(/^www\./, '') === finalD || finalD.replace(/^www\./, '') === orig) {
    return { verdict: 'safe', reason: 'www variant on same root' };
  }
  // .ca <-> .com on same brand token
  const oNoTld = orig.replace(/\.(ca|com|net|us|org)$/, '');
  const fNoTld = finalD.replace(/\.(ca|com|net|us|org)$/, '');
  if (oNoTld === fNoTld) {
    return { verdict: 'safe', reason: '.ca/.com variant on same brand' };
  }
  // Strong substring match: brand changed TLD or split
  if (similar(oCore, fCore)) {
    return { verdict: 'safe', reason: 'same brand token (' + oCore + ' <-> ' + fCore + ')' };
  }
  // Franchise location move: livehydrationspa.com -> locations.livehydrationspa.com
  if (finalD.includes(orig.replace(/^www\./, '')) || orig.includes(finalD.replace(/^locations\./, ''))) {
    return { verdict: 'safe', reason: 'franchise location subdomain move' };
  }
  return { verdict: 'judgment', reason: 'brand mismatch ' + oCore + ' -> ' + fCore };
}

(async () => {
  const scan = latestScan();
  const offDomain = scan.flagged.filter((r) => r.verdict === 'redirect_off_domain');
  console.log('Off-domain redirects to walk:', offDomain.length);

  const safe = [];
  const judgment = [];
  for (const item of offDomain) {
    const c = classify(item);
    if (c.verdict === 'safe') safe.push({ ...item, _reason: c.reason });
    else judgment.push({ ...item, _reason: c.reason });
  }

  console.log();
  console.log('=== ' + safe.length + ' SAFE auto-fix ===');
  for (const s of safe) {
    console.log('  ' + s.slug);
    console.log('    ' + s.website + '  ->  ' + s.finalUrl);
    console.log('    reason: ' + s._reason);
  }

  console.log();
  console.log('=== ' + judgment.length + ' JUDGMENT (operator review) ===');
  for (const j of judgment) {
    console.log('  ' + j.slug);
    console.log('    ' + j.website + '  ->  ' + j.finalUrl);
    console.log('    reason: ' + j._reason);
  }

  // Write plan to disk so the apply step can read the same list
  const planPath = path.join('scripts', '_receipts', 'redirect-categorize-plan.json');
  fs.writeFileSync(planPath, JSON.stringify({ safe, judgment }, null, 2));
  console.log();
  console.log('Plan written:', planPath);
})();
