/**
 * Shared admin layout.
 *
 * Wraps every /admin/* page with a persistent top nav so the operator
 * can jump between admin pages from anywhere. The login page suppresses
 * the nav via a usePathname check inside <AdminNav />, so the same layout
 * file is safe for both the login screen and the gated pages.
 *
 * Authorization is enforced by middleware.ts at the request level. This
 * layout does NOT re-check; it only renders the chrome.
 */
import React from 'react';
import type { Metadata } from 'next';
import { AdminNav } from './AdminNav';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNav />
      <div>{children}</div>
    </div>
  );
}
