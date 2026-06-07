/**
 * Publish "The Most Interesting IV Therapy Statistics and Research of 2024
 * to 2026 (US and Canada)" blog post.
 *
 * Every statistic, study, and quote in this article comes from a source the
 * research agent verified via WebSearch in the same session. URLs are
 * listed inline at the point of use AND in a consolidated source list at
 * the bottom. No memory-based citations.
 *
 * FAQ uses ### Question? format so the auto-FAQ parser at
 * app/blog/[slug]/page.tsx produces FAQPage JSON-LD. No em-dashes. No
 * "directory" wording. Canadian angle prominent.
 */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const sb = require('@supabase/supabase-js').createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const NOW = new Date().toISOString();
const IMG_BASE = 'https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images';
const AUTHOR = 'TheDripMap Editorial Team';

const SLUG = 'iv-therapy-statistics-research-2024-2026-us-canada';
const TITLE = 'The Most Interesting IV Therapy Statistics and Research of 2024 to 2026 (US and Canada)';
const META_TITLE = 'IV Therapy Statistics 2024-2026: Real Stats and Sources';
const META_DESCRIPTION = 'Real, sourced stats on IV therapy in the US and Canada from 2024 to 2026: Yale/JAMA findings, market size, peer-reviewed trials, Health Canada advisories, named enforcement cases.';
const EXCERPT = 'The most interesting recent stats and research on IV therapy across the US and Canada, every number sourced to a verified study, market report, or regulator action. Strong Canadian angle.';
const CATEGORY = 'Treatment Guides';
const IMAGE = 'iv-therapy-clinical-medical-setting.jpg';

