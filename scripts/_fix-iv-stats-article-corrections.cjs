/**
 * Two corrections to the IV statistics roundup article before it gets shared.
 *
 * 1. JAMA stat clarification (operator caught that "87" needed context).
 *    Verification agent confirmed via primary sources:
 *      - 102 spas drawn (two per state plus DC) - sampling frame.
 *      - 87 spas completed the calls - analytic n used for percentages.
 *      - 7 of 87 connected callers with a prescriber.
 *      - 21 of 87 (24.4 percent) disclosed any risks.
 *      - "Zero accepted insurance" could NOT be verified as a verbatim
 *        sentence from the primary JAMA paper. Soften to "the study
 *        reported IV hydration treatments are paid out-of-pocket and
 *        not covered by health insurance."
 *      - Peter Lurie IS confirmed as a JAMA paper co-author (contribution
 *        was legal research). Keep his attribution.
 *
 * 2. Texas case rewrite.
 *      - Per KWTX autopsy details: cause "sudden cardiac death of
 *        uncertain etiology," manner "unknown," IV therapy "cannot be
 *        definitely ruled in or ruled out as contributory," toxicology
 *        positive for tramadol and trazodone.
 *      - Do NOT state or imply IV caused her death.
 *      - Charges are allegations in an ongoing case, not proven.
 *      - Remove the names of the spa owner and medical director from
 *        body text. Drop the two KWTX URLs whose paths include those
 *        names; keep the AmSpa recap as primary cite.
 *      - Update the FAQ answer about most recent US enforcement to
 *        match.
 *      - Update the source list at bottom to remove the two name-bearing
 *        KWTX URLs.
 */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const sb = require('@supabase/supabase-js').createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const SLUG = 'iv-therapy-statistics-research-2024-2026-us-canada';

