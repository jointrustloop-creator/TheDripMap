/**
 * Publish the Ottawa mobile IV blog post (operator-approved 2026-06-06).
 *
 * Same schema shape as the Vancouver and Toronto-GTA posts.
 * Idempotent: re-running upserts on slug.
 */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const sb = require('@supabase/supabase-js').createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const SLUG = 'mobile-iv-therapy-ottawa';
const TITLE = 'Mobile IV Therapy Ottawa: How It Works in Ontario, Honest Pricing, and Where to Find a Licensed Nurse';
const META_TITLE = 'Mobile IV Therapy Ottawa: How It Works, CAD Pricing, Ontario Rules';
const META_DESCRIPTION = 'Mobile IV therapy delivered to your home, hotel, or Hill office in Ottawa. Coverage across the city and Ottawa Valley, real CAD pricing, Ontario regulation under CONO and CNO, and how to find a licensed nurse.';
const EXCERPT = 'Complete guide to mobile IV therapy in Ottawa. Coverage areas, 2026 CAD pricing, who can legally administer IV under Ontario rules (CNO for nurses, CONO for naturopaths), and how to vet a provider before booking.';
const CATEGORY = 'City Guides';
const AUTHOR = 'TheDripMap Editorial Team';
const IMAGE_URL = 'https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/mobile-iv-therapy-kit-home-delivery.jpg';
const RELATED_CLINICS = [
  '36e2fe64-2d1f-427b-a507-3c8ae8ae5d7d', // RevIVe U Mobile IV Wellness Clinic
  'cbf842c6-a61b-4ac3-a90f-7de6df8ac794', // Somerset Health & Wellness Centre
  'b288869e-c08e-4c71-b24e-bd13d924d52f', // Refined Image Ottawa
];

