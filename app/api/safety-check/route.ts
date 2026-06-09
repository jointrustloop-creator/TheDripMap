import { NextResponse } from 'next/server';
import { getServiceSupabase } from '../../../src/lib/supabase';

export const maxDuration = 20;
export const dynamic = 'force-dynamic';

const SAFETY_FLAGS = [
  'verifiedMedicalDirector',
  'verifiedClinician',
  'verifiedCompoundingPharmacy',
  'verifiedLiabilityInsurance',
  'verifiedStateBoard',
];

export interface SafetyMatch {
  name: string;
  slug: string | null;
  city: string | null;
  state: string | null;
  rating: number | null;
  reviews: number | null;
  claimed: boolean;
  verifiedCount: number;
  safetyVerified: boolean;
}

interface Row {
  id: string;
  name: string;
  slug: string | null;
  city: string | null;
  state: string | null;
  rating: number | string | null;
  reviews: number | string | null;
  is_featured: boolean | null;
  safety_verified: boolean | null;
}

function toMatch(r: Row, verifiedCount: number): SafetyMatch {
  const claimed = !!r.is_featured;
  return {
    name: r.name,
    slug: r.slug,
    city: r.city,
    state: r.state,
    rating: r.rating != null ? Number(r.rating) : null,
    reviews: r.reviews != null ? Number(r.reviews) : null,
    claimed,
    verifiedCount,
    // Safety Verified gates on the providers.safety_verified column only
    // (added 2026-06-08). verifiedCount is retained for the breakdown UI.
    safetyVerified: r.safety_verified === true,
  };
}

export async function POST(req: Request) {
  let body: { name?: string; city?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const name = (body.name || '').trim();
  const city = (body.city || '').trim();
  if (!name) {
    return NextResponse.json({ error: 'Please enter a clinic name.' }, { status: 400 });
  }

  const sb = getServiceSupabase();
  const cols = 'id, name, slug, city, state, rating, reviews, is_featured, safety_verified';

  // 1. Find matching clinics by name (optionally narrowed to the city).
  let q = sb
    .from('providers')
    .select(cols)
    .ilike('name', `%${name}%`)
    .order('is_featured', { ascending: false })
    .order('rating', { ascending: false, nullsFirst: false })
    .limit(5);
  if (city) q = q.ilike('city', `%${city}%`);
  const { data: matchRows, error } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 2. Pull verification flags for any matched claimed clinics in one query.
  const rows = (matchRows as Row[]) || [];
  const verifiedByClinic = new Map<string, number>();
  const claimedIds = rows.filter((r) => r.is_featured).map((r) => r.id);
  if (claimedIds.length) {
    const { data: profs } = await sb
      .from('operator_profiles')
      .select('clinic_id, profile_data')
      .in('clinic_id', claimedIds);
    for (const p of (profs as { clinic_id: string; profile_data: Record<string, unknown> | null }[]) || []) {
      const pd = p.profile_data || {};
      verifiedByClinic.set(p.clinic_id, SAFETY_FLAGS.filter((f) => pd[f] === true).length);
    }
  }

  const matches = rows.map((r) => toMatch(r, verifiedByClinic.get(r.id) || 0));
  const notFound = matches.length === 0;

  // 3. If not found, surface 3 verified alternatives — same city first, else anywhere.
  let alternatives: SafetyMatch[] = [];
  if (notFound) {
    const buildAlt = async (withCity: boolean) => {
      let aq = sb
        .from('providers')
        .select(cols)
        .eq('is_featured', true)
        .order('rating', { ascending: false, nullsFirst: false })
        .limit(3);
      if (withCity && city) aq = aq.ilike('city', `%${city}%`);
      const { data } = await aq;
      return (data as Row[]) || [];
    };
    let altRows = city ? await buildAlt(true) : [];
    if (altRows.length === 0) altRows = await buildAlt(false);

    const altIds = altRows.map((r) => r.id);
    const altVerified = new Map<string, number>();
    if (altIds.length) {
      const { data: profs } = await sb
        .from('operator_profiles')
        .select('clinic_id, profile_data')
        .in('clinic_id', altIds);
      for (const p of (profs as { clinic_id: string; profile_data: Record<string, unknown> | null }[]) || []) {
        const pd = p.profile_data || {};
        altVerified.set(p.clinic_id, SAFETY_FLAGS.filter((f) => pd[f] === true).length);
      }
    }
    alternatives = altRows.map((r) => toMatch(r, altVerified.get(r.id) || 0));
  }

  return NextResponse.json({ query: { name, city }, notFound, matches, alternatives });
}
