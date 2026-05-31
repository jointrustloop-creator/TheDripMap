import { Provider, BlogPost, OperatorProfile, ListingStats } from '../types';
import { supabase, isSupabaseConfigured, fetchAllRows } from './supabase';
import { MOCK_BLOG_POSTS, MOCK_LISTINGS, MOCK_CITIES } from './mock-data';
import { htmlToMarkdown, containsHtml } from './blog-utils';

// Helper to slugify strings
export const slugify = (text: string | null | undefined) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')    // Remove all non-word chars
    .replace(/--+/g, '-');      // Replace multiple - with single -
};

// Full state mapping for URL support
export const STATE_MAP: Record<string, string> = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
  'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
  'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
  'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
  'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new-hampshire': 'NH', 'new-jersey': 'NJ',
  'new-mexico': 'NM', 'new-york': 'NY', 'north-carolina': 'NC', 'north-dakota': 'ND', 'ohio': 'OH',
  'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode-island': 'RI', 'south-carolina': 'SC',
  'south-dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
  'virginia': 'VA', 'washington': 'WA', 'west-virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY',
  'district-of-columbia': 'DC', 'ontario': 'ON'
};

export const GTA_CITIES = ['Toronto', 'Ajax', 'Brampton', 'Mississauga', 'Oakville', 'Richmond Hill', 'Vaughan'];

// Reverse mapping for full names
export const REVERSE_STATE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_MAP).map(([name, abbr]) => [abbr, name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())])
);

// Helper to get state from address or city
export const getStateFromProvider = (provider: Provider): string => {
  const address = provider.address || '';
  const parts = address.split(',');
  if (parts.length > 1) {
    const statePart = parts[parts.length - 1].trim().split(' ')[0];
    if (statePart.length === 2 && statePart === statePart.toUpperCase()) {
      return statePart;
    }
  }
  
  // Fallbacks for known cities
  const cityMap: Record<string, string> = {
    'New York': 'NY', 'Los Angeles': 'CA', 'Miami': 'FL', 'Las Vegas': 'NV',
    'Austin': 'TX', 'Chicago': 'IL', 'Washington': 'DC', 'Portland': 'OR',
    'San Francisco': 'CA', 'San Diego': 'CA', 'Seattle': 'WA', 'Boston': 'MA',
    'Little Rock': 'AR', 'Birmingham': 'AL', 'Bentonville': 'AR', 'Corona': 'CA',
    'Burbank': 'CA', 'Redlands': 'CA', 'Claremont': 'CA', 'Edgewater': 'NJ',
    'Wausau': 'WI', 'Shelbyville': 'IL', 'Normal': 'IL', 'Lincoln': 'IL',
    'Oak Brook': 'IL', 'Olney': 'IL', 'Niles': 'IL', 'Morton Grove': 'IL',
    'Toronto': 'ON', 'Mississauga': 'ON', 'Brampton': 'ON', 'Vaughan': 'ON',
    'Markham': 'ON', 'Richmond Hill': 'ON', 'Oakville': 'ON', 'Burlington': 'ON'
  };
  
  return cityMap[provider.city] || 'Unknown';
};

const UNIVERSAL_IV_SERVICES = [
  'Hangover Relief',
  'NAD+ Therapy',
  'Immune Support',
  'Weight Loss',
  'Beauty & Glow',
  'Hydration',
  'Jet Lag Relief',
  'Myers\' Cocktail',
  'Athletic Recovery'
];

// Helper to enrich provider with detailed mock data for UI sections
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function enrichProvider(p: any): Provider {
  if (!p) return p;
  
  // Normalize arrays that might be strings in DB
  const rawSpecialties = (Array.isArray(p.specialties) 
    ? p.specialties 
    : (typeof p.specialties === 'string' ? p.specialties.split(',').map((s: string) => s.trim()) : []))
    .filter(s => typeof s === 'string');
    
  // Automatically qualify all providers for standard IV services by appending them to any specific ones
  const specialties = [...new Set([...rawSpecialties, ...UNIVERSAL_IV_SERVICES])];
    
  const amenities = (Array.isArray(p.amenities) 
    ? p.amenities 
    : (typeof p.amenities === 'string' ? p.amenities.split(',').map((s: string) => s.trim()) : []))
    .filter(s => typeof s === 'string');

  const imageUrl = (p.imageUrl as string) || (p.image_url as string) || (p.ImageURL as string);
  // Remove picsum fallback, let ClinicImage handle missing images
  const finalImageUrl = imageUrl && !imageUrl.includes('picsum.photos') && !imageUrl.includes('unsplash.com')
    ? imageUrl 
    : null;

  // Map working_hours to hours if available
  const rawHours = p.working_hours || p.workingHours || p.hours || {};
  const hours: Record<string, string> = {};
  
  if (rawHours && typeof rawHours === 'object') {
    Object.entries(rawHours).forEach(([day, val]) => {
      // Keep keys as provided but also ensure we have lowercase versions for easier lookup
      const dayKey = day.toLowerCase();
      if (Array.isArray(val)) {
        hours[dayKey] = val[0] || 'Closed';
      } else if (typeof val === 'string') {
        hours[dayKey] = val;
      }
    });
  }

  // Infer mobile service from name or category if not explicitly set
  const isMobile = p.mobile_service || 
                   p.type === 'Mobile' || 
                   p.name?.toLowerCase().includes('mobile') || 
                   p.category?.toLowerCase().includes('mobile') ||
                   p.description?.toLowerCase().includes('mobile iv');

  // Infer top rated status (highly rated clinics with reviews)
  const isTopRated = Number(p.rating) >= 4.8 && Number(p.review_count || p.reviews || p.reviewCount) >= 10;
  
  // Verification should only be true if explicitly set in DB or claimed
  const isVerified = !!p.is_verified || !!p.is_claimed;

  // Sanitize website - filter out common placeholders
  const rawWebsite = p.website || p.Website || p.website_url || '';
  const website = (rawWebsite.toLowerCase().includes('example.com') || 
                  rawWebsite.toLowerCase().includes('placeholder.com') ||
                  rawWebsite.length < 5) 
                  ? null 
                  : rawWebsite;

  const enriched = { 
    ...p,
    name: p.name || p.Name || p.clinic_name || 'Unnamed Clinic',
    city: p.city || 'Unknown City',
    state: p.state || p.state_abbr || p.province || '',
    website: website,
    rating: Number(p.rating) || 0,
    reviewCount: Number(p.review_count || p.reviews || p.reviewCount || p.Reviews) || 0,
    latitude: p.latitude != null ? Number(p.latitude) : undefined,
    longitude: p.longitude != null ? Number(p.longitude) : undefined,
    imageUrl: finalImageUrl,
    specialties: specialties,
    amenities: amenities,
    hours: Object.keys(hours).length > 0 ? hours : undefined,
    mobile_service: !!isMobile,
    is_verified: isVerified,
    is_top_rated: isTopRated,
    type: isMobile ? 'Mobile' : (p.type || 'In-Clinic'),
    services: specialties,
    reviews_data: p.reviews_data || [],
    medical_team: p.medical_team || [],
    special_offers: p.special_offers || []
  } as Provider;

  // Hardcoded override: Blue Cypress is In-Clinic, not Mobile
  if (enriched.name?.toLowerCase().includes('blue cypress') || enriched.slug?.includes('blue-cypress')) {
    enriched.type = 'In-Clinic';
    enriched.mobile_service = false;
  }

  return enriched;
}

