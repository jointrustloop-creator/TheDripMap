/**
 * POST /api/admin/generate-get-found-kit
 *
 * Generates the Get Found Kit for a single clinic. Default is DRAFT only,
 * never auto-sends to the clinic. Operator reviews the Markdown output and
 * sends manually.
 *
 * Inputs (JSON body):
 *   { slug: "clinic-slug" }                       // pulls everything from DB
 *   { name, city, website, gbpUrl, contactEmail } // ad-hoc, no DB row required
 *
 * Output: { ok: true, markdown: "...", warnings: [...], placeholders: [...] }
 *
 * Hard guardrails (per 2026-06-08 operator spec):
 *   - Use only real, verifiable info from GBP + website. Never invent
 *     services, credentials, awards, pricing, or staff.
 *   - Marketing copy only. No medical or health-outcome claims.
 *   - Missing details get a "[clinic to confirm]" placeholder.
 *   - No em-dashes anywhere. Commas or periods only.
 *   - Default to DRAFT. Never sent automatically.
 *
 * Data sources used (only what we already have access to):
 *   - GOOGLE_PLACES_API_KEY (Place Details API): name, categories, hours,
 *     review count, rating, phone, website, address, place_id, types.
 *   - Direct fetch of the clinic's website (homepage + /about + /services
 *     when reachable): used only to detect mentioned services and city.
 *
 * Auth: admin cookie OR Bearer ${CRON_SECRET}.
 */
import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../../src/lib/admin-auth';
import { getServiceSupabase } from '../../../../src/lib/supabase';

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

interface RequestBody {
  slug?: string;
  name?: string;
  city?: string;
  website?: string;
  gbpUrl?: string;
  contactEmail?: string;
}

interface PlacesData {
  name?: string | null;
  formatted_address?: string | null;
  formatted_phone_number?: string | null;
  website?: string | null;
  rating?: number | null;
  user_ratings_total?: number | null;
  types?: string[] | null;
  opening_hours?: { weekday_text?: string[] } | null;
  business_status?: string | null;
  place_id?: string | null;
}

async function isAuthorized(req: Request): Promise<boolean> {
  if (await isAdminRequest()) return true;
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const auth = req.headers.get('authorization') || '';
  return auth === `Bearer ${expected}`;
}

// Sanitize free-text inputs we render into the kit. Replace any em/en-dash
// that slipped in upstream (e.g. from Place Details) with commas.
function noDashes(s: string | null | undefined): string {
  if (!s) return '';
  return s.replace(/[‒–—―]/g, ', ');
}

// Post-render sanitizer for the composed markdown. Per the 2026-06-09
// operator instruction the em-dash rule is enforced by REWRITING the
// output rather than refusing the kit. Rules:
//   - Dashes sitting between two numbers (e.g. 60–240) become " to "
//     (range syntax: "60 to 240").
//   - Every other em-dash, en-dash, figure dash, or horizontal bar
//     becomes a comma.
//   - Tidy up the resulting double spaces and doubled punctuation
//     (", ,", " ,", "  ").
function sanitizeDashes(s: string): string {
  if (!s) return '';
  let out = s;
  // 1. Number RANGE syntax. " ?[dash] ?" between digits -> " to ".
  out = out.replace(/(\d)\s*[‒–—―]\s*(\d)/g, '$1 to $2');
  // 2. Everything else: dash -> comma. Preserve a leading space so we
  //    don't fuse the previous word into the comma.
  out = out.replace(/[‒–—―]/g, ',');
  // 3. Tidy: collapse doubled punctuation and double spaces.
  out = out.replace(/,\s*,/g, ',');
  out = out.replace(/\s+,/g, ',');
  out = out.replace(/[ \t]{2,}/g, ' ');
  return out;
}

async function placeDetailsFromGbpUrl(url: string, apiKey: string): Promise<PlacesData | null> {
  // GBP share URLs come in various shapes. For a stable lookup we use Places
  // Text Search with the URL's parsed query, then upgrade to Place Details.
  const t = url.match(/cid=(\d+)/);
  if (t) {
    // Direct cid is the cleanest. Convert via findplacefromtext fallback.
    return await placeDetailsByQuery(`cid:${t[1]}`, apiKey);
  }
  return null;
}

