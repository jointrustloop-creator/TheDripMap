import { getBlogPosts } from './src/lib/data';
import { containsHtml, htmlToMarkdown } from './src/lib/blog-utils';
import { getServiceSupabase } from './src/lib/supabase';

async function performCleanup() {
  console.log('Starting blog post cleanup...');
  try {
    const posts = await getBlogPosts();
    const affected = posts.filter(post => containsHtml(post.content));

    if (affected.length === 0) {
      console.log('No blog posts found with raw HTML content. Cleanup complete.');
      return;
    }

    console.log(`Found ${affected.length} affected post(s) to clean up.\n`);
    
    // Check if service key is available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY.includes('your_service_role_key')) {
        console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY is not set or is a placeholder. Cannot perform cleanup.');
        return;
    }

    const supabase = getServiceSupabase();

    for (const post of affected) {
      console.log(`Cleaning up: ${post.title} (${post.slug})...`);
      const cleanMarkdown = htmlToMarkdown(post.content);
      
      const { error } = await supabase
        .from('blog_posts')
        .update({ content: cleanMarkdown })
        .eq('slug', post.slug);

      if (error) {
        console.error(`Failed to update ${post.slug}:`, error.message);
      } else {
        console.log(`Successfully updated ${post.slug}.`);
      }
    }

    console.log('\nCleanup finished.');

  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

performCleanup();
