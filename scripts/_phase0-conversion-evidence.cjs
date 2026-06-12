// Phase 0 research: read-only. Correlate listing content attributes with
// listing_events action rates (clicks per view). No writes.
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const CLICKS = ['book_click', 'call_click', 'website_click', 'directions_click', 'message_click'];

(async () => {
  // 1. Pull all events (paginated)
  const events = [];
  let from = 0;
  while (true) {
    const { data, error } = await sb.from('listing_events')
      .select('provider_id, event_type')
      .range(from, from + 999);
    if (error) { console.error('events err', error); return; }
    events.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  console.log('total events:', events.length);

  const byProv = new Map();
  for (const e of events) {
    if (!byProv.has(e.provider_id)) byProv.set(e.provider_id, { view: 0, clicks: 0, types: {} });
    const r = byProv.get(e.provider_id);
    if (e.event_type === 'view') r.view++;
    else if (CLICKS.includes(e.event_type)) { r.clicks++; r.types[e.event_type] = (r.types[e.event_type] || 0) + 1; }
  }
  console.log('providers with any events:', byProv.size);

  // 2. Fetch provider rows for all providers with >=5 views (meaningful sample)
  const ids = [...byProv.entries()].filter(([, v]) => v.view >= 5).map(([k]) => k);
  console.log('providers with >=5 views:', ids.length);

  const provRows = [];
  for (let i = 0; i < ids.length; i += 100) {
    const { data, error } = await sb.from('providers').select('*').in('id', ids.slice(i, i + 100));
    if (error) { console.error('prov err', error); return; }
    provRows.push(...data);
  }

  // attribute extraction
  function attrs(p) {
    const desc = p.description || '';
    const services = p.services;
    let svcCount = 0, svcWithPrice = 0;
    try {
      const arr = typeof services === 'string' ? JSON.parse(services) : services;
      if (Array.isArray(arr)) {
        svcCount = arr.length;
        svcWithPrice = arr.filter(s => JSON.stringify(s).match(/\$|price|cost/i)).length;
      }
    } catch {}
    const blob = JSON.stringify(p);
    return {
      descLen: desc.length,
      hasLongDesc: desc.length >= 300,
      svcCount,
      hasSvcPricing: svcWithPrice > 0 || /\$\d{2,}/.test(desc),
      hasPhotos: !!(p.photos && JSON.stringify(p.photos).length > 10) || !!p.image_url || !!p.photo_url,
      hasLogo: !!(p.logo_url || p.logo),
      claimed: !!p.is_claimed,
      featured: !!p.is_featured,
      safetyVerified: !!p.safety_verified,
      namedPractitioner: /\b(Dr\.|RN|NP|ND|nurse|naturopath\w*|MD)\b/.test(desc),
      hasFaq: /faq/i.test(blob) && !!(p.faq || p.faqs),
      rating: p.rating || p.google_rating || null,
      reviews: p.review_count || p.user_ratings_total || null,
    };
  }

  const rows = provRows.map(p => {
    const ev = byProv.get(p.id);
    return { name: p.name, slug: p.slug, city: p.city, ...attrs(p), views: ev.view, clicks: ev.clicks, types: ev.types, rate: ev.view ? ev.clicks / ev.view : 0 };
  }).sort((a, b) => b.clicks - a.clicks);

  console.log('\n=== TOP 20 BY CLICKS ===');
  for (const r of rows.slice(0, 20)) {
    console.log(`${r.clicks}c/${r.views}v rate=${r.rate.toFixed(2)} | ${r.name} (${r.city}) | claimed=${r.claimed} feat=${r.featured} desc=${r.descLen} svc=${r.svcCount} pricing=${r.hasSvcPricing} photos=${r.hasPhotos} logo=${r.hasLogo} pract=${r.namedPractitioner} safety=${r.safetyVerified} | ${JSON.stringify(r.types)}`);
  }

  console.log('\n=== BOTTOM 20 (>=5 views, fewest clicks) ===');
  for (const r of rows.slice().sort((a, b) => a.rate - b.rate).slice(0, 20)) {
    console.log(`${r.clicks}c/${r.views}v rate=${r.rate.toFixed(2)} | ${r.name} (${r.city}) | claimed=${r.claimed} desc=${r.descLen} svc=${r.svcCount} pricing=${r.hasSvcPricing} photos=${r.hasPhotos} pract=${r.namedPractitioner}`);
  }

  // 3. cohort comparison: attribute -> mean action rate
  function cohort(label, pred) {
    const g = rows.filter(pred);
    if (!g.length) return console.log(`${label}: n=0`);
    const v = g.reduce((s, r) => s + r.views, 0), c = g.reduce((s, r) => s + r.clicks, 0);
    console.log(`${label}: n=${g.length} views=${v} clicks=${c} pooledRate=${(c / v).toFixed(3)}`);
  }
  console.log('\n=== COHORTS (pooled clicks/views) ===');
  cohort('claimed=true        ', r => r.claimed);
  cohort('claimed=false       ', r => !r.claimed);
  cohort('featured=true       ', r => r.featured);
  cohort('longDesc>=300       ', r => r.hasLongDesc);
  cohort('shortDesc<300       ', r => !r.hasLongDesc);
  cohort('hasSvcPricing       ', r => r.hasSvcPricing);
  cohort('noSvcPricing        ', r => !r.hasSvcPricing);
  cohort('svcCount>=3         ', r => r.svcCount >= 3);
  cohort('svcCount=0          ', r => r.svcCount === 0);
  cohort('hasPhotos           ', r => r.hasPhotos);
  cohort('noPhotos            ', r => !r.hasPhotos);
  cohort('namedPractitioner   ', r => r.namedPractitioner);
  cohort('noNamedPractitioner ', r => !r.namedPractitioner);
  cohort('safetyVerified      ', r => r.safetyVerified);

  // 4. event type mix overall
  const mix = {};
  for (const e of events) mix[e.event_type] = (mix[e.event_type] || 0) + 1;
  console.log('\n=== EVENT MIX ===', mix);

  // 5. dump a claimed listing's services shape for field mapping
  const bay = provRows.find(p => p.slug === 'bay-wellness-centre-vancouver');
  if (bay) {
    console.log('\n=== BAY WELLNESS FIELD SHAPES ===');
    for (const k of ['description', 'services', 'photos', 'faq', 'faqs', 'pricing', 'team', 'practitioners', 'safety_verified', 'amenities', 'tags']) {
      if (k in bay) console.log(k, '=>', JSON.stringify(bay[k])?.slice(0, 300));
    }
    console.log('all columns:', Object.keys(bay).sort().join(', '));
  }
})();