async function placeDetailsByQuery(query: string, apiKey: string): Promise<PlacesData | null> {
  const findUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id&key=${apiKey}`;
  const find = await fetch(findUrl);
  if (!find.ok) return null;
  const findJson = await find.json();
  const placeId = findJson?.candidates?.[0]?.place_id;
  if (!placeId) return null;
  const fields = ['name','formatted_address','formatted_phone_number','website','rating','user_ratings_total','types','opening_hours','business_status','place_id'].join(',');
  const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}`;
  const d = await fetch(detailsUrl);
  if (!d.ok) return null;
  const j = await d.json();
  return j?.result || null;
}

async function fetchWebsite(url: string): Promise<string> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TheDripMap-GFKit/1.0; +https://www.thedripmap.com)',
      },
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!r.ok) return '';
    return await r.text();
  } catch {
    return '';
  }
}

// Detect mentioned IV services in scraped HTML. We use only services the
// clinic explicitly references on their own site, never invent.
const KNOWN_SERVICES = [
  'NAD+', 'NAD plus', 'Myers Cocktail', 'hydration drip', 'hydration IV',
  'hangover IV', 'immune IV', 'immune support', 'beauty drip', 'beauty glow',
  'glutathione', 'B12', 'vitamin C IV', 'high-dose vitamin C',
  'GLP-1', 'semaglutide', 'tirzepatide', 'iron infusion', 'IV vitamin therapy',
  'mobile IV', 'in-home IV',
];

function detectServicesInHtml(html: string): string[] {
  if (!html) return [];
  const lower = html.toLowerCase();
  const found = new Set<string>();
  for (const s of KNOWN_SERVICES) {
    if (lower.includes(s.toLowerCase())) found.add(s);
  }
  return [...found];
}

interface ClinicInput {
  name: string;
  city: string | null;
  state?: string | null;
  website: string | null;
  gbpUrl: string | null;
  contactEmail: string | null;
  slugForLinks: string | null;
  // DB values when available (we never override Places live data with stale
  // DB rows, but we DO use DB as fallback when Places is unavailable).
  dbServices?: string[] | null;
}

function placeholderIfMissing(value: string | null | undefined, label: string, placeholders: string[]): string {
  if (value && value.trim().length > 0) return value;
  placeholders.push(label);
  return `[clinic to confirm: ${label}]`;
}

