import { supabase } from './src/lib/supabase';

function htmlToMarkdown(html: string): string {
  if (!html) return '';
  let md = html;
  md = md.replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n');
  md = md.replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n');
  md = md.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b>(.*?)<\/b>/gi, '**$1**');
  md = md.replace(/<ul>/gi, '\n');
  md = md.replace(/<\/ul>/gi, '\n');
  md = md.replace(/<li>(.*?)<\/li>/gi, '- $1\n');
  md = md.replace(/<a\s+(?:[^>]*?\s+)?href=\"(.*?)\"[^>]*?>(.*?)<\/a>/gi, '[$2]($1)');
  md = md.replace(/<p>(.*?)<\/p>/gi, '$1\n\n');
  md = md.replace(/<br\s*\/?>/gi, '\n');
  md = md.replace(/&nbsp;/g, ' ');
  md = md.replace(/\n{3,}/g, '\n\n');
  return md.trim();
}

async function fixPosts() {
  const slugs = ['mobile-iv-therapy-near-me', 'best-iv-therapy-new-york'];
  console.log('Starting cleanup with ANON key for:', slugs.join(', '));
  for (const slug of slugs) {
    const { data: post } = await supabase.from('blog_posts').select('content').eq('slug', slug).single();
    if (!post) continue;
    const cleanMarkdown = htmlToMarkdown(post.content);
    const { data: updatedData, error: updateError } = await supabase
      .from('blog_posts')
      .update({ content: cleanMarkdown })
      .eq('slug', slug)
      .select();
    if (updateError) {
      console.error(`Error updating ${slug}:`, updateError);
    } else if (!updatedData || updatedData.length === 0) {
      console.error(`No rows updated for ${slug}. (RLS issue confirm)`);
    } else {
      console.log(`Successfully fixed ${slug}.`);
    }
  }
}
fixPosts();
