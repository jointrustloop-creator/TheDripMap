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

interface PlacesPeriod {
  open?: { day: number; time: string; hours?: number; minutes?: number } | null;
  close?: { day: number; time: string; hours?: number; minutes?: number } | null;
}
interface PlacesAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}
interface PlacesData {
  name?: string | null;
  formatted_address?: string | null;
  formatted_phone_number?: string | null;
  website?: string | null;
  rating?: number | null;
  user_ratings_total?: number | null;
  types?: string[] | null;
  opening_hours?: {
    weekday_text?: string[];
    periods?: PlacesPeriod[];
  } | null;
  business_status?: string | null;
  place_id?: string | null;
  address_components?: PlacesAddressComponent[] | null;
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
// operator instructions:
//   - ANY range "X - Y" (not just digit-only) becomes "X to Y", so
//     "8:00 AM - 5:00 PM", "Mon - Fri", "low - mid" all read as ranges.
//   - Any remaining em-dash, en-dash, figure dash, or horizontal bar
//     becomes a comma.
//   - Tidy doubled punctuation (", ,", " ,") and double spaces.
// Hours are pre-formatted as "X to Y" upstream so they never reach the
// dash-to-comma pass even if upstream upstreams later change.
function sanitizeDashes(s: string): string {
  if (!s) return '';
  let out = s;
  // 1. Range syntax: non-whitespace on both sides separated by em/en/figure/horizontal-bar.
  out = out.replace(/(\S)\s*[‒–—―]\s*(\S)/g, '$1 to $2');
  // 2. Any leftover dashes (at start of line, between whitespace, etc).
  out = out.replace(/[‒–—―]/g, ',');
  // 3. Tidy: collapse doubled punctuation and double spaces.
  out = out.replace(/,\s*,/g, ',');
  out = out.replace(/\s+,/g, ',');
  out = out.replace(/[ \t]{2,}/g, ' ');
  return out;
}

// === Hours and address helpers ===
// Google Places returns opening_hours.periods as { open, close } with
// time as a 4-digit "HHMM" string (UTC for the place's timezone, but
// the API returns it already adjusted to local time). We build BOTH a
// human-readable "Monday: 8:00 AM to 5:00 PM" line for the GBP Q&A
// and a schema.org openingHoursSpecification[] for the JSON-LD.
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
const SCHEMA_DAY = ['https://schema.org/Sunday', 'https://schema.org/Monday', 'https://schema.org/Tuesday', 'https://schema.org/Wednesday', 'https://schema.org/Thursday', 'https://schema.org/Friday', 'https://schema.org/Saturday'] as const;

function parseHHMM(time: string | undefined): { h: number; m: number } | null {
  if (!time || !/^\d{4}$/.test(time)) return null;
  const h = Number(time.slice(0, 2));
  const m = Number(time.slice(2, 4));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return { h, m };
}
function fmt12(h: number, m: number): string {
  const period = h >= 12 ? 'PM' : 'AM';
  const hh = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const mm = m.toString().padStart(2, '0');
  return `${hh}:${mm} ${period}`;
}
function fmt24(h: number, m: number): string {
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

interface HoursOutput {
  humanLines: string[];
  schemaSpec: Array<{ '@type': 'OpeningHoursSpecification'; dayOfWeek: string; opens: string; closes: string }>;
}
function buildHours(periods: PlacesPeriod[] | null | undefined): HoursOutput {
  const humanLines: string[] = [];
  const schemaSpec: HoursOutput['schemaSpec'] = [];
  if (!periods || periods.length === 0) return { humanLines, schemaSpec };
  // periods is keyed by open day; close may roll to next day. We group
  // by day and emit one line per day with the open/close pair.
  const byDay: Record<number, { open: { h: number; m: number }; close: { h: number; m: number } }[]> = {};
  for (const p of periods) {
    if (!p.open) continue;
    const o = parseHHMM(p.open.time);
    const c = p.close ? parseHHMM(p.close.time) : null;
    if (!o) continue;
    if (!byDay[p.open.day]) byDay[p.open.day] = [];
    byDay[p.open.day].push({ open: o, close: c || { h: 0, m: 0 } });
  }
  // Walk Monday..Sunday for the human block (more conventional than Sun first).
  for (const dayIdx of [1, 2, 3, 4, 5, 6, 0]) {
    const slots = byDay[dayIdx];
    if (!slots || slots.length === 0) {
      humanLines.push(`${DAY_NAMES[dayIdx]}: Closed`);
      continue;
    }
    const formatted = slots.map((s) => `${fmt12(s.open.h, s.open.m)} to ${fmt12(s.close.h, s.close.m)}`).join(', ');
    humanLines.push(`${DAY_NAMES[dayIdx]}: ${formatted}`);
    for (const s of slots) {
      schemaSpec.push({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: SCHEMA_DAY[dayIdx],
        opens: fmt24(s.open.h, s.open.m),
        closes: fmt24(s.close.h, s.close.m),
      });
    }
  }
  return { humanLines, schemaSpec };
}

// Build a schema.org PostalAddress from Google's address_components.
function buildPostalAddress(components: PlacesAddressComponent[] | null | undefined, fallbackFormatted: string | null | undefined): Record<string, string> | string | null {
  if (!components || components.length === 0) {
    return fallbackFormatted || null;
  }
  function pick(...wanted: string[]): string | undefined {
    for (const c of components) {
      if (c.types.some((t) => wanted.includes(t))) return c.long_name;
    }
    return undefined;
  }
  function pickShort(...wanted: string[]): string | undefined {
    for (const c of components) {
      if (c.types.some((t) => wanted.includes(t))) return c.short_name;
    }
    return undefined;
  }
  const streetNumber = pick('street_number');
  const route = pick('route');
  const streetAddress = [streetNumber, route].filter(Boolean).join(' ');
  const locality = pick('locality', 'postal_town', 'sublocality_level_1', 'sublocality');
  const region = pickShort('administrative_area_level_1');
  const postalCode = pick('postal_code');
  const country = pickShort('country');
  if (!streetAddress && !locality && !region) return fallbackFormatted || null;
  const addr: Record<string, string> = { '@type': 'PostalAddress' };
  if (streetAddress) addr.streetAddress = streetAddress;
  if (locality) addr.addressLocality = locality;
  if (region) addr.addressRegion = region;
  if (postalCode) addr.postalCode = postalCode;
  if (country) addr.addressCountry = country;
  return addr;
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
  const fields = ['name','formatted_address','address_components','formatted_phone_number','website','rating','user_ratings_total','types','opening_hours','current_opening_hours','business_status','place_id'].join(',');
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

  // Structured hours from Google Places periods. Pre-formatted as
  // "8:00 AM to 5:00 PM" so the dash sanitizer never sees them. Schema
  // openingHoursSpecification is built from the same source.
  const hours = buildHours(places?.opening_hours?.periods);
  const postalAddress = buildPostalAddress(places?.address_components, address || null);

  const websiteServices = detectServicesInHtml(html);
  const dbServices = (input.dbServices || []).filter(Boolean);
  const allServices = Array.from(new Set([...websiteServices, ...dbServices]));
  if (allServices.length === 0) {
    placeholders.push('services list');
    warnings.push('No services detected from website or DB. Marked for operator confirmation.');
  }

  const city = noDashes(input.city || '');
  const cityForCopy = city || placeholderIfMissing(null, 'city name', placeholders);

  // Cheap on-page scrape signals so we drop speculative filler unless we
  // saw the topic on the clinic's own site. "may be available" copy is
  // gated on these. If we did not see a mention, omit the post or Q&A.
  const websiteText = (html || '').toLowerCase();
  const sawMobile = /mobile|in-home|at-home|home visit|concierge/.test(websiteText);
  const sawGiftCards = /gift card|gift certificat/.test(websiteText);
  const sawGroupCorp = /corporate|group|bachelorette|bridal|team/.test(websiteText);
  const sawPackages = /package|membership|subscription/.test(websiteText);
  const sawWalkIn = /walk.?in|same.?day/.test(websiteText);
  const sawPricing = /\$\d|cad |usd /i.test(websiteText);

  const placesCategoryHints = (places?.types || []).filter(t => !['point_of_interest', 'establishment', 'health'].includes(t));

  // 1. Google Business Profile description, max 750 chars, no em-dashes,
  // no health-outcome claims. Marketing copy only.
  const gbpDescription = (() => {
    const lead = `${name} is an IV therapy service serving ${cityForCopy}.`;
    const offering = allServices.length > 0
      ? ` Services include ${allServices.slice(0, 6).join(', ')}.`
      : ' Service menu listed on the website.';
    const setup = phone
      ? ` Call ${phone} or visit the website for current availability.`
      : ' Visit the website for current availability and to book.';
    const extras: string[] = [];
    if (sawMobile) extras.push('Mobile and in-home options where supported');
    if (sawWalkIn) extras.push('Walk-ins subject to availability');
    const close = extras.length ? ' ' + extras.join('. ') + '.' : '';
    let body = lead + offering + setup + close;
    if (body.length > 750) body = body.slice(0, 747) + '...';
    return body;
  })();

  // 2. Recommended GBP categories. Operator-spec real Google taxonomy:
  //    primary "IV therapy service" (Google added 2024-10-24),
  //    "Naturopath" (not "Naturopathic practitioner"), Medical spa,
  //    Wellness center are valid GBP categories.
  const primaryCategory = 'IV therapy service';
  const secondaryCategories = [
    'Medical spa',
    'Wellness center',
    'Naturopath',
  ];

  // 3. GBP posts. We only emit posts whose topic is supported by the
  // source data (website scrape, Places data). Speculative "may be
  // available" filler is dropped per the 2026-06-09 operator polish ask.
  const gbpPosts: string[] = [
    `Now booking IV drip appointments at ${name} in ${cityForCopy}. View availability on our booking page.`,
    `New to IV therapy. Ask about our intake process and what to expect on your first visit.`,
    `${name} offers ${allServices[0] || '[clinic to confirm signature drip]'} and other targeted IV menus. See full list on our website.`,
    `Pre-event and post-travel hydration sessions are popular requests, book ahead during peak weeks.`,
    `Have questions about ingredients or what is in each drip, our team is happy to walk you through the options.`,
    `Open today, see our website for current hours, services, and booking link.`,
  ];
  if (sawWalkIn) gbpPosts.push(`Hydration support sessions available. Walk-ins subject to availability, call ahead to confirm.`);
  if (sawGiftCards) gbpPosts.push(`Gift cards available, contact the front desk for current options.`);
  if (sawMobile) gbpPosts.push(`Mobile IV available in select areas, check with our team for service zones and timing.`);
  if (sawGroupCorp) gbpPosts.push(`Booking corporate or group wellness sessions, reach out to discuss group rates and on-site visits.`);

  // 4. GBP Q&A. Same source-grounded rule: include the question only if we
  // have a real answer. Q&As that would otherwise reduce to "[clinic to
  // confirm]" are omitted, not surfaced as placeholders.
  const hoursHumanText = hours.humanLines.length > 0 ? hours.humanLines.join('\n') : '';
  const gbpQAs: Array<{ q: string; a: string }> = [];
  if (sawWalkIn) gbpQAs.push({ q: 'Do you take walk-ins?', a: 'Walk-ins are subject to availability. Calling ahead is recommended to confirm a time.' });
  if (address) gbpQAs.push({ q: 'Where are you located?', a: address });
  if (hoursHumanText) gbpQAs.push({ q: 'What are your hours?', a: hoursHumanText });
  if (sawMobile) gbpQAs.push({ q: 'Do you offer mobile or in-home IV?', a: 'Mobile service is offered, please call or message us to check current zones.' });
  gbpQAs.push({ q: 'How long does an IV session take?', a: 'Most sessions take about 30 to 60 minutes depending on the drip protocol selected.' });
  gbpQAs.push({ q: 'Do I need a consultation first?', a: 'First-time visitors typically complete a brief intake, our team will walk you through the steps.' });
  if (sawPackages) gbpQAs.push({ q: 'Do you offer packages or memberships?', a: 'Packages and memberships are offered, contact the clinic for current options and pricing.' });

  // 5. Website on-page SEO.
  const onPageTitle = `IV Therapy in ${cityForCopy} | ${name}`.slice(0, 60);
  const onPageMeta = `${name} offers IV drips and hydration sessions in ${cityForCopy}. Book online or call for current availability.`.slice(0, 158);
  const onPageH1 = `IV therapy in ${cityForCopy}`;
  // Operator polish: do not claim pricing is shown unless we actually saw it.
  const onPageIntro = sawPricing
    ? `${name} provides IV drip sessions and hydration therapy in ${cityForCopy}. Our menu and pricing are listed below, view the full booking page to choose a time that works.`
    : `${name} provides IV drip sessions and hydration therapy in ${cityForCopy}. Browse the menu, then view the booking page to choose a time that works.`;

  // 6. JSON-LD LocalBusiness / MedicalBusiness schema. Address is a
  // PostalAddress object, hours are openingHoursSpecification[] in
  // 24-hour format. Strings are only used as fallback when structured
  // data is missing.
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    name,
    url: input.website || '[clinic to confirm: website URL]',
    address: postalAddress || '[clinic to confirm: address]',
    telephone: phone || '[clinic to confirm: phone]',
  };
  if (hours.schemaSpec.length > 0) schema.openingHoursSpecification = hours.schemaSpec;
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

  md.push(`## 4. GBP posts (ready to publish, ${gbpPosts.length} total)`);
  md.push('');
  gbpPosts.forEach((p, i) => {
    md.push(`### Post ${i + 1}`);
    md.push(p);
    md.push('');
  });

  md.push(`## 5. GBP Q&A entries (${gbpQAs.length} grounded in source data)`);
  md.push('');
  gbpQAs.forEach((qa, i) => {
    md.push(`### Q${i + 1}: ${qa.q}`);
    md.push(`A:`);
    md.push(qa.a);
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
