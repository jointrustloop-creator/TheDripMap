/**
 * Canada-22 editorial pass: add a "Who can legally administer IV in
 * [Province]" callout to the 20 Canada-targeted blog posts that discuss
 * regulation without naming the relevant provincial regulator.
 *
 * Per-province callouts use verified college names (CCHPBC/BCCNM/CNDA/
 * CRNA/CONO/CNO/OIIQ - all confirmed from CLAUDE.md and prior research).
 *
 * Inserts the callout just BEFORE the "## Frequently Asked Questions"
 * section so it reads as a natural educational block. If no FAQ heading
 * is found, appends just before the last h2 section.
 *
 * Idempotent: skip if the post already contains its province's primary
 * regulator (CONO for Ontario, CCHPBC for BC, etc).
 *
 * 2 pricing-flagged posts (who-can-legally-give-iv-canada-rules-by-
 * province-2026, iv-therapy-laws-canada-province-by-province-2026) are
 * not in this list - they are laws posts that already name regulators
 * and just lack CAD pricing figures (not the issue we are fixing).
 */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const sb = require('@supabase/supabase-js').createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// ============================================================
// PROVINCE CALLOUT TEMPLATES
// ============================================================
const ON_CALLOUT = `## Who Can Legally Administer IV in Ontario

IV administration in Ontario is a controlled act under the Regulated Health Professions Act. The clinicians authorized to perform it are:

- **Registered nurses (RNs) and nurse practitioners (NPs)** registered with the College of Nurses of Ontario (CNO).
- **Naturopathic doctors (NDs)** registered with the College of Naturopaths of Ontario (CONO) and holding the IV Infusion authorization, a separate certification granted after specific training.
- **Medical doctors (MDs)** registered with the College of Physicians and Surgeons of Ontario.

Before booking, ask any clinic to name the college their practitioner is registered with. A reputable clinic answers immediately. For the full regulatory landscape across Canada, read our [Canadian IV clinic regulations 2026 guide](https://www.thedripmap.com/blog/canadian-iv-clinic-regulations-2026).

`;

const AB_CALLOUT = `## Who Can Legally Administer IV in Alberta

In Alberta, the clinicians authorized to administer IV therapy are:

- **Registered nurses (RNs) and nurse practitioners (NPs)** registered with the College of Registered Nurses of Alberta (CRNA).
- **Naturopathic doctors (NDs)** registered with the College of Naturopathic Doctors of Alberta (CNDA) and holding the IV authorization.
- **Medical doctors (MDs)** registered with the College of Physicians and Surgeons of Alberta.

Before booking, ask any clinic to name the college their practitioner is registered with. A reputable clinic answers immediately. For the full regulatory landscape across Canada, read our [Canadian IV clinic regulations 2026 guide](https://www.thedripmap.com/blog/canadian-iv-clinic-regulations-2026).

`;

const QC_CALLOUT = `## Who Can Legally Administer IV in Quebec

Quebec restricts IV administration outside hospital settings to:

- **Physicians (MDs)** licensed by the Collège des médecins du Québec.
- **Registered nurses (RNs)** with appropriate authorization under the Ordre des infirmières et infirmiers du Québec (OIIQ).

This is the single biggest provincial difference for IV operators and patients to understand: **naturopaths cannot legally administer IV in Quebec**, unlike every other Canadian province. Before booking, confirm your provider is an OIIQ-registered nurse or a licensed physician. For the full regulatory landscape across Canada, read our [Canadian IV clinic regulations 2026 guide](https://www.thedripmap.com/blog/canadian-iv-clinic-regulations-2026).

`;

const BC_CALLOUT = `## Who Can Legally Administer IV in British Columbia

In British Columbia, the clinicians authorized to administer IV therapy are:

- **Registered nurses (RNs) and nurse practitioners (NPs)** registered with the British Columbia College of Nurses and Midwives (BCCNM).
- **Naturopathic doctors (NDs)** registered with the College of Complementary Health Professionals of British Columbia (CCHPBC) and holding the IV infusion authorization.
- **Medical doctors (MDs)** registered with the College of Physicians and Surgeons of British Columbia.

Before booking, ask any clinic to name the college their practitioner is registered with. A reputable clinic answers immediately. For the full regulatory landscape across Canada, read our [Canadian IV clinic regulations 2026 guide](https://www.thedripmap.com/blog/canadian-iv-clinic-regulations-2026).

`;

const CANADA_CALLOUT = `## Who Can Legally Administer IV In Canada

IV administration is a regulated medical procedure in every Canadian province. The colleges authorized to certify IV practitioners vary by jurisdiction:

- **British Columbia:** BCCNM (nurses), CCHPBC (naturopathic doctors with IV authorization), College of Physicians and Surgeons of BC.
- **Alberta:** CRNA (nurses), CNDA (naturopathic doctors with IV authorization), College of Physicians and Surgeons of Alberta.
- **Ontario:** CNO (nurses and NPs), CONO (naturopathic doctors with the IV Infusion authorization), CPSO (medical doctors).
- **Quebec:** OIIQ (nurses with authorization) and physicians only - **naturopaths cannot administer IV in Quebec**.
- **Other provinces:** Each maintains its own provincial nursing and naturopathic colleges - verify your provider with the correct provincial body.

Before booking, ask the clinic to name the college their practitioner is registered with. A reputable clinic answers immediately. For the full regulatory landscape, read our [Canadian IV clinic regulations 2026 guide](https://www.thedripmap.com/blog/canadian-iv-clinic-regulations-2026).

`;

