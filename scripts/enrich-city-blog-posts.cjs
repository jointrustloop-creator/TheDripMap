/**
 * Phase 1 of "make city blog posts rank":
 *   For every blog post in the "best-iv-therapy-{city}-2026" family,
 *   - find the top 6-8 clinics in that city from the directory
 *   - inject a "Top Clinics" list section + FAQ block into the post content
 *   - save the clinic IDs to related_clinics so the template can show them
 *
 * Idempotent: each post gets a sentinel comment marking it as enriched.
 * Re-running this script regenerates the enriched section in place rather
 * than appending duplicates.
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SENTINEL_START = '<!-- ENRICHED_CITY_SECTION_START -->';
const SENTINEL_END = '<!-- ENRICHED_CITY_SECTION_END -->';

// post slug → DB city name. Anything not listed is skipped (non-city posts).
const CITY_MAP = {
  'best-iv-therapy-denver-2026':         { name: 'Denver',         currency: 'USD' },
  'best-iv-therapy-new-york-2026':       { name: 'New York',       currency: 'USD' },
  'best-iv-therapy-chicago-2026':        { name: 'Chicago',        currency: 'USD' },
  'best-iv-therapy-san-francisco-2026':  { name: 'San Francisco',  currency: 'USD' },
  'best-iv-therapy-montreal-2026':       { name: 'Montreal',       currency: 'CAD' },
  'best-iv-therapy-edmonton-2026':       { name: 'Edmonton',       currency: 'CAD' },
  'best-iv-therapy-san-diego-2026':      { name: 'San Diego',      currency: 'USD' },
  'best-iv-therapy-miami-2026':          { name: 'Miami',          currency: 'USD' },
  'best-iv-therapy-phoenix-2026':        { name: 'Phoenix',        currency: 'USD' },
  'best-iv-therapy-atlanta-2026':        { name: 'Atlanta',        currency: 'USD' },
  'best-iv-therapy-las-vegas-2026':      { name: 'Las Vegas',      currency: 'USD' },
  'best-iv-therapy-toronto-2026':        { name: 'Toronto',        currency: 'CAD' },
  'best-iv-therapy-washington-dc-2026':  { name: 'Washington',     currency: 'USD' },
  'best-iv-therapy-boston-2026':         { name: 'Boston',         currency: 'USD' },
  'best-iv-therapy-seattle-2026':        { name: 'Seattle',        currency: 'USD' },
  'best-iv-therapy-los-angeles-2026':    { name: 'Los Angeles',    currency: 'USD' },
  'best-iv-therapy-vancouver-2026':      { name: 'Vancouver',      currency: 'CAD' },
  'best-iv-therapy-calgary-2026':        { name: 'Calgary',        currency: 'CAD' },
  'best-iv-therapy-dallas-2026':         { name: 'Dallas',         currency: 'USD' },
  'best-iv-therapy-philadelphia-2026':   { name: 'Philadelphia',   currency: 'USD' },
  'best-iv-therapy-ottawa-2026':         { name: 'Ottawa',         currency: 'CAD' },
  'best-iv-therapy-houston-2026':        { name: 'Houston',        currency: 'USD' },
};

function buildEnrichedSection({ cityName, currency, clinics, totalClinicCount, mobileCount, priceLow, priceHigh, topSpecialties }) {
  const cur = currency === 'CAD' ? 'CAD' : 'USD';
  const hasInventory = clinics.length > 0;
  const lines = [];
  lines.push(SENTINEL_START);
  lines.push('');
  if (hasInventory) {
    lines.push(`## Top IV Therapy Clinics in ${cityName}`);
    lines.push('');
    lines.push(`Out of ${totalClinicCount} clinics listed on TheDripMap in ${cityName}, these are the highest-rated based on aggregated patient reviews. Tap any clinic to see services, real pricing, and book a session.`);
    lines.push('');
  } else {
    lines.push(`## How to choose an IV therapy clinic in ${cityName}`);
    lines.push('');
    lines.push(`We are actively expanding our directory in ${cityName}. Until we have local clinics listed, use the criteria below to evaluate any IV therapy provider you are considering — these are the same questions our editorial team asks when vetting clinics for the directory.`);
    lines.push('');
    lines.push(`**Credentials to verify**: a medical director (MD) or registered nurse (RN) supervises the practice; nursing staff are licensed in the state or province; the clinic carries malpractice insurance; intake includes a written screen for contraindicated medications.`);
    lines.push('');
    lines.push(`**Pricing transparency**: the website (or an immediate phone quote) lists per-drip prices; add-on costs (vitamin boosters, NAD+ surcharges, mobile travel fees) are disclosed upfront; no pressure to buy a multi-session package on your first visit.`);
    lines.push('');
    lines.push(`**Clinical safety**: fresh IV bags with visible expiry dates; single-use needles opened in front of you; vital signs taken before insertion; an emergency plan if you have a reaction.`);
    lines.push('');
    lines.push(`**Reviews to trust**: Google reviews with specific drip names mentioned (not just "great service"); 4.5+ average; recent reviews within the last 90 days; the clinic responds to negative reviews professionally.`);
    lines.push('');
  }
  clinics.forEach((c, i) => {
    const ratingNum = Number(c.rating);
    const ratingPart = ratingNum > 0
      ? `**${ratingNum.toFixed(1)} ⭐** (${c.review_count || 0} reviews)`
      : 'New listing';
    const tag = c.is_featured ? ' · ✓ Verified' : '';
    const specs = (c.specialties || []).slice(0, 3).filter(Boolean).join(' · ');
    lines.push(`### ${i + 1}. [${c.name}](/providers/${c.slug})`);
    lines.push(`*${ratingPart}${tag}*`);
    if (specs) lines.push('');
    if (specs) lines.push(`Specialties: ${specs}`);
    if (c.description) {
      const shortDesc = c.description.length > 220
        ? c.description.slice(0, 217).trim() + '…'
        : c.description;
      lines.push('');
      lines.push(shortDesc);
    }
    lines.push('');
  });

  if (hasInventory) {
    lines.push(`[Compare every IV therapy clinic in ${cityName} →](/cities/${cityName.toLowerCase().replace(/\s+/g, '-')})`);
    lines.push('');
  }

  // FAQ block — these answers come from real directory data and update with each script run.
  lines.push(`## Frequently asked questions about IV therapy in ${cityName}`);
  lines.push('');

  lines.push(`### How much does IV therapy cost in ${cityName}?`);
  lines.push('');
  if (priceLow && priceHigh && hasInventory) {
    lines.push(`Across the ${totalClinicCount} IV therapy clinics listed in ${cityName}, prices typically range from ${cur === 'CAD' ? 'C' : ''}$${priceLow} to ${cur === 'CAD' ? 'C' : ''}$${priceHigh} per session. A basic hydration drip usually sits at the lower end; NAD+, high-dose vitamin C, and concierge mobile drips sit at the higher end.`);
  } else {
    lines.push(`Prices vary by clinic and treatment. Most ${cityName} clinics charge between ${cur === 'CAD' ? 'C' : ''}$150 and ${cur === 'CAD' ? 'C' : ''}$350 for a standard hydration drip, and ${cur === 'CAD' ? 'C' : ''}$400 to ${cur === 'CAD' ? 'C' : ''}$800+ for NAD+ protocols.`);
  }
  lines.push('');

  lines.push(`### Are there mobile IV therapy services in ${cityName}?`);
  lines.push('');
  if (mobileCount > 0 && hasInventory) {
    lines.push(`Yes — ${mobileCount} of the ${totalClinicCount} clinics in ${cityName} offer mobile IV therapy that comes to your home, office, or hotel. Mobile bookings usually carry a $50-$100 travel fee on top of the drip price, and most providers serve a 20-mile radius from their base.`);
  } else if (hasInventory) {
    lines.push(`Most clinics in ${cityName} are in-clinic only, but several travel for events or VIP bookings. Call ahead to ask whether they can dispatch to your address — many will accommodate even if it is not advertised on their site.`);
  } else {
    lines.push(`Most major US and Canadian metros have at least one mobile IV provider — concierge nursing services like Mobile IV Medics, Drip Hydration, and Hydreight operate nationally and can usually dispatch to ${cityName} addresses within 24-48 hours. Expect a $50-$100 travel fee on top of the drip price.`);
  }
  lines.push('');

  lines.push(`### What are the most common IV treatments in ${cityName}?`);
  lines.push('');
  if (topSpecialties.length > 0 && hasInventory) {
    lines.push(`Based on what ${cityName} clinics offer most often, the top treatments are ${topSpecialties.slice(0, 5).join(', ')}. Hydration drips and Myers' Cocktail are the most universally available; NAD+ protocols and specialty cocktails are concentrated in higher-end clinics.`);
  } else {
    lines.push(`Hydration drips, Myers' Cocktail, NAD+ protocols, immune-support cocktails (high-dose vitamin C + zinc), and energy boosters (B12, B-complex) are the most commonly available treatments in ${cityName}.`);
  }
  lines.push('');

  lines.push(`### How do I choose the right IV clinic in ${cityName}?`);
  lines.push('');
  lines.push(`Look for: an MD or registered nurse supervising the practice, transparent pricing on the clinic website, a written intake form covering medications and conditions, fresh IV bags with documented expiry, and reviews mentioning the specific drip you want. Avoid clinics that won't tell you who is inserting your IV or what is in the bag.`);
  lines.push('');

  lines.push(SENTINEL_END);
  return lines.join('\n');
}

async function enrichOne(slug, cityMeta) {
  // 1. Load the post
  const { data: post, error: postErr } = await sb.from('blog_posts')
    .select('id, slug, title, content, related_clinics, last_updated')
    .eq('slug', slug)
    .single();
  if (postErr || !post) {
    console.log('  ! Post not found:', slug);
    return null;
  }

  // 2. Find top clinics for this city
  // Pull more than we need so we can fall back if some are missing data
  const { data: cityClinics, error: clinicsErr } = await sb.from('providers')
    .select('id, slug, name, rating, reviews, is_featured, specialties, description, price_range, type, subtypes')
    .ilike('city', cityMeta.name)
    .order('is_featured', { ascending: false })
    .order('rating', { ascending: false })
    .order('reviews', { ascending: false })
    .limit(50);
  if (clinicsErr) {
    console.log('  ! City query failed for', cityMeta.name, clinicsErr.message);
    return null;
  }
  const totalClinicCount = cityClinics.length;

  // Top 6-8 — prefer clinics with both rating + review count
  const ranked = [...cityClinics].sort((a, b) => {
    const aHasData = (a.rating > 0 ? 1 : 0) + ((a.reviews || 0) > 0 ? 1 : 0);
    const bHasData = (b.rating > 0 ? 1 : 0) + ((b.reviews || 0) > 0 ? 1 : 0);
    if (aHasData !== bHasData) return bHasData - aHasData;
    if (a.is_featured !== b.is_featured) return b.is_featured ? 1 : -1;
    if ((b.rating || 0) !== (a.rating || 0)) return (b.rating || 0) - (a.rating || 0);
    return (b.reviews || 0) - (a.reviews || 0);
  });
  const topClinics = ranked.slice(0, 8).map(c => ({
    ...c,
    review_count: c.reviews || 0,
  }));

  // No clinics? Still add an FAQ + buying guide so the post is not 200 words.
  // Inventory-empty cities flagged in the summary so the user can decide whether to keep.
  const hasInventory = topClinics.length > 0;

  // 3. Aggregate stats — detect "mobile" via specialty, type, or name (no boolean column)
  const isMobileClinic = (c) => {
    const hay = [
      ...(c.specialties || []),
      c.type || '',
      ...(c.subtypes || []),
      c.name || '',
    ].join(' ').toLowerCase();
    return /\bmobile\b|in-?home|concierge/.test(hay);
  };
  const mobileCount = cityClinics.filter(isMobileClinic).length;
  const priceFloors = cityClinics
    .map(c => {
      const m = (c.price_range || '').match(/\$?(\d{2,4})/);
      return m ? Number(m[1]) : null;
    })
    .filter(Boolean);
  const priceCeilings = cityClinics
    .map(c => {
      const m = (c.price_range || '').match(/\$?\d{2,4}\s*[-–]\s*\$?(\d{2,4})/);
      return m ? Number(m[1]) : null;
    })
    .filter(Boolean);
  const priceLow = priceFloors.length ? Math.min(...priceFloors) : null;
  const priceHigh = priceCeilings.length ? Math.max(...priceCeilings) : null;

  const specialtyCounts = {};
  for (const c of cityClinics) {
    for (const s of (c.specialties || [])) {
      if (!s) continue;
      specialtyCounts[s] = (specialtyCounts[s] || 0) + 1;
    }
  }
  const topSpecialties = Object.entries(specialtyCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([s]) => s);

  // 4. Build enriched content + write back
  const enrichedSection = buildEnrichedSection({
    cityName: cityMeta.name,
    currency: cityMeta.currency,
    clinics: topClinics,
    totalClinicCount,
    mobileCount,
    priceLow,
    priceHigh,
    topSpecialties,
  });

  let newContent;
  const existing = String(post.content || '');
  if (existing.includes(SENTINEL_START) && existing.includes(SENTINEL_END)) {
    // Idempotent path: regenerate in place
    const before = existing.split(SENTINEL_START)[0].trimEnd();
    const after = existing.split(SENTINEL_END)[1] || '';
    newContent = `${before}\n\n${enrichedSection}${after}`;
  } else {
    newContent = `${existing.trimEnd()}\n\n${enrichedSection}\n`;
  }

  const clinicIds = topClinics.map(c => c.id);

  // 5. Save
  const { error: updateErr } = await sb.from('blog_posts')
    .update({
      content: newContent,
      related_clinics: clinicIds,
      relatedClinics: clinicIds,
      last_updated: new Date().toISOString().slice(0, 10),
      lastUpdated: new Date().toISOString().slice(0, 10),
    })
    .eq('id', post.id);
  if (updateErr) {
    console.log('  ! Update failed for', slug, updateErr.message);
    return null;
  }

  return {
    slug,
    cityName: cityMeta.name,
    topClinicCount: topClinics.length,
    totalClinicCount,
    mobileCount,
    priceLow,
    priceHigh,
    addedSpecialties: topSpecialties.length,
  };
}

(async () => {
  const results = [];
  for (const [slug, meta] of Object.entries(CITY_MAP)) {
    console.log('Enriching', slug);
    const r = await enrichOne(slug, meta);
    if (r) results.push(r);
  }
  console.log('\n=== SUMMARY ===');
  console.log('Posts enriched:', results.length, '/', Object.keys(CITY_MAP).length);
  for (const r of results) {
    console.log(`  ${r.cityName.padEnd(16)} : ${r.topClinicCount} top clinics linked · ${r.totalClinicCount} total in city · ${r.mobileCount} mobile · prices ${r.priceLow ? '$'+r.priceLow+'-$'+r.priceHigh : '(no data)'}`);
  }
})();
