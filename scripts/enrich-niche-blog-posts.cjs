/**
 * Generic enricher for "Tier B" niche posts: neighborhood pages,
 * treatment-by-city posts, and mobile-by-city posts that currently have
 * no related_clinics and no body content beyond the intro.
 *
 * For each niche post we:
 *   1. Pull a tailored slice of providers from the directory
 *   2. Inject a "Top {treatment/topic} clinics in {location}" markdown
 *      section + a 4-question FAQ block
 *   3. Save the top clinic IDs to related_clinics so the ItemList
 *      JSON-LD schema picks them up
 *
 * Same idempotent sentinel pattern as enrich-city-blog-posts.cjs but
 * uses a distinct sentinel pair so it doesn't collide.
 */
require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const NICHE_START = '<!-- ENRICHED_NICHE_SECTION_START -->';
const NICHE_END = '<!-- ENRICHED_NICHE_SECTION_END -->';

// Niche post configs.
//   kind: 'geo' (neighborhood/sub-city), 'treatment' (treatment-by-city),
//         'mobile' (mobile-by-city), 'metro' (broad metro/cluster)
const NICHE_POSTS = {
  // ── Geographic niches ──
  'iv-therapy-manhattan': {
    kind: 'geo', location: 'Manhattan', city: 'New York', currency: 'USD',
    cityFilters: ['New York'], note: 'For directory purposes we treat New York City clinics as Manhattan-serving; many also deliver mobile across Brooklyn, Queens, and the boroughs.',
  },
  'iv-therapy-upper-east-side': {
    kind: 'geo', location: 'the Upper East Side', city: 'New York', currency: 'USD',
    cityFilters: ['New York'], note: 'Upper East Side clinics span Yorkville, Lenox Hill, and the broader 60th-to-96th-Street corridor; several Midtown providers also serve UES via short cab rides or mobile delivery.',
  },
  'iv-therapy-brooklyn': {
    kind: 'geo', location: 'Brooklyn', city: 'Brooklyn / New York', currency: 'USD',
    cityFilters: ['Brooklyn', 'New York'], note: 'Most NYC mobile IV providers deliver into Brooklyn from Manhattan within 30-60 minutes; a smaller number maintain Brooklyn-based storefronts.',
  },
  'iv-therapy-yorkville-toronto': {
    kind: 'geo', location: 'Yorkville', city: 'Toronto', currency: 'CAD',
    cityFilters: ['Toronto'], note: 'Yorkville is Toronto\'s luxury concierge IV corridor; most clinics listed below operate in or deliver to Yorkville, Rosedale, and Forest Hill.',
  },
  'iv-therapy-north-york': {
    kind: 'geo', location: 'North York', city: 'Toronto', currency: 'CAD',
    cityFilters: ['Toronto', 'North York'], note: 'North York clinics serve the affluent Bayview/Yonge corridor plus the Asian wellness market in Sheppard, Finch, and beyond toward Markham and Richmond Hill.',
  },
  'iv-therapy-mississauga': {
    kind: 'geo', location: 'Mississauga', city: 'Mississauga', currency: 'CAD',
    cityFilters: ['Mississauga'], note: 'Mississauga has its own clinic cluster centered around Square One, Port Credit, and Streetsville; several Toronto-based mobile providers also deliver here.',
  },
  'iv-therapy-oakville': {
    kind: 'geo', location: 'Oakville', city: 'Oakville', currency: 'CAD',
    cityFilters: ['Oakville'], note: 'Oakville\'s IV clinic scene serves the affluent Bronte/Glen Abbey/Lakeshore corridor; many providers also accept bookings from Burlington and west Mississauga.',
  },
  'iv-therapy-greater-toronto-area': {
    kind: 'metro', location: 'the Greater Toronto Area', city: 'Toronto', currency: 'CAD',
    cityFilters: ['Toronto', 'Mississauga', 'Oakville', 'Brampton', 'Markham', 'Richmond Hill', 'Vaughan', 'North York', 'Scarborough', 'Etobicoke', 'Burlington'],
    note: 'The GTA spans roughly 7,000 km² and 6+ million people; this list pulls the highest-rated IV clinics from across the metro, organized by rating and reviews rather than neighbourhood.',
  },

  // ── City Guides without related_clinics ──
  'iv-therapy-toronto-complete-guide': {
    kind: 'metro', location: 'Toronto', city: 'Toronto', currency: 'CAD',
    cityFilters: ['Toronto'], note: 'These clinics represent the highest-rated wellness IV operators in the city of Toronto proper, drawn from our editorial directory.',
  },
  'hangover-iv-therapy-toronto': {
    kind: 'treatment', location: 'Toronto', city: 'Toronto', currency: 'CAD',
    cityFilters: ['Toronto'], treatment: 'hangover and recovery IV therapy',
    note: 'Most Toronto IV clinics offer some version of a "morning after" or recovery drip combining saline, B-complex, anti-nausea, and anti-inflammatory medications.',
  },
  'mobile-iv-therapy-toronto-gta': {
    kind: 'mobile', location: 'the Toronto / GTA area', city: 'Toronto', currency: 'CAD',
    cityFilters: ['Toronto', 'Mississauga', 'Oakville', 'Brampton', 'Markham', 'Richmond Hill', 'Vaughan', 'North York', 'Scarborough', 'Etobicoke'],
    mobileOnly: true,
    note: 'Mobile providers below serve the 416 + 905 area codes with at-home, in-office, and hotel-room IV delivery.',
  },

  // ── Treatment-by-city ──
  'myers-cocktail-nyc': {
    kind: 'treatment', location: 'NYC', city: 'New York', currency: 'USD',
    cityFilters: ['New York'], treatment: "Myers' Cocktail",
    note: 'Myers\' Cocktail (B-complex, magnesium, calcium, vitamin C) is one of the most universally offered IV protocols; nearly every NYC clinic below offers it as a standard menu item.',
  },
  'myers-cocktail-toronto': {
    kind: 'treatment', location: 'Toronto', city: 'Toronto', currency: 'CAD',
    cityFilters: ['Toronto'], treatment: "Myers' Cocktail",
    note: 'Toronto\'s Myers\' Cocktail offerings range from naturopath-administered ND-led clinics to RN-staffed med spa drip bars; pricing varies accordingly.',
  },
  'hangover-iv-therapy-nyc': {
    kind: 'treatment', location: 'NYC', city: 'New York', currency: 'USD',
    cityFilters: ['New York'], treatment: 'hangover IV therapy',
    note: 'NYC hangover drips are typically a saline + B-complex + Zofran (anti-nausea) + Toradol (anti-inflammatory) combo, delivered in-clinic or to hotel rooms across Manhattan.',
  },
  'nad-plus-therapy-nyc': {
    kind: 'treatment', location: 'NYC', city: 'New York', currency: 'USD',
    cityFilters: ['New York'], treatment: 'NAD+ IV therapy',
    note: 'NAD+ infusions in NYC typically run 250-1000mg per session over 2-4 hours; not every clinic below offers NAD+ specifically — call to confirm before booking.',
  },
  'iv-drip-nyc': {
    kind: 'geo', location: 'NYC', city: 'New York', currency: 'USD',
    cityFilters: ['New York'], note: 'The clinics below represent the highest-rated IV drip providers in New York City, spanning hydration, recovery, NAD+, and beauty protocols.',
  },
  'glutathione-iv-therapy-toronto': {
    kind: 'treatment', location: 'Toronto', city: 'Toronto', currency: 'CAD',
    cityFilters: ['Toronto'], treatment: 'glutathione IV therapy',
    note: 'Glutathione is most often delivered as a 1-2g IV push alongside a vitamin C or Myers\' base; call clinics directly to confirm their glutathione protocols and pricing.',
  },
  'mobile-iv-therapy-nyc': {
    kind: 'mobile', location: 'New York City', city: 'New York', currency: 'USD',
    cityFilters: ['New York'], mobileOnly: true,
    note: 'Mobile providers below deliver IV therapy to apartments, hotels, and offices across Manhattan, with most also serving Brooklyn and Queens for an additional travel fee.',
  },
};

