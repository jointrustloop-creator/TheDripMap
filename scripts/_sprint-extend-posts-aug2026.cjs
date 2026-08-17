/**
 * Keyword sprint Aug 2026: extend 4 existing posts with operator-approved copy
 * (docs/content-engine/keyword-sprint-aug2026-copy-draft.md, approved 2026-08-16).
 *
 * Targets 1+2 (insurance), 3+4 (regulation), 11 (iron Oakville/GTA), plus the
 * cannibalization cross-link on the old Myers guide.
 *
 * Placement rules (the blog template parses FAQPage JSON-LD from the
 * "## Frequently asked questions" heading to end of content):
 *   - New H2 sections insert BEFORE the FAQ heading
 *   - New Q&A pairs insert as ### immediately AFTER the FAQ heading
 *
 * Idempotent: each edit carries a marker phrase; present = skipped.
 * Backups: docs/content-engine/_sprint-backups-2026-08-16.json (full originals).
 * Run with --dry to preview; no flag applies.
 */
require('dotenv').config({ path: '.env.local', override: true });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const DRY = process.argv.includes('--dry');
const BACKUP = path.join(__dirname, '..', 'docs', 'content-engine', '_sprint-backups-2026-08-16.json');

const FAQ_RE = /^##\s+Frequently asked questions\s*$/im;

const EDITS = [
  {
    slug: 'iv-therapy-insurance-coverage-canada',
    marker: 'Is IV therapy covered by OHIP?',
    beforeFaq: `## Is IV therapy covered by OHIP?

No. OHIP covers medically necessary IV treatment ordered in hospitals and other insured settings, but it does not cover elective IV vitamin drips at private wellness clinics. Those are out of pocket in Ontario, typically $100 to $350 per session across the clinic menus we track.

OHIP insures physician and hospital services that are medically necessary, per [Ontario's own coverage page](https://www.ontario.ca/page/what-ohip-covers). A vitamin drip you book yourself at a wellness clinic is an uninsured, elective service, so the clinic bills you directly. The exception is treatment a physician orders for a medical condition delivered in an insured setting, for example IV fluids in an emergency department. If a private clinic tells you OHIP covers their drip menu, ask them to put it in writing; we have never seen a case where it does. For what people actually pay, see our [IV price index](/iv-prices).

`,
    faqItems: `### Is IV therapy covered by RAMQ in Quebec?

No. [RAMQ](https://www.ramq.gouv.qc.ca/en) insures medically required care; elective vitamin drips at private clinics are not an insured service, so you pay out of pocket.

### Is IV therapy covered by MSP in British Columbia?

No. [MSP covers medically required services](https://www2.gov.bc.ca/gov/content/health/health-drug-coverage/msp/bc-residents/benefits/services-covered-by-msp) by enrolled practitioners; elective IV vitamin therapy at a private clinic is not covered.

`,
  },
  {
    slug: 'does-insurance-cover-iv-therapy-canada-2026',
    marker: 'What receipt should you ask the clinic for?',
    beforeFaq: `## What receipt should you ask the clinic for?

A claimable receipt shows: the clinic's legal name and address, the practitioner's full name, designation and registration number, the service date, the service description, and the amount. For Health Spending Account claims this is enough. For paramedical naturopath claims the receipt must name the ND. For the medical expense tax credit, [CRA accepts fees paid to an authorized practitioner](https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/lines-33099-33199-eligible-medical-expenses-you-claim-on-your-tax-return.html) in your province (NDs qualify in regulating provinces); the substances themselves generally do not qualify. Ask for the itemized version before you leave the clinic, chasing it later is harder.

`,
    faqItems: `### Does Sun Life cover iron infusions?

The prescribed iron itself may be claimable under a Sun Life drug plan and infusion fees vary by plan. Get the DIN from your prescriber and confirm with Sun Life before booking. Our [iron infusion guide](/blog/iron-infusion-canada-cost-coverage-2026) covers the hospital versus private clinic routes.

### Does Manulife cover iron infusions?

Same structure: when a physician prescribes iron, the drug portion may fall under your Manulife drug plan while clinic fees vary by plan. Confirm with the DIN before booking.

### Does Canada Life cover iron infusions?

Prescribed iron products may be claimable under a Canada Life drug plan; the private clinic's administration fee usually is not, unless your plan or HSA covers it. Confirm with the DIN first.

### Does Blue Cross cover iron infusions?

Blue Cross plans vary by region, but the pattern holds: the prescribed iron may be claimable under drug coverage, the elective clinic fee usually is not. Ask your regional Blue Cross with the DIN and the clinic's fee breakdown.

`,
  },
  {
    slug: 'who-can-legally-give-iv-canada-rules-by-province-2026',
    marker: 'Do you need a prescription for IV therapy in Canada?',
    beforeFaq: `## Do you need a prescription for IV therapy in Canada?

You do not bring your own prescription, but every legitimate IV drip must be ordered by an authorized prescriber: a physician, a nurse practitioner, or in some provinces a naturopathic doctor with IV certification. The clinic's prescriber issues that order, usually after a health screening at your visit.

IV vitamin preparations are substances administered by a procedure below the dermis, a controlled act. The person who orders the infusion must hold prescribing authority: MDs and NPs everywhere, and NDs where their college grants IV authority, for example Ontario NDs need IVIT certification with the [College of Naturopaths of Ontario](https://collegeofnaturopaths.on.ca) and must work within its permitted substances. What this means for you: a reputable clinic asks health questions before your first drip because its prescriber is accountable for the order. A clinic that hooks you up with no screening and no named prescriber is the red flag our [verification guide](/verification) teaches you to check.

## Can a nurse start an IV clinic in Ontario?

A nurse can own an IV therapy business in Ontario, but cannot run it on nursing authority alone. RNs and RPNs administer IVs under an order or medical directive; the drips must be prescribed by a physician, nurse practitioner, or an IVIT certified naturopathic doctor working with the clinic.

Ownership and clinical authority are separate questions. Nothing stops an RN from incorporating a clinic. But administering a substance by injection is a controlled act that nurses perform on the order of an authorized prescriber, under the [College of Nurses of Ontario](https://www.cno.org) medication and directives standards. In practice an Ontario IV clinic needs a named prescriber: a physician or NP who issues directives, or an ND holding IVIT certification, who can only prescribe within the college's permitted substances list. Clinics advertising nurse led services with no named prescriber are the single most common gap we find when we verify listings; our directory flags who prescribes at every [verified clinic](/verification).

`,
    faqItems: `### Can RPNs start IVs in Ontario?

RPNs may perform venipuncture and administer IV medication where they have the competencies and a proper order or directive, per [CNO standards](https://www.cno.org). The prescription authority still sits with the prescriber.

### Can I get an IV drip without seeing a doctor?

You will not necessarily see a physician in person, but a physician, NP, or authorized ND must order your infusion. Provinces differ on who qualifies; the province sections above list each.

### Can a nurse inject vitamins without a doctor involved?

No. An authorized prescriber must order the substance. A nurse working without any order is outside CNO standards, and it is the first thing to check before booking.

`,
  },
  {
    slug: 'iron-infusion-canada-cost-coverage-2026',
    marker: 'Where can you get an iron infusion in Oakville and the GTA?',
    beforeFaq: `## Where can you get an iron infusion in Oakville and the GTA?

Private iron infusion appointments in Oakville and the wider GTA are offered by specialized iron clinics and some naturopathic and medical IV clinics. You need a prescription and recent ferritin bloodwork; across the 3 Canadian clinic menus we track that publish an iron infusion price, prices run $185 to $350 before any consult fee.

What to bring: your prescription for the iron product and your recent bloodwork. Most clinics review the ferritin result before booking the chair. The hospital route remains the covered option when your situation is medically urgent, as covered above; the private route trades money for speed. On the insurance side, the prescribed iron itself may be claimable under your drug plan even when the clinic fee is not, see the insurer questions in our [insurance guide](/blog/does-insurance-cover-iv-therapy-canada-2026). To compare clinics, browse [Oakville](/cities/oakville) and [Toronto](/cities/toronto) listings, where verified clinics show who prescribes.

`,
    faqItems: `### Do I need a referral for a private iron infusion?

You need a prescription for the iron product; clinics tell you what bloodwork to bring. Some clinics offer a paid consult with their own prescriber if you arrive without one.

### How much does a private iron infusion cost in the GTA?

Across the 3 Canadian clinic menus we track that publish an iron infusion price, $185 to $350 plus any consult fee. The prescribed drug may be claimable under your drug plan; the clinic fee usually is not.

`,
  },
  {
    slug: 'myers-cocktail-iv-therapy-complete-guide',
    marker: 'full ingredient reference',
    beforeFaq: '',
    faqItems: '',
    appendEnd: `

Looking for the exact ingredient breakdown, typical amounts, and current Canadian prices? See our [full ingredient reference for the Myers cocktail](/blog/what-is-in-a-myers-cocktail).
`,
  },
];

