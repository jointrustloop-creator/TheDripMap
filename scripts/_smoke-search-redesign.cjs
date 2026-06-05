/**
 * Smoke test the new /search behavior:
 *   1. Wait for deploy (probe for new H2 text)
 *   2. Default view shows Safety Verified H2 + 7 cards
 *   3. Recent Additions strip + NEW badge present
 *   4. "Browse all 1,374 clinics" escape link present
 *   5. Page contains the 3 newest claimed clinics (insight, bay, diamond)
 */
const SITE = 'https://www.thedripmap.com';

function tick(ok) { return ok ? '✓' : '✗'; }

(async () => {
  console.log('=== 1. Wait for deploy ===');
  let html = '';
  let deployed = false;
  for (let i = 0; i < 12; i++) {
    const r = await fetch(SITE + '/search?bust=' + Date.now(), { cache: 'no-store' });
    html = await r.text();
    if (html.includes('Safety Verified IV Therapy Clinics')) {
      console.log('  ✓ deploy live (t+' + (i*20) + 's)');
      deployed = true;
      break;
    }
    console.log('  [t+' + (i*20) + 's] /search still showing old H2, waiting...');
    if (i < 11) await new Promise(res => setTimeout(res, 20000));
  }
  if (!deployed) {
    console.log('  ✗ deploy did not show new H2 within 240s');
    return;
  }

  console.log();
  console.log('=== 2. Default view rendering ===');
  console.log('  ' + tick(html.includes('Safety Verified IV Therapy Clinics')) + ' Safety Verified H2');
  // SSR fetches all and the client filters; SSR shows all 1374 initially in the prerendered HTML.
  // The TOGGLE only happens on hydration. We can verify the toggles are PRESENT in the HTML though.
  console.log('  ' + tick(html.includes('Newest claim first')) + ' "Newest claim first" toggle');
  console.log('  ' + tick(html.includes('Browse all') && html.includes('clinics</button>')) + ' "Browse all X clinics" escape link');
  console.log('  ' + tick(html.includes('Recent additions')) + ' Recent additions strip headline');
  console.log('  ' + tick(html.includes('most recently verified clinics')) + ' Recent additions subhead');
  console.log('  ' + tick(html.includes('>NEW<')) + ' NEW badge on top card');

  console.log();
  console.log('=== 3. 3 newest claimed clinics visible ===');
  // Check the recent additions strip includes the 3 newest by claimed_at:
  // insight-naturopathic-clinic-toronto (2026-06-03)
  // bay-wellness-centre-vancouver (2026-06-01)
  // diamond-aesthetics-brampton (2026-06-01)
  // The order between bay and diamond is undefined (same date), so check both.
  console.log('  ' + tick(/insight[- ]naturopathic/i.test(html)) + ' Insight Naturopathic referenced');
  console.log('  ' + tick(/bay[- ]wellness/i.test(html)) + ' Bay Wellness referenced');
  console.log('  ' + tick(/diamond[- ]aesthetics/i.test(html)) + ' Diamond Aesthetics referenced');

  console.log();
  console.log('=== 4. Older 4 claimed clinics also in roster ===');
  console.log('  ' + tick(/refresh[- ]med[- ]spa/i.test(html)) + ' Refresh Med Spa LA');
  console.log('  ' + tick(/signature[- ]beauty[- ]lounge[- ]downtown/i.test(html)) + ' Signature Downtown Toronto');
  console.log('  ' + tick(/signature[- ]beauty[- ]lounge[- ]richmond/i.test(html)) + ' Signature Richmond Hill');
  console.log('  ' + tick(/blue[- ]cypress/i.test(html)) + ' Blue Cypress');

  console.log();
  console.log('=== 5. City-selected URL preserves search (server SSR side) ===');
  // /search?city=Toronto should still load 200
  const r2 = await fetch(SITE + '/search?city=Toronto&bust=' + Date.now(), { cache: 'no-store' });
  console.log('  ' + tick(r2.status === 200) + ' /search?city=Toronto → HTTP ' + r2.status);

  const r3 = await fetch(SITE + '/search?city=Vancouver&bust=' + Date.now(), { cache: 'no-store' });
  console.log('  ' + tick(r3.status === 200) + ' /search?city=Vancouver → HTTP ' + r3.status);

  console.log();
  console.log('=== Smoke test complete ===');
})();
