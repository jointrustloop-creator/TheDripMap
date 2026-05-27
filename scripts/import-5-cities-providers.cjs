/**
 * Bulk import for the 5 cities that had zero directory inventory but live
 * blog posts: Phoenix, Atlanta, Boston, Dallas, Philadelphia.
 *
 * All providers below were verified via WebSearch + WebFetch by parallel
 * research agents (sourced from official sites, Yelp, Fresha, Vagaro,
 * Chamber of Commerce listings). Each clinic has a verified name +
 * website at minimum; addresses and phones are accurate where available.
 *
 * Idempotent — dedupes by slug, website, and name (case-insensitive).
 */
require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/&amp;/g, 'and')
    .replace(/&/g, 'and')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Clean HTML entities that crept in from agent output (& shows as &amp;)
function cleanName(name) {
  return name.replace(/&amp;/g, '&').trim();
}

const COUNTRY = 'United States';

// ─────────────────────── PHOENIX ───────────────────────
const PHOENIX = {
  city: 'Phoenix',
  state: 'Arizona',
  providers: [
    { name: 'Restore Hyper Wellness - North Scottsdale (Phoenix)', address: '18560 N Scottsdale Rd Ste 170, Phoenix, AZ 85054', phone: '+1 480-597-9061', website: 'https://www.restore.com/locations/az-phoenix-north-scottsdale-az001', type: 'In-Clinic' },
    { name: 'Restore Hyper Wellness - Norterra (Phoenix)', address: '2450 W Happy Valley Rd Ste 1142, Phoenix, AZ 85085', phone: '+1 623-201-8603', website: 'https://www.restore.com/locations/az-phoenix-norterra-az013', type: 'In-Clinic' },
    { name: 'Restore Hyper Wellness - South Chandler', address: '2895 S Alma School Rd Ste 8, Chandler, AZ 85286', phone: '+1 480-999-4970', website: 'https://www.restore.com/locations/az-chandler-south-az003', type: 'In-Clinic' },
    { name: 'Restore Hyper Wellness - Tempe (Watermark)', address: '430 N Scottsdale Rd Unit 114, Tempe, AZ 85281', phone: '+1 480-999-0757', website: 'https://www.restore.com/locations/az-tempe-watermark', type: 'In-Clinic' },
    { name: 'The DRIPBaR Phoenix Biltmore', address: '3165 E Lincoln Dr Unit 112, Phoenix, AZ 85016', phone: '+1 602-523-3090', website: 'https://phoenix-biltmore.thedripbar.com/', type: 'In-Clinic' },
    { name: 'The DRIPBaR Scottsdale', address: '14676 N Frank Lloyd Wright Blvd #137, Scottsdale, AZ 85260', phone: '+1 480-550-8369', website: 'https://scottsdale-horizon.thedripbar.com/', type: 'In-Clinic' },
    { name: 'Prime IV Hydration & Wellness - Phoenix High Street', address: '5310 E High St Ste 103, Phoenix, AZ 85054', phone: '+1 602-975-4918', website: 'https://primeivhydration.com/locations/arizona/phoenix-85054/', type: 'In-Clinic' },
    { name: 'Prime IV Hydration & Wellness - Scottsdale Via Linda', address: '8989 E Via Linda Ste 112, Scottsdale, AZ 85258', phone: '+1 480-739-3049', website: 'https://primeivhydration.com/locations/arizona/scottsdale/', type: 'In-Clinic' },
    { name: 'Prime IV Hydration & Wellness - Chandler', address: '1900 W Germann Rd Ste 15, Chandler, AZ 85286', phone: '+1 602-663-9178', website: 'https://primeivhydration.com/locations/arizona/chandler-85286/', type: 'In-Clinic' },
    { name: 'Prime IV Hydration & Wellness - Tempe', address: '1825 E Guadalupe Rd Ste 106, Tempe, AZ 85283', phone: '+1 602-671-2834', website: 'https://primeivhydration.com/locations/arizona/tempe-85283/', type: 'In-Clinic' },
    { name: 'Prime IV Hydration & Wellness - Gilbert', address: '3244 E Guadalupe Rd Ste A-108, Gilbert, AZ 85234', phone: '+1 602-693-0599', website: 'https://primeivhydration.com/locations/arizona/gilbert-85234/', type: 'In-Clinic' },
    { name: 'AZ IV Medics - Scottsdale', address: '14891 N Northsight Blvd Ste 118, Scottsdale, AZ 85260', phone: '+1 623-521-5034', website: 'https://www.azivmedics.com/', type: 'In-Clinic' },
    { name: 'Arizona IV Therapy Scottsdale', address: '14555 N Scottsdale Rd #120, Scottsdale, AZ 85254', phone: '+1 480-887-8088', website: 'https://arizonaiv.com/', type: 'In-Clinic' },
    { name: 'Prana IV Therapy', address: '10824 N 71st Pl Ste C, Scottsdale, AZ 85254', phone: '+1 480-202-4993', website: 'https://pranaivtherapy.com/', type: 'In-Clinic' },
    { name: 'VIVA IV Therapy', address: '7320 E 6th Ave, Scottsdale, AZ 85251', phone: '+1 480-508-8482', website: 'https://vivatherapy.com/', type: 'In-Clinic' },
    { name: 'Recovery Room IV Therapy and Wellness', address: '4301 N 75th St Ste 105, Scottsdale, AZ 85251', phone: '+1 480-687-8091', website: 'https://www.recoveryroomaz.com/', type: 'In-Clinic' },
    { name: 'ASAP IVs - Old Town Scottsdale', address: '7172 E Main St, Scottsdale, AZ 85251', phone: '+1 619-431-1714', website: 'https://www.asapivs.com/scottsdale', type: 'In-Clinic' },
    { name: 'Hydrate IV Bar - Arcadia', address: '3925 E Camelback Rd, Phoenix, AZ 85018', phone: '+1 602-840-4477', website: 'https://hydrateivbar.com/locations/arcadia/', type: 'In-Clinic' },
    { name: 'Hydrate IV Bar - Scottsdale', address: '15425 N Scottsdale Rd #130, Scottsdale, AZ 85254', phone: null, website: 'https://hydrateivbar.com/locations/scottsdale/', type: 'In-Clinic' },
    { name: 'Hydrate IV Bar - Chandler', address: '1211 W Ocotillo Rd Ste 1, Chandler, AZ 85248', phone: '+1 480-369-0139', website: 'https://hydrateivbar.com/locations/chandler-arizona/', type: 'In-Clinic' },
    { name: 'Premium IV Therapy - Mesa', address: '5050 E University Dr Ste 115, Mesa, AZ 85205', phone: '+1 480-935-3120', website: 'https://www.premiumivtherapy.com/', type: 'In-Clinic' },
    { name: 'IV Nutrition Scottsdale', address: '4902 E Shea Blvd Ste 105, Scottsdale, AZ 85254', phone: '+1 602-975-6645', website: 'https://ivnutrition.com/locations/phoenix-az/', type: 'In-Clinic' },
    { name: 'Live Hydration Spa - Mesa', address: '4459 S Power Rd Ste 105, Mesa, AZ 85212', phone: '+1 480-631-9397', website: 'https://locations.livehydrationspa.com/az/mesa/mesa.html', type: 'In-Clinic' },
    { name: 'Liquid Mobile IV - Phoenix', address: '4808 N 24th St Ste 125, Phoenix, AZ 85016', phone: '+1 855-954-7843', website: 'https://liquidmobileiv.com/', type: 'Mobile' },
    { name: 'Mobile IV Nurses - Phoenix', address: 'Phoenix, AZ 85006', phone: '+1 602-677-6058', website: 'https://mobileivnurses.com/mobile-iv-therapy-phoenix-az/', type: 'Mobile' },
  ],
};

