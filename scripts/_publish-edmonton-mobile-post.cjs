/**
 * Publish the Edmonton mobile IV blog post (operator-approved 2026-06-07).
 * Last of the 4 Canadian city posts in the Canada-first pivot.
 *
 * Same schema shape as the Vancouver, Ottawa, and Calgary posts.
 * Idempotent: re-running upserts on slug.
 */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const sb = require('@supabase/supabase-js').createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const SLUG = 'mobile-iv-therapy-edmonton';
const TITLE = 'Mobile IV Therapy Edmonton: How It Works in Alberta, Honest Pricing, and Where to Find a Licensed Nurse';
const META_TITLE = 'Mobile IV Therapy Edmonton: How It Works, CAD Pricing, Alberta Rules';
const META_DESCRIPTION = 'Mobile and in-home IV therapy in Edmonton. Coverage from Downtown and Whyte Ave to the surrounding suburbs, real CAD pricing, Alberta regulation under CRNA and CNDA, and how to find a licensed nurse or naturopathic doctor.';
const EXCERPT = 'Complete guide to mobile and in-home IV therapy in Edmonton. Coverage areas, 2026 CAD pricing, who can legally administer IV under Alberta rules (CRNA for nurses, CNDA for naturopathic doctors), and how to vet a provider before booking.';
const CATEGORY = 'City Guides';
const AUTHOR = 'TheDripMap Editorial Team';
const IMAGE_URL = 'https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/mobile-iv-therapy-kit-home-delivery.jpg';
const RELATED_CLINICS = [
  '4a612a6c-ee92-40e7-b469-470a0835be8e', // Optimum Wellness Integrated Clinic
  '0d88abfc-8435-44e8-b0a8-19c48166621f', // Zia IV Infusion & Injection Lounge
  '42334a93-4137-4ac1-926e-befb93f5bd1b', // The Lounge Medical Spa & Wellness
];

