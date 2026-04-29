import { getBlogPosts } from './src/lib/data';
import { containsHtml, htmlToMarkdown } from './src/lib/blog-utils';

async function checkBlogPosts() {
  console.log('Checking blog posts for raw HTML content...');
  try {
    const posts = await getBlogPosts();
    const affected = posts.filter(post => containsHtml(post.content));

    if (affected.length === 0) {
      console.log('No blog posts found with raw HTML content.');
      return;
    }

    console.log(`Found ${affected.length} affected post(s):\n`);
    
    affected.forEach((post, index) => {
      console.log(`--- Post ${index + 1} ---`);
      console.log(`Title: ${post.title}`);
      console.log(`Slug: ${post.slug}`);
      console.log(`Snippet: ${post.content.substring(0, 100)}...`);
      console.log(`Proposed Markdown Preview:`);
      console.log(htmlToMarkdown(post.content).substring(0, 150) + '...');
      console.log('\n');
    });

  } catch (error) {
    console.error('Error checking blog posts:', error);
  }
}

checkBlogPosts();
