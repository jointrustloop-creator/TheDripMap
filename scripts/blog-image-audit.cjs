require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { data: sample, error } = await s.from('blog_posts').select('*').limit(1);
  if (error) { console.error(error); return; }
  if (sample && sample[0]) {
    console.log('Columns:', Object.keys(sample[0]).sort().join(', '));
  }
  const { count } = await s.from('blog_posts').select('id', { count:'exact', head:true });
  console.log('Total posts:', count);
  // Find image column candidates
  const imgCol = ['image_url','imageUrl','hero_image','cover_image','image'].find(c => sample[0] && (c in sample[0]));
  console.log('Image column found:', imgCol);
  if (imgCol) {
    const { data: all } = await s.from('blog_posts').select(`slug,title,${imgCol},category`);
    const buckets = {};
    all.forEach(p => { const k = p[imgCol] || '(none)'; buckets[k] = (buckets[k]||0)+1; });
    const repeated = Object.entries(buckets).sort((a,b)=>b[1]-a[1]).slice(0,12);
    console.log(`\nUnique images: ${Object.keys(buckets).length}, repeated:`);
    repeated.forEach(([url, c]) => console.log(`  ${c}x → ${(url||'').slice(0,80)}`));
  }
})();