// ─────────────────────── ATLANTA ───────────────────────
const ATLANTA = {
  city: 'Atlanta',
  state: 'Georgia',
  providers: [
    { name: 'Restore Hyper Wellness - Midtown', address: '931 Monroe Dr NE, Unit 111A, Atlanta, GA 30308', phone: '+1 404-836-7994', website: 'https://www.restore.com/locations/ga-atlanta-midtown-ga038', type: 'In-Clinic' },
    { name: 'Restore Hyper Wellness - Westside Village', address: '2250 Marietta Blvd NW, Suite 208, Atlanta, GA 30318', phone: '+1 678-973-0388', website: 'https://www.restore.com/locations/ga-atlanta-westside-village-ga003', type: 'In-Clinic' },
    { name: 'Restore Hyper Wellness - Vinings', address: '4300 Paces Ferry Rd SE, Suite 240, Atlanta, GA 30339', phone: '+1 678-403-8560', website: 'https://www.restore.com/locations/ga-atlanta-vinings-ga004', type: 'In-Clinic' },
    { name: 'Restore Hyper Wellness - Perimeter (Dunwoody)', address: '4706 Ashford Dunwoody Rd, Building B1, Suite 200, Dunwoody, GA 30338', phone: '+1 404-602-0114', website: 'https://www.restore.com/locations/ga-dunwoody-ga028', type: 'In-Clinic' },
    { name: 'Restore Hyper Wellness - Alpharetta (Avalon)', address: '7155 Avalon Way, Alpharetta, GA 30009', phone: '+1 470-361-2055', website: 'https://www.restore.com/locations/ga-alpharetta-ga002', type: 'In-Clinic' },
    { name: 'The DRIPBaR - Atlanta (Brighten Park)', address: '2484 Briarcliff Rd NE, Suite 22, Atlanta, GA 30329', phone: '+1 404-407-5562', website: 'https://thedripbar.com/atlanta/', type: 'In-Clinic' },
    { name: 'The DRIPBaR - Sandy Springs (The Prado)', address: '5600 Roswell Rd, Suite B110, Sandy Springs, GA 30342', phone: '+1 678-916-7290', website: 'https://thedripbar.com/sandy-springs-the-prado/', type: 'In-Clinic' },
    { name: 'Prime IV Hydration & Wellness - Marietta', address: '1205 Johnson Ferry Rd, Suite 103, Marietta, GA 30068', phone: '+1 470-946-6916', website: 'https://primeivhydration.com/locations/georgia/marietta-30068/', type: 'In-Clinic' },
    { name: 'Prime IV Hydration & Wellness - Sandy Springs', address: '6307 Roswell Rd, Sandy Springs, GA 30328', phone: '+1 678-324-3096', website: 'https://primeivhydration.com/locations/georgia/sandy-springs-30328/', type: 'In-Clinic' },
    { name: 'Prime IV Hydration & Wellness - Smyrna', address: '4500 West Village Place, Suite 2003, Smyrna, GA 30080', phone: '+1 770-758-7395', website: 'https://primeivhydration.com/locations/georgia/smyrna-30080/', type: 'In-Clinic' },
    { name: 'Prime IV Hydration & Wellness - Toco Hills', address: '3019 N Druid Hills Rd, Atlanta, GA 30329', phone: '+1 470-782-9471', website: 'https://primeivhydration.com/locations/georgia/toco-hills-30329/', type: 'In-Clinic' },
    { name: 'Prime IV Hydration & Wellness - Roswell', address: '1155 Woodstock Rd, Suite 720, Roswell, GA 30075', phone: '+1 770-762-1273', website: 'https://primeivhydration.com/locations/georgia/roswell-30075/', type: 'In-Clinic' },
    { name: 'Hydrate IV Bar - Midtown Atlanta', address: '1270 Spring St NW, Suite C4, Atlanta, GA 30309', phone: '+1 404-549-9447', website: 'https://hydrateivbar.com/locations/midtown/', type: 'In-Clinic' },
    { name: 'Hydrate IV Bar - Glenwood Park', address: '880 Glenwood Ave SE, Suite F, Atlanta, GA 30316', phone: null, website: 'https://hydrateivbar.com/locations/glenwood-park/', type: 'In-Clinic' },
    { name: 'Vida-Flo Buckhead', address: '2900 Peachtree Rd NW, Suite 207, Atlanta, GA 30305', phone: '+1 404-474-4722', website: 'https://govidaflo.com/buckhead', type: 'In-Clinic' },
    { name: 'Vida-Flo Brookhaven', address: '205 Town Blvd, Suite A-240, Atlanta, GA 30319', phone: null, website: 'https://govidaflo.com/brookhaven', type: 'In-Clinic' },
    { name: 'Vida-Flo Decatur', address: '431 W Ponce De Leon Ave, Suite 2, Decatur, GA 30030', phone: '+1 470-225-6954', website: 'https://govidaflo.com/decatur', type: 'In-Clinic' },
    { name: 'HydraPlus Buckhead', address: '2221 Peachtree Rd NE, Suite Q, Atlanta, GA 30309', phone: '+1 404-334-4854', website: 'https://thehydraplus.com/', type: 'In-Clinic' },
    { name: 'Replenish IV Therapy & Wellness Boutique', address: '525 North Ave NE, Suite 300, Atlanta, GA 30308', phone: '+1 404-891-9248', website: 'https://www.replenishiv.com/', type: 'In-Clinic' },
    { name: 'wHydrate Roswell', address: '1245 Alpharetta St, Roswell, GA 30075', phone: '+1 770-209-3466', website: 'https://whydrate.com/locations/iv-therapy-roswell-ga/', type: 'In-Clinic' },
    { name: 'Drip & Glow', address: '3827 Roswell Rd, Suite 124, Marietta, GA 30062', phone: '+1 404-500-6274', website: 'https://mydripglow.com/', type: 'In-Clinic' },
    { name: 'Mind Body + Soul IV Hydration & Spa', address: '78 Atlanta St SE, Suite 235, Marietta, GA 30060', phone: '+1 770-308-5011', website: 'https://www.mindbodysoulatl.com/', type: 'In-Clinic' },
    { name: 'Studio Recovery - Marietta', address: '3894 Due West Rd NW, Suite 265, Marietta, GA 30064', phone: '+1 770-675-7179', website: 'https://studiorecovery.com/iv-hydration-therapy/', type: 'In-Clinic' },
    { name: 'Mobile IV Medics - Atlanta', address: 'Atlanta, GA', phone: '+1 833-483-7477', website: 'https://mobileivmedics.com/service-areas/georgia/atlanta/', type: 'Mobile' },
    { name: 'Drip Hydration - Atlanta', address: '691 John Wesley Dobbs Ave NE, Suite C, Atlanta, GA 30312', phone: null, website: 'https://driphydration.com/coverage-areas/atlanta/', type: 'Mobile' },
    { name: 'Atlanta Accelerate Mobile IV Therapy', address: '1785 Rogers Ave SW, Atlanta, GA 30310', phone: '+1 470-264-4829', website: 'https://atlantamobileiv.com/', type: 'Mobile' },
    { name: 'Rejuvaa Wellness Bar', address: '1445 Woodmont Ln NW, Atlanta, GA 30318', phone: null, website: 'https://rejuvaawellnessbar.com/', type: 'Mobile' },
    { name: 'Oasis Hydration - Atlanta', address: 'Atlanta, GA', phone: '+1 404-772-3001', website: 'https://www.oasishydration.com/', type: 'Mobile' },
    { name: 'Advanced Hydration ATL', address: 'Atlanta, GA', phone: '+1 470-672-7008', website: 'https://advancedhydrationatl.com/', type: 'Mobile' },
    { name: '24 Hydration ATL', address: 'Atlanta, GA', phone: null, website: 'https://24hydrationatl.com/', type: 'Mobile' },
    { name: 'Mobile IV Nurses - Atlanta', address: 'Atlanta, GA', phone: '+1 888-897-2820', website: 'https://mobileivnurses.com/areas-we-serve/georgia/iv-therapy-in-atlanta-ga/', type: 'Mobile' },
  ],
};

