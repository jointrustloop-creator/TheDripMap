import { calculateDistance } from './geo';
import { Provider, BlogPost, OperatorProfile, ListingStats } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';
import { unstable_cache } from 'next/cache';

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

// Helper to enrich provider with detailed mock data for UI sections
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function enrichProvider(p: any): Provider {
  // Normalize arrays that might be strings in DB
  const specialties = Array.isArray(p.specialties) 
    ? p.specialties 
    : (typeof p.specialties === 'string' ? p.specialties.split(',').map((s: string) => s.trim()) : []);
    
  const amenities = Array.isArray(p.amenities) 
    ? p.amenities 
    : (typeof p.amenities === 'string' ? p.amenities.split(',').map((s: string) => s.trim()) : []);

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
    city: p.city || p.town || 'Unknown City',
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

export async function getListingsByCity(city: string, state?: string) {
  if (!isSupabaseConfigured()) return [];
  
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .ilike('city', `%${city}%`)
      .order('rating', { ascending: false })
      .order('review_count', { ascending: false });

    if (error) throw error;

    if (data && data.length > 0) {
      // For city-specific pages, we show all locations to provide accurate coverage
      // Deduplication is handled mainly on service-specific top-lists
      return data.map(enrichProvider);
    }
  } catch (err) {
    console.error('Supabase error in getListingsByCity:', err);
  }

  return [];
}

export async function getListingBySlug(slug: string) {
  if (!isSupabaseConfigured()) return null;
  
  try {
    const { data, error } = await supabase
      .from('listings')
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
    const { data, error } = await supabase
      .from('listings')
      .select('city, state_abbr');

    if (error) throw error;

    const cityCounts = new Map<string, { city: string, stateAbbr: string, count: number }>();
    data?.forEach(item => {
      if (!item.city || !item.state_abbr) return;
      const key = `${item.city.trim()}|${item.state_abbr.trim().toUpperCase()}`;
      const existing = cityCounts.get(key);
      if (existing) {
        existing.count++;
      } else {
        cityCounts.set(key, { 
          city: item.city.trim(), 
          stateAbbr: item.state_abbr.trim().toUpperCase(), 
          count: 1 
        });
      }
    });

    return Array.from(cityCounts.values())
      .filter(c => c.count >= 3)
      .map(c => ({
        ...c,
        state: c.stateAbbr // Using abbreviation as state name for simplicity
      }))
      .sort((a, b) => b.count - a.count);
  } catch (err) {
    console.error('Supabase error in getAllCities:', err);
    return [];
  }
}

export async function getCitiesFromListings() {
  const allCities = await getAllCities();
  return allCities
    .filter(c => c.count >= 3)
    .sort((a, b) => b.count - a.count);
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
      .from('listings')
      .select('*')
      .or(filter)
      .order('rating', { ascending: false })
      .limit(2000);

    if (error) throw error;
    
    // Deduplicate by name to ensure brand diversity (No doubles)
    const seenNames = new Set<string>();
    const uniqueListings: Provider[] = [];
    
    (data || []).forEach(p => {
      const enriched = enrichProvider(p);
      const nameKey = enriched.name.toLowerCase().split(' - ')[0].split(' (')[0].trim();
      if (!seenNames.has(nameKey)) {
        uniqueListings.push(enriched);
        seenNames.add(nameKey);
      }
    });

    return uniqueListings.slice(0, limit);
  } catch (err) {
    console.error('Supabase error in getListingsByService:', err);
    return [];
  }
}

export async function searchListings(query: string, city?: string) {
  if (!isSupabaseConfigured()) return [];

  try {
    let q = supabase.from('listings').select('*');
    
    if (city && city !== 'All') {
      q = q.ilike('city', city);
    }
    
    if (query && query.trim() !== '') {
      const searchTerm = `%${query.trim()}%`;
      q = q.or(`name.ilike.${searchTerm},city.ilike.${searchTerm},services.cs.{${query.trim()}}`);
    }

    const { data, error } = await q
      .order('rating', { ascending: false })
      .limit(2000);
    if (error) throw error;
    
    // Deduplicate by ID
    const uniqueData = Array.from(new Map((data || []).map(item => [item.id, item])).values());
    return uniqueData.map(enrichProvider);
  } catch (err) {
    console.error('Supabase error in searchListings:', err);
    return [];
  }
}

export async function getFeaturedListings(limit: number = 6, city?: string) {
  if (!isSupabaseConfigured()) return [];
  
  try {
    let q = supabase
      .from('listings')
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
      return data.map(enrichProvider);
    }
  } catch (err) {
    console.warn('Supabase error in getFeaturedListings:', err);
  }

  return [];
}