const CONTENT = `You finished a 14-hour day on Parliament Hill and your head is splitting. You just landed at YOW after a brutal layover and you feel cooked. You woke up rough after a long night in the ByWard Market. Or you are deep into the worst flu of the season and you cannot face a waiting room. Mobile IV therapy is built for these exact moments.

Ottawa's mobile IV scene is smaller than Toronto's, but it is real, and Ontario's regulatory framework gives you a clear answer to the most important question: who is allowed to do this work. This guide walks through how mobile IV works in the National Capital Region, what it costs in CAD, the legal picture under CNO and CONO, and how to vet a provider before you book.

## How Mobile IV Therapy Works in Ottawa

**1. Book online or by phone.** Most Ottawa mobile IV providers offer online booking with real-time availability. You select your drip, enter your address, and choose a time window. Same-day availability is common on weekends.

**2. A licensed nurse or naturopathic doctor arrives.** In Ontario, IV administration is a controlled act under the Regulated Health Professions Act. A registered nurse or nurse practitioner registered with the College of Nurses of Ontario (CNO), or a naturopathic doctor with the IV infusion authorization from the College of Naturopaths of Ontario (CONO), arrives at your location. They bring all supplies including IV fluids, your chosen drip formula, and monitoring equipment.

**3. Brief health intake.** Before inserting the IV the provider completes a health screening covering current medications, allergies, medical history, and vitals. This takes 5 to 10 minutes and is non-negotiable for safety.

**4. Treatment.** The IV is inserted, usually in the forearm. Most drips run 30 to 60 minutes. You can lie in bed, watch TV, or work while the provider manages the drip.

**5. Done.** The provider removes the IV, disposes of all equipment, and you are free to continue your day.

## Mobile IV Coverage Across Ottawa

**Core service areas (60 to 90 min response window):**
- Centretown, ByWard Market, Sandy Hill, Lowertown
- The Glebe, Old Ottawa South, Old Ottawa East
- Westboro, Hintonburg, Mechanicsville
- Centretown West, Little Italy, Chinatown
- Vanier, Overbrook

**Served with longer windows (90 to 120 min):**
- Kanata, Stittsville
- Orléans, Cumberland
- Barrhaven, Nepean, Manotick
- Gloucester, Blackburn Hamlet
- Riverside South, Greely

**Cross-river note for Gatineau.** Gatineau sits across the river in Quebec, where nurses are regulated by the Ordre des infirmières et infirmiers du Québec (OIIQ) rather than Ontario's CNO. Most Ottawa-based mobile providers are licensed in Ontario only and do not cross the bridge. If you are in Gatineau, confirm whether the provider holds Quebec authorization before booking.

## Most Common Mobile IV Drips in Ottawa

**Hydration IV.** A standard hydration drip is 500 to 1000 ml of saline with B-complex and electrolytes. Common requests after long-haul flights, hangovers, or a week of skiing in the Gatineau Hills. Cost: $150 to $250 CAD plus mobile fee.

**Myers Cocktail.** The classic blended IV of B vitamins, vitamin C, magnesium, and calcium. Popular as a recurring booking for busy professionals downtown and on the Hill. Cost: $175 to $300 CAD plus mobile fee.

**Immune Boost IV.** High-dose vitamin C, zinc, and B vitamins. Demand spikes October through April during cold and flu season in the National Capital Region. Cost: $150 to $250 CAD plus mobile fee.

**NAD+ IV.** A slow infusion of NAD+. Sessions typically run 2 to 4 hours and require an in-clinic option for most providers, though some experienced practitioners offer in-home delivery. Cost: $400 to $1,000 CAD depending on dose.

**Hangover Recovery.** Saline plus B vitamins, anti-nausea options, and electrolytes. Saturday and Sunday mornings dominate bookings. Cost: $175 to $275 CAD plus mobile fee.

## Mobile IV Pricing in Ottawa: 2026 Breakdown

| Service | Price Range (CAD) |
|---------|------------------|
| Basic hydration | $150 to $250 |
| Myers Cocktail | $175 to $300 |
| Immune boost | $150 to $250 |
| Hangover recovery | $175 to $275 |
| NAD+ low dose | $400 to $650 |
| NAD+ high dose | $700 to $1,000 |
| Glutathione add-on | $50 to $100 |
| Mobile fee (solo) | $50 to $125 |
| Mobile fee (groups of 3+) | $25 to $50 per person |
| Suburban surcharge (Kanata, Orléans, Barrhaven) | $25 to $50 additional |

Final pricing varies by provider, time of day, and address. Confirm everything in writing before booking.

## Who Can Legally Administer IV Therapy in Ontario

This is the single most important question when booking mobile IV in Ottawa, because Ontario's regulatory framework is clearly defined under the Regulated Health Professions Act.

**Registered nurses and nurse practitioners.** RNs and NPs are regulated by the **College of Nurses of Ontario (CNO)**. They can administer IV therapy under appropriate physician orders or established standing orders. This is the most common pathway for mobile IV in Ottawa.

**Naturopathic doctors.** NDs are regulated by the **College of Naturopaths of Ontario (CONO)**. NDs with the IV infusion authorization granted by CONO can legally administer IV therapy in Ontario. Not every ND has this authorization, so confirm directly with the provider if you specifically want an ND-led drip.

**Physicians.** MDs and DOs regulated by the College of Physicians and Surgeons of Ontario (CPSO) can prescribe and administer IV therapy.

This is general information, not legal or medical advice. Confirm credentials directly with the provider before booking. For the full Canadian regulatory picture, see our [Canada IV therapy regulation guide](/blog/who-can-legally-give-iv-canada-rules-by-province-2026).

## What Makes a Good Ottawa Mobile IV Provider

- A licensed RN or NP registered with the CNO, or a CONO-authorized naturopathic doctor with the IV infusion authorization
- A medical directive signed by a supervising physician or NP, where required
- Pharmaceutical-grade compounds from a licensed Ontario pharmacy
- Proper biohazard waste disposal
- Liability insurance that covers in-home work specifically, not every malpractice policy does
- Clear booking, late-arrival, and cancellation policies

## Frequently Asked Questions

**How quickly can a mobile IV nurse arrive in Ottawa?**
In Centretown, ByWard Market, and The Glebe, response times are typically 60 to 90 minutes for same-day bookings. Kanata, Orléans, and Barrhaven usually run 90 to 120 minutes. Confirm response time in writing before you book.

**Is mobile IV therapy as safe as going to a clinic?**
For standard hydration and vitamin drips administered by a CNO-registered nurse or a CONO-authorized naturopathic doctor, mobile IV carries a comparable safety profile to in-clinic treatment. For healthy adults receiving wellness drips, the main risks are vein irritation, vasovagal reactions, and rare allergic responses.

**Can a naturopathic doctor give an IV in Ontario?**
Yes, when they hold the IV infusion authorization granted by the College of Naturopaths of Ontario (CONO). Not every ND has this authorization, so confirm directly with the provider.

**Can a mobile nurse come to my hotel room in Ottawa?**
Yes. Most downtown Ottawa hotels are within service areas, including the Westin, Fairmont Château Laurier, Lord Elgin, and most of the Hill-adjacent hotels. Let the front desk know you are expecting a medical professional. Most providers carry professional ID and are familiar with hotel call-outs.

**Can a mobile nurse come to my Hill office or government building?**
Most mobile providers serve downtown office addresses, including Bay Street, Sparks Street, and most of the buildings inside the Parliamentary precinct. Confirm with the provider in advance, and clear the visit with your building security before the appointment.

**Does Gatineau-side Quebec service work the same way?**
No. Quebec nurses are regulated by the OIIQ rather than Ontario's CNO. Most Ottawa-based mobile providers are not licensed to operate on the Quebec side. If you are in Gatineau, ask the provider directly whether they hold Quebec authorization.

**What should I do to prepare for a mobile IV appointment?**
Drink water if possible, eat a light snack, wear loose clothing with easy forearm access, and have a comfortable place to sit or lie down for 45 to 60 minutes.

## Find Mobile IV Therapy in Ottawa

TheDripMap lists mobile and in-clinic IV therapy providers across Ottawa and the National Capital Region with credential filters and direct links.

[Find mobile IV providers near you](/search?type=Mobile&city=Ottawa) · [View all Ottawa clinics](/cities/ottawa) · [Take the matching quiz](/quiz)

**Related articles:**
- [Mobile IV Therapy Toronto and the GTA: Complete Guide](/blog/mobile-iv-therapy-toronto-gta)
- [Mobile IV Therapy Vancouver: BC Pricing and Regulation](/blog/mobile-iv-therapy-vancouver)
- [Who Can Legally Give an IV in Canada: Rules by Province](/blog/who-can-legally-give-iv-canada-rules-by-province-2026)
- [IV Therapy Insurance Coverage in Canada](/blog/iv-therapy-insurance-coverage-canada)

## Explore More IV Therapy Across Ontario

For the full Ontario clinic directory including every Ontario city we cover, see the [Ontario IV therapy directory](/cities/ontario).

## Research and Sources

- Gaby, A.R. (2002). Intravenous nutrient therapy: the Myers cocktail. *Alternative Medicine Review*, 7(5), 389-403.
- Carr, A.C., and Maggini, S. (2017). Vitamin C and immune function. *Nutrients*, 9(11), 1211.
- Verdin, E. (2015). NAD+ in aging, metabolism, and neurodegeneration. *Science*, 350(6265), 1208-1213.
- College of Nurses of Ontario. Practice standards and IV therapy guidelines.
- College of Naturopaths of Ontario. Scope of practice and IV infusion authorization.

## Top mobile IV therapy providers in Ottawa

Ottawa's mobile IV market is concentrated. The providers below are the visible options as of 2026.

### 1. [RevIVe U Mobile IV Wellness Clinic](/providers/revive-u-mobile-iv-wellness-clinic-ottawa)
*Ottawa, ON*

Mobile IV wellness across the Ottawa area. The only explicitly mobile-flagged provider in our current Ottawa directory. New listing without aggregated public reviews yet, so verify credentials and pricing directly when you book.

### 2. [Somerset Health & Wellness Centre](/providers/somerset-health-and-wellness-centre-ottawa)
*Centretown, Ottawa, ON*

Naturopathic wellness centre with strong patient ratings (4.9 stars across 274 reviews on Google). Primarily in-clinic with IV therapy among its services. Ask directly about any in-home or after-hours availability.

### 3. [Refined Image Ottawa](/providers/refined-image-ottawa-ottawa)
*Ottawa, ON*

Ottawa's highest-reviewed listing in our directory (4.9 stars across 344 reviews on Google). Primarily aesthetics and wellness services with IV options available. Confirm specific IV drip menus and mobile availability at booking.

For the complete Ottawa and National Capital Region roster, see [/cities/ottawa](/cities/ottawa).

## Frequently Asked Questions About Mobile IV Therapy in Ottawa

### How does mobile IV therapy work in Ottawa?
A CNO-registered nurse or nurse practitioner, or a CONO-authorized naturopathic doctor, comes to your home, hotel, or office with all required supplies. After a brief intake covering medications, allergies, and vitals, the provider inserts the IV and stays through the infusion, typically 30 to 60 minutes for hydration drips and longer for NAD+ or extended protocols.

### How much does mobile IV cost in Ottawa?
Most providers charge $150 to $300 CAD for the drip itself plus a $50 to $125 mobile fee. Group bookings of three or more people at one location often reduce the per-person cost. NAD+ protocols are priced separately and typically start at $400 CAD.

### How fast can a mobile IV provider arrive in Ottawa?
In Centretown, ByWard Market, and The Glebe, expect a 60 to 90 minute response window for same-day bookings. Kanata, Orléans, and Barrhaven areas typically run 90 to 120 minutes. Confirm response time in writing before you book.

### Is mobile IV safe in Ontario?
When performed by a CNO-registered nurse under physician oversight, or by a CONO-authorized naturopathic doctor with the IV infusion authorization, mobile IV therapy carries a comparable safety profile to in-clinic treatment. Risks are minimal but include vein irritation, vasovagal reactions, and rare allergic responses. Always confirm the provider carries liability insurance that covers in-home work specifically.

### Can a naturopathic doctor administer IV therapy in Ontario?
Yes, when they hold the IV infusion authorization granted by the College of Naturopaths of Ontario (CONO). Not every ND in Ontario has this authorization, so confirm directly with the provider before booking.

### What about Gatineau and the Quebec side?
Quebec nurses are regulated by the Ordre des infirmières et infirmiers du Québec (OIIQ), not Ontario's CNO. Most Ottawa-based mobile providers are licensed only in Ontario and do not cross the river into Gatineau. Confirm Quebec authorization with the provider directly if you are booking from the Quebec side.
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

  // Em-dash sanity
  const dashes = (CONTENT.match(/[—–]/g) || []).length;
  console.log('em/en-dash count:', dashes, dashes === 0 ? '✓' : '✗');

  fs.mkdirSync('scripts/_receipts', { recursive: true });
  const outPath = path.join('scripts/_receipts', 'ottawa-mobile-post-' + Date.now() + '.json');
  fs.writeFileSync(outPath, JSON.stringify({ phase: 'publish-ottawa-mobile-post', timestamp: now, blog_posts_id: res.data.id, slug: SLUG, content_length: CONTENT.length, related_clinics: RELATED_CLINICS }, null, 2));
  console.log('Receipt:', outPath);
})();
