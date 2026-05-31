// Pillar 5 of the IV-clinic SEO audit: Local visibility via the official
// Google Places API (Place Search + Place Details). NEVER scrapes Google SERPs
// or third-party directories — that's both fragile and policy-grey.
//
// Graceful degradation: if GOOGLE_PLACES_API_KEY is missing OR the call fails,
// we return a structured "stub" result with `state: 'setup-required'` so the
// UI can render a clear "Setup required" panel pointing at the env var
// instead of silently dropping the pillar.

export type LocalVisibilityState =
  | 'ok'              // ran successfully and found a GBP match
  | 'not-found'       // ran successfully but no GBP match
  | 'setup-required'  // no API key — show setup steps
  | 'error';          // call failed at runtime

export interface LocalVisibilityResult {
  state: LocalVisibilityState;
  /** When state==='setup-required', the env var that needs to be set. */
  envVar?: string;
  /** Human-readable setup steps (only when state==='setup-required'). */
  setupSteps?: string[];
  /** Friendly error message (only when state==='error'). */
  errorMessage?: string;
  /** Detected GBP match — populated when state==='ok'. */
  place?: {
    placeId: string;
    name: string;
    formattedAddress: string;
    phone: string | null;
    website: string | null;
    rating: number | null;
    reviewCount: number | null;
    hasPhotos: boolean;
    hasHours: boolean;
    types: string[];
    businessStatus: string | null;
    location: { lat: number; lng: number } | null;
  };
  /** NAP consistency check between the website and the GBP listing. */
  napConsistency?: {
    nameMatches: boolean;
    phoneMatches: boolean | null;       // null when we couldn't detect either side
    websiteMatches: boolean | null;     // null when GBP has no website
    notes: string[];
  };
  /** Issues to surface as paste-ready fixes in the UI. */
  issues: string[];
  /** Positive signals to surface (so the report isn't purely negative). */
  wins: string[];
}

export interface PlacesInput {
  /** The clinic's business name (detected from the site or supplied by lead). */
  businessName: string;
  /** Detected/declared city — used to scope the search. */
  city: string;
  /** Detected phone from the website (for NAP comparison). */
  websitePhone?: string;
  /** The website URL (for NAP comparison). */
  websiteUrl: string;
}

const SETUP_STEPS = [
  '1. Create a Google Cloud project (or reuse an existing one).',
  '2. Enable "Places API" in the Google Cloud Console (APIs & Services → Library).',
  '3. Create an API key (APIs & Services → Credentials → Create credentials → API key).',
  '4. Restrict the key to the Places API.',
  '5. Add `GOOGLE_PLACES_API_KEY=<your-key>` to Vercel project env vars.',
  '6. Redeploy. The local visibility pillar will run automatically on the next audit.',
];

