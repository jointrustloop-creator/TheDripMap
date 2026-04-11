import { calculateDistance } from './geo';
import { Provider, BlogPost, OperatorProfile } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';
import { MOCK_CITIES, MOCK_LISTINGS, MOCK_BLOG_POSTS } from './mock-data';

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
    'Little Rock': 'AR', 'Birmingham': 'AL', 'Bentonville': 'AR', 'Corona': 'CA',
    'Burbank': 'CA', 'Redlands': 'CA', 'Claremont': 'CA', 'Edgewater': 'NJ',
    'Wausau': 'WI', 'Shelbyville': 'IL', 'Normal': 'IL', 'Lincoln': 'IL',
    'Oak Brook': 'IL', 'Olney': 'IL', 'Niles': 'IL', 'Morton Grove': 'IL'
  };
  
  return cityMap[provider.city] || 'Unknown';
};

// Helper to enrich provider with detailed mock data for UI sections
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function enrichProvider(p: any): Provider {
  // Normalize arrays that might be strings in DB
  const pId = (p.id as string) || '';
  
  const specialties = Array.isArray(p.specialties) 
    ? p.specialties 
    : (typeof p.specialties === 'string' ? p.specialties.split(',').map((s: string) => s.trim()) : []);
    
  const amenities = Array.isArray(p.amenities) 
    ? p.amenities 
    : (typeof p.amenities === 'string' ? p.amenities.split(',').map((s: string) => s.trim()) : []);

  const enriched = { 
    ...p,
    rating: Number(p.rating) || 0,
    reviewCount: Number(p.reviews || p.reviewCount) || 0,
    imageUrl: (p.imageUrl as string) || (p.image_url as string) || `https://picsum.photos/seed/${pId}/800/600`,
    specialties: specialties.length > 0 ? specialties : ['IV Therapy', 'Wellness', 'Hydration'],
    amenities: amenities.length > 0 ? amenities : ['Free Wi-Fi', 'Relaxing Lounge', 'Refreshments']
  } as Provider;

  if (!enriched.services || enriched.services.length === 0) {
    enriched.services = [
      { 
        name: 'Myers Cocktail', 
        description: 'The "Gold Standard" for overall wellness. Includes Vitamin C, B-Complex, and Magnesium to boost immunity and energy.', 
        price: '$195',
        category: 'Wellness'
      },
      { 
        name: 'NAD+ Therapy (250mg)', 
        description: 'Advanced cellular repair protocol. Improves cognitive function, slows aging, and boosts metabolic health.', 
        price: '$345',
        category: 'Anti-Aging'
      },
      { 
        name: 'Glutathione Push', 
        description: 'The master antioxidant. Brightens skin, detoxifies the liver, and reduces inflammation.', 
        price: '$75',
        category: 'Beauty'
      },
      { 
        name: 'Hangover Rescue', 
        description: 'Rapid rehydration with anti-nausea and anti-inflammatory medication to get you back on your feet.', 
        price: '$175',
        category: 'Recovery'
      }
    ];
  }

  if (!enriched.reviews_data || enriched.reviews_data.length === 0) {
    enriched.reviews_data = [
      {
        author: 'Michael R.',
        rating: 5,
        text: 'Incredible experience. The staff was professional and the lounge was so relaxing. I felt the energy boost almost immediately after my Myers Cocktail.',
        date: '2 weeks ago'
      },
      {
        author: 'Sarah L.',
        rating: 5,
        text: 'Best IV therapy in the city. I come here every month for my beauty drip and my skin has never looked better. Highly recommend!',
        date: '1 month ago'
      },
      {
        author: 'David K.',
        rating: 4,
        text: 'Great service, very clean facility. The NAD+ treatment is a game changer for my focus at work. A bit pricey but worth it.',
        date: '3 months ago'
      }
    ];
  }

  if (!enriched.medical_team || enriched.medical_team.length === 0) {
    enriched.medical_team = [
      {
        name: 'Dr. Elena Vance',
        role: 'Medical Director',
        bio: 'Board-certified physician with over 15 years of experience in functional medicine and clinical nutrition.',
      },
      {
        name: 'Marcus Chen, RN',
        role: 'Lead Infusion Nurse',
        bio: 'Specializes in difficult IV access and has administered over 5,000 infusions with a focus on patient comfort.',
      }
    ];
  }

  if (!enriched.special_offers || enriched.special_offers.length === 0) {
    enriched.special_offers = [
      {
        title: 'New Patient Special',
        description: 'Get 20% off your first IV drip when you book online.',
        code: 'DRIP20',
        expires: 'Limited Time'
      },
      {
        title: 'Monthly Membership',
        description: 'Unlimited B12 shots and 15% off all drips for just $99/month.',
        expires: 'Ongoing'
      }
    ];
  }

  return enriched;
}

