import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { isAdminRequest } from '../../src/lib/admin-auth';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// /admin has no UI of its own — bounce based on the tdm_admin cookie:
//   already authenticated  -> /admin/insights (the dashboard)
//   not authenticated      -> /admin/login (with ?next so they land on
//                              /admin/insights after sign-in)
export default async function AdminIndex() {
  if (await isAdminRequest()) {
    redirect('/admin/insights');
  }
  redirect('/admin/login?next=/admin/insights');
}
