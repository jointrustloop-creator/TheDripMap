/**
 * Canada expansion import (May 2026): real, verified IV-therapy + peptide clinics
 * researched for BC, Alberta, Quebec, Manitoba, and Nova Scotia.
 * Dedupes against existing rows by website host and by name+city. Real data only —
 * blank phone/address left null (never fabricated). National lead-gen/aggregator
 * domains were excluded during research. Run: node scripts/import-canada-clinics.cjs
 */
require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const slugify = (s) => s.toLowerCase().trim().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const host = (url) => { try { return new URL(/^https?:\/\//.test(url) ? url : 'https://' + url).hostname.toLowerCase().replace(/^www\./, ''); } catch { return null; } };

// C(name, city, province (full name), website, services[], phone, address) — all Canada
const C = (name, city, province, website, services, phone, address) => ({ name, city, state: province, website, services, phone: phone || null, address: address || null, country: 'Canada' });

const CLINICS = [
  // ───────────── Alberta ─────────────
  C('Essence Wellness Clinic', 'Calgary', 'Alberta', 'https://www.essencewellness.ca/iv-therapy-calgary', ['IV Therapy','Myers Cocktail','NAD+','Hydration','Vitamin Injections'], '(403) 383-3228', '3425 22 St SW #305, Calgary, AB'),
  C('Vitality BioMed', 'Calgary', 'Alberta', 'https://vitalitybiomed.com/iv-therapy-in-calgary/', ['IV Therapy','NAD+','Myers Cocktail','Hydration','Immune'], '(403) 300-1698', '#280, 7015 Macleod Trail SW, Calgary, AB T2H 2K6'),
  C('Neurvana Health', 'Calgary', 'Alberta', 'https://neurvanahealth.com/iv-therapy/', ['IV Therapy','Myers Cocktail','Vitamin C','Hydration','Immune'], '(587) 997-4649', '2020 4 St SW #330, Calgary, AB T2S 1W3'),
  C('Grassroots Naturopathic Medicine', 'Calgary', 'Alberta', 'https://grassrootsnaturopathic.com/iv-therapy-calgary/', ['IV Therapy','Myers Cocktail','Vitamin C','Glutathione'], '(403) 217-8898', '22 Richard Way SW, Calgary, AB T3E 7M9'),
  C('The Drip Wellness Group', 'Calgary', 'Alberta', 'https://thedripwellnessgroup.com/', ['IV Therapy','Hydration','Immune','Recovery','Vitamin Injections','Mobile IV'], null, null),
  C('POV Medical Aesthetics', 'Calgary', 'Alberta', 'https://povclinic.com/service/iv-hydrationvitamin-infusion-therapy/', ['IV Therapy','Hydration','Myers Cocktail','Glutathione','Vitamin Injections'], null, null),
  C('Juvea Aesthetics', 'Calgary', 'Alberta', 'https://juveaaesthetics.ca/vitamin-iv-therapy-calgary/', ['IV Therapy','Hydration','Weight Loss','Vitamin Injections'], '(403) 975-7523', '1742 29 St SW, Calgary, AB T3C 3X9'),
  C('Action Health', 'Calgary', 'Alberta', 'https://www.actionhealth.ca/iv-nutrient-therapy-and-drips/', ['IV Therapy','Hydration','Immune'], null, null),
  C("Dr. Bobby's Clinic", 'Calgary', 'Alberta', 'https://drbobby.ca/hormone-therapy/peptide-therapy/', ['Peptide Therapy','Weight Loss','Hormone Therapy'], '(403) 265-5221', '3730 104 Ave NE #104, Calgary, AB T3N 0T1'),
  C('Unity Collective', 'Okotoks', 'Alberta', 'https://www.unitycollectivestudios.com/mobile-iv', ['Mobile IV','IV Therapy','Hydration','Immune','Energy'], null, null),
  C('VitaDrip IV', 'Edmonton', 'Alberta', 'https://www.vitadripiv.ca/', ['IV Therapy','Energy','Immune','Glutathione','Vitamin Injections','Hydration'], '(780) 652-3258', 'Suite 2367, 8882 170 St NW, Edmonton, AB T5T 4M2'),
  C('Nectar IV Hydration & Wellness', 'St. Albert', 'Alberta', 'https://www.nectariv.ca/', ['IV Therapy','Hydration','Vitamin Injections','Iron Infusion','Mobile IV'], '(780) 851-2886', 'Suite #2, 150 Carleton Dr, St. Albert, AB'),
  C('Bliss MediSpa & Integrated Wellness', 'Edmonton', 'Alberta', 'https://www.blissmedispa.ca/wellness-edmonton/iv-nutrient-therapy/', ['IV Therapy','Hydration','Immune','Vitamin Injections'], '(780) 432-1535', '5954 Mullen Way, Edmonton, AB'),
  C('TruMed', 'Edmonton', 'Alberta', 'https://www.trumed.ca/iv-edmonton', ['IV Therapy','Myers Cocktail','NAD+','Glutathione','Vitamin C','Iron Infusion'], null, null),
  C('Hydro Oasis Wellness', 'Edmonton', 'Alberta', 'https://www.hydrooasiswellness.com/', ['IV Therapy','Hydration','Vitamin Injections','Mobile IV'], '(780) 616-6654', '11209 Jasper Ave, Edmonton, AB'),
  C('VitaPoke Infusion Lounge', 'Edmonton', 'Alberta', 'https://www.pokebeauty.ca/services/iv-therapy', ['IV Therapy','Hydration','Iron Infusion','Vitamin Injections','Mobile IV'], null, null),
  C('The Lounge Medical Spa & Wellness', 'Edmonton', 'Alberta', 'https://theloungemedicalspa.com/iv-vitamin-drip-edmonton/', ['IV Therapy','Hydration','Vitamin Injections'], '(780) 667-6703', '4075 106 St #400, Edmonton, AB T6J 7H3'),
  C('TBT Medical', 'Edmonton', 'Alberta', 'https://tbtmedicaledmonton.com/peptide-therapy/', ['Peptide Therapy','Weight Loss','Hormone Therapy'], '(587) 701-0154', null),
  C('Restore Wellness IV Hydration Therapy', 'Red Deer', 'Alberta', 'https://www.restorewellnessrd.com/', ['IV Therapy','NAD+','Hydration','Immune','Energy','Mobile IV'], '(403) 596-5149', '228 Spruce St #100, Red Deer County, AB'),
  C('Nutrient Drip IV Therapy', 'Red Deer', 'Alberta', 'https://www.nutrientdrip.ca/', ['Mobile IV','IV Therapy','Hydration','Vitamin Injections'], null, null),
  C('Central Alberta Dermatology Clinic', 'Red Deer', 'Alberta', 'https://www.centralalbertadermatology.ca/treatment/iv-therapy-in-red-deer/', ['IV Therapy','Hydration','Immune'], null, null),

  // ───────────── British Columbia ─────────────
  C('The IV Health Centre', 'Vancouver', 'British Columbia', 'https://theiv.ca/', ['IV Therapy','Myers Cocktail','NAD+','Vitamin Injections','Hydration','Immune'], '(604) 974-8999', '1060 Homer Street, Vancouver, BC V6B'),
  C('ZipDrip', 'Vancouver', 'British Columbia', 'https://zipdrip.ca/', ['Mobile IV','IV Therapy','Hydration','NAD+','Vitamin Injections','Hangover','Immune'], '(778) 910-0075', '943 W Broadway #350, Vancouver, BC V5Z 4M3'),
  C('Skinnovate', 'Vancouver', 'British Columbia', 'https://skinnovate.ca/iv-therapy-vancouver/', ['IV Therapy','NAD+','Glutathione','Iron Infusion','Myers Cocktail','Vitamin Injections','Weight Loss'], '(604) 416-2799', '591 Cardero St, Vancouver, BC V6G 3L2'),
  C('Luminary Health', 'Vancouver', 'British Columbia', 'https://luminaryhealth.ca/services/iv-therapy-in-vancouver/', ['IV Therapy','NAD+','Glutathione','Myers Cocktail','Iron Infusion','Weight Loss'], '(604) 216-3320', '301-533 Smithe Street, Vancouver, BC V6B 0H2'),
  C('Mint Integrative Health', 'Vancouver', 'British Columbia', 'https://mintintegrative.com/iv-therapy/', ['IV Therapy','Vitamin Infusions','Hydration'], '(604) 251-3456', '1541 W Broadway #485, Vancouver, BC V6J 1W7'),
  C('Empower Health', 'Vancouver', 'British Columbia', 'https://empowerhealth.ca/iv-therapy-vancouver/', ['IV Therapy','Vitamin Infusions'], '(604) 336-2844', '305-2730 Commercial Drive, Vancouver, BC V5N 5P4'),
  C('Bay Wellness Centre', 'Vancouver', 'British Columbia', 'https://baywellnesscentre.com/services/peptide-therapy-vancouver-bc/', ['Peptide Therapy','IV Therapy','Weight Loss','Hormone Therapy'], null, 'Suite 510, 475 West Georgia, Vancouver, BC V6B 1M9'),
  C('Deva Med Spa', 'North Vancouver', 'British Columbia', 'https://devamedspa.com/iv-therapy/', ['IV Therapy','Myers Cocktail','Immune','Vitamin Infusions','Hydration'], null, '3077 Woodbine Drive, North Vancouver, BC V7R 2S3'),
  C('KOZA Skin Clinic', 'Port Coquitlam', 'British Columbia', 'https://kozaskinclinic.com/iv-therapy/', ['IV Therapy','Vitamin Injections','Hydration','Iron Infusion','Weight Loss'], '(604) 461-8220', '3150-2180 Kelly Ave, Port Coquitlam, BC'),
  C('Hydrate IV Wellness Centre', 'Victoria', 'British Columbia', 'https://hydratewellness.com/', ['IV Therapy','NAD+','Vitamin C','Iron Infusion','Mobile IV'], '(250) 590-1482', null),
  C('Beam Beauty', 'Victoria', 'British Columbia', 'https://beambeauty.ca/iv-therapy/', ['IV Therapy','Hydration','Vitamin Infusions'], '(778) 440-2289', '3046 Merchant Wy, Unit 110, Victoria, BC V9B 0X1'),
  C('Tall Tree Health', 'Victoria', 'British Columbia', 'https://www.talltreehealth.ca/services/iv-therapy', ['IV Therapy','NAD+','Vitamin Injections'], '(250) 658-9222', '5325 Cordova Bay Road, Victoria, BC V8Y 2L3'),
  C('Synergy Health Centre', 'Victoria', 'British Columbia', 'https://synergyhealthmanagement.com/service/iv-nutrient-therapy/', ['IV Therapy','Vitamin Infusions'], '(250) 727-3737', null),
  C('Acacia Health', 'Victoria', 'British Columbia', 'https://acaciahealth.ca/therapies/intravenous-therapy/', ['IV Therapy','Vitamin Injections','Iron Infusion'], '(250) 475-1522', '101-391 Tyee Rd, Victoria, BC V9A 0A9'),
  C('Glow Integrative Clinic', 'Victoria', 'British Columbia', 'https://www.glowintegrative.com/iv-therapy', ['IV Therapy','Vitamin Infusions'], null, null),
  C('Deco De Mode', 'Victoria', 'British Columbia', 'https://www.decodemode.com/vitamin-iv-therapy-victoria-1410-broad-street', ['IV Therapy','Hydration','Immune'], '(250) 380-6533', '1410 Broad Street, Victoria, BC'),
  C('The Helix Clinic', 'Kelowna', 'British Columbia', 'https://www.thehelixclinic.com/iv-therapy', ['IV Therapy','Iron Infusion','Vitamin Injections','Weight Loss','Hormone Therapy'], '(778) 484-4359', '#110-810 Clement Ave, Kelowna, BC V1Y 4R9'),
  C('Momentum Health', 'Kelowna', 'British Columbia', 'https://momentumkelowna.com/iv-therapy-in-kelowna', ['IV Therapy','Vitamin Injections','Iron Infusion','Hydration'], '(778) 484-6070', '103-1664 Richter Street, Kelowna, BC V1Y 8N3'),
  C('Valeo Health Clinic', 'Kelowna', 'British Columbia', 'https://valeohealthclinic.com/medicine/vitamin-injections-iv-therapy/', ['IV Therapy','Vitamin Injections','Iron Infusion','Immune'], '(778) 484-5790', '101-1726 Dolphin Avenue, Kelowna, BC V1Y 9R9'),
  C('Kelowna Hills Medical and Skin Centre', 'West Kelowna', 'British Columbia', 'https://kelownahills.com/treatments/iv-vitamin-therapy', ['IV Therapy','NAD+','Glutathione','Vitamin Injections','Weight Loss'], '(778) 940-2810', '1750 Old Ferry Wharf Rd, West Kelowna, BC V1Z 0A4'),
  C('Mind Body Soul Integrative Clinic', 'Kelowna', 'British Columbia', 'https://mindbodysoulkelowna.com/', ['IV Therapy','Vitamin Infusions','Immune','Recovery'], '(250) 868-0221', '302-1630 Pandosy Street, Kelowna, BC'),

  // ───────────── Nova Scotia (Halifax metro) ─────────────
  C('Youth Bar', 'Halifax', 'Nova Scotia', 'https://youthbar.ca', ['IV Therapy','Hydration','Immune','Hangover','Vitamin Injections'], '(902) 266-7857', '383 Herring Cove Road, Halifax, NS B3R 0H1'),
  C('Pure Drip', 'Halifax', 'Nova Scotia', 'https://www.puredrip.ca', ['Mobile IV','IV Therapy','Hydration','Vitamin Injections','Immune','Recovery'], null, null),
  C('Bright & Well', 'Halifax', 'Nova Scotia', 'https://brightandwell.ca', ['IV Therapy','Vitamin Injections','NAD+','Iron Infusion','Hormone Therapy'], '(902) 536-3358', null),
  C('Dr. Colin MacLeod ND', 'Bedford', 'Nova Scotia', 'https://drcolinmacleod.com', ['IV Therapy','Vitamin Injections','Myers Cocktail'], '(902) 406-4424', '1378 Bedford Hwy, Bedford, NS B4A 1E2'),
  C('Cornerstone Naturopathic', 'Upper Tantallon', 'Nova Scotia', 'https://cornerstonenaturopathic.ca', ['IV Therapy','Vitamin Injections'], '(902) 820-3443', '14 Old School Road, Upper Tantallon, NS B3Z 2J6'),
  C('Choice Health Centre', 'Bedford', 'Nova Scotia', 'https://choicehealthcentre.com', ['IV Therapy','Vitamin Injections'], '(902) 404-3668', '1600 Bedford Highway, Bedford, NS B4A 1E8'),
  C('Kinesis Health Associates', 'Dartmouth', 'Nova Scotia', 'https://www.kinesishealth.ca', ['IV Therapy','Vitamin Injections'], '(902) 464-2225', '155 Ochterloney Street, Dartmouth, NS B2Y 1C9'),

  // ───────────── Manitoba (Winnipeg metro) ─────────────
  C('Theradrip Mobile IV', 'Winnipeg', 'Manitoba', 'https://www.theradrip.ca', ['Mobile IV','IV Therapy','Hydration','NAD+','Iron Infusion','Hangover','Immune','Recovery'], null, null),
  C('The Nature Doctors', 'Winnipeg', 'Manitoba', 'https://www.thenaturedoctors.ca', ['IV Therapy','Vitamin Injections'], '(204) 943-6079', '1200 Waverley St, Suite 7, Winnipeg, MB'),
  C('Centre for Natural Pain Solutions (Dr. Ceaser)', 'Winnipeg', 'Manitoba', 'https://drceaser.com', ['IV Therapy','Vitamin C','Myers Cocktail'], '(204) 775-4539', '578 Broadway, Winnipeg, MB'),
  C('Fortify', 'Winnipeg', 'Manitoba', 'https://thisisfortify.com', ['IV Therapy','Vitamin Injections'], '(204) 231-5333', '104-123 Marion Street, Winnipeg, MB R2H 3G9'),
  C('Prime Medical Services', 'Winnipeg', 'Manitoba', 'https://www.primemedicalsvc.com', ['IV Therapy','Vitamin Injections'], '(204) 837-7463', '1555 Inkster Blvd, Winnipeg, MB R2X 1R2'),
  C('Skin Suite Laser & Medical Aesthetics', 'Winnipeg', 'Manitoba', 'https://www.skinsuitewpg.com', ['IV Therapy','Vitamin Injections'], '(204) 505-7546', '1365 Grant Ave, Winnipeg, MB'),
  C('Enhance Aesthetics and Laser', 'East St. Paul', 'Manitoba', 'https://www.enhanceaesthetics.ca', ['IV Therapy','Immune','Hangover','Hydration','Vitamin Injections'], '(431) 801-8430', '2227 Henderson Hwy, East St. Paul, MB R2E 0B8'),

  // ───────────── Quebec ─────────────
  C('IV.CLINIC', 'Montreal', 'Quebec', 'https://iv.clinic', ['IV Therapy','Hydration','Vitamin Injections'], '(438) 300-7484', '1216 Stanley St, 3rd Floor, Montreal, QC H3B 2S7'),
  C('Ideal Body Clinic (Vitamin Boost)', 'Montreal', 'Quebec', 'https://vitaminboost.ca', ['IV Therapy','Vitamin Infusions','Vitamin C','Weight Loss'], '(514) 998-0998', '6000 Av De Monkland, Montreal, QC H4A 1G8'),
  C('Drip Bar MTL', 'Montreal', 'Quebec', 'https://www.dripbarmtl.com', ['IV Therapy','Hydration','Glutathione','Weight Loss','Hangover','Vitamin Injections'], null, null),
  C('Dermamode', 'Montreal', 'Quebec', 'https://dermamode.com', ['IV Therapy','Medical Aesthetics'], '(438) 701-5213', '1001 Rue Saint-Antoine O, Suite 110, Montreal, QC H3C 4M7'),
  C('RN Privee', 'Montreal', 'Quebec', 'https://rnprivee.com', ['Mobile IV','IV Therapy','Hydration'], null, null),
  C('TELUS Health Care Centre - Quebec City', 'Quebec City', 'Quebec', 'https://www.telus.com/en/health/care-centres/locations/quebec-city', ['IV Therapy','Vitamin Infusions','Iron Infusion'], '(418) 681-0167', '3165 chemin St-Louis, Suite 410, Quebec City, QC'),
];

const IV_TOKENS = ['iv therapy','hydration','hangover','nad','vitamin','myers','mobile iv','immune','recovery','iron','glutathione'];
const PEPTIDE_TOKENS = ['peptide'];
const WL_TOKENS = ['semaglutide','tirzepatide','weight loss','glp'];
function pickCategory(services) {
  const lower = services.map((s) => s.toLowerCase());
  const has = (toks) => lower.some((s) => toks.some((t) => s.includes(t)));
  if (has(IV_TOKENS)) return 'IV Therapy';
  if (has(PEPTIDE_TOKENS)) return 'Peptide Therapy';
  if (has(WL_TOKENS)) return 'Medical Weight Loss';
  return 'IV Therapy';
}

(async () => {
  const existing = [];
  let from = 0;
  for (let p = 0; p < 20; p++) {
    const { data, error } = await sb.from('providers').select('name, city, website, slug').range(from, from + 999);
    if (error) { console.error('READ ERR', error.message); process.exit(1); }
    if (!data || !data.length) break;
    existing.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  console.log('existing providers loaded:', existing.length);
  const hostSet = new Set(existing.map((r) => host(r.website)).filter(Boolean));
  const nameCitySet = new Set(existing.map((r) => `${(r.name || '').toLowerCase().trim()}|${(r.city || '').toLowerCase().trim()}`));
  const slugSet = new Set(existing.map((r) => r.slug).filter(Boolean));

  let inserted = 0, skipped = 0;
  const byProvince = {};
  const skippedList = [];
  for (const c of CLINICS) {
    const h = host(c.website);
    const nc = `${c.name.toLowerCase().trim()}|${c.city.toLowerCase().trim()}`;
    if ((h && hostSet.has(h)) || nameCitySet.has(nc)) { skipped++; skippedList.push(`${c.name} (${c.city})`); continue; }
    let slug = slugify(`${c.name}-${c.city}`);
    while (slugSet.has(slug)) slug = slug + '-x';
    slugSet.add(slug); if (h) hostSet.add(h); nameCitySet.add(nc);

    const specialties = Array.from(new Set(c.services));
    const category = pickCategory(c.services);
    const description = `${c.name} is a ${c.city}, ${c.state} provider offering ${category.toLowerCase()}. Advertised services include ${c.services.join(', ')}. Confirm current treatments, pricing, and availability directly with the clinic.`;

    const row = {
      name: c.name, city: c.city, state: c.state, country: c.country,
      website: c.website, phone: c.phone, address: c.address,
      specialties, description, category, type: 'Clinic',
      slug, is_featured: false, is_claimed: false, availability: true,
      created_at: new Date().toISOString(),
    };
    const { error } = await sb.from('providers').insert(row);
    if (error) { console.error('INSERT FAIL', c.name, error.message); continue; }
    inserted++;
    byProvince[c.state] = (byProvince[c.state] || 0) + 1;
  }

  console.log('\ncandidates:', CLINICS.length);
  console.log('inserted:', inserted);
  console.log('skipped (already in directory):', skipped);
  if (skippedList.length) console.log('  ->', skippedList.join('; '));
  console.log('\nby province (net-new):');
  Object.entries(byProvince).sort((a, b) => b[1] - a[1]).forEach(([p, n]) => console.log(`  ${String(n).padStart(2)}  ${p}`));
})();
