/**
 * /admin/tools
 *
 * On-demand operator buttons. Admin-cookie gated, noindex. No secrets
 * needed — when the operator is logged into /admin, the same cookie
 * authorises the two endpoints behind these buttons.
 *
 * - Generate 10 outreach drafts (POST /api/admin/regenerate-outreach?mode=next&limit=10)
 * - Refresh verified ratings now (POST /api/admin/refresh-verified-ratings)
 *
 * Daily cron remains untouched; this is purely operator-triggered.
 */
import React from 'react';
import { redirect } from 'next/navigation';
import { isAdminRequest } from '../../../src/lib/admin-auth';
import { AdminToolsClient } from './AdminToolsClient';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

export default async function AdminToolsPage() {
  if (!(await isAdminRequest())) {
    redirect('/admin/login?next=/admin/tools');
  }
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <a href="/admin/insights" className="text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-slate-900">
            ← back to insights
          </a>
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Admin tools</h1>
        <p className="text-sm text-slate-500 mb-10 font-medium">
          On-demand operator actions. The daily cron handles the standing batch;
          these buttons are for ad-hoc runs.
        </p>
        <AdminToolsClient />
      </div>
    </main>
  );
}
