/**
 * Publish the Vancouver mobile IV blog post (operator-approved 2026-06-06).
 *
 * Mirrors the Toronto-GTA mobile post's schema so the public page renders
 * with the same FAQPage JSON-LD, related_clinics block, and metadata
 * shape. Idempotent: re-running just upserts on slug.
 */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const sb = require('@supabase/supabase-js').createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const SLUG = 'mobile-iv-therapy-vancouver';
const TITLE = 'Mobile IV Therapy Vancouver: How It Works in BC, Honest Pricing, and Where to Find a Licensed Provider';
const META_TITLE = 'Mobile IV Therapy Vancouver: How It Works, CAD Pricing, BC Rules';
const META_DESCRIPTION = 'Mobile IV therapy delivered to your home, hotel, or office in Vancouver. Coverage across the Lower Mainland, real CAD pricing, BC regulation under CCHPBC and BCCNM, and how to find a licensed provider.';
const EXCERPT = "Complete guide to mobile IV therapy in Vancouver. Coverage areas, 2026 CAD pricing, who can legally administer IV under BC rules (CCHPBC for naturopathic physicians, BCCNM for nurses), and how to vet a provider before booking.";
const CATEGORY = 'City Guides';
const AUTHOR = 'TheDripMap Editorial Team';
// Re-use the same hero image as the Toronto mobile post — same topical
// territory, and we have not loaded a Vancouver-specific hero yet.
const IMAGE_URL = 'https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/mobile-iv-therapy-kit-home-delivery.jpg';
const RELATED_CLINICS = [
  '130603eb-7f81-40aa-bbb7-17f35b601550', // ZipDrip Mobile IV Therapy
  'd7c8c71a-8116-462d-b474-d05782302ec7', // Bay Wellness Centre
];

