/**
 * Render the 4-pilot review Markdown:
 *   1. /cities/toronto
 *   2. /cities/vancouver
 *   3. /treatments/nad-plus
 *   4. /treatments/iron-infusion
 *
 * Reads .tmp-pilot-data.json (produced by the audit step above) and writes
 * scripts/_city-treatment-pilot-review.md for operator review BEFORE any
 * code template changes commit.
 */
const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./.tmp-pilot-data.json', 'utf8'));

function fmt(p) {
  const r = p.rating ? p.rating + ' stars' : 'unrated';
  const rev = p.reviews ? p.reviews + ' reviews' : '';
  const tags = [];
  if (p.is_claimed) tags.push('CLAIMED');
  if (p.is_featured) tags.push('FEATURED');
  const tagStr = tags.length ? ' [' + tags.join(' / ') + ']' : '';
  return p.name + tagStr + ', ' + r + (rev ? ', ' + rev : '');
}

function listProviders(list, max) {
  return list.slice(0, max).map((p, i) => (i + 1) + '. ' + fmt(p) + '\n   /providers/' + p.slug).join('\n');
}

const lines = [];
lines.push('# PILOT REVIEW, city + treatment deepening');
lines.push('');
lines.push('Operator: scan the four pages below. Approve or send line-level edits before I commit the code template changes. Per the 2026-06-09 spec: no medical claims, no fabricated stats, real DB data only, no em-dashes, default to DRAFT.');
lines.push('');
lines.push('Generated 2026-06-09 from live DB (1,475 non-hidden providers). Each section shows the full rendered text exactly as it will appear on the page, plus the structured-data emissions.');
lines.push('');
lines.push('---');
lines.push('');

// === TORONTO ===
lines.push('## Pilot 1 of 4, /cities/toronto');
lines.push('');
lines.push('### Title tag');
lines.push('IV Therapy in Toronto, Ontario (2026) | 61 Clinics | TheDripMap');
lines.push('');
lines.push('### Meta description');
lines.push('Compare 61 IV therapy clinics in Toronto. Hydration, NAD+, hangover recovery, Myers cocktail, immune support, and mobile drips across downtown Toronto and the GTA. Real ratings, real reviews, no hype.');
lines.push('');
lines.push('### H1');
lines.push('IV Therapy in Toronto');
lines.push('');
lines.push('### 200-word intro (new, replacing the current short regulationNote)');
lines.push('');
lines.push('Toronto is the largest IV therapy market on TheDripMap, with 61 clinics serving downtown Toronto, North York, Scarborough, Etobicoke, and the surrounding GTA. The local mix runs across hydration, hangover recovery, Myers cocktail, NAD+, immune support, and beauty drips, and a substantial subset of the listed clinics offer mobile in-home or hotel service across the GTA.');
lines.push('');
lines.push('Administering an IV is a regulated activity in Ontario. The College of Physicians and Surgeons of Ontario (CPSO) regulates physicians, the College of Nurses of Ontario (CNO) regulates RNs, NPs, and RPNs, and the College of Naturopaths of Ontario (CONO) authorizes naturopathic doctors who have passed the Intravenous Infusion Therapy (IVIT) Exam to administer a defined set of IV substances on inspected premises. Most wellness IV in Toronto is delivered either by an RN under a medical directive signed by a physician or NP, or by a CONO-authorized ND on CONO-inspected premises. Both models are legitimate.');
lines.push('');
lines.push('General information only, not legal or medical advice. Always confirm suitability and clinician credentials with the clinic before booking.');
lines.push('');
lines.push('### Clinic list (top 12 of 61, sorted: claimed first, then by rating times reviews)');
lines.push('');
lines.push(listProviders(data.toronto, 12));
lines.push('');
lines.push('### Popular treatments in Toronto (linked back to /treatments/*)');
lines.push('');
lines.push('- Hydration drips, see /treatments/hydration');
lines.push('- NAD+ Plus, see /treatments/nad-plus');
lines.push('- Myers Cocktail, see /treatments/myers-cocktail');
lines.push('- Beauty Glow, see /treatments/beauty-glow');
lines.push('- Hangover Recovery, see /treatments/hangover');
lines.push('- Immune Support, see /treatments/immune-support');
lines.push('- Mobile IV in the GTA');
lines.push('');
lines.push('### FAQ (5 questions, FAQPage JSON-LD)');
lines.push('');
lines.push('1. **Is IV therapy legal in Toronto?** Yes. IV administration is a controlled act in Ontario. Registered nurses, nurse practitioners, physicians, and CONO-authorized naturopathic doctors can legally administer IV therapy under the appropriate orders, directives, or college authorization. Confirm credentials with the clinic before booking.');
lines.push('2. **Can a naturopathic doctor give an IV in Ontario?** Yes, but only one who has passed both the Ontario Prescribing and Therapeutics Exam and the Ontario IVIT Exam, and who practices on CONO-inspected premises. Confirm directly with the clinic if you specifically want an ND-led drip.');
lines.push('3. **How much does IV therapy cost in Toronto?** Each Toronto clinic sets its own pricing, so check the individual clinic listing for current rates. As a general market guide, wellness drips like hydration and Myers cocktail tend to sit in the low to mid hundreds, with NAD+ protocols typically running higher because of the longer session and the dose. Always confirm with the clinic before booking.');
lines.push('4. **Do Toronto clinics offer mobile or in-home IV therapy?** Yes. Mobile IV across the GTA is mature, with providers serving downtown Toronto, North York, Scarborough, Etobicoke, and the surrounding suburbs including Mississauga, Markham, Vaughan, Richmond Hill, Brampton, Oakville, and Burlington. Look for the Mobile Service tag in the listings.');
lines.push('5. **How many IV therapy clinics are listed in Toronto?** TheDripMap lists 61 clinics in Toronto, covering both fixed-location clinics and mobile providers.');
lines.push('');
lines.push('### Schema emissions');
lines.push('- BreadcrumbList JSON-LD (already emitted)');
lines.push('- FAQPage JSON-LD (already emitted, will use the 5 FAQs above)');
lines.push('- **ItemList JSON-LD (NEW): wraps the 12 clinic cards, each as a LocalBusiness entry with name, address, phone, url, aggregateRating where present**');
lines.push('');
lines.push('---');
lines.push('');

