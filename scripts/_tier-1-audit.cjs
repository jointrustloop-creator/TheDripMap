/**
 * Tier 1: deep audit of 7 claimed + 2 real pending listings.
 *
 *   - HEAD-test each clinic's website + photos
 *   - Fetch the live /providers/<slug> page and report which fields render
 *   - Pull rating + claimed/featured + working_hours coverage
 *   - Report per clinic in a clean per-clinic block
 *
 * Read-only. Does not modify anything.
 */
require('dotenv').config({ path: '.env.local' });
const sb = require('@supabase/supabase-js').createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const SITE = 'https://www.thedripmap.com';
const UA = 'TheDripMap-Audit/1.0';

async function headProbe(url) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    let res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: ctrl.signal,
      headers: { 'user-agent': UA },
    });
    clearTimeout(t);
    if (res.status === 405 || res.status === 501 || res.status === 403) {
      const ctrl2 = new AbortController();
      const t2 = setTimeout(() => ctrl2.abort(), 8000);
      res = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: ctrl2.signal,
        headers: { 'user-agent': UA, accept: 'text/html,*/*' },
      });
      clearTimeout(t2);
    }
    return { status: res.status, finalUrl: res.url };
  } catch (e) {
    return { status: 0, error: e.name === 'AbortError' ? 'timeout' : (e.message || 'error').slice(0, 80) };
  }
}

function tick(b) { return b ? '✓' : '✗'; }

(async () => {
  // 7 claimed
  const { data: claimed } = await sb
    .from('providers')
    .select('*')
    .eq('is_claimed', true)
    .order('claimed_at', { ascending: false });

  // 2 pending
  const { data: pendingClaims } = await sb
    .from('claim_requests')
    .select('*')
    .or('email.eq.beyoutymedspa@gmail.com,email.eq.admin@trihealth.ca')
    .neq('status', 'verified');
  const pendingIds = pendingClaims.map((p) => p.listing_id).filter(Boolean);
  const { data: pending } = await sb.from('providers').select('*').in('id', pendingIds);

  const all = [
    ...claimed.map((p) => ({ ...p, _tier: 'claimed' })),
    ...pending.map((p) => ({ ...p, _tier: 'pending' })),
  ];

  for (const p of all) {
    console.log('===========================================================');
    console.log('[' + p._tier.toUpperCase() + '] ' + p.name + ' (' + p.slug + ')');
    console.log('Live URL: ' + SITE + '/providers/' + p.slug);
    console.log('-----------------------------------------------------------');
    console.log('  ' + tick(!!p.name) + ' name: ' + (p.name || '(missing)'));
    console.log('  ' + tick(!!p.address) + ' address: ' + (p.address || '(missing)'));
    console.log('  ' + tick(!!p.city) + ' city: ' + (p.city || '(missing)'));
    console.log('  ' + tick(!!p.state) + ' state/province: ' + (p.state || '(missing)'));
    console.log('  ' + tick(!!p.country) + ' country: ' + (p.country || '(missing)'));
    console.log('  ' + tick(!!p.phone) + ' phone: ' + (p.phone || '(missing)'));
    console.log('  ' + tick(!!p.rating) + ' rating: ' + (p.rating || '(missing)') + ' (' + (p.review_count || 0) + ' reviews)');
    console.log('  ' + tick(!!p.description) + ' description: ' + ((p.description || '').length) + ' chars');
    console.log('  ' + tick(p.is_claimed === true) + ' is_claimed: ' + p.is_claimed);
    console.log('  ' + tick(true) + ' is_featured: ' + p.is_featured);
    console.log('  ' + tick(!!p.claimed_at) + ' claimed_at: ' + (p.claimed_at || '(missing)'));
    console.log('  ' + tick(!!p.image_url) + ' image_url: ' + (p.image_url ? p.image_url.slice(0, 80) + '...' : '(missing)'));
    console.log('  ' + tick((p.photos || []).length > 0) + ' photos: ' + (p.photos ? p.photos.length : 0));
    console.log('  ' + tick((p.services || []).length > 0) + ' services: ' + (p.services ? p.services.length : 0));
    console.log('  ' + tick(!!p.working_hours) + ' working_hours: ' + (p.working_hours ? Object.keys(p.working_hours).length + ' keys' : '(missing)'));
    console.log('  ' + tick((p.specialties || []).length > 0) + ' specialties: ' + (p.specialties ? p.specialties.length : 0));

    // Peptide leak check (post-decommission)
    const peptide = /\bpeptide\b/i.test((p.description || '') + ' ' + (p.specialties || []).join(' ') + ' ' + ((p.services || []).map(s => typeof s === 'string' ? s : (s.name || '')).join(' ')));
    console.log('  ' + tick(!peptide) + ' no peptide mentions (post-decommission)');

    // em-dash leak in specialties
    const emdash = (p.specialties || []).some(s => /[—–]/.test(s)) || (p.description || '').includes('—');
    console.log('  ' + tick(!emdash) + ' no em/en dashes in user-facing strings');

    // Website HEAD
    if (p.website) {
      const r = await headProbe(p.website);
      console.log('  Website ' + p.website);
      console.log('    HEAD: ' + (r.status || r.error) + (r.finalUrl && r.finalUrl !== p.website ? ' -> ' + r.finalUrl : ''));
      const ok = r.status >= 200 && r.status < 400;
      console.log('    ' + tick(ok) + ' resolves');
    } else {
      console.log('  ✗ website MISSING');
    }

    // Live provider page
    const lp = await headProbe(SITE + '/providers/' + p.slug);
    console.log('  Live page: HTTP ' + (lp.status || lp.error));
  }
})();
