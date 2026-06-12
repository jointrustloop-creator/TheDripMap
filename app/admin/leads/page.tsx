import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { isAdminRequest } from '../../../src/lib/admin-auth';
import { AdminLeadsClient } from '../../../src/components/AdminLeadsClient';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

export interface LeadRow {
  id: string;
  source: 'contact' | 'message-clinic' | 'subscribe' | 'claim' | 'testimonial' | 'upgrade' | 'seo-audit' | 'brand-voice';
  email: string;
  name: string;
  message: string;
  meta?: Record<string, string | number | null>;
  created_at: string;
}

export default async function AdminLeadsPage() {
  if (!(await isAdminRequest())) {
    redirect('/admin/login?next=/admin/leads');
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Pull all 3 lead-bearing tables in parallel — last 30 days, capped.
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

  const [inqRes, claimRes, testRes] = await Promise.all([
    supabase
      .from('inquiries')
      // 2026-06-12: forward_status / forwarded_to_clinic_email /
      // forwarded_to_clinic_at are recorded by /api/message-clinic in
      // shadow mode so the admin can see what auto-forward WOULD have
      // done. The select tolerates these columns being absent in dev.
      .select('id, name, email, phone, message, listing_id, created_at, forward_status, forwarded_to_clinic_email, forwarded_to_clinic_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('claim_requests')
      .select(
        'id, email, owner_name, owner_phone, listing_id, status, verified_at, expires_at, created_at'
      )
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('testimonials')
      .select(
        'id, author_name, author_email, rating, title, body, status, created_at'
      )
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(200),
  ]);

  const all: LeadRow[] = [];

  // Categorize inquiries by message-body marker
  for (const r of (inqRes.data || []) as Array<{
    id: string;
    name: string;
    email: string;
    phone: string | null;
    message: string;
    listing_id: string | null;
    created_at: string;
    forward_status?: string | null;
    forwarded_to_clinic_email?: string | null;
    forwarded_to_clinic_at?: string | null;
  }>) {
    const msg = r.message || '';
    let source: LeadRow['source'] = 'contact';
    if (msg.startsWith('[Lead for ')) source = 'message-clinic';
    else if (msg.startsWith('[SUBSCRIBE]')) source = 'subscribe';
    else if (msg.startsWith('[UPGRADE REQUEST]')) source = 'upgrade';
    else if (msg.startsWith('[SEO AUDIT]')) source = 'seo-audit';
    else if (msg.startsWith('[BRAND VOICE]')) source = 'brand-voice';
    all.push({
      id: r.id,
      source,
      name: r.name || '(none)',
      email: r.email,
      message: msg,
      meta: {
        phone: r.phone,
        listing_id: r.listing_id,
        forward_status: r.forward_status || null,
        forwarded_to_clinic_email: r.forwarded_to_clinic_email || null,
        forwarded_to_clinic_at: r.forwarded_to_clinic_at || null,
      },
      created_at: r.created_at,
    });
  }

  for (const r of (claimRes.data || []) as Array<{
    id: string;
    email: string;
    owner_name: string | null;
    owner_phone: string | null;
    listing_id: string | null;
    status: string | null;
    verified_at: string | null;
    expires_at: string | null;
    created_at: string;
  }>) {
    all.push({
      id: r.id,
      source: 'claim',
      name: r.owner_name || '(none)',
      email: r.email,
      message: `Claim for listing_id=${r.listing_id || '(unknown)'} · status=${r.status || 'pending'}`,
      meta: {
        phone: r.owner_phone,
        listing_id: r.listing_id,
        status: r.status,
        verified_at: r.verified_at,
        expires_at: r.expires_at,
      },
      created_at: r.created_at,
    });
  }

  for (const r of (testRes.data || []) as Array<{
    id: string;
    author_name: string;
    author_email: string;
    rating: number;
    title: string | null;
    body: string;
    status: string;
    created_at: string;
  }>) {
    all.push({
      id: r.id,
      source: 'testimonial',
      name: r.author_name,
      email: r.author_email,
      message: `${r.rating}★ ${r.title ? `"${r.title}" · ` : ''}${r.body}`,
      meta: { rating: r.rating, status: r.status, title: r.title },
      created_at: r.created_at,
    });
  }

  // Sort all leads chronologically (newest first) across types
  all.sort((a, b) => b.created_at.localeCompare(a.created_at));

  const counts = {
    contact: all.filter((l) => l.source === 'contact').length,
    'message-clinic': all.filter((l) => l.source === 'message-clinic').length,
    subscribe: all.filter((l) => l.source === 'subscribe').length,
    claim: all.filter((l) => l.source === 'claim').length,
    testimonial: all.filter((l) => l.source === 'testimonial').length,
    upgrade: all.filter((l) => l.source === 'upgrade').length,
    'seo-audit': all.filter((l) => l.source === 'seo-audit').length,
    'brand-voice': all.filter((l) => l.source === 'brand-voice').length,
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm font-black text-slate-900 hover:text-wellness-600">
              TheDripMap
            </Link>
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
              Admin / Leads
            </span>
            <Link
              href="/admin/testimonials"
              className="text-xs font-bold text-slate-500 hover:text-wellness-600"
            >
              Testimonials →
            </Link>
          </div>
          <form action="/api/admin/logout" method="POST">
            <button className="text-xs font-bold text-slate-500 hover:text-rose-600">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-baseline gap-6 mb-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            All form submissions
          </h1>
        </div>
        <p className="text-sm text-slate-500 mb-8">
          Last 30 days · {all.length} total leads across all forms · refresh page for latest
        </p>

        <AdminLeadsClient initialLeads={all} counts={counts} />
      </div>
    </main>
  );
}
