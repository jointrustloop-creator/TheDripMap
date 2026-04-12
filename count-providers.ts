import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function run() {
  const { data: allProviders, error } = await supabase
    .from('providers')
    .select('city, state');
    
  if (error) {
    console.error('Error:', error);
    return;
  }

  const cityCounts: Record<string, number> = {};
  const stateCounts: Record<string, number> = {};
  
  allProviders?.forEach(p => {
    const c = p.city || 'Unknown';
    const s = p.state || 'Unknown';
    cityCounts[c] = (cityCounts[c] || 0) + 1;
    stateCounts[s] = (stateCounts[s] || 0) + 1;
  });
    
  console.log('---RESULTS---');
  console.log('TOTAL_SUPABASE_COUNT:', allProviders?.length);
  console.log('NY_CITY_COUNT:', cityCounts['New York'] || 0);
  console.log('NY_STATE_COUNT:', stateCounts['NY'] || stateCounts['New York'] || 0);
  console.log('STATE_DISTRIBUTION:', JSON.stringify(stateCounts, null, 2));
  console.log('---END---');
}

run();
