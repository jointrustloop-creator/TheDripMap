/**
 * Enrich Insight Naturopathic + Tri-Health Wellness Centre from verified
 * public website data (WebFetch by operator, captured below) + Nominatim
 * geocoding. Idempotent: only fills fields that are currently empty / null /
 * stock-image, and merges decision_drivers rather than overwriting.
 *
 * Also uploads the local logos under .tmp-logos to Supabase Storage and
 * points image_url + imageUrl at the public URL, replacing the stock
 * unsplash photo.
 *
 * Run: node scripts/_enrich-insight-trihealth.cjs
 *
 * Logos must already exist at:
 *   .tmp-logos/insight-naturopathic-clinic-toronto.png
 *   .tmp-logos/tri-health-wellness-centre-vaughan.png
 */
require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const NOW_ISO = new Date().toISOString();
const BUCKET = 'blog-images';

// Stock-image marker so we treat unsplash placeholders as "empty".
const STOCK_MARKERS = ['images.unsplash.com', 'picsum.photos'];
function isStockOrEmpty(v) {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string' && v.trim() === '') return true;
  if (typeof v === 'string' && STOCK_MARKERS.some((m) => v.includes(m))) return true;
  if (Array.isArray(v) && v.length === 0) return true;
  if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) return true;
  return false;
}

const REGULATOR_CONO = 'College of Naturopaths of Ontario (CONO)';

// ─── Verified payloads (captured from each clinic's own website) ────────

const INSIGHT = {
  slug: 'insight-naturopathic-clinic-toronto',
  logoLocal: path.join(__dirname, '..', '.tmp-logos', 'insight-naturopathic-clinic-toronto.png'),
  logoStorageKey: 'insight-naturopathic-clinic-toronto-logo.png',
  logoContentType: 'image/png',
  // Hours not published on the public site or JaneApp landing — intentionally
  // omitted; the owner email will ask for these.
  payload: {
    latitude: 43.7104,
    longitude: -79.3618,
    online_booking_url: 'https://insightnaturopathic.janeapp.com',
    regulator_override: REGULATOR_CONO,
    description:
      "Integrative naturopathic clinic in Leaside, mid-town Toronto offering naturopathic medicine, IV vitamin therapy, acupuncture, osteopathy, massage therapy, infrared sauna, and specialized testing. Team led by Dr. Jill Shainhouse, ND alongside a multi-ND practitioner roster.",
    // Public services list from insightnaturopathic.com home page.
    // Specialties stays as-is unless empty; services is currently null.
    services: [
      'Naturopathic Medicine',
      'IV Vitamin Therapy',
      'Acupuncture',
      'Massage Therapy',
      'Osteopathy',
      'Infrared Sauna Therapy',
      'Specialized Testing & Blood Work',
      'Hormone Balancing',
      'Nutritional Counselling',
      'Cancer Support',
      'Digestive Health',
      "Women's Health & Hormonal Support",
      'Fertility Support',
      'Stress and Burnout Management',
      "Men's Health",
      'Kids and Teen Health',
      'Weight / Metabolic Balance / Thyroid Health',
    ],
  },
};

const TRIHEALTH = {
  slug: 'tri-health-wellness-centre-vaughan',
  logoLocal: path.join(__dirname, '..', '.tmp-logos', 'tri-health-wellness-centre-vaughan.png'),
  logoStorageKey: 'tri-health-wellness-centre-vaughan-logo.png',
  logoContentType: 'image/png',
  // Hours captured from trihealth.ca/contact (verified by WebFetch).
  payload: {
    working_hours: {
      monday: '9:00 AM to 8:00 PM',
      tuesday: '9:00 AM to 8:00 PM',
      wednesday: '9:00 AM to 8:00 PM',
      thursday: '9:00 AM to 8:00 PM',
      friday: '9:00 AM to 8:00 PM',
      saturday: '9:00 AM to 5:00 PM',
      sunday: 'Closed',
    },
    // online_booking_url is already populated. regulator_override already set.
    // Expand services from public homepage list.
    services: [
      'Naturopathic Medicine',
      'IV Vitamin Infusions',
      'Vitamin / IM Injections',
      'Chiropractic',
      'Massage Therapy',
      'Acupuncture',
      'Bioidentical Hormone Replacement Therapy',
      'Lab Testing',
      'Live Blood Cell Analysis',
      'InBody Composition Analysis',
      'Medical Thermography',
      'Hyperbaric Oxygen Therapy',
      'Laser Therapy',
      'Shockwave Therapy',
      'Cryotherapy',
      'Red Light Therapy',
      'Infrared Sauna & Steam Shower',
      'Personal Training',
      'Psychotherapy',
    ],
  },
};

// ─── Logo upload ────────────────────────────────────────────────────────

