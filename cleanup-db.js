import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey);

async function cleanup() {
  console.log('Cleaning up invalid records (state_abbr = "us")...');
  
  // 1. Delete from listings
  const { count: listingsDeleted, error: listingsError } = await supabase
    .from('listings')
    .delete()
    .eq('state_abbr', 'us');
    
  if (listingsError) {
    console.warn('Error deleting from listings (might not exist):', listingsError.message);
  } else {
    console.log('Deleted listings with state_abbr = "us"');
  }

  // 2. Delete from cities
  const { count: citiesDeleted, error: citiesError } = await supabase
    .from('cities')
    .delete()
    .eq('state_code', 'us');
    
  if (citiesError) {
    console.warn('Error deleting from cities (might not exist):', citiesError.message);
  } else {
    console.log('Deleted cities with state_code = "us"');
  }
  
  // 3. Delete from providers (if it exists)
  const { count: providersDeleted, error: providersError } = await supabase
    .from('providers')
    .delete()
    .or('state.eq.us,State.eq.us');
    
  if (providersError) {
    console.warn('Error deleting from providers (might not have state column or table):', providersError.message);
  } else {
    console.log('Deleted providers with state = "us"');
  }

  console.log('Cleanup complete.');
}

cleanup();