// === VANCOUVER ===
lines.push('## Pilot 2 of 4, /cities/vancouver');
lines.push('');
lines.push('### Title tag');
lines.push('IV Therapy in Vancouver, BC (2026) | 25 Clinics | TheDripMap');
lines.push('');
lines.push('### Meta description');
lines.push('Compare 25 IV therapy clinics in Vancouver. NAD+, hydration, immune support, beauty drips, and mobile service across Vancouver, the North Shore, Burnaby, and Richmond. Real ratings, real reviews.');
lines.push('');
lines.push('### H1');
lines.push('IV Therapy in Vancouver');
lines.push('');
lines.push('### 200-word intro');
lines.push('');
lines.push('Vancouver is the second-largest IV therapy market in our matching platform, with 25 clinics serving Vancouver proper, the North Shore, Burnaby, and Richmond. The local mix runs across hydration, NAD+, immune support, glutathione, Myers cocktail, and beauty drips, and a notable share of listed clinics offer mobile in-home and hotel service.');
lines.push('');
lines.push('British Columbia reorganized its health professions regulation under the Health Professions and Occupations Act in 2026. The British Columbia College of Nurses and Midwives (BCCNM) regulates RNs, NPs, LPNs, and registered psychiatric nurses, and BC LPNs may perform IV therapy with the appropriate education within the BCCNM standards. The College of Physicians and Surgeons of BC (CPSBC) regulates physicians, who sign the directives nurse-led clinics follow. Naturopathic doctors in BC are regulated by the College of Complementary Health Professionals of BC (CCHPBC), the successor to the former CNPBC, and ND-led IV is common in Vancouver, Victoria, and Kelowna. The BC ND scope differs from Ontario, so confirm what a specific clinic is authorized to deliver.');
lines.push('');
lines.push('General information only, not legal or medical advice. Always confirm suitability and clinician credentials with the clinic before booking.');
lines.push('');
lines.push('### Clinic list (top 12 of 25, sorted: claimed first, then by rating times reviews)');
lines.push('');
lines.push(listProviders(data.vancouver, 12));
lines.push('');
lines.push('### Popular treatments in Vancouver');
lines.push('');
lines.push('- Hydration, see /treatments/hydration');
lines.push('- NAD+ Plus, see /treatments/nad-plus');
lines.push('- Immune Support, see /treatments/immune-support');
lines.push('- Glutathione, see /treatments/glutathione');
lines.push('- Beauty Glow, see /treatments/beauty-glow');
lines.push('- Myers Cocktail, see /treatments/myers-cocktail');
lines.push('- Mobile IV across the Lower Mainland');
lines.push('');
lines.push('### FAQ (5 questions, FAQPage JSON-LD)');
lines.push('');
lines.push('1. **Is IV therapy legal in Vancouver?** Yes. IV administration is regulated in BC under the Health Professions and Occupations Act. Physicians, registered nurses, nurse practitioners, BCCNM-registered LPNs with appropriate training, and CCHPBC-authorized naturopathic doctors can legally administer IV therapy. Confirm credentials with the clinic before booking.');
lines.push('2. **Can a naturopathic doctor give an IV in BC?** Yes. BC NDs are regulated by CCHPBC and have a provincial scope for prescribing and administering substances intravenously. The BC ND scope differs from Ontario, so always confirm what a specific clinic is authorized to deliver.');
lines.push('3. **How much does IV therapy cost in Vancouver?** Each Vancouver clinic sets its own pricing, so check the individual clinic listing for current rates. As a general market guide, wellness drips like hydration and Myers cocktail tend to sit in the low to mid hundreds, with NAD+ protocols typically running higher because of the longer session and the dose. Always confirm with the clinic before booking.');
lines.push('4. **Do Vancouver clinics offer mobile or in-home IV therapy?** Yes. Mobile IV across the Lower Mainland is well-developed, with providers serving Vancouver, the North Shore, Burnaby, Richmond, and Surrey. Look for the Mobile Service tag in the listings.');
lines.push('5. **How many IV therapy clinics are listed in Vancouver?** TheDripMap lists 25 clinics in Vancouver, covering both fixed-location and mobile providers.');
lines.push('');
lines.push('### Schema emissions');
lines.push('- BreadcrumbList JSON-LD (already)');
lines.push('- FAQPage JSON-LD (already, will use the 5 FAQs above)');
lines.push('- **ItemList JSON-LD (NEW): wraps the 12 clinic cards, each as LocalBusiness**');
lines.push('');
lines.push('---');
lines.push('');

