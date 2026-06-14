/**
 * /admin
 *
 * Admin dashboard home. Lists every admin and operator-tool surface in
 * the codebase as a grouped tile grid so the operator does not have to
 * type routes by hand. Each section maps to a use case (Outreach + Sales,
 * Content + SEO, Clinics + Data). Middleware enforces the password gate
 * before any of these are reachable.
 *
 * Per the 2026-06-09 operator spec: every admin route is reachable from
 * here. The link list below is the source of truth and must be kept in
 * sync when admin pages are added or removed.
 */
import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getPerProviderCounts } from '../../src/lib/analytics-query';
import {
  Target,
  Sparkles,
  Inbox,
  MessageCircleHeart,
  LineChart,
  BookOpen,
  Wrench,
  Star,
  Link2,
  ExternalLink,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Admin | TheDripMap',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

// Real, live stats for the dashboard header. Best-effort: never throws, so a
// transient analytics hiccup can't break the admin home. 30-day window matches
// the default on /admin/insights.
async function loadStats() {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const sinceIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const [provTotal, claimed, featured, per] = await Promise.all([
      supabase.from('providers').select('id', { count: 'exact', head: true }),
      supabase.from('providers').select('id', { count: 'exact', head: true }).eq('is_claimed', true),
      supabase.from('providers').select('id', { count: 'exact', head: true }).eq('is_featured', true),
      getPerProviderCounts({ sinceIso, client: supabase }),
    ]);
    const views30 = per.reduce((s, p) => s + p.counts.view, 0);
    const clicks30 = per.reduce(
      (s, p) => s + p.counts.book_click + p.counts.call_click + p.counts.website_click + p.counts.directions_click + p.counts.message_click,
      0,
    );
    return {
      providers: provTotal.count ?? 0,
      claimed: claimed.count ?? 0,
      featured: featured.count ?? 0,
      views30,
      clicks30,
      active30: per.length,
    };
  } catch {
    return null;
  }
}

interface Tile {
  href: string;
  label: string;
  description: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  external?: boolean;
}

interface Group {
  title: string;
  tiles: Tile[];
}

const GROUPS: Group[] = [
  {
    title: 'Outreach and Sales',
    tiles: [
      { href: '/admin/opportunities', Icon: Target, label: 'Opportunities pitch tracker', description: 'Per-clinic gaps, status, last contacted, notes. Default sort: warm clinics with a real gap first.' },
      { href: '/admin/tools', Icon: Wrench, label: 'Tools and action buttons', description: 'Generate Get Found Kit, regenerate outreach drafts, queue claim follow-ups, GSC snapshot, ratings refresh.' },
      { href: '/admin/leads', Icon: Inbox, label: 'Leads', description: 'Captured site leads, contact form, email signup, message-clinic flow.' },
      { href: '/admin/replies', Icon: MessageCircleHeart, label: 'Outreach replies', description: 'Classified clinic responses to our outreach. Mark handled, set reply category.' },
    ],
  },
  {
    title: 'Content and SEO',
    tiles: [
      { href: '/admin/clinic-owner-pains', Icon: BookOpen, label: 'Clinic owner pains, living research', description: 'Internal knowledge base of IV and med-spa owner pains, paraphrased from credible sources.' },
      { href: '/admin/backlinks', Icon: Link2, label: 'Backlinks', description: 'Backlink scaffolding, seed targets, link campaigns.' },
      { href: '/tools/get-found-kit', Icon: ExternalLink, label: 'Get Found Kit (public marketing page)', description: 'The $149 product landing the kit-generator outputs feed into.', external: true },
    ],
  },
  {
    title: 'Clinics and Data',
    tiles: [
      { href: '/admin/insights', Icon: LineChart, label: 'Per-clinic engagement insights', description: 'Views + book / call / website / directions / message clicks per clinic. Filter by last 30 days / month / all-time and claimed vs unclaimed.' },
      { href: '/admin/testimonials', Icon: Star, label: 'Testimonials moderation', description: 'Approve, edit, or reject patient testimonials submitted on claimed listings.' },
    ],
  },
];

export default async function AdminDashboardPage() {
  const stats = await loadStats();
  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="font-black text-slate-900 tracking-tight text-3xl md:text-4xl mb-2">
          <span className="font-serif italic font-normal text-[#0F6E56]">Welcome back.</span>
        </h1>
        <p className="text-sm text-slate-500 font-medium max-w-2xl">
          Every admin surface is reachable from this page. The top nav stays with you across all admin pages.
        </p>
      </div>

      {stats && (
        <Link href="/admin/insights?window=30d" className="block mb-12 group">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#0F6E56]">Live stats · last 30 days</h2>
            <span className="text-xs font-bold text-slate-400 group-hover:text-[#0F6E56]">Full insights &rarr;</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {([
              ['Providers', stats.providers],
              ['Claimed', stats.claimed],
              ['Featured', stats.featured],
              ['Views (30d)', stats.views30],
              ['Clicks (30d)', stats.clicks30],
              ['Active listings', stats.active30],
            ] as [string, number][]).map(([label, n]) => (
              <div key={label} className="bg-white border border-slate-200 rounded-2xl p-4 group-hover:border-[#0F6E56]/30 transition-colors">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</div>
                <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">{n.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </Link>
      )}

      <div className="space-y-12">
        {GROUPS.map((group) => (
          <section key={group.title}>
            <h2 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#0F6E56] mb-4">
              {group.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.tiles.map((t) => (
                <TileCard key={t.href} tile={t} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-16 text-xs text-slate-400 font-medium">
        Internal use only. noindex. Anything taken to a clinic-facing surface goes through the normal draft and review gate.
      </p>
    </main>
  );
}

function TileCard({ tile }: { tile: Tile }) {
  const { Icon, href, label, description, external } = tile;
  const body = (
    <>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-[#d8b878]/15 text-[#8a6f3e] flex items-center justify-center shrink-0 ring-1 ring-[#d8b878]/25">
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-black text-slate-900 tracking-tight leading-snug">
            {label}
            {external && <ExternalLink size={11} className="inline-block ml-1.5 text-slate-400 -mt-1" />}
          </h3>
        </div>
      </div>
      <p className="text-xs text-slate-600 leading-relaxed font-medium">{description}</p>
    </>
  );

  const cls = 'group block bg-white rounded-2xl border border-slate-200/70 p-5 shadow-[0_2px_10px_-2px_rgba(15,40,30,0.04)] hover:shadow-[0_8px_24px_-4px_rgba(15,40,30,0.09)] hover:border-[#0F6E56]/40 transition-all';

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener" className={cls}>
        {body}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {body}
    </Link>
  );
}
