import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
dotenv.config({ path: '.env.local', quiet: true });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const ids = [
  'ce1d3860-b664-4af3-9471-9068b10a91d0', // IVme Milwaukee
  'f74ec4c1-c6e5-408f-9f5c-f7aea84493bf', // Revitalize (retry)
  '8466a0aa-29f2-4e6e-94a6-5db3f2d36df0', // Revive (still blocked)
  'a051cf35-adbb-4c58-b143-2a0b8e09da14', // Beauty Lounge Peoria (noop)
];
const { data, error } = await supabase.from('providers').select('id,name,description,specialties,address').in('id', ids);
if (error) { console.error(error); process.exit(1); }
for (const row of data) {
  console.log('---', row.name);
  console.log('  desc:', row.description ? row.description.slice(0, 140) + (row.description.length > 140 ? '...' : '') : '(null)');
  console.log('  specialties:', JSON.stringify(row.specialties));
  console.log('  address:', row.address || '(null)');
}
