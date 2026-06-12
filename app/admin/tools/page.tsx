/**
 * /admin/tools
 *
 * On-demand operator buttons. Admin-cookie gated, noindex. No secrets
 * needed — when the operator is logged into /admin, the same cookie
 * authorises the two endpoints behind these buttons.
 *
 * Current buttons: GSC snapshot, Get Found Kit generator, refresh verified
 * ratings, backfill hours, rescue 404 URLs, inspect held redirects, plus a
 * link to the owner-pains research page (demoted from the nav 2026-06-12).
 *
 * 2026-06-12 admin audit: the old-template outreach buttons (Generate 10,
 * Wipe + rebuild 50) and the stale Queue-pending-claim-drafts button were
 * retired; AUTOPILOT morning drafts + W4 triage replace them.
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
        <div className="mb-8 flex items-center gap-6">
          <a href="/admin/insights" className="text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-slate-900">
            ← back to insights
          </a>
          <a href="/admin/replies" className="text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-slate-900">
            Replies →
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