// ─────────────────────── BOSTON ───────────────────────
const BOSTON = {
  city: 'Boston',
  state: 'Massachusetts',
  providers: [
    { name: 'Restore Hyper Wellness - Newton', address: '55 Needham St, Newton, MA 02461', phone: '+1 617-467-5728', website: 'https://www.restore.com/locations/ma-newton-ma003', type: 'In-Clinic' },
    { name: 'Restore Hyper Wellness - Somerville (Assembly Row)', address: '340 Grand Union Blvd, Unit C, Somerville, MA 02145', phone: '+1 617-600-3660', website: 'https://www.restore.com/locations/ma-somerville-ma014', type: 'In-Clinic' },
    { name: 'Restore Hyper Wellness - Dedham (Legacy Place)', address: '544 Legacy Pl, Dedham, MA 02026', phone: '+1 781-366-0591', website: 'https://www.restore.com/locations/ma-dedham-ma002', type: 'In-Clinic' },
    { name: 'Restore Hyper Wellness - Hingham (Derby Street)', address: '94 Derby St, Ste 211, Hingham, MA 02043', phone: '+1 781-385-7342', website: 'https://www.restore.com/locations/ma-hingham-ma001', type: 'In-Clinic' },
    { name: 'Restore Hyper Wellness - Lynnfield (MarketStreet)', address: '1130 Market St, Lynnfield, MA 01940', phone: '+1 781-650-8487', website: 'https://www.restore.com/locations/ma-lynnfield-ma004', type: 'In-Clinic' },
    { name: 'Restore Hyper Wellness - Woburn', address: '290 Mishawum Rd, Unit 210, Woburn, MA 01801', phone: '+1 781-776-1252', website: 'https://www.restore.com/locations/ma-woburn-ma005', type: 'In-Clinic' },
    { name: 'Vega Vitality Back Bay', address: '551 Boylston St, 4th Floor, Boston, MA 02116', phone: '+1 617-658-3421', website: 'https://vegavitality.com/locations/back-bay-boston-massachusetts/', type: 'In-Clinic' },
    { name: 'Boston Direct Health', address: '18 Newbury St, 5th Floor, Boston, MA 02116', phone: '+1 617-304-1965', website: 'https://bostondirecthealth.com/services/iv-therapy/', type: 'In-Clinic' },
    { name: 'The IV Garden', address: '246 Walnut St, Suite 101, Newton, MA 02460', phone: '+1 781-652-0076', website: 'https://www.theivgarden.com/', type: 'In-Clinic' },
    { name: 'Five Journeys', address: '181 Wells Ave, Suite 202, Newton, MA 02459', phone: '+1 617-934-6400', website: 'https://fivejourneys.com/iv-hydration-therapy/', type: 'In-Clinic' },
    { name: 'LivWell Drip', address: 'Newton, MA', phone: '+1 781-470-4041', website: 'https://livwell-drip.com/', type: 'In-Clinic' },
    { name: 'The Ivy Drip Bar & Wellness Center', address: '7 Brighton St, Belmont, MA 02478', phone: '+1 617-221-5070', website: 'https://www.theivydripbar.net/', type: 'In-Clinic' },
    { name: 'The HUB IV BAR Wellness Boutique', address: '500 Commonwealth Ave, Suite 526, Boston, MA 02215', phone: '+1 617-249-5342', website: 'https://thehubivbar.com/', type: 'In-Clinic' },
    { name: 'IV League Hydration - South Boston', address: '36 A St, South Boston, MA 02127', phone: '+1 800-905-4252', website: 'https://ivleaguehydrate.com/', type: 'In-Clinic' },
    { name: 'Regeneris MedSpa', address: '330 Brookline Ave, 5th Floor, Boston, MA 02215', phone: '+1 781-375-2246', website: 'https://regenerisboston.com/regenerative-medicine/iv-therapy/', type: 'In-Clinic' },
    { name: 'Kathryn Russo Aesthetics (KDR MedSpa + Wellness)', address: '415 Lexington St, Newton, MA 02466', phone: '+1 617-834-1812', website: 'https://kathrynrussoaesthetics.com/iv-vitamin-therapy-newton-ma/', type: 'In-Clinic' },
    { name: 'The IV Hub Wellness - Burlington', address: '154 Cambridge St, Suite 115, Burlington, MA 01803', phone: '+1 781-812-7550', website: 'https://theivhubwellness.com/burlington-location/', type: 'In-Clinic' },
    { name: 'AHN Point Wellness', address: '70 Hastings St, Suite 101, Wellesley, MA 02481', phone: '+1 781-785-8815', website: 'https://www.ahnpointwellness.com/iv-therapy/', type: 'In-Clinic' },
    { name: 'Sudbury Med Spa', address: '435 Boston Post Rd, Sudbury, MA 01776', phone: '+1 978-579-4090', website: 'https://sudburymedspa.com/iv-therapy/', type: 'In-Clinic' },
    { name: 'The IV Nurses - Boston', address: 'Holden, MA', phone: '+1 774-622-7053', website: 'https://theivnurses.com/boston/', type: 'Mobile' },
    { name: 'Drip Hydration - Boston', address: 'Boston, MA', phone: '+1 800-230-2259', website: 'https://driphydration.com/coverage-areas/boston/', type: 'Mobile' },
    { name: 'The I.V. Doc - Boston', address: 'Boston, MA', phone: null, website: 'https://www.theivdoc.com/mobile-iv-therapy-boston-ma', type: 'Mobile' },
    { name: 'Viva Wellness & IV Therapy - Boston', address: 'Boston, MA', phone: '+1 617-394-8430', website: 'https://www.vivawellnessiv.com/', type: 'Mobile' },
    { name: 'Drip Refresh Mobile IV - Boston', address: '1320 Boylston St, Boston, MA 02215', phone: null, website: 'https://driprefreshmobileiv.com/mobile-iv-therapy-boston-massachusetts/', type: 'Mobile' },
    { name: 'A Little Vein', address: '50-56 Broadlawn Park, Boston, MA 02467', phone: null, website: 'https://www.alittleveiniv.com/', type: 'Mobile' },
    { name: 'The Emmi Aesthetic - Mobile IV Boston', address: '114 Clare Ave, Hyde Park, MA 02136', phone: '+1 617-297-8286', website: 'https://theemmiaesthetic.com/mobile-iv-therapy-boston-ma/', type: 'Mobile' },
  ],
};