const REPLACEMENTS = [
  // 1. Opening sentence
  {
    from: 'One peer-reviewed secret-shopper study of 87 US IV hydration spas, published in JAMA Internal Medicine in October 2025, found that zero accepted health insurance and only seven connected callers with a doctor, physician assistant, or advanced practice nurse. The same study reported that, as of June 2024, no US state had enacted any legislation specifically regulating IV hydration spas. That is the kind of number that should shape how you book an IV in 2026.',
    to: 'One peer-reviewed secret-shopper study published in JAMA Internal Medicine in October 2025 drew a sample of 102 US IV hydration spas (two per state plus DC) and analyzed the 87 facilities that completed the secret-shopper calls. Of those 87, only seven connected callers with a doctor, physician assistant, or advanced practice nurse, and 21 facilities (24.4 percent) disclosed any risks. The same study reported that, as of June 2024, no US state had enacted any legislation specifically regulating IV hydration spas. That is the kind of finding that should shape how you book an IV in 2026.',
  },

  // 2. Instagram-share line
  {
    from: '**Instagram-share line:** A Yale/JAMA study called 87 US IV hydration spas. Zero accepted insurance. Only seven connected callers with a prescriber. Every stat in this post is sourced. Every link is real.',
    to: '**Instagram-share line:** A Yale/JAMA study completed secret-shopper calls at 87 US IV hydration spas. Only seven connected callers with a prescriber. Only 21 disclosed any risks. Every stat in this post is sourced. Every link is real.',
  },

  // 3. "The most surprising stat" headline section body - first paragraph after the heading
  {
    from: 'The clearest signal in 2024 to 2026 IV therapy research is a Yale-led [JAMA Internal Medicine paper from October 2025](https://jamanetwork.com/journals/jamainternalmedicine/article-abstract/2839844) by Sivakumar and colleagues. They reported that as of June 2024, no US state had enacted any legislation specifically regulating IV hydration spas, and only four states (Alabama, North Carolina, South Carolina, and Vermont) had issued policies or statements addressing all four oversight aspects the authors evaluated.',
    to: 'The clearest signal in 2024 to 2026 IV therapy research is a Yale-led [JAMA Internal Medicine paper from October 2025](https://jamanetwork.com/journals/jamainternalmedicine/article-abstract/2839844) by Sivakumar and colleagues. The authors reported that as of June 2024, no US state had enacted any legislation specifically regulating IV hydration spas, and only four states (Alabama, North Carolina, South Carolina, and Vermont) had issued policies or statements addressing all four oversight aspects the authors evaluated.',
  },

  // 4. Yale News summary paragraph
  {
    from: '[Yale News](https://news.yale.edu/2025/10/21/iv-hydration-spas-lack-adequate-oversight-study-finds) summarized the secret-shopper component: of 87 IV hydration spa clinics called, just seven connected callers with a doctor, physician assistant, or advanced practice nurse. Only 24 percent mentioned any risks at all. Zero clinics accepted health insurance.',
    to: '[Yale News](https://news.yale.edu/2025/10/21/iv-hydration-spas-lack-adequate-oversight-study-finds) summarized the secret-shopper component. The team randomly selected two spas in each US state plus DC, producing a 102-spa sampling frame, and analyzed the 87 facilities that completed the calls. Of those 87, just seven connected callers with a doctor, physician assistant, or advanced practice nurse. 21 facilities (24.4 percent) disclosed any risks, typically bruising at the injection site. The study reported that IV hydration treatments are paid out-of-pocket and not covered by health insurance.',
  },

  // 5. Closing line about JAMA implications - "Zero will use your insurance" softening
  {
    from: 'If you are booking IV therapy, the JAMA Internal Medicine secret-shopper data should set your expectation. Most clinics will not connect you with a prescriber before booking. Many will not mention risks. Zero will use your insurance. Vet hard. Our [7 questions to ask before IV therapy](https://www.thedripmap.com/blog/7-questions-before-iv-therapy) is the screen we built from these realities.',
    to: 'If you are booking IV therapy, the JAMA Internal Medicine secret-shopper data should set your expectation. Most clinics will not connect you with a prescriber before booking. Many will not mention risks. The treatments are paid out-of-pocket. Vet hard. Our [7 questions to ask before IV therapy](https://www.thedripmap.com/blog/7-questions-before-iv-therapy) is the screen we built from these realities.',
  },

  // 6. Texas case section - full rewrite of the paragraph
  {
    from: 'In 2025, Texas became the first US state to enact IV-therapy-specific legislation. [Lengea Law\'s analysis](https://lengealaw.com/jenifers-law-new-texas-iv-therapy-rules-take-effect-september-1-2025/) confirms Texas House Bill 3749, known as "Jenifer\'s Law," was signed by Governor Greg Abbott on June 20, 2025 and took effect September 1, 2025. The law follows the death of 47-year-old Jenifer Cleveland on July 10, 2023 from sudden cardiac arrest after receiving IV therapy at Luxe Med Spa in Wortham, Texas. In April 2026, [KWTX (CBS Waco)](https://www.kwtx.com/2026/04/29/amber-johnson-facing-multiple-charges-freestone-county-including-murder-manslaughter/) reported that spa owner Amber Johnson was charged with murder, manslaughter, and other counts; medical director Dr. Michael Patrick Gallagher faced [similar charges](https://www.kwtx.com/2026/04/30/michael-patrick-gallagher-facing-murder-manslaughter-charges-death-jenifer-cleveland/). The [American Med Spa Association recap](https://www.americanmedspa.org/news/the-texas-med-spa-iv-therapy-death-what-you-need-to-know/) is the operator-side summary of what changed.',
    to: 'In 2025, Texas became the first US state to enact IV-therapy-specific legislation. [Lengea Law\'s analysis](https://lengealaw.com/jenifers-law-new-texas-iv-therapy-rules-take-effect-september-1-2025/) confirms Texas House Bill 3749, known as "Jenifer\'s Law," was signed by Governor Greg Abbott on June 20, 2025 and took effect September 1, 2025. The law was prompted by the case of Jenifer Cleveland, who died at age 47 on July 10, 2023 after receiving IV therapy at a Texas medical spa. Per local reporting, the autopsy classified the cause of death as "sudden cardiac death of uncertain etiology" and the manner as "unknown," noting that the IV therapy "cannot be definitely ruled in or ruled out as contributory," with toxicology positive for tramadol and trazodone. In April 2026, Texas authorities filed charges including murder and manslaughter against the spa\'s owner and medical director. The charges are allegations in an ongoing case, not proven, and the defense disputes liability. The [American Med Spa Association recap](https://www.americanmedspa.org/news/the-texas-med-spa-iv-therapy-death-what-you-need-to-know/) is the operator-side summary of what changed.',
  },

  // 7. FAQ answer about most recent named US enforcement action - remove names + soften causation
  {
    from: '### What is the most recent named US IV therapy enforcement action?\n\nIn April 2026, Texas authorities filed murder and manslaughter charges against the owner and medical director of Luxe Med Spa in Wortham, TX, following the July 2023 death of patient Jenifer Cleveland after IV therapy. The case drove Texas House Bill 3749 ("Jenifer\'s Law"), which took effect September 1, 2025.',
    to: '### What is the most recent named US IV therapy enforcement action?\n\nIn April 2026, Texas authorities filed charges including murder and manslaughter against the spa owner and medical director of a Texas medical spa, following the July 2023 death of 47-year-old Jenifer Cleveland after IV therapy at the spa. The charges are allegations in an ongoing case, not proven; the autopsy classified the cause of death as undetermined and the defense disputes liability. The earlier Texas House Bill 3749 ("Jenifer\'s Law"), signed June 20, 2025 and effective September 1, 2025, was prompted by the incident.',
  },

  // 8. Source list - remove the two name-bearing KWTX URLs
  {
    from: '- KWTX coverage of Amber Johnson charges, April 2026: https://www.kwtx.com/2026/04/29/amber-johnson-facing-multiple-charges-freestone-county-including-murder-manslaughter/\n- KWTX coverage of Gallagher charges, April 2026: https://www.kwtx.com/2026/04/30/michael-patrick-gallagher-facing-murder-manslaughter-charges-death-jenifer-cleveland/\n',
    to: '',
  },
];