async function main() {
  const backups = fs.existsSync(BACKUP) ? JSON.parse(fs.readFileSync(BACKUP, 'utf8')) : {};
  for (const e of EDITS) {
    const { data: p, error } = await s.from('blog_posts').select('slug,content').eq('slug', e.slug).single();
    if (error || !p) { console.error('FETCH FAIL', e.slug, error?.message); process.exitCode = 1; continue; }
    let c = p.content || '';
    if (c.includes(e.marker)) { console.log('skip (already applied):', e.slug); continue; }
    // Dash guard on the text we are inserting (house rule).
    const inserted = (e.beforeFaq || '') + (e.faqItems || '') + (e.appendEnd || '');
    if (/[‒–—―−]/.test(inserted)) { console.error('DASH in insert for', e.slug); process.exitCode = 1; continue; }

    const m = c.match(FAQ_RE);
    if (e.beforeFaq) {
      if (!m) { console.error('NO FAQ HEADING in', e.slug); process.exitCode = 1; continue; }
      const idx = c.search(FAQ_RE);
      c = c.slice(0, idx) + e.beforeFaq + c.slice(idx);
    }
    if (e.faqItems) {
      const m2 = c.match(FAQ_RE);
      const insertAt = c.search(FAQ_RE) + m2[0].length;
      c = c.slice(0, insertAt) + '\n\n' + e.faqItems.trimEnd() + '\n' + c.slice(insertAt);
    }
    if (e.appendEnd) c = c.trimEnd() + e.appendEnd;

    if (DRY) { console.log(`[dry] ${e.slug}: +${c.length - (p.content || '').length} chars`); continue; }
    if (!backups[e.slug]) backups[e.slug] = p.content;
    const { error: upErr } = await s.from('blog_posts').update({ content: c, last_updated: new Date().toISOString().slice(0, 10) }).eq('slug', e.slug);
    if (upErr) { console.error('UPDATE FAIL', e.slug, upErr.message); process.exitCode = 1; continue; }
    console.log(`applied: ${e.slug} (+${c.length - (p.content || '').length} chars)`);
  }
  if (!DRY) fs.writeFileSync(BACKUP, JSON.stringify(backups, null, 2));
}
main().catch((err) => { console.error('ERR', err.message); process.exit(1); });
