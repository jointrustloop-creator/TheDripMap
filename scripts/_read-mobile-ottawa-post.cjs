require('dotenv').config({ path: '.env.local' });
const sb = require('@supabase/supabase-js').createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { data } = await sb.from('blog_posts').select('*').eq('slug','mobile-iv-therapy-ottawa').single();
  if (!data) { console.log('not found'); return; }
  console.log('TITLE: ' + data.title);
  console.log('CATEGORY: ' + data.category);
  console.log('AUTHOR: ' + data.author);
  console.log('DATE: ' + data.date);
  console.log('META_TITLE: ' + data.meta_title);
  console.log('META_DESCRIPTION: ' + data.meta_description);
  console.log('EXCERPT: ' + data.excerpt);
  console.log('IMAGE: ' + data.image_url);
  console.log('RELATED_CITIES: ' + JSON.stringify(data.related_cities));
  console.log('RELATED_CLINICS: ' + JSON.stringify(data.related_clinics));
  console.log('CONTENT length: ' + (data.content ? data.content.length : 0));
  console.log('--- content first 4000 chars ---');
  console.log((data.content || '').slice(0, 4000));
})();
