import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Helper to check if Supabase is properly configured
 */
export const isSupabaseConfigured = () => {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
};

// Initialize the client lazily to ensure environment variables are loaded
let supabaseClient: SupabaseClient | null = null;

export const getSupabaseClient = () => {
  if (supabaseClient) return supabaseClient;
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key || url.includes('placeholder')) {
    // Fallback that will fail gracefully on actual calls if somehow called without check
    return createClient('https://placeholder.supabase.co', 'placeholder');
  }
  
  supabaseClient = createClient(url, key);
  return supabaseClient;
};

// Proxy to ensure lazy initialization and pick up environment variables correctly
export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop: string | symbol) {
    const client = getSupabaseClient() as SupabaseClient;
    const value = client[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});

/**
 * Helper to get the service role client (server-side only).
 */
export const getServiceSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !serviceRoleKey) {
    throw new Error('Supabase URL or Service Role Key is not defined');
  }
  
  return createClient(url, serviceRoleKey);
};
