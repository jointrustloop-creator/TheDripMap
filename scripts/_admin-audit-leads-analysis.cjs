// Read-only admin audit: leads/inquiries breakdown, spam/test detection,
// E2E debris hunt. NO writes.
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TEST_PATTERNS = /e2e|test|example\.com|atheria|collaborative wellness|vega vitality|smoke/i;

(async () => {
  // 1. inquiries breakdown
  const all = [];
  let from = 0;
  while (true) {
    const { data, error } = await sb.from('inquiries')
      .select('id, name, email, phone, message, listing_id, created_at')
      .order('created_at', { ascending: true })
      .range(from, from + 999);
    if (error) { console.error('inquiries err', error.message); break; }
    all.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  console.log('TOTAL inquiries rows:', all.length);

  const bySource = {};
  for (const r of all) {
    const msg = r.message || '';
    let src = 'contact';
    if (msg.startsWith('[Lead for ')) src = 'message-clinic';
    else if (msg.startsWith('[SEO Audit')) src = 'seo-audit';
    else if (/get found kit|brand.?voice/i.test(msg)) src = 'kit/brand';
    else if (/subscribe/i.test(msg.slice(0, 40))) src = 'subscribe';
    bySource[src] = (bySource[src] || 0) + 1;
  }
  console.log('by source:', JSON.stringify(bySource));

  // spam/test heuristics
  const flagged = { testPattern: [], noEmail: [], dupEmail: {}, gibberish: [], links: [] };
  const emailCount = {};
  for (const r of all) {
    const blob = `${r.name} ${r.email} ${r.message}`;
    if (TEST_PATTERNS.test(blob)) flagged.testPattern.push(r);
    if (!r.email) flagged.noEmail.push(r);
    if (r.email) emailCount[r.email.toLowerCase()] = (emailCount[r.email.toLowerCase()] || 0) + 1;
    if (/(http|www\.)/i.test(r.message || '') && !(r.message || '').startsWith('[')) flagged.links.push(r);
    if (/^[a-z]{12,}$/i.test((r.name || '').replace(/\s/g, '')) && (r.name || '').length > 14) flagged.gibberish.push(r);
  }
  const dupes = Object.entries(emailCount).filter(([, c]) => c >= 5).sort((a, b) => b[1] - a[1]);
  console.log('\ntest-pattern matches:', flagged.testPattern.length);
  flagged.testPattern.slice(0, 25).forEach(r => console.log('  ', r.created_at?.slice(0, 10), r.name, '|', r.email, '|', (r.message || '').slice(0, 70)));
  console.log('rows with no email:', flagged.noEmail.length);
  console.log('emails appearing 5+ times:', dupes.slice(0, 10).map(([e, c]) => `${e}(${c})`).join(', '));
  console.log('messages containing links (non-tagged):', flagged.links.length);
  flagged.links.slice(0, 10).forEach(r => console.log('  LINK:', r.created_at?.slice(0, 10), r.email, '|', (r.message || '').slice(0, 80)));

  // date distribution
  const byMonth = {};
  for (const r of all) { const m = (r.created_at || '').slice(0, 7); byMonth[m] = (byMonth[m] || 0) + 1; }
  console.log('\nby month:', JSON.stringify(byMonth));

  // 2. E2E debris across tables
  console.log('\n=== E2E/TEST DEBRIS HUNT ===');
  for (const probe of ['%e2e%', '%E2E Test Owner%', '%atheria%', '%collaborative wellness%', '%vega vitality%']) {
    const { data: cr } = await sb.from('claim_requests').select('id, email, owner_name, status, created_at, listing_id').or(`email.ilike.${probe},owner_name.ilike.${probe}`);
    (cr || []).forEach(r => console.log(`claim_requests [${probe}]:`, r.id, r.owner_name, r.email, r.status, r.created_at?.slice(0, 10)));
  }
  for (const probe of ['%atheria%', '%collaborative wellness%', '%vega vitality%', '%e2e%', '%smoke test%']) {
    const { data: pr } = await sb.from('providers').select('id, name, slug, is_claimed, is_hidden, created_at').ilike('name', probe);
    (pr || []).forEach(r => console.log(`providers [${probe}]:`, r.slug, 'claimed=' + r.is_claimed, 'hidden=' + r.is_hidden, r.created_at?.slice(0, 10)));
  }
  const { data: tst } = await sb.from('testimonials').select('id, author_name, author_email, status, created_at').or('author_email.ilike.%e2e%,author_email.ilike.%test%,author_name.ilike.%test%');
  (tst || []).forEach(r => console.log('testimonials:', r.id, r.author_name, r.author_email, r.status));
  const { data: ld } = await sb.from('leads').select('*').limit(5);
  console.log('\nleads table sample (exists?):', ld ? ld.length + ' rows sampled' : 'no');

  // listing_events monthly views for context
  const { count: views30 } = await sb.from('listing_events').select('id', { count: 'exact', head: true }).eq('event_type', 'view').gte('created_at', new Date(Date.now() - 30 * 864e5).toISOString());
  console.log('listing views last 30d:', views30);
})();
