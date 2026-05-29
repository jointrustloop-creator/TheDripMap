import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { isAdminRequest } from '../../../src/lib/admin-auth';
import {
  AdminBacklinksClient,
  type BacklinkRow,
} from '../../../src/components/AdminBacklinksClient';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

export default async function AdminBacklinksPage() {
  if (!(await isAdminRequest())) {
    redirect('/admin/login?next=/admin/backlinks');
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('backlink_targets')
    .select(
      'id, url, domain, target_type, page_title, contact_name, contact_email, article_to_pitch, reason, domain_authority, status, researched_at, drafted_at, sent_at, linked_at'
    )
    .order('researched_at', { ascending: false })
    .limit(300);

  if (error && error.code === '42P01') {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <h1 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
            Backlink targets table not yet created
          </h1>
          <p className="text-slate-500 mb-4">
            Run{' '}
            <code className="bg-slate-100 px-2 py-1 rounded text-xs">
              scripts/create-backlink-targets-table.sql
            </code>{' '}
            in the Supabase SQL editor first, then refresh this page.
          </p>
        </div>
      </main>
    );
  }

  const rows = (data || []) as BacklinkRow[];

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm font-black text-slate-900 hover:text-wellness-600">
              TheDripMap
            </Link>
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
              Admin / Backlinks
            </span>
          </div>
          <nav className="flex items-center gap-4 text-xs font-black text-slate-500">
            <Link href="/admin/testimonials" className="hover:text-slate-900">
              Testimonials
            </Link>
            <Link href="/admin/leads" className="hover:text-slate-900">
              Leads
            </Link>
          </nav>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            Backlink outreach
          </h1>
          <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
            Researched targets and Gmail drafts queued by the daily crons. Open Gmail Drafts to
            review and send each morning, then come back here to mark <strong>sent</strong>,{' '}
            <strong>replied</strong>, or <strong>linked</strong>.
          </p>
        </div>

        <AdminBacklinksClient initialRows={rows} />
      </section>
    </main>
  );
}
