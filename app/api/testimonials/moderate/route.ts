import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function htmlPage(title: string, body: string, accent: 'emerald' | 'rose' | 'slate' = 'slate') {
  const color =
    accent === 'emerald' ? '#059669' : accent === 'rose' ? '#e11d48' : '#0f172a';
  return new NextResponse(
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, system-ui, sans-serif; background: #FDFDFB; color: #0f172a; margin: 0; padding: 0; }
    .wrap { max-width: 480px; margin: 80px auto; padding: 40px 24px; text-align: center; }
    h1 { font-size: 28px; font-weight: 900; letter-spacing: -0.02em; color: ${color}; margin-bottom: 12px; }
    p { font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 24px; }
    a { color: #0f172a; text-decoration: none; font-weight: 700; border-bottom: 2px solid #0f172a; padding-bottom: 2px; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>${title}</h1>
    <p>${body}</p>
    <p><a href="https://www.thedripmap.com">← Back to TheDripMap</a></p>
  </div>
</body>
</html>`,
    {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    }
  );
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const token = searchParams.get('token');
  const action = searchParams.get('action');

  if (!id || !token || !action || !['approve', 'reject'].includes(action)) {
    return htmlPage('Invalid link', 'This moderation link is malformed or missing parameters.', 'rose');
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: row, error: fetchError } = await supabase
      .from('testimonials')
      .select('id, status, moderation_token, provider_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !row) {
      return htmlPage('Not found', 'This testimonial no longer exists.', 'rose');
    }

    if (row.moderation_token !== token) {
      return htmlPage('Invalid token', 'This moderation link is no longer valid.', 'rose');
    }

    if (row.status !== 'pending') {
      return htmlPage(
        'Already moderated',
        `This testimonial was already marked "${row.status}" — no change made.`,
        'slate'
      );
    }

    const isApprove = action === 'approve';
    const updates: Record<string, unknown> = {
      status: isApprove ? 'approved' : 'rejected',
      moderation_token: '__used__',
    };
    if (isApprove) updates.approved_at = new Date().toISOString();
    else updates.rejected_at = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('testimonials')
      .update(updates)
      .eq('id', id);

    if (updateError) {
      console.error('Testimonial moderation update error:', updateError);
      return htmlPage('Server error', 'Could not update the testimonial. Try again.', 'rose');
    }

    return htmlPage(
      isApprove ? 'Approved ✓' : 'Rejected',
      isApprove
        ? 'The testimonial is now live on the clinic page.'
        : 'The testimonial has been hidden from public view.',
      isApprove ? 'emerald' : 'rose'
    );
  } catch (err) {
    console.error('Testimonial moderation error:', err);
    return htmlPage('Server error', 'Something went wrong moderating this testimonial.', 'rose');
  }
}
