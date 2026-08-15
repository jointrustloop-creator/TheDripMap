// QA pass over menu-capture staging (found in review: spa services like peels
// matched the loose 'beauty' synonyms; nav/CTA fragments scored high).
// Cleans names and RE-GRADES: rejected rows keep their data + a reason, so the
// filter itself is auditable. Writes staging in place.
const fs = require('fs');
const F = '.audit-tmp/_menu-capture.json';
const d = JSON.parse(fs.readFileSync(F, 'utf8'));

const NOT_A_DRIP = /peel|facial|laser|botox|filler|microneedl|manicure|pedicure|massage|wax|lash|brow|tattoo|hydrafacial|dermaplan|prp face/i;
const JUNK = /^(cost at|pricing at|how much|why choose)|👉|book your|call us|learn more|read more/i;
const IV_CONTEXT = /\biv\b|drip|infusion|inject|cocktail|bag\b/i;

let cleaned = 0, rejected = 0, kept = 0;
for (const c of d) {
  for (const drip of c.drips || []) {
    // clean breadcrumb prefixes ("Home / Treatments / X" -> "X")
    const before = drip.published_name;
    drip.published_name = drip.published_name.replace(/^(home|treatments|services)(\s*\/\s*[^/]*)*\/\s*/i, '').trim();
    if (drip.published_name !== before) cleaned++;
    if (drip.confidence !== 'high') continue;
    const hay = drip.published_name + ' ' + (drip.verbatim_snippet || '');
    let reason = null;
    if (NOT_A_DRIP.test(drip.published_name)) reason = 'spa_service_not_a_drip';
    else if (JUNK.test(drip.published_name)) reason = 'nav_or_cta_fragment';
    else if (drip.formula_id === 'beauty' && !IV_CONTEXT.test(hay) && (drip.ingredients || []).length === 0) {
      // 'beauty' is the noisy class: require IV context OR at least one
      // detected ingredient to stay high.
      reason = 'beauty_match_without_iv_context';
    }
    if (reason) { drip.confidence = 'rejected'; drip.reject_reason = reason; rejected++; }
    else kept++;
  }
}
fs.writeFileSync(F, JSON.stringify(d, null, 2));
console.log(`cleaned ${cleaned} names; high-confidence: ${kept} kept, ${rejected} rejected (reasons recorded)`);
for (const c of d) {
  const k = (c.drips || []).filter((x) => x.confidence === 'high');
  if (k.length) console.log(`  ${c.slug}: ${k.length} high -> ` + k.map((x) => `"${x.published_name.slice(0, 40)}" ${x.price_raw || ''}`).join(' | '));
}
