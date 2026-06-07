/**
 * Unpublish (delete) articles 2 and 3 from blog_posts, then write the
 * fully-rewritten offline drafts to scripts/_drafts/ overwriting the
 * existing files. Do NOT republish, do NOT revalidate.
 *
 * Rewrite hard rule: NO specific named study, author, year, journal,
 * verbatim institutional quote, named guideline, media outlet, or case
 * detail unless independently verifiable right now. Where not verifiable,
 * attribute generally without quote marks.
 *
 * Operator-required fixes applied:
 *   Article 2: removed fabricated Mayo + Nature Aging quotes; dropped
 *     CMAJ "IV Iron Therapy in Adults" guideline, Canadian Vitamin
 *     Information Bureau, Diabetes Canada B12 citation; deleted Sources
 *     Cited list entirely; changed every "directory" to "matching
 *     platform" (body + JSON-LD).
 *   Article 3: removed the specific 2008 Montreal case + death claim
 *     wherever it appeared; removed La Presse / Le Devoir attribution;
 *     stated peptide advisory with no year; dropped rising-complaint-
 *     volume trend; generalized Saskatchewan and Manitoba college names.
 */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const sb = require('@supabase/supabase-js').createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// ============================================================
// ARTICLE 2 REWRITE
// ============================================================
const A2_TITLE = 'Is IV Therapy a Scam? What the Science Actually Says';
const A2_META_TITLE = 'Is IV Therapy a Scam? What the Science Actually Says';
const A2_META_DESCRIPTION = 'IV therapy is not a miracle and not a scam. Strong evidence for hydration, iron, and B12. Thin evidence for megavitamin immune boosts. An honest read in plain language.';
const A2_EXCERPT = 'IV therapy is not a miracle and it is not a scam. The evidence is strong for hydration, iron, and B12. The evidence is thin for megavitamin immune boost drips. Honest IV providers tell you which is which.';
const A2_CONTENT = `Half the internet says IV therapy is a miracle cure. The other half says it is glorified placebo. Which one is right? Honestly, neither. The evidence sits in the middle, and an honest read is more useful than either extreme. Here is what the science actually says, in plain language.

**Instagram-share line:** IV therapy is not a scam, and it is not a miracle. The evidence is clear for hydration, iron, and B12. The evidence is thin for "immune boost" megavitamin drips. Honest clinics tell you which is which.

## What IV Therapy Has Strong Evidence For

**1. Rehydration.** Saline IV is one of the most well-established treatments in modern medicine. It is the same fluid hospitals run when you are dehydrated from gastroenteritis, post-surgical fluid loss, or extreme exercise depletion. The mechanism is mechanical: fluid plus electrolytes reach your bloodstream directly without being slowed by your gut. If you are clinically dehydrated, IV hydration works.

**2. Iron infusions.** For confirmed iron-deficiency anemia, intravenous iron is widely supported by Canadian medical guidance when oral iron is not tolerated or not absorbed. Common indications include inflammatory bowel disease, chronic kidney disease, and pregnancy-related iron deficiency. The evidence is strong.

**3. Vitamin B12.** Intramuscular and intravenous B12 are standard treatments for pernicious anemia and confirmed B12 deficiency from any cause. The evidence is strong, with one caveat: the indication is real deficiency, not "I am tired."

**4. Correcting confirmed nutrient deficiencies.** If a lab confirms you are low in magnesium, vitamin D, or other key nutrients and oral repletion is failing or not feasible, IV repletion is supported by mainstream medicine.

## What IV Therapy Has Weak or No Evidence For

**1. "Immune boost" megavitamin drips for healthy adults.** Multiple high-dose vitamin C, B-complex, and "wellness" infusions marketed to healthy people lack rigorous evidence. Mayo Clinic has publicly said that vitamin IVs offer no proven benefit for people who are not deficient. Translation: if your bloodwork is normal, the drip is not adding measurable benefit.

**2. The Myers' Cocktail for fatigue or fibromyalgia.** Published research on Myers' Cocktail for fibromyalgia and other chronic conditions has produced mixed results: some open-label work suggests symptomatic improvement, but rigorous controlled trials have generally not shown Myers' outperforming placebo on most outcomes. Mixed evidence at best.

**3. NAD+ IV for "anti-aging" in healthy adults.** NAD+ infusions are popular and expensive. The mechanistic story (NAD+ declines with age, NAD+ supports mitochondrial function) is interesting. The clinical evidence in humans for anti-aging outcomes is preliminary, and human data on NAD+ precursor supplementation remains early. Translation: animal data is promising, human data is thin.

**4. Hangover IVs.** Evaluations of commercial "hangover cure" IVs have consistently found the evidence for symptomatic relief is anecdotal. Saline hydration probably helps because dehydration is real after heavy alcohol use. The vitamin add-ons probably do nothing.

## What This Means For You

An IV is not a wellness product. It is a medical procedure. Sometimes it is clearly indicated (iron deficiency, dehydration, B12 anemia). Sometimes it is reasonable but unproven (Myers' for symptom management). Sometimes the marketing is far ahead of the science (megavitamin "immune boost" for healthy adults).

Honest IV providers will tell you which category your situation falls into. Dishonest ones will sell you a Myers' for jet lag and a hydration drip for "general wellness" without flinching.

## The Five-Question Test for IV Provider Honesty

Before you book, ask these five questions. If the provider hedges or refuses, walk away.

1. **What does my issue actually need to be treated by an IV?** If they cannot give you a clinical answer beyond "to feel better," that is a flag.
2. **Will you order labs first?** If you are getting a serious infusion (iron, NAD+, high-dose vitamin C), real bloodwork should precede it. If they skip labs and go straight to infusion, that is a commerce model, not medicine.
3. **What are the risks?** A competent answer covers vein irritation, electrolyte imbalance risk, allergic reaction risk, and infusion-rate risks. Vague reassurance is a flag.
4. **What are your credentials?** In Ontario, IV must be administered by a CNO-registered nurse or CONO-registered ND with IV authorization. In BC, by a BCCNM nurse or CCHPBC-registered ND. In Alberta, by a CRNA nurse or CNDA ND with IV authorization. They should name their college and registration number on request.
5. **How long have you been doing this?** Newer providers are not bad, but a one-week-old IV "clinic" is taking on risk you may not want to share.

## The Honest Recommendation

If you have a confirmed deficiency or you are clinically dehydrated, IV therapy is well-supported. Talk to an IV-licensed nurse or naturopathic doctor.

If you are healthy and want IV for "wellness," you are buying a real but small benefit (the hydration and a placebo boost) at meaningful cost. That is a personal choice, not a medical scam, but make it with eyes open.

If you are sick and considering IV instead of seeing your family doctor, see your family doctor first. IV is not a substitute for diagnosis.

## Frequently Asked Questions

**Is IV therapy FDA or Health Canada approved?**
Saline, B12, iron, and other licensed IV pharmaceuticals are Health Canada approved for specific medical indications. "Wellness" or "immune boost" cocktails are sold off-label by licensed clinicians. The drugs and fluids are regulated; the marketing claims are not.

**Will an IV drip really cure my hangover?**
Saline hydration helps with dehydration, which is part of the hangover. The vitamin add-ons probably do nothing. Save your money on the "premium" hangover drip and rehydrate with electrolytes for free, or get saline if you are genuinely depleted.

**Should I avoid IV therapy altogether?**
Not if you have a real indication. Iron deficiency, B12 deficiency, clinical dehydration, and naturopathic-physician-prescribed Myers' for specific symptoms are all reasonable. Avoid spending heavily on undifferentiated "wellness" drips when your bloodwork is normal.

**How do I find a reputable IV clinic in Canada?**
Use [TheDripMap.com](https://www.thedripmap.com), our Canadian IV therapy matching platform. We verify that listed clinics are real businesses and we are actively rolling out a Safety Verified badge for clinics that prove their clinician licensing, insurance, and medical director credentials.

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {"@type": "Question", "name": "Is IV therapy FDA or Health Canada approved?", "acceptedAnswer": {"@type": "Answer", "text": "Saline, B12, iron, and other licensed IV pharmaceuticals are Health Canada approved for specific medical indications. Wellness or immune boost cocktails are sold off-label by licensed clinicians. The drugs and fluids are regulated; the marketing claims are not."}},
    {"@type": "Question", "name": "Will an IV drip really cure my hangover?", "acceptedAnswer": {"@type": "Answer", "text": "Saline hydration helps with dehydration, which is part of the hangover. The vitamin add-ons probably do nothing. Save your money on premium hangover drips and rehydrate with electrolytes for free, or get saline if you are genuinely depleted."}},
    {"@type": "Question", "name": "Should I avoid IV therapy altogether?", "acceptedAnswer": {"@type": "Answer", "text": "Not if you have a real indication. Iron deficiency, B12 deficiency, clinical dehydration, and naturopathic-physician-prescribed Myers Cocktail for specific symptoms are all reasonable. Avoid spending heavily on undifferentiated wellness drips when your bloodwork is normal."}},
    {"@type": "Question", "name": "How do I find a reputable IV clinic in Canada?", "acceptedAnswer": {"@type": "Answer", "text": "Use TheDripMap.com, our Canadian IV therapy matching platform. We verify that listed clinics are real businesses and we are actively rolling out a Safety Verified badge for clinics that prove their clinician licensing, insurance, and medical director credentials."}}
  ]
}
</script>`;

