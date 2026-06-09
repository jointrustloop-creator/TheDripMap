/**
 * /admin/opportunities
 *
 * Get Found opportunity analysis. Reads the most-recent gbp_snapshots row
 * per clinic via the gbp_snapshots_latest view, joins to providers for
 * name/city/claim status, computes the summary numbers + table rows.
 * Renders the interactive (sortable/filterable) view via the client
 * component below.
 *
 * No Places API calls happen on page load. All data is from the snapshot
 * table, populated by the monthly cron and the on-demand Refresh button.
 *
 * Admin-gated. noindex.
 */
import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { isAdminRequest } from '../../../src/lib/admin-auth';
import { OpportunitiesClient, type OpportunityRow, type Summary } from './OpportunitiesClient';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

interface SnapshotRow {
  clinic_id: string;
  place_id: string | null;
  primary_type: string | null;
  types: string[] | null;
  rating: number | null;
  review_count: number | null;
  photo_count: number | null;
  has_website: boolean | null;
  has_phone: boolean | null;
  has_hours: boolean | null;
  category_gap: boolean;
  reviews_gap: boolean;
  photos_gap: boolean;
  completeness_gap: boolean;
  gap_score: number;
  tier: string;
  gap_list: string[];
  captured_at: string;
}

interface ProviderRow {
  id: string;
  name: string;
  slug: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  is_claimed: boolean | null;
}

export default async function AdminOpportunitiesPage() {
  if (!(await isAdminRequest())) {
    redirect('/admin/login?next=/admin/opportunities');
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const snapsRes = await supabase.from('gbp_snapshots_latest').select('*').limit(5000);
  const tableMissing = !!snapsRes.error;
  const snaps = (snapsRes.data || []) as SnapshotRow[];

  let provs: ProviderRow[] = [];
  if (snaps.length > 0) {
    const ids = Array.from(new Set(snaps.map((s) => s.clinic_id)));
    for (let i = 0; i < ids.length; i += 500) {
      const slice = ids.slice(i, i + 500);
      const r = await supabase
        .from('providers')
        .select('id, name, slug, city, state, country, is_claimed')
        .in('id', slice);
      provs.push(...((r.data || []) as ProviderRow[]));
    }
  }
  const provById = new Map(provs.map((p) => [p.id, p]));

  const rows: OpportunityRow[] = snaps
    .map((s) => {
      const p = provById.get(s.clinic_id);
      if (!p) return null;
      return {
        clinicId: s.clinic_id,
        slug: p.slug || '',
        name: p.name || '',
        city: p.city || '',
        state: p.state || '',
        country: p.country || '',
        isClaimed: !!p.is_claimed,
        primaryType: s.primary_type || '',
        types: s.types || [],
        rating: s.rating,
        reviewCount: s.review_count,
        photoCount: s.photo_count,
        hasWebsite: !!s.has_website,
        hasPhone: !!s.has_phone,
        hasHours: !!s.has_hours,
        categoryGap: s.category_gap,
        reviewsGap: s.reviews_gap,
        photosGap: s.photos_gap,
        completenessGap: s.completeness_gap,
        gapScore: s.gap_score,
        tier: (s.tier as 'high' | 'medium' | 'low') || 'low',
        gapList: s.gap_list || [],
        capturedAt: s.captured_at,
      } satisfies OpportunityRow;
    })
    .filter((r): r is OpportunityRow => r !== null);

  // Sort by gap_score desc, then claimed first within tier, then name.
  rows.sort((a, b) => {
    if (b.gapScore !== a.gapScore) return b.gapScore - a.gapScore;
    if (a.isClaimed !== b.isClaimed) return a.isClaimed ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const summary: Summary = {
    totalAnalyzed: rows.length,
    needHelp: rows.filter((r) => r.gapScore >= 1).length,
    high: rows.filter((r) => r.tier === 'high').length,
    medium: rows.filter((r) => r.tier === 'medium').length,
    low: rows.filter((r) => r.tier === 'low').length,
    canada: rows.filter((r) => r.country === 'Canada').length,
    us: rows.filter((r) => r.country === 'United States').length,
    placesUnresolved: snaps.filter((s) => !s.place_id).length,
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm font-black text-slate-900 hover:text-wellness-600">
              TheDripMap
            </Link>
            <nav className="flex items-center gap-4 text-sm text-slate-500">
              <Link href="/admin/insights" className="hover:text-slate-900">Insights</Link>
              <Link href="/admin/opportunities" className="text-slate-900 font-bold">Opportunities</Link>
              <Link href="/admin/tools" className="hover:text-slate-900">Tools</Link>
              <Link href="/admin/leads" className="hover:text-slate-900">Leads</Link>
              <Link href="/admin/replies" className="hover:text-slate-900">Replies</Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Get Found opportunities</h1>
          <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
            Real Google Business Profile data, snapshotted monthly. Gap flags identify which clinics the Get Found Setup can actually help. Internal only: we do not contact clinics or modify profiles from this page.
          </p>
        </div>

        {tableMissing && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 text-sm text-amber-900">
            <div className="font-black mb-1">Snapshot table not yet created</div>
            <div>Run <code className="bg-amber-100 px-1.5 py-0.5 rounded">scripts/sql/add-gbp-snapshots.sql</code> in the Supabase SQL Editor, then trigger the first snapshot pass via the monthly cron or POST to <code className="bg-amber-100 px-1.5 py-0.5 rounded">/api/cron/gbp-snapshot?dryRun=1</code> first to estimate cost.</div>
          </div>
        )}

        {!tableMissing && rows.length === 0 && (
          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-5 mb-6 text-sm text-slate-700">
            <div className="font-black mb-1">No snapshots yet</div>
            <div>The monthly cron has not run. Trigger one batch with <code className="bg-slate-200 px-1.5 py-0.5 rounded">node scripts/_seed-gbp-snapshots.cjs</code> or hit <code className="bg-slate-200 px-1.5 py-0.5 rounded">/api/cron/gbp-snapshot</code> with the CRON_SECRET to populate.</div>
          </div>
        )}

        <OpportunitiesClient rows={rows} summary={summary} />
      </div>
    </main>
  );
}