// ─────────────────────── DALLAS ───────────────────────
const DALLAS = {
  city: 'Dallas',
  state: 'Texas',
  providers: [
    { name: 'Restore Hyper Wellness - West Village (Uptown)', address: '2970 Cityplace West Blvd, Suite 170, Dallas, TX 75204', phone: '+1 214-461-5996', website: 'https://www.restore.com/locations/tx-dallas-west-village-tx025', type: 'In-Clinic' },
    { name: 'Restore Hyper Wellness - Preston Forest', address: '11930 Preston Rd, Suite 140, Dallas, TX 75230', phone: '+1 469-620-2234', website: 'https://www.restore.com/locations/tx-dallas-preston-forest-tx099', type: 'In-Clinic' },
    { name: 'Restore Hyper Wellness - Lovers Lane', address: '5509 W Lovers Ln, Suite A, Dallas, TX 75209', phone: '+1 214-258-5447', website: 'https://www.restore.com/locations/tx-dallas-lovers-lane', type: 'In-Clinic' },
    { name: 'Restore Hyper Wellness - Plano', address: '1941 Preston Rd, Suite 1035, Plano, TX 75093', phone: '+1 469-969-2878', website: 'https://www.restore.com/locations/tx-plano-tx005', type: 'In-Clinic' },
    { name: 'Restore Hyper Wellness - Frisco South', address: '3411 Preston Rd, Suite 1, Frisco, TX 75034', phone: '+1 972-782-5198', website: 'https://www.restore.com/locations/tx-frisco-south-tx011', type: 'In-Clinic' },
    { name: 'Restore Hyper Wellness - Las Colinas', address: '7601 N MacArthur Blvd, Suite 190, Irving, TX 75063', phone: '+1 469-489-4818', website: 'https://www.restore.com/locations/tx-irving-las-colinas-tx053', type: 'In-Clinic' },
    { name: 'Prime IV Hydration & Wellness - Dallas Mockingbird Ln', address: '5400 E Mockingbird Ln, Suite 117, Dallas, TX 75206', phone: '+1 469-750-2096', website: 'https://primeivhydration.com/locations/texas/mockingbird-lane-dallas-75206/', type: 'In-Clinic' },
    { name: 'Prime IV Hydration & Wellness - Addison Walk', address: '5000 Belt Line Rd, Suite 210, Dallas, TX 75254', phone: '+1 469-933-0971', website: 'https://primeivhydration.com/locations/texas/addison-tx/', type: 'In-Clinic' },
    { name: 'Prime IV Hydration & Wellness - Frisco', address: '3245 Main St, Suite 239, Frisco, TX 75034', phone: '+1 972-598-0940', website: 'https://primeivhydration.com/locations/texas/frisco-75034/', type: 'In-Clinic' },
    { name: 'The DRIPBaR Frisco', address: '3311 Preston Rd, Suite 9, Frisco, TX 75034', phone: '+1 469-466-1134', website: 'https://thedripbar.com/frisco-tx/', type: 'In-Clinic' },
    { name: 'The DRIPBaR Plano', address: '4152 W Spring Creek Pkwy, Suite 116, Plano, TX 75024', phone: '+1 972-521-4543', website: 'https://thedripbar.com/plano/', type: 'In-Clinic' },
    { name: 'Hydrate IV Bar - Mockingbird Station', address: '5331 E Mockingbird Ln, Suite 110, Dallas, TX 75206', phone: '+1 214-647-1149', website: 'https://hydrateivbar.com/locations/dallas-mockingbird/', type: 'In-Clinic' },
    { name: 'Hydrate IV Bar - Preston Forest', address: '5915 Forest Ln, Suite 320, Dallas, TX 75230', phone: '+1 214-242-9885', website: 'https://hydrateivbar.com/locations/preston/', type: 'In-Clinic' },
    { name: 'ThrIVe Drip Spa - Highland Park', address: '5301 W Lovers Ln, Suite 103, Dallas, TX 75209', phone: '+1 214-214-3747', website: 'https://thrivedripspa.com/highland-park/', type: 'In-Clinic' },
    { name: 'Infinite Dripz', address: '6050 N Central Expy, Suite 100, Dallas, TX 75206', phone: '+1 469-336-3540', website: 'https://infinitedripz.com/', type: 'In-Clinic' },
    { name: 'iFusion Wellness & iV Bars of Dallas Uptown', address: '3818 Cedar Springs Rd, Suite 103, Dallas, TX 75219', phone: '+1 214-205-1145', website: 'https://ifusiondallas.com/', type: 'In-Clinic' },
    { name: 'iV Bars - Addison', address: '3939 Beltline Rd, Suite 110, Addison, TX 75001', phone: '+1 855-273-9950', website: 'https://ivbars.com/location/addison-texas/', type: 'In-Clinic' },
    { name: 'Formula Wellness Uptown - West Village', address: '3600 McKinney Ave, Dallas, TX 75204', phone: '+1 214-432-5700', website: 'https://formulawellness.com/iv-hydration-therapy/', type: 'In-Clinic' },
    { name: 'Skin Damsel Aesthetics', address: '4801 Spring Valley Rd, Suite 80, Dallas, TX 75244', phone: '+1 214-506-3593', website: 'https://skindamsel.com/wellness/iv-therapy/', type: 'In-Clinic' },
    { name: 'Aquape Infusions', address: '222 W Las Colinas Blvd, Suite 1650E, Irving, TX 75039', phone: '+1 469-499-3738', website: 'https://www.aquapeiv.com/', type: 'In-Clinic' },
    { name: 'Revive Health and Beauty - Frisco', address: '11500 State Hwy 121, Suite 320, Frisco, TX 75035', phone: '+1 214-618-0048', website: 'https://revivehealthandbeauty.com/iv-therapy', type: 'In-Clinic' },
    { name: 'Lily Aesthetics & Wellness - Dallas', address: '14785 Preston Rd, Suite 175, Dallas, TX 75254', phone: '+1 972-503-5459', website: 'https://lilymedspa.com/white-glove-iv-therapy-dallas/', type: 'In-Clinic' },
    { name: 'Mobile IV Medics - Dallas-Fort Worth', address: 'Dallas, TX 75202', phone: '+1 833-483-7477', website: 'https://mobileivmedics.com/service-areas/texas/dallas/', type: 'Mobile' },
    { name: 'Drip Hydration - Dallas', address: '5825 Williamstown Rd, Dallas, TX 75230', phone: '+1 972-945-3747', website: 'https://driphydration.com/coverage-areas/dallas/', type: 'Mobile' },
    { name: 'Pure IV Texas - Dallas', address: 'Dallas, TX', phone: '+1 972-905-4291', website: 'https://www.pureiv.com/tx/dallas/mobile-iv-therapy', type: 'Mobile' },
    { name: 'HydraMed Mobile IV - Dallas', address: 'Dallas, TX', phone: '+1 800-801-8525', website: 'https://hydramed.com/areas-served/texas/dallas', type: 'Mobile' },
    { name: 'Liquid Mobile IV - Dallas Metro', address: '5 Cowboys Way, Frisco, TX 75034', phone: '+1 855-954-7843', website: 'https://liquidmobileiv.com/service-area/dallas/', type: 'Mobile' },
    { name: 'The Drip Mobile IV - Prosper', address: 'Prosper, TX 75078', phone: '+1 469-912-3112', website: 'https://www.thedripmobileiv.com/', type: 'Mobile' },
    { name: 'Infuzadrip IV Therapy', address: '2601 Little Elm Pkwy, Building 2 Suite 203A, Little Elm, TX 75068', phone: '+1 469-946-3747', website: 'https://infuzadrip.com/', type: 'Mobile' },
    { name: 'Elevated Wellness Frisco', address: '6100 Windhaven Pkwy, Plano, TX 75093', phone: null, website: 'https://www.elevatedwellnessfrisco.com/', type: 'Mobile' },
  ],
};

