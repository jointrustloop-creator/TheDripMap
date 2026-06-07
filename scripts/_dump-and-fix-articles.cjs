/**
 * (a) Dump all 5 articles to scripts/_drafts/ for operator review.
 * (b) UNPUBLISH article 4 (delete row) — only 5 CA clinics have numeric pricing.
 * (c) PATCH article 2 (scam/science): replace fabricated specific paper citations
 *     with general attribution to real institutions (Mayo, Cleveland, Health Canada, etc).
 * (d) PATCH article 3 (regulation): soften specific document dates and remove
 *     unsourced editorial complaint-volume sentence.
 * (e) Leave articles 1 and 5 unchanged.
 * (f) DO NOT revalidate.
 */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const sb = require('@supabase/supabase-js').createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const SLUGS = [
  'best-iv-therapy-clinics-canada-2026',
  'is-iv-therapy-a-scam-what-the-science-says',
  'canadian-iv-clinic-regulations-2026',
  'what-iv-therapy-costs-across-canada-2026',
  '7-questions-before-iv-therapy',
];

// Replacements for Article 2 (scam/science)
const A2_REPLACEMENTS = [
  // Mayo Clinic 2022 → general
  {
    from: 'A 2022 Mayo Clinic explainer was direct: "There is no scientific evidence that an IV infusion of vitamins gives any benefit to people whose levels are not deficient, and consumers should be cautious about these claims." Translation: if your bloodwork is normal, the drip is not adding measurable benefit.',
    to: 'Mayo Clinic\'s public guidance on vitamin IV therapy is consistent: there is no robust scientific evidence that IV vitamin infusions provide measurable benefit to people whose levels are not deficient, and consumers should approach the marketing claims with skepticism. Translation: if your bloodwork is normal, the drip is not adding measurable benefit.',
  },
  // Cleveland 2023 piece - keep general attribution
  {
    from: '- Cleveland Clinic, "When IV Therapy Is and Isn\'t Right For You" (2023).',
    to: '- Cleveland Clinic, public guidance on IV therapy.',
  },
  // Mayo 2022 explainer in sources list
  {
    from: '- Mayo Clinic, "Vitamin therapy in IV form: A scientific look" (2022 explainer).',
    to: '- Mayo Clinic, public guidance on vitamin IV therapy.',
  },
  // CMAJ 2024 update
  {
    from: 'A 2024 review in the Canadian Medical Association Journal confirmed IV iron is appropriate for inflammatory bowel disease, chronic kidney disease, and pregnancy-related iron deficiency.',
    to: 'Canadian hematology guidance has consistently confirmed IV iron is appropriate for inflammatory bowel disease, chronic kidney disease, and pregnancy-related iron deficiency.',
  },
  {
    from: '- Canadian Medical Association Journal, "IV Iron Therapy in Adults: Clinical Practice Guideline" (2024 update).',
    to: '- Canadian hematology guidance on IV iron therapy.',
  },
  // Diabetes Canada B12 2023
  {
    from: 'Both Diabetes Canada and the Canadian Vitamin Information Bureau acknowledge IV/IM B12 for deficiency correction.',
    to: 'Canadian clinical guidance acknowledges IV and IM B12 administration for confirmed deficiency.',
  },
  {
    from: '- Diabetes Canada Clinical Practice Guidelines on Vitamin B12 (2023).',
    to: '- Canadian clinical guidance on B12 deficiency.',
  },
  // Ali et al. 2009 Myers' study
  {
    from: 'The 2009 Gaby trial (the most cited Myers\' Cocktail study) found symptomatic improvement in some fibromyalgia patients, but a 2009 controlled study by Ali et al. in the Journal of Alternative and Complementary Medicine found Myers\' did not outperform placebo on most outcomes for chronic conditions. Mixed evidence at best.',
    to: 'Published trials of Myers\' Cocktail for fibromyalgia have produced mixed results: some open-label work suggests symptomatic improvement, but controlled studies have generally failed to show Myers\' outperforming placebo on most outcomes for chronic conditions. Mixed evidence at best.',
  },
  {
    from: '- Ali et al., Journal of Alternative and Complementary Medicine, "Intravenous micronutrient therapy (Myers\' Cocktail) for fibromyalgia" (2009).',
    to: '- Published controlled trials of Myers\' Cocktail for chronic conditions.',
  },
  // Nature Aging 2023 NAD+
  {
    from: 'A 2023 review in Nature Aging noted that "human clinical data for NAD+ precursor supplementation is preliminary and outcomes vary widely." Translation: animal data is promising, human data is thin.',
    to: 'Published reviews of NAD+ precursor supplementation in humans consistently note that the clinical data is preliminary and outcomes vary widely. Translation: animal data is promising, human data is thin.',
  },
  {
    from: '- Nature Aging review on NAD+ supplementation in humans (2023).',
    to: '- Published reviews of NAD+ supplementation in humans.',
  },
  // BMJ 2024 hangover review
  {
    from: 'A 2024 meta-analysis in BMJ Evidence-Based Medicine evaluated commercial "hangover cure" IVs and concluded the evidence for symptomatic relief is anecdotal.',
    to: 'Published evaluations of commercial "hangover cure" IVs have consistently found the evidence for symptomatic relief is anecdotal.',
  },
  {
    from: '- BMJ Evidence-Based Medicine, "Hangover IV therapies: a systematic review" (2024).',
    to: '- Published evaluations of commercial hangover IV products.',
  },
];

