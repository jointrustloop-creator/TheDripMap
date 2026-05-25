import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { isAdminRequest } from '../../../src/lib/admin-auth';
import { AdminTestimonialsClient } from '../../../src/components/AdminTestimonialsClient';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

interface TestimonialRow {
  id: string;
  provider_id: string;
  author_name: string;
  author_email: string;
  rating: number;
  title: string | null;
  body: string;
  visit_date: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  provider?: { name: string; slug: string; city: string } | null;
}

export default async function AdminTestimonialsPage() {
  if (!(await isAdminRequest())) {
    redirect('/admin/login?next=/admin/testimonials');
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: rows, error } = await supabase
    .from('testimonials')
    .select(
      `id, provider_id, author_name, author_email, rating, title, body, visit_date,
       status, created_at, approved_at, rejected_at,
       provider:providers!testimonials_provider_id_fkey(name, slug, city)`
    )
    .order('status', { ascending: true }) // pending first
    .order('created_at', { ascending: false })
    .limit(200);

  if (error && error.code === '42P01') {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <h1 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
            Testimonials table not yet created
          </h1>
          <p className="text-slate-500 mb-4">
            Run <code className="bg-slate-100 px-2 py-1 rounded text-xs">scripts/create-testimonials-table.sql</code> in the Supabase SQL editor first, then refresh this page.
          </p>
        </div>
      </main>
    );
  }

  const list = (rows || []) as unknown as TestimonialRow[];

  const counts = {
    pending: list.filter((r) => r.status === 'pending').length,
    approved: list.filter((r) => r.status === 'approved').length,
    rejected: list.filter((r) => r.status === 'rejected').length,
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm font-black text-slate-900 hover:text-wellness-600">
              TheDripMap
            </Link>
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
              Admin / Testimonials
            </span>
          </div>
          <form action="/api/admin/logout" method="POST">
            <button className="text-xs font-bold text-slate-500 hover:text-rose-600">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-baseline gap-6 mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Testimonial moderation
          </h1>
          <div className="text-sm font-bold text-slate-500">
            <span className="text-amber-600">{counts.pending} pending</span>
            <span className="mx-2 text-slate-300">·</span>
            <span className="text-emerald-600">{counts.approved} approved</span>
            <span className="mx-2 text-slate-300">·</span>
            <span className="text-slate-400">{counts.rejected} rejected</span>
          </div>
        </div>

        <AdminTestimonialsClient initialRows={list} />
      </div>
    </main>
  );
}
