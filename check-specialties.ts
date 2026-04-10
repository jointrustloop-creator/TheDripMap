import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url!, key!);

async function checkSpecialties() {
  const { data, error } = await supabase
    .from('providers')
    .select('specialties, category, name')
    .limit(20);
    
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Sample specialties and categories:');
    data.forEach(p => {
      console.log(`Name: ${p.name}`);
      console.log(`Category: ${p.category}`);
      console.log(`Specialties: ${JSON.stringify(p.specialties)}`);
      console.log('---');
    });
  }
}

checkSpecialties();