/**
 * Deduplicates listings based on ID first, then by a combination of normalized Name and Address.
 * This ensures that even if the database has duplicate entries with different IDs, the user sees a clean list.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function deduplicateListings(data: any[]): any[] {
  if (!data || data.length === 0) return [];
  
  // To reach the 1,000+ provider count the user expects, 
  // we strictly trust the database IDs as the unique identifier.
  const seenIds = new Set();
  const result = [];
  
  data.forEach(item => {
    if (item && item.id && !seenIds.has(item.id)) {
      seenIds.add(item.id);
      result.push(item);
    }
  });
  
  return result;
}

export async function getListingsByCity(city: string, state?: string) {
  const isCityMatch = (pCity: string, search: string) => {
    if (!search || search === 'All') return true;
    
    // Handle "City, State" in the search string
    let searchCity = search.toLowerCase().trim();
    if (searchCity.includes(',')) {
      searchCity = searchCity.split(',')[0].trim();
    }
    
    const pc = pCity.toLowerCase().trim();
    return pc === searchCity || slugify(pc) === slugify(searchCity);
  };

  if (!isSupabaseConfigured()) {
    return MOCK_LISTINGS.filter(p => 
      isCityMatch(p.city, city) && 
      (!state || p.state?.toLowerCase() === state.toLowerCase())
    ).map(enrichProvider);
  }
  
  let searchCity = city?.trim();
  let searchState = state?.trim();

  if (!searchCity) return [];

  // Handle "City, State" or "City, ST" format from a single input
  if (searchCity.includes(',')) {
    const parts = searchCity.split(',').map(p => p.trim());
    searchCity = parts[0];
    if (!searchState && parts.length > 1) {
      searchState = parts[1];
    }
  }

  // Handle common city variations
  if (searchCity.toLowerCase() === 'new york city' || searchCity.toLowerCase() === 'nyc') {
    searchCity = 'New York';
  }

  try {
    // 1. Handle Zip Codes
    const isZip = /^\d{5}/.test(searchCity);
    if (isZip) {
      const { data: zipData, error: zipError } = await supabase
        .from('providers')
        .select('*')
        .neq('availability', false)
        .ilike('address', `%${searchCity.substring(0, 5)}%`)
        .order('is_featured', { ascending: false })
        .order('rating', { ascending: false, nullsFirst: false })
        .limit(100);
      
      if (!zipError && zipData && zipData.length > 0) {
        return zipData.map(enrichProvider);
      }
    }

    // 2. Standard Search
    const tryQuery = async (cityName: string, stateName?: string) => {
      let query = supabase.from('providers').select('*').neq('availability', false);
      
      const gtaCitiesLower = GTA_CITIES.map(c => c.toLowerCase());
      const isGTA = gtaCitiesLower.includes(cityName.toLowerCase()) || cityName.toLowerCase() === 'gta' || cityName.toLowerCase() === 'ontario';

      // Special case for Toronto & GTA
      if (isGTA) {
        query = query.in('city', GTA_CITIES).eq('country', 'Canada');
      } else {
        // HARD FILTER: City must match
        query = query.ilike('city', `%${cityName}%`);
        
        if (stateName) {
          // Resolve BOTH the full name and the abbreviation so we match providers
          // whether their state is stored as "Ontario" or "ON", regardless of which
          // form the caller passed.
          const slugState = slugify(stateName);
          let stateAbbr = STATE_MAP[slugState];
          if (!stateAbbr && stateName.trim().length === 2) stateAbbr = stateName.trim().toUpperCase();
          if (!stateAbbr) stateAbbr = stateName;
          const stateFull = REVERSE_STATE_MAP[stateAbbr.toUpperCase()] || stateName;

          const statePattern = stateFull.replace(/'/g, "''").trim();
          const abbrPattern = stateAbbr.replace(/'/g, "''").trim();

          // HARD FILTER: State must match if provided
          query = query.or(`state.ilike.${statePattern},state.ilike.${abbrPattern}`);
          
          // Enforcement: Ensure we don't match cross-country if we have a state like KY.
          // Providers table was normalized to 'United States' as the canonical US value;
          // before normalization, .eq('country', 'US') silently mismatched 530 of 587 US
          // providers, triggering the state-wide fallback and bloating city counts
          // (e.g., Houston showed 37 Texas providers instead of 8 Houston ones).
          const isUSState = Object.values(STATE_MAP).includes(stateAbbr.toUpperCase()) && stateAbbr.toUpperCase() !== 'ON';
          if (isUSState) {
            query = query.eq('country', 'United States');
          }
        }
      }
      
      return query
        .order('is_featured', { ascending: false })
        .order('rating', { ascending: false, nullsFirst: false })
        .limit(200);
    };

    const response = await tryQuery(searchCity, searchState);

    if (response.error) throw response.error;

    // 3. Fallback: If nothing found with city + state, try state only (broadened search)
    // ONLY if we didn't find anything in the exact city
    if ((!response.data || response.data.length === 0) && searchState) {
      const { getListingsByState } = await import('./data'); // Self-referential fix if needed, but we are in data.ts
      const stateListings = await getListingsByState(searchState);
      if (stateListings.length > 0) {
        return stateListings.map(enrichProvider);
      }
    }

      const dbResults = (response.data || []).map(enrichProvider);

      // Merge with mock data - apply SAME strict filtering
      const mockResults = MOCK_LISTINGS.filter(p => {
        const cityMatch = isCityMatch(p.city, searchCity);
        const stateMatch = !searchState || p.state?.toLowerCase() === searchState.toLowerCase() || 
                          (STATE_MAP[slugify(searchState)] === p.state);
                          
        // Final sanity check: if state is provided, don't allow wrong country in mock results
        if (searchState) {
          const slugState = slugify(searchState);
          const stateAbbr = STATE_MAP[slugState] || searchState;
          const isUSState = Object.values(STATE_MAP).includes(stateAbbr.toUpperCase()) && stateAbbr.toUpperCase() !== 'ON';
          if (isUSState && p.country?.toLowerCase() === 'canada') return false;
          if (!isUSState && stateAbbr.toUpperCase() === 'ON' && (p.country?.toLowerCase() === 'us' || p.country?.toLowerCase() === 'usa')) return false;
        }

        return cityMatch && stateMatch;
      }).map(enrichProvider);

    const merged = deduplicateListings([...dbResults, ...mockResults]);
    return merged;
  } catch (err) {
    console.error('Error fetching listings by city:', err);
    return [];
  }
}

export async function getListingsByState(state: string) {
  if (!isSupabaseConfigured()) {
    return MOCK_LISTINGS.filter(p => 
      p.state?.toLowerCase() === state.toLowerCase()
    ).map(enrichProvider);
  }
  
  try {
    // Match providers whether their state is stored as a 2-letter code or a full
    // name, and regardless of which form the caller passed (e.g. "ON" or "Ontario").
    const slugState = slugify(state);
    let stateAbbr = STATE_MAP[slugState];
    if (!stateAbbr && state.trim().length === 2) stateAbbr = state.trim().toUpperCase();
    if (!stateAbbr) stateAbbr = state;
    const stateFull = REVERSE_STATE_MAP[stateAbbr.toUpperCase()] || state;
    const isUSState = Object.values(STATE_MAP).includes(stateAbbr.toUpperCase()) && stateAbbr.toUpperCase() !== 'ON';

    let query = supabase
      .from('providers')
      .select('*')
      .neq('availability', false)
      .or(`state.ilike.${stateFull},state.ilike.${stateAbbr}`);

    if (isUSState) {
      query = query.ilike('country', '%United%');
    } else if (stateAbbr.toUpperCase() === 'ON' || state.toLowerCase() === 'ontario') {
      query = query.eq('country', 'Canada');
    }

    const { data, error } = await query
      .order('is_featured', { ascending: false })
      .order('rating', { ascending: false, nullsFirst: false })
      .limit(300);

    if (error) throw error;
    return (data || []).map(enrichProvider);
  } catch (err) {
    console.error('Error fetching listings by state:', err);
    return [];
  }
}

export async function getListingBySlug(slug: string) {
  const matchesSlug = (p: { name: string; city: string; state?: string; slug?: string }, s: string) => {
    const sName = slugify(p.name);
    const sWithCity = slugify(`${p.name} ${p.city}`);
    const sWithFullCity = p.state ? slugify(`${p.name} ${p.city} ${p.state}`) : '';
    
    return p.slug === s || 
           sName === s || 
           sWithCity === s || 
           (sWithFullCity && sWithFullCity === s) ||
           (s.startsWith(sName) && (s.includes(slugify(p.city || '')) || s.length > sName.length + 5));
  };

  if (!isSupabaseConfigured()) {
    const found = MOCK_LISTINGS.find(p => matchesSlug(p, slug));
    return found ? enrichProvider(found) : null;
  }
  
  try {
    // 1. Try exact slug match
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    
    let query = supabase.from('providers').select('*');
    if (isUuid) {
      query = query.or(`slug.eq."${slug}",id.eq."${slug}"`);
    } else {
      query = query.eq('slug', slug);
    }
    
    const { data: slugMatch, error: slugError } = await query.maybeSingle();

    if (!slugError && slugMatch) {
      return enrichProvider(slugMatch);
    }

    // 2. Try name match (case-insensitive fuzzy or exact slugified)
    const nameCandidate = slug.replace(/-/g, ' ');
    const firstWord = nameCandidate.split(' ')[0];
    
    // Attempt broad search based on the slug's contents
    const { data: nameMatches, error: nameError } = await supabase
      .from('providers')
      .select('*')
      .or(`name.ilike.%${nameCandidate}%,name.ilike.%${firstWord}%`)
      .limit(100);

    if (!nameError && nameMatches && nameMatches.length > 0) {
      const match = nameMatches.find(p => matchesSlug(p, slug));
      if (match) return enrichProvider(match);
    }
    
    // 2b. Broadest search: if it still fails, just look at the most rated ones in the whole DB
    const { data: widerCandidates, error: widerError } = await supabase
      .from('providers')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('rating', { ascending: false, nullsFirst: false })
      .limit(1000);

    if (!widerError && widerCandidates) {
      const match = widerCandidates.find(p => matchesSlug(p, slug));
      if (match) return enrichProvider(match);
    }

    // 3. Last fallback to mock data
    const found = MOCK_LISTINGS.find(p => matchesSlug(p, slug));
    return found ? enrichProvider(found) : null;
  } catch (err) {
    console.error('Error in getListingBySlug:', err);
    const found = MOCK_LISTINGS.find(p => matchesSlug(p, slug));
    return found ? enrichProvider(found) : null;
  }
}

export async function getAllCities(): Promise<{ city: string, state: string, stateAbbr: string, count: number }[]> {
  const getMockCities = () => {
    const cityCounts = new Map<string, { city: string, stateAbbr: string, count: number }>();
    MOCK_LISTINGS.forEach(p => {
      const stateAbbr = p.state?.toUpperCase() || 'US';
      const key = `${p.city}|${stateAbbr}`;
      const existing = cityCounts.get(key);
      if (existing) {
        existing.count++;
      } else {
        cityCounts.set(key, { city: p.city, stateAbbr, count: 1 });
      }
    });
    return Array.from(cityCounts.values()).map(c => ({
      ...c,
      state: REVERSE_STATE_MAP[c.stateAbbr] || c.stateAbbr
    })).sort((a, b) => b.count - a.count);
  };

  if (!isSupabaseConfigured()) return getMockCities();
  
  try {
    // Select only needed columns to keep payload small and fast
    const response = await supabase
      .from('providers')
      .select('id, city, state')
      .order('id');

    if (response.error || !response.data || response.data.length === 0) {
      return getMockCities();
    }

    const data = response.data;
    const seenIds = new Set<string>();
    const cityCounts = new Map<string, { city: string, stateAbbr: string, count: number }>();
    
    data?.forEach(item => {
      const cityVal = item.city;
      const stateVal = item.state; // Use 'state' since 'state_abbr' doesn't exist
      if (!cityVal || !stateVal || !item.id) return;
      
      if (seenIds.has(item.id)) return;
      seenIds.add(item.id);

      // Normalize state to abbreviation if possible
      let stateAbbr = stateVal.trim().toUpperCase();
      if (stateAbbr.length > 2) {
        const slugState = slugify(stateVal);
        stateAbbr = STATE_MAP[slugState] || stateAbbr;
      }
      
      const cityKey = `${cityVal.trim()}|${stateAbbr}`;
      const existing = cityCounts.get(cityKey);
      if (existing) {
        existing.count++;
      } else {
        cityCounts.set(cityKey, { 
          city: cityVal.trim(), 
          stateAbbr: stateAbbr, 
          count: 1 
        });
      }
    });

    return Array.from(cityCounts.values())
      .filter(c => c.count >= 1) // Any city with at least one unique clinic should be showable if navigated to
      .map(c => ({
        ...c,
        state: REVERSE_STATE_MAP[c.stateAbbr] || c.stateAbbr
      }))
      .sort((a, b) => b.count - a.count);
  } catch {
    console.error('Supabase error in getAllCities');
    return [];
  }
}

export async function getTopHubs(limit: number = 8) {
  const getMockHubs = () => {
    const cityCounts: Record<string, { city: string, state: string, count: number }> = {};
    MOCK_LISTINGS.forEach(p => {
      const key = p.city;
      if (!cityCounts[key]) {
        cityCounts[key] = { city: p.city, state: p.state || '', count: 0 };
      }
      cityCounts[key].count++;
    });
    return Object.values(cityCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(h => ({
        city: h.city,
        state: h.state,
        slug: slugify(h.city),
        count: h.count
      }));
  };

  if (!isSupabaseConfigured()) return getMockHubs();
  
  try {
    // 1. Get explicitly defined hubs from the cities table
    const { data: hubData } = await supabase
      .from('cities')
      .select('name, state, slug');

    if (!hubData || hubData.length === 0) return getMockHubs();

    // 2. Get counts from providers table
    const { data: providers } = await supabase
      .from('providers')
      .select('city');

    const counts: Record<string, number> = {};
    providers?.forEach(p => {
      const cityName = p.city?.trim();
      if (cityName) {
        counts[cityName] = (counts[cityName] || 0) + 1;
      }
    });

    // 3. Merge and filter
    const hubs = hubData
      .map(hub => ({
        city: hub.name,
        state: hub.state || '',
        slug: hub.slug,
        count: counts[hub.name] || 0
      }))
      .filter(hub => hub.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    if (hubs.length === 0) return getMockHubs();
    return hubs;

  } catch (err) {
    console.warn('Error in getTopHubs:', err);
    return getMockHubs();
  }
}

export async function getCitiesFromListings() {
  const allCities = await getAllCities();
  return allCities
    .filter(c => c.count >= 3)
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
}

export async function getPopularCities() {
  // Use the SAME query as the city page (getListingsByCity) so the count shown
  // in the footer matches the count the user sees when they click through.
  // For major metros this is metro-inclusive (Houston includes Tomball/Cypress,
  // NYC includes outer boroughs, Toronto/GTA includes Mississauga/Oakville/etc).
  // Curated by actual provider density. Chicago (5) dropped in favor of Las Vegas (15)
  // which also has the highest hangover-IV search intent of any US city.
  const popular = [
    { slug: 'new-york',    name: 'New York',       cityArg: 'New York',     stateArg: 'New York' },
    { slug: 'houston',     name: 'Houston',        cityArg: 'Houston',      stateArg: 'Texas' },
    { slug: 'san-diego',   name: 'San Diego',      cityArg: 'San Diego',    stateArg: 'California' },
    { slug: 'clearwater',  name: 'Clearwater',     cityArg: 'Clearwater',   stateArg: 'Florida' },
    { slug: 'los-angeles', name: 'Los Angeles',    cityArg: 'Los Angeles',  stateArg: 'California' },
    { slug: 'toronto',     name: 'Toronto & GTA',  cityArg: 'Toronto',      stateArg: 'Ontario' },
    { slug: 'las-vegas',   name: 'Las Vegas',      cityArg: 'Las Vegas',    stateArg: 'Nevada' },
    { slug: 'washington',  name: 'Washington DC',  cityArg: 'Washington',   stateArg: 'District of Columbia' },
  ];

  const results = await Promise.all(
    popular.map(async (p) => {
      try {
        const listings = await getListingsByCity(p.cityArg, p.stateArg);
        return { name: p.name, slug: p.slug, count: listings.length };
      } catch {
        return { name: p.name, slug: p.slug, count: 0 };
      }
    })
  );

  return results;
}

export async function getCitiesWithListings() {
  if (!isSupabaseConfigured()) {
    const uniqueCities = [...new Set(MOCK_LISTINGS.map(p => p.city))];
    return uniqueCities.filter(Boolean).sort();
  }

  try {
    const { data, error } = await supabase
      .from('providers')
      .select('city')
      .not('city', 'is', null)
      .order('city');

    if (error || !data) return [];

    const uniqueCities = [...new Set(data.map(p => p.city))];
    return uniqueCities.filter(Boolean);
  } catch (err) {
    console.error('Error in getCitiesWithListings:', err);
    return [];
  }
}

export async function getAllStates() {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await supabase
      .from('states')
      .select('*');

    if (error) throw error;
    if (data && data.length > 0) {
      return data.map(s => ({
        state: s.name,
        stateCode: s.code || s.state_code || s.abbr || 'US',
        count: s.listings_count || 0
      })).sort((a, b) => b.count - a.count);
    }
  } catch (err) {
    console.error('Supabase error fetching all states:', err);
  }

  return [];
}

function getServiceFilter(service: string): string {
  const s = service.toLowerCase();
  
  // Broad list of keywords for core IV services that all providers offer
  const coreServices = [
    'hangover', 'nad', 'immune', 'beauty', 'glow', 'hydration', 'hydrate',
    'recovery', 'myers', 'weight', 'jet lag', 'travel', 'fatigue', 
    'wellness', 'drip', 'iv', 'vitamin', 'shot', 'boost', 'nutrient'
  ];
  
  const isCore = coreServices.some(kw => s.includes(kw));

  if (isCore) {
    // If it's a core service, we want to match all providers 
    // because they are all automatically qualified to provide these services.
    // Return a filter that matches any provider record (ID and Name are always present).
    return `id.not.is.null,name.not.is.null,rating.gte.0,description.ilike.%${s}%,name.ilike.%${s}%`;
  }

  if (s.includes('hangover')) {
    return "name.ilike.%hangover%,description.ilike.%hangover%,name.ilike.%rehydrate%,description.ilike.%rehydrate%,name.ilike.%detox%,description.ilike.%detox%,subtypes.cs.{\"Hangover\"},subtypes.cs.{\"Hydration\"},subtypes.cs.{\"Wellness\"},description.ilike.%hydration%,description.ilike.%fluids%,description.ilike.%saline%,name.ilike.%wellness%,name.ilike.%drip%,description.ilike.%drip%";
  }
  if (s.includes('nad')) {
    return "name.ilike.%NAD%,description.ilike.%NAD%,subtypes.cs.{\"NAD\"},description.ilike.%nicotinamide%,description.ilike.%anti-aging%,description.ilike.%longevity%";
  }
  if (s.includes('immune')) {
    return "name.ilike.%immune%,description.ilike.%immune%,name.ilike.%immunity%,description.ilike.%immunity%,name.ilike.%shield%,description.ilike.%shield%,name.ilike.%defense%,name.ilike.%defender%,description.ilike.%defense%,subtypes.cs.{\"Immune\"},subtypes.cs.{\"Wellness\"},subtypes.cs.{\"Vitamin C\"},subtypes.cs.{\"Zinc\"},subtypes.cs.{\"Glutathione\"},name.ilike.%vitamin c%";
  }
  if (s.includes('beauty') || s.includes('glow')) {
    return "name.ilike.%beauty%,name.ilike.%glow%,description.ilike.%beauty%,subtypes.cs.{\"Beauty\"},subtypes.cs.{\"Skin\"}";
  }
  if (s.includes('hydration')) {
    return "name.ilike.%hydration%,name.ilike.%hydrate%,description.ilike.%hydration%";
  }
  if (s.includes('recovery')) {
    return "name.ilike.%recovery%,description.ilike.%recovery%,subtypes.cs.{\"Athletic\"},subtypes.cs.{\"Sport\"},subtypes.cs.{\"Performance\"},subtypes.cs.{\"Muscle\"}";
  }
  if (s.includes('myers')) {
    return "name.ilike.%myers%,description.ilike.%myers%,subtypes.cs.{\"Myers\"}";
  }
  if (s.includes('weight')) {
    return "name.ilike.%weight%,description.ilike.%weight%,subtypes.cs.{\"Weight\"},subtypes.cs.{\"Metabolism\"},description.ilike.%metabolism%,description.ilike.%slim%,description.ilike.%fat burn%,name.ilike.%lipo%,description.ilike.%MIC%,name.ilike.%MIC%";
  }
  if (s.includes('jet lag') || s.includes('travel') || s.includes('fatigue')) {
    return "name.ilike.%jet%,description.ilike.%jet%,description.ilike.%travel%,description.ilike.%fatigue%,description.ilike.%energy%,name.ilike.%travel%,subtypes.cs.{\"Travel\"},subtypes.cs.{\"Energy\"},subtypes.cs.{\"Recovery\"},specialties.ilike.%jet%,specialties.ilike.%travel%,specialties.ilike.%energy%,subtypes.ilike.%travel%,subtypes.ilike.%energy%,description.ilike.%hydration%,name.ilike.%wellness%";
  }
  
  if (s.includes('peptide')) {
    return "name.ilike.%peptide%,description.ilike.%peptide%,category.ilike.%peptide%,specialties.cs.{\"Peptide Therapy\"},description.ilike.%semaglutide%,description.ilike.%tirzepatide%,description.ilike.%sermorelin%,description.ilike.%BPC-157%,description.ilike.%GLP-1%";
  }

  // Default fallback
  const coreKeyword = service.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '');
  return `name.ilike.%${coreKeyword}%,category.ilike.%${coreKeyword}%,description.ilike.%${coreKeyword}%`;
}

export async function getListingsByService(service: string, limit: number = 4) {
  if (!isSupabaseConfigured()) return [];
  
  try {
    const filter = getServiceFilter(service);
    // Increase internal limit to allow for brand-level deduplication
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .neq('availability', false)
      .or(filter)
      .order('is_featured', { ascending: false })
      .order('rating', { ascending: false, nullsFirst: false })
      .limit(2000);

    if (error) throw error;
    
    // Deduplicate to ensure brand diversity while allowing multiple locations
    const uniqueListings = deduplicateListings(data || []).map(enrichProvider);

    return uniqueListings.slice(0, limit);
  } catch (err) {
    console.error('Supabase error in getListingsByService:', err);
    return [];
  }
}

export async function searchListings(query: string, city?: string) {
  const isCityMatch = (pCity: string, search: string | undefined) => {
    if (!search || search === 'All') return true;
    const s = search.toLowerCase().trim();
    const pc = pCity.toLowerCase().trim();
    return pc === s || slugify(pc) === slugify(s) || pc.includes(s) || s.includes(pc);
  };

  if (!isSupabaseConfigured()) {
    const searchTerm = query.toLowerCase().trim();
    return MOCK_LISTINGS.filter(p => {
      const matchCity = isCityMatch(p.city, city);
      const matchQuery = !searchTerm || 
        p.name.toLowerCase().includes(searchTerm) || 
        p.description.toLowerCase().includes(searchTerm) ||
        p.specialties.some(s => s.toLowerCase().includes(searchTerm));
      return matchCity && matchQuery;
    }).map(enrichProvider);
  }

  try {
    let q = supabase.from('providers').select('*').neq('availability', false);

    if (city && city !== 'All') {
      const gtaCitiesLower = GTA_CITIES.map(c => c.toLowerCase());
      const isGTA = gtaCitiesLower.includes(city.toLowerCase()) || city.toLowerCase() === 'gta' || city.toLowerCase() === 'ontario';
      
      if (isGTA) {
        q = q.in('city', GTA_CITIES).eq('country', 'Canada');
      } else {
        q = q.ilike('city', `%${city}%`);
      }
    }
    
    if (query && query.trim() !== '') {
      const searchTerm = `%${query.trim()}%`;
      const serviceFilter = getServiceFilter(query.trim());
      q = q.or(`name.ilike.${searchTerm},description.ilike.${searchTerm},city.ilike.${searchTerm},${serviceFilter}`);
    }

    const { data, error } = await q
      .order('is_featured', { ascending: false })
      .order('rating', { ascending: false, nullsFirst: false })
      .limit(2000);
    if (error) throw error;
    
    let results = data || [];
    if (results.length === 0) {
      const searchTerm = query.toLowerCase().trim();
      results = MOCK_LISTINGS.filter(p => {
        const matchCity = isCityMatch(p.city, city);
        const matchQuery = !searchTerm || 
          p.name.toLowerCase().includes(searchTerm) || 
          p.description.toLowerCase().includes(searchTerm) ||
          p.specialties.some(s => s.toLowerCase().includes(searchTerm));
        return matchCity && matchQuery;
      });
    }

    // Deduplicate by content to ensure clean search results
    return deduplicateListings(results).map(enrichProvider);
  } catch {
    // Fallback on error
    return [];
  }
}

export async function getFeaturedListings(limit: number = 6, city?: string) {
  const isCityMatch = (pCity: string, search: string | undefined) => {
    if (!search || search === 'All') return true;
    const s = search.toLowerCase().trim();
    const pc = pCity.toLowerCase().trim();
    return pc === s || slugify(pc) === slugify(s) || pc.includes(s) || s.includes(pc);
  };

  if (!isSupabaseConfigured()) {
    return MOCK_LISTINGS
      .filter(p => p.is_featured && isCityMatch(p.city, city))
      .slice(0, limit)
      .map(enrichProvider);
  }
  
  try {
    let q = supabase
      .from('providers')
      .select('*')
      .neq('availability', false)
      .eq('is_featured', true);

    if (city && city !== 'All') {
      q = q.ilike('city', `%${city}%`);
    }

    const { data, error } = await q
      .order('is_featured', { ascending: false })
      .order('rating', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) throw error;
    
    if (data && data.length > 0) {
      return deduplicateListings(data).map(enrichProvider);
    }
    
    // Fallback to mock if no DB results
    return MOCK_LISTINGS
      .filter(p => p.is_featured && isCityMatch(p.city, city))
      .slice(0, limit)
      .map(enrichProvider);
  } catch (err) {
    console.warn('Supabase error in getFeaturedListings:', err);
    return MOCK_LISTINGS
      .filter(p => p.is_featured && isCityMatch(p.city, city))
      .slice(0, limit)
      .map(enrichProvider);
  }
}

export async function getSiteStats() {
  const getMockStats = () => {
    const citiesSet = new Set();
    const statesSet = new Set();
    let totalReviews = 0;
    const stateCounts: Record<string, number> = {};
    const cityCounts: Record<string, { city: string, state: string, count: number }> = {};

    MOCK_LISTINGS.forEach(p => {
      if (p.city && p.state) {
        citiesSet.add(`${p.city.toLowerCase()}-${p.state.toLowerCase()}`);
        const cityKey = `${p.city}-${p.state}`;
        if (!cityCounts[cityKey]) {
          cityCounts[cityKey] = { city: p.city, state: p.state, count: 0 };
        }
        cityCounts[cityKey].count++;
      }
      if (p.state) {
        statesSet.add(p.state.toLowerCase());
        stateCounts[p.state] = (stateCounts[p.state] || 0) + 1;
      }
      // Use reviewCount if it exists, otherwise 0
      totalReviews += (p.reviewCount || 0);
    });

    const topStates = Object.entries(stateCounts)
      .map(([name, count]) => ({
        name,
        count,
        share: `${((count / MOCK_LISTINGS.length) * 100).toFixed(1)}%`
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topCities = Object.values(cityCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      total: MOCK_LISTINGS.length,
      cities: citiesSet.size,
      states: statesSet.size,
      avgRating: '4.9',
      totalReviews: totalReviews || 5000,
      topStates,
      topCities
    };
  };

  if (!isSupabaseConfigured()) {
    return getMockStats();
  }

  try {
    const { count: total } = await supabase
      .from('providers')
      .select('*', { 
        count: 'exact', 
        head: true 
      });

    const { data: allData } = await supabase
      .from('providers')
      .select('city, state, reviews, rating')
    
    if (!allData || allData.length === 0) return getMockStats();

    // Calculate unique cities and states
    const citiesSet = new Set();
    const statesSet = new Set();
    let totalReviews = 0;
    let ratingSum = 0;
    let ratingCount = 0;

    // For top cities/states logic
    const stateCounts: Record<string, number> = {};
    const cityCounts: Record<string, { city: string, state: string, count: number }> = {};

    allData.forEach(r => {
      const city = r.city?.trim();
      const state = r.state?.trim();

      if (city && state) {
        citiesSet.add(`${city.toLowerCase()}-${state.toLowerCase()}`);

        const cityKey = `${city}-${state}`;
        if (!cityCounts[cityKey]) {
          cityCounts[cityKey] = { city, state, count: 0 };
        }
        cityCounts[cityKey].count++;
      }

      if (state) {
        statesSet.add(state.toLowerCase());
        stateCounts[state] = (stateCounts[state] || 0) + 1;
      }

      // Number() cast — reviews + rating come back as strings sometimes
      const reviewsNum = Number(r.reviews) || 0;
      totalReviews += reviewsNum;

      const ratingNum = Number(r.rating);
      if (!Number.isNaN(ratingNum) && ratingNum > 0) {
        ratingSum += ratingNum;
        ratingCount += 1;
      }
    });

    const avgRating = ratingCount > 0 ? (ratingSum / ratingCount).toFixed(1) : '4.9';

    const topStates = Object.entries(stateCounts)
      .map(([name, count]) => ({
        name,
        count,
        share: `${((count / allData.length) * 100).toFixed(1)}%`
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topCities = Object.values(cityCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const fallback = getMockStats();
    return {
      total: total || fallback.total,
      cities: citiesSet.size || fallback.cities,
      states: statesSet.size || fallback.states,
      avgRating, // computed from real data above, not hardcoded
      totalReviews: totalReviews || fallback.totalReviews,
      topStates,
      topCities
    }
  } catch (err) {
    console.error('Error in getSiteStats:', err);
    return getMockStats();
  }
}

export async function getListingStats(): Promise<ListingStats> {
  const stats = await getSiteStats();
  return {
    totalListings: stats.total,
    totalCities: stats.cities,
    totalStates: stats.states,
    avgRating: parseFloat(stats.avgRating),
    isLive: true
  };
}

export async function getBlogPosts() {
  const configured = isSupabaseConfigured();
  
  if (configured) {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('date', { ascending: false });

      if (!error && data && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data as any[]).map(post => {
          let content = post.content || post.body || post.markdown || '';

          // Strip any HTML comments (e.g. leftover content-injection markers like
          // <!-- PHASE2_DEPTH_END -->) so they never leak into the rendered post.
          content = content.replace(/<!--[\s\S]*?-->/g, '');

          // Self-heal: convert to markdown if HTML is detected
          if (containsHtml(content)) {
            content = htmlToMarkdown(content);
          }

          const author = post.author || post.author_name || 'TheDripMap Team';

          return {
            ...post,
            author,
            content,
            metaTitle: post.metaTitle || post.meta_title || post.title || '',
            metaDescription: post.metaDescription || post.meta_description || post.excerpt || post.description || '',
            excerpt: post.excerpt || post.meta_description || '',
            imageUrl: post.imageUrl || post.image_url || post.ImageURL || null,
            authorImageUrl: post.authorImageUrl || post.author_image_url || null,
            lastUpdated: post.lastUpdated || post.last_updated || null,
            reviewedBy: post.reviewedBy || post.reviewed_by || null,
            relatedCities: post.relatedCities || post.related_cities || [],
            relatedClinics: post.relatedClinics || post.related_clinics || []
          };
        }).map(post => {
          // Runtime Categorization Fallback
          if (!post.category || post.category === 'Educational' || post.category === 'Local' || post.category === 'Use-Case') {
            const slug = post.slug;
            if (['myers-cocktail', 'nad-plus', 'glutathione', 'iv-therapy-for-athletes', 'iv-therapy-for-migraines', 'iv-therapy-for-chronic-fatigue'].includes(slug)) return { ...post, category: 'Treatment Guides' };
            if (['iv-therapy-anxiety-stress', 'iv-therapy-long-covid', 'iv-therapy-pregnancy', 'iv-therapy-immune-support'].includes(slug)) return { ...post, category: 'Conditions & Symptoms' };
            if (['iv-therapy-toronto', 'nad-plus-toronto', 'mobile-iv-therapy-toronto', 'hangover-iv-toronto'].includes(slug)) return { ...post, category: 'City Guides' };
            if (['iv-therapy-weight-loss', 'iv-therapy-anti-aging'].includes(slug)) return { ...post, category: 'Lifestyle & Wellness' };
            if (['iv-therapy-insurance-coverage-canada'].includes(slug)) return { ...post, category: 'Cost & Insurance' };
          }
          return post;
        }) as BlogPost[];
      }
    } catch {
      // Silent fail to fallback
    }
  }

  return MOCK_BLOG_POSTS;
}

export async function getBlogPostBySlug(slug: string) {
  const configured = isSupabaseConfigured();
  
  if (configured) {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .single();

        if (!error && data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const post = data as any;
          let content = post.content || post.body || post.markdown || '';

          // Strip any HTML comments (e.g. leftover content-injection markers like
          // <!-- PHASE2_DEPTH_END -->) so they never leak into the rendered post.
          content = content.replace(/<!--[\s\S]*?-->/g, '');

          // Self-heal: convert to markdown if HTML is detected
          if (containsHtml(content)) {
            content = htmlToMarkdown(content);
          }

          const author = post.author || post.author_name || 'TheDripMap Team';

          return {
            ...post,
            author,
            content: String(content),
            metaTitle: post.metaTitle || post.meta_title || post.title || '',
            metaDescription: post.metaDescription || post.meta_description || post.excerpt || post.description || '',
            excerpt: post.excerpt || post.meta_description || '',
            imageUrl: post.imageUrl || post.image_url || post.ImageURL || null,
            authorImageUrl: post.authorImageUrl || post.author_image_url || null,
            lastUpdated: post.lastUpdated || post.last_updated || null,
            reviewedBy: post.reviewedBy || post.reviewed_by || null,
            relatedCities: post.relatedCities || post.related_cities || [],
            relatedClinics: post.relatedClinics || post.related_clinics || []
          } as BlogPost;
        }
    } catch (_err) {
      console.error('Supabase error fetching blog post by slug:', _err);
    }
  }

  return MOCK_BLOG_POSTS.find(p => p.slug === slug) || null;
}

export async function getCityBySlug(slug: string) {
  if (!isSupabaseConfigured()) {
    const found = MOCK_CITIES.find(c => slugify(c.city) === slug);
    return found ? { 
      name: found.city, 
      state: found.state, 
      slug: slugify(found.city),
      id: `mock-${slug}`
    } : null;
  }

  try {
    // Use ilike for case-insensitive slug match
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .ilike('slug', slug)
      .maybeSingle();

    if (error || !data) {
      // Extended fallback: try matching by name if slug fails
      const namePattern = slug.replace(/-/g, ' ');
      const { data: nameMatch } = await supabase
        .from('cities')
        .select('*')
        .ilike('name', `%${namePattern}%`)
        .limit(1)
        .maybeSingle();
      
      if (nameMatch) return nameMatch;

      // Final fallback to mock
      const found = MOCK_CITIES.find(c => slugify(c.city) === slug);
      return found ? { 
        name: found.city, 
        state: found.state, 
        slug: slugify(found.city),
        id: `mock-${slug}`
      } : null;
    }
    return data;
  } catch (err) {
    console.warn('Error in getCityBySlug:', err);
    const found = MOCK_CITIES.find(c => slugify(c.city) === slug);
    return found ? { 
      name: found.city, 
      state: found.state, 
      slug: slugify(found.city),
      id: `mock-${slug}`
    } : null;
  }
}

import { USE_CASES } from './use-cases';

export async function getUseCaseBySlug(slug: string) {
  return USE_CASES.find(u => u.slug === slug) || null;
}

export async function getAllUseCases() {
  return USE_CASES;
}

export async function getAllListings() {
  if (!isSupabaseConfigured()) return MOCK_LISTINGS.map(enrichProvider);

  try {
    // PostgREST gateway caps single responses at 1,000 rows regardless
    // of the .limit() value sent. We paginate via fetchAllRows() so the
    // sitemap, search index, and any other consumer gets every provider.
    const data = await fetchAllRows(() =>
      supabase
        .from('providers')
        .select('*')
        .neq('availability', false)
        .order('is_featured', { ascending: false })
        .order('rating', { ascending: false, nullsFirst: false })
    );

    const results = data && data.length > 0 ? data : MOCK_LISTINGS;
    return results.map(enrichProvider);
  } catch {
    return MOCK_LISTINGS.map(enrichProvider);
  }
}

export async function getListingsByIds(ids: string[]) {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .neq('availability', false)
      .in('id', ids)
      .order('is_featured', { ascending: false })
      .order('rating', { ascending: false, nullsFirst: false });

    if (error) throw error;
    return (data || []).map(enrichProvider);
  } catch (err) {
    console.error('Supabase error fetching listings by ids:', err);
    return [];
  }
}

export async function getListingsByServiceAndCity(service: string, city: string, limit: number = 4) {
  if (!isSupabaseConfigured()) return [];

  try {
    const filter = getServiceFilter(service);
    // Use a broader city match (ilike %city%) to handle "New York" vs "New York City"
    const cityPattern = `%${city}%`;

    const response = await supabase
      .from('providers')
      .select('*')
      .neq('availability', false)
      .ilike('city', cityPattern)
      .or(filter)
      .order('is_featured', { ascending: false })
      .order('rating', { ascending: false, nullsFirst: false })
      .limit(2000);

    const error = response.error;
    let data = response.data;

    if (error) throw error;

    // Fallback: If no specific results in this city, try a broader wellness filter for the same city
    if (!data || data.length === 0) {
      console.log(`No specific results for ${service} in ${city}, trying fallback broad search...`);
      const broadFilter = "name.ilike.%hydration%,description.ilike.%hydration%,name.ilike.%wellness%,description.ilike.%wellness%,name.ilike.%drip%,description.ilike.%iv%";
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('providers')
        .select('*')
        .neq('availability', false)
        .ilike('city', cityPattern)
        .or(broadFilter)
        .order('is_featured', { ascending: false })
        .order('rating', { ascending: false, nullsFirst: false })
        .limit(2000);
      
      if (!fallbackError && fallbackData && fallbackData.length > 0) {
        data = fallbackData;
      }
    }
    
    // Deduplicate while allowing multiple locations
    const dbResults = deduplicateListings(data || []).map(enrichProvider);

    // Merge with mock data for this city and service
    const isCityMatch = (pCity: string, search: string) => {
      const s = search.toLowerCase().trim();
      const pc = pCity.toLowerCase().trim();
      return pc === s || slugify(pc) === slugify(s) || pc.includes(s) || s.includes(pc);
    };

    const mockResults = MOCK_LISTINGS.filter(p => {
      const cityMatch = isCityMatch(p.city, city);
      const serviceMatch = !service || 
        p.specialties.some(s => s.toLowerCase().includes(service.toLowerCase())) ||
        p.name.toLowerCase().includes(service.toLowerCase());
      return cityMatch && serviceMatch;
    }).map(enrichProvider);

    const merged = deduplicateListings([...dbResults, ...mockResults]);

    // Clamp to the requested limit
    return merged.slice(0, limit);
  } catch (err) {
    console.error('Supabase error in getListingsByServiceAndCity:', err);
    return [];
  }
}

export async function getOperatorProfiles() {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await supabase
      .from('operator_profiles')
      .select('*');

    if (error) throw error;
    // DB column is `clinic_id` (snake_case). Some consumers read `clinicId` (camelCase).
    // Mirror both so either lookup style works.
    return (data || []).map((p: Record<string, unknown>) => ({
      ...p,
      clinicId: p.clinicId ?? p.clinic_id,
      clinic_id: p.clinic_id ?? p.clinicId,
    })) as OperatorProfile[];
  } catch {
    return [];
  }
}

export type ApprovedTestimonial = {
  id: string;
  author_name: string;
  rating: number;
  title: string | null;
  body: string;
  visit_date: string | null;
  approved_at: string | null;
  created_at: string;
};

export async function getApprovedTestimonials(providerId: string, limit: number = 12): Promise<ApprovedTestimonial[]> {
  if (!isSupabaseConfigured() || !providerId) return [];
  try {
    const { data, error } = await supabase
      .from('testimonials')
      .select('id, author_name, rating, title, body, visit_date, approved_at, created_at')
      .eq('provider_id', providerId)
      .eq('status', 'approved')
      .order('approved_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      if (error.code === '42P01') return [];
      console.error('Supabase error fetching testimonials:', error);
      return [];
    }
    return (data || []) as ApprovedTestimonial[];
  } catch (err) {
    console.error('Error in getApprovedTestimonials:', err);
    return [];
  }
}

export async function getSimilarClinics(currentSlug: string, city: string, state: string, limit: number = 3) {
  if (!isSupabaseConfigured()) return [];
  
  try {
    // 1. Try to find other clinics in the same city
    const { data: cityData, error: cityError } = await supabase
      .from('providers')
      .select('*')
      .neq('availability', false)
      .eq('city', city)
      .neq('slug', currentSlug)
      .order('is_featured', { ascending: false })
      .order('rating', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (cityError) throw cityError;

    let results = (cityData || []).map(enrichProvider);

    // 2. If not enough in the city, find some in the same state
    if (results.length < limit) {
      const remaining = limit - results.length;
      const { data: stateData, error: stateError } = await supabase
        .from('providers')
        .select('*')
        .neq('availability', false)
        .eq('state', state)
        .neq('city', city) // Don't pick up city clinics again
        .neq('slug', currentSlug)
        .order('is_featured', { ascending: false })
        .order('rating', { ascending: false, nullsFirst: false })
        .limit(remaining);

      if (stateError) throw stateError;
      results = [...results, ...(stateData || []).map(enrichProvider)];
    }

    return results;
  } catch (err) {
    console.error('Supabase error in getSimilarClinics:', err);
    return [];
  }
}

export async function getCityData(citySlug: string) {
  if (!isSupabaseConfigured()) return null;
  
  try {
    const { data, error } = await supabase
      .from('cities')
      .select('id, name, slug, state, content, meta_title, meta_description, listings_count')
      .ilike('slug', citySlug)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') { // Ignore "no rows found" error
        console.error('Supabase error in getCityData:', error);
      }
      return null;
    }
    
    return data;
  } catch {
    console.error('Network error in getCityData');
    return null;
  }
}