export async function getListingsByCity(city: string) {
  const configured = isSupabaseConfigured();
  if (configured) {
    try {
      // Try both 'city' and 'City' column names
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .or(`city.ilike.%${city}%,City.ilike.%${city}%`)
        .order('rating', { ascending: false });

      if (error) {
        console.warn('Supabase .or query failed, trying simple city query:', error.message);
        // Fallback to simple city query if .or fails (e.g. if one column doesn't exist)
        const { data: data2, error: error2 } = await supabase
          .from('providers')
          .select('*')
          .ilike('city', city)
          .order('rating', { ascending: false });
        
        if (!error2 && data2 && data2.length > 0) {
          return data2.map(enrichProvider);
        }
        
        // Try uppercase City if lowercase city failed
        const { data: data3, error: error3 } = await supabase
          .from('providers')
          .select('*')
          .ilike('City', city)
          .order('rating', { ascending: false });

        if (!error3 && data3 && data3.length > 0) {
          return data3.map(enrichProvider);
        }
        throw error;
      }

      if (data && data.length > 0) {
        return data.map(enrichProvider);
      }
    } catch (err) {
      console.warn('Supabase info: fetching listings by city:', err);
    }
  }

  return MOCK_LISTINGS.filter(l => l.city.toLowerCase() === city.toLowerCase()).map(enrichProvider);
}

export async function getListingBySlug(slug: string) {
  const configured = isSupabaseConfigured();
  if (configured) {
    try {
      // 1. Try direct slug match
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('slug', slug)
        .single();

      if (!error && data) {
        return enrichProvider(data);
      }

      // 2. If not found by slug, try matching by slugified name
      // This handles cases where the slug column is empty or mismatched
      const { data: allData, error: allErr } = await supabase
        .from('providers')
        .select('*')
        .limit(1000); // Add a safety limit

      if (!allErr && allData) {
        const found = allData.find(p => slugify(p.name) === slug);
        if (found) {
          return enrichProvider(found);
        }
      }
    } catch (err) {
      console.error('Supabase error fetching listing by slug:', err);
    }
  }

  const mock = MOCK_LISTINGS.find(l => slugify(l.name) === slug);
  return mock ? enrichProvider(mock) : null;
}