const CONTENT = `One peer-reviewed secret-shopper study of 87 US IV hydration spas, published in JAMA Internal Medicine in October 2025, found that zero accepted health insurance and only seven connected callers with a doctor, physician assistant, or advanced practice nurse. The same study reported that, as of June 2024, no US state had enacted any legislation specifically regulating IV hydration spas. That is the kind of number that should shape how you book an IV in 2026.

**Instagram-share line:** A Yale/JAMA study called 87 US IV hydration spas. Zero accepted insurance. Only seven connected callers with a prescriber. Every stat in this post is sourced. Every link is real.

## How we built this post

Every statistic in this article is sourced to a named market research firm, peer-reviewed journal, regulator, or news organization that our research agent verified via web search in the same task. We did not write any number, study, author, or quote from memory. Where a finding comes from a market-research firm, we name the firm and the report year. Where it comes from peer-reviewed work, we name the journal and year. Where it comes from a news outlet covering a primary source, we link to both.

If a claim could not be sourced cleanly, we dropped it. There is no "Sources Cited" placeholder list of titles we did not verify.

## The most surprising stat: an unregulated industry with low prescriber contact

The clearest signal in 2024 to 2026 IV therapy research is a Yale-led [JAMA Internal Medicine paper from October 2025](https://jamanetwork.com/journals/jamainternalmedicine/article-abstract/2839844) by Sivakumar and colleagues. They reported that as of June 2024, no US state had enacted any legislation specifically regulating IV hydration spas, and only four states (Alabama, North Carolina, South Carolina, and Vermont) had issued policies or statements addressing all four oversight aspects the authors evaluated.

[Yale News](https://news.yale.edu/2025/10/21/iv-hydration-spas-lack-adequate-oversight-study-finds) summarized the secret-shopper component: of 87 IV hydration spa clinics called, just seven connected callers with a doctor, physician assistant, or advanced practice nurse. Only 24 percent mentioned any risks at all. Zero clinics accepted health insurance.

Center for Science in the Public Interest president Peter G. Lurie, MD, who co-authored the JAMA paper, was quoted in the [CSPI press release](https://www.cspi.org/press-release/booming-iv-hydration-spa-industry-needs-more-oversight-researchers-say) saying the practice operates with "little evidence of health benefit from the practice, little regulation at the state and federal levels, and unnecessary risk." [NBC News](https://www.nbcnews.com/health/health-news/hydration-spa-unregulated-study-iv-drip-vitamins-detox-rcna235854) carried the story in October 2025.

If you take one number from this post, take the JAMA seven-of-eighty-seven: the realistic odds that the front desk of a randomly selected US IV spa will connect you with a prescriber before you book.

## The market is bigger and faster-growing than most patients realize

Two market reports give clean baseline numbers for IV therapy growth.

[Grand View Research](https://www.grandviewresearch.com/horizon/outlook/intravenous-iv-hydration-therapy-market/united-states) projects the US intravenous hydration therapy market to grow at a CAGR of 8 percent from 2024 to 2030.

Within that, [Grand View Research's US mobile IV report](https://www.grandviewresearch.com/industry-analysis/us-mobile-iv-hydration-therapy-market-report) estimates the US mobile IV hydration therapy market at USD 568.5 million in 2024 and projects 10.4 percent CAGR from 2025 to 2030. Mobile is outpacing the in-clinic segment by more than two percentage points per year, which is consistent with what we see on the ground: mobile providers compounding faster than brick-and-mortar across the cities we track.

[Mordor Intelligence's IV hydration therapy report](https://www.mordorintelligence.com/industry-reports/iv-hydration-therapy-market) puts the global market at USD 2.94 billion in 2025 with a forecast of USD 4.60 billion by 2030 at 8.9 percent CAGR. Mordor states that North America held 39.6 percent of the global market share in 2024 and attributes part of the regional dominance to "over 2,200 licensed medical spas" alongside nurse practitioner scope-of-practice expansion. The NP scope-of-practice attribution is the surprising piece for operators: market growth is being driven not only by consumer demand but by regulatory clarity that lets nurses lead IV practice in more states.

For consumer context, [Onus IV's 2025 pricing guide](https://www.onusiv.com/blog/how-much-does-iv-therapy-cost) reports basic hydration drips at USD 100 to 300, specialized vitamin or immune drips at USD 250 to 500, Myers' Cocktail at USD 175 to 275, and premium NAD+ exceeding USD 1,000. These are industry-side numbers; clinic-side menus vary.

## Who is actually buying IV therapy

[Grand View Research's North America IV hydration therapy report](https://www.grandviewresearch.com/industry-analysis/north-america-intravenous-iv-hydration-therapy-market-report) reports that in 2024 the energy boosters segment dominated North American IV hydration revenue with a 25.3 percent share. The 18 to 60 age segment held 53.2 percent of the market and women held 52.7 percent.

That is a meaningful product-market fit signal: the largest customer is a working-age woman seeking an energy-boost drip. Mobile delivery is well-aligned with that customer's evening and weekend booking patterns.

## What recent research actually shows

The science of IV therapy in 2024 to 2026 splits cleanly into evidence-supported clinical infusions and weak-evidence wellness drips. Recent peer-reviewed work bears this out.

[Mayo Clinic Press](https://mcpress.mayoclinic.org/living-well/iv-vitamin-therapy-understanding-the-lack-of-proven-benefit-and-potential-risks-of-this-health-fad/) summarizes the institutional position on consumer IV vitamin therapy with a quotable line from Mayo physician Brent Bauer, MD: "Anything we place in the human body can carry risk." Mayo treats wellness IV vitamin infusions as a "health fad" lacking proven benefit for non-deficient adults.

For NAD+ IV, the human evidence is starting to land. A [randomized placebo-controlled pilot trial](https://www.medrxiv.org/content/10.1101/2024.06.06.24308565v1) (NCT06382688, posted to medRxiv in June 2024) compared IV NAD+ and IV nicotinamide riboside in healthy adults. The trial found NR IV was associated with fewer and less severe adverse experiences during infusion compared to NAD+ IV.

A follow-up real-world pilot, [published February 2026 in Frontiers in Aging](https://www.frontiersin.org/journals/aging/articles/10.3389/fragi.2026.1652582/full) by Reyna and colleagues, looked at tolerability of IV NAD+ versus IV NR among Restore Hyper Wellness clients, with university collaborators including Connecticut, Edith Cowan, and Stanford. The paper is also [indexed on PubMed](https://pubmed.ncbi.nlm.nih.gov/41704678/). It is one of the rare industry-and-academia crossover papers on a wellness-IV product.

For high-dose IV vitamin C, a [Phase II randomized placebo-controlled trial](https://aacrjournals.org/cancerrescommun/article/4/8/2174/747040/High-Dose-Intravenous-Vitamin-C-Combined-with) published in Cancer Research Communications in August 2024 combined high-dose IV vitamin C with docetaxel in metastatic castration-resistant prostate cancer. Real Phase II oncology data, not speculation.

For hangover IV claims, the evidence remains thin. A [GoodRx Health review](https://www.goodrx.com/health-topic/alcohol/do-iv-drips-work-for-hangovers) summarizes 2023 prospective research finding IV fluids did not speed recovery for acutely intoxicated participants. Saline rehydration is real; the hangover-cure marketing layered on top has weak support.

For Canadian readers and operators, the most relevant 2025 clinical guidance is the [Canadian Medical Association Journal article on iron deficiency in females](https://www.cmaj.ca/content/197/24/E680) published July 2, 2025. The piece situates IV iron infusion as standard care for confirmed iron-deficiency anemia, alongside the global figure that 30 percent of women aged 15 to 49 worldwide are estimated to have iron deficiency.

## The regulators are finally catching up

The 2024 to 2026 enforcement record is the most interesting it has been in a decade.

In the US, the [FTC's first-ever action targeting an IV cocktail therapy marketer](https://www.ftc.gov/news-events/news/press-releases/2018/09/ftc-brings-first-ever-action-targeting-iv-cocktail-therapy-marketer) was brought in September 2018 against A&O Enterprises (dba iV Bars) and owner Aaron K. Roberts, with clinics in north Texas, New Braunfels TX, and Vail CO charging USD 100 to 250 per treatment. That was the start of named federal enforcement.

In 2022, the [Alabama State Board of Medical Examiners issued a Declaratory Ruling](https://www.albme.gov/uploads/pdfs/IVTherapy.Declaratory_Ruling_.pdf) stating that diagnosis and recommendation of IV therapy constitutes the practice of medicine, following an investigation of ten retail IV therapy businesses in September 2021. [Legal coverage by ByrdAdatto](https://byrdadatto.com/banter/more-states-release-guidance-for-iv-therapy-following-alabama/) called this the template other state boards have followed.

In 2025, Texas became the first US state to enact IV-therapy-specific legislation. [Lengea Law's analysis](https://lengealaw.com/jenifers-law-new-texas-iv-therapy-rules-take-effect-september-1-2025/) confirms Texas House Bill 3749, known as "Jenifer's Law," was signed by Governor Greg Abbott on June 20, 2025 and took effect September 1, 2025. The law follows the death of 47-year-old Jenifer Cleveland on July 10, 2023 from sudden cardiac arrest after receiving IV therapy at Luxe Med Spa in Wortham, Texas. In April 2026, [KWTX (CBS Waco)](https://www.kwtx.com/2026/04/29/amber-johnson-facing-multiple-charges-freestone-county-including-murder-manslaughter/) reported that spa owner Amber Johnson was charged with murder, manslaughter, and other counts; medical director Dr. Michael Patrick Gallagher faced [similar charges](https://www.kwtx.com/2026/04/30/michael-patrick-gallagher-facing-murder-manslaughter-charges-death-jenifer-cleveland/). The [American Med Spa Association recap](https://www.americanmedspa.org/news/the-texas-med-spa-iv-therapy-death-what-you-need-to-know/) is the operator-side summary of what changed.

So as of mid-2026, the US has gone from zero IV-therapy-specific state legislation to at least one named, dated, post-incident law on the books. The implication for operators is direct: the regulatory environment is now reactive to fatal incidents, not just to consumer-protection complaints.

## The Canadian angle

For Canada, the strongest 2026 regulatory story is the Health Canada peptide advisory and its follow-up.

In April 2026, [Health Canada published a public advisory](https://recalls-rappels.canada.ca/en/alert-recall/think-twice-injecting-peptides-bought-online-unauthorized-products-can-seriously-harm) warning consumers about unauthorized injectable peptides being marketed for weight loss, anti-aging, bodybuilding, and wellness. Health Canada specifically cited risks including liver and kidney damage, blood clots, and cancerous tumours, plus infection, allergic reaction, and contamination risks from improperly manufactured products. [CBC News carried the advisory](https://www.cbc.ca/news/health/health-canada-peptides-injecting-unauthorized-drugs-9.7158178).

The follow-up is the interesting part. [CBC News reported](https://www.cbc.ca/news/health/peptides-injectable-9.7167241) that, days after the Health Canada advisory, reporters successfully purchased three banned peptide products online. It is a sharp Canadian-specific illustration of the regulation-versus-enforcement gap.

For clinic operators, the most actionable Canadian document is the [Canadian Journal of Health Technologies report by CADTH](https://canjhealthtechnol.ca/index.php/cjht/article/view/372) titled "Health System Readiness Report: The Availability of Privately Funded IV Infusion Clinics in Canada" (also [mirrored on NCBI](https://www.ncbi.nlm.nih.gov/books/NBK603628/)). This is the first official Canadian inventory of private IV infusion clinic locations and is directly relevant to anyone operating, claiming, or referencing a Canadian IV listing.

For the full provincial regulatory picture across Canada (CONO, CCHPBC, BCCNM, CNDA, CRNA, OIIQ), see our [Canadian IV clinic regulations 2026 guide](https://www.thedripmap.com/blog/canadian-iv-clinic-regulations-2026).

## The franchise consolidation footprint

For industry watchers, [Entrepreneur magazine ranked Restore Hyper Wellness number one in the Miscellaneous Personal-Care Businesses category of the 2025 Franchise 500](https://www.businesswire.com/news/home/20250116674511/en/Restore-Hyper-Wellness-Named-1-in-Entrepreneurs-2025-Franchise-500-Ranking). [Franchise Chatter's 2025 review](https://www.franchisechatter.com/2025/11/27/restore-hyper-wellness-franchise-review-2025-costs-fees-news-average-revenues-and-or-profits/) puts Restore at 209 US locations per its 2025 FDD.

For the broader medical spa context, the [American Med Spa Association 2024 State of the Industry report](https://www.americanmedspa.org/news/2024-medical-spa-state-of-the-industry-executive-report-recap/) reports more than 10,000 medical spas in the US as of 2023, compared with just under 5,500 in 2018. AmSpa puts the medical aesthetics industry at over USD 17 billion and average annual medical spa revenue at USD 1,398,833 in 2024 (up from USD 1,307,587 in 2023). Med spa count almost doubled in five years. IV therapy growth is sitting on top of that base.

## What this means for you, as a patient or operator

If you are booking IV therapy, the JAMA Internal Medicine secret-shopper data should set your expectation. Most clinics will not connect you with a prescriber before booking. Many will not mention risks. Zero will use your insurance. Vet hard. Our [7 questions to ask before IV therapy](https://www.thedripmap.com/blog/7-questions-before-iv-therapy) is the screen we built from these realities.

If you are operating a clinic, the regulatory environment in 2026 is reactive to fatal incidents and to consumer-protection complaints. The Alabama declaratory ruling template, Texas Jenifer's Law, and Health Canada's peptide advisory all point the same direction: documented credentials, licensed-pharmacy sourcing, named medical director, written informed consent, and an emergency protocol. If you do not have those in place, our [Canadian IV clinic regulations 2026 guide](https://www.thedripmap.com/blog/canadian-iv-clinic-regulations-2026) is your starting point.

## Related on TheDripMap

- [Canadian IV clinic regulations 2026](https://www.thedripmap.com/blog/canadian-iv-clinic-regulations-2026)
- [Is IV therapy a scam? What the science actually says](https://www.thedripmap.com/blog/is-iv-therapy-a-scam-what-the-science-says)
- [7 questions to ask before IV therapy](https://www.thedripmap.com/blog/7-questions-before-iv-therapy)
- [Browse Canadian IV therapy cities](https://www.thedripmap.com/cities/)
- [Browse all IV therapy clinics](https://www.thedripmap.com/search/)

## Frequently Asked Questions

### Is IV vitamin therapy backed by clinical evidence?

For confirmed deficiency, yes. IV iron infusion is standard for iron-deficiency anemia per Canadian and US clinical guidance, IV B12 is standard for pernicious anemia, and IV saline is standard for clinical dehydration. For healthy adults seeking "wellness" drips, Mayo Clinic and other institutional position pieces treat the practice as lacking proven benefit. See the Mayo Clinic Press piece linked in this article.

### What is the most recent named US IV therapy enforcement action?

In April 2026, Texas authorities filed murder and manslaughter charges against the owner and medical director of Luxe Med Spa in Wortham, TX, following the July 2023 death of patient Jenifer Cleveland after IV therapy. The case drove Texas House Bill 3749 ("Jenifer's Law"), which took effect September 1, 2025.

### What did Health Canada do about peptides in 2026?

Health Canada issued a public advisory in April 2026 warning about unauthorized injectable peptides marketed for weight loss, anti-aging, bodybuilding, and wellness. The advisory listed risks including liver and kidney damage, blood clots, and cancerous tumours, plus contamination and improper manufacturing risks from non-licensed sources.

### How fast is the US mobile IV market growing?

Grand View Research estimates the US mobile IV hydration therapy market at USD 568.5 million in 2024, projected to grow at a CAGR of 10.4 percent from 2025 to 2030, faster than the overall US IV hydration therapy market's 8 percent CAGR.

### Where can I find a verified Canadian IV therapy clinic?

Use TheDripMap, our Canadian IV therapy matching platform. Every listed clinic is a verified business and we are rolling out a Safety Verified badge in 2026 for clinics that prove clinician licensing, pharmacy sourcing, medical director, insurance, and emergency preparedness.

## Full source list

- Grand View Research, US Intravenous Hydration Therapy Market Outlook 2030: https://www.grandviewresearch.com/horizon/outlook/intravenous-iv-hydration-therapy-market/united-states
- Grand View Research, US Mobile IV Hydration Therapy Market Report 2030: https://www.grandviewresearch.com/industry-analysis/us-mobile-iv-hydration-therapy-market-report
- Grand View Research, North America Intravenous Hydration Therapy Market Report: https://www.grandviewresearch.com/industry-analysis/north-america-intravenous-iv-hydration-therapy-market-report
- Mordor Intelligence, IV Hydration Therapy Market 2025-2030: https://www.mordorintelligence.com/industry-reports/iv-hydration-therapy-market
- Sivakumar et al., State Policies and Facility Practices of IV Hydration Spas in the US, JAMA Internal Medicine, October 2025: https://jamanetwork.com/journals/jamainternalmedicine/article-abstract/2839844
- Yale News coverage of JAMA study, October 2025: https://news.yale.edu/2025/10/21/iv-hydration-spas-lack-adequate-oversight-study-finds
- NBC News coverage of JAMA study, October 2025: https://www.nbcnews.com/health/health-news/hydration-spa-unregulated-study-iv-drip-vitamins-detox-rcna235854
- CSPI press release on JAMA study, October 2025: https://www.cspi.org/press-release/booming-iv-hydration-spa-industry-needs-more-oversight-researchers-say
- Mayo Clinic Press, IV Vitamin Therapy explainer: https://mcpress.mayoclinic.org/living-well/iv-vitamin-therapy-understanding-the-lack-of-proven-benefit-and-potential-risks-of-this-health-fad/
- medRxiv preprint, NAD+ IV vs NR IV randomized trial (NCT06382688), June 2024: https://www.medrxiv.org/content/10.1101/2024.06.06.24308565v1
- Reyna et al., Frontiers in Aging, February 2026: https://www.frontiersin.org/journals/aging/articles/10.3389/fragi.2026.1652582/full
- PubMed entry for Reyna et al.: https://pubmed.ncbi.nlm.nih.gov/41704678/
- High-Dose IV Vitamin C with Docetaxel Phase II, Cancer Research Communications, August 2024: https://aacrjournals.org/cancerrescommun/article/4/8/2174/747040/High-Dose-Intravenous-Vitamin-C-Combined-with
- GoodRx Health, hangover IV review: https://www.goodrx.com/health-topic/alcohol/do-iv-drips-work-for-hangovers
- CMAJ, Iron Deficiency in Females, July 2025: https://www.cmaj.ca/content/197/24/E680
- FTC press release, iV Bars enforcement action, September 2018: https://www.ftc.gov/news-events/news/press-releases/2018/09/ftc-brings-first-ever-action-targeting-iv-cocktail-therapy-marketer
- FTC iV Bars complaint PDF: https://www.ftc.gov/system/files/documents/cases/1723016_iv_bars_complaint_9-20-18.pdf
- Alabama State Board of Medical Examiners Declaratory Ruling, July 2022: https://www.albme.gov/uploads/pdfs/IVTherapy.Declaratory_Ruling_.pdf
- ByrdAdatto commentary on Alabama ruling: https://byrdadatto.com/banter/more-states-release-guidance-for-iv-therapy-following-alabama/
- Lengea Law analysis of Texas Jenifer's Law: https://lengealaw.com/jenifers-law-new-texas-iv-therapy-rules-take-effect-september-1-2025/
- KWTX coverage of Amber Johnson charges, April 2026: https://www.kwtx.com/2026/04/29/amber-johnson-facing-multiple-charges-freestone-county-including-murder-manslaughter/
- KWTX coverage of Gallagher charges, April 2026: https://www.kwtx.com/2026/04/30/michael-patrick-gallagher-facing-murder-manslaughter-charges-death-jenifer-cleveland/
- American Med Spa Association Texas case recap: https://www.americanmedspa.org/news/the-texas-med-spa-iv-therapy-death-what-you-need-to-know/
- Health Canada peptide advisory, April 2026: https://recalls-rappels.canada.ca/en/alert-recall/think-twice-injecting-peptides-bought-online-unauthorized-products-can-seriously-harm
- CBC News on Health Canada peptide advisory: https://www.cbc.ca/news/health/health-canada-peptides-injecting-unauthorized-drugs-9.7158178
- CBC News follow-up showing peptides still purchasable online: https://www.cbc.ca/news/health/peptides-injectable-9.7167241
- CADTH Health System Readiness Report on Private IV Infusion Clinics in Canada: https://canjhealthtechnol.ca/index.php/cjht/article/view/372
- CADTH report mirrored on NCBI: https://www.ncbi.nlm.nih.gov/books/NBK603628/
- BusinessWire, Restore Hyper Wellness Franchise 500 ranking: https://www.businesswire.com/news/home/20250116674511/en/Restore-Hyper-Wellness-Named-1-in-Entrepreneurs-2025-Franchise-500-Ranking
- Franchise Chatter, Restore Hyper Wellness 2025 review: https://www.franchisechatter.com/2025/11/27/restore-hyper-wellness-franchise-review-2025-costs-fees-news-average-revenues-and-or-profits/
- American Med Spa Association, 2024 State of the Industry Report recap: https://www.americanmedspa.org/news/2024-medical-spa-state-of-the-industry-executive-report-recap/
- Onus IV, How Much Does IV Therapy Cost (2025): https://www.onusiv.com/blog/how-much-does-iv-therapy-cost
`;