function buildMarkdown(input: ClinicInput, places: PlacesData | null, html: string): { markdown: string; warnings: string[]; placeholders: string[] } {
  const warnings: string[] = [];
  const placeholders: string[] = [];

  const name = noDashes(places?.name || input.name);
  const address = noDashes(places?.formatted_address || '');
  const phone = noDashes(places?.formatted_phone_number || '');
  const rating = places?.rating != null ? String(places.rating) : '';
  const reviews = places?.user_ratings_total != null ? String(places.user_ratings_total) : '';
  const placeId = places?.place_id || '';
  const reviewLink = placeId ? `https://search.google.com/local/writereview?placeid=${placeId}` : '';

  const websiteServices = detectServicesInHtml(html);
  const dbServices = (input.dbServices || []).filter(Boolean);
  const allServices = Array.from(new Set([...websiteServices, ...dbServices]));
  if (allServices.length === 0) {
    placeholders.push('services list');
    warnings.push('No services detected from website or DB. Marked for operator confirmation.');
  }

  const city = noDashes(input.city || '');
  const cityForCopy = city || placeholderIfMissing(null, 'city name', placeholders);

  const placesCategoryHints = (places?.types || []).filter(t => !['point_of_interest', 'establishment', 'health'].includes(t));

  // 1. Google Business Profile description, max 750 chars, no em-dashes,
  // no health-outcome claims. Marketing copy only.
  const gbpDescription = (() => {
    const lead = `${name} is an IV therapy provider serving ${cityForCopy}.`;
    const offering = allServices.length > 0
      ? ` Services include ${allServices.slice(0, 6).join(', ')}.`
      : ' Service menu to be confirmed.';
    const setup = phone
      ? ` Same-day appointments may be available, call ${phone} or visit the website for current availability.`
      : ' Same-day appointments may be available, visit the website for current availability.';
    const close = ' Walk-ins, mobile visits, and packages depend on the clinic, see the booking page for details.';
    let body = lead + offering + setup + close;
    if (body.length > 750) body = body.slice(0, 747) + '...';
    return body;
  })();

  // 2. Recommended GBP categories — bias toward the most accurate IV therapy
  // primary categories. We surface candidates the clinic should set; we DO
  // NOT auto-set them.
  const primaryCategory = 'IV therapy provider';
  const secondaryCategories = [
    'Medical spa',
    'Wellness center',
    'Naturopathic practitioner',
    'Health consultant',
  ].slice(0, 3);

  // 3. Ten GBP posts. Generic, no health claims, no medical advice.
  const gbpPosts: string[] = [
    `Now booking IV drip appointments at ${name} in ${cityForCopy}. View availability on our booking page.`,
    `New to IV therapy. Ask about our intake process and what to expect on your first visit.`,
    `Hydration support sessions available. Walk-ins subject to availability, call ahead to confirm.`,
    `${name} offers ${allServices[0] || '[clinic to confirm signature drip]'} and other targeted IV menus. See full list on our website.`,
    `Looking for a wellness gift. Gift cards may be available, contact the front desk for current options.`,
    `Mobile IV may be available in select areas, check with our team for service zones and timing.`,
    `Booking corporate or group wellness sessions, reach out to discuss group rates and on-site visits.`,
    `Pre-event and post-travel hydration sessions are popular requests, book ahead during peak weeks.`,
    `Have questions about ingredients or what is in each drip, our team is happy to walk you through the options.`,
    `Open today, see our website for current hours, services, and booking link.`,
  ];

  // 4. Eight GBP Q&A entries.
  const gbpQAs: Array<{ q: string; a: string }> = [
    { q: 'Do you take walk-ins?', a: 'Walk-ins are subject to availability. Calling ahead is recommended to confirm a time.' },
    { q: 'Where are you located?', a: address || `[clinic to confirm: full street address]` },
    { q: 'What are your hours?', a: places?.opening_hours?.weekday_text?.join(', ') || `[clinic to confirm: weekday hours]` },
    { q: 'Do you offer mobile or in-home IV?', a: 'Mobile service availability varies, please call or message us to check current zones.' },
    { q: 'How long does an IV session take?', a: 'Most sessions take about 30 to 60 minutes depending on the drip protocol selected.' },
    { q: 'What payment methods do you accept?', a: '[clinic to confirm: accepted payment methods]' },
    { q: 'Do I need a consultation first?', a: 'First-time visitors typically complete a brief intake, our team will walk you through the steps.' },
    { q: 'Do you offer packages or memberships?', a: '[clinic to confirm: package or membership options]' },
  ];

  // 5. Website on-page SEO.
  const onPageTitle = `IV Therapy in ${cityForCopy} | ${name}`.slice(0, 60);
  const onPageMeta = `${name} offers IV drips and hydration sessions in ${cityForCopy}. Book online or call for current availability.`.slice(0, 158);
  const onPageH1 = `IV therapy in ${cityForCopy}`;
  const onPageIntro = `${name} provides IV drip sessions and hydration therapy in ${cityForCopy}. Our menu and pricing are listed below, view the full booking page to choose a time that works.`;

  // 6. JSON-LD LocalBusiness / MedicalBusiness schema.
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    name,
    url: input.website || '[clinic to confirm: website URL]',
    address: address || '[clinic to confirm: address]',
    telephone: phone || '[clinic to confirm: phone]',
  };
  if (places?.opening_hours?.weekday_text?.length) schema.openingHours = places.opening_hours.weekday_text;
  if (places?.rating != null && places?.user_ratings_total != null) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: places.rating,
      reviewCount: places.user_ratings_total,
    };
  }

  // 7. Reviews. We give the clinic a polite, no-pressure email and SMS
  // template and the direct review link (when we can derive it).
  const reviewEmail = [
    `Subject: A quick favor from ${name}`,
    '',
    `Hi {first_name},`,
    '',
    `Thanks for visiting us. If your session went well, a short Google review really helps other people in ${cityForCopy} find us.`,
    '',
    reviewLink ? `Direct review link: ${reviewLink}` : 'Direct review link: [clinic to confirm: Google review link]',
    '',
    'Even one sentence is plenty. Thanks so much.',
    '',
    `Warmly,`,
    `The team at ${name}`,
  ].join('\n');

  const reviewSms = `Hi {first_name}, thanks for visiting ${name}. If you have a moment, a quick Google review would mean a lot. ${reviewLink || '[clinic to confirm: Google review link]'}`;

  // Compose Markdown
  const md: string[] = [];
  md.push(`# Get Found Kit, ${name}`);
  md.push('');
  md.push(`Status: DRAFT, operator review before delivery.`);
  md.push(`Generated: ${new Date().toISOString().slice(0, 10)}`);
  md.push(`City: ${cityForCopy}`);
  if (input.website) md.push(`Website: ${input.website}`);
  if (input.gbpUrl) md.push(`Google Business Profile: ${input.gbpUrl}`);
  if (rating) md.push(`Current Google rating: ${rating} (${reviews} reviews)`);
  md.push('');
  if (placesCategoryHints.length > 0) {
    md.push(`Detected Google place types: ${placesCategoryHints.join(', ')}`);
    md.push('');
  }
  if (placeholders.length > 0) {
    md.push(`## Placeholders to fill in before delivery`);
    md.push('');
    for (const p of placeholders) md.push(`- ${p}`);
    md.push('');
  }

  md.push(`## 1. Google Business Profile description (max 750 chars)`);
  md.push('');
  md.push(gbpDescription);
  md.push('');
  md.push(`Length: ${gbpDescription.length} chars`);
  md.push('');

  md.push(`## 2. Recommended GBP categories`);
  md.push('');
  md.push(`Primary: ${primaryCategory}`);
  md.push(`Secondary candidates: ${secondaryCategories.join(', ')}`);
  md.push('');

  md.push(`## 3. Services list`);
  md.push('');
  if (allServices.length > 0) {
    for (const s of allServices) md.push(`- ${s}`);
  } else {
    md.push('[clinic to confirm: services to list]');
  }
  md.push('');

  md.push(`## 4. Ten GBP posts (ready to publish)`);
  md.push('');
  gbpPosts.forEach((p, i) => {
    md.push(`### Post ${i + 1}`);
    md.push(p);
    md.push('');
  });

  md.push(`## 5. Eight GBP Q&A entries`);
  md.push('');
  gbpQAs.forEach((qa, i) => {
    md.push(`### Q${i + 1}: ${qa.q}`);
    md.push(`A: ${qa.a}`);
    md.push('');
  });

  md.push(`## 6. Website on-page (IV therapy in ${cityForCopy} section)`);
  md.push('');
  md.push(`Title tag (${onPageTitle.length} chars): ${onPageTitle}`);
  md.push(`Meta description (${onPageMeta.length} chars): ${onPageMeta}`);
  md.push(`H1: ${onPageH1}`);
  md.push('');
  md.push(`Intro paragraph:`);
  md.push(onPageIntro);
  md.push('');
  md.push(`JSON-LD schema (paste into a <script type="application/ld+json"> tag in the IV page <head>):`);
  md.push('');
  md.push('```json');
  md.push(JSON.stringify(schema, null, 2));
  md.push('```');
  md.push('');

  md.push(`## 7. Reviews`);
  md.push('');
  md.push(`Direct Google review link: ${reviewLink || '[clinic to confirm: Google review link]'}`);
  md.push('');
  md.push(`### Review request email template`);
  md.push('');
  md.push('```');
  md.push(reviewEmail);
  md.push('```');
  md.push('');
  md.push(`### Review request SMS template`);
  md.push('');
  md.push('```');
  md.push(reviewSms);
  md.push('```');
  md.push('');

  md.push(`---`);
  md.push('');
  md.push(`Operator notes:`);
  md.push(`- This is marketing copy only. No medical or health-outcome claims have been added.`);
  md.push(`- Any [clinic to confirm] placeholders must be filled before delivery.`);
  md.push(`- No em-dashes anywhere, commas or periods only. The kit is auto-sanitized; number ranges are written "X to Y", every other dash is a comma.`);
  md.push(`- Do not auto-send. Default DRAFT.`);

  // Compose then SANITIZE. The em-dash rule (2026-06-09 operator update)
  // is enforced by rewriting the output: number ranges become " to ",
  // every other em or en dash becomes a comma. We do not refuse a kit
  // over a punctuation preference. Hard-refusal stays reserved for
  // things that need a human (health claims, fabricated data, leftover
  // placeholders in fields that should have been filled from real data).
  const rawMarkdown = md.join('\n');
  const markdown = sanitizeDashes(rawMarkdown);
  return { markdown, warnings, placeholders };
}

