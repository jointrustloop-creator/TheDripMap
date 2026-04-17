import { Metadata } from 'next';
import { supabase } from '../../src/lib/supabase';
import { enrichProvider, getAllCities, getListingStats } from '../../src/lib/data';
import SearchClient from './SearchClient';

export const metadata: Metadata = {
  title: 'Find IV Therapy Clinics Near You — Browse All | TheDripMap',
  description: 'Browse 1,042 verified IV therapy clinics across 208 US cities. Filter by city, service type, delivery preference and rating. Find your perfect IV therapy match.',
  openGraph: {
    title: 'Find IV Therapy Clinics Near You | TheDripMap',
    description: 'Browse 1,042 verified IV therapy clinics across 208 US cities.',
    url: 'https://www.thedripmap.com/search',
    type: 'website',
    siteName: 'TheDripMap',
  },
};

export default async function SearchPage() {
  // SSR the default list of top 50 clinics for SEO
  const { data } = await supabase
    .from('listings')
    .select('*')
    .order('rating', { ascending: false })
    .order('review_count', { ascending: false })
    .limit(50);

  const initialProviders = (data || []).map(enrichProvider);
  const topCities = await getAllCities();
  const initialStats = await getListingStats();

  return (
    <SearchClient 
      initialProviders={initialProviders} 
      topCities={topCities}
      initialStats={initialStats}
    />
  );
}