const CONTENT = `You woke up rough after a night out in Yaletown. Or you just landed at YVR after a long-haul from Asia and your body feels wrecked. Or you are deep into the third week of a flu that refuses to quit. Whatever brought you here, the last thing you want to do is get dressed, find parking on Burrard, and sit in a waiting room. Mobile IV therapy exists for exactly this moment.

Vancouver's mobile IV scene is smaller than Toronto's, but it is real, growing, and the BC regulatory framework is one of the clearest in Canada about who can legally do this work. This guide walks through how it works in Metro Vancouver, what it costs in CAD, who is allowed to administer it, and how to vet a provider before you book.

## How Mobile IV Therapy Works in Vancouver

**1. Book online or by phone.** Most Vancouver mobile IV providers offer online booking with real-time availability. You select your drip, enter your address, and choose a time window. Same-day availability is common on weekends.

**2. A licensed nurse or naturopathic physician arrives.** In BC, IV therapy is a controlled act. A registered nurse or nurse practitioner under BCCNM oversight, or a naturopathic physician with CCHPBC IV authority, arrives at your location. They bring all supplies including IV fluids, your chosen drip formula, and monitoring equipment.

**3. Brief health intake.** Before inserting the IV the provider completes a health screening covering current medications, allergies, medical history, and vitals. This takes 5 to 10 minutes and is non-negotiable for safety.

**4. Treatment.** The IV is inserted, usually in the forearm. Most drips run 30 to 60 minutes. You can lie in bed, watch TV, or work while the provider manages the drip.

**5. Done.** The provider removes the IV, disposes of all equipment, and you are free to continue your day.

## Mobile IV Coverage Across Metro Vancouver

**Core service areas (60 to 90 min response window):**
- Downtown Vancouver, Yaletown, West End, Coal Harbour, Gastown
- Kitsilano, Point Grey, Fairview, South Granville
- Mount Pleasant, Main Street, Olympic Village
- East Vancouver, Commercial Drive, Hastings-Sunrise

**Served with longer windows (90 to 120 min):**
- North Vancouver, West Vancouver
- Burnaby, New Westminster
- Richmond, Steveston
- Surrey, Coquitlam, Port Moody

Mobile IV providers in Vancouver tend to be smaller operations than in larger Canadian metros, so confirm availability for your address before you book.

## Most Common Mobile IV Drips in Vancouver

**Hydration IV.** A standard hydration drip is 500 to 1000 ml of saline with B-complex and electrolytes. Common requests after long-haul flights, hangovers, or a week of skiing in Whistler. Cost: $175 to $275 CAD plus mobile fee.

**Myers Cocktail.** The classic blended IV of B vitamins, vitamin C, magnesium, and calcium. Popular as a recurring booking for busy professionals downtown and on the North Shore. Cost: $200 to $325 CAD plus mobile fee.

**Immune Boost IV.** High-dose vitamin C, zinc, and B vitamins. Demand spikes October through March during cold and flu season. Cost: $175 to $275 CAD plus mobile fee.

**NAD+ IV.** A slow infusion of NAD+. The Vancouver biohacking and longevity community has strong interest. Sessions typically run 2 to 4 hours and require an in-clinic option for most providers, though some experienced practitioners offer in-home delivery. Cost: $400 to $1,000 CAD depending on dose.

**Hangover Recovery.** Saline plus B vitamins, anti-nausea options, and electrolytes. Saturday and Sunday mornings dominate bookings. Cost: $200 to $325 CAD plus mobile fee.

## Mobile IV Pricing in Vancouver: 2026 Breakdown

| Service | Price Range (CAD) |
|---------|------------------|
| Basic hydration | $175 to $275 |
| Myers Cocktail | $200 to $325 |
| Immune boost | $175 to $275 |
| Hangover recovery | $200 to $325 |
| NAD+ low dose | $400 to $650 |
| NAD+ high dose | $700 to $1,000 |
| Glutathione add-on | $50 to $100 |
| Mobile fee (solo) | $50 to $150 |
| Mobile fee (groups of 3+) | $25 to $50 per person |
| North Shore + Tri-Cities surcharge | $25 to $75 additional |

Final pricing varies by provider, time of day, and address. Confirm everything in writing before booking.

## Who Can Legally Administer IV Therapy in BC

This is the single most important question when booking mobile IV in Vancouver, because BC's regulatory framework is specific and well defined.

**Registered nurses and nurse practitioners.** RNs and NPs are regulated by the **BC College of Nurses and Midwives (BCCNM)**. They can administer IV therapy under appropriate physician orders or established standing orders. This is the most common pathway for mobile IV in Vancouver.

**Naturopathic physicians.** NDs are regulated by the **College of Complementary Health Professionals of BC (CCHPBC)**. NDs with the IV therapy and chelation prescribing authority granted by CCHPBC can legally administer IV therapy in BC. Not every ND has this authority, so confirm directly with the provider if you specifically want an ND-led drip.

**Physicians.** MDs and DOs regulated by the College of Physicians and Surgeons of BC (CPSBC) can prescribe and administer IV therapy.

This is general information, not legal or medical advice. Confirm credentials directly with the provider before booking. For the full Canadian regulatory picture, see our [Canada IV therapy regulation guide](/blog/who-can-legally-give-iv-canada-rules-by-province-2026).

## What Makes a Good Vancouver Mobile IV Provider

- A licensed RN or NP registered with BCCNM, or a naturopathic physician with CCHPBC IV infusion authority
- A medical directive signed by a supervising physician or NP, where required
- Pharmaceutical-grade compounds from a licensed BC pharmacy
- Proper biohazard waste disposal
- Liability insurance that covers in-home work specifically, not every malpractice policy does
- Clear booking, late-arrival, and cancellation policies

## Frequently Asked Questions

**How quickly can a mobile IV provider arrive in Vancouver?**
In downtown Vancouver and Kitsilano, response times are typically 60 to 90 minutes for same-day bookings. North Shore, Burnaby, Richmond, and Surrey usually run 90 to 120 minutes. Confirm response time in writing before you book.

**Is mobile IV therapy as safe as going to a clinic?**
For standard hydration and vitamin drips administered by a licensed BCCNM-registered nurse or a CCHPBC-authorized naturopathic physician, mobile IV carries a comparable safety profile to in-clinic treatment. For healthy adults receiving wellness drips, the main risks are vein irritation, vasovagal reactions, and rare allergic responses.

**Can a naturopathic doctor give an IV in BC?**
Yes, when they hold the IV therapy and chelation prescribing authority granted by the College of Complementary Health Professionals of BC (CCHPBC). Not every ND has this authority, so confirm directly with the provider.

**Can a mobile nurse come to my hotel room in Vancouver?**
Yes. Most Downtown Vancouver and West End hotels are within service areas. Let the front desk know you are expecting a medical professional. Most providers carry professional ID and are familiar with hotel call-outs.

**How much does mobile IV cost in Vancouver?**
Most providers charge $175 to $325 CAD for the drip itself plus a $50 to $150 mobile fee. Group bookings of three or more people at one location often reduce the per-person cost. NAD+ protocols are priced separately and start higher.

**What should I do to prepare for a mobile IV appointment?**
Drink water if possible, eat a light snack, wear loose clothing with easy forearm access, and have a comfortable place to sit or lie down for 45 to 60 minutes.

## Find Mobile IV Therapy in Vancouver

TheDripMap lists mobile and in-clinic IV therapy providers across Vancouver and the Lower Mainland with credential filters and direct links.

[Find mobile IV providers near you](/search?type=Mobile&city=Vancouver) · [View all Vancouver clinics](/cities/vancouver) · [Take the matching quiz](/quiz)

**Related articles:**
- [Mobile IV Therapy Toronto and the GTA: Complete Guide](/blog/mobile-iv-therapy-toronto-gta)
- [Who Can Legally Give an IV in Canada: Rules by Province](/blog/who-can-legally-give-iv-canada-rules-by-province-2026)
- [IV Therapy Insurance Coverage in Canada](/blog/iv-therapy-insurance-coverage-canada)

## Explore More IV Therapy Across Canada

For the Ontario directory and our most-read Canadian guides, see the [Ontario IV therapy directory](/cities/ontario) and the [Vancouver clinic directory](/cities/vancouver) for BC.

## Research and Sources

- Gaby, A.R. (2002). Intravenous nutrient therapy: the Myers cocktail. *Alternative Medicine Review*, 7(5), 389-403.
- Carr, A.C., and Maggini, S. (2017). Vitamin C and immune function. *Nutrients*, 9(11), 1211.
- Verdin, E. (2015). NAD+ in aging, metabolism, and neurodegeneration. *Science*, 350(6265), 1208-1213.
- BC College of Nurses and Midwives. Standards of practice, scope of nursing practice.
- College of Complementary Health Professionals of BC. Naturopathic physician scope and IV therapy authority.

## Top mobile IV therapy providers in Vancouver and the Lower Mainland

The Vancouver mobile IV market is smaller than Toronto's. The providers below are the visible options as of 2026.

### 1. [ZipDrip Mobile IV Therapy](/providers/zipdrip-mobile-iv-therapy-vancouver)
*Vancouver, BC*

Mobile IV therapy across Metro Vancouver. The most visible explicitly-mobile provider in the Vancouver market, with strong patient ratings (5 stars across 110 reviews on Google).

### 2. [Bay Wellness Centre](/providers/bay-wellness-centre-vancouver)
*Downtown Vancouver, BC, Safety Verified*

Downtown Vancouver naturopathic clinic offering nutrient IV therapy, glutathione push, iron infusion, women's health, and aesthetics. Naturopathic physician led by Dr. Megan Maycher, ND. Primarily in-clinic, ask directly about in-home availability.

For the complete Vancouver and BC clinic roster including non-mobile clinics, see [/cities/vancouver](/cities/vancouver).

## Frequently Asked Questions About Mobile IV Therapy in Vancouver

### How does mobile IV therapy work in Vancouver?
A licensed registered nurse, nurse practitioner, or CCHPBC-authorized naturopathic physician comes to your home, hotel, or office with all required supplies. After a brief intake covering medications, allergies, and vitals, the provider inserts the IV and stays through the infusion, typically 30 to 60 minutes for hydration drips and longer for NAD+ or extended protocols.

### How much does mobile IV cost in Vancouver?
Most providers charge $175 to $325 CAD for the drip itself plus a $50 to $150 mobile fee. Group bookings of three or more people at one location often reduce the per-person cost. NAD+ protocols are priced separately and typically start at $400 CAD.

### How fast can a mobile IV provider arrive in Vancouver?
In Downtown Vancouver and the West End, expect a 60 to 90 minute response window for same-day bookings. North Shore, Burnaby, Richmond, and Tri-Cities areas typically run 90 to 120 minutes. Confirm response time in writing before you book.

### Is mobile IV safe in BC?
When performed by a BCCNM-registered nurse under physician oversight, or by a CCHPBC-authorized naturopathic physician, mobile IV therapy carries a comparable safety profile to in-clinic treatment. Risks are minimal but include vein irritation, vasovagal reactions, and rare allergic responses. Always confirm the provider carries liability insurance that covers in-home work specifically.

### Can a naturopathic doctor administer IV therapy in BC?
Yes, when they hold the IV therapy and chelation prescribing authority granted by the College of Complementary Health Professionals of BC (CCHPBC). Not every ND in BC has this authority, so confirm directly with the provider before booking.
`;

