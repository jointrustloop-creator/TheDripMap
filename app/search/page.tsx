import { Metadata } from 'next';
import { supabase } from '../../src/lib/supabase';
import { enrichProvider, getAllCities, getListingStats, deduplicateListings } from '../../src/lib/data';
import { Suspense } from 'react';
import SearchClient from './SearchClient';

export async function generateMetadata(): Promise<Metadata> {
  const stats = await getListingStats();
  const title = `Find IV Therapy Clinics Near You — Browse ${stats.totalListings.toLocaleString()} | TheDripMap`;
  const description = `Browse ${stats.totalListings.toLocaleString()} verified IV therapy clinics across ${stats.totalCities} US cities. Filter by city, service type, delivery preference and rating.`;
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: 'https://www.thedripmap.com/search',
      type: 'website',
      siteName: 'TheDripMap',
    },
  };
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SearchPage() {
  // SSR the default list of clinics for SEO and initial view
  const { data } = await supabase
    .from('providers')
    .select('*')
    .order('rating', { ascending: false })
    .order('reviews', { ascending: false });

  const { count: totalCount } = await supabase
    .from('providers')
    .select('*', { count: 'exact', head: true });

  const initialProviders = deduplicateListings(data || []).map(enrichProvider);
  const topCities = await getAllCities();
  const initialStats = await getListingStats();

  return (
    <Suspense fallback={null}>
      <SearchClient 
        initialProviders={initialProviders} 
        topCities={topCities}
        initialStats={initialStats}
        totalCount={totalCount || initialProviders.length}
      />
    </Suspense>
  );
}
