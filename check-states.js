import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url, anonKey);

async function checkStates() {
  const { data, error } = await supabase
    .from('providers')
    .select('state')
    .limit(100);
    
  if (error) {
    console.error('Error:', error.message);
  } else {
    const states = new Set(data.map(d => d.state));
    console.log('Unique states in first 100 providers:', Array.from(states));
  }
}

checkStates();