// === NAD+ ===
lines.push('## Pilot 3 of 4, /treatments/nad-plus');
lines.push('');
lines.push('### Title tag');
lines.push('NAD+ IV Therapy Clinics Near Me | TheDripMap');
lines.push('');
lines.push('### Meta description');
lines.push('Compare NAD+ IV therapy providers across North America. 118 clinics on TheDripMap offer NAD+ protocols. Real ratings, real reviews, in-clinic and mobile.');
lines.push('');
lines.push('### H1');
lines.push('NAD+ IV Therapy Clinics');
lines.push('');
lines.push('### 200-word intro');
lines.push('');
lines.push('NAD+ is the protocol most often described as a higher-dose IV alongside the standard hydration and Myers cocktail menus. 118 clinics on TheDripMap currently offer NAD+ protocols, with the deepest local markets in Toronto, Las Vegas, Calgary, Markham, Mississauga, Richmond Hill, Burlington, Vaughan, Halifax, and Montreal. NAD+ sessions are typically longer than standard wellness drips, often delivered in 60 to 240 minute sittings depending on dose, and ND-led, NP-led, and physician-led clinics all appear in the list.');
lines.push('');
lines.push('What NAD+ is: nicotinamide adenine dinucleotide is a coenzyme present in every cell, and IV NAD+ delivers it directly into the bloodstream as opposed to oral supplementation. NAD+ IV therapy is regulated under the same provincial and state frameworks as other IVs, and any clinic offering it should have a clear named medical director or supervising clinician behind the protocol. Suitability, dose, and indications should be confirmed with a licensed clinician before booking.');
lines.push('');
lines.push('General information only. No claim is made or implied about the medical efficacy of NAD+ for any specific condition.');
lines.push('');
lines.push('### Clinics offering NAD+, grouped by city (3+ providers per city)');
lines.push('');
for (const c of data.nadByCity.filter((c) => c.count >= 3).slice(0, 15)) {
  lines.push('**' + c.city + '  (' + c.count + ' providers)**');
  for (const p of c.providers.slice(0, 5)) {
    lines.push('- ' + fmt(p) + '   /providers/' + p.slug);
  }
  if (c.providers.length > 5) lines.push('- + ' + (c.providers.length - 5) + ' more');
  lines.push('');
}
const othersNad = data.nadByCity.filter((c) => c.count < 3 && c.count > 0).length;
if (othersNad) {
  lines.push('**Other locations**, ' + othersNad + ' additional cities have 1 to 2 listed NAD+ providers. Browse the full /providers list filtered by NAD+ to see all locations.');
  lines.push('');
}
lines.push('### Links to related treatments + city pages');
lines.push('- Related: /treatments/myers-cocktail, /treatments/hydration, /treatments/recovery, /treatments/energy-boost');
lines.push('- Top cities: /cities/toronto, /cities/las-vegas, /cities/markham, /cities/mississauga, /cities/calgary, /cities/montreal');
lines.push('');
lines.push('### Schema emissions');
lines.push('- BreadcrumbList JSON-LD (NEW, treatment page does not currently emit this)');
lines.push('- ItemList JSON-LD wrapping the 118 providers (NEW)');
lines.push('- Each provider as LocalBusiness (NEW)');
lines.push('- NOTE: treatment page is currently a client component; refactor to server component required before schema can be SSR-emitted. This is the gating implementation question, see end of doc.');
lines.push('');
lines.push('---');
lines.push('');

