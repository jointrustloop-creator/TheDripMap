// Verify the offers ON/OFF + /deals hub end-to-end against PROD, then clean up.
require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const SITE = 'https://www.thedripmap.com';
const SLUG = 'blue-cypress-iv-and-wellness-georgetown'; // claimed clinic (banner only renders on claimed layout)
const TITLE = 'VERIFY 30 dollars off any drip';

function step(n, ok, d = '') { console.log(`${ok ? 'PASS' : 'FAIL'} - ${n}${d ? ' - ' + d : ''}`); return ok; }
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// Fetch twice with a settle gap so ISR stale-while-revalidate serves fresh.
async function fetchFresh(url) { await fetch(url); await wait(1500); return (await fetch(url)).text(); }

(async () => {
  const results = [];
  let provId, snapshot;
  try {
    const { data: p } = await s.from('providers').select('id, decision_drivers, special_offers').eq('slug', SLUG).maybeSingle();
    provId = p.id;
    snapshot = { decision_drivers: p.decision_drivers, special_offers: p.special_offers };
    // ensure manage token
    const dd = (p.decision_drivers && typeof p.decision_drivers === 'object') ? p.decision_drivers : {};
    let secret = dd.manage_token;
    if (!secret) { secret = crypto.randomBytes(24).toString('base64url'); await s.from('providers').update({ decision_drivers: { ...dd, manage_token: secret } }).eq('id', provId); }
    const token = `${provId}.${secret}`;

    // seed an offer (active true) directly, then toggle ON via API to trigger revalidation
    await s.from('providers').update({ special_offers: [{ title: TITLE, description: '', code: 'V30', expires: '2099-12-31', active: true }] }).eq('id', provId);
    let r = await fetch(`${SITE}/api/offer-toggle`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, active: true }) });
    results.push(step('toggle ON returns ok', r.status === 200));
    await wait(1500);

    let deals = await fetchFresh(`${SITE}/deals`);
    results.push(step('offer appears on /deals when ON', deals.includes(TITLE)));
    let listing = await fetchFresh(`${SITE}/providers/${SLUG}`);
    results.push(step('offer banner on listing when ON', listing.includes('Limited-time offer') && listing.includes(TITLE)));

    // toggle OFF via API
    r = await fetch(`${SITE}/api/offer-toggle`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, active: false }) });
    results.push(step('toggle OFF returns ok', r.status === 200));
    await wait(1500);
    deals = await fetchFresh(`${SITE}/deals`);
    results.push(step('offer GONE from /deals when OFF', !deals.includes(TITLE)));

    // bad token rejected
    const bad = await fetch(`${SITE}/api/offer-toggle`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: `${provId}.bad`, active: true }) });
    results.push(step('toggle rejects bad token (401)', bad.status === 401));
  } catch (e) {
    results.push(step('no unexpected error', false, e.message));
  } finally {
    if (provId && snapshot) { await s.from('providers').update(snapshot).eq('id', provId); console.log('restored test provider'); }
    const passed = results.filter(Boolean).length;
    console.log(`\nRESULT: ${passed}/${results.length}`);
    if (passed < results.length) process.exit(1);
  }
})();
