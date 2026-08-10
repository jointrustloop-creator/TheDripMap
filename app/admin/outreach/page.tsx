import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { isAdminRequest } from '../../../src/lib/admin-auth';
import { OutreachClient } from '../../../src/components/OutreachClient';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

export default async function AdminOutreachPage() {
  if (!(await isAdminRequest())) redirect('/admin/login?next=/admin/outreach');
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-6">
          <Link href="/" className="text-sm font-black text-slate-900 hover:text-wellness-600">TheDripMap</Link>
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">Admin / Outreach</span>
          <Link href="/admin/leads" className="text-xs font-bold text-slate-500 hover:text-wellness-600">Leads →</Link>
        </div>
      </header>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <OutreachClient />
      </div>
    </main>
  );
}
