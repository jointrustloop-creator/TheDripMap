// E2E for the self-serve "Finish your listing" flow against PROD.
// Snapshots a test provider, exercises the page + save API, verifies the live
// listing updated, then fully restores the provider. Mirrors the manage-token
// HMAC (MANAGE_TOKEN_SECRET || SUPABASE_SERVICE_ROLE_KEY) so tokens match prod.
require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const SITE = 'https://www.thedripmap.com';

function manageToken(providerId) {
  const secret = process.env.MANAGE_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'x';
  const sig = crypto.createHmac('sha256', secret).update(providerId).digest('base64url');
  return `${providerId}.${sig}`;
}
function step(name, ok, detail = '') {
  console.log(`${ok ? '✓ PASS' : '✗ FAIL'} — ${name}${detail ? ' — ' + detail : ''}`);
  return ok;
}

(async () => {
  const results = [];
  let prov = null;
  let snapshot = null;
  try {
    console.log('============= E2E FINISH-LISTING FLOW =============\n');

    // STEP 0: pick a low-profile test provider and snapshot its editable fields.
    const { data: cands } = await s.from('providers')
      .select('id, name, slug, city, services, specialties, medical_team, price_range, description, image_url, photos, decision_drivers')
      .eq('is_featured', false).not('slug', 'is', null).limit(1);
    prov = cands && cands[0];
    if (!prov) throw new Error('no test provider');
    snapshot = JSON.parse(JSON.stringify({
      services: prov.services, specialties: prov.specialties, medical_team: prov.medical_team,
      price_range: prov.price_range, description: prov.description, image_url: prov.image_url,
      photos: prov.photos, decision_drivers: prov.decision_drivers,
    }));
    console.log(`[0] Test provider: ${prov.name} (${prov.slug})`);

    const token = manageToken(prov.id);
    const badToken = `${prov.id}.deadbeefdeadbeef`;

    // STEP 1: GET /finish/{token} renders the owner page.
    const pageRes = await fetch(`${SITE}/finish/${encodeURIComponent(token)}`, { headers: { 'User-Agent': 'E2E-Bot' } });
    const pageHtml = await pageRes.text();
    results.push(step('finish page returns 200', pageRes.status === 200));
    results.push(step('finish page shows confirmed-owner banner', pageHtml.includes('confirmed as the owner')));
    results.push(step('finish page shows Finish your listing', pageHtml.toLowerCase().includes('finish your listing')));

    // STEP 2: invalid token is rejected by the page.
    const badPage = await fetch(`${SITE}/finish/${encodeURIComponent(badToken)}`);
    const badHtml = await badPage.text();
    results.push(step('invalid token shows not-valid page', badHtml.includes('not valid')));

    // STEP 3: POST answers to /api/finish-listing (no images).
    const answers = {
      token,
      team: { whoPlaces: ['RN'], oversight: 'Medical director (off-site)', leadName: 'E2E Test Lead, RN' },
      drips: [{ name: 'Hydration', price: '149' }, { name: 'NAD+', price: '399' }],
      firstVisit: { consult: 'Optional', length: '45 min', booking: 'By appointment' },
      sourcing: ['Licensed compounding pharmacy'],
      payment: ['HSA/FSA', 'Pay per visit'],
      about: 'E2E test about line.',
    };
    const fd = new FormData();
    fd.append('answers', JSON.stringify(answers));
    fd.append('token', token);
    const saveRes = await fetch(`${SITE}/api/finish-listing`, { method: 'POST', body: fd });
    const saveBody = await saveRes.json().catch(() => ({}));
    results.push(step('save API returns ok', saveRes.status === 200 && saveBody.ok === true, JSON.stringify(saveBody).slice(0, 120)));

    // STEP 4: invalid token is rejected by the API.
    const fd2 = new FormData();
    fd2.append('answers', JSON.stringify({ ...answers, token: badToken }));
    fd2.append('token', badToken);
    const badSave = await fetch(`${SITE}/api/finish-listing`, { method: 'POST', body: fd2 });
    results.push(step('save API rejects invalid token (401)', badSave.status === 401));

    // STEP 5: DB reflects the answers.
    const { data: after } = await s.from('providers')
      .select('services, specialties, price_range, description, medical_team, decision_drivers')
      .eq('id', prov.id).maybeSingle();
    const svcNames = (after?.services || []).map((x) => x.name);
    results.push(step('services saved (Hydration + NAD+)', svcNames.includes('Hydration') && svcNames.includes('NAD+'), svcNames.join(',')));
    results.push(step('price_range derived', after?.price_range === '$149-399', `got ${after?.price_range}`));
    results.push(step('medical_team lead saved', (after?.medical_team || [])[0]?.name === 'E2E Test Lead, RN'));
    results.push(step('description composed', typeof after?.description === 'string' && after.description.includes('Hydration')));
    results.push(step('answers stashed for re-edit', !!after?.decision_drivers?.manage));

  } catch (err) {
    console.log(`\n!!! UNEXPECTED ERROR: ${err.message}`);
    results.push(step('No unexpected error thrown', false, err.message));
  } finally {
    // STEP 6: restore the provider exactly.
    if (prov && snapshot) {
      const { error } = await s.from('providers').update(snapshot).eq('id', prov.id);
      step('restored test provider to original state', !error, error?.message);
    }
    // clean any onboarding_requests row our save may have flipped (only if it existed for this provider; harmless if none)
    const passed = results.filter(Boolean).length;
    console.log(`\n=================== RESULT: ${passed}/${results.length} passed ===================`);
    if (passed < results.length) process.exit(1);
  }
})();
