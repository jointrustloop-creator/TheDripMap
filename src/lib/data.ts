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
      let query = supabase
        .from('providers')
        .select('*')
        .ilike('city', city);
      
      // Try to order by rating
      query = query.order('rating', { ascending: false });

      const { data, error } = await query;

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
      console.warn('Supabase info: fetching listings by city:', err);
    }
  }

  return MOCK_LISTINGS.filter(l => l.city.toLowerCase() === city.toLowerCase());
}

export async function getListingBySlug(slug: string) {
  const configured = isSupabaseConfigured();
  if (configured) {
    try {
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        return {
          ...data,
          rating: Number(data.rating) || 0,
          reviewCount: Number(data.reviews) || 0,
          imageUrl: data.imageUrl || `https://picsum.photos/seed/${data.id}/800/600`
        } as Provider;
      }
    } catch (err) {
      console.error('Supabase error fetching listing by slug:', err);
    }
  }

  return MOCK_LISTINGS.find(l => slugify(l.name) === slug) || null;
}

export async function getAllCities() {
  const configured = isSupabaseConfigured();
  if (!configured) return MOCK_CITIES;
  
  try {
    // 1. Try to get cities from providers table (most accurate for current data)
    const { data: providerCities, error: providerError } = await supabase
      .from('providers')
      .select('city, state');

    if (!providerError && providerCities && providerCities.length > 0) {
      const cityCounts = providerCities.reduce((acc: Record<string, number>, curr: { city?: string; City?: string; state?: string; State?: string }) => {
        const city = curr.city || curr.City;
        const state = curr.state || curr.State;
        if (city && state) {
          const key = `${city}, ${state}`;
          acc[key] = (acc[key] || 0) + 1;
        }
        return acc;
      }, {});

      if (Object.keys(cityCounts).length > 0) {
        return Object.entries(cityCounts).map(([key, count]) => {
          const [city, state] = key.split(', ');
          return { city, state, count: count as number };
        }).sort((a, b) => b.count - a.count);
      }
    }

    // 2. Fallback to cities table
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .order('listings_count', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map(c => ({
        city: c.name || c.city,
        state: c.state_code || c.state || 'US',
        count: c.listings_count || 0
      }));
    }
    
    // 3. Final fallback to mock data if DB is empty
    return MOCK_CITIES;
  } catch (err) {
    console.warn('Supabase info: fetching all cities:', err);
    return MOCK_CITIES;
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
      .or(`specialties.cs.{"${service}"},subtypes.ilike.%${service}%,name.ilike.%${service}%,category.ilike.%${service}%`)
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

export async function searchListings(query: string, city?: string) {
  if (!isSupabaseConfigured()) return [];
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
      return data.map(p => ({
        ...p,
        rating: Number(p.rating) || 0,
        reviewCount: Number(p.reviews) || 0,
        imageUrl: p.imageUrl || `https://picsum.photos/seed/${p.id}/800/600`
      })) as Provider[];
    }
  } catch (err) {
    console.warn('Supabase info: searching listings:', err);
  }

  return [];
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

  return [];
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
        return (data as BlogPost[]).map(post => ({
          ...post,
          imageUrl: post.imageUrl || `https://picsum.photos/seed/${post.slug}/800/600`
        }));
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
        const post = data as BlogPost;
        return {
          ...post,
          imageUrl: post.imageUrl || `https://picsum.photos/seed/${post.slug}/800/600`
        };
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
    
    return [];
  } catch (err) {
    console.error('Supabase error in getAllListings:', err);
    return [];
  }
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
      .or(`specialties.cs.{"${service}"},subtypes.ilike.%${service}%,name.ilike.%${service}%,category.ilike.%${service}%`)
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
