import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const providerId = String(data?.providerId || '').trim();
    const providerName = String(data?.providerName || '').trim();
    const providerSlug = String(data?.providerSlug || '').trim();
    const authorName = String(data?.authorName || '').trim();
    const authorEmail = String(data?.authorEmail || '').trim().toLowerCase();
    const rating = Number(data?.rating);
    const title = data?.title ? String(data.title).trim().slice(0, 120) : null;
    const body = String(data?.body || '').trim();
    const visitDate = data?.visitDate || null;

    if (
      !providerId ||
      !authorName ||
      !authorEmail ||
      !body ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid fields.' },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail)) {
      return NextResponse.json({ success: false, error: 'Invalid email.' }, { status: 400 });
    }

    if (body.length < 30) {
      return NextResponse.json(
        { success: false, error: 'Please write at least a few sentences.' },
        { status: 400 }
      );
    }

    // Generate id and moderation token in code so we don't need to read them back from the DB.
    // Using the anon key means we don't depend on SUPABASE_SERVICE_ROLE_KEY being set in production.
    // The RLS "anon insert testimonials" policy permits this insert.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const newId = crypto.randomUUID();
    const moderationToken = crypto.randomBytes(24).toString('hex');

    const { error: insertError } = await supabase.from('testimonials').insert({
      id: newId,
      provider_id: providerId,
      author_name: authorName.slice(0, 120),
      author_email: authorEmail.slice(0, 240),
      rating,
      title,
      body: body.slice(0, 4000),
      visit_date: visitDate,
      moderation_token: moderationToken,
      status: 'pending',
    });

    if (insertError) {
      console.error('Testimonial insert error:', insertError);
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      );
    }

    if (process.env.RESEND_API_KEY) {
      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thedripmap.com';
        const approveUrl = `${siteUrl}/api/testimonials/moderate?id=${newId}&token=${moderationToken}&action=approve`;
        const rejectUrl = `${siteUrl}/api/testimonials/moderate?id=${newId}&token=${moderationToken}&action=reject`;

        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: 'TheDripMap <info@thedripmap.com>',
          to: 'info@thedripmap.com',
          replyTo: authorEmail,
          subject: `Testimonial pending: ${providerName} (${rating}/5)`,
          text: `New testimonial pending review.

Clinic: ${providerName}
Listing: ${siteUrl}/providers/${providerSlug}

Rating: ${rating} / 5
${title ? `Title: ${title}\n` : ''}
From: ${authorName} <${authorEmail}>
Visited: ${visitDate || 'not specified'}

Testimonial:
${body}

—
APPROVE  →  ${approveUrl}
REJECT   →  ${rejectUrl}

(Both links are one-click and require no login. They expire when the moderation token is invalidated.)
`,
        });
      } catch (emailErr) {
        console.error('Resend testimonial email error:', emailErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Testimonial submit error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