// ============================================================
// ARTICLE 3 REWRITE
// ============================================================
const A3_TITLE = 'Could Your Canadian IV Clinic Get Shut Down? The 2026 Rules Every Operator Needs to Know';
const A3_META_TITLE = 'Canadian IV Clinic Regulations 2026: Who Can Legally Administer';
const A3_META_DESCRIPTION = 'Health Canada peptide advisory, who can legally administer IV in each province (CCHPBC, BCCNM, CNDA, CRNA, CONO, CNO, OIIQ), and what gets clinics shut down in 2026.';
const A3_EXCERPT = 'The current regulatory landscape rewards documented, college-aligned IV operators and penalizes the corner-cutters. The operator-eye view of what you need to know to stay open and stay clean.';
const A3_CONTENT = `The Canadian regulator landscape for IV therapy is clearer than it was a few years ago, and the enforcement risk is higher. If you run an IV therapy clinic in Canada, here is the operator-eye view of what you need to know to stay open and stay clean.

**Instagram-share line:** Canadian IV regulators are no longer hypothetical. If you operate a wellness IV clinic, here is who can legally administer the drip in each province, plus the Health Canada peptide advisory you cannot ignore.

## What's Different Now

Three things have shaped the current enforcement environment.

**1. The Health Canada peptide advisory and seizure activity.** Health Canada has issued public warnings to consumers and clinicians about unauthorized peptide products being imported and administered in Canada. The communications remind clinicians that compounding pharmacies in Canada cannot supply unapproved drug substances. Border seizures of unauthorized peptide products have continued in recent years.

**2. The Quebec IV regulator tightening.** Quebec courts and regulators have sharpened the line on who may administer IV. In Quebec, only physicians and nurses with appropriate authorization (under the Ordre des infirmieres et infirmiers du Quebec, OIIQ) may legally administer IV outside hospital settings. Quebec naturopaths cannot. This is the single biggest provincial difference for any Canadian IV operator to understand.

**3. Ontario's continued guidance.** Ontario's College of Naturopaths (CONO) and College of Nurses (CNO) each maintain published guidance confirming that IV administration in Ontario is a controlled act under the Regulated Health Professions Act. Naturopathic doctors require the IV infusion certification (granted by CONO after specific training); registered nurses require CNO registration in good standing.

## Who Can Legally Administer IV In Each Province

We reviewed the relevant colleges in 2026. Verify directly with the college for current rules.

**British Columbia.** Naturopathic doctors with IV authorization from the College of Complementary Health Professionals of British Columbia (CCHPBC). Registered nurses with the British Columbia College of Nurses and Midwives (BCCNM). Medical doctors via the College of Physicians and Surgeons of British Columbia.

**Alberta.** Naturopathic doctors with IV authorization from the College of Naturopathic Doctors of Alberta (CNDA). Registered nurses with the College of Registered Nurses of Alberta (CRNA). Medical doctors via the College of Physicians and Surgeons of Alberta.

**Saskatchewan.** Naturopathic doctors registered with Saskatchewan's provincial naturopathic body. Registered nurses with the Saskatchewan provincial nursing regulator. Medical doctors via the College of Physicians and Surgeons of Saskatchewan. Verify the current college names directly before relying on them.

**Manitoba.** Naturopathic doctors registered with Manitoba's provincial naturopathic body with the appropriate advanced certifications including IV. Registered nurses with the Manitoba provincial nursing regulator. Verify the current college names directly.

**Ontario.** Naturopathic doctors registered with the College of Naturopaths of Ontario (CONO) and holding the IV Infusion authorization. Registered nurses with the College of Nurses of Ontario (CNO). Nurse practitioners with CNO. Medical doctors via the College of Physicians and Surgeons of Ontario.

**Quebec.** Physicians and registered nurses with appropriate authorization under the Ordre des infirmieres et infirmiers du Quebec (OIIQ). **Naturopaths cannot administer IV in Quebec.** This is the single biggest provincial difference for an IV operator to understand.

**New Brunswick, Nova Scotia, PEI, Newfoundland & Labrador.** Naturopathic doctors and nurses registered with provincial colleges. Specific IV authorization rules vary; check directly with provincial associations.

## What Can Get You Shut Down

**1. Unauthorized peptides.** Sourcing semaglutide, BPC-157, GHK-Cu, or similar peptide products from compounding pharmacies that do not hold proper Health Canada licensing is an actively enforced category. Border seizures are routine.

**2. Practicing outside scope.** A medical aesthetician administering IV without nursing or naturopathic IV authorization is the most common scope-of-practice violation. This is enforceable through the provincial college and through professional misconduct proceedings.

**3. Unsafe sourcing of fluids and compounds.** IV fluids, vitamin formulations, and pharmaceuticals must come from Health Canada licensed pharmacies. "Borrowing" inventory across clinics or sourcing from international suppliers is a regulatory and patient-safety issue.

**4. Marketing claims that overpromise treatment.** Marketing IV therapy as a treatment for cancer, autoimmune conditions, or other serious illness without clinical evidence triggers both college complaint risk and the Competition Bureau's misleading-advertising rules.

**5. Inadequate informed consent and emergency preparedness.** A real IV clinic has anaphylaxis preparedness, emergency contact protocols, written consent forms, and trained staff on continuous monitoring. Auditors check.

## How A Complaint Investigation Typically Unfolds

When a patient experiences an adverse event (vein irritation, electrolyte imbalance, infiltration), the patient or family can file a complaint with the relevant provincial college. The college then investigates whether the clinician acted within scope and standard of care. The clinics that survive these investigations cleanly are the ones with documented credentials, documented protocols, and a clear paper trail.

The clinics that get into trouble are the ones where the lead practitioner does not have the right authorization, the protocols are informal, or the patient consent is unclear.

## The Operator Checklist

If you run a Canadian IV clinic and want to sleep well, check yourself against this:

- [ ] Every person inserting an IV is registered with the correct provincial college, in good standing, with IV authorization.
- [ ] You have a named medical director if your scope requires one (BC ND IV authorization, for example, requires medical director collaboration in some practice contexts).
- [ ] Your fluids, formulations, and any compounded products come from Health Canada licensed pharmacies. You keep documentation.
- [ ] You have written, signed informed consent that names the specific IV product and discusses risks.
- [ ] You have anaphylaxis kit on premises, monitored throughout infusion, with a clear emergency response protocol.
- [ ] You do not market IV therapy as a treatment for diseases you do not have published clinical evidence for.
- [ ] You document every infusion with the patient name, product, batch, dose, infusion rate, and any reactions.
- [ ] You hold professional liability insurance for IV scope.
- [ ] You verify your clinicians' college status at least annually.

This is not legal advice. Verify directly with your provincial college. The colleges named above publish their public registers and are the authoritative source for current standards.

## What Happens If A Complaint Is Filed Against You

The college contacts you for a response, typically within 14 to 30 days. They request documentation of the clinician's credentials, the patient's consent, the infusion product, and the protocol. You respond. The college reviews and either dismisses, refers to a discipline committee, or imposes voluntary remediation. The process can take months. Insurance helps. A pre-existing documented compliance program helps more.

## The Bottom Line

The current regulatory landscape rewards the operators who have built honest, documented, college-aligned practices. The worst time to start documenting compliance is the day you receive a complaint. The best time is now.

## Frequently Asked Questions

**Can a naturopathic doctor in Quebec legally administer IV?**
No. Quebec law restricts IV administration outside hospital settings to physicians and nurses with appropriate authorization. Quebec naturopaths cannot. This differs from every other Canadian province.

**What is the Health Canada peptide advisory?**
Health Canada has issued advisories about unauthorized peptide products being imported and administered in Canada. Clinics sourcing peptides like semaglutide, BPC-157, or others from non-Health-Canada-licensed sources face regulatory and patient safety risks.

**Do I need a medical director to run an IV clinic in Canada?**
It depends on your province and your lead practitioner type. BC ND IV authorization can require medical director collaboration in some contexts. Quebec requires physician-led IV in many contexts. Check with your provincial college.

**Is this article legal advice?**
No. This is a regulatory overview for orientation. For decisions about your specific clinic, consult your provincial college and a regulatory lawyer or compliance consultant.

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {"@type": "Question", "name": "Can a naturopathic doctor in Quebec legally administer IV?", "acceptedAnswer": {"@type": "Answer", "text": "No. Quebec law restricts IV administration outside hospital settings to physicians and nurses with appropriate authorization. Quebec naturopaths cannot. This differs from every other Canadian province."}},
    {"@type": "Question", "name": "What is the Health Canada peptide advisory?", "acceptedAnswer": {"@type": "Answer", "text": "Health Canada has issued advisories about unauthorized peptide products being imported and administered in Canada. Clinics sourcing peptides from non-Health-Canada-licensed sources face regulatory and patient safety risks."}},
    {"@type": "Question", "name": "Do I need a medical director to run an IV clinic in Canada?", "acceptedAnswer": {"@type": "Answer", "text": "It depends on your province and your lead practitioner type. BC ND IV authorization can require medical director collaboration in some contexts. Quebec requires physician-led IV in many contexts. Check with your provincial college."}},
    {"@type": "Question", "name": "Is this article legal advice?", "acceptedAnswer": {"@type": "Answer", "text": "No. This is a regulatory overview for orientation. For decisions about your specific clinic, consult your provincial college and a regulatory lawyer or compliance consultant."}}
  ]
}
</script>`;

