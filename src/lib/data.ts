import { calculateDistance } from './geo';
import { Provider, BlogPost, OperatorProfile, ListingStats } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';
import { MOCK_BLOG_POSTS } from './mock-data';

const EXCLUDED_CATEGORIES = [
  'restaurants', 
  'Brewery', 
  'Tool store', 
  'cafes', 
  'bars', 
  'coffee shops', 
  'Juice shop', 
  'Açaí shop', 
  'Mobile caterer', 
  'Corporate office',
  'Brewpub',
  'Bakery',
  'Ice cream shop',
  'Dessert shop',
  'Wine bar',
  'Pub',
  'Grill',
  'Coffee',
  'Roasters',
  'Cafe',
  'Coffee shop',
  'Coffee roasters'
];

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
  'district-of-columbia': 'DC'
};

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
    'Oak Brook': 'IL', 'Olney': 'IL', 'Niles': 'IL', 'Morton Grove': 'IL'
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
  if (!isSupabaseConfigured()) return [];
  
  let searchCity = city?.trim();
  let searchState = state?.trim();

  // Handle "City, State" or "City, ST" format from a single input
  if (searchCity && searchCity.includes(',')) {
    const parts = searchCity.split(',').map(p => p.trim());
    searchCity = parts[0];
    if (!searchState && parts.length > 1) {
      searchState = parts[1];
    }
  }

  // Handle common city variations
  if (searchCity?.toLowerCase() === 'new york city' || searchCity?.toLowerCase() === 'nyc') {
    searchCity = 'New York';
  }

  try {
    // 1. Handle Zip Codes
    const isZip = /^\d{5}/.test(searchCity);
    if (isZip) {
      const { data: zipData, error: zipError } = await supabase
        .from('providers')
        .select('*')
        .ilike('address', `%${searchCity.substring(0, 5)}%`)
        .limit(100);
      
      if (!zipError && zipData && zipData.length > 0) {
        return zipData.map(enrichProvider);
      }
    }

    // 2. Standard Search
    const tryQuery = async (cityName: string, stateName?: string) => {
      let query = supabase.from('providers').select('*').ilike('city', `%${cityName}%`);
      
      if (stateName) {
        // Use mapping to get the abbreviation if a full name was provided
        const slugState = slugify(stateName);
        const stateAbbr = STATE_MAP[slugState] || stateName;
        
        // Use actual names, not slugs, for the ilike search to match DB content
        const statePattern = stateName.replace(/'/g, "''").trim();
        const abbrPattern = stateAbbr.replace(/'/g, "''").trim();
        
        // Remove state_abbr from query as it doesn't exist in the providers table
        query = query.or(`state.ilike.%${statePattern}%,state.ilike.%${abbrPattern}%`);
      }
      
      return query.order('reviews', { ascending: false }).limit(200);
    };

    let response = await tryQuery(searchCity, searchState);

    if (response.error) throw response.error;

    // 3. Fallback: If nothing found with city + state, try just city
    if ((!response.data || response.data.length === 0) && searchState) {
      console.log(`Fallback: No results for ${searchCity} in ${searchState}, trying city only...`);
      response = await tryQuery(searchCity);
    }

    // 4. Broad Fallback: Search by name or address if city search fails
    if (!response.data || response.data.length === 0) {
      if (searchCity.length >= 3) {
        console.log(`Broad Fallback: Searching name/address for ${searchCity}...`);
        const { data: broadData } = await supabase
          .from('providers')
          .select('*')
          .or(`name.ilike.%${searchCity}%,address.ilike.%${searchCity}%,city.ilike.%${searchCity}%`)
          .limit(50);
        
        if (broadData && broadData.length > 0) {
          const seenIds = new Set<string>();
          return broadData
            .filter(item => item.id && !seenIds.has(item.id))
            .map(item => {
              seenIds.add(item.id);
              return enrichProvider(item);
            });
        }
      }
    }

    if (response.data && response.data.length > 0) {
      const seenIds = new Set<string>();
      return response.data
        .filter(item => item.id && !seenIds.has(item.id))
        .map(item => {
          seenIds.add(item.id);
          return enrichProvider(item);
        });
    }
  } catch (err) {
    console.error('Supabase error in getListingsByCity:', JSON.stringify(err, null, 2));
  }

  return [];
}

export async function getListingBySlug(slug: string) {
  if (!isSupabaseConfigured()) return null;
  
  try {
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) return null;
    return enrichProvider(data);
  } catch (err) {
    return null;
  }
}

