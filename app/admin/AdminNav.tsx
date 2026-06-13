'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Menu, X } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
}

// 2026-06-12 admin audit: Onboarding added (W1 queue is now the core daily
// surface). Owner pains demoted out of the nav (internal research; still
// reachable via the Tools page link and direct URL).
const NAV: NavItem[] = [
  { href: '/admin', label: 'Home' },
  { href: '/admin/onboarding', label: 'Onboarding' },
  { href: '/admin/opportunities', label: 'Opportunities' },
  { href: '/admin/insights', label: 'Insights' },
  { href: '/admin/tools', label: 'Tools' },
  { href: '/admin/testimonials', label: 'Testimonials' },
  { href: '/admin/leads', label: 'Leads' },
  { href: '/admin/replies', label: 'Replies' },
  { href: '/admin/backlinks', label: 'Backlinks' },
];

export function AdminNav() {
  const pathname = usePathname() || '';
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // The login page is the only admin page that should NOT have the nav.
  if (pathname.startsWith('/admin/login')) return null;

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname === href || pathname.startsWith(href + '/');
  };

  const logout = async () => {
    try { await fetch('/api/admin/logout', { method: 'POST' }); } catch { /* ignore */ }
    router.push('/admin/login');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Brand */}
          <Link href="/admin" className="flex items-center gap-2 text-sm font-black text-slate-900 hover:text-[#0F6E56] transition-colors">
            <span className="font-serif italic text-[#0F6E56]">TheDripMap</span>
            <span className="text-slate-400 font-normal text-xs uppercase tracking-[0.2em]">Admin</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  'text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ' +
                  (isActive(item.href)
                    ? 'bg-[#0F6E56] text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100')
                }
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={logout}
              className="ml-2 inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-rose-600 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
              title="Log out"
            >
              <LogOut size={12} />
              Logout
            </button>
          </nav>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <nav className="md:hidden pb-4 flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={
                  'text-sm font-bold px-3 py-2 rounded-lg ' +
                  (isActive(item.href)
                    ? 'bg-[#0F6E56] text-white'
                    : 'text-slate-700 hover:bg-slate-100')
                }
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => { setOpen(false); logout(); }}
              className="text-left text-sm font-bold text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-lg flex items-center gap-2"
            >
              <LogOut size={14} />
              Logout
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
