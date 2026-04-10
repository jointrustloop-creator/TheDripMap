Object.keys(process.env).forEach(key => {
  if (key.includes('SUPABASE')) {
    console.log(key);
  }
});
