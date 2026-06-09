/**
 * /admin/clinic-owner-pains
 *
 * Internal knowledge base of pains IV therapy + med-spa clinic owners
 * face. Living document, refreshed weekly by the cron at
 * /api/cron/clinic-owner-pains-research. The Supabase row at
 * clinic_owner_pains.id=1 is the canonical body. The committed
 * docs/clinic-owner-pains.md is the seed baseline only.
 *
 * Admin-gated. noindex. Research-only. Never publishes, never emails.
 */
import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { isAdminRequest } from '../../../src/lib/admin-auth';
import { RefreshButton } from './RefreshButton';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

export default async function ClinicOwnerPainsPage() {
  if (!(await isAdminRequest())) {
    redirect('/admin/login?next=/admin/clinic-owner-pains');
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const r = await supabase.from('clinic_owner_pains').select('body, updated_at').eq('id', 1).maybeSingle();
  const tableMissing = !!r.error;
  const body = r.data?.body || '';
  const updatedAt = r.data?.updated_at || null;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm font-black text-slate-900 hover:text-wellness-600">
              TheDripMap
            </Link>
            <nav className="flex items-center gap-4 text-sm text-slate-500">
              <Link href="/admin/insights" className="hover:text-slate-900">Insights</Link>
              <Link href="/admin/opportunities" className="hover:text-slate-900">Opportunities</Link>
              <Link href="/admin/clinic-owner-pains" className="text-slate-900 font-bold">Owner pains</Link>
              <Link href="/admin/tools" className="hover:text-slate-900">Tools</Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Clinic owner pains, living research</h1>
            <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
              Synthesized from credible public sources. Real research, paraphrased (we never copy text). Internal only. Never published, never sent to clinics.
              {updatedAt && (
                <span className="block mt-1 text-xs font-bold text-slate-400">Last refreshed: {new Date(updatedAt).toISOString().slice(0, 16).replace('T', ' ')} UTC</span>
              )}
            </p>
          </div>
          <RefreshButton />
        </div>

        {tableMissing && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 text-sm text-amber-900">
            <div className="font-black mb-1">clinic_owner_pains table not yet created</div>
            <div>Run <code className="bg-amber-100 px-1.5 py-0.5 rounded">scripts/sql/add-clinic-owner-pains.sql</code> in the Supabase SQL Editor, then seed with <code className="bg-amber-100 px-1.5 py-0.5 rounded">node scripts/_seed-opportunities-and-pains.cjs</code>.</div>
          </div>
        )}

        {!tableMissing && !body && (
          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-5 mb-6 text-sm text-slate-700">
            <div className="font-black mb-1">No content yet</div>
            <div>Seed with <code className="bg-slate-200 px-1.5 py-0.5 rounded">node scripts/_seed-opportunities-and-pains.cjs</code> or trigger the cron via the Refresh button above.</div>
          </div>
        )}

        {body && (
          <article className="bg-white rounded-2xl border border-slate-200 p-8 prose prose-slate max-w-none prose-headings:font-black prose-headings:tracking-tight prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-lg prose-a:text-wellness-600 prose-a:no-underline hover:prose-a:underline">
            <pre className="whitespace-pre-wrap text-sm text-slate-800 font-mono leading-relaxed">{body}</pre>
          </article>
        )}
      </div>
    </main>
  );
}