// ─────────────────────── PHILADELPHIA ───────────────────────
const PHILADELPHIA = {
  city: 'Philadelphia',
  state: 'Pennsylvania',
  providers: [
    { name: 'Restore Hyper Wellness - Center City Philadelphia', address: '1229 Chestnut St, Philadelphia, PA 19107', phone: '+1 215-982-2637', website: 'https://www.restore.com/locations/pa-philadelphia-center-city-pa019', type: 'In-Clinic' },
    { name: 'Restore Hyper Wellness - Plymouth Meeting', address: '500 W Germantown Pike, Ste 1195, Plymouth Meeting, PA 19462', phone: '+1 484-368-3492', website: 'https://www.restore.com/locations/pa-plymouth-meeting-pa003', type: 'In-Clinic' },
    { name: 'Restore Hyper Wellness - Paoli', address: '82 E Lancaster Ave B-14, Paoli, PA 19301', phone: '+1 610-590-7279', website: 'https://www.restore.com/locations/pa-paoli', type: 'In-Clinic' },
    { name: 'Restore Hyper Wellness - Media', address: '1075 W Baltimore Pike, Ste C, Media, PA 19063', phone: '+1 484-442-8359', website: 'https://www.restore.com/locations/pa-media-pa016', type: 'In-Clinic' },
    { name: 'Restore Hyper Wellness - Collegeville', address: '121 Providence Town Center, Market St, Store F-5A, Collegeville, PA 19426', phone: '+1 484-854-6984', website: 'https://www.restore.com/locations/pa-collegeville-pa011', type: 'In-Clinic' },
    { name: 'Restore Hyper Wellness - Exton', address: '430 W Lincoln Hwy, Exton, PA 19341', phone: '+1 484-879-6048', website: 'https://www.restore.com/locations/pa-exton-pa005', type: 'In-Clinic' },
    { name: 'Restore Hyper Wellness - Warrington', address: '1551 N Main St, Warrington, PA 18976', phone: '+1 267-483-5273', website: 'https://www.restore.com/local/iv-drip-therapy-pa-philadelphia-warrington-pa009', type: 'In-Clinic' },
    { name: 'Prime IV Hydration & Wellness - Blue Bell', address: '726 DeKalb Pike, Blue Bell, PA 19422', phone: '+1 267-627-3023', website: 'https://primeivhydration.com/locations/pennsylvania/blue-bell-19422/', type: 'In-Clinic' },
    { name: 'City Hydration - Philadelphia', address: '1315 Walnut St, Ste 1132, Philadelphia, PA 19107', phone: '+1 215-416-0109', website: 'https://www.cityhydration.com/philadelphia', type: 'In-Clinic' },
    { name: 'Philly IV Lounge', address: '209 W Girard Ave, Philadelphia, PA 19123', phone: '+1 215-509-5268', website: 'https://phillyiv.com/', type: 'In-Clinic' },
    { name: 'Lips and Drips by Erica Marie', address: '2342 S Broad St, Philadelphia, PA 19145', phone: '+1 215-914-3200', website: 'https://lipsanddripsllc.com/', type: 'In-Clinic' },
    { name: 'Ari Blanc Medical Spa', address: '7 N Columbus Blvd, Ste 302, Philadelphia, PA 19106', phone: '+1 267-687-7436', website: 'https://ariblancmedicalspa.com/iv-infusions-in-philadelphia/', type: 'In-Clinic' },
    { name: 'Bucky Body Center', address: '1915 Sansom St, Philadelphia, PA 19103', phone: '+1 215-273-3000', website: 'https://buckybodycenter.com/', type: 'In-Clinic' },
    { name: 'Meeting Point Health', address: '161 Leverington Ave, Ste 101, Philadelphia, PA 19127', phone: '+1 215-298-9928', website: 'https://www.meetingpointhealth.com/iv-therapy/', type: 'In-Clinic' },
    { name: 'Philly Med Club', address: '1300 N 2nd St, Office 101, Philadelphia, PA 19122', phone: '+1 215-770-1830', website: 'https://phillymedclub.com/services/iv-hydration-lounge-and-vitamin-injections-in-philadelphia-pa/', type: 'In-Clinic' },
    { name: 'R2S Hydration - Philadelphia', address: '1515 Market St, Ste 1200, Philadelphia, PA 19102', phone: '+1 717-418-3224', website: 'https://r2s-hydration.com/', type: 'In-Clinic' },
    { name: 'R2S Hydration - Radnor', address: '150 N Radnor Chester Rd, Ste F200, Radnor, PA 19087', phone: '+1 717-418-3224', website: 'https://r2s-hydration.com/locations/', type: 'In-Clinic' },
    { name: 'Liv Wellness and Hydration', address: '680 W DeKalb Pike, King of Prussia, PA 19406', phone: '+1 610-334-1062', website: 'https://livwellnessandhydration.com/', type: 'In-Clinic' },
    { name: 'Mobile IV Medics - Philadelphia', address: 'Philadelphia, PA', phone: '+1 833-483-7477', website: 'https://mobileivmedics.com/service-areas/pennsylvania/philadelphia/', type: 'Mobile' },
    { name: 'Drip Hydration - Philadelphia', address: 'Philadelphia, PA', phone: null, website: 'https://driphydration.com/coverage-areas/philadelphia/', type: 'Mobile' },
    { name: 'Revive Mobile IV - Philadelphia', address: 'Philadelphia, PA', phone: '+1 412-567-4220', website: 'https://www.revivemobileivs.com/pa/center-city/mobile-iv-therapy', type: 'Mobile' },
    { name: 'Hydrate 360 Mobile IV Therapy', address: 'Philadelphia, PA', phone: '+1 267-921-8158', website: 'https://hydrate360.net/', type: 'Mobile' },
    { name: 'IV Elements - Philadelphia', address: 'Philadelphia, PA', phone: '+1 888-611-3747', website: 'https://ivelements.net/our-locations/philadelphia', type: 'Mobile' },
    { name: 'Mobile IV Nurses - Philadelphia', address: 'Philadelphia, PA', phone: '+1 888-897-2820', website: 'https://mobileivnurses.com/mobile-iv-therapy-philadelphia-pa/', type: 'Mobile' },
    { name: 'Heart N Rhythm IV Therapy', address: 'Philadelphia, PA', phone: '+1 267-279-9177', website: 'https://www.hnrnursing.com/mobile-iv-therapy', type: 'Mobile' },
    { name: 'IV Active - Greater Philadelphia', address: 'Philadelphia, PA', phone: '+1 814-919-9611', website: 'https://iv-active.com/location/pennsylvania/greater-philadelphia-area/', type: 'Mobile' },
  ],
};

