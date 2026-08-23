/**
 * SENT-FOLDER RECONCILIATION (operator order, 2026-08-23: "record it all
 * properly before we start outreach, make sure your data is correct").
 *
 * Source: the complete Gmail Sent history (5 pages, ~205 threads, Jun 18 to
 * Aug 23) read via the Gmail MCP and transcribed here. Cross-checks every
 * campaign recipient against providers.outreach_sent / followup_sent /
 * email_bounced and the suppression tables.
 *
 * MODES:  --dry (default: report only)   --fix (apply corrections)
 * Fixes applied in --fix:
 *   1. bounced addresses seen in Gmail -> email_bounced=true (+ suppression)
 *   2. the explicit "Unsubscribe" reply -> outreach_suppressions
 *   3. sent-but-untracked first touches -> outreach_sent=true (+_at best-effort)
 *   4. sent-but-untracked follow-ups   -> followup_sent=true
 *   5. the EDTA "lead" -> forward_status='spam_suspected' (never forwarded)
 * Nothing is ever un-set: flags only move in the safe direction (toward
 * "already contacted"), which can only PREVENT duplicate emails.
 */
require('dotenv').config({ path: '.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const FIX = process.argv.includes('--fix');

// First-touch campaign sends ("Your X clinic is already on TheDripMap" /
// "Quick one about X's listing on TheDripMap"), with send date.
const FIRST_TOUCH = [
  // Aug 6
  ['info@theclaraclinic.com','2026-08-06'],['info@higherhealthcentre.com','2026-08-06'],['info@midtownmedspa.ca','2026-08-06'],['info@ivwellnessmobile.com','2026-08-06'],
  // Jul 14
  ['info@yazomedicalaesthetics.ca','2026-07-14'],['info@emeraldcaremax.ca','2026-07-14'],['info@artisanaesthetics.ca','2026-07-14'],['carmen@callencosmetic.ca','2026-07-14'],['info@integratedfunctionalmed.com','2026-07-14'],['info@luxerxclinic.com','2026-07-14'],['hello@seekoptimal.ca','2026-07-14'],
  // Jul 12
  ['info@risemedaesthetics.com','2026-07-12'],['reception@six08health.com','2026-07-12'],['info@aspiremedicine.ca','2026-07-12'],['info@godleyclinic.com','2026-07-12'],['info@winhealth.ca','2026-07-12'],['hello@drkalebfalk.com','2026-07-12'],['reception@islandnaturopathic.com','2026-07-12'],['npoptimalhealth@gmail.com','2026-07-12'],['rutherford@islandoptimal.com','2026-07-12'],['info@tbaynaturopathic.ca','2026-07-12'],['info@parsonsdermatology.com','2026-07-12'],['info@hfnc.ca','2026-07-12'],['health@pcnm.ca','2026-07-12'],['info@bradfordskinclinic.com','2026-07-12'],['info@mdtreatmentlounge.com','2026-07-12'],
  // Jul 11
  ['hello@contourlaser.ca','2026-07-11'],['wellvitality@outlook.com','2026-07-11'],['info@islandglowmedispa.com','2026-07-11'],['info@kerrisdaleskinmedical.com','2026-07-11'],['info@kalonaesthetics.ca','2026-07-11'],['admin@dynamichealthclinic.ca','2026-07-11'],['info@maplegrovemc.ca','2026-07-11'],['info@meshwellness.ca','2026-07-11'],['westendaesthetics.info@gmail.com','2026-07-11'],['reception@purewg.ca','2026-07-11'],['hydriawellness@gmail.com','2026-07-11'],['drkinleung@gmail.com','2026-07-11'],['injectorclaudia@gmail.com','2026-07-11'],['info@my-ikaria.com','2026-07-11'],['support@toniawinchester.com','2026-07-11'],['contact@elitewellnessmc.com','2026-07-11'],['hello@themenopausepractice.ca','2026-07-11'],['info@liv-well.ca','2026-07-11'],['medicinehat.kwiv@gmail.com','2026-07-11'],['info@tulacare.ca','2026-07-11'],['info@4pointshealth.com','2026-07-11'],
  // Jul 9
  ['5thave@evolvechiro.ca','2026-07-09'],['info@elixirbeautyottawa.com','2026-07-09'],['info@beautybarclinics.ca','2026-07-09'],['info@jpdwellness.com','2026-07-09'],
  // Jul 8
  ['admin@synergyhealthmanagement.com','2026-07-08'],['info@caremedwellness.ca','2026-07-08'],['info@perfectioncosmeticclinic.com','2026-07-08'],['info@trumed.ca','2026-07-08'],
  // Jul 7
  ['hello@foundationhealth.ca','2026-07-07'],['info@skinstudiotoronto.ca','2026-07-07'],['care@kwc-aestheticsbysam.com','2026-07-07'],['info@theglamroom.ca','2026-07-07'],['info@easyalliedhealth.ca','2026-07-07'],['info@gmaclinic.com','2026-07-07'],['hello@juveaaesthetics.ca','2026-07-07'],['hello@bellebeautemedspa.com','2026-07-07'],['dart@choicehealthcentre.com','2026-07-07'],['info@integrative-medicine.ca','2026-07-07'],['info@elev8aesthetics.ca','2026-07-07'],['info@drmikaylamilne.com','2026-07-07'],['contactus@mobilerevivedrip.com','2026-07-07'],['info@pinkalmedicalaesthetics.com','2026-07-07'],
  // Jul 5-6
  ['info@driplounge.ca','2026-07-06'],['info@advancedwomenshealth.ca','2026-07-06'],['info@dynamicdrips.com','2026-07-06'],['info@royalmedicalspa.ca','2026-07-06'],['info@ewcentre.com','2026-07-05'],['info@londonplasticsurgery.ca','2026-07-05'],['info@colabhealthandbody.ca','2026-07-05'],['hello@alliesintegrated.health','2026-07-05'],['info@balanceintegrativehealth.ca','2026-07-05'],['info@nhfclinics.com','2026-07-05'],['admin@drkconrad.com','2026-07-05'],['info@drwrinkleaway.ca','2026-07-05'],['hello@brightandwell.ca','2026-07-05'],['info@advancedmedicine.ca','2026-07-05'],['admin@wildflowerhw.com','2026-07-05'],['info@bestskinclinic.ca','2026-07-05'],['info@dnhc.ca','2026-07-05'],['info@applemed.ca','2026-07-05'],['info@mensvitality.clinic','2026-07-05'],['info@oihc.ca','2026-07-05'],['info@skinsuitewpg.ca','2026-07-05'],['info@heartlakeaesthetics.com','2026-07-05'],['info@motioncareclinic.com','2026-07-05'],['info@drceaser.com','2026-07-05'],
  // Jun 26
  ['info@carecliniconalbion.com','2026-06-26'],['cosmetic@dermaskininstitute.com','2026-06-26'],['info@drdaniellewest.com','2026-06-26'],['info@thesageclinic.com','2026-06-26'],['clarityteam@clarityhealthburlington.com','2026-06-26'],['info@sevawellnessclinic.com','2026-06-26'],['rola@theloungemedicalspa.com','2026-06-26'],['info@experiencequartz.com','2026-06-26'],['info@radiancelaserclinic.com','2026-06-26'],['info@tfm.care','2026-06-26'],['info@crystalcosmeticclinic.ca','2026-06-26'],['office@bcorchardaesthetics.com','2026-06-26'],['info@toniciv.ca','2026-06-26'],['info@onwc.ca','2026-06-26'],['info@blissyogaspa.com','2026-06-26'],['info@catalystkinetics.com','2026-06-26'],['info@facetoronto.com','2026-06-26'],['info@vancouverlaser.com','2026-06-26'],['info@amreaw.com','2026-06-26'],['hello@westendwomenshealth.ca','2026-06-26'],
  // Jun 22-24
  ['ivboost.ca@gmail.com','2026-06-24'],['info@skinvitality.ca','2026-06-24'],['info@eirinihealingsolutions.ca','2026-06-24'],['info@bmsresources.ca','2026-06-24'],['vitamincliniccanada@gmail.com','2026-06-24'],['contact@fusioncareclinic.ca','2026-06-24'],['info@nomorewrinkles.ca','2026-06-24'],['info@natliving.ca','2026-06-24'],['info@beautifygroup.com','2026-06-24'],['info@urbanhealthgroup.ca','2026-06-24'],['info@naturalchoicemedicalclinic.com','2026-06-24'],['wellnessinstitute@sympatico.ca','2026-06-24'],['help@gtrsante.com','2026-06-24'],['inquiry@naturopathyclinic.com','2026-06-24'],['office@theartlife.ca','2026-06-24'],['info@medskincare.ca','2026-06-24'],['eastcoastnaturopathic@gmail.com','2026-06-24'],['info@enviromedclinic.com','2026-06-24'],['info@holistixclinic.com','2026-06-24'],['mobileivhomecare@gmail.com','2026-06-24'],['info@inviva.ca','2026-06-23'],['admin@theivdripbooth.com','2026-06-23'],['info@thevineiv.com','2026-06-23'],['care@3dlifestyle.ca','2026-06-23'],['timetothrive2023@gmail.com','2026-06-23'],['info@nuhydration.com','2026-06-23'],['info@wellnessdoctor.ca','2026-06-23'],['bookalphamedspa@gmail.com','2026-06-23'],['info@nourishhealthclinic.ca','2026-06-23'],['info@ottawanpservices.ca','2026-06-23'],['info@bodysculptingregina.ca','2026-06-23'],['flowivmedspa@gmail.com','2026-06-23'],['visagemedicalregina@gmail.com','2026-06-23'],['info@medidclinic.com','2026-06-22'],['info@okanaganintegrativehealth.ca','2026-06-22'],['care@wellspringiv.com','2026-06-22'],['info@clinic360.com','2026-06-22'],['info@ivdriproom.ca','2026-06-22'],
];

// "Still holding X's listing" follow-ups (second touch), Jul 17 - Jul 31.
const FOLLOW_UP = [
  ['info@celebritylasercare.ca','2026-07-31'],['info@dripinluxe.com','2026-07-31'],['alyssa@foreverbeautyinjectables.com','2026-07-31'],['info@fyxsonmedical.com','2026-07-31'],['info@dripclub.ca','2026-07-31'],['info@hydratewellness.com','2026-07-31'],['info@aspirenaturopathic.ca','2026-07-31'],['office@drkiralewis.com','2026-07-31'],['info@kelownahills.com','2026-07-31'],['info@healthy-balance.ca','2026-07-31'],['info@healthsourceimc.com','2026-07-31'],
  ['info@mintintegrative.com','2026-07-28'],['reception@electrahealth.ca','2026-07-28'],['reception@crossroadsnd.com','2026-07-28'],['info@optimumwellnessclinic.ca','2026-07-28'],['info@eternawellness.ca','2026-07-28'],['hello@skinnovate.ca','2026-07-28'],['info@acupoint.ca','2026-07-28'],
  ['info@aesthefusion.com','2026-07-24'],['info@aafiyataesthetics.com','2026-07-24'],['mardaloop@essencewellness.ca','2026-07-24'],['info@brontewellness.com','2026-07-24'],['info@feelgoodivtherapy.com','2026-07-24'],['hello@empactwellness.com','2026-07-24'],['grantcummingsdc@gmail.com','2026-07-24'],['info@boltonnaturopathic.ca','2026-07-24'],['hello@atheriawellness.com','2026-07-24'],['info@cliniqueiv.com','2026-07-24'],['info@theclaraclinic.com','2026-07-24'],
  ['office@acaciahealth.ca','2026-07-20'],['office@gilmorewellnessclinic.com','2026-07-20'],
  ['info@aurorarejuvenation.ca','2026-07-17'],['clinic@deerfields.ca','2026-07-17'],['info@decodemode.com','2026-07-17'],['info@dermasciencemedspa.com','2026-07-17'],['info@beautifygroup.com','2026-07-17'],['info@beambeauty.ca','2026-07-17'],['info@chperformance.ca','2026-07-17'],['info@durandhealth.com','2026-07-17'],['info@restorative-medicine.ca','2026-07-17'],['office@enerchanges.com','2026-07-17'],
];

// Hard bounces observed in Gmail (mailer-daemon failure in-thread).
const BOUNCED = ['carmen@callencosmetic.ca','hello@seekoptimal.ca','support@toniawinchester.com','admin@drkconrad.com','info@carecliniconalbion.com','rola@theloungemedicalspa.com','info@nomorewrinkles.ca','info@celebritylasercare.ca','info@dripinluxe.com'];

// Explicit unsubscribe reply (Mobile IV Canada, Jun 24: "Unsubscribe").
const UNSUBSCRIBED = ['mobileivhomecare@gmail.com'];

async function main() {
  let provs = [], f = 0;
  for (;;) {
    const { data, error } = await s.from('providers').select('id,name,slug,email,outreach_sent,outreach_sent_at,followup_sent,email_bounced').range(f, f + 999);
    if (error) throw new Error(error.message);
    if (!data || !data.length) break;
    provs = provs.concat(data); if (data.length < 1000) break; f += 1000;
  }
  const byEmail = new Map();
  for (const p of provs) if (p.email) {
    const k = p.email.toLowerCase();
    if (!byEmail.has(k)) byEmail.set(k, []);
    byEmail.get(k).push(p);
  }
  const { data: sup1 } = await s.from('email_suppressions').select('email');
  const { data: sup2 } = await s.from('outreach_suppressions').select('email');
  const suppressed = new Set([...(sup1 || []), ...(sup2 || [])].map((r) => r.email.toLowerCase()));

  const issues = { untrackedFirst: [], untrackedFollow: [], noProvider: [], bounceUnflagged: [], unsubMissing: [] };

  for (const [email, date] of FIRST_TOUCH) {
    const ps = byEmail.get(email.toLowerCase());
    if (!ps) { issues.noProvider.push(email); continue; }
    for (const p of ps) if (!p.outreach_sent) issues.untrackedFirst.push({ email, date, slug: p.slug, id: p.id });
  }
  for (const [email, date] of FOLLOW_UP) {
    const ps = byEmail.get(email.toLowerCase());
    if (!ps) { issues.noProvider.push(email + ' (followup)'); continue; }
    for (const p of ps) if (!p.followup_sent) issues.untrackedFollow.push({ email, date, slug: p.slug, id: p.id });
  }
  for (const email of BOUNCED) {
    const ps = byEmail.get(email.toLowerCase()) || [];
    for (const p of ps) if (!p.email_bounced) issues.bounceUnflagged.push({ email, slug: p.slug, id: p.id });
    if (ps.length === 0) issues.bounceUnflagged.push({ email, slug: '(no provider row)', id: null });
  }
  for (const email of UNSUBSCRIBED) if (!suppressed.has(email)) issues.unsubMissing.push(email);

  console.log(`Campaign sends transcribed: ${FIRST_TOUCH.length} first touches + ${FOLLOW_UP.length} follow-ups`);
  console.log(`\nUNTRACKED first touches (sent, flag false -> could be re-emailed): ${issues.untrackedFirst.length}`);
  for (const i of issues.untrackedFirst) console.log('  ', i.email, '->', i.slug);
  console.log(`UNTRACKED follow-ups: ${issues.untrackedFollow.length}`);
  for (const i of issues.untrackedFollow) console.log('  ', i.email, '->', i.slug);
  console.log(`Sent to an address with NO provider row: ${issues.noProvider.length}`);
  for (const e of issues.noProvider) console.log('  ', e);
  console.log(`Bounced in Gmail but email_bounced=false: ${issues.bounceUnflagged.length}`);
  for (const i of issues.bounceUnflagged) console.log('  ', i.email, '->', i.slug);
  console.log(`Unsubscribe reply not in suppressions: ${issues.unsubMissing.length}`, issues.unsubMissing.join(', '));

  if (!FIX) { console.log('\n[dry] no writes. Run with --fix to apply.'); return; }

  for (const i of issues.untrackedFirst) {
    const { error } = await s.from('providers').update({ outreach_sent: true, outreach_sent_at: i.date + 'T12:00:00Z' }).eq('id', i.id);
    console.log('fix first', i.slug, error ? error.message : 'ok');
  }
  for (const i of issues.untrackedFollow) {
    const { error } = await s.from('providers').update({ followup_sent: true }).eq('id', i.id);
    console.log('fix follow', i.slug, error ? error.message : 'ok');
  }
  for (const i of issues.bounceUnflagged) {
    if (i.id) { const { error } = await s.from('providers').update({ email_bounced: true }).eq('id', i.id); console.log('fix bounce', i.slug, error ? error.message : 'ok'); }
    const { error: se } = await s.from('email_suppressions').upsert({ email: i.email, reason: 'hard_bounce', source: 'gmail_sent_reconcile_2026-08-23' }, { onConflict: 'email' });
    if (se) console.log('  suppression', i.email, se.message);
  }
  for (const email of issues.unsubMissing) {
    const { error } = await s.from('outreach_suppressions').upsert({ email, reason: 'unsubscribe_reply', source: 'gmail_sent_reconcile_2026-08-23' }, { onConflict: 'email' });
    console.log('fix unsub', email, error ? error.message : 'ok');
    const ps = byEmail.get(email) || [];
    for (const p of ps) await s.from('providers').update({ reply_category: 'unsubscribed' }).eq('id', p.id);
  }
  // The EDTA enquiry is supplier spam, not a patient lead. Never forward.
  const { error: spamErr } = await s.from('inquiries')
    .update({ forward_status: 'spam_suspected' })
    .eq('email', 'abcservice@telus.net');
  console.log('fix EDTA enquiry -> spam_suspected:', spamErr ? spamErr.message : 'ok');
  console.log('\nFIX complete.');
}
main().catch((e) => { console.error('ERR', e.message); process.exit(1); });