export async function getAllCities() {
  const configured = isSupabaseConfigured();
  
  // We'll collect cities from all sources to ensure we don't miss any
  const allCitiesMap = new Map<string, { city: string, state: string, count: number }>();

  // Helper to add cities to our map
  const addCity = (city: string, state: string, count: number) => {
    if (!city || !state) return;
    
    // Normalize city and state
    const normalizedCity = city.trim();
    const normalizedState = state.trim().toUpperCase();
    
    if (normalizedState === 'US') return;
    
    const key = `${normalizedCity.toLowerCase()}|${normalizedState.toLowerCase()}`;
    if (!allCitiesMap.has(key)) {
      allCitiesMap.set(key, { city: normalizedCity, state: normalizedState, count });
    } else {
      const existing = allCitiesMap.get(key)!;
      allCitiesMap.set(key, { ...existing, count: Math.max(existing.count, count) });
    }
  };

  if (configured) {
    try {
      // 1. Get cities from providers table - try columns individually to be safe
      const { data: providerCities, error: providerError } = await supabase
        .from('providers')
        .select('*'); // Select all and filter in JS to avoid column name errors

      if (!providerError && providerCities) {
        (providerCities as Array<Record<string, string | number | boolean | null>>).forEach((curr) => {
          const city = (curr.city || curr.City || curr.town) as string | undefined;
          const state = (curr.state || curr.State || curr.province) as string | undefined;
          if (city && state) {
            const key = `${city.toLowerCase()}|${state.toLowerCase()}`;
            const existing = allCitiesMap.get(key);
            if (existing) {
              existing.count++;
            } else {
              addCity(city, state, 1);
            }
          }
        });
      } else if (providerError) {
        console.warn('Supabase error fetching providers for cities:', providerError.message);
      }

      // 2. Get cities from cities table
      const { data: citiesTable, error: citiesError } = await supabase
        .from('cities')
        .select('*');

      if (!citiesError && citiesTable) {
        (citiesTable as { name?: string; city?: string; state_code?: string; state?: string; listings_count?: number }[]).forEach((c) => {
          const name = c.name || c.city;
          const state = c.state_code || c.state;
          if (name && state) {
            addCity(name, state, c.listings_count || 0);
          }
        });
      }
    } catch (err) {
      console.warn('Supabase info: fetching all cities:', err);
    }
  }

  // 3. Always include mock cities to ensure we have a baseline
  if (Array.isArray(MOCK_CITIES)) {
    MOCK_CITIES.forEach(c => {
      if (c && c.city) {
        const actualCount = Array.isArray(MOCK_LISTINGS) 
          ? MOCK_LISTINGS.filter(l => l.city.toLowerCase() === c.city.toLowerCase()).length
          : 0;
        // Use the higher count between mock listings and the explicit city count
        addCity(c.city, c.state, Math.max(actualCount, c.count || 0));
      }
    });
  }

  return Array.from(allCitiesMap.values())
    .filter(c => c.count > 0)
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

export async function getListingsByService(service: string, limit: number = 4) {
  const configured = isSupabaseConfigured();
  if (!configured) {
    return MOCK_LISTINGS.filter(l => l.specialties.includes(service)).slice(0, limit);
  }
  
  try {
    // Extract a core keyword for better matching (e.g., "NAD" from "NAD+ Plus")
    const coreKeyword = service.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '');
    
    // Try specialties first, then subtypes, then name/category
    // We use .or() to be more inclusive if specialties aren't fully populated
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .or(`specialties.cs.{"${service}"},subtypes.cs.{"${service}"},name.ilike.%${coreKeyword}%,category.ilike.%${coreKeyword}%,description.ilike.%${coreKeyword}%`)
      .order('rating', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Supabase error in getListingsByService:', error.message);
      // Fallback to simple name/category search if columns are missing
      const { data: fallbackData } = await supabase
        .from('providers')
        .select('*')
        .or(`name.ilike.%${coreKeyword}%,category.ilike.%${coreKeyword}%`)
        .order('rating', { ascending: false })
        .limit(limit);
      
      if (fallbackData) {
        return fallbackData.map(p => ({
          ...p,
          rating: Number(p.rating) || 0,
          reviewCount: Number(p.reviews) || 0,
          imageUrl: p.imageUrl || p.image_url || `https://picsum.photos/seed/${p.id}/800/600`
        })) as Provider[];
      }
      return [];
    }

    if (data && data.length > 0) {
      return data.map(p => ({
        ...p,
        rating: Number(p.rating) || 0,
        reviewCount: Number(p.reviews) || 0,
        imageUrl: p.imageUrl || p.image_url || `https://picsum.photos/seed/${p.id}/800/600`
      })) as Provider[];
    }
    
    return [];
  } catch (err) {
    console.error('Supabase error in getListingsByService:', err);
    return [];
  }
}

// Helper to filter mock listings for search
const getMockSearchResults = (query: string, city?: string, userLocation?: { latitude: number; longitude: number }) => {
  let results = [...MOCK_LISTINGS];
  
  if (city && city !== 'All') {
    results = results.filter(l => l.city.toLowerCase() === city.toLowerCase());
  }
  
  if (query) {
    const q = query.toLowerCase();
    results = results.filter(l => 
      l.name.toLowerCase().includes(q) || 
      l.city.toLowerCase().includes(q) ||
      l.specialties.some(s => s.toLowerCase().includes(q)) ||
      l.description.toLowerCase().includes(q)
    );
  }
  
  if (userLocation) {
    results = results.map(p => ({
      ...p,
      distance: p.latitude && p.longitude 
        ? calculateDistance(userLocation.latitude, userLocation.longitude, p.latitude, p.longitude)
        : undefined
    }));
    
    results.sort((a, b) => {
      if (a.distance !== undefined && b.distance !== undefined) return a.distance - b.distance;
      return b.rating - a.rating;
    });
  }
  
  return results;
};

