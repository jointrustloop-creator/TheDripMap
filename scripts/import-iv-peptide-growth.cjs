/**
 * Database growth import (May 2026): real, verified IV-therapy + peptide clinics
 * researched by background agents for Las Vegas, Washington DC, Atlanta, Phoenix, Boston.
 * Dedupes against existing rows by website host and by name+city. Real data only —
 * blank phone/address left null (never fabricated). National lead-gen/aggregator domains
 * (driphydration.com, hydramed.com, theivdoc.com) intentionally excluded for quality.
 * Run: node scripts/import-iv-peptide-growth.cjs
 */
require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const slugify = (s) => s.toLowerCase().trim().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const host = (url) => { try { return new URL(/^https?:\/\//.test(url) ? url : 'https://' + url).hostname.toLowerCase().replace(/^www\./, ''); } catch { return null; } };

// C(name, city, state, website, services[], phone, address)  — all US
const C = (name, city, state, website, services, phone, address) => ({ name, city, state, website, services, phone: phone || null, address: address || null, country: 'United States' });

const CLINICS = [
  // ───────────── Las Vegas, NV (metro: incl. Henderson) ─────────────
  C('Regenerate Me', 'Las Vegas', 'NV', 'https://regenerateme.com/', ['IV Therapy','Hydration','Hangover','Vitamin Drips','Anti-Aging','Immunity'], '(702) 778-2800', '3377 Las Vegas Blvd S, Ste 2045, Las Vegas, NV 89109'),
  C('Modern Wellness Clinic', 'Las Vegas', 'NV', 'https://www.modernwellnessclinic.com/', ['IV Therapy','NAD+','Hydration','Peptide Therapy','Semaglutide','Tirzepatide','Hormone Therapy','Medical Weight Loss'], '(702) 463-9159', '5375 S Fort Apache Rd, Suites 102 & 103, Las Vegas, NV 89148'),
  C('Vital Infusions & Performance', 'Las Vegas', 'NV', 'https://vitalinfusionsandperformance.com/', ['IV Therapy','Hydration','NAD+','Peptide Therapy','Hormone Therapy','Medical Weight Loss','Vitamin Injections'], '(580) 847-7468', '9484 W Flamingo Rd, Ste 280, Las Vegas, NV 89147'),
  C('Infuze Aesthetics & Wellness', 'Henderson', 'NV', 'https://www.infuzelv.com/', ['IV Therapy','Hydration','NAD+','Vitamin Injections'], '(702) 964-9500', '1590 W Horizon Ridge Pkwy, Ste 110, Henderson, NV 89012'),
  C('Hangover Heaven IV Hydration', 'Las Vegas', 'NV', 'https://www.hangoverheaven.com/', ['IV Therapy','Hydration','Hangover','NAD+','Mobile IV'], '(702) 749-3300', '2300 W Sahara Ave, Ste 815, Las Vegas, NV 89102'),
  C('Push IV & Wellness', 'Las Vegas', 'NV', 'https://pushiv.com/', ['IV Therapy','Hydration','Hangover','NAD+','Vitamin Drips','Mobile IV'], '(702) 478-3369', '4315 Dean Martin Dr, Ste 230, Las Vegas, NV 89103'),
  C('Prime IV Hydration & Wellness (Summerlin)', 'Las Vegas', 'NV', 'https://primeivhydration.com/locations/nevada/las-vegas-nv/', ['IV Therapy','Hydration','Hangover','NAD+','Immunity'], '(725) 444-5763', '10595 Discovery Dr, Ste 4, Las Vegas, NV 89135'),
  C('Reset IV', 'Las Vegas', 'NV', 'https://resetiv.com/', ['Mobile IV','Hydration','Hangover','NAD+','Myers Cocktail','Immunity'], '(702) 800-5735', '9501 Hillwood Dr, Ste 200, Las Vegas, NV 89134'),
  C('LIV Wellness', 'Las Vegas', 'NV', 'https://www.livhydrates.com/', ['Mobile IV','Hydration','Hangover','NAD+','Medical Weight Loss','Immunity'], '(888) 899-8824', null),
  C('IV Vitamin Therapy Clinic', 'Las Vegas', 'NV', 'https://www.myvitamintherapy.com/', ['IV Therapy','Hydration','Vitamin Drips','Recovery','Mobile IV'], '(702) 966-2440', '3790 Paradise Rd, Ste 140, Las Vegas, NV 89169'),
  C('Vitality Medical & Wellness Center', 'Las Vegas', 'NV', 'https://www.vitalitymedicalwellness.com/', ['IV Therapy','Hydration','NAD+','Peptide Therapy','Functional Medicine'], null, '311 N Buffalo Dr, Ste A, Las Vegas, NV 89145'),
  C('Healor Primary Care', 'Las Vegas', 'NV', 'https://healor.com/', ['IV Therapy','Hydration','Peptide Therapy','Hormone Therapy'], '(702) 362-2273', '3900 W Charleston Blvd, Ste 170, Las Vegas, NV 89102'),
  C('Sky Health Wellness Clinic', 'Las Vegas', 'NV', 'https://www.skyhealthnv.com/', ['Peptide Therapy','IV Therapy','Medical Weight Loss'], '(702) 840-7899', '4385 N Pecos Rd, Ste 140, Las Vegas, NV 89115'),
  C('Restore Hyper Wellness (Summerlin South)', 'Las Vegas', 'NV', 'https://www.restore.com/locations/nv-las-vegas-summerlin-south-nv010', ['IV Therapy','Hydration','NAD+','Cryotherapy'], '(702) 903-7611', '4220 S Grand Canyon Dr, Ste 1, Las Vegas, NV 89147'),
  C('Ageless Las Vegas', 'Las Vegas', 'NV', 'https://agelesslasvegas.com/', ['IV Therapy','Hydration','NAD+'], '(702) 779-7010', null),
  C('RenewalPeptides Las Vegas', 'Las Vegas', 'NV', 'https://las-vegas.renewalpeptides.com/', ['Peptide Therapy','Semaglutide','Tirzepatide','Medical Weight Loss'], null, null),
  C('Peptide Balance Clinic Las Vegas', 'Las Vegas', 'NV', 'https://las-vegas.peptidebalanceclinic.com/', ['Peptide Therapy'], null, null),
  C('Las Vegas Body Sculpting', 'Henderson', 'NV', 'https://www.lvbodysculpting.com/', ['Semaglutide','Tirzepatide','Medical Weight Loss'], '(702) 899-8100', '2990 W Horizon Ridge Pkwy, Ste 100, Henderson, NV 89052'),
  C('Pure IV Nevada', 'Las Vegas', 'NV', 'https://www.pureivnevada.com/locations/iv-therapy-las-vegas-nv', ['Mobile IV','Hydration','Hangover','Immunity','Vitamin Drips'], null, null),
  C('Advanced Mobile IV (AMIV)', 'Las Vegas', 'NV', 'https://www.amiv.com/lasvegas/', ['Mobile IV','Hydration','NAD+','Vitamin Drips','Recovery'], null, null),
  C('IV Drip 2 U', 'Las Vegas', 'NV', 'https://www.ivdrip2u.com/', ['Mobile IV','Hydration','Vitamin Drips'], null, null),
  C('REVIV (The Cosmopolitan)', 'Las Vegas', 'NV', 'https://www.revivme.com/location-details/reviv-las-vegas-at-the-cosmopolitan/', ['IV Therapy','Hydration','Hangover','NAD+','Vitamin Drips'], null, 'The Cosmopolitan, 3708 Las Vegas Blvd S, Level 2, Las Vegas, NV 89109'),

  // ───────────── Washington, DC (metro: incl. close-in MD/VA) ─────────────
  C('The DRIPBaR D.C. — Georgetown', 'Washington', 'DC', 'https://dc.thedripbar.com/', ['IV Therapy','Hydration','NAD+','Vitamin Injections','Mobile IV'], '(202) 998-8242', null),
  C('Indigo Integrative Health Clinic', 'Washington', 'DC', 'https://www.indigohealthclinic.com/iv-lounge', ['IV Therapy','NAD+','Vitamin Drips','Myers Cocktail'], '(202) 499-7535', '1010 Wisconsin Ave NW, Suite 660, Washington, DC 20007'),
  C('DC Drip', 'Washington', 'DC', 'https://www.dc-drip.com/', ['IV Therapy','Hydration','Vitamin Injections'], '(202) 843-5420', '600 Pennsylvania Ave SE, Ste 490, Washington, DC 20003'),
  C('Hela Medical Spa', 'Washington', 'DC', 'https://helamedicalspa.com/iv-therapy-washington-dc', ['IV Therapy','Hydration','Hangover','Myers Cocktail','Vitamin Injections'], '(202) 333-4445', '3128 M St NW, Fl 3, Washington, DC 20007'),
  C('Somenek + Pittman MD', 'Washington', 'DC', 'https://somenekpittmanmd.com/washington-dc-iv-therapy/', ['IV Therapy','NAD+','Hydration'], '(202) 932-7461', '2440 M St NW, Suite 507, Washington, DC 20037'),
  C('Restorative Health', 'Washington', 'DC', 'https://www.restorativehealth.org/services/iv-therapy', ['IV Therapy','Myers Cocktail','Vitamin Infusions'], '(202) 318-4184', '4801 Wisconsin Ave NW, Suite 101, Washington, DC 20016'),
  C('GW Center for Integrative Medicine', 'Washington', 'DC', 'https://gwcim.com/services/intravenous-therapies/', ['IV Therapy'], '(202) 833-5055', '908 New Hampshire Ave NW, Suite 200, Washington, DC 20037'),
  C('Hydralive Therapy — Park Van Ness', 'Washington', 'DC', 'https://hydralivetherapy.com/location/park-van-ness/', ['IV Therapy','Hydration','NAD+','Hormone Therapy'], null, '4455 Connecticut Ave NW, Washington, DC 20008'),
  C('Vitalify MedSpa', 'Washington', 'DC', 'https://vitalifymedspa.com/', ['IV Therapy','Semaglutide','Tirzepatide','Medical Weight Loss'], '(202) 410-1459', '1 Dupont Cir NW, Ste 115C, Washington, DC 20036'),
  C("Gameday Men's Health — Cleveland Park", 'Washington', 'DC', 'https://gamedaymenshealth.com/cleveland-park', ['Peptide Therapy','IV Therapy','Vitamin Injections','Medical Weight Loss'], null, null),
  C('Capitol Infusion', 'Washington', 'DC', 'https://capitolinfusion.com/', ['IV Therapy','Vitamin Infusions'], null, null),
  C('Performance Rejuvenation Center', 'Washington', 'DC', 'https://www.prcindc.com/service/peptide-therapy', ['Peptide Therapy','NAD+','Medical Weight Loss','Hormone Therapy'], '(202) 251-4472', '6856 Eastern Ave NW, Ste 205, Washington, DC 20012'),
  C('Capitol Contours', 'Washington', 'DC', 'https://capitolcontours.com/washington-dc/', ['Semaglutide','Tirzepatide','Medical Weight Loss'], '(888) 355-9223', '1430 K St NW, Suite 102, Washington, DC 20005'),
  C('Beale Medical Weight Loss', 'Washington', 'DC', 'https://docbeale.com/semaglutide-washington-dc/', ['Semaglutide','Medical Weight Loss'], '(202) 463-7872', '1712 I St NW, Suite 604, Washington, DC 20006'),
  C('Peel Haus Aesthetics', 'Washington', 'DC', 'https://peelhaus.com/semaglutide-in-washington-dc/', ['Semaglutide','Medical Weight Loss'], '(202) 891-4287', '1105 Pennsylvania Ave SE, Washington, DC 20003'),
  C('AnewSkin Aesthetic Clinic & Medical Spa', 'Washington', 'DC', 'https://www.anewskinmedspa.com/medical-weight-loss/', ['Medical Weight Loss'], '(202) 505-6996', '818 18th St NW, Ste 250, Washington, DC 20006'),
  C('Capital Aesthetic + Laser Center', 'Washington', 'DC', 'https://capitalaestheticdc.com/semaglutide-washington-dc/', ['Semaglutide','Medical Weight Loss'], '(202) 908-2284', null),
  C('Medical Cosmetic (Dr. Varano)', 'Washington', 'DC', 'https://www.medicalcosmetic.org/med-supervised-diet', ['Semaglutide','Medical Weight Loss'], null, null),
  C('PureDropIV', 'Washington', 'DC', 'https://puredropiv.com/washington-dc/', ['Mobile IV','Hydration','Hangover','Vitamin Injections','Immunity'], '(571) 461-1700', null),
  C('Well Hydrated', 'Washington', 'DC', 'https://thewellhydrated.com/', ['Mobile IV','Hydration','Vitamin Drips'], null, null),
  C('HydraBoost IV Therapy', 'Washington', 'DC', 'https://www.hydraboostivtherapy.com/', ['Mobile IV','Hydration','Immunity','Hangover'], '(202) 834-8225', null),
  C('Drip Refresh Mobile IV Therapy', 'Washington', 'DC', 'https://driprefreshmobileiv.com/mobile-iv-therapy-washington-dc/', ['Mobile IV','Hydration'], null, null),
  C('Moksha Aesthetics', 'Potomac', 'MD', 'https://mokshaaesthetics.com/', ['Semaglutide','Peptide Therapy','Medical Weight Loss'], '(240) 907-5009', '10220 River Rd, Ste 3, Potomac, MD 20854'),
  C('Center for Plastic Surgery', 'Chevy Chase', 'MD', 'https://cpsdocs.com/metabolic-aesthetics/peptide-therapy/', ['Peptide Therapy','Semaglutide','Tirzepatide'], null, null),

  // ───────────── Atlanta, GA (metro: incl. Marietta) ─────────────
  C('Hydrate IV Bar — Midtown', 'Atlanta', 'GA', 'https://hydrateivbar.com/locations/midtown/', ['IV Therapy','Hydration','Vitamin Injections','NAD+'], '(404) 549-9447', '1270 Spring St NW, Suite C4, Atlanta, GA 30309'),
  C('HydraPlus (Buckhead)', 'Atlanta', 'GA', 'https://thehydraplus.com/', ['IV Therapy','Hydration','Vitamin Injections'], '(404) 948-6780', '2221 Peachtree Rd NE, Ste Q, Atlanta, GA 30309'),
  C('Flo & Glo IV Wellness Lounge', 'Atlanta', 'GA', 'https://flongloivatlanta.com/', ['IV Therapy','Hydration','Vitamin Injections','Medical Weight Loss'], '(404) 458-3024', '2345 Cheshire Bridge Rd, Suite 3, Atlanta, GA'),
  C('Replenish iV Therapy & Wellness Boutique', 'Atlanta', 'GA', 'https://www.replenishiv.com/', ['IV Therapy','Hydration','Immunity','Recovery'], '(404) 891-9248', '525 North Ave NE, Suite 300, Atlanta, GA 30308'),
  C('Hebe Aesthetics and Vitality', 'Atlanta', 'GA', 'https://hebeaestheticsandvitality.com/', ['Semaglutide','Peptide Therapy','Medical Weight Loss'], '(404) 261-5199', '3726 Roswell Rd NE, Atlanta, GA 30342'),
  C('The Maxim Clinic Aesthetics & Wellness', 'Marietta', 'GA', 'https://www.themaximclinic.com/', ['Semaglutide','Medical Weight Loss','Hormone Therapy'], '(770) 937-0937', '3939 Roswell Rd #240, Marietta, GA 30062'),
  C('Progressive Medical Center', 'Atlanta', 'GA', 'https://www.progressivemedicalcenter.com/', ['Peptide Therapy','Functional Medicine','Anti-Aging'], '(770) 676-6000', '4646 N Shallowford Rd, Atlanta, GA 30338'),
  C('Age Well ATL', 'Atlanta', 'GA', 'https://www.agewellatl.net/', ['Peptide Therapy','Semaglutide','Medical Weight Loss','Hormone Therapy'], null, null),
  C('24 Hydration ATL', 'Atlanta', 'GA', 'https://24hydrationatl.com/', ['Mobile IV','Hydration','Vitamin Drips','NAD+'], null, null),
  C('Oasis Hydration', 'Atlanta', 'GA', 'https://www.oasishydration.com/', ['Mobile IV','Hydration','Hangover'], null, null),

  // ───────────── Phoenix, AZ (metro: incl. Scottsdale) ─────────────
  C('BiohAK IV Bar', 'Phoenix', 'AZ', 'https://biohakivbar.com/', ['IV Therapy','Hydration','Vitamin Injections','NAD+','Medical Weight Loss'], '(602) 851-7853', '825 N 7th St, Unit 103, Phoenix, AZ 85006'),
  C('Thrive IV Therapy', 'Phoenix', 'AZ', 'https://thriveivtherapyphoenix.com/', ['IV Therapy','Hydration','Hangover','Immunity','Anti-Aging','Mobile IV'], '(954) 864-0565', '2710 W Bell Rd, Ste 1229, Phoenix, AZ 85053'),
  C('Prime IV Hydration & Wellness — Phoenix (High Street)', 'Phoenix', 'AZ', 'https://primeivhydration.com/locations/arizona/phoenix-85054/', ['IV Therapy','Hydration','Immunity','Recovery'], '(602) 975-4918', '5310 E High St, Suite 103, Phoenix, AZ 85054'),
  C('Beso Wellness and Beauty', 'Phoenix', 'AZ', 'https://www.besowb.com/', ['Peptide Therapy','Semaglutide','Tirzepatide','NAD+','IV Therapy','Mobile IV'], '(480) 447-8166', '4731 E Union Hills Dr, Suite 114, Phoenix, AZ 85050'),
  C('Liquid Mobile IV', 'Phoenix', 'AZ', 'https://liquidmobileiv.com/', ['IV Therapy','Hydration','Immunity','Semaglutide','Mobile IV'], '(855) 954-7843', '4808 N 24th St, Suite 125, Phoenix, AZ 85016'),
  C('Element IV Therapy', 'Phoenix', 'AZ', 'https://elementivtherapy.com/', ['Mobile IV','Hydration','Hangover','Immunity'], '(480) 672-0257', '3104 E Camelback Rd, Ste 2898, Phoenix, AZ 85016'),
  C('Valley Medical Weight Loss', 'Phoenix', 'AZ', 'https://www.valleymedicalweightloss.com/', ['Semaglutide','Tirzepatide','Medical Weight Loss'], '(602) 441-3305', '3801 N 24th St, Phoenix, AZ 85016'),
  C('IV Revival', 'Scottsdale', 'AZ', 'https://ivrevival.com/', ['Mobile IV','Hydration','Hangover','Myers Cocktail','NAD+'], '(480) 848-1678', '7373 N Scottsdale Rd, Ste D235, Scottsdale, AZ 85253'),
  C('IV Nutrition Phoenix', 'Scottsdale', 'AZ', 'https://ivnutrition.com/locations/phoenix-az/', ['IV Therapy','Hydration','Vitamin Drips'], '(602) 975-6645', '4902 E Shea Blvd, Suite 105, Scottsdale, AZ 85254'),

  // ───────────── Boston, MA (metro: incl. Newton, Somerville) ─────────────
  C('IV League Hydration', 'Boston', 'MA', 'https://ivleaguehydrate.com/', ['IV Therapy','Hydration','Hangover','Vitamin Injections','Semaglutide','Mobile IV'], '(800) 905-4252', '36 A St, South Boston, MA 02127'),
  C('The HUB IV Bar Wellness Boutique', 'Boston', 'MA', 'https://thehubivbar.com/', ['IV Therapy','Hydration','NAD+','Peptide Therapy','Vitamin Infusion'], '(617) 249-5342', '500 Commonwealth Ave, Suite 526, Boston, MA'),
  C('The IV Garden', 'Newton', 'MA', 'https://www.theivgarden.com/', ['IV Therapy','Hydration','NAD+','Vitamin Injections','Mobile IV'], '(781) 652-0076', '246 Walnut St, Suite 101, Newtonville, MA 02460'),
  C('Suite Six Medical Aesthetics — Seaport', 'Boston', 'MA', 'https://www.suitesixmedspa.com/', ['IV Therapy','Hydration','Hangover','Semaglutide','Peptide Therapy'], '(617) 431-8086', '311 Summer St, Boston, MA 02210'),
  C('Viva Wellness & IV Therapy', 'Boston', 'MA', 'https://www.vivawellnessiv.com/', ['Mobile IV','Hydration','Immunity','Recovery'], null, null),
  C('The IV Nurses', 'Boston', 'MA', 'https://theivnurses.com/', ['Mobile IV','Hydration','NAD+','Medical Weight Loss','Recovery'], '(774) 622-7053', null),
  C('Neem Medical Spa', 'Somerville', 'MA', 'https://neemmedicalspa.com/', ['Semaglutide','Medical Weight Loss','Peptide Therapy','IV Therapy','NAD+'], '(617) 623-0504', '5 Middlesex Ave, Suite 306, Somerville, MA 02145'),
  C('Joseph A. Russo, MD — Medical Spa', 'Newton', 'MA', 'https://josepharussomd.com/', ['Semaglutide','Medical Weight Loss'], '(617) 964-1440', '575 Boylston St, Floor 2, Newton Centre, MA 02459'),
];

// Choose a display category from the service mix.
const IV_TOKENS = ['iv therapy','hydration','hangover','nad','vitamin','myers','mobile iv','immunity','recovery'];
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
  // pull existing rows for dedup
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
  const byCity = {};
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
    byCity[c.city] = (byCity[c.city] || 0) + 1;
  }

  console.log('\ncandidates:', CLINICS.length);
  console.log('inserted:', inserted);
  console.log('skipped (already in directory):', skipped);
  if (skippedList.length) console.log('  ->', skippedList.join('; '));
  console.log('\nby city (net-new):');
  Object.entries(byCity).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => console.log(`  ${String(n).padStart(2)}  ${c}`));
})();