(async () => {
  const now = new Date().toISOString();
  const payload = {
    slug: SLUG,
    title: TITLE,
    content: CONTENT,
    excerpt: EXCERPT,
    category: CATEGORY,
    author: AUTHOR,
    image_url: IMAGE_URL,
    imageUrl: IMAGE_URL,
    date: now,
    last_updated: now,
    lastUpdated: now.slice(0, 10),
    meta_title: META_TITLE,
    metaTitle: META_TITLE,
    meta_description: META_DESCRIPTION,
    metaDescription: META_DESCRIPTION,
    related_clinics: RELATED_CLINICS,
    relatedClinics: RELATED_CLINICS,
    related_cities: [],
    relatedCities: null,
  };

  // Idempotent upsert on slug.
  const { data: existing } = await sb.from('blog_posts').select('id').eq('slug', SLUG).maybeSingle();
  let res;
  if (existing) {
    res = await sb.from('blog_posts').update(payload).eq('id', existing.id).select().single();
  } else {
    res = await sb.from('blog_posts').insert(payload).select().single();
  }
  if (res.error) {
    console.error('Failed:', res.error.message);
    process.exit(1);
  }
  console.log(existing ? 'Updated' : 'Inserted', 'blog_posts row:', res.data.id, '|', res.data.slug);

  // Receipt
  const receipt = { phase: 'publish-vancouver-mobile-post', timestamp: now, payload_summary: { slug: SLUG, title: TITLE, content_length: CONTENT.length, related_clinics: RELATED_CLINICS }, blog_posts_id: res.data.id };
  fs.mkdirSync('scripts/_receipts', { recursive: true });
  const outPath = path.join('scripts/_receipts', 'vancouver-mobile-post-' + Date.now() + '.json');
  fs.writeFileSync(outPath, JSON.stringify(receipt, null, 2));
  console.log('Receipt:', outPath);
})();