const isMobileClinic = (c) => {
  const hay = [
    ...(c.specialties || []),
    c.type || '',
    ...(c.subtypes || []),
    c.name || '',
  ].join(' ').toLowerCase();
  return /\bmobile\b|in-?home|concierge/.test(hay);
};

function initialsOf(name) {
  return name.split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || 'IV';
}

async function fetchClinics(cfg) {
  // Pull all providers matching any of the cityFilters
  let query = sb.from('providers').select('id, slug, name, rating, reviews, is_featured, specialties, description, price_range, type, subtypes, address')
    .order('is_featured', { ascending: false })
    .order('rating', { ascending: false })
    .order('reviews', { ascending: false })
    .limit(100);
  if (cfg.cityFilters && cfg.cityFilters.length > 0) {
    // Use OR with ILIKE for multi-city queries
    const orFilter = cfg.cityFilters.map(c => `city.ilike.${c}`).join(',');
    query = query.or(orFilter);
  }
  const { data, error } = await query;
  if (error) throw error;

  let pool = data || [];
  if (cfg.mobileOnly) pool = pool.filter(isMobileClinic);

  // Rank: prefer clinics with both rating + reviews
  pool.sort((a, b) => {
    const aHas = (Number(a.rating) > 0 ? 1 : 0) + ((a.reviews || 0) > 0 ? 1 : 0);
    const bHas = (Number(b.rating) > 0 ? 1 : 0) + ((b.reviews || 0) > 0 ? 1 : 0);
    if (aHas !== bHas) return bHas - aHas;
    if (a.is_featured !== b.is_featured) return b.is_featured ? 1 : -1;
    if ((Number(b.rating) || 0) !== (Number(a.rating) || 0)) return (Number(b.rating) || 0) - (Number(a.rating) || 0);
    return (b.reviews || 0) - (a.reviews || 0);
  });

  return { topClinics: pool.slice(0, 8), totalCount: pool.length };
}

