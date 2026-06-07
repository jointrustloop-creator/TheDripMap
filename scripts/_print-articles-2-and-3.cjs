require('dotenv').config({ path: '.env.local' });
const sb = require('@supabase/supabase-js').createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  for (const slug of ['is-iv-therapy-a-scam-what-the-science-says', 'canadian-iv-clinic-regulations-2026']) {
    const { data } = await sb.from('blog_posts').select('*').eq('slug', slug).single();
    console.log('=============================================================');
    console.log('SLUG: ' + data.slug);
    console.log('TITLE: ' + data.title);
    console.log('META TITLE: ' + data.meta_title);
    console.log('META DESCRIPTION: ' + data.meta_description);
    console.log('EXCERPT: ' + data.excerpt);
    console.log('CATEGORY: ' + data.category);
    console.log('AUTHOR: ' + data.author);
    console.log('LAST UPDATED: ' + data.last_updated);
    console.log('=============================================================');
    console.log();
    console.log(data.content);
    console.log();
    console.log();
  }
})();
