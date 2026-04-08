import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Helper to check if Supabase is properly configured
 */
export const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  const isPlaceholder = (str: string | undefined) => {
    if (!str) return true;
    let val = str.trim();
    // Strip accidental prefixes before checking
    if (val.includes('your_key_here=')) val = val.split('your_key_here=')[1];
    if (val.includes('your_anon_key=')) val = val.split('your_anon_key=')[1];
    
    const lower = val.toLowerCase();
    return lower.includes('placeholder') || 
           lower.includes('your_anon_key') || 
           lower.includes('your_key_here') ||
           lower.includes('your_project_ref') ||
           val.length < 20; // Real keys are long JWTs
  };

  return !!(url && key && !isPlaceholder(url) && !isPlaceholder(key));
};

// Initialize the client lazily and allow re-initialization if keys change
let supabaseClient: SupabaseClient | null = null;
let lastUsedUrl: string | null = null;
let lastUsedKey: string | null = null;

export const getSupabaseClient = () => {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // If keys have changed, reset the client
  if (supabaseClient && (url !== lastUsedUrl || key !== lastUsedKey)) {
    supabaseClient = null;
  }

  if (supabaseClient) return supabaseClient;
  
  if (!isSupabaseConfigured()) {
    return createClient('https://placeholder.supabase.co', 'placeholder');
  }

  lastUsedUrl = url;
  lastUsedKey = key;
  
  // Auto-clean the URL
  url = url.trim();
  if (url.endsWith('/')) url = url.slice(0, -1);
  if (url.endsWith('/rest/v1')) url = url.replace('/rest/v1', '');
  if (!url.startsWith('http')) url = `https://${url}`;
  if (!url.includes('.supabase.co') && !url.includes('localhost')) {
    // If they just put the project ref, fix it
    url = `https://${url}.supabase.co`;
  }

  // Auto-clean the Key (strip common accidental prefixes)
  let cleanKey = key.trim();
  if (cleanKey.includes('your_key_here=')) {
    cleanKey = cleanKey.split('your_key_here=')[1];
  } else if (cleanKey.includes('your_anon_key=')) {
    cleanKey = cleanKey.split('your_anon_key=')[1];
  }
  
  supabaseClient = createClient(url, cleanKey);
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