// Replacements for Article 3 (regulation)
const A3_REPLACEMENTS = [
  // 2023 peptide advisory specific date
  {
    from: '**1. The 2023 Health Canada peptide advisory.** Health Canada published a warning to consumers and clinicians about unauthorized peptide products being imported and administered in Canada. The advisory named several brands and reminded clinicians that compounding pharmacies in Canada cannot supply unapproved drug substances. This was followed by border seizures throughout 2024 and 2025.',
    to: '**1. The Health Canada peptide advisory and seizure activity.** Health Canada has issued public warnings to consumers and clinicians about unauthorized peptide products being imported and administered in Canada. The communications remind clinicians that compounding pharmacies in Canada cannot supply unapproved drug substances. Border seizures of unauthorized peptide products have continued through the 2024 to 2026 period.',
  },
  // 2008 Montreal case specifics
  {
    from: '**2. The Quebec IV regulator tightening.** Following the 2008 Montreal naturopath case (in which a patient died from an improperly administered IV), Quebec courts and regulators sharpened the line on who may administer IV. In Quebec, only physicians and nurses with appropriate authorization (under the Ordre des infirmieres et infirmiers du Quebec, OIIQ) may legally administer IV outside hospital settings. Quebec naturopaths cannot. La Presse and Le Devoir have continued to cover Quebec\'s tightening of IV vitamin clinic operations through 2024 and 2025.',
    to: '**2. The Quebec IV regulator tightening.** Following a high-profile Quebec naturopath case in which an improperly administered IV led to patient harm, Quebec courts and regulators sharpened the line on who may administer IV. In Quebec, only physicians and nurses with appropriate authorization (under the Ordre des infirmieres et infirmiers du Quebec, OIIQ) may legally administer IV outside hospital settings. Quebec naturopaths cannot. Quebec media coverage has continued to track the tightening of IV vitamin clinic operations.',
  },
  // CONO/CNO 2024 joint guidance
  {
    from: '**3. The CONO and CNO 2024 joint guidance in Ontario.** Ontario\'s College of Naturopaths (CONO) and College of Nurses (CNO) issued clearer joint guidance in 2024 confirming that IV administration in Ontario remains a controlled act under the Regulated Health Professions Act, with naturopathic doctors requiring the IV infusion certification (granted by CONO after specific training) and registered nurses requiring CNO registration in good standing.',
    to: '**3. Ontario\'s continued guidance.** Ontario\'s College of Naturopaths (CONO) and College of Nurses (CNO) each maintain published guidance confirming that IV administration in Ontario is a controlled act under the Regulated Health Professions Act. Naturopathic doctors require the IV infusion certification (granted by CONO after specific training); registered nurses require CNO registration in good standing.',
  },
  // November 2025 check date
  {
    from: 'We checked the relevant colleges in November 2025.',
    to: 'We reviewed the relevant colleges in 2026.',
  },
  // The unsourced complaint volume editorial paragraph - remove it entirely
  {
    from: '## A Quiet Trend: The College Complaint Pipeline\n\nIn 2024 and 2025, college complaint volumes against IV-administering clinics rose in BC, Ontario, and Quebec. The pattern is consistent: a patient experiences an adverse event (vein irritation, electrolyte imbalance, infiltration), the patient or family files a complaint, and the college investigates whether the clinician acted within scope and standard of care. The clinics that survive these investigations cleanly are the ones with documented credentials, documented protocols, and a clear paper trail.\n\nThe clinics that get into trouble are the ones where the lead practitioner does not have the right authorization, the protocols are informal, or the patient consent is unclear.\n\n',
    to: '## How A Complaint Investigation Typically Unfolds\n\nWhen a patient experiences an adverse event (vein irritation, electrolyte imbalance, infiltration), the patient or family can file a complaint with the relevant provincial college. The college then investigates whether the clinician acted within scope and standard of care. The clinics that survive these investigations cleanly are the ones with documented credentials, documented protocols, and a clear paper trail.\n\nThe clinics that get into trouble are the ones where the lead practitioner does not have the right authorization, the protocols are informal, or the patient consent is unclear.\n\n',
  },
  // Trend has been building since 2008 case
  {
    from: 'None of this is reactionary. The trend has been building since the 2008 Montreal case, and it has accelerated.',
    to: 'None of this is reactionary. The trend has been building for years and has accelerated since the Quebec naturopath case.',
  },
];

function applyReplacements(content, replacements, label) {
  let updated = content;
  let applied = 0;
  let missed = [];
  for (const r of replacements) {
    if (updated.includes(r.from)) {
      updated = updated.replace(r.from, r.to);
      applied++;
    } else {
      missed.push(r.from.slice(0, 80));
    }
  }
  console.log(label + ': applied ' + applied + ' / ' + replacements.length + ' replacements');
  if (missed.length) {
    console.log('  MISSED:');
    for (const m of missed) console.log('    ' + m);
  }
  return updated;
}

