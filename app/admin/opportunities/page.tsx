/**
 * /admin/opportunities
 *
 * Lean pitch tracker for the $299 Get Found outreach. Per the 2026-06-09
 * operator pivot: data source is the FREE agent assessment writing to
 * clinic_opportunities, NOT the paid Google Places batch. The legacy
 * gbp_snapshots table from 3483dbc remains for the seo-health cron, but
 * the page no longer reads from it.
 *
 * Per-row columns are minimal on purpose: name, city, contact email,
 * warm flag (claimed OR has replied), plain-words gaps, outreach status
 * (editable dropdown), last contacted (editable date), notes (editable),
 * assessed-at date, Generate kit button.
 *
 * Default sort: warm clinics with a real gap first.
 * Filters: status, warm-only, country (default Canada).
 * Summary line: funnel counts.
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

interface OpportunityRecord {
  id: string;
  clinic_id: string;
  gaps: string[];
  solid: string[];
  recommendation: string;
  manual_check: string[];
  assessed_at: string;
  outreach_status: string;
  last_contacted_at: string | null;
  notes: string;
  updated_at: string;
}

interface ProviderRow {
  id: string;
  name: string;
  slug: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  is_claimed: boolean | null;
  email: string | null;
  reply_status: string | null;
}

export default async function AdminOpportunitiesPage() {
  if (!(await isAdminRequest())) {
    redirect('/admin/login?next=/admin/opportunities');
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const oppsRes = await supabase.from('clinic_opportunities').select('*').limit(2000);
  const tableMissing = !!oppsRes.error;
  const opps = (oppsRes.data || []) as OpportunityRecord[];

  let provs: ProviderRow[] = [];
  if (opps.length > 0) {
    const ids = Array.from(new Set(opps.map((s) => s.clinic_id)));
    for (let i = 0; i < ids.length; i += 500) {
      const slice = ids.slice(i, i + 500);
      const r = await supabase
        .from('providers')
        .select('id, name, slug, city, state, country, is_claimed, email, reply_status')
        .in('id', slice);
      provs.push(...((r.data || []) as ProviderRow[]));
    }
  }
  const provById = new Map(provs.map((p) => [p.id, p]));

  const rows: OpportunityRow[] = opps
    .map((o) => {
      const p = provById.get(o.clinic_id);
      if (!p) return null;
      // Warm flag: claimed OR has replied to us before (reply_status not null/none).
      const warm = !!p.is_claimed || !!(p.reply_status && p.reply_status !== 'none');
      return {
        id: o.id,
        clinicId: o.clinic_id,
        slug: p.slug || '',
        name: p.name || '',
        city: p.city || '',
        state: p.state || '',
        country: p.country || '',
        isClaimed: !!p.is_claimed,
        email: p.email || '',
        warm,
        gaps: o.gaps || [],
        recommendation: (o.recommendation as 'yes' | 'no' | 'maybe') || 'maybe',
        outreachStatus: (o.outreach_status as OpportunityRow['outreachStatus']) || 'not_contacted',
        lastContactedAt: o.last_contacted_at || null,
        notes: o.notes || '',
        assessedAt: o.assessed_at,
      } satisfies OpportunityRow;
    })
    .filter((r): r is OpportunityRow => r !== null);

  // Default sort: warm clinics with a real gap first.
  rows.sort((a, b) => {
    const aReady = a.warm && a.gaps.length > 0 ? 0 : 1;
    const bReady = b.warm && b.gaps.length > 0 ? 0 : 1;
    if (aReady !== bReady) return aReady - bReady;
    if (a.warm !== b.warm) return a.warm ? -1 : 1;
    if (b.gaps.length !== a.gaps.length) return b.gaps.length - a.gaps.length;
    return a.name.localeCompare(b.name);
  });

  const summary: Summary = {
    total: rows.length,
    notContacted: rows.filter((r) => r.outreachStatus === 'not_contacted').length,
    pitched: rows.filter((r) => r.outreachStatus === 'pitched').length,
    replied: rows.filter((r) => r.outreachStatus === 'replied').length,
    sold: rows.filter((r) => r.outreachStatus === 'sold').length,
    declined: rows.filter((r) => r.outreachStatus === 'declined').length,
    notAFit: rows.filter((r) => r.outreachStatus === 'not_a_fit').length,
    warmWithGap: rows.filter((r) => r.warm && r.gaps.length > 0).length,
  };

  return (
    <main>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Get Found pitch tracker</h1>
          <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
            One row per assessed clinic, sourced from the free agent assessment. Warm + has a real gap clinics surface first. Status, last contacted, and notes save back to the record. Internal only.
          </p>
        </div>

        {tableMissing && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 text-sm text-amber-900">
            <div className="font-black mb-1">clinic_opportunities table not yet created</div>
            <div>Run <code className="bg-amber-100 px-1.5 py-0.5 rounded">scripts/sql/add-clinic-opportunities.sql</code> in the Supabase SQL Editor, then run <code className="bg-amber-100 px-1.5 py-0.5 rounded">node scripts/_seed-opportunities-and-pains.cjs</code> to seed from the 4-clinic assessment.</div>
          </div>
        )}

        {!tableMissing && rows.length === 0 && (
          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-5 mb-6 text-sm text-slate-700">
            <div className="font-black mb-1">No assessed clinics yet</div>
            <div>Seed from the 4-clinic assessment with <code className="bg-slate-200 px-1.5 py-0.5 rounded">node scripts/_seed-opportunities-and-pains.cjs</code>.</div>
          </div>
        )}

        <OpportunitiesClient rows={rows} summary={summary} />
      </div>
    </main>
  );
}