async function uploadLogo(localPath, storageKey, contentType) {
  if (!fs.existsSync(localPath)) {
    console.log('  · logo missing locally: ' + localPath + ' (skipping upload)');
    return null;
  }
  const buf = fs.readFileSync(localPath);
  console.log(`  ↑ uploading ${buf.length} bytes → ${BUCKET}/${storageKey}`);
  const { error: upErr } = await sb.storage.from(BUCKET).upload(storageKey, buf, {
    contentType, upsert: true,
  });
  if (upErr) {
    console.error('  ✗ upload failed: ' + upErr.message);
    return null;
  }
  const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(storageKey);
  console.log('  ✓ public URL: ' + pub.publicUrl);
  return pub.publicUrl;
}

// ─── Per-clinic enrichment ──────────────────────────────────────────────

async function enrichOne(item) {
  console.log('=== ' + item.slug + ' ===');

  const { data: row, error: selErr } = await sb
    .from('providers')
    .select('*')
    .eq('slug', item.slug)
    .maybeSingle();
  if (selErr || !row) {
    console.error('  ✗ row select failed: ' + (selErr?.message || 'not found'));
    return { slug: item.slug, status: 'not_found' };
  }

  // 1) Upload logo + set image_url/imageUrl if missing OR stock.
  const update = {};
  const enrichedFields = [];

  if (isStockOrEmpty(row.image_url) || isStockOrEmpty(row.imageUrl)) {
    const publicUrl = await uploadLogo(item.logoLocal, item.logoStorageKey, item.logoContentType);
    if (publicUrl) {
      if (isStockOrEmpty(row.image_url)) { update.image_url = publicUrl; enrichedFields.push('image_url'); }
      if (isStockOrEmpty(row.imageUrl)) { update.imageUrl = publicUrl; enrichedFields.push('imageUrl'); }
    }
  } else {
    console.log('  · image_url already populated with non-stock URL, skipping logo');
  }

  // 2) Idempotent field fills.
  for (const [k, v] of Object.entries(item.payload)) {
    const existing = row[k];
    // Special handling for description: ours is a clearly auto-generated
    // boilerplate string starting with "{name} is a {city}, {state} provider
    // offering". Replace it.
    if (k === 'description' && typeof existing === 'string') {
      const looksAuto = /is a [A-Za-z .,]+ provider offering/i.test(existing);
      if (looksAuto) {
        update.description = v;
        enrichedFields.push('description');
        continue;
      }
    }
    if (isStockOrEmpty(existing)) {
      update[k] = v;
      enrichedFields.push(k);
    }
  }

  if (Object.keys(update).length === 0) {
    console.log('  · already up to date — no fields changed');
    return { slug: item.slug, status: 'noop', changed: [] };
  }

  // 3) Merge decision_drivers (preserve source/organic_claim etc).
  const prior = (row.decision_drivers && typeof row.decision_drivers === 'object') ? row.decision_drivers : {};
  update.decision_drivers = {
    ...prior,
    source: prior.source || 'public_enrichment',
    enrichment_source: 'public_enrichment',
    enriched_at: NOW_ISO,
    enriched_fields: Array.from(new Set([
      ...(Array.isArray(prior.enriched_fields) ? prior.enriched_fields : []),
      ...enrichedFields,
    ])),
  };

  const { error: upErr } = await sb.from('providers').update(update).eq('id', row.id);
  if (upErr) {
    console.error('  ✗ UPDATE failed: ' + upErr.message);
    return { slug: item.slug, status: 'update_failed', error: upErr.message };
  }
  console.log('  ✓ filled: ' + enrichedFields.join(', '));
  return { slug: item.slug, status: 'updated', changed: enrichedFields };
}

(async () => {
  const r1 = await enrichOne(INSIGHT);
  console.log('');
  const r2 = await enrichOne(TRIHEALTH);

  console.log('\n=== POST-ENRICHMENT VERIFICATION ===');
  for (const slug of [INSIGHT.slug, TRIHEALTH.slug]) {
    const { data } = await sb.from('providers')
      .select('name, image_url, imageUrl, working_hours, specialties, services, phone, address, latitude, longitude, online_booking_url, regulator_override, description, decision_drivers')
      .eq('slug', slug).maybeSingle();
    if (!data) continue;
    console.log('\n--- ' + data.name + ' ---');
    console.log('  image_url:        ' + (data.image_url || '(null)').slice(0, 80));
    console.log('  imageUrl:         ' + (data.imageUrl || '(null)').slice(0, 80));
    console.log('  latitude,lng:     ' + data.latitude + ', ' + data.longitude);
    console.log('  online_booking:   ' + (data.online_booking_url || '(null)'));
    console.log('  regulator_override: ' + (data.regulator_override || '(null)'));
    console.log('  working_hours:    ' + (data.working_hours ? Object.keys(data.working_hours).length + ' days' : '(null)'));
    console.log('  services:         ' + (Array.isArray(data.services) ? data.services.length + ' items' : '(null)'));
    console.log('  specialties:      ' + (Array.isArray(data.specialties) ? data.specialties.length + ' items' : '(null)'));
    console.log('  description:      ' + (data.description ? data.description.slice(0, 100) + '...' : '(null)'));
    console.log('  decision_drivers: ' + JSON.stringify(data.decision_drivers));
  }
})();
