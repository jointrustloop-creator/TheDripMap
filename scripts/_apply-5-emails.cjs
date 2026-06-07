/**
 * Apply 5 emails surfaced by the agent's email-finder pass (2026-06-07).
 *
 * Updates ONLY the email and email_quality fields. Skips Ageless Elegance
 * (no email findable, Instagram/WhatsApp route only).
 *
 * Receipt for reversibility. Idempotent.
 */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const sb = require('@supabase/supabase-js').createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const UPDATES = [
  { slug: 'erin-mills-optimum-health-mississauga',          email: 'erinmillshealth@bellnet.ca',   email_quality: 'medium' /* Bell.net legacy ISP, not branded */ },
  { slug: 'kaizen-medspa-mississauga',                       email: 'info@kaizenhealthgroup.com',   email_quality: 'high'   /* parent-org branded domain */ },
  { slug: 'integrative-naturopathic-medical-centre-vancouver', email: 'reception@integrative.ca',   email_quality: 'high'   /* branded reception inbox */ },
  { slug: 'qi-integrated-health-vancouver',                  email: 'info@qiintegratedhealth.com',  email_quality: 'high'   /* branded info@ */ },
  { slug: 'everyoung-medical-aesthetics-burnaby',            email: 'info@everyoungmed.com',        email_quality: 'high'   /* branded info@, covers all 4 EverYoung locations */ },
];

(async () => {
  const receipt = {
    phase: 'apply-5-emails-from-email-finder',
    timestamp: new Date().toISOString(),
    updated: [],
    skipped: [],
    errors: [],
  };

  for (const u of UPDATES) {
    const { data: before } = await sb.from('providers').select('id, slug, email, email_quality').eq('slug', u.slug).maybeSingle();
    if (!before) {
      console.log('? ' + u.slug + ' NOT FOUND, skipping');
      receipt.skipped.push({ slug: u.slug, reason: 'not_found' });
      continue;
    }
    if (before.email) {
      console.log('= ' + u.slug + ' already has email (' + before.email + '), skipping');
      receipt.skipped.push({ slug: u.slug, reason: 'already_had_email', email: before.email });
      continue;
    }
    const { error } = await sb.from('providers').update({ email: u.email, email_quality: u.email_quality }).eq('id', before.id);
    if (error) {
      console.log('! ' + u.slug + ' update failed: ' + error.message);
      receipt.errors.push({ slug: u.slug, error: error.message });
      continue;
    }
    receipt.updated.push({ slug: u.slug, email: u.email, email_quality: u.email_quality });
    console.log('✓ ' + u.slug.padEnd(55) + ' ' + u.email);
  }

  // New pool count
  const { count: caElig } = await sb.from('providers').select('id', { count: 'exact', head: true }).eq('country','Canada').eq('is_featured', false).neq('outreach_sent', true).neq('email_bounced', true).in('email_quality', ['high','medium']).not('email','is',null).neq('email','');
  console.log();
  console.log('Updated: ' + receipt.updated.length);
  console.log('Skipped: ' + receipt.skipped.length);
  console.log('Canada eligible outreach pool now: ' + caElig);

  fs.mkdirSync('scripts/_receipts', { recursive: true });
  const outPath = path.join('scripts/_receipts', 'apply-5-emails-' + Date.now() + '.json');
  fs.writeFileSync(outPath, JSON.stringify(receipt, null, 2));
  console.log('Receipt:', outPath);
})();