export const getSiteStats = unstable_cache(
  async () => {
    if (!isSupabaseConfigured()) {
      return { 
        total: 1042, 
        cities: 208, 
        states: 26, 
        avgRating: '4.9',
        totalReviews: 12540,
        topStates: [],
        topCities: []
      };
    }

    const { data: allListings, error } = await supabase
      .from('listings')
      .select('city, state_abbr, rating, reviewCount');

    const { count: exactTotal, error: countError } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true });

    if (error || !allListings) {
      return { total: exactTotal || 1042, cities: 208, states: 26, avgRating: '4.9', totalReviews: 12540, topStates: [], topCities: [] };
    }

    const total = exactTotal || allListings.length;
    
    const citiesSet = new Set(
      allListings.map(r => 
        (r.city?.toLowerCase() || '') + '-' + 
        (r.state_abbr?.toLowerCase() || '')
      ).filter(id => id.length > 1)
    );
    const cities = citiesSet.size || 208;

    const statesSet = new Set(
      allListings.map(r => r.state_abbr).filter(Boolean)
    );
    const states = statesSet.size || 26;

    const ratingData = allListings.filter(r => r.rating > 0);
    const avgRating = ratingData.length > 0
      ? (ratingData.reduce((sum, r) => sum + (r.rating || 0), 0) / ratingData.length).toFixed(1)
      : '4.9';

    const totalReviews = allListings.reduce((sum, r) => sum + (r.reviewCount || 0), 0) || 12540;

    // State Breakdown
    const stateCounts: Record<string, number> = {};
    allListings.forEach(l => {
      if (l.state_abbr) {
        stateCounts[l.state_abbr] = (stateCounts[l.state_abbr] || 0) + 1;
      }
    });
    const topStates = Object.entries(stateCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        name,
        count,
        share: `${((count / total) * 100).toFixed(1)}%`
      }));

    // City Breakdown
    const cityCounts: Record<string, { count: number, state: string }> = {};
    allListings.forEach(l => {
      if (l.city && l.state_abbr) {
        const key = `${l.city}, ${l.state_abbr}`;
        if (!cityCounts[key]) {
          cityCounts[key] = { count: 0, state: l.state_abbr };
        }
        cityCounts[key].count++;
      }
    });
    const topCities = Object.entries(cityCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 20)
      .map(([cityWithState, info]) => ({
        city: cityWithState.split(', ')[0],
        state: info.state,
        count: info.count
      }));

    return {
      total,
      cities,
      states,
      avgRating,
      totalReviews,
      topStates,
      topCities
    };
  },
  ['site-stats'],
  { revalidate: 3600 }
);

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
  if (!configured) return [];
  
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      return [];
    }
    if (data && data.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any[]).map(post => {
        const content = post.content || post.body || post.markdown || post.text || '';
        
        // Replace fake author names
        let author = post.author || 'TheDripMap Team';
        const fakeAuthors = ['Dr. Sarah Chen', 'Dr. James Wilson', 'Dr. Michael Brown', 'Dr. Emily White'];
        if (fakeAuthors.includes(author)) {
          author = 'TheDripMap Team';
        }

        return {
          ...post,
          author,
          content,
          imageUrl: post.imageUrl || `https://picsum.photos/seed/${post.slug}/800/600`
        };
      }) as BlogPost[];
    }
  } catch {
    // Silent fail for blog posts
  }

  return [];
}

export async function getBlogPostBySlug(slug: string) {
  const configured = isSupabaseConfigured();
  if (!configured) return null;
  
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const post = data as any;
      // Handle potential column name variations
      const content = post.content || post.body || post.markdown || post.text || '';
      
      // Replace fake author names
      let author = post.author || 'TheDripMap Team';
      const fakeAuthors = ['Dr. Sarah Chen', 'Dr. James Wilson', 'Dr. Michael Brown', 'Dr. Emily White'];
      if (fakeAuthors.includes(author)) {
        author = 'TheDripMap Team';
      }

      return {
        ...post,
        author,
        content,
        imageUrl: post.imageUrl || `https://picsum.photos/seed/${post.slug}/800/600`
      } as BlogPost;
    }
  } catch (_err) {
    console.error('Supabase error fetching blog post by slug:', _err);
  }

  return null;
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
      .from('listings')
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
      .from('listings')
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
    
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .ilike('city', cityPattern)
      .or(filter)
      .order('rating', { ascending: false })
      .limit(2000); // Fetch a large sample to ensure variety after deduplication

    if (error) throw error;
    
    // Deduplicate by name to ensure brand diversity (No doubles)
    const seenNames = new Set<string>();
    const uniqueListings: Provider[] = [];
    
    (data || []).forEach(p => {
      const enriched = enrichProvider(p);
      const nameKey = enriched.name.toLowerCase().split(' - ')[0].split(' (')[0].trim();
      if (!seenNames.has(nameKey)) {
        uniqueListings.push(enriched);
        seenNames.add(nameKey);
      }
    });

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
      .from('listings')
      .select('*')
      .eq('city', city)
      .neq('slug', currentSlug)
      .order('rating', { ascending: false })
      .limit(limit);

    if (cityError) throw cityError;
    
    let results = (cityData || []).map(enrichProvider);

    // 2. If not enough in the city, find some in the same state
    if (results.length < limit) {
      const remaining = limit - results.length;
      const { data: stateData, error: stateError } = await supabase
        .from('listings')
        .select('*')
        .eq('state_abbr', state)
        .neq('city', city) // Don't pick up city clinics again
        .neq('slug', currentSlug)
        .order('rating', { ascending: false })
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
