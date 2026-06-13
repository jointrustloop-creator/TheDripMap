// Pull 20 never-contacted outreach candidates (Canada first), excluding
// suppressions, bounced, junk emails, and anyone already in the claim funnel.
// Grouped by shared email. READ ONLY.
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i;
function junk(e) {
  if (!e || !EMAIL_RE.test(e)) return true;
  const s = e.toLowerCase();
  return /\.(gif|png|jpe?g|svg|webp)$/.test(s) || /(loading|fancybox|sprite|placeholder|@2x|example\.com|noreply|no-reply|sentry|wixpress|stagheaddesigns)/.test(s);
}
function score(p) { return (Number(p.rating) || 0) * Math.log10((Number(p.reviews) || 0) + 1); }

(async () => {
  const suppressed = new Set();
  try { const { data } = await sb.from('outreach_suppressions').select('email'); (data || []).forEach((r) => r.email && suppressed.add(r.email.toLowerCase())); } catch {}
  const inFunnel = new Set();
  try { const { data } = await sb.from('claim_requests').select('email'); (data || []).forEach((r) => r.email && inFunnel.add(r.email.toLowerCase())); } catch {}
  console.log('suppressions:', suppressed.size, '| claim-funnel emails:', inFunnel.size);

  async function pull(country) {
    const { data, error } = await sb.from('providers')
      .select('id, name, slug, city, state, country, email, website, rating, reviews, is_claimed, is_hidden, email_bounced, outreach_sent_at')
      .eq('country', country).is('outreach_sent_at', null).eq('is_claimed', false)
      .not('email', 'is', null).limit(400);
    if (error) { console.error('ABORT', country, error.message); process.exit(1); }
    return (data || []).filter((p) =>
      !p.is_hidden && p.email_bounced !== true && !junk(p.email) &&
      !suppressed.has(p.email.toLowerCase()) && !inFunnel.has(p.email.toLowerCase())
    );
  }

  const ca = (await pull('Canada')).sort((a, b) => score(b) - score(a));
  const us = (await pull('United States')).sort((a, b) => score(b) - score(a));
  console.log('clean CA:', ca.length, '| clean US:', us.length);

  const byEmail = new Map();
  for (const p of [...ca, ...us]) { const k = p.email.trim().toLowerCase(); if (!byEmail.has(k)) byEmail.set(k, []); byEmail.get(k).push(p); }
  const groups = [...byEmail.entries()].slice(0, 24).map(([email, ps]) => ({
    email, anchorId: ps[0].id, name: ps[0].name, slug: ps[0].slug, city: ps[0].city,
    state: ps[0].state, country: ps[0].country, website: ps[0].website,
    rating: ps[0].rating, reviews: ps[0].reviews, allIds: ps.map((x) => x.id), locations: ps.length,
  }));
  console.log(`\n=== EVENING 20 (Canada first, by score) ===`);
  console.log(JSON.stringify(groups));
})();