// Em-dash sanity check
function containsForbidden(s) {
  const flags = [];
  if (/[—–]/.test(s)) flags.push('EM-DASH / EN-DASH');
  if (/\bdirectory\b/i.test(s)) flags.push('DIRECTORY');
  return flags;
}

(async () => {
  const receipt = { phase: 'publish-iv-stats-roundup', timestamp: NOW, errors: [] };

  const flags = containsForbidden(CONTENT);
  if (flags.length) {
    console.log('!! FORBIDDEN PATTERNS IN CONTENT: ' + flags.join(', '));
    receipt.errors.push({ check: 'forbidden_patterns', flags });
  } else {
    console.log('Forbidden-pattern check: clean.');
  }

  // FAQ parser check (mirror page.tsx regex)
  const faqStart = CONTENT.match(/##\s+Frequently asked questions[\s\S]*$/i);
  let qaCount = 0;
  if (faqStart) {
    const qa = /###\s+([^\n]+)\n+([\s\S]+?)(?=\n###\s+|\n##\s+|<!--|$)/g;
    let m;
    while ((m = qa.exec(faqStart[0])) !== null) qaCount++;
  }
  console.log('FAQ parser would extract ' + qaCount + ' Q/A pairs.');
  if (qaCount < 3) {
    console.log('!! FAQ Q/A count too low for FAQPage schema.');
    receipt.errors.push({ check: 'faq_parser', qaCount });
  }

  if (receipt.errors.length) {
    console.log('Bailing on insert due to errors.');
    process.exit(1);
  }

  const { data: existing } = await sb.from('blog_posts').select('id').eq('slug', SLUG).maybeSingle();
  if (existing) {
    console.log('= slug already exists, skipping insert (id=' + existing.id + ')');
    return;
  }

  const imageUrl = IMG_BASE + '/' + IMAGE;
  const payload = {
    slug: SLUG,
    title: TITLE,
    meta_title: META_TITLE,
    meta_description: META_DESCRIPTION,
    excerpt: EXCERPT,
    category: CATEGORY,
    author: AUTHOR,
    image_url: imageUrl,
    date: NOW,
    last_updated: NOW,
    content: CONTENT,
    related_clinics: [],
    related_cities: [],
    metaTitle: META_TITLE,
    metaDescription: META_DESCRIPTION,
    imageUrl,
    authorImageUrl: null,
    reviewedBy: null,
    lastUpdated: NOW,
    relatedCities: [],
    relatedClinics: [],
  };

  const { data, error } = await sb.from('blog_posts').insert(payload).select('id, slug, title').single();
  if (error) {
    console.log('!! insert failed: ' + error.message);
    receipt.errors.push({ check: 'insert', error: error.message });
    return;
  }

  console.log('+ PUBLISHED');
  console.log('  id: ' + data.id);
  console.log('  slug: ' + data.slug);
  console.log('  live URL: https://www.thedripmap.com/blog/' + data.slug);
  console.log('  content chars: ' + CONTENT.length);

  receipt.inserted = { id: data.id, slug: data.slug, chars: CONTENT.length };
  fs.mkdirSync('scripts/_receipts', { recursive: true });
  fs.writeFileSync(path.join('scripts/_receipts', 'publish-iv-stats-roundup-' + Date.now() + '.json'), JSON.stringify(receipt, null, 2));
})();
