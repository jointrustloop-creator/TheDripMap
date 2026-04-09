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
        // Fallback to simple city query if .or fails (e.g. if one column doesn't exist)
        const { data: data2, error: error2 } = await supabase
          .from('providers')
          .select('*')
          .ilike('city', city)
          .order('rating', { ascending: false });
        
        if (!error2 && data2 && data2.length > 0) {
          return data2.map(p => ({
            ...p,
            rating: Number(p.rating) || 0,
            reviewCount: Number(p.reviews) || 0,
            imageUrl: p.imageUrl || `https://picsum.photos/seed/${p.id}/800/600`
          })) as Provider[];
        }
        throw error;
      }

      if (data && data.length > 0) {
        return data.map(p => ({
          ...p,
          rating: Number(p.rating) || 0,
          reviewCount: Number(p.reviews) || 0,
          imageUrl: p.imageUrl || `https://picsum.photos/seed/${p.id}/800/600`
        })) as Provider[];
      }
    } catch (err) {
      console.warn('Supabase info: fetching listings by city:', err);
    }
  }

  return MOCK_LISTINGS.filter(l => l.city.toLowerCase() === city.toLowerCase());
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
        return {
          ...data,
          rating: Number(data.rating) || 0,
          reviewCount: Number(data.reviews) || 0,
          imageUrl: data.imageUrl || `https://picsum.photos/seed/${data.id}/800/600`
        } as Provider;
      }

      // 2. If not found by slug, try matching by slugified name
      // This handles cases where the slug column is empty or mismatched
      const { data: allData, error: allErr } = await supabase
        .from('providers')
        .select('*');

      if (!allErr && allData) {
        const found = allData.find(p => slugify(p.name) === slug);
        if (found) {
          return {
            ...found,
            rating: Number(found.rating) || 0,
            reviewCount: Number(found.reviews) || 0,
            imageUrl: found.imageUrl || `https://picsum.photos/seed/${found.id}/800/600`
          } as Provider;
        }
      }
    } catch (err) {
      console.error('Supabase error fetching listing by slug:', err);
    }
  }

  return MOCK_LISTINGS.find(l => slugify(l.name) === slug) || null;
}

export async function getAllCities() {
  const configured = isSupabaseConfigured();
  
  // We'll collect cities from all sources to ensure we don't miss any
  const allCitiesMap = new Map<string, { city: string, state: string, count: number }>();

  // Helper to add cities to our map
  const addCity = (city: string, state: string, count: number) => {
    const key = `${city.toLowerCase()}-${state.toLowerCase()}`;
    if (!allCitiesMap.has(key) || (allCitiesMap.get(key)?.count || 0) < count) {
      allCitiesMap.set(key, { city, state, count });
    }
  };

  if (configured) {
    try {
      // 1. Get cities from providers table
      const { data: providerCities, error: providerError } = await supabase
        .from('providers')
        .select('city, City, state, State');

      if (!providerError && providerCities) {
        (providerCities as { city?: string; City?: string; state?: string; State?: string }[]).forEach((curr) => {
          const city = curr.city || curr.City;
          const state = curr.state || curr.State;
          if (city && state) {
            const existing = Array.from(allCitiesMap.values()).find(c => c.city.toLowerCase() === city.toLowerCase());
            if (existing) {
              existing.count++;
            } else {
              addCity(city, state, 1);
            }
          }
        });
      }

      // 2. Get cities from cities table
      const { data: citiesTable, error: citiesError } = await supabase
        .from('cities')
        .select('*');

      if (!citiesError && citiesTable) {
        (citiesTable as { name?: string; city?: string; state_code?: string; state?: string; listings_count?: number }[]).forEach((c) => {
          const name = c.name || c.city;
          const state = c.state_code || c.state || 'US';
          if (name) {
            addCity(name, state, c.listings_count || 0);
          }
        });
      }
    } catch (err) {
      console.warn('Supabase info: fetching all cities:', err);
    }
  }

  // 3. Always include mock cities to ensure we have a baseline
  MOCK_CITIES.forEach(c => {
    // Calculate actual count from MOCK_LISTINGS for this city
    const actualCount = MOCK_LISTINGS.filter(l => l.city.toLowerCase() === c.city.toLowerCase()).length;
    // Use actual count if available, otherwise use the mock count (but capped at a realistic number for demo)
    addCity(c.city, c.state, actualCount || Math.min(c.count, 5));
  });

  return Array.from(allCitiesMap.values()).sort((a, b) => b.count - a.count);
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
    // Try specialties first, then subtypes, then name/category
    // We use .or() to be more inclusive if specialties aren't fully populated
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .or(`specialties.cs.{"${service}"},subtypes.cs.{"${service}"},name.ilike.%${service}%,category.ilike.%${service}%`)
      .order('rating', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Supabase error in getListingsByService:', error.message);
      // Fallback to simple name/category search if columns are missing
      const { data: fallbackData } = await supabase
        .from('providers')
        .select('*')
        .or(`name.ilike.%${service}%,category.ilike.%${service}%`)
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
    return getMockSearchResults(query, city, userLocation);
  }

  try {
    let supabaseQuery = supabase.from('providers').select('*');

    if (city && city !== 'All') {
      supabaseQuery = supabaseQuery.ilike('city', city);
    }

    if (query) {
      const q = `%${query}%`;
      supabaseQuery = supabaseQuery.or(`name.ilike.${q},city.ilike.${q},category.ilike.${q}`);
    }

    const { data, error } = await supabaseQuery
      .order('rating', { ascending: false });

    if (error) throw error;
    if (data && data.length > 0) {
      const results = data.map(p => ({
        ...p,
        rating: Number(p.rating) || 0,
        reviewCount: Number(p.reviews) || 0,
        imageUrl: p.imageUrl || `https://picsum.photos/seed/${p.id}/800/600`,
        distance: userLocation && p.latitude && p.longitude 
          ? calculateDistance(userLocation.latitude, userLocation.longitude, p.latitude, p.longitude)
          : undefined
      })) as Provider[];

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
    return MOCK_LISTINGS.filter(l => l.is_featured).slice(0, limit);
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
      return data.map(p => ({
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

  return {
    totalListings: MOCK_LISTINGS.length,
    totalCities: MOCK_CITIES.length,
    totalStates: 5,
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
      return data.map(p => ({
        ...p,
        rating: Number(p.rating) || 0,
        reviewCount: Number(p.reviews) || 0,
        imageUrl: p.imageUrl || p.image_url || `https://picsum.photos/seed/${p.id}/800/600`
      })) as Provider[];
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
      return data.map(p => ({
        ...p,
        rating: Number(p.rating) || 0,
        reviewCount: Number(p.reviews) || 0,
        imageUrl: p.imageUrl || `https://picsum.photos/seed/${p.id}/800/600`
      })) as Provider[];
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
