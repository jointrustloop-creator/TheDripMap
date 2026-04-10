import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url!, key!);

async function checkAllCities() {
  const { data, error } = await supabase
    .from('providers')
    .select('city, state');
    
  if (error) {
    console.error('Error:', error.message);
    return;
  }

  const cityCounts: Record<string, { city: string, state: string, count: number }> = {};
  
  data.forEach(p => {
    if (!p.city) return;
    const key = `${p.city}, ${p.state || 'US'}`;
    if (!cityCounts[key]) {
      cityCounts[key] = { city: p.city, state: p.state || 'US', count: 0 };
    }
    cityCounts[key].count++;
  });

  const sortedCities = Object.values(cityCounts).sort((a, b) => b.count - a.count);
  
  console.log('Top cities in Supabase:');
  sortedCities.slice(0, 20).forEach(c => {
    console.log(`${c.city}, ${c.state}: ${c.count} providers`);
  });
  
  const peoria = sortedCities.find(c => c.city.toLowerCase().includes('peoria'));
  if (peoria) {
    console.log('\nPeoria found:', peoria);
  } else {
    console.log('\nPeoria NOT found in database.');
  }
}

checkAllCities();