// ============================================================
// POST -> PROVINCE MAPPING
// ============================================================
const POSTS_TO_FIX = [
  // Ontario (13 posts)
  { slug: 'nad-plus-therapy-toronto-guide', callout: ON_CALLOUT, checkFor: 'CONO' },
  { slug: 'iv-therapy-north-york', callout: ON_CALLOUT, checkFor: 'CONO' },
  { slug: 'glutathione-iv-therapy-toronto', callout: ON_CALLOUT, checkFor: 'CONO' },
  { slug: 'iv-therapy-mississauga', callout: ON_CALLOUT, checkFor: 'CONO' },
  { slug: 'iv-therapy-yorkville-toronto', callout: ON_CALLOUT, checkFor: 'CONO' },
  { slug: 'iv-therapy-insurance-ontario', callout: ON_CALLOUT, checkFor: 'CONO' },
  { slug: 'iv-therapy-oakville', callout: ON_CALLOUT, checkFor: 'CONO' },
  { slug: 'mobile-iv-therapy-toronto-gta', callout: ON_CALLOUT, checkFor: 'CONO' },
  { slug: 'myers-cocktail-toronto', callout: ON_CALLOUT, checkFor: 'CONO' },
  { slug: 'iv-therapy-greater-toronto-area', callout: ON_CALLOUT, checkFor: 'CONO' },
  { slug: 'best-iv-therapy-ottawa-2026', callout: ON_CALLOUT, checkFor: 'CONO' },
  { slug: 'hangover-iv-therapy-toronto', callout: ON_CALLOUT, checkFor: 'CONO' },
  { slug: 'iv-therapy-toronto-complete-guide', callout: ON_CALLOUT, checkFor: 'CONO' },
  // Alberta (2 posts)
  { slug: 'best-iv-therapy-edmonton-2026', callout: AB_CALLOUT, checkFor: 'CNDA' },
  { slug: 'best-iv-therapy-calgary-2026', callout: AB_CALLOUT, checkFor: 'CNDA' },
  // Quebec (1 post)
  { slug: 'best-iv-therapy-montreal-2026', callout: QC_CALLOUT, checkFor: 'OIIQ' },
  // British Columbia (1 post)
  { slug: 'best-iv-therapy-vancouver-2026', callout: BC_CALLOUT, checkFor: 'CCHPBC' },
  // Canada-wide (4 posts)
  { slug: 'iv-therapy-cost-canada-2026', callout: CANADA_CALLOUT, checkFor: 'CONO' },
  { slug: 'iv-therapy-canada-complete-guide-2026', callout: CANADA_CALLOUT, checkFor: 'CONO' },
  { slug: 'iv-therapy-insurance-coverage-canada', callout: CANADA_CALLOUT, checkFor: 'CONO' },
];

function insertCallout(content, callout) {
  // Prefer inserting just before the FAQ section.
  const faqMatch = content.match(/##\s+Frequently\s+Asked\s+Questions/i);
  if (faqMatch) {
    const idx = faqMatch.index;
    return content.slice(0, idx) + callout + content.slice(idx);
  }
  // Else, insert just before the last "## " heading (often the conclusion).
  const lastH2 = content.lastIndexOf('\n## ');
  if (lastH2 > -1) {
    return content.slice(0, lastH2 + 1) + callout + content.slice(lastH2 + 1);
  }
  // Else append at end.
  return content.trimEnd() + '\n\n' + callout;
}

(async () => {
  const receipt = { phase: 'canada-regulator-editorial', timestamp: new Date().toISOString(), updated: [], skipped: [], not_found: [], errors: [] };

  for (const target of POSTS_TO_FIX) {
    const { data: row } = await sb.from('blog_posts').select('id, slug, content').eq('slug', target.slug).maybeSingle();
    if (!row) {
      console.log('? not found: ' + target.slug);
      receipt.not_found.push(target.slug);
      continue;
    }
    const c = row.content || '';
    if (c.includes(target.checkFor)) {
      console.log('= already has ' + target.checkFor + ': ' + target.slug);
      receipt.skipped.push({ slug: target.slug, reason: 'already has ' + target.checkFor });
      continue;
    }
    const newContent = insertCallout(c, target.callout);
    if (newContent === c) {
      console.log('!! no change applied: ' + target.slug);
      receipt.errors.push({ slug: target.slug, error: 'insertion did not change content' });
      continue;
    }
    const { error } = await sb.from('blog_posts').update({
      content: newContent,
      last_updated: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    }).eq('id', row.id);
    if (error) {
      console.log('!! ' + target.slug + ': ' + error.message);
      receipt.errors.push({ slug: target.slug, error: error.message });
      continue;
    }
    const province = target.callout === ON_CALLOUT ? 'ON' : target.callout === AB_CALLOUT ? 'AB' : target.callout === QC_CALLOUT ? 'QC' : target.callout === BC_CALLOUT ? 'BC' : 'CA';
    receipt.updated.push({ slug: target.slug, province, added_chars: newContent.length - c.length });
    console.log('+ ' + target.slug.padEnd(50) + ' [' + province + '] +' + (newContent.length - c.length) + ' chars');
  }

  console.log();
  console.log('Updated: ' + receipt.updated.length + ' | Skipped: ' + receipt.skipped.length + ' | Not found: ' + receipt.not_found.length + ' | Errors: ' + receipt.errors.length);

  fs.mkdirSync('scripts/_receipts', { recursive: true });
  const outPath = path.join('scripts/_receipts', 'canada-regulator-editorial-' + Date.now() + '.json');
  fs.writeFileSync(outPath, JSON.stringify(receipt, null, 2));
  console.log('Receipt: ' + outPath);
})();