function buildClinicList({ cfg, clinics, totalCount }) {
  const lines = [];
  const heading = cfg.kind === 'treatment'
    ? `## Top clinics offering ${cfg.treatment} in ${cfg.location}`
    : cfg.kind === 'mobile'
    ? `## Top mobile IV therapy providers in ${cfg.location}`
    : `## Top IV therapy clinics in ${cfg.location}`;
  lines.push(heading);
  lines.push('');
  lines.push(cfg.note || `The following clinics in ${cfg.location} are the highest-rated based on aggregated patient reviews. Tap any clinic to see services, pricing, and contact details.`);
  lines.push('');
  clinics.forEach((c, i) => {
    const ratingNum = Number(c.rating);
    const ratingPart = ratingNum > 0
      ? `**${ratingNum.toFixed(1)} ⭐** (${c.reviews || 0} reviews)`
      : 'New listing';
    const tag = c.is_featured ? ' · ✓ Verified' : '';
    const specs = (c.specialties || []).slice(0, 3).filter(Boolean).join(' · ');
    lines.push(`### ${i + 1}. [${c.name}](/providers/${c.slug})`);
    lines.push(`*${ratingPart}${tag}${c.address ? ' · ' + c.address.split(',').slice(0, 2).join(',').trim() : ''}*`);
    if (specs) {
      lines.push('');
      lines.push(`Specialties: ${specs}`);
    }
    if (c.description) {
      const shortDesc = c.description.length > 200 ? c.description.slice(0, 197).trim() + '…' : c.description;
      lines.push('');
      lines.push(shortDesc);
    }
    lines.push('');
  });
  return lines.join('\n');
}

