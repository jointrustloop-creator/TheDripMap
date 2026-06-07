/**
 * Publish the Calgary mobile IV blog post (operator-approved 2026-06-06).
 *
 * Same schema shape as the Vancouver and Ottawa posts.
 * Idempotent: re-running upserts on slug.
 */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const sb = require('@supabase/supabase-js').createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const SLUG = 'mobile-iv-therapy-calgary';
const TITLE = 'Mobile IV Therapy Calgary: How It Works in Alberta, Honest Pricing, and Where to Find a Licensed Nurse';
const META_TITLE = 'Mobile IV Therapy Calgary: How It Works, CAD Pricing, Alberta Rules';
const META_DESCRIPTION = 'Mobile and in-home IV therapy in Calgary. Coverage from downtown to the suburbs, real CAD pricing, Alberta regulation under CRNA and CNDA, and how to find a licensed nurse or naturopathic doctor.';
const EXCERPT = 'Complete guide to mobile and in-home IV therapy in Calgary. Coverage areas, 2026 CAD pricing, who can legally administer IV under Alberta rules (CRNA for nurses, CNDA for naturopathic doctors), and how to vet a provider before booking.';
const CATEGORY = 'City Guides';
const AUTHOR = 'TheDripMap Editorial Team';
const IMAGE_URL = 'https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/mobile-iv-therapy-kit-home-delivery.jpg';
const RELATED_CLINICS = [
  '86c2e006-250e-4813-b668-39b8abc19064', // Nova Naturopathic Clinic
  '69c6e446-28af-4b48-b09d-02a3c8ab04c3', // Vitality BioMed
  '18268d99-1551-4376-8662-0314558a583c', // Anara Infusion & Wellness
];

