import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(url, key);

async function getCitiesWithProviders() {
  const { data, error } = await supabase
    .from('providers')
    .select('city, state')
    .not('city', 'is', null);
    
  if (error) {
    console.error('Error fetching providers:', error);
    return;
  }

  const cityMap = new Map();
  data.forEach(p => {
    const key = `${p.city}, ${p.state}`;
    cityMap.set(key, (cityMap.get(key) || 0) + 1);
  });

  console.log('Cities with providers:');
  const sortedCities = Array.from(cityMap.entries())
    .sort((a, b) => b[1] - a[1]); // Sort by count descending

  sortedCities.forEach(([cityState, count]) => {
    console.log(`${cityState}: ${count}`);
  });
}

getCitiesWithProviders();