function buildFaq(cfg) {
  const lines = [];
  const cur = cfg.currency === 'CAD' ? 'C' : '';
  if (cfg.kind === 'treatment') {
    lines.push(`## Frequently asked questions about ${cfg.treatment} in ${cfg.location}`);
    lines.push('');
    lines.push(`### How much does ${cfg.treatment} cost in ${cfg.location}?`);
    lines.push('');
    lines.push(`Pricing varies by clinic and dose. In ${cfg.location}, expect roughly ${cur}$200 to ${cur}$400 for most ${cfg.treatment} sessions at established clinics, with higher-end concierge or extended-dose protocols running ${cur}$500+. Always call the specific clinic for current rates before booking.`);
    lines.push('');
    lines.push(`### Who can administer ${cfg.treatment} in ${cfg.location}?`);
    lines.push('');
    lines.push(`In the United States and Canada, IV therapy must be administered by a licensed registered nurse (RN), naturopathic doctor (ND, in Ontario and several US states), physician assistant (PA), nurse practitioner (NP), or physician (MD). Avoid any clinic where unlicensed assistants are performing the insert.`);
    lines.push('');
    lines.push(`### Is ${cfg.treatment} available as a mobile or in-home service in ${cfg.location}?`);
    lines.push('');
    lines.push(`Yes — most major ${cfg.location} markets have mobile IV providers that deliver to homes, offices, and hotel rooms. Mobile bookings typically add ${cur}$50-${cur}$150 in travel fees on top of the drip price.`);
    lines.push('');
    lines.push(`### How do I choose the right clinic for ${cfg.treatment} in ${cfg.location}?`);
    lines.push('');
    lines.push(`Look for: a licensed medical director, RN credentials on the inserter, a written intake screening medications and conditions, transparent per-session pricing, and reviews mentioning the specific treatment you want. Avoid clinics that pressure first-time visitors into multi-session packages.`);
    lines.push('');
  } else if (cfg.kind === 'mobile') {
    lines.push(`## Frequently asked questions about mobile IV therapy in ${cfg.location}`);
    lines.push('');
    lines.push(`### How does mobile IV therapy work in ${cfg.location}?`);
    lines.push('');
    lines.push(`A licensed RN comes to your home, hotel room, or office with all required equipment and supplies. After a brief intake (medications, allergies, vitals), they insert the IV and stay through the infusion — typically 30-60 minutes for hydration drips, longer for NAD+ or other extended protocols.`);
    lines.push('');
    lines.push(`### How much does mobile IV cost in ${cfg.location}?`);
    lines.push('');
    lines.push(`Most ${cfg.location} mobile providers charge ${cur}$200-${cur}$400 for the drip itself plus a ${cur}$50-${cur}$150 travel fee. Group bookings (3+ people at one location) often reduce the per-person cost; some providers waive travel fees for groups.`);
    lines.push('');
    lines.push(`### How fast can a mobile IV provider arrive in ${cfg.location}?`);
    lines.push('');
    lines.push(`Most established ${cfg.location} mobile services quote a 60-90 minute response time within their core service area, with same-day priority arrival (under 60 min) available for an additional fee. Confirm response time in writing before you book.`);
    lines.push('');
    lines.push(`### Is mobile IV safe?`);
    lines.push('');
    lines.push(`When performed by a licensed RN under physician oversight, mobile IV therapy is as safe as in-clinic. Risks are minimal but include vein irritation, vasovagal reactions, and rare allergic responses. Always confirm the provider carries malpractice insurance that covers in-home work specifically — not every policy does.`);
    lines.push('');
  } else {
    // geo / metro
    lines.push(`## Frequently asked questions about IV therapy in ${cfg.location}`);
    lines.push('');
    lines.push(`### How many IV therapy clinics are in ${cfg.location}?`);
    lines.push('');
    lines.push(`Our directory currently tracks several active IV therapy providers in ${cfg.location}, including in-clinic, med spa, and mobile-delivery operators. The list above shows the highest-rated based on aggregated reviews; the full directory has more options when you filter by treatment, neighbourhood, or service type.`);
    lines.push('');
    lines.push(`### What does IV therapy cost in ${cfg.location}?`);
    lines.push('');
    lines.push(`Expect roughly ${cur}$150-${cur}$300 for a basic hydration drip, ${cur}$200-${cur}$375 for a Myers' Cocktail, and ${cur}$400-${cur}$900+ for NAD+ infusions depending on dose. Mobile delivery typically adds ${cur}$50-${cur}$150 in travel fees. Prices vary; confirm with the specific clinic before booking.`);
    lines.push('');
    lines.push(`### Are there mobile IV services in ${cfg.location}?`);
    lines.push('');
    lines.push(`Yes — multiple providers offer mobile IV delivery to homes, offices, and hotel rooms in ${cfg.location}. Travel fees and response times vary; the directory lists which clinics offer mobile service.`);
    lines.push('');
    lines.push(`### How do I choose an IV clinic in ${cfg.location}?`);
    lines.push('');
    lines.push(`Look for: a licensed medical director, an RN or ND performing the IV insert (never an unlicensed assistant), a written intake form covering medications and conditions, transparent pricing posted online or by phone, and reviews mentioning the specific drip you want. Skip clinics that push multi-session packages before any consultation.`);
    lines.push('');
  }
  return lines.join('\n');
}

