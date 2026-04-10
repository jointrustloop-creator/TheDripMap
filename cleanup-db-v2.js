const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey);

async function cleanup() {
  console.log('Cleaning up invalid records (state_abbr = "us")...');
  
  const tables = [
    { name: 'listings', col: 'state_abbr' },
    { name: 'cities', col: 'state_code' },
    { name: 'providers', col: 'state' }
  ];

  for (const table of tables) {
    console.log(`Checking table "${table.name}"...`);
    const { data, error, count } = await supabase
      .from(table.name)
      .delete({ count: 'exact' })
      .eq(table.col, 'us');
      
    if (error) {
      console.error(`Error deleting from ${table.name}:`, JSON.stringify(error, null, 2));
    } else {
      console.log(`Deleted ${count} records from ${table.name}`);
    }
  }

  console.log('Cleanup complete.');
}

cleanup();