export async function searchListings(
  query: string, 
  city?: string,
  userLocation?: { latitude: number; longitude: number }
) {
  // If Supabase is not configured, fall back to mock data
  if (!isSupabaseConfigured()) {
    return getMockSearchResults(query, city, userLocation).map(enrichProvider);
  }

  try {
    let supabaseQuery = supabase.from('providers').select('*');

    // Filter by city if provided
    if (city && city !== 'All' && city !== '') {
      // Use exact match for city if possible, or ilike for flexibility
      supabaseQuery = supabaseQuery.ilike('city', city);
    }

    // Filter by search query (name, city, category, description)
    if (query && query.trim() !== '') {
      const q = `%${query.trim()}%`;
      supabaseQuery = supabaseQuery.or(`name.ilike.${q},city.ilike.${q},category.ilike.${q},description.ilike.${q},specialties.cs.{"${query.trim()}"}`);
    }

    // Always sort by rating DESC as default
    const { data, error } = await supabaseQuery
      .order('rating', { ascending: false });

    if (error) {
      console.error('Supabase search error:', error);
      throw error;
    }
    
    if (data) {
      const results = data.map(p => enrichProvider({
        ...p,
        rating: Number(p.rating) || 0,
        reviewCount: Number(p.reviews) || 0,
        imageUrl: p.imageUrl || p.image_url || `https://picsum.photos/seed/${p.id}/800/600`,
        distance: userLocation && p.latitude && p.longitude 
          ? calculateDistance(userLocation.latitude, userLocation.longitude, p.latitude, p.longitude)
          : undefined
      })) as Provider[];

      // If we have user location, sort by distance primarily
      if (userLocation) {
        results.sort((a, b) => {
          if (a.distance !== undefined && b.distance !== undefined) {
            return a.distance - b.distance;
          }
          if (a.distance !== undefined) return -1;
          if (b.distance !== undefined) return 1;
          return b.rating - a.rating;
        });
      }

      return results;
    }
  } catch (err) {
    console.warn('Supabase info: searching listings:', err);
  }

  // Final fallback to mock data if Supabase returns nothing
  return getMockSearchResults(query, city, userLocation);
}

export async function getFeaturedListings(limit: number = 6) {
  if (!isSupabaseConfigured()) {
    return MOCK_LISTINGS.filter(l => l.is_featured).slice(0, limit).map(enrichProvider);
  }
  try {
    // Try to get featured, fallback to top rated
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .order('rating', { ascending: false })
      .limit(limit);

    if (error) throw error;
    if (data && data.length > 0) {
      return data.map(p => enrichProvider({
        ...p,
        rating: Number(p.rating) || 0,
        reviewCount: Number(p.reviews) || 0,
        imageUrl: p.imageUrl || `https://picsum.photos/seed/${p.id}/800/600`
      })) as Provider[];
    }
  } catch (err) {
    console.warn('Supabase info: fetching featured listings:', err);
  }

  return MOCK_LISTINGS.filter(l => l.is_featured).slice(0, limit);
}