(async () => {
  const summary = [];
  for (const [slug, cfg] of Object.entries(NICHE_POSTS)) {
    try {
      const { data: post, error: postErr } = await sb.from('blog_posts')
        .select('id, slug, content')
        .eq('slug', slug)
        .single();
      if (postErr || !post) {
        console.log('  ! Post not found:', slug);
        continue;
      }

      const { topClinics, totalCount } = await fetchClinics(cfg);
      if (topClinics.length === 0) {
        console.log('  ! Zero clinics for', slug, '— skipping');
        continue;
      }

      const clinicSection = buildClinicList({ cfg, clinics: topClinics, totalCount });
      const faqSection = buildFaq(cfg);
      const wrapped = `${NICHE_START}\n\n${clinicSection}\n\n${faqSection}\n${NICHE_END}`;

      let newContent;
      const existing = String(post.content || '');
      if (existing.includes(NICHE_START) && existing.includes(NICHE_END)) {
        const before = existing.split(NICHE_START)[0].trimEnd();
        const after = existing.split(NICHE_END)[1] || '';
        newContent = `${before}\n\n${wrapped}${after}`;
      } else {
        newContent = `${existing.trimEnd()}\n\n${wrapped}\n`;
      }

      const clinicIds = topClinics.map(c => c.id);
      const { error: updErr } = await sb.from('blog_posts')
        .update({
          content: newContent,
          related_clinics: clinicIds,
          relatedClinics: clinicIds,
          last_updated: new Date().toISOString().slice(0, 10),
          lastUpdated: new Date().toISOString().slice(0, 10),
        })
        .eq('id', post.id);
      if (updErr) {
        console.log('  ! Update failed:', slug, updErr.message);
        continue;
      }

      const oldWords = existing.split(/\s+/).filter(Boolean).length;
      const newWords = newContent.split(/\s+/).filter(Boolean).length;
      summary.push({ slug, oldWords, newWords, clinics: topClinics.length });
      console.log(`✓ ${slug.padEnd(40)}  ${oldWords} → ${newWords}  (+${topClinics.length} clinics linked)`);
    } catch (e) {
      console.log('  ! Error on', slug, e.message);
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log('Posts enriched:', summary.length, '/', Object.keys(NICHE_POSTS).length);
})();
