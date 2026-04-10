import { getServiceSupabase } from './src/lib/supabase';

async function checkTables() {
  const supabase = getServiceSupabase();
  console.log('Checking tables...');
  
  // Try to list tables or check existence
  const tables = ['listings', 'cities', 'providers'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`Table "${table}" error:`, error.message);
    } else {
      console.log(`Table "${table}" exists. Row count:`, data);
    }
  }
}

checkTables();