function bareHost(raw?: string | null): string | null {
  if (!raw) return null;
  try {
    let u = raw.trim();
    if (!u) return null;
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
    return new URL(u).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

function normalizePhone(raw?: string | null): string {
  if (!raw) return '';
  return raw.replace(/\D+/g, '');
}

function normalizeName(raw?: string | null): string {
  if (!raw) return '';
  return raw.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Run the Places lookup for a clinic. Returns a structured result that the
 * UI renders directly — including a setup-required state when the key is
 * absent so the user is never left wondering why a section is missing.
 */
export async function runLocalVisibilityCheck(input: PlacesInput): Promise<LocalVisibilityResult> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    return {
      state: 'setup-required',
      envVar: 'GOOGLE_PLACES_API_KEY',
      setupSteps: SETUP_STEPS,
      issues: [],
      wins: [],
    };
  }

  const businessName = (input.businessName || '').trim();
  const city = (input.city || '').trim();
  if (!businessName) {
    return {
      state: 'error',
      errorMessage: 'No clinic name detected to search Google Places with.',
      issues: [],
      wins: [],
    };
  }

  const query = city ? `${businessName} ${city}` : businessName;

  try {
    // Step 1: Find Place from Text Search (most permissive name match).
    const searchUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    searchUrl.searchParams.set('query', query);
    searchUrl.searchParams.set('key', key);

    const searchRes = await fetch(searchUrl.toString(), {
      headers: { 'User-Agent': 'TheDripMap-SEO-Audit/1.0' },
    });
    if (!searchRes.ok) {
      return {
        state: 'error',
        errorMessage: `Places Text Search returned ${searchRes.status}.`,
        issues: [],
        wins: [],
      };
    }
    const searchJson = await searchRes.json();
    const status = searchJson?.status;
    if (status === 'REQUEST_DENIED') {
      return {
        state: 'error',
        errorMessage: `Places API request denied (status REQUEST_DENIED). Confirm the API is enabled and the key is unrestricted enough to call Places Text Search. Detail: ${searchJson?.error_message || 'no detail'}`,
        issues: [],
        wins: [],
      };
    }
    if (status === 'OVER_QUERY_LIMIT') {
      return {
        state: 'error',
        errorMessage: 'Google Places API quota exceeded. Try again later.',
        issues: [],
        wins: [],
      };
    }
    const results: Array<Record<string, unknown>> = searchJson?.results || [];
    if (!results.length || status === 'ZERO_RESULTS') {
      return {
        state: 'not-found',
        issues: [
          `We couldn't find a Google Business Profile for "${businessName}" in ${city || 'your area'}. This is the single biggest local-SEO gap — patients searching "iv therapy near me" on Google see GBP listings first, not your website.`,
        ],
        wins: [],
      };
    }
    const best = results[0] as { place_id?: string };
    const placeId = best.place_id;
    if (!placeId) {
      return {
        state: 'not-found',
        issues: ['Google returned a result but no place_id we could fetch details for.'],
        wins: [],
      };
    }

    // Step 2: Place Details for the full record (photos, hours, NAP).
    const detailsUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    detailsUrl.searchParams.set('place_id', placeId);
    detailsUrl.searchParams.set(
      'fields',
      [
        'place_id',
        'name',
        'formatted_address',
        'formatted_phone_number',
        'international_phone_number',
        'website',
        'rating',
        'user_ratings_total',
        'photo',
        'opening_hours',
        'types',
        'business_status',
        'geometry',
      ].join(','),
    );
    detailsUrl.searchParams.set('key', key);

    const detailsRes = await fetch(detailsUrl.toString(), {
      headers: { 'User-Agent': 'TheDripMap-SEO-Audit/1.0' },
    });
    if (!detailsRes.ok) {
      return {
        state: 'error',
        errorMessage: `Places Details returned ${detailsRes.status}.`,
        issues: [],
        wins: [],
      };
    }
    const dj = await detailsRes.json();
    const r = dj?.result || {};

    const place = {
      placeId: r.place_id || placeId,
      name: r.name || businessName,
      formattedAddress: r.formatted_address || '',
      phone: r.international_phone_number || r.formatted_phone_number || null,
      website: r.website || null,
      rating: typeof r.rating === 'number' ? r.rating : null,
      reviewCount: typeof r.user_ratings_total === 'number' ? r.user_ratings_total : null,
      hasPhotos: Array.isArray(r.photos) && r.photos.length > 0,
      hasHours: !!r.opening_hours,
      types: Array.isArray(r.types) ? r.types : [],
      businessStatus: r.business_status || null,
      location:
        r.geometry?.location && typeof r.geometry.location.lat === 'number'
          ? { lat: r.geometry.location.lat, lng: r.geometry.location.lng }
          : null,
    };

    // NAP consistency. We compare against the website's HTML where we can.
    const napNotes: string[] = [];
    const siteHost = bareHost(input.websiteUrl);
    const gbpHost = bareHost(place.website || undefined);

    const nameMatches = normalizeName(place.name).includes(normalizeName(businessName).split(' ')[0]) ||
      normalizeName(businessName).includes(normalizeName(place.name).split(' ')[0]);
    if (!nameMatches) {
      napNotes.push(`Your website says "${businessName}" but your GBP says "${place.name}". Pick one and make them identical — Google penalizes NAP mismatches.`);
    }

    let phoneMatches: boolean | null = null;
    const siteDigits = normalizePhone(input.websitePhone);
    const gbpDigits = normalizePhone(place.phone || undefined);
    if (siteDigits && gbpDigits) {
      // Compare last 10 digits (covers +1 country code differences).
      phoneMatches = siteDigits.slice(-10) === gbpDigits.slice(-10);
      if (!phoneMatches) {
        napNotes.push(`Phone mismatch: website shows ${input.websitePhone}, GBP shows ${place.phone}. Update one to match.`);
      }
    } else if (gbpDigits && !siteDigits) {
      napNotes.push("Your GBP has a phone number but we couldn't find one in your website's HTML. Add a click-to-call `tel:` link in your header.");
    }

    let websiteMatches: boolean | null = null;
    if (gbpHost && siteHost) {
      websiteMatches = gbpHost === siteHost;
      if (!websiteMatches) {
        napNotes.push(`Your GBP points to ${place.website} but you ran this audit on ${input.websiteUrl}. Decide which is your canonical site and link to it from GBP.`);
      }
    } else if (!gbpHost && siteHost) {
      napNotes.push("Your GBP has no website link. Add your website URL in the Google Business Profile dashboard — it's a strong ranking signal.");
    }

    // Build issues + wins.
    const issues: string[] = [];
    const wins: string[] = [];

    if (!place.hasHours) issues.push('Your GBP listing has no opening hours set. Add them — Google heavily favors complete profiles in the local pack.');
    else wins.push('Opening hours are set on your GBP.');

    if (!place.hasPhotos) issues.push('Your GBP listing has no photos. Listings with 10+ photos get 35% more clicks (Google). Add interior/treatment-room/team photos.');
    else wins.push('GBP photos are present.');

    if (place.reviewCount === null || place.reviewCount === 0) issues.push("Your GBP has no reviews yet. Add a 'Leave us a review' link to your post-visit emails — review count is the #1 local-pack ranking factor.");
    else if (place.reviewCount < 10) issues.push(`Only ${place.reviewCount} GBP reviews. Get to 20+ — that's the threshold where you start consistently appearing in the local 3-pack.`);
    else wins.push(`${place.reviewCount} GBP reviews (${place.rating ?? '?'}★).`);

    if (!place.types.some((t) => /health|medical|spa|wellness|doctor/i.test(t))) {
      issues.push("Your GBP primary category isn't medical/wellness related. Change it to 'Medical Spa', 'Wellness Center', or 'Medical Clinic' so you appear for 'IV therapy near me' searches.");
    }

    if (place.businessStatus && place.businessStatus !== 'OPERATIONAL') {
      issues.push(`Your GBP status is "${place.businessStatus}" — Google may be downranking you. Confirm your listing is marked OPERATIONAL.`);
    }

    return {
      state: 'ok',
      place,
      napConsistency: {
        nameMatches,
        phoneMatches,
        websiteMatches,
        notes: napNotes,
      },
      issues,
      wins,
    };
  } catch (err) {
    return {
      state: 'error',
      errorMessage: err instanceof Error ? err.message : String(err),
      issues: [],
      wins: [],
    };
  }
}
