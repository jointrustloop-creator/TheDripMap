import { Metadata } from 'next';
import { supabase } from '../../src/lib/supabase';
import { enrichProvider, getListingStats, deduplicateListings, getCitiesWithListings } from '../../src/lib/data';
import { Suspense } from 'react';
import SearchClient from './SearchClient';

export async function generateMetadata(): Promise<Metadata> {
  const stats = await getListingStats();
  const title = `Find IV Therapy Clinics Near You | Search ${stats.totalListings} Providers | TheDripMap`;
  const description = `Search and compare ${stats.totalListings} verified IV therapy clinics across ${stats.totalCities} US and Canadian cities. Filter by city, specialty, price, and availability.`;
  
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
    },
  };
}

export const revalidate = 3600;

export default async function SearchPage() {
  // SSR the default list of clinics for SEO and initial view
  const { data } = await supabase
    .from('providers')
    .select('*')
    .order('is_featured', { ascending: false })
    .order('rating', { ascending: false, nullsFirst: false });

  const { count: totalCount } = await supabase
    .from('providers')
    .select('*', { count: 'exact', head: true });

  const initialProviders = deduplicateListings(data || []).map(enrichProvider);
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