export async function getAllCities(): Promise<{ city: string, state: string, stateAbbr: string, count: number }[]> {
  if (!isSupabaseConfigured()) return [];
  
  try {
    // Select only needed columns to keep payload small and fast
    const response = await supabase
      .from('providers')
      .select('id, city, state')
      .order('id');

    if (response.error) {
      console.error('Supabase error in getAllCities:', JSON.stringify(response.error, null, 2));
      throw response.error;
    }

    const data = response.data;
    if (!data || data.length === 0) return [];

    // Trust the unique IDs in the database for the count
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
  } catch (err) {
    console.error('Supabase error in getAllCities:', JSON.stringify(err, null, 2));
    return [];
  }
}

export async function getTopHubs(limit: number = 8) {
  if (!isSupabaseConfigured()) return [];
  
  try {
    // 1. Get explicitly defined hubs from the cities table
    const { data: hubData } = await supabase
      .from('cities')
      .select('name, state, slug');

    if (!hubData) return [];

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
    return hubData
      .map(hub => ({
        city: hub.name,
        state: hub.state || '',
        slug: hub.slug,
        count: counts[hub.name] || 0
      }))
      .filter(hub => hub.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

  } catch (err) {
    console.warn('Error in getTopHubs:', err);
    return [];
  }
}

export async function getCitiesFromListings() {
  const allCities = await getAllCities();
  return allCities
    .filter(c => c.count >= 3)
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
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
      .or(filter)
      .order('reviews', { ascending: false })
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
  if (!isSupabaseConfigured()) return [];

  try {
    let q = supabase.from('providers').select('*');
    
    if (city && city !== 'All') {
      // Use broader match for city to handle "New York" vs "New York City"
      q = q.ilike('city', `%${city}%`);
    }
    
    if (query && query.trim() !== '') {
      const searchTerm = `%${query.trim()}%`;
      const serviceFilter = getServiceFilter(query.trim());
      // Combine original search with expanded service-aware filtering
      q = q.or(`name.ilike.${searchTerm},description.ilike.${searchTerm},city.ilike.${searchTerm},${serviceFilter}`);
    }

    const { data, error } = await q
      .order('reviews', { ascending: false })
      .limit(2000);
    if (error) throw error;
    
    // Deduplicate by content to ensure clean search results
    return deduplicateListings(data || []).map(enrichProvider);
  } catch (err) {
    console.error('Supabase error in searchListings:', err);
    return [];
  }
}

export async function getFeaturedListings(limit: number = 6, city?: string) {
  if (!isSupabaseConfigured()) return [];
  
  try {
    let q = supabase
      .from('providers')
      .select('*')
      .eq('is_featured', true);
      
    if (city && city !== 'All') {
      q = q.ilike('city', `%${city}%`);
    }

    const { data, error } = await q
      .order('rating', { ascending: false })
      .limit(limit);

    if (error) throw error;
    if (data && data.length > 0) {
      return deduplicateListings(data).map(enrichProvider);
    }
  } catch (err) {
    console.warn('Supabase error in getFeaturedListings:', err);
  }

  return [];
}

export async function getSiteStats() {
  const FALLBACK_STATS = {
    total: 494,
    cities: 209,
    states: 24,
    avgRating: '4.9',
    totalReviews: 48550, // Reasonable fallback based on ~100 reviews per clinic
    topStates: [
      { name: 'California', count: 82, share: '16.6%' },
      { name: 'Florida', count: 64, share: '13.0%' },
      { name: 'Texas', count: 58, share: '11.7%' },
      { name: 'Georgia', count: 42, share: '8.5%' },
      { name: 'New York', count: 35, share: '7.1%' }
    ],
    topCities: [
      { city: 'Atlanta', state: 'GA', count: 28 },
      { city: 'Miami', state: 'FL', count: 24 },
      { city: 'Houston', state: 'TX', count: 21 },
      { city: 'Dallas', state: 'TX', count: 18 },
      { city: 'Los Angeles', state: 'CA', count: 16 }
    ]
  };

  if (!isSupabaseConfigured()) {
    return FALLBACK_STATS;
  }

  try {
    const { count: total } = await supabase
      .from('providers')
      .select('*', { 
        count: 'exact', 
        head: true 
      })

    const { data: allData } = await supabase
      .from('providers')
      .select('city, state, reviews, rating')
    
    if (!allData || allData.length === 0) return FALLBACK_STATS;

    // Calculate unique cities and states
    const citiesSet = new Set();
    const statesSet = new Set();
    let totalReviews = 0;
    
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
      
      totalReviews += (r.reviews || 0);
    });

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

    return {
      total: total || FALLBACK_STATS.total,
      cities: citiesSet.size || FALLBACK_STATS.cities,
      states: statesSet.size || FALLBACK_STATS.states,
      avgRating: '4.9',
      totalReviews: totalReviews || FALLBACK_STATS.totalReviews,
      topStates,
      topCities
    }
  } catch (err) {
    console.error('Error in getSiteStats:', err);
    return FALLBACK_STATS;
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
          const content = post.content || post.body || post.markdown || '';
          const author = post.author || post.author_name || 'TheDripMap Team';

          return {
            ...post,
            author,
            content,
            metaTitle: post.metaTitle || post.meta_title || post.title || '',
            metaDescription: post.metaDescription || post.meta_description || post.excerpt || post.description || '',
            excerpt: post.excerpt || post.meta_description || '',
            imageUrl: post.imageUrl || post.image_url || post.ImageURL || null,
            relatedCities: post.relatedCities || post.related_cities || [],
            relatedClinics: post.relatedClinics || post.related_clinics || []
          };
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
          const content = post.content || post.body || post.markdown || '';
          
          // Diagnosis log as requested
          if (content) {
            console.warn(`[BLOG_DIAGNOSIS] slug: ${slug}, content length: ${content.length}`);
          }
          
          const author = post.author || post.author_name || 'TheDripMap Team';

          return {
            ...post,
            author,
            content: String(content),
            metaTitle: post.metaTitle || post.meta_title || post.title || '',
            metaDescription: post.metaDescription || post.meta_description || post.excerpt || post.description || '',
            excerpt: post.excerpt || post.meta_description || '',
            imageUrl: post.imageUrl || post.ImageURL || null,
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
  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) return null;
  return data;
}