const CITIES = [PHOENIX, ATLANTA, BOSTON, DALLAS, PHILADELPHIA];

(async () => {
  // Pre-fetch ALL existing providers in the 5 states so we can dedupe across any geographic phrasing
  const stateSet = [...new Set(CITIES.map(c => c.state))];
  const { data: existing } = await s.from('providers')
    .select('slug, website, name')
    .in('state', stateSet);
  const existingSlugs = new Set(existing.map(p => p.slug));
  const existingWebsites = new Set(
    existing.map(p => (p.website || '').toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/^www\./, ''))
      .filter(Boolean)
  );
  const existingNames = new Set(existing.map(p => p.name.toLowerCase().trim()));
  console.log(`Loaded ${existing.length} existing providers in [${stateSet.join(', ')}] for dedup check.\n`);

  const allRows = [];
  const skipReport = {};
  for (const cityBlock of CITIES) {
    skipReport[cityBlock.city] = { added: 0, skipped: 0 };
    for (const p of cityBlock.providers) {
      const cleanedName = cleanName(p.name);
      const slug = `${slugify(cleanedName)}-${slugify(cityBlock.city)}`;
      const websiteKey = (p.website || '').toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/^www\./, '');
      const nameKey = cleanedName.toLowerCase().trim();

      if (existingSlugs.has(slug) || (websiteKey && existingWebsites.has(websiteKey)) || existingNames.has(nameKey)) {
        console.log(`  ⏭  Skipped (duplicate): ${cleanedName}`);
        skipReport[cityBlock.city].skipped++;
        continue;
      }

      allRows.push({
        slug,
        name: cleanedName,
        category: 'IV Therapy',
        city: cityBlock.city,
        state: cityBlock.state,
        country: COUNTRY,
        address: p.address,
        phone: p.phone,
        website: p.website,
        type: p.type,
        is_featured: false,
        availability: true,
        rating: null,
        reviews: null,
        created_at: new Date().toISOString(),
      });
      skipReport[cityBlock.city].added++;

      // Track this for any in-script duplicates within the same batch
      existingSlugs.add(slug);
      if (websiteKey) existingWebsites.add(websiteKey);
      existingNames.add(nameKey);
    }
  }

  console.log(`\nReady to insert: ${allRows.length} rows across ${CITIES.length} cities.\n`);
  if (allRows.length === 0) {
    console.log('Nothing to insert.');
    return;
  }

  // Insert in batches of 20
  let inserted = 0;
  let failed = 0;
  for (let i = 0; i < allRows.length; i += 20) {
    const batch = allRows.slice(i, i + 20);
    const { data, error } = await s.from('providers').insert(batch).select('id, slug, city');
    if (error) {
      console.log(`  ✗ Batch ${Math.floor(i / 20) + 1} failed: ${error.message}`);
      failed += batch.length;
    } else {
      data.forEach(d => console.log(`  ✓ ${d.city.padEnd(14)}  ${d.slug}`));
      inserted += data.length;
    }
  }

  console.log(`\n=== RESULT ===`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Failed:   ${failed}`);
  for (const [city, r] of Object.entries(skipReport)) {
    console.log(`  ${city.padEnd(14)}: +${r.added} new, ${r.skipped} dupe-skipped`);
  }

  // Update cities.listing_count for any city slugs that exist
  for (const cityBlock of CITIES) {
    const citySlug = cityBlock.city.toLowerCase().replace(/\s+/g, '-');
    const { data: cityRow } = await s.from('cities').select('slug').ilike('slug', citySlug).maybeSingle();
    if (cityRow) {
      const { count } = await s.from('providers').select('id', { count: 'exact', head: true }).ilike('city', cityBlock.city);
      await s.from('cities').update({ listing_count: count }).eq('slug', cityRow.slug);
      console.log(`Updated cities.listing_count for ${citySlug} → ${count}`);
    }
  }
})();
