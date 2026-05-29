#!/usr/bin/env node
// One-off: seed online_booking_url on the 4 claimed providers.
//
// Researched 2026-05-29 by visiting each clinic's public site.
// - blue-cypress-iv-and-wellness-georgetown   -> JaneApp tenant link found in site HTML
// - refresh-med-spa-la-los-angeles            -> /request-appointment/ on their own site
// - signature-beauty-lounge-downtown-toronto  -> Eva confirmed JaneApp; tenant subdomain
//   not publicly discoverable (contact page 403's bots). Fall back to her
//   contact-page Book-Now anchor — a real browser hits the inline JaneApp widget.
// - signature-beauty-lounge-richmond-hill     -> same as above (shared site).
//
// Run: node scripts/seed-claimed-booking-urls.cjs

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const BOOKING_URLS = {
  'blue-cypress-iv-and-wellness-georgetown': 'https://bluecypressky.janeapp.com/',
  'refresh-med-spa-la-los-angeles': 'https://refreshmedspala.com/request-appointment/',
  'signature-beauty-lounge-downtown-toronto': 'https://signaturebeautylounge.ca/contact-us/#for-all-book-now-btn',
  'signature-beauty-lounge-richmond-hill': 'https://signaturebeautylounge.ca/contact-us/#for-all-book-now-btn',
};

(async () => {
  const sb = createClient(SUPABASE_URL, SERVICE_KEY);
  for (const [slug, url] of Object.entries(BOOKING_URLS)) {
    const { data, error } = await sb
      .from('providers')
      .update({ online_booking_url: url })
      .eq('slug', slug)
      .select('slug, name, online_booking_url, phone');
    if (error) {
      console.error('FAIL', slug, error.message);
      continue;
    }
    if (!data?.length) {
      console.warn('NO ROW', slug);
      continue;
    }
    console.log('OK', data[0].slug, '->', data[0].online_booking_url, '| phone:', data[0].phone);
  }
  console.log('Done.');
})();