// === IRON INFUSION ===
lines.push('## Pilot 4 of 4, /treatments/iron-infusion');
lines.push('');
lines.push('### Title tag');
lines.push('IV Iron Infusion Clinics Near Me | TheDripMap');
lines.push('');
lines.push('### Meta description');
lines.push('Compare IV iron infusion providers on TheDripMap. 36 clinics across North America. Real ratings, real reviews. Iron deficiency suitability must be confirmed with a licensed clinician.');
lines.push('');
lines.push('### H1');
lines.push('IV Iron Infusion Clinics');
lines.push('');
lines.push('### 200-word intro');
lines.push('');
lines.push('IV iron infusion is the protocol used to deliver elemental iron directly into the bloodstream. 36 clinics on TheDripMap currently offer IV iron, with the deepest local markets in Edmonton, Markham, New Westminster, and Kelowna. IV iron is unlike most wellness drips: it is typically prescribed for diagnosed iron deficiency or iron deficiency anemia, requires bloodwork before and after the infusion, and is usually delivered in a clinical or hospital-affiliated setting rather than a wellness lounge. The brands and formulations vary, including iron sucrose, ferric derisomaltose, ferumoxytol, and ferric carboxymaltose, and the clinic will select the formulation appropriate to the indication.');
lines.push('');
lines.push('IV iron in Canada is administered by physicians, nurse practitioners, or registered nurses under a prescription or written medical directive. Quebec, Ontario, BC, and Alberta each regulate the practice through their respective nursing and physician colleges. In the United States, IV iron is similarly administered by physicians, NPs, PAs, and RNs under appropriate orders.');
lines.push('');
lines.push('Suitability, dose, and indications must be confirmed with a licensed clinician. General information only.');
lines.push('');
lines.push('### Clinics offering IV iron, grouped by city (3+ providers per city)');
lines.push('');
for (const c of data.ironByCity.filter((c) => c.count >= 3)) {
  lines.push('**' + c.city + '  (' + c.count + ' providers)**');
  for (const p of c.providers) {
    lines.push('- ' + fmt(p) + '   /providers/' + p.slug);
  }
  lines.push('');
}
const othersIron = data.ironByCity.filter((c) => c.count < 3 && c.count > 0);
if (othersIron.length) {
  lines.push('**Other locations**, ' + othersIron.length + ' additional cities have 1 to 2 listed IV iron providers (e.g. ' + othersIron.slice(0, 4).map((c) => c.city.split(',')[0]).join(', ') + ', and others). Full list available on the page.');
  lines.push('');
}
lines.push('### Links to related treatments + city pages');
lines.push('- Related: /treatments/b12-shot, /treatments/hydration, /treatments/myers-cocktail');
lines.push('- Top cities: /cities/edmonton, /cities/kelowna');
lines.push('');
lines.push('### Schema emissions');
lines.push('- BreadcrumbList + ItemList + per-clinic LocalBusiness (NEW). See gating implementation note at end.');
lines.push('');
lines.push('---');
lines.push('');

