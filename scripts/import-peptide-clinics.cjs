/**
 * Import verified real peptide-therapy clinics (researched May 2026) into providers.
 * Dedupes against existing rows by website host and by name+city. Real data only —
 * blank phone/address left null (never fabricated). Run: node scripts/import-peptide-clinics.cjs
 */
require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const slugify = (s) => s.toLowerCase().trim().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const host = (url) => { try { return new URL(/^https?:\/\//.test(url) ? url : 'https://' + url).hostname.toLowerCase().replace(/^www\./, ''); } catch { return null; } };

// country defaults to US unless 'CA'
const C = (name, city, state, website, services, phone, address, country) => ({ name, city, state, website, services, phone: phone || null, address: address || null, country: country === 'CA' ? 'Canada' : 'United States' });

const CLINICS = [
  // ── Los Angeles ──
  C('Citrin Wellness', 'Beverly Hills', 'CA', 'https://citrinwellness.com', ['Sermorelin','Tesamorelin','Semaglutide','Tirzepatide','BPC-157'], '(424) 389-3547', '8920 Wilshire Blvd, Suite 610, Beverly Hills, CA 90211'),
  C('AlphaMan Clinic', 'Sherman Oaks', 'CA', 'https://alphamanclinic.com', ['CJC-1295','Ipamorelin','Sermorelin','BPC-157','Semaglutide','Tirzepatide'], '(818) 650-8049', '14044 Ventura Blvd #101, Sherman Oaks, CA 91423'),
  C('Tower Urology Medical Group', 'Los Angeles', 'CA', 'https://www.towerurology.com', ['Sermorelin','BPC-157','PT-141','CJC-1295','Ipamorelin'], '(310) 854-9898', '8635 W 3rd St, Ste 1W, Los Angeles, CA 90048'),
  C('Daniel Benhuri MD', 'Beverly Hills', 'CA', 'https://www.danielbenhurimd.com', ['Semaglutide','Tirzepatide','Tesamorelin','PT-141','BPC-157','NAD+'], '(310) 362-1255', '9400 Brighton Way, Suite 210, Beverly Hills, CA 90210'),
  C('Wellness at Century City', 'Los Angeles', 'CA', 'https://www.wellnessatcenturycity.com', ['Semaglutide','BPC-157','Tesamorelin','Epitalon'], null, '2080 Century Park East, Suite 807, Los Angeles, CA 90067'),
  C('Cienega Medical', 'West Hollywood', 'CA', 'https://cienegaspa.com', ['BPC-157','GHK-Cu','PT-141','Semaglutide'], '(323) 655-8220', null),
  // ── New York ──
  C('Michael Aziz MD & Associates', 'New York', 'NY', 'https://www.michaelazizmd.com', ['Semaglutide','Tirzepatide','BPC-157','Thymosin Beta'], '(212) 906-9111', '515 Madison Ave, Suite 602, New York, NY 10022'),
  C('Weiss Wellness + Beauty', 'New York', 'NY', 'https://weisswellnessnyc.com', ['BPC-157','Sermorelin','CJC-1295','Ipamorelin','Epithalon','Semaglutide','Tirzepatide'], '(212) 752-6774', '515 Madison Ave, 5th Floor, New York, NY 10022'),
  C('Elite Health Center NYC', 'New York', 'NY', 'https://elitehealthcenternyc.com', ['Semaglutide','Tirzepatide','BPC-157'], '(917) 565-9360', '245 5th Ave, Suite 306, New York, NY 10016'),
  C('Dr. Jennifer Levine', 'New York', 'NY', 'https://www.drjenniferlevine.com', ['Semaglutide','Tirzepatide','Peptide Therapy'], '(212) 517-9400', null),
  C('Physio Logic NYC', 'Brooklyn', 'NY', 'https://physiologicnyc.com', ['BPC-157','Peptide Therapy'], '(718) 260-1000', '409 Fulton St, Floor 2, Brooklyn, NY 11201'),
  C('Regenerative Health NY', 'Little Neck', 'NY', 'https://regenerativehealthny.com', ['Peptide Therapy','Semaglutide','Tirzepatide'], '(516) 993-6048', '54-44 Little Neck Pkwy, Suite 1A, Little Neck, NY 11362'),
  // ── Miami ──
  C('TribecaMed', 'Miami Beach', 'FL', 'https://tribecamed.com', ['Sermorelin','Semaglutide','Tirzepatide','NAD+','Peptide Therapy'], '(305) 763-8832', '777 Arthur Godfrey Rd #300, Miami Beach, FL 33140'),
  C('The Biostation', 'Miami Beach', 'FL', 'https://thebiostation.com', ['Semaglutide','Tirzepatide','Retatrutide','Peptide Therapy'], null, '6801 Collins Ave, Miami Beach, FL 33141'),
  C('Elevate Miami', 'Miami', 'FL', 'https://elevate-miami.com', ['Semaglutide','Sermorelin','Peptide Therapy'], '(305) 359-5569', '9000 SW 137th Ave, Suite 208, Miami, FL 33186'),
  C('Vida Integrative Health', 'Miami', 'FL', 'https://vidaintegrativehormones.com', ['Semaglutide','Sermorelin','Peptide Therapy'], '(786) 313-5457', null),
  C('Dr. Sende Wellness', 'Miami', 'FL', 'https://drsende.com', ['Semaglutide','Tirzepatide','Peptide Therapy'], null, null),
  // ── Chicago ──
  C('WholeHealth Chicago', 'Chicago', 'IL', 'https://wholehealthchicago.com', ['Semaglutide','Tirzepatide','BPC-157','Sermorelin','PT-141','Thymosin Alpha-1'], '(773) 296-6700', '2265 N Clybourn Ave, Chicago, IL 60614'),
  C('Lume Wellness', 'Chicago', 'IL', 'https://lume-wellness.com', ['BPC-157','TB-500','CJC-1295','Sermorelin','Peptide Therapy'], '(312) 285-2004', '351 W Hubbard St, Chicago, IL 60654'),
  C('PURE Medical Spa', 'Chicago', 'IL', 'https://www.puremedicalspa.us', ['Semaglutide','Tirzepatide','AOD-9604','Sermorelin','CJC-1295','Ipamorelin','Peptide Therapy'], '(312) 312-7873', '875 N Dearborn St, Chicago, IL'),
  C('Elysium Aesthetics + Longevity', 'Chicago', 'IL', 'https://elysiumchicago.com', ['Sermorelin','Semaglutide','Tirzepatide'], '(312) 888-9361', '520 W Erie St Ste 110, Chicago, IL 60654'),
  C('Chicago Aesthetics Surgery & Med Spa', 'Chicago', 'IL', 'https://chicagoaesthetics.com', ['BPC-157','Sermorelin','HGH'], '(312) 846-1629', null),
  // ── Dallas (+ DFW metro) ──
  C('OMNI SCULPT MD', 'Dallas', 'TX', 'https://omnisculptmd.com', ['Semaglutide','Tirzepatide','BPC-157','AOD-9604','NAD+','Sermorelin'], '(469) 278-7662', '10440 N Central Expy, Suite 124, Dallas, TX 75231'),
  C('Prive Aesthetics', 'Dallas', 'TX', 'https://www.privemedaesthetics.com', ['Peptide Therapy'], '(817) 739-6640', '6417 Hillcrest Ave, Dallas, TX 75205'),
  C('Renew Beauty Med Spa & Wellness', 'Dallas', 'TX', 'https://renewbeautymedspa.com', ['Semaglutide','Tirzepatide'], '(214) 369-1600', '8687 N Central Expy, Suite 2220, Dallas, TX 75225'),
  C('iFusion Aesthetics & iV Bars', 'Dallas', 'TX', 'https://ifusiondallas.com', ['Sermorelin','Semaglutide','Peptide Therapy'], '(214) 205-1145', '3818 Cedar Springs Rd Ste 103, Dallas, TX 75219'),
  C('Integrative Wellness Fx', 'Dallas', 'TX', 'https://integrativewellnessfx.com', ['Peptide Therapy'], '(469) 333-1298', '10670 N Central Expy, Ste 110, Dallas, TX 75231'),
  C('North Dallas Dermatology Associates', 'Dallas', 'TX', 'https://northdallasderm.com', ['Semaglutide','Tirzepatide'], '(214) 420-7070', '8144 Walnut Hill Lane, Suite 1300, Dallas, TX 75231'),
  C("Gameday Men's Health - Dallas North", 'Dallas', 'TX', 'https://gamedaymenshealth.com', ['Sermorelin','Semaglutide'], '(469) 621-9607', '11661 Preston Rd, Ste 124, Dallas, TX 75230'),
  C('Executive Medicine of Texas', 'Southlake', 'TX', 'https://www.emtexas.com', ['Sermorelin','CJC-1295','Ipamorelin','BPC-157','PT-141','Thymosin Alpha-1'], '(817) 552-4300', '2106 E State Hwy 114 #300, Southlake, TX 76092'),
  C('Aspire Rejuvenation', 'Plano', 'TX', 'https://aspirerejuvenation.com', ['Sermorelin','BPC-157','CJC-1295','Semaglutide'], '(214) 617-3013', null),
  // ── Houston (+ metro) ──
  C('Houston Regenerative Medicine', 'Houston', 'TX', 'https://houstonregenerativemd.com', ['BPC-157','TB-500','Sermorelin','Semaglutide','Peptide Therapy'], null, '100 Glenborough Dr, Suite 0403J, Houston, TX 77067'),
  C('Relive Health Memorial Houston', 'Houston', 'TX', 'https://relivehealth.com', ['BPC-157','TB-500','CJC-1295','Ipamorelin','Sermorelin','Tesamorelin','GHK-Cu','Semaglutide','Tirzepatide'], null, null),
  C('HTX Urology', 'Webster', 'TX', 'https://www.htxurology.com', ['BPC-157','TB-500','Ipamorelin','CJC-1295','Sermorelin','PT-141','NAD+','Semaglutide','Tirzepatide'], '(832) 602-0373', '600 N Kobayashi Rd, Suite 210, Webster, TX 77598'),
  C('Z Med Clinic & Med Spa', 'Houston', 'TX', 'https://www.zmedclinic.com', ['Semaglutide','Tirzepatide','Sermorelin'], '(281) 292-3030', '4101 Greenbriar Dr, Ste 238, Houston, TX 77098'),
  C("Houston Men's Health Clinic", 'Houston', 'TX', 'https://houstonmensclinic.com', ['CJC-1295','Ipamorelin','Sermorelin','Tesamorelin','BPC-157','Peptide Therapy'], '(713) 770-6226', '4141 SW Fwy, Houston, TX 77027'),
  C('Restore Hyper Wellness - River Oaks', 'Houston', 'TX', 'https://www.restore.com', ['Semaglutide','Tirzepatide'], '(832) 742-9695', '1944 W Gray St, Houston, TX'),
  C('Dr. Shel Wellness & Aesthetic Center', 'Sugar Land', 'TX', 'https://drshel.com', ['Semaglutide','BPC-157','GHK-Cu','Selank','AOD-9604','Sermorelin','Peptide Therapy'], '(281) 313-7435', '1437 Highway 6, Suite 100, Sugar Land, TX 77478'),
  C('Infinity Premier Health', 'Houston', 'TX', 'https://infinitypremierhealth.com', ['CJC-1295','Ipamorelin','BPC-157','Peptide Therapy'], '(832) 486-9705', '13630 Beamer Rd, Suite 109, Houston, TX 77089'),
  // ── Denver (+ metro) ──
  C('Juventas Wellness', 'Denver', 'CO', 'https://juventaswellness.com', ['Semaglutide','Tirzepatide','Peptide Therapy'], '(303) 731-6585', '835 E 18th Ave, Denver, CO 80218'),
  C('Natura Med Spa & IV Bar', 'Denver', 'CO', 'https://naturamedspaivbar.com', ['Semaglutide','Tirzepatide'], '(720) 513-5786', '357 S Colorado Blvd, Denver, CO'),
  C('Evolv Wellness MedSpa', 'Denver', 'CO', 'https://evolvwellnessmedspa.com', ['Peptide Therapy','Semaglutide','NAD+'], '(720) 765-5241', '7488 E 29th Ave, Denver, CO 80238'),
  C('Colorado Medical Solutions', 'Denver', 'CO', 'https://coloradomedicalsolutions.com', ['Semaglutide','Tirzepatide','Retatrutide','Peptide Therapy'], '(229) 441-3562', '950 E Harvard Ave #110, Denver, CO 80210'),
  C('Gleam Medical Spa', 'Denver', 'CO', 'https://gleammedspa.com', ['Peptide Therapy','Semaglutide'], '(303) 507-7823', '300 S Jackson St, Suite 100, Denver, CO 80209'),
  C('Restorative Injectables Med Spa', 'Denver', 'CO', 'https://restorativeinjectables.com', ['Semaglutide','CJC-1295','Peptide Therapy'], '(303) 350-9065', '6981 E Belleview Ave, Denver, CO 80237'),
  C('Thrive Health Solutions', 'Englewood', 'CO', 'https://thrivecolorado.com', ['Sermorelin','Semaglutide','NAD+','Peptide Therapy'], '(303) 790-8446', null),
  C('Evexias Medical Center Denver', 'Lone Tree', 'CO', 'https://www.evexiasdenver.com', ['Peptide Therapy','Hormone Therapy'], '(720) 625-8043', '10107 Ridgegate Parkway, Suite 360, Lone Tree, CO 80124'),
  // ── Toronto ──
  C("Gameday Men's Health - North York", 'North York', 'ON', 'https://gamedaymenshealth.ca', ['Semaglutide','BPC-157','Peptide Therapy'], '(647) 847-4438', '4211 Yonge St, Ste 304, North York, ON M2P 2A9', 'CA'),
  C('VitalityMD', 'Toronto', 'ON', 'https://vitalitymd.com', ['Semaglutide','Tirzepatide'], '(416) 792-1100', '1769 Avenue Road, Toronto, ON M5M 3Y8', 'CA'),
  C('Beauty Bar Medical Clinic', 'Toronto', 'ON', 'https://beautybarclinic.com', ['Semaglutide','Tirzepatide'], '(416) 961-8683', '27 Bellair St, Toronto, ON M5R 2C8', 'CA'),
  C('Toronto Plastic Surgeons Wellness Centre', 'Toronto', 'ON', 'https://torontoplasticsurgeon.com', ['Semaglutide','Tirzepatide'], '1-866-552-3858', '66 Avenue Rd #4, Toronto, ON', 'CA'),
  C('Dr. Kris Conrad', 'Toronto', 'ON', 'https://www.drkconrad.com', ['Peptide Therapy','BPC-157','TB-500','GHK-Cu'], '(416) 961-2053', '21 Bedford Road, Toronto, ON', 'CA'),
  // ── Vancouver ──
  C('Sparrow MD Advanced Medical Aesthetics', 'Vancouver', 'BC', 'https://sparrowmd.ca', ['Semaglutide','GLP-1'], '(604) 757-6404', '2760 W Broadway, Unit 209, Vancouver, BC V6K 4M2', 'CA'),
  C('Revolution Medical Clinic', 'Vancouver', 'BC', 'https://www.revolutionmedicalclinic.com', ['Semaglutide','Tirzepatide','Peptide Therapy'], '(604) 260-4850', '5615 West Boulevard, Vancouver, BC V6M 3W7', 'CA'),
  C("Men's Vitality Clinic", 'Vancouver', 'BC', 'https://mensvitality.clinic', ['Semaglutide','Tirzepatide','Peptide Therapy'], '(236) 259-3550', '1433 Cedar Cottage Mews, Vancouver, BC V5N 2R5', 'CA'),
  C('EnerChanges', 'Vancouver', 'BC', 'https://www.enerchanges.com', ['HGH','Hormone Therapy','Medical Weight Loss'], '(604) 565-8380', 'Unit L6, 601 West Broadway, Vancouver, BC V5Z 4C2', 'CA'),
  C('Bay Wellness Centre', 'Vancouver', 'BC', 'https://baywellnesscentre.com', ['BPC-157','Semaglutide','CJC-1295','Ipamorelin','Peptide Therapy'], null, null, 'CA'),
];

(async () => {
  // existing rows for dedup
  let existing = [], from = 0;
  for (let p = 0; p < 20; p++) {
    const { data, error } = await sb.from('providers').select('name, city, website, slug').range(from, from + 999);
    if (error) { console.error('READ ERR', error.message); process.exit(1); }
    if (!data || !data.length) break;
    existing.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  const hostSet = new Set(existing.map(r => host(r.website)).filter(Boolean));
  const nameCitySet = new Set(existing.map(r => `${(r.name||'').toLowerCase().trim()}|${(r.city||'').toLowerCase().trim()}`));
  const slugSet = new Set(existing.map(r => r.slug).filter(Boolean));

  let inserted = 0, skipped = 0;
  const byCity = {};
  const skippedList = [];
  for (const c of CLINICS) {
    const h = host(c.website);
    const nc = `${c.name.toLowerCase().trim()}|${c.city.toLowerCase().trim()}`;
    if ((h && hostSet.has(h)) || nameCitySet.has(nc)) { skipped++; skippedList.push(c.name + ' (' + c.city + ')'); continue; }
    let slug = slugify(`${c.name}-${c.city}`);
    while (slugSet.has(slug)) slug = slug + '-x';
    slugSet.add(slug); if (h) hostSet.add(h); nameCitySet.add(nc);

    const specialties = Array.from(new Set([...c.services, 'Peptide Therapy']));
    const description = `${c.name} is a ${c.city}, ${c.state} clinic offering peptide therapy. Advertised services include ${c.services.join(', ')}. Peptide and GLP-1 protocols should be prescribed and supervised by a licensed clinician — confirm current treatment availability, pricing, and regulatory status directly with the clinic.`;

    const row = {
      name: c.name, city: c.city, state: c.state, country: c.country,
      website: c.website, phone: c.phone, address: c.address,
      specialties, description, category: 'Peptide Therapy', type: 'Clinic',
      slug, is_featured: false, is_claimed: false, availability: true,
      created_at: new Date().toISOString(),
    };
    const { error } = await sb.from('providers').insert(row);
    if (error) { console.error('INSERT FAIL', c.name, error.message); continue; }
    inserted++;
    byCity[c.city] = (byCity[c.city] || 0) + 1;
  }

  console.log('candidates:', CLINICS.length);
  console.log('inserted:', inserted);
  console.log('skipped (already in directory):', skipped, skippedList.length ? '-> ' + skippedList.join('; ') : '');
  console.log('\nby city:');
  Object.entries(byCity).sort((a,b)=>b[1]-a[1]).forEach(([c,n]) => console.log('  ' + n + '  ' + c));
})();
