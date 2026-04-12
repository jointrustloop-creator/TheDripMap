import { calculateDistance } from './geo';
import { Provider, BlogPost, OperatorProfile } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

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
function enrichProvider(p: any): Provider {
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
      const dayKey = day.toLowerCase();
      if (Array.isArray(val)) {
        hours[dayKey] = val[0] || 'Closed';
      } else if (typeof val === 'string') {
        hours[dayKey] = val;
      }
    });
  }

  const enriched = { 
    ...p,
    name: p.name || p.Name || p.clinic_name || 'Unnamed Clinic',
    city: p.city || p.City || p.town || 'Unknown City',
    state: p.state || p.State || p.province || '',
    rating: Number(p.rating || p.Rating) || 0,
    reviewCount: Number(p.review_count || p.reviews || p.reviewCount || p.Reviews) || 0,
    imageUrl: finalImageUrl,
    specialties: specialties,
    amenities: amenities,
    hours: Object.keys(hours).length > 0 ? hours : undefined,
    services: p.services || [],
    reviews_data: p.reviews_data || [],
    medical_team: p.medical_team || [],
    special_offers: p.special_offers || []
  } as Provider;

  return enriched;
}

export async function getListingsByCity(city: string) {
  const configured = isSupabaseConfigured();
  if (!configured) return [];
  
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
      return [];
    }

    if (data && data.length > 0) {
      return data.map(enrichProvider);
    }
  } catch (err) {
    console.warn('Supabase info: fetching listings by city:', err);
  }

  return [];
}

export async function getListingBySlug(slug: string) {
  const configured = isSupabaseConfigured();
  if (!configured) return null;
  
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

  return null;
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
  if (!configured) return [];
  
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

export async function searchListings(
  query: string, 
  city?: string,
  userLocation?: { latitude: number; longitude: number }
) {
  // If Supabase is not configured, return empty
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    let supabaseQuery = supabase.from('providers').select('*');

    // Filter by city if provided
    if (city && city !== 'All' && city !== '') {
      // Use case-insensitive match for city
      // We try 'city' first, but we'll handle column name variations in the fallback
      supabaseQuery = supabaseQuery.ilike('city', city);
    }

    // Filter by search query (name, city, category, description)
    if (query && query.trim() !== '') {
      const q = `%${query.trim()}%`;
      // Try to be inclusive with column names
      supabaseQuery = supabaseQuery.or(`name.ilike.${q},city.ilike.${q},category.ilike.${q},description.ilike.${q}`);
    }

    // Order as requested: Featured first, then Rating, then Review Count
    // We use .order multiple times for multi-column sorting
    const { data, error } = await supabaseQuery
      .order('is_featured', { ascending: false })
      .order('rating', { ascending: false, nullsFirst: false })
      .limit(1000);

    if (error) {
      console.warn('Supabase search error, trying fallback with select all:', error.message);
      // If specific filters/orders fail, get all and filter in memory
      const { data: allData, error: allErr } = await supabase.from('providers').select('*').limit(1000);
      if (allErr) throw allErr;
      
      if (allData) {
        let filtered = allData.map(p => enrichProvider({
          ...p,
          city: p.city || p.City || p.town || '',
          rating: Number(p.rating || p.Rating) || 0,
          reviewCount: Number(p.review_count || p.reviews || p.reviewCount || p.Reviews) || 0,
        }));

        if (city && city !== 'All' && city !== '') {
          filtered = filtered.filter(p => p.city.toLowerCase() === city.toLowerCase());
        }

        if (query && query.trim() !== '') {
          const q = query.toLowerCase().trim();
          filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(q) || 
            p.city.toLowerCase().includes(q) ||
            (p.description && p.description.toLowerCase().includes(q)) ||
            (p.specialties && p.specialties.some(s => s.toLowerCase().includes(q)))
          );
        }

        // Sort in memory
        filtered.sort((a, b) => {
          if (a.is_featured && !b.is_featured) return -1;
          if (!a.is_featured && b.is_featured) return 1;
          return b.rating - a.rating;
        });

        return filtered;
      }
    }
    
    if (data) {
      const results = data.map(p => enrichProvider({
        ...p,
        rating: Number(p.rating || p.Rating) || 0,
        reviewCount: Number(p.review_count || p.reviews || p.reviewCount || p.Reviews) || 0,
        imageUrl: p.imageUrl || p.image_url,
        distance: userLocation && p.latitude && p.longitude 
          ? calculateDistance(userLocation.latitude, userLocation.longitude, p.latitude, p.longitude)
          : undefined
      })) as Provider[];
      
      return results;
    }
  } catch (err) {
    console.warn('Supabase info: searching listings:', err);
  }

  return [];
}

export async function getFeaturedListings(limit: number = 6) {
  if (!isSupabaseConfigured()) return [];
  
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

  return [];
}

export async function getListingStats() {
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

  return {
    totalListings: 0,
    totalCities: 0,
    totalStates: 0,
    isLive: false
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
      
      return {
        ...post,
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
  const configured = isSupabaseConfigured();
  if (!configured) return [];
  
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

  return [];
}

export async function getListingsByIds(ids: string[]) {
  if (!isSupabaseConfigured()) return [];
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
  if (!configured) return [];
  
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
      return data.map(enrichProvider);
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
