import { Metadata } from 'next';
import { supabase, fetchAllRows } from '../../src/lib/supabase';
import { enrichProvider, getListingStats, deduplicateListings, getCitiesWithListings } from '../../src/lib/data';
import { Suspense } from 'react';
import SearchClient from './SearchClient';

export async function generateMetadata(): Promise<Metadata> {
  const stats = await getListingStats();
  const title = `Explore IV Therapy Clinics — Search ${stats.totalListings}+ Providers by City & Treatment | TheDripMap`;
  const description = `Search and compare IV therapy clinics near you. Filter by hangover recovery, NAD+, immune support, beauty drips and more. Find top-rated providers in your city.`;
  
  return {
    title,
    description,
    alternates: {
      canonical: 'https://www.thedripmap.com/search',
    },
    openGraph: {
      title,
      description,
      url: 'https://www.thedripmap.com/search',
      type: 'website',
      siteName: 'TheDripMap',
      images: [{ url: 'https://www.thedripmap.com/og-image.png', width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://www.thedripmap.com/og-image.png'],
    },
  };
}

export const revalidate = 3600;

export default async function SearchPage() {
  // SSR the default list of clinics for SEO and initial view.
  // PostgREST's gateway caps responses at 1,000 rows; we have >1,000
  // providers, so we paginate via fetchAllRows() to get everything.
  const data = await fetchAllRows(() =>
    supabase
      .from('providers')
      .select('*')
      .order('is_claimed', { ascending: false })
      .order('is_featured', { ascending: false })
      .order('rating', { ascending: false, nullsFirst: false })
  );

  const { count: totalCount } = await supabase
    .from('providers')
    .select('*', { count: 'exact', head: true });

  // CWV: SSR only the top-ranked slice (already ordered claimed -> featured ->
  // rating), not all ~1,550 providers. This cut the /search HTML from ~3MB.
  // The default view renders verified clinics (all included in this slice,
  // ordered first); "browse all" and filtered searches hydrate the full pool
  // client-side (SearchClient fetches it once on mount / per filter).
  const SSR_CAP = 150;
  const initialProviders = deduplicateListings(data || []).map(enrichProvider).slice(0, SSR_CAP);
  const cities = await getCitiesWithListings();
  const initialStats = await getListingStats();

  return (
    <Suspense fallback={null}>
      <SearchClient 
        initialProviders={initialProviders} 
        cities={cities}
        initialStats={initialStats}
        totalCount={totalCount || initialProviders.length}
      />
    </Suspense>
  );
}