export async function getListingStats() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const configured = isSupabaseConfigured();
  
  if (configured) {
    try {
      // 1. Get total count of providers
      const { count: totalListings, error: countError } = await supabase
        .from('providers')
        .select('id', { count: 'exact', head: true });

      if (countError) throw countError;

      // 2. Get cities to count them
      const { data, error } = await supabase
        .from('providers')
        .select('city, state');

      if (error) throw error;
      
      if (data) {
        const cities = new Set(data.map((p: { city?: string; City?: string }) => p.city || p.City).filter(Boolean));
        const states = new Set(data.map((p: { state?: string; State?: string }) => p.state || p.State).filter(Boolean));
        
        return {
          totalListings: totalListings || data.length,
          totalCities: cities.size,
          totalStates: states.size || 1,
          isLive: true
        };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn('Supabase stats info:', message);
      
      return {
        totalListings: 0,
        totalCities: 0,
        totalStates: 0,
        isLive: true,
        error: message
      };
    }
  }

  // If not configured, check if it's because of placeholders
  let configError = undefined;
  if (url && key) {
    if (url.includes('placeholder') || key.includes('your_anon_key')) {
      configError = 'Supabase keys appear to be placeholders. Please update them in Settings.';
    }
  } else if (!url || !key) {
    configError = 'Supabase environment variables are missing.';
  }

  // If not configured, return counts from mock data
  const mockCities = new Set(MOCK_LISTINGS.map(l => l.city.toLowerCase()));
  // Add cities from MOCK_CITIES that might not have listings yet
  MOCK_CITIES.forEach(c => mockCities.add(c.city.toLowerCase()));
  
  const mockStates = new Set(MOCK_LISTINGS.map(l => getStateFromProvider(l)));

  return {
    totalListings: MOCK_LISTINGS.length,
    totalCities: mockCities.size,
    totalStates: mockStates.size || 5,
    isLive: false,
    error: configError
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

      if (error) {
        if (error.code === '42P01') return MOCK_BLOG_POSTS; // Table doesn't exist yet
        throw error;
      }
      if (data && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data as any[]).map(post => {
          const content = post.content || post.body || post.markdown || post.text || '';
          const isPlaceholder = content.length < 200 || 
                               content.toLowerCase().includes('placeholder') || 
                               content.toLowerCase().includes('app code') ||
                               content.toLowerCase().includes('coming soon');
          
          if (isPlaceholder) {
            const mockPost = MOCK_BLOG_POSTS.find(p => p.slug === post.slug);
            if (mockPost) return mockPost;
          }

          return {
            ...post,
            content,
            imageUrl: post.imageUrl || `https://picsum.photos/seed/${post.slug}/800/600`
          };
        }) as BlogPost[];
      }
    } catch {
      // Silent fail for blog posts
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

      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const post = data as any;
        // Handle potential column name variations
        const content = post.content || post.body || post.markdown || post.text || '';
        
        // CRITICAL: If content is very short or looks like a placeholder, prefer our high-quality mock data
        const isPlaceholder = content.length < 200 || 
                             content.toLowerCase().includes('placeholder') || 
                             content.toLowerCase().includes('app code') ||
                             content.toLowerCase().includes('coming soon');
        
        if (isPlaceholder) {
          const mockPost = MOCK_BLOG_POSTS.find(p => p.slug === slug);
          if (mockPost) return mockPost;
        }

        return {
          ...post,
          content,
          imageUrl: post.imageUrl || `https://picsum.photos/seed/${post.slug}/800/600`
        } as BlogPost;
      }
    } catch (_err) {
      console.error('Supabase error fetching blog post by slug:', _err);
    }
  }

  return MOCK_BLOG_POSTS.find(p => p.slug === slug) || null;
}

import { USE_CASES } from './use-cases';

export async function getUseCaseBySlug(slug: string) {
  return USE_CASES.find(u => u.slug === slug) || null;
}

export async function getAllUseCases() {
  return USE_CASES;
}

export async function getAllListings() {
  const configured = isSupabaseConfigured();
  if (!configured) return MOCK_LISTINGS;
  
  try {
    const { data, error } = await supabase
      .from('providers')
      .select('*');

    if (error) {
      console.error('Supabase error fetching all listings:', error.message);
      throw error;
    }
    
    if (data && data.length > 0) {
      return data.map(enrichProvider);
    }
  } catch (err) {
    console.error('Supabase error in getAllListings:', err);
  }

  return MOCK_LISTINGS;
}

export async function getListingsByIds(ids: string[]) {
  if (!isSupabaseConfigured()) {
    return MOCK_LISTINGS.filter(l => ids.includes(l.id));
  }
  try {
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .in('id', ids);

    if (error) throw error;
    if (data) {
      return data.map(enrichProvider);
    }
    return [];
  } catch (err) {
    console.error('Supabase error fetching listings by ids:', err);
    return [];
  }
}

export async function getListingsByServiceAndCity(service: string, city: string, limit: number = 4) {
  const configured = isSupabaseConfigured();
  if (!configured) {
    return MOCK_LISTINGS
      .filter(l => l.specialties.includes(service) && l.city.toLowerCase() === city.toLowerCase())
      .slice(0, limit);
  }
  
  try {
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .ilike('city', city)
      .or(`specialties.cs.{"${service}"},subtypes.cs.{"${service}"},name.ilike.%${service}%,category.ilike.%${service}%`)
      .order('rating', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Supabase error in getListingsByServiceAndCity:', error.message);
      throw error;
    }
    
    if (data && data.length > 0) {
      return data.map(p => ({
        ...p,
        rating: Number(p.rating) || 0,
        reviewCount: Number(p.reviews) || 0,
        imageUrl: p.imageUrl || p.image_url || `https://picsum.photos/seed/${p.id}/800/600`
      })) as Provider[];
    }
    
    return [];
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
