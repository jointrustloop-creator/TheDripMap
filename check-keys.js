console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('ANON_KEY length:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length);
console.log('SERVICE_ROLE_KEY length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length);
console.log('SERVICE_ROLE_KEY starts with:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10));
