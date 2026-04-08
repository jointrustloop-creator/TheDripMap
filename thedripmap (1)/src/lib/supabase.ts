import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Helper to check if Supabase is properly configured
 */
export const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(url && key && !url.includes('placeholder') && !key.includes('your_anon_key'));
};

// Initialize the client lazily to ensure environment variables are loaded
let supabaseClient: SupabaseClient | null = null;

export const getSupabaseClient = () => {
  if (supabaseClient) return supabaseClient;
  
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  if (!url || !key || url.includes('placeholder')) {
    return createClient('https://placeholder.supabase.co', 'placeholder');
  }

  // Auto-clean the URL
  url = url.trim();
  if (url.endsWith('/')) url = url.slice(0, -1);
  if (url.endsWith('/rest/v1')) url = url.replace('/rest/v1', '');
  if (!url.startsWith('http')) url = `https://${url}`;
  if (!url.includes('.supabase.co') && !url.includes('localhost')) {
    // If they just put the project ref, fix it
    url = `https://${url}.supabase.co`;
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