const CONTENT = `You finished a brutal week at the office Downtown and your body feels like it has been through the wringer. You just landed at YEG after a long international flight and your head is splitting. You woke up rough after a long night on Whyte Ave. Or it is minus thirty outside, you are deep into a flu, and the idea of bundling up to drive to a clinic feels impossible. In-home IV therapy is built for these exact moments.

Edmonton's mobile IV scene is concentrated, with several dedicated IV brand-name clinics (VitaDrip, Zia IV Infusion, Tonic IV, Viva Wellness Drip, VitaPoke) but no provider currently listed as mobile-only in our directory. Most Edmonton IV therapy is in-clinic, with several clinics arranging in-home or hotel-room delivery as a concierge service when you ask. This guide walks through how it works, what it costs in CAD, who is allowed to administer it under Alberta rules, and how to vet a provider before you book.

## How Mobile IV Therapy Works in Edmonton

**1. Book online or by phone.** Most Edmonton providers offering in-home or mobile IV operate by appointment rather than as standalone mobile-only services. You select your drip, enter your address, and choose a time window. Same-day availability depends on the provider and is more common on weekends.

**2. A licensed nurse or naturopathic doctor arrives.** In Alberta, IV administration is a regulated practice. A registered nurse or nurse practitioner under the College of Registered Nurses of Alberta (CRNA), or a naturopathic doctor with the appropriate IV authorization from the College of Naturopathic Doctors of Alberta (CNDA), arrives at your location with supplies and monitoring equipment.

**3. Brief health intake.** Before inserting the IV the provider completes a health screening covering current medications, allergies, medical history, and vitals. This takes 5 to 10 minutes and is non-negotiable for safety.

**4. Treatment.** The IV is inserted, usually in the forearm. Most drips run 30 to 60 minutes. You can lie in bed, watch TV, or work while the provider manages the drip.

**5. Done.** The provider removes the IV, disposes of all equipment, and you are free to continue your day.

A note on the CRNA acronym: in Alberta, CRNA refers to the College of Registered Nurses of Alberta, the regulatory body for RNs and NPs. The same acronym in the United States stands for Certified Registered Nurse Anesthetist, which is a different credential. When researching providers, make sure you are looking at the Alberta college, not the US designation.

## Mobile IV Coverage Across Edmonton

**Core service areas (60 to 90 min response window, when in-home is available):**
- Downtown, Oliver, Ice District, ICE District-adjacent
- Garneau, Old Strathcona, Whyte Ave corridor
- Westmount, Glenora, Crestwood
- Strathearn, Bonnie Doon, Mill Creek
- Highlands, McCauley, Riverdale

**Served with longer windows (90 to 120 min):**
- West Edmonton, The Hamptons, Lewis Farms
- Mill Woods, Meadows, Larkspur
- Riverbend, Terwillegar Heights
- Castle Downs, Calder, Beverly
- Sherwood Park, St. Albert (with potential surcharge)
- Beaumont, Spruce Grove, Stony Plain, Leduc (with potential surcharge)

Most Edmonton clinics that offer in-home delivery do so within a tight river-valley and inner-suburb radius. For Sherwood Park, St. Albert, and the Acheson corridor, expect a surcharge or no service.

## Most Common IV Drips in Edmonton

**Hydration IV.** A standard hydration drip is 500 to 1000 ml of saline with B-complex and electrolytes. Common requests after long-haul flights, hangovers, river valley training days, or a week of skiing in Jasper. Cost: $150 to $250 CAD plus mobile fee if in-home.

**Myers Cocktail.** The classic blended IV of B vitamins, vitamin C, magnesium, and calcium. Popular as a recurring booking for busy Downtown and Old Strathcona professionals. Cost: $175 to $300 CAD plus mobile fee if in-home.

**Immune Boost IV.** High-dose vitamin C, zinc, and B vitamins. Demand spikes October through April during the long Edmonton cold and flu season. Cost: $150 to $250 CAD plus mobile fee if in-home.

**NAD+ IV.** A slow infusion of NAD+. Sessions typically run 2 to 4 hours and almost always require an in-clinic visit, as most Edmonton NAD+ providers do not offer it in-home. Cost: $400 to $1,000 CAD depending on dose.

**Hangover Recovery.** Saline plus B vitamins, anti-nausea options, and electrolytes. Saturday and Sunday mornings dominate bookings, especially around Whyte Ave and Downtown. Cost: $175 to $275 CAD plus mobile fee if in-home.

## Mobile and In-Clinic IV Pricing in Edmonton: 2026 Breakdown

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
| Sherwood Park / St. Albert / Beaumont surcharge | $25 to $75 additional |

In-clinic visits typically skip the mobile fee entirely. Final pricing varies by provider, time of day, and address. Confirm everything in writing before booking.

## Who Can Legally Administer IV Therapy in Alberta

This is the single most important question when booking IV therapy in Edmonton, because Alberta's regulatory framework is clearly defined under the Health Professions Act.

**Registered nurses and nurse practitioners.** RNs and NPs are regulated by the **College of Registered Nurses of Alberta (CRNA)**. They can administer IV therapy under appropriate physician orders or established standing orders. This is the most common pathway for clinic-based IV in Edmonton and for any in-home delivery a clinic offers.

**Naturopathic doctors.** NDs are regulated by the **College of Naturopathic Doctors of Alberta (CNDA)**. NDs with the appropriate IV authorization granted by CNDA can legally administer IV therapy in Alberta. Not every ND has this authorization, so confirm directly with the provider if you specifically want an ND-led drip.

**Physicians.** MDs and DOs regulated by the College of Physicians and Surgeons of Alberta (CPSA) can prescribe and administer IV therapy.

This is general information, not legal or medical advice. Confirm credentials directly with the provider before booking. For the full Canadian regulatory picture, see our [Canada IV therapy regulation guide](/blog/who-can-legally-give-iv-canada-rules-by-province-2026).

## What Makes a Good Edmonton IV Therapy Provider

- A licensed RN or NP registered with the CRNA, or a CNDA-authorized naturopathic doctor with the appropriate IV authorization
- A medical directive signed by a supervising physician or NP, where required
- Pharmaceutical-grade compounds from a licensed Alberta pharmacy
- Proper biohazard waste disposal
- For in-home delivery, liability insurance that covers in-home work specifically, not every malpractice policy does
- Clear booking, late-arrival, and cancellation policies

## Frequently Asked Questions

**How quickly can a mobile IV nurse arrive in Edmonton?**
For clinics that offer in-home as an extra service, response times in Downtown, Oliver, Garneau, and Old Strathcona are typically 60 to 120 minutes. West Edmonton, Mill Woods, and Sherwood Park run longer. Most Edmonton IV clinics do not advertise an explicit response-time window, so confirm with the provider directly when you book.

**Is in-home IV therapy as safe as going to a clinic?**
For standard hydration and vitamin drips administered by a CRNA-registered nurse or a CNDA-authorized naturopathic doctor, in-home IV carries a comparable safety profile to in-clinic treatment. The main risks are vein irritation, vasovagal reactions, and rare allergic responses.

**Can a naturopathic doctor give an IV in Alberta?**
Yes, when they hold the appropriate IV authorization granted by the College of Naturopathic Doctors of Alberta (CNDA). Not every ND has this authorization, so confirm directly with the provider.

**Can an Edmonton clinic come to my hotel room?**
Downtown Edmonton hotels (the Fairmont Hotel Macdonald, the JW Marriott in the Ice District, the Westin, the Sutton Place) are typically within the service radius. The West Edmonton Mall complex hotels (Fantasyland Hotel, Hilton) may require a longer drive or surcharge. Confirm directly when booking.

**Are there any explicitly mobile-only IV providers in Edmonton right now?**
TheDripMap does not currently list a dedicated mobile-only IV provider for Edmonton. Most Edmonton IV therapy is in-clinic, with several clinics offering in-home or concierge delivery as a side service when you ask. If you specifically need mobile-only service, calling a few of the Edmonton IV-brand clinics directly (VitaDrip, Zia IV, Tonic IV, VitaPoke, Viva Wellness Drip) is the most reliable path.

**Will an Edmonton provider come to Jasper or Banff?**
Service to Jasper or Banff is rare from Edmonton-based providers and usually requires a custom arrangement with a significant travel fee. If you are staying in the mountains, ask the provider directly before booking.

**What should I do to prepare for an IV therapy appointment?**
Drink water if possible, eat a light snack, wear loose clothing with easy forearm access, and have a comfortable place to sit or lie down for 45 to 60 minutes.

## Find IV Therapy in Edmonton

TheDripMap lists IV therapy providers across Edmonton and central Alberta with credential filters and direct links.

[Browse all Edmonton clinics](/cities/edmonton) · [Find mobile IV nearby](/search?type=Mobile&city=Edmonton) · [Take the matching quiz](/quiz)

**Related articles:**
- [Mobile IV Therapy Toronto and the GTA: Complete Guide](/blog/mobile-iv-therapy-toronto-gta)
- [Mobile IV Therapy Vancouver: BC Pricing and Regulation](/blog/mobile-iv-therapy-vancouver)
- [Mobile IV Therapy Ottawa: Ontario Pricing and Regulation](/blog/mobile-iv-therapy-ottawa)
- [Mobile IV Therapy Calgary: Alberta Pricing and Regulation](/blog/mobile-iv-therapy-calgary)
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

## Top IV therapy providers in Edmonton

Edmonton has a concentrated IV therapy market with several dedicated-IV brand names. The providers below are the visible options in our directory as of 2026, primarily in-clinic with some offering concierge in-home delivery on request.

### 1. [Optimum Wellness Integrated Clinic](/providers/optimum-wellness-integrated-clinic-edmonton)
*Edmonton, AB*

The highest-rated Edmonton IV listing in our directory (4.7 stars across 118 reviews on Google). Integrated wellness clinic with IV therapy among its services. Confirm specific drip menus and any in-home delivery availability at booking.

### 2. [Zia IV Infusion & Injection Lounge](/providers/zia-iv-infusion-and-injection-lounge-edmonton)
*Edmonton, AB*

Dedicated IV infusion lounge in Edmonton. The clinic format suggests focused IV-and-injection services as the primary offering. Confirm in-home availability directly with the lounge.

### 3. [The Lounge Medical Spa & Wellness](/providers/the-lounge-medical-spa-and-wellness-edmonton)
*Edmonton, AB*

Medical spa with IV therapy, hydration drips, and vitamin injections among its services. Primarily in-clinic. Confirm any in-home availability at booking.

For the complete Edmonton IV roster including additional dedicated-IV clinics like VitaDrip IV, Tonic IV, VitaPoke Infusion Lounge, and Viva Wellness Drip, see [/cities/edmonton](/cities/edmonton).

## Frequently Asked Questions About Mobile IV Therapy in Edmonton

### How does mobile IV therapy work in Edmonton?
A CRNA-registered nurse or nurse practitioner, or a CNDA-authorized naturopathic doctor, comes to your home, hotel, or office with all required supplies, or you visit the clinic if mobile service is not available for your address. After a brief intake covering medications, allergies, and vitals, the provider inserts the IV and stays through the infusion, typically 30 to 60 minutes for hydration drips and longer for NAD+ or extended protocols.

### How much does mobile IV cost in Edmonton?
Most providers charge $150 to $300 CAD for the drip itself plus a $75 to $150 in-home mobile fee when that service is available. Group bookings of three or more people at one location often reduce the per-person cost. NAD+ protocols are priced separately and typically start at $400 CAD.

### Are there mobile-only IV providers in Edmonton?
TheDripMap does not currently list a dedicated mobile-only IV provider for Edmonton. Most Edmonton IV therapy happens in-clinic, with several clinics offering in-home or concierge delivery on request. Calling individual Edmonton IV-brand clinics directly (VitaDrip, Zia IV, Tonic IV, VitaPoke, Viva Wellness Drip) is the most reliable way to find an in-home appointment.

### Is mobile IV safe in Alberta?
When performed by a CRNA-registered nurse under physician oversight, or by a CNDA-authorized naturopathic doctor with the appropriate IV authorization, mobile IV therapy carries a comparable safety profile to in-clinic treatment. Risks are minimal but include vein irritation, vasovagal reactions, and rare allergic responses. Always confirm the provider carries liability insurance that covers in-home work specifically.

### Can a naturopathic doctor administer IV therapy in Alberta?
Yes, when they hold the appropriate IV authorization granted by the College of Naturopathic Doctors of Alberta (CNDA). Not every ND in Alberta has this authorization, so confirm directly with the provider before booking.

### Will Edmonton providers come to Jasper or Banff?
Service to Jasper or Banff is rare from Edmonton-based providers and usually requires a custom arrangement with a significant travel fee. If you are staying in the mountains, ask the provider directly before booking.
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
  const outPath = path.join('scripts/_receipts', 'edmonton-mobile-post-' + Date.now() + '.json');
  fs.writeFileSync(outPath, JSON.stringify({ phase: 'publish-edmonton-mobile-post', timestamp: now, blog_posts_id: res.data.id, slug: SLUG, content_length: CONTENT.length, related_clinics: RELATED_CLINICS }, null, 2));
  console.log('Receipt:', outPath);
})();