const CONTENT = `You finished a long day at the office in the Beltline and your head is killing you. You just landed at YYC after a brutal flight and your body feels rebooted in the wrong way. You woke up rough after a night out on 17th Avenue. Or you are deep into a brutal flu and the last thing you want to do is bundle up and drive to a clinic in this weather. In-home IV therapy is built for these exact moments.

Calgary's mobile IV scene is smaller and less concentrated than Toronto's or Vancouver's. Most Calgary IV therapy happens in-clinic, but several Calgary clinics will quietly arrange in-home or hotel-room delivery as a concierge service if you ask. This guide walks through how it works, what it costs in CAD, who is allowed to administer it under Alberta rules, and how to vet a provider before you book.

## How Mobile IV Therapy Works in Calgary

**1. Book online or by phone.** Most Calgary providers offering in-home or mobile IV operate by appointment rather than as standalone mobile-only services. You select your drip, enter your address, and choose a time window. Same-day availability depends on the provider and is more common on weekends.

**2. A licensed nurse or naturopathic doctor arrives.** In Alberta, IV administration is a regulated practice. A registered nurse or nurse practitioner under the College of Registered Nurses of Alberta (CRNA), or a naturopathic doctor with the appropriate IV authorization from the College of Naturopathic Doctors of Alberta (CNDA), arrives at your location with supplies and monitoring equipment.

**3. Brief health intake.** Before inserting the IV the provider completes a health screening covering current medications, allergies, medical history, and vitals. This takes 5 to 10 minutes and is non-negotiable for safety.

**4. Treatment.** The IV is inserted, usually in the forearm. Most drips run 30 to 60 minutes. You can lie in bed, watch TV, or work while the provider manages the drip.

**5. Done.** The provider removes the IV, disposes of all equipment, and you are free to continue your day.

A note on the CRNA acronym: in Alberta, CRNA refers to the College of Registered Nurses of Alberta, the regulatory body for RNs and NPs. The same acronym in the United States stands for Certified Registered Nurse Anesthetist, which is a different credential. When researching providers, make sure you are looking at the Alberta college, not the US designation.

## Mobile IV Coverage Across Calgary

**Core service areas (60 to 90 min response window, when in-home is available):**
- Downtown, Beltline, Eau Claire, East Village
- Mission, Erlton, Inglewood, Bridgeland
- Kensington, Sunnyside, Hillhurst
- Bankview, Mount Royal, Cliff Bungalow

**Served with longer windows (90 to 120 min):**
- Marda Loop, Mount Pleasant, Killarney
- Aspen Woods, Springbank
- Mahogany, Auburn Bay, Cranston (SE)
- Tuscany, Royal Oak (NW)
- Country Hills, Coventry Hills, Symons Valley (N)

Most Calgary clinics that offer in-home delivery do so within a tight downtown and inner-suburb radius. For the far SE and far NW, expect either no service or a substantial surcharge.

## Most Common IV Drips in Calgary

**Hydration IV.** A standard hydration drip is 500 to 1000 ml of saline with B-complex and electrolytes. Common requests after long-haul flights, hangovers, or a week of skiing in Kananaskis or Banff. Cost: $150 to $250 CAD plus mobile fee if in-home.

**Myers Cocktail.** The classic blended IV of B vitamins, vitamin C, magnesium, and calcium. Popular as a recurring booking for busy professionals downtown. Cost: $175 to $300 CAD plus mobile fee if in-home.

**Immune Boost IV.** High-dose vitamin C, zinc, and B vitamins. Demand spikes October through March during the long Calgary cold and flu season. Cost: $150 to $250 CAD plus mobile fee if in-home.

**NAD+ IV.** A slow infusion of NAD+. Sessions typically run 2 to 4 hours and almost always require an in-clinic visit, as most Calgary NAD+ providers do not offer it in-home. Cost: $400 to $1,000 CAD depending on dose.

**Hangover Recovery.** Saline plus B vitamins, anti-nausea options, and electrolytes. Saturday and Sunday mornings dominate bookings. Cost: $175 to $275 CAD plus mobile fee if in-home.

## Mobile and In-Clinic IV Pricing in Calgary: 2026 Breakdown

| Service | Price Range (CAD) |
|---------|------------------|
| Basic hydration | $150 to $250 |
| Myers Cocktail | $175 to $300 |
| Immune boost | $150 to $250 |
| Hangover recovery | $175 to $275 |
| NAD+ low dose | $400 to $650 |
| NAD+ high dose | $700 to $1,000 |
| Glutathione add-on | $50 to $100 |
| In-home mobile fee (solo) | $75 to $150 |
| In-home mobile fee (groups of 3+) | $30 to $60 per person |
| Far-suburb surcharge | $25 to $75 additional |

In-clinic visits typically skip the mobile fee entirely. Final pricing varies by provider, time of day, and address. Confirm everything in writing before booking.

## Who Can Legally Administer IV Therapy in Alberta

This is the single most important question when booking IV therapy in Calgary, because Alberta's regulatory framework is clearly defined under the Health Professions Act.

**Registered nurses and nurse practitioners.** RNs and NPs are regulated by the **College of Registered Nurses of Alberta (CRNA)**. They can administer IV therapy under appropriate physician orders or established standing orders. This is the most common pathway for clinic-based IV in Calgary and for any in-home delivery a clinic offers.

**Naturopathic doctors.** NDs are regulated by the **College of Naturopathic Doctors of Alberta (CNDA)**. NDs with the appropriate IV authorization granted by CNDA can legally administer IV therapy in Alberta. Not every ND has this authorization, so confirm directly with the provider if you specifically want an ND-led drip.

**Physicians.** MDs and DOs regulated by the College of Physicians and Surgeons of Alberta (CPSA) can prescribe and administer IV therapy.

This is general information, not legal or medical advice. Confirm credentials directly with the provider before booking. For the full Canadian regulatory picture, see our [Canada IV therapy regulation guide](/blog/who-can-legally-give-iv-canada-rules-by-province-2026).

## What Makes a Good Calgary IV Therapy Provider

- A licensed RN or NP registered with the CRNA, or a CNDA-authorized naturopathic doctor with the appropriate IV authorization
- A medical directive signed by a supervising physician or NP, where required
- Pharmaceutical-grade compounds from a licensed Alberta pharmacy
- Proper biohazard waste disposal
- For in-home delivery, liability insurance that covers in-home work specifically, not every malpractice policy does
- Clear booking, late-arrival, and cancellation policies

## Frequently Asked Questions

**How quickly can a mobile IV nurse arrive in Calgary?**
For clinics that offer in-home as an extra service, response times in downtown and inner-city neighborhoods are typically 60 to 120 minutes. Far suburbs run longer. Most Calgary IV clinics do not advertise an explicit response-time window, so confirm with the provider directly when you book.

**Is in-home IV therapy as safe as going to a clinic?**
For standard hydration and vitamin drips administered by a CRNA-registered nurse or a CNDA-authorized naturopathic doctor, in-home IV carries a comparable safety profile to in-clinic treatment. The main risks are vein irritation, vasovagal reactions, and rare allergic responses.

**Can a naturopathic doctor give an IV in Alberta?**
Yes, when they hold the appropriate IV authorization granted by the College of Naturopathic Doctors of Alberta (CNDA). Not every ND has this authorization, so confirm directly with the provider.

**Can a Calgary clinic come to my hotel room or to a Banff or Canmore hotel?**
Downtown Calgary hotels (the Fairmont Palliser, the Hyatt, the Westin, the Sheraton Suites) are typically within the service radius. Service to Banff, Canmore, or Lake Louise is rare from Calgary-based providers and usually requires a custom arrangement with significant travel fee.

**Are there any explicitly mobile-only IV providers in Calgary right now?**
TheDripMap does not currently list a dedicated mobile-only IV provider for Calgary. Most Calgary IV therapy is in-clinic, with several clinics offering in-home or concierge delivery as a side service when you ask. If you specifically need mobile-only service, calling a few of the Calgary IV clinics directly is the most reliable path.

**What should I do to prepare for an IV therapy appointment?**
Drink water if possible, eat a light snack, wear loose clothing with easy forearm access, and have a comfortable place to sit or lie down for 45 to 60 minutes.

## Find IV Therapy in Calgary

TheDripMap lists IV therapy providers across Calgary and southern Alberta with credential filters and direct links.

[Browse all Calgary clinics](/cities/calgary) · [Find mobile IV nearby](/search?type=Mobile&city=Calgary) · [Take the matching quiz](/quiz)

**Related articles:**
- [Mobile IV Therapy Toronto and the GTA: Complete Guide](/blog/mobile-iv-therapy-toronto-gta)
- [Mobile IV Therapy Vancouver: BC Pricing and Regulation](/blog/mobile-iv-therapy-vancouver)
- [Mobile IV Therapy Ottawa: Ontario Pricing and Regulation](/blog/mobile-iv-therapy-ottawa)
- [Who Can Legally Give an IV in Canada: Rules by Province](/blog/who-can-legally-give-iv-canada-rules-by-province-2026)
- [IV Therapy Insurance Coverage in Canada](/blog/iv-therapy-insurance-coverage-canada)

## Explore More IV Therapy Across Canada

For the Ontario directory and our Canada-wide regulation pillar, see the [Ontario IV therapy directory](/cities/ontario) and our [Canada regulation guide](/blog/who-can-legally-give-iv-canada-rules-by-province-2026).

## Research and Sources

- Gaby, A.R. (2002). Intravenous nutrient therapy: the Myers cocktail. *Alternative Medicine Review*, 7(5), 389-403.
- Carr, A.C., and Maggini, S. (2017). Vitamin C and immune function. *Nutrients*, 9(11), 1211.
- Verdin, E. (2015). NAD+ in aging, metabolism, and neurodegeneration. *Science*, 350(6265), 1208-1213.
- College of Registered Nurses of Alberta. Practice standards and IV therapy guidelines.
- College of Naturopathic Doctors of Alberta. Scope of practice and IV authorization.

## Top IV therapy providers in Calgary

Calgary's IV therapy market is broader than its mobile-only segment. The providers below are the visible options in our directory as of 2026, primarily in-clinic with some offering concierge in-home delivery on request.

### 1. [Nova Naturopathic Clinic](/providers/nova-naturopathic-clinic-calgary)
*Calgary, AB*

The highest-rated Calgary IV listing in our directory (5 stars across 34 reviews on Google). Naturopathic clinic with IV therapy among its services. Confirm in-home availability directly with the clinic.

### 2. [Vitality BioMed](/providers/vitality-biomed-calgary)
*Calgary, AB*

IV therapy clinic with a clearly stated drip menu including IV therapy, NAD+, Myers Cocktail, hydration, and immune support drips. Primarily in-clinic. Confirm any in-home availability at booking.

### 3. [Anara Infusion & Wellness](/providers/anara-infusion-and-wellness-calgary)
*Calgary, AB*

Dedicated infusion and wellness clinic in Calgary. Confirm specific drip menus and any in-home delivery availability at the time of booking.

For the complete Calgary IV roster including additional clinics, see [/cities/calgary](/cities/calgary).

## Frequently Asked Questions About Mobile IV Therapy in Calgary

### How does mobile IV therapy work in Calgary?
A CRNA-registered nurse or nurse practitioner, or a CNDA-authorized naturopathic doctor, comes to your home, hotel, or office with all required supplies, or you visit the clinic if mobile service is not available for your address. After a brief intake covering medications, allergies, and vitals, the provider inserts the IV and stays through the infusion, typically 30 to 60 minutes for hydration drips and longer for NAD+ or extended protocols.

### How much does mobile IV cost in Calgary?
Most providers charge $150 to $300 CAD for the drip itself plus a $75 to $150 in-home mobile fee when that service is available. Group bookings of three or more people at one location often reduce the per-person cost. NAD+ protocols are priced separately and typically start at $400 CAD.

### Are there mobile-only IV providers in Calgary?
TheDripMap does not currently list a dedicated mobile-only IV provider for Calgary. Most Calgary IV therapy happens in-clinic, with several clinics offering in-home or concierge delivery on request. Calling individual Calgary clinics directly is the most reliable way to find an in-home appointment.

### Is mobile IV safe in Alberta?
When performed by a CRNA-registered nurse under physician oversight, or by a CNDA-authorized naturopathic doctor with the appropriate IV authorization, mobile IV therapy carries a comparable safety profile to in-clinic treatment. Risks are minimal but include vein irritation, vasovagal reactions, and rare allergic responses. Always confirm the provider carries liability insurance that covers in-home work specifically.

### Can a naturopathic doctor administer IV therapy in Alberta?
Yes, when they hold the appropriate IV authorization granted by the College of Naturopathic Doctors of Alberta (CNDA). Not every ND in Alberta has this authorization, so confirm directly with the provider before booking.

### Will Calgary providers come to Banff or Canmore?
Service to Banff, Canmore, or Lake Louise is rare from Calgary-based providers and usually requires a custom arrangement with a significant travel fee. If you are staying in the mountains, ask the provider directly before booking.
`;

