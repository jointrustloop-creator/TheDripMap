import { Provider, BlogPost, OperatorProfile } from '../types';
import { supabase } from './supabase';

// Helper to slugify strings
export const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')    // Remove all non-word chars
    .replace(/--+/g, '-');      // Replace multiple - with single -
};

// State mapping
const STATE_NAMES: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
  'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
  'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
  'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
  'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
  'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
  'DC': 'District of Columbia'
};

// Helper to get state from address or city
const getStateFromProvider = (provider: Provider): string => {
  const address = provider.address;
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
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .ilike('city', city)
      .order('featured', { ascending: false })
      .order('rating', { ascending: false });

    if (error) throw error;
    if (data && data.length > 0) return data as Provider[];
  } catch (err) {
    console.error('Supabase error fetching listings by city:', err);
  }

  return [];
}

export async function getListingBySlug(slug: string) {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (data) return data as Provider;
  } catch (err) {
    console.error('Supabase error fetching listing by slug:', err);
  }

  return null;
}

export async function getAllCities() {
  try {
    const { data, error } = await supabase
      .from('cities')
      .select('name, state_code, listings_count');

    if (error) throw error;
    if (data && data.length > 0) {
      return data.map(c => ({
        city: c.name,
        state: c.state_code,
        count: c.listings_count || 0
      })).sort((a, b) => b.count - a.count);
    }
  } catch (err) {
    console.error('Supabase error fetching all cities:', err);
  }

  return [];
}

export async function getAllStates() {
  try {
    const { data, error } = await supabase
      .from('states')
      .select('name, code, listings_count');

    if (error) throw error;
    if (data && data.length > 0) {
      return data.map(s => ({
        state: s.name,
        stateCode: s.code,
        count: s.listings_count || 0
      })).sort((a, b) => b.count - a.count);
    }
  } catch (err) {
    console.error('Supabase error fetching all states:', err);
  }

  return [];
}

export async function getListingsByService(service: string, limit: number = 4) {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .contains('specialties', [service])
      .order('featured', { ascending: false })
      .order('rating', { ascending: false })
      .limit(limit);

    if (error) throw error;
    if (data && data.length > 0) return data as Provider[];
  } catch (err) {
    console.error('Supabase error fetching listings by service:', err);
  }

  return [];
}

export async function searchListings(query: string, city?: string, type?: string) {
  try {
    let supabaseQuery = supabase.from('listings').select('*');

    if (city && city !== 'All') {
      supabaseQuery = supabaseQuery.ilike('city', city);
    }

    if (type && type !== 'All') {
      if (type === 'Both') {
        // Both means it can be anything, but usually we filter for specific types
      } else {
        supabaseQuery = supabaseQuery.or(`type.eq.${type},type.eq.Both`);
      }
    }

    if (query) {
      const q = `%${query}%`;
      supabaseQuery = supabaseQuery.or(`name.ilike.${q},city.ilike.${q},specialties.cs.{${query}}`);
    }

    const { data, error } = await supabaseQuery
      .order('featured', { ascending: false })
      .order('rating', { ascending: false });

    if (error) throw error;
    if (data && data.length > 0) return data as Provider[];
  } catch (err) {
    console.error('Supabase error searching listings:', err);
  }

  return [];
}

export async function getFeaturedListings(limit: number = 6) {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('featured', true)
      .order('rating', { ascending: false })
      .limit(limit);

    if (error) throw error;
    if (data && data.length > 0) return data as Provider[];
  } catch (err) {
    console.error('Supabase error fetching featured listings:', err);
  }

  return [];
}

export async function getListingStats() {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('city, address');

    if (error) throw error;
    if (data && data.length > 0) {
      const cities = new Set(data.map(p => p.city));
      const states = new Set(data.map(p => {
        const address = p.address;
        const parts = address.split(',');
        if (parts.length > 1) {
          const statePart = parts[parts.length - 1].trim().split(' ')[0];
          if (statePart.length === 2 && statePart === statePart.toUpperCase()) {
            return statePart;
          }
        }
        return 'Unknown';
      }));

      return {
        totalListings: data.length,
        totalCities: cities.size,
        totalStates: states.size
      };
    }
  } catch (err) {
    console.error('Supabase error fetching listing stats:', err);
  }

  return {
    totalListings: 0,
    totalCities: 0,
    totalStates: 0
  };
}

export async function getBlogPosts() {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    if (data && data.length > 0) return data as BlogPost[];
  } catch (err) {
    console.error('Supabase error fetching blog posts:', err);
  }

  return [];
}

export async function getBlogPostBySlug(slug: string) {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (data) return data as BlogPost;
  } catch (err) {
    console.error('Supabase error fetching blog post by slug:', err);
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
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('*');

    if (error) throw error;
    return data as Provider[];
  } catch (err) {
    console.error('Supabase error fetching all listings:', err);
    return [];
  }
}

export async function getListingsByIds(ids: string[]) {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .in('id', ids);

    if (error) throw error;
    return data as Provider[];
  } catch (err) {
    console.error('Supabase error fetching listings by ids:', err);
    return [];
  }
}

export async function getOperatorProfiles() {
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