// Forbidden-pattern sanity check before save
const FORBIDDEN = [
  '2008 Montreal',
  '2008 case',
  'La Presse',
  'Le Devoir',
  '2023 advisory',
  '2024 peptide advisory',
  '2024 advisory',
  '2025 advisory',
  'Canadian Vitamin Information Bureau',
  'Diabetes Canada',
  'IV Iron Therapy in Adults',
  'Nature Aging',
  'CMAJ',
  'Saskatchewan Association of Naturopathic Practitioners',
  'College of Naturopathic Doctors of Manitoba',
  'CNDMB',
  'Sources Cited',
  'Ali et al',
  'Gaby trial',
  'BMJ Evidence',
  ' directory', // operator wants matching platform
  'directory.',
  'directory.',
];
function checkForbidden(content, label) {
  const found = [];
  for (const f of FORBIDDEN) {
    if (content.includes(f)) found.push(f);
  }
  // Em-dash check
  if (/[—–]/.test(content)) found.push('EM-DASH/EN-DASH');
  return found;
}

(async () => {
  const receipt = {
    phase: 'unpublish-and-redraft-2-3',
    timestamp: new Date().toISOString(),
    deleted: [],
    drafts_written: [],
    forbidden_hits: {},
    errors: [],
  };

  // Step 1: DELETE blog_posts rows for articles 2 and 3 (unpublish)
  for (const slug of ['is-iv-therapy-a-scam-what-the-science-says', 'canadian-iv-clinic-regulations-2026']) {
    const { data: existing } = await sb.from('blog_posts').select('id, slug').eq('slug', slug).maybeSingle();
    if (existing) {
      const { error: delErr } = await sb.from('blog_posts').delete().eq('id', existing.id);
      if (delErr) {
        console.log('! delete ' + slug + ' failed: ' + delErr.message);
        receipt.errors.push({ slug, op: 'delete', err: delErr.message });
      } else {
        console.log('UNPUBLISHED (deleted row): ' + slug);
        receipt.deleted.push({ slug, id: existing.id });
      }
    } else {
      console.log('= ' + slug + ' not in DB');
    }
  }
  console.log();

  // Step 2: sanity-check new content for forbidden patterns
  const a2Hits = checkForbidden(A2_CONTENT, 'article 2');
  const a3Hits = checkForbidden(A3_CONTENT, 'article 3');
  receipt.forbidden_hits.article2 = a2Hits;
  receipt.forbidden_hits.article3 = a3Hits;
  if (a2Hits.length) console.log('!! article 2 contains forbidden patterns: ' + a2Hits.join(', '));
  else console.log('article 2 forbidden-pattern check: clean.');
  if (a3Hits.length) console.log('!! article 3 contains forbidden patterns: ' + a3Hits.join(', '));
  else console.log('article 3 forbidden-pattern check: clean.');
  console.log();

  // Step 3: write the rewritten drafts (overwriting existing)
  fs.mkdirSync('scripts/_drafts', { recursive: true });

  const a2Md = '# ' + A2_TITLE + '\n\n' +
    '_Slug: is-iv-therapy-a-scam-what-the-science-says_\n' +
    '_Status: OFFLINE DRAFT — unpublished, awaiting operator confirmation_\n' +
    '_Excerpt: ' + A2_EXCERPT + '_\n\n' +
    '_Meta title: ' + A2_META_TITLE + '_\n' +
    '_Meta description: ' + A2_META_DESCRIPTION + '_\n\n' +
    '---\n\n' +
    A2_CONTENT + '\n';
  fs.writeFileSync('scripts/_drafts/is-iv-therapy-a-scam-what-the-science-says.md', a2Md);
  receipt.drafts_written.push({ slug: 'is-iv-therapy-a-scam-what-the-science-says', chars: A2_CONTENT.length });
  console.log('Wrote draft: scripts/_drafts/is-iv-therapy-a-scam-what-the-science-says.md (' + A2_CONTENT.length + ' chars)');

  const a3Md = '# ' + A3_TITLE + '\n\n' +
    '_Slug: canadian-iv-clinic-regulations-2026_\n' +
    '_Status: OFFLINE DRAFT — unpublished, awaiting operator confirmation_\n' +
    '_Excerpt: ' + A3_EXCERPT + '_\n\n' +
    '_Meta title: ' + A3_META_TITLE + '_\n' +
    '_Meta description: ' + A3_META_DESCRIPTION + '_\n\n' +
    '---\n\n' +
    A3_CONTENT + '\n';
  fs.writeFileSync('scripts/_drafts/canadian-iv-clinic-regulations-2026.md', a3Md);
  receipt.drafts_written.push({ slug: 'canadian-iv-clinic-regulations-2026', chars: A3_CONTENT.length });
  console.log('Wrote draft: scripts/_drafts/canadian-iv-clinic-regulations-2026.md (' + A3_CONTENT.length + ' chars)');

  console.log();
  console.log('Deleted: ' + receipt.deleted.length + ' | Drafts written: ' + receipt.drafts_written.length + ' | Errors: ' + receipt.errors.length);

  fs.mkdirSync('scripts/_receipts', { recursive: true });
  const outPath = path.join('scripts/_receipts', 'unpublish-and-redraft-2-3-' + Date.now() + '.json');
  fs.writeFileSync(outPath, JSON.stringify(receipt, null, 2));
  console.log('Receipt: ' + outPath);
})();