// === GATE AUDIT ===
lines.push('## 3-provider gate audit summary');
lines.push('');
lines.push('**Cities passing gate: 112 of 358** (41 CA, 71 US). Will be indexed.');
lines.push('');
lines.push('**Cities failing gate: 246** (59 with 2 providers, 187 with 1 provider). Will be noindexed via robots meta on the city page when listings.length < 3.');
lines.push('');
lines.push('**Treatments passing gate (all 15 currently in the navigation, all pass 3+ provider count):**');
lines.push('- hydration (252), immune-support (170), weight-loss (182), mobile-iv (119), NAD+ (118), energy-boost (117), beauty-glow (109), myers-cocktail (72), glutathione (69), recovery (67), high-dose-vitamin-c (58), iron-infusion (36), hangover (35), b12-shot (12), jet-lag (5)');
lines.push('');
lines.push('**Cities-with-3+-providers for the per-city groupings inside each treatment page:**');
lines.push('- NAD+: 10 cities pass (Toronto 18, Las Vegas 10, Calgary 8, Markham 6, Mississauga 5, Richmond Hill 3, Burlington 3, Vaughan 3, Halifax 3, Montreal 3). Remaining grouped as Other locations.');
lines.push('- Iron infusion: 4 cities pass (Edmonton 4, Markham 3, New Westminster 3, Kelowna 3). Remaining grouped as Other locations.');
lines.push('');
lines.push('---');
lines.push('');

// === IMPLEMENTATION FLAG ===
lines.push('## Gating implementation question');
lines.push('');
lines.push('The city page (app/cities/[slug]/page.tsx) is a server component. I can add ItemList + LocalBusiness JSON-LD and the new structured 200-word intros directly. **No refactor.**');
lines.push('');
lines.push('The treatment page (app/treatments/[service]/page.tsx) is currently a `use client` component. It cannot emit JSON-LD server-side, and the data fetching happens in a useEffect after hydration. To deliver the operator-spec schema (ItemList + LocalBusiness + BreadcrumbList) on treatment pages, the file needs a server-component refactor. **This is roughly a 60 to 90 minute task** that touches data fetching, search-params handling, and the existing useEffect pipeline.');
lines.push('');
lines.push('**Recommendation:** ship the city pilots first (Toronto + Vancouver) which need no refactor, then come back for the treatment page refactor in a separate commit.');
lines.push('');
lines.push('---');
lines.push('');
lines.push('## What I need from operator to proceed');
lines.push('');
lines.push('1. **Greenlight the 4 pilot copy blocks above** (intros + FAQs + popular-treatments + clinic ordering) or send line-level edits.');
lines.push('2. **Decide on the treatment-page refactor:** approve the 60 to 90 minute server-component refactor now, or defer pilots 3 and 4 and ship cities only.');
lines.push('3. **Confirm: 246 failing cities should be noindexed when the deepening lands.** Their pages stay reachable by URL but drop from the sitemap and emit robots:noindex.');
lines.push('4. **Run the two unrun migrations from yesterday** (scripts/sql/add-safety-verified.sql and scripts/sql/add-kit-orders.sql) in the Supabase SQL editor, then run `node scripts/_apply-pending-migrations.cjs` to verify both are applied. The deepening commit will assume safety_verified exists.');
lines.push('');
lines.push('Once you approve, the code commits will be:');
lines.push('- A: city page schema additions + Toronto/Vancouver content extensions');
lines.push('- B: per-city deep intro lib + regulator reference data');
lines.push('- C: noindex on failing city pages');
lines.push('- D (optional, if greenlit): treatment page server-component refactor + NAD+ and Iron Infusion deepening');
lines.push('- E: blog to commercial internal link map (separate task, post-pilot-approval)');

fs.writeFileSync('./scripts/_city-treatment-pilot-review.md', lines.join('\n'));
fs.unlinkSync('./.tmp-pilot-data.json');
console.log('Wrote scripts/_city-treatment-pilot-review.md, ' + lines.length + ' lines');
