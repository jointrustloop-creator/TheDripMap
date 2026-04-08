'use client';
import React, { useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Sparkles, 
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { matchProviders } from '../../../src/lib/matching';
import { Navbar } from '../../../src/components/Navbar';
import { Footer } from '../../../src/components/Footer';
import { ProviderCardFeatured } from '../../../src/components/ProviderCardFeatured';
import { ProviderCard } from '../../../src/components/ProviderCard';
import { SurveyState, OperatorProfile, Provider, City, TreatmentType } from '../../../src/types';
import { getOperatorProfiles, getAllListings } from '../../../src/lib/data';

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FDFDFB] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-wellness-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-bold">Analyzing your results...</p>
        </div>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [operatorProfiles, setOperatorProfiles] = React.useState<OperatorProfile[]>([]);
  const [listings, setListings] = React.useState<Provider[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const [profiles, allListings] = await Promise.all([
        getOperatorProfiles(),
        getAllListings()
      ]);
      setOperatorProfiles(profiles);
      setListings(allListings);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const surveyData: SurveyState = useMemo(() => ({
    goal: searchParams.get('goal') || undefined,
    city: (searchParams.get('city') as City) || undefined,
    locationPreference: (searchParams.get('type') as TreatmentType) || undefined,
    urgency: (searchParams.get('urgency') as 'ASAP' | 'Today' | 'This Week') || undefined,
  }), [searchParams]);

  const scoredProviders = useMemo(() => {
    if (listings.length === 0) return [];
    return matchProviders(surveyData, listings, operatorProfiles);
  }, [surveyData, operatorProfiles, listings]);

  const topMatch = scoredProviders[0];
  const otherMatches = scoredProviders.slice(1, 4);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFDFB] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-wellness-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-bold">Analyzing your results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      
      {/* Progress Summary Bar */}
      <div className="bg-white border-b border-slate-100 py-3 px-6 sticky top-[73px] z-40 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-6 whitespace-nowrap">
            {[
              { label: 'Goal', value: surveyData.goal },
              { label: 'City', value: surveyData.city },
              { label: 'Delivery', value: surveyData.locationPreference },
              { label: 'Timing', value: surveyData.urgency },
            ].filter(i => i.value).map((item, idx) => (
              <div key={idx} className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{item.label}</span>
                <span className="text-xs font-bold text-slate-700">{item.value}</span>
              </div>
            ))}
          </div>
          <button 
            onClick={() => router.push('/quiz')}
            className="text-xs font-bold text-wellness-600 hover:text-wellness-700 flex items-center gap-1 shrink-0"
          >
            Edit Search <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-wellness-50 text-wellness-700 px-4 py-1.5 rounded-full text-sm font-bold mb-6 border border-wellness-100"
          >
            <Sparkles size={16} />
            <span>Analysis Complete</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            Your Personalized Matches
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            We&apos;ve analyzed {listings.length} providers in <span className="text-slate-900 font-bold">{surveyData.city || 'your area'}</span> to find your best clinical fit.
          </p>
        </div>

        <div className="space-y-12">
          {/* Primary Result */}
          {topMatch && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <div className="h-px flex-1 bg-slate-100" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-wellness-600">Your Best Match</span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>
              <ProviderCardFeatured 
                provider={topMatch} 
                operatorProfile={operatorProfiles.find(op => op.clinicId === topMatch.id)}
                isPrimary
              />
            </div>
          )}

          {/* Secondary Options */}
          {otherMatches.length > 0 && (
            <div className="space-y-8">
              <div className="flex items-center gap-3 px-2 pt-8">
                <div className="h-px flex-1 bg-slate-100" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Other Strong Options</span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {otherMatches.map((provider) => (
                  <ProviderCard 
                    key={provider.id} 
                    provider={provider} 
                    operatorProfile={operatorProfiles.find(op => op.clinicId === provider.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* View More Options CTA */}
          <div className="pt-12 text-center">
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Want to see more?</h3>
              <p className="text-slate-500 mb-8 text-sm">Explore our full directory of providers in {surveyData.city || 'your city'}.</p>
              <Link 
                href={`/search?city=${surveyData.city || 'All'}`}
                className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg"
              >
                View All {surveyData.city} Listings <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
