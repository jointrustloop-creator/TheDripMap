import { NextResponse } from 'next/server';
import { getBlogPosts } from '@/src/lib/data';
import { containsHtml, htmlToMarkdown } from '@/src/lib/blog-utils';
import { getServiceSupabase } from '@/src/lib/supabase';

export async function GET() {
  try {
    const posts = await getBlogPosts();
    const affectedPosts = posts.filter(post => containsHtml(post.content)).map(post => ({
      slug: post.slug,
      title: post.title,
      originalContent: post.content,
      proposedMarkdown: htmlToMarkdown(post.content)
    }));

    return NextResponse.json({
      count: affectedPosts.length,
      affectedPosts
    });
  } catch (error) {
    console.error('Error identifying affected posts:', error);
    return NextResponse.json({ error: 'Failed to identify post content' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { confirm } = body;

    if (!confirm) {
      return NextResponse.json({ error: 'Confirmation required' }, { status: 400 });
    }

    const posts = await getBlogPosts();
    const affectedPosts = posts.filter(post => containsHtml(post.content));

    if (affectedPosts.length === 0) {
      return NextResponse.json({ message: 'No posts require cleanup' });
    }

    const supabaseService = getServiceSupabase();
    const results = [];

    for (const post of affectedPosts) {
      const cleanMarkdown = htmlToMarkdown(post.content);
      const { data, error } = await supabaseService
        .from('blog_posts')
        .update({ content: cleanMarkdown })
        .eq('slug', post.slug);

      results.push({
        slug: post.slug,
        success: !error,
        error: error ? error.message : null
      });
    }

    return NextResponse.json({
      message: `Cleaned ${results.filter(r => r.success).length} posts`,
      results
    });
  } catch (error) {
    console.error('Error cleaning blog posts:', error);
    return NextResponse.json({ error: 'Failed to clean post content' }, { status: 500 });
  }
}