import { USE_CASES } from './use-cases';

export async function getUseCaseBySlug(slug: string) {
  return USE_CASES.find(u => u.slug === slug) || null;
}

export async function getAllUseCases() {
  return USE_CASES;
}

export async function getAllListings() {
  if (!isSupabaseConfigured()) return [];
  
  try {
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .limit(2000);

    if (error) throw error;
    return (data || []).map(enrichProvider);
  } catch (err) {
    console.error('Supabase error in getAllListings:', err);
    return [];
  }
}

export async function getListingsByIds(ids: string[]) {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .in('id', ids);

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
      .ilike('city', cityPattern)
      .or(filter)
      .order('reviews', { ascending: false })
      .limit(2000);

    const error = response.error;
    let data = response.data;

    if (error) throw error;

    // Fallback: If no specific results in this city, try a broader wellness filter for the same city
    if (!data || data.length === 0) {
      console.log(`No specific results for ${service} in ${city}, trying fallback broad search...`);
      const broadFilter = "name.ilike.%hydration%,description.ilike.%hydration%,name.ilike.%wellness%,description.ilike.%wellness%,name.ilike.%drip%,description.iv%";
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('providers')
        .select('*')
        .ilike('city', cityPattern)
        .or(broadFilter)
        .order('reviews', { ascending: false })
        .limit(2000);
      
      if (!fallbackError && fallbackData && fallbackData.length > 0) {
        data = fallbackData;
      }
    }
    
    // Deduplicate while allowing multiple locations
    const uniqueListings = deduplicateListings(data || []).map(enrichProvider);

    // Clamp to the requested limit
    return uniqueListings.slice(0, limit);
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
    return data as OperatorProfile[];
  } catch (err) {
    console.error('Supabase error fetching operator profiles:', err);
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
      .eq('city', city)
      .neq('slug', currentSlug)
      .order('reviews', { ascending: false })
      .limit(limit);

    if (cityError) throw cityError;
    
    let results = (cityData || []).map(enrichProvider);

    // 2. If not enough in the city, find some in the same state
    if (results.length < limit) {
      const remaining = limit - results.length;
      const { data: stateData, error: stateError } = await supabase
        .from('providers')
        .select('*')
        .eq('state', state)
        .neq('city', city) // Don't pick up city clinics again
        .neq('slug', currentSlug)
        .order('reviews', { ascending: false })
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
  } catch (err) {
    console.error('Network error in getCityData:', err);
    return null;
  }
}