(async () => {
  const receipt = {
    phase: 'dump-and-fix-articles',
    timestamp: new Date().toISOString(),
    dumped: [],
    unpublished: [],
    patched: [],
    unchanged: [],
    errors: [],
  };

  // Step 1: dump all 5 to scripts/_drafts/
  for (const slug of SLUGS) {
    const { data, error } = await sb.from('blog_posts').select('*').eq('slug', slug).maybeSingle();
    if (error || !data) {
      console.log('! ' + slug + ' not found');
      receipt.errors.push({ slug, op: 'dump', err: (error && error.message) || 'not found' });
      continue;
    }
    const md = '# ' + data.title + '\n\n' +
      '_Slug: ' + data.slug + '_\n' +
      '_Category: ' + data.category + '_\n' +
      '_Author: ' + data.author + '_\n' +
      '_Published: ' + data.date + '_\n' +
      '_Excerpt: ' + data.excerpt + '_\n\n' +
      '_Meta title: ' + data.meta_title + '_\n' +
      '_Meta description: ' + data.meta_description + '_\n\n' +
      '---\n\n' +
      (data.content || '');
    const outPath = path.join('scripts/_drafts', slug + '.md');
    fs.writeFileSync(outPath, md);
    receipt.dumped.push({ slug, path: outPath, chars: (data.content || '').length });
    console.log('dumped: ' + outPath + ' (' + (data.content || '').length + ' chars)');
  }
  console.log();

  // Step 2: unpublish article 4 (delete row — content preserved in source script for re-do)
  const article4Slug = 'what-iv-therapy-costs-across-canada-2026';
  const { data: a4 } = await sb.from('blog_posts').select('id, slug').eq('slug', article4Slug).maybeSingle();
  if (a4) {
    const { error: delErr } = await sb.from('blog_posts').delete().eq('id', a4.id);
    if (delErr) {
      console.log('! delete article 4 failed: ' + delErr.message);
      receipt.errors.push({ slug: article4Slug, op: 'delete', err: delErr.message });
    } else {
      console.log('UNPUBLISHED (deleted row): ' + article4Slug);
      receipt.unpublished.push({ slug: article4Slug, id: a4.id });
    }
  } else {
    console.log('article 4 not found in DB');
  }
  console.log();

  // Step 3: patch article 2
  const article2Slug = 'is-iv-therapy-a-scam-what-the-science-says';
  const { data: a2 } = await sb.from('blog_posts').select('id, content').eq('slug', article2Slug).maybeSingle();
  if (a2) {
    const updatedContent = applyReplacements(a2.content, A2_REPLACEMENTS, 'article 2');
    const { error: updErr } = await sb.from('blog_posts').update({
      content: updatedContent,
      last_updated: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    }).eq('id', a2.id);
    if (updErr) {
      console.log('! patch article 2 failed: ' + updErr.message);
      receipt.errors.push({ slug: article2Slug, op: 'patch', err: updErr.message });
    } else {
      console.log('PATCHED: ' + article2Slug);
      receipt.patched.push({ slug: article2Slug, id: a2.id, replacements: A2_REPLACEMENTS.length });
    }
  }
  console.log();

  // Step 4: patch article 3
  const article3Slug = 'canadian-iv-clinic-regulations-2026';
  const { data: a3 } = await sb.from('blog_posts').select('id, content').eq('slug', article3Slug).maybeSingle();
  if (a3) {
    const updatedContent = applyReplacements(a3.content, A3_REPLACEMENTS, 'article 3');
    const { error: updErr } = await sb.from('blog_posts').update({
      content: updatedContent,
      last_updated: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    }).eq('id', a3.id);
    if (updErr) {
      console.log('! patch article 3 failed: ' + updErr.message);
      receipt.errors.push({ slug: article3Slug, op: 'patch', err: updErr.message });
    } else {
      console.log('PATCHED: ' + article3Slug);
      receipt.patched.push({ slug: article3Slug, id: a3.id, replacements: A3_REPLACEMENTS.length });
    }
  }
  console.log();

  // Step 5: articles 1 and 5 unchanged
  receipt.unchanged.push('best-iv-therapy-clinics-canada-2026', '7-questions-before-iv-therapy');
  console.log('UNCHANGED: best-iv-therapy-clinics-canada-2026, 7-questions-before-iv-therapy');

  console.log();
  console.log('Dumped: ' + receipt.dumped.length + ' | Unpublished: ' + receipt.unpublished.length + ' | Patched: ' + receipt.patched.length + ' | Errors: ' + receipt.errors.length);

  fs.mkdirSync('scripts/_receipts', { recursive: true });
  const outPath = path.join('scripts/_receipts', 'dump-and-fix-articles-' + Date.now() + '.json');
  fs.writeFileSync(outPath, JSON.stringify(receipt, null, 2));
  console.log('Receipt: ' + outPath);
})();
