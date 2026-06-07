require('dotenv').config({ path: '.env.local' });
const sb = require('@supabase/supabase-js').createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  for (const tbl of ['blog_posts', 'posts', 'blogs', 'articles']) {
    const { data, error } = await sb.from(tbl).select('*').limit(1);
    if (!error && data) {
      console.log(tbl + ': OK, sample columns: ' + Object.keys(data[0] || {}).join(','));
      const { count } = await sb.from(tbl).select('id', { count: 'exact', head: true });
      console.log('  row count: ' + count);
    } else if (error) {
      console.log(tbl + ': ERROR ' + error.message);
    }
  }

  // Toronto rating coverage
  const { data: toronto } = await sb.from('providers').select('name, slug, rating, reviews, is_claimed').eq('country','Canada').eq('city','Toronto').range(0,1999);
  console.log('\nToronto providers total: ' + toronto.length);
  console.log('  With rating not null: ' + toronto.filter(p => p.rating != null).length);
  console.log('  With reviews not null: ' + toronto.filter(p => p.reviews != null).length);
  console.log('  Sample of 5:');
  for (const p of toronto.slice(0,10)) console.log('    rating=' + p.rating + '  reviews=' + p.reviews + '  ' + p.name);
})();