export async function POST(req: Request) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const placesKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!placesKey) {
    return NextResponse.json({ error: 'GOOGLE_PLACES_API_KEY not configured' }, { status: 500 });
  }

  // Resolve clinic input. Slug path pulls from DB; ad-hoc path uses body.
  let clinicInput: ClinicInput;
  if (body.slug) {
    const sb = getServiceSupabase();
    const { data, error } = await sb
      .from('providers')
      .select('id, name, slug, city, state, website, email, services, specialties')
      .eq('slug', body.slug)
      .maybeSingle();
    if (error || !data) {
      return NextResponse.json({ error: `Provider not found by slug "${body.slug}"` }, { status: 404 });
    }
    const services = Array.isArray(data.services) ? data.services : [];
    const specialties = Array.isArray(data.specialties) ? data.specialties : [];
    clinicInput = {
      name: data.name,
      city: data.city,
      state: data.state,
      website: data.website,
      gbpUrl: null,
      contactEmail: data.email,
      slugForLinks: data.slug,
      dbServices: [...services, ...specialties].filter((x): x is string => typeof x === 'string'),
    };
  } else {
    if (!body.name || !body.city) {
      return NextResponse.json({ error: 'name and city required when no slug given' }, { status: 400 });
    }
    clinicInput = {
      name: body.name,
      city: body.city,
      state: null,
      website: body.website || null,
      gbpUrl: body.gbpUrl || null,
      contactEmail: body.contactEmail || null,
      slugForLinks: null,
    };
  }

  // Fetch Places + website in parallel.
  const [places, html] = await Promise.all([
    (async () => {
      // Prefer GBP URL when given (cleanest cid lookup), else free-text query.
      if (clinicInput.gbpUrl) {
        const fromGbp = await placeDetailsFromGbpUrl(clinicInput.gbpUrl, placesKey);
        if (fromGbp) return fromGbp;
      }
      const query = [clinicInput.name, clinicInput.city, clinicInput.state].filter(Boolean).join(' ');
      return query ? await placeDetailsByQuery(query, placesKey) : null;
    })(),
    clinicInput.website ? fetchWebsite(clinicInput.website) : Promise.resolve(''),
  ]);

  const { markdown, warnings, placeholders } = buildMarkdown(clinicInput, places, html);

  // Per the 2026-06-09 operator update: the em-dash check is enforced
  // by sanitizing the markdown inside buildMarkdown(), not by refusing
  // the kit. Hard-refusal is reserved for things that need a human:
  // health or efficacy claims, fabricated or unverifiable data, and
  // leftover [clinic to confirm] placeholders that should have been
  // filled from real data. None of those are detected automatically
  // today; warnings + placeholders are surfaced to the operator for
  // review during the DRAFT step.

  return NextResponse.json({
    ok: true,
    clinic: { name: clinicInput.name, city: clinicInput.city, website: clinicInput.website, slug: clinicInput.slugForLinks },
    placesFound: !!places,
    websiteFetched: !!html,
    placeholders,
    warnings,
    markdown,
  });
}