(async () => {
  const now = new Date().toISOString();
  const payload = {
    slug: SLUG, title: TITLE, content: CONTENT, excerpt: EXCERPT, category: CATEGORY, author: AUTHOR,
    image_url: IMAGE_URL, imageUrl: IMAGE_URL,
    date: now, last_updated: now, lastUpdated: now.slice(0, 10),
    meta_title: META_TITLE, metaTitle: META_TITLE,
    meta_description: META_DESCRIPTION, metaDescription: META_DESCRIPTION,
    related_clinics: RELATED_CLINICS, relatedClinics: RELATED_CLINICS,
    related_cities: [], relatedCities: null,
  };

  const { data: existing } = await sb.from('blog_posts').select('id').eq('slug', SLUG).maybeSingle();
  let res;
  if (existing) {
    res = await sb.from('blog_posts').update(payload).eq('id', existing.id).select().single();
  } else {
    res = await sb.from('blog_posts').insert(payload).select().single();
  }
  if (res.error) { console.error('Failed:', res.error.message); process.exit(1); }
  console.log(existing ? 'Updated' : 'Inserted', 'blog_posts row:', res.data.id, '|', res.data.slug);

  const dashes = (CONTENT.match(/[—–]/g) || []).length;
  console.log('em/en-dash count:', dashes, dashes === 0 ? '✓' : '✗');

  fs.mkdirSync('scripts/_receipts', { recursive: true });
  const outPath = path.join('scripts/_receipts', 'calgary-mobile-post-' + Date.now() + '.json');
  fs.writeFileSync(outPath, JSON.stringify({ phase: 'publish-calgary-mobile-post', timestamp: now, blog_posts_id: res.data.id, slug: SLUG, content_length: CONTENT.length, related_clinics: RELATED_CLINICS }, null, 2));
  console.log('Receipt:', outPath);
})();
