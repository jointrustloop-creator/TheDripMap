require('dotenv').config({ path: '.env.local' });
const sb = require('@supabase/supabase-js').createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { data } = await sb.from('blog_posts').select('content').eq('slug', 'is-iv-therapy-a-scam-what-the-science-says').single();
  process.stdout.write(data.content);
})();