(async () => {
  const { data: row } = await sb.from('blog_posts').select('id, content').eq('slug', SLUG).maybeSingle();
  if (!row) { console.log('!! article not found'); process.exit(1); }

  let updated = row.content;
  let applied = 0;
  let missed = [];
  for (let i = 0; i < REPLACEMENTS.length; i++) {
    const r = REPLACEMENTS[i];
    if (updated.includes(r.from)) {
      updated = updated.replace(r.from, r.to);
      applied++;
      console.log('+ applied replacement ' + (i + 1));
    } else {
      missed.push({ idx: i + 1, preview: r.from.slice(0, 100) });
    }
  }

  if (missed.length) {
    console.log();
    console.log('!! MISSED replacements:');
    for (const m of missed) console.log('  #' + m.idx + ': ' + m.preview + '...');
    console.log();
    console.log('Bailing without DB update. Check the existing content for drift.');
    process.exit(1);
  }

  // Forbidden-pattern + name check
  for (const name of ['Amber Johnson', 'Michael Patrick Gallagher', 'Luxe Med Spa']) {
    if (updated.includes(name)) {
      console.log('!! Forbidden name still present in content: ' + name);
      process.exit(1);
    }
  }
  if (/[—–]/.test(updated)) { console.log('!! em-dash residue'); process.exit(1); }
  if (/\bdirectory\b/i.test(updated)) { console.log('!! "directory" residue'); process.exit(1); }

  // FAQ parser check
  const faqStart = updated.match(/##\s+Frequently asked questions[\s\S]*$/i);
  let qaCount = 0;
  if (faqStart) {
    const qa = /###\s+([^\n]+)\n+([\s\S]+?)(?=\n###\s+|\n##\s+|<!--|$)/g;
    let m;
    while ((m = qa.exec(faqStart[0])) !== null) qaCount++;
  }
  console.log('Post-fix FAQ Q/A count: ' + qaCount);
  if (qaCount < 3) { console.log('!! FAQ broken after edit'); process.exit(1); }

  const { error } = await sb.from('blog_posts').update({
    content: updated,
    last_updated: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  }).eq('id', row.id);
  if (error) { console.log('!! update failed: ' + error.message); process.exit(1); }

  console.log();
  console.log('+ ALL ' + applied + '/' + REPLACEMENTS.length + ' replacements applied.');
  console.log('+ Content chars: ' + row.content.length + ' -> ' + updated.length + ' (delta ' + (updated.length - row.content.length) + ')');
  console.log('+ Forbidden names removed.');
  console.log('+ FAQ parser will still find ' + qaCount + ' Q/A pairs.');

  fs.mkdirSync('scripts/_receipts', { recursive: true });
  fs.writeFileSync(path.join('scripts/_receipts', 'fix-iv-stats-corrections-' + Date.now() + '.json'), JSON.stringify({
    phase: 'fix-iv-stats-corrections',
    slug: SLUG,
    replacements_applied: applied,
    chars_before: row.content.length,
    chars_after: updated.length,
    faq_qa_count: qaCount,
  }, null, 2));
})();
