// For each onboarding_requests row still pending_send, ensure the provider has
// a manage_token and output the data needed to compose a finish-link draft.
// Writes manage_token where missing (so locally-built links validate on prod).
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const SITE = 'https://www.thedripmap.com';

async function ensureToken(providerId) {
  const { data } = await sb.from('providers').select('decision_drivers').eq('id', providerId).maybeSingle();
  const dd = (data && data.decision_drivers && typeof data.decision_drivers === 'object') ? data.decision_drivers : {};
  if (dd.manage_token) return dd.manage_token;
  const secret = crypto.randomBytes(24).toString('base64url');
  await sb.from('providers').update({ decision_drivers: { ...dd, manage_token: secret } }).eq('id', providerId);
  return secret;
}

(async () => {
  const { data: rows, error } = await sb.from('onboarding_requests')
    .select('provider_id, owner_email, owner_name, status').eq('status', 'pending_send');
  if (error) { console.error('ABORT', error.message); process.exit(1); }
  const out = [];
  for (const r of rows) {
    const { data: p } = await sb.from('providers').select('id, name, slug, city').eq('id', r.provider_id).maybeSingle();
    if (!p) continue;
    const secret = await ensureToken(p.id);
    out.push({
      owner_email: r.owner_email, owner_name: r.owner_name || '',
      name: p.name, city: p.city || '', slug: p.slug,
      finishUrl: `${SITE}/finish/${p.id}.${secret}`,
    });
  }
  console.log(JSON.stringify(out, null, 1));
})();
