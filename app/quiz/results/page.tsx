'use client';
import React, { useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Sparkles, 
  ArrowRight,
  MapPin,
  Star,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { matchProviders } from '../../../src/lib/matching';
import { Navbar } from '../../../src/components/Navbar';
import { Footer } from '../../../src/components/Footer';
import { SurveyState, OperatorProfile, Provider, City, TreatmentType } from '../../../src/types';
import { getOperatorProfiles, getAllListings } from '../../../src/lib/data';
import { cn } from '../../../src/lib/utils';
import Image from 'next/image';

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
  const [isAccordionOpen, setIsAccordionOpen] = React.useState(false);

  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [profiles, allListings] = await Promise.allSettled([
          getOperatorProfiles(),
          getAllListings()
        ]);

        if (profiles.status === 'fulfilled') setOperatorProfiles(profiles.value);
        if (allListings.status === 'fulfilled') setListings(allListings.value);
      } catch (err) {
        console.error('Error loading results data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const surveyData: SurveyState = useMemo(() => ({
    goal: searchParams.get('goal') || undefined,
    city: (searchParams.get('city') as City) || undefined,
    state: searchParams.get('state') || undefined,
    lat: searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined,
    lng: searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined,
    country: searchParams.get('country') || undefined,
    locationPreference: (searchParams.get('type') as TreatmentType) || undefined,
    urgency: (searchParams.get('urgency') as 'ASAP' | 'Today' | 'This Week') || undefined,
  }), [searchParams]);

  const userLocation = useMemo(() => {
    if (surveyData.lat && surveyData.lng) {
      return { latitude: surveyData.lat, longitude: surveyData.lng };
    }
    return undefined;
  }, [surveyData]);

  const scoredProviders = useMemo(() => {
    if (listings.length === 0) return [];
    return matchProviders(surveyData, listings, operatorProfiles, userLocation);
  }, [surveyData, operatorProfiles, listings, userLocation]);

  // Step 5: Empty State - zero results within 100 miles
  const resultsWithin100 = scoredProviders.filter(p => p.distance === undefined || p.distance <= 100);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFDFB] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-wellness-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Analyzing Clinical Data</h2>
          <p className="text-slate-500 font-bold">Finding your perfect IV therapy match...</p>
        </div>
      </div>
    );
  }

  if (scoredProviders.length === 0 || resultsWithin100.length === 0) {
    return (
      <div className="min-h-screen bg-[#FDFDFB]">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-32 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-400">
            <MapPin size={40} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">
            No IV therapy clinics found near {surveyData.city || 'you'} yet.
          </h1>
          <p className="text-lg text-slate-500 mb-12 max-w-lg mx-auto">
            Browse our national directory or take the quiz again with a wider area.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/search"
              className="w-full sm:w-auto bg-wellness-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-wellness-700 transition-all shadow-lg shadow-wellness-200"
            >
              Browse Directory
            </Link>
            <button 
              onClick={() => router.push('/quiz')}
              className="w-full sm:w-auto bg-white text-slate-900 border-2 border-slate-900 px-8 py-4 rounded-2xl font-bold hover:bg-slate-900 hover:text-white transition-all"
            >
              Retake Quiz
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const topMatch = scoredProviders[0];
  const otherMatches = scoredProviders.slice(1, 3);
  const moreMatches = scoredProviders.slice(3, 10);
  
  // Step 3 Section 4: Fallback (conditional)
  // Only show if zero results in the matched city AND fewer than 3 results within 50 miles
  const resultsInCity = scoredProviders.filter(p => 
    surveyData.city && p.city.toLowerCase() === surveyData.city.toLowerCase()
  );
  const resultsWithin50 = scoredProviders.filter(p => p.distance !== undefined && p.distance <= 50);
  
  const showFallback = resultsInCity.length === 0 && resultsWithin50.length < 3;
  const fallbackResults = showFallback ? scoredProviders.slice(0, 3) : [];

  const getMatchReason = (provider: Provider) => {
    const goal = surveyData.goal || '';
    const city = surveyData.city || '';
    const delivery = surveyData.locationPreference || '';
    const timing = surveyData.urgency || '';
    
    const clauses: string[] = [];
    
    // 1. Specialty Match
    if (goal && provider.specialties?.some(s => s.toLowerCase().includes(goal.toLowerCase()))) {
      clauses.push(`specializes in ${goal}`);
    }
    
    // 2. City Match
    if (city && provider.city.toLowerCase() === city.toLowerCase()) {
      clauses.push(`is located in ${provider.city}`);
    }
    
    // 3. Delivery Match
    const profile = operatorProfiles.find(op => op.clinicId === provider.id);
    const isMobile = provider.type === 'Mobile' || provider.mobile_service === true || profile?.profile_data?.mobileService;
    if (delivery === 'Mobile' && isMobile) {
      clauses.push(`offers mobile service`);
    } else if (delivery === 'In-Clinic' && (provider.type === 'In-Clinic' || provider.type === 'Both')) {
      clauses.push(`offers in-clinic service`);
    }
    
    // 4. Timing Match
    if ((timing === 'ASAP' || timing === 'Today') && (provider.availability || profile?.profile_data?.walkInsWelcome)) {
      clauses.push(`accepts walk-in appointments`);
    }
    
    // 5. Rating (Always add as final clause if high)
    if (provider.rating >= 4.5) {
      clauses.push(`and has a ${provider.rating} star rating with ${provider.reviewCount} reviews`);
    }

    if (clauses.length === 0) return `Selected because they are a top-rated provider for your needs in ${provider.city}.`;
    
    // Build sentence
    let sentence = `Selected because ${provider.name} `;
    
    // Join clauses correctly
    const mainClauses = clauses.filter(c => !c.startsWith('and'));
    const ratingClause = clauses.find(c => c.startsWith('and'));
    
    if (mainClauses.length > 0) {
      sentence += mainClauses.join(', ');
      if (ratingClause) {
        sentence += ` ${ratingClause}`;
      } else {
        sentence += '.';
      }
    } else if (ratingClause) {
      sentence += ratingClause.replace('and ', '') + '.';
    }

    return sentence;
  };

  const formatDistance = (provider: Provider) => {
    const profile = operatorProfiles.find(op => op.clinicId === provider.id);
    const isMobile = provider.type === 'Mobile' || profile?.profile_data?.mobileService;
    if (isMobile) return "Comes to you";
    if (provider.distance !== undefined) return `${provider.distance.toFixed(1)} miles away`;
    return `${provider.city}${provider.state ? `, ${provider.state}` : ''}`;
  };

  const InitialsPlaceholder = ({ name, size = "md" }: { name: string, size?: "sm" | "md" | "lg" }) => {
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const sizeClasses = {
      sm: "w-10 h-10 text-xs",
      md: "w-16 h-16 text-xl",
      lg: "w-full h-full text-4xl"
    };
    return (
      <div className={cn(
        "bg-wellness-600 flex items-center justify-center text-white font-black rounded-xl",
        sizeClasses[size]
      )}>
        {initials}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      
      {/* SECTION 5 — SEARCH SUMMARY BAR */}
      <div className="bg-white border-b border-slate-100 py-3 px-6 sticky top-[73px] z-40 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-6 whitespace-nowrap">
            {[
              { label: 'Goal', value: surveyData.goal },
              { label: 'Symptoms', value: surveyData.symptoms?.join(', ') },
              { label: 'Timing', value: surveyData.urgency },
              { label: 'Delivery', value: surveyData.locationPreference },
              { label: 'Budget', value: searchParams.get('budget') || surveyData.budget },
              { label: 'Near', value: surveyData.city || 'Your Location' },
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

      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-wellness-50 text-wellness-700 px-4 py-1.5 rounded-full text-sm font-bold mb-6 border border-wellness-100"
          >
            <Sparkles size={16} />
            <span>Matching Complete</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            Your Personalized Results
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            We&apos;ve analyzed {listings.length} providers to find your best clinical fit near <span className="text-slate-900 font-bold">{surveyData.city || 'your area'}</span>.
          </p>
        </div>

        <div className="space-y-20">
          {/* SECTION 1 — "YOUR BEST MATCH" */}
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-100" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-wellness-600">Your Best Match</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            <div className="bg-white rounded-[2.5rem] border-2 border-wellness-100 overflow-hidden shadow-2xl shadow-wellness-100/50 group">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="relative h-72 lg:h-auto overflow-hidden">
                  <Image 
                    src={topMatch.imageUrl} 
                    alt={topMatch.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-6 left-6 flex flex-wrap gap-2">
                    {topMatch.availability && (
                      <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg">Available Today</span>
                    )}
                    {(topMatch.type === 'Mobile' || operatorProfiles.find(op => op.clinicId === topMatch.id)?.profile_data?.mobileService) && (
                      <span className="bg-wellness-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg">Mobile IV</span>
                    )}
                  </div>
                </div>
                <div className="p-8 lg:p-12 flex flex-col justify-center">
                  <div className="flex items-center gap-2 text-wellness-600 mb-4">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} fill={i < Math.floor(topMatch.rating) ? "currentColor" : "none"} className={i < Math.floor(topMatch.rating) ? "text-wellness-600" : "text-slate-200"} />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-slate-400">({topMatch.reviewCount} reviews)</span>
                  </div>
                  <h1 className="text-3xl lg:text-4xl font-black text-slate-900 mb-2 tracking-tight leading-tight">
                    {topMatch.name}
                  </h1>
                  <div className="flex items-center gap-2 text-slate-500 font-bold mb-6">
                    <MapPin size={16} className="text-wellness-600" />
                    <span>{topMatch.city}{topMatch.state ? `, ${topMatch.state}` : ''} · {formatDistance(topMatch)}</span>
                    <span className="mx-2 text-slate-200">|</span>
                    <span className="text-wellness-600">{topMatch.price_range || topMatch.priceRange || '$$'}</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-8">
                    {topMatch.specialties.slice(0, 3).map(s => (
                      <span key={s} className="bg-slate-50 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold border border-slate-100">
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className="bg-wellness-50 rounded-2xl p-6 mb-8 border border-wellness-100 relative">
                    <div className="absolute -top-3 left-6 bg-wellness-600 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">Match Reason</div>
                    <p className="text-wellness-900 font-medium leading-relaxed italic">
                      &quot;{getMatchReason(topMatch)}&quot;
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <a 
                      href={topMatch.website || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 bg-wellness-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-wellness-700 transition-all text-center shadow-lg shadow-wellness-200"
                    >
                      Book Appointment
                    </a>
                    <Link 
                      href={`/provider/${topMatch.slug || topMatch.id}`}
                      className="flex-1 bg-white text-slate-900 border-2 border-slate-100 px-8 py-4 rounded-2xl font-bold hover:border-slate-900 transition-all text-center"
                    >
                      View Full Profile
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2 — "OTHER STRONG OPTIONS" */}
          {otherMatches.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-100" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Other Strong Options</span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {otherMatches.map((provider) => (
                  <div key={provider.id} className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-xl shadow-slate-200/50 flex flex-col">
                    <div className="relative h-48">
                      {provider.imageUrl && !provider.imageUrl.includes('picsum.photos/seed') ? (
                        <Image 
                          src={provider.imageUrl} 
                          alt={provider.name}
                          fill
                          className="object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <InitialsPlaceholder name={provider.name} size="lg" />
                      )}
                      <div className="absolute top-4 left-4">
                        <span className="bg-white/90 backdrop-blur-md text-slate-900 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
                          {formatDistance(provider)}
                        </span>
                      </div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center gap-1 text-wellness-600 mb-2">
                        <Star size={14} fill="currentColor" />
                        <span className="text-sm font-bold">{provider.rating}</span>
                        <span className="text-xs text-slate-400 font-bold ml-1">({provider.reviewCount})</span>
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-1 line-clamp-1">{provider.name}</h3>
                      <p className="text-xs text-slate-500 font-bold mb-4">{provider.city}{provider.state ? `, ${provider.state}` : ''}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-6">
                        {provider.specialties.slice(0, 2).map(s => (
                          <span key={s} className="bg-slate-50 text-slate-500 px-2 py-0.5 rounded-md text-[10px] font-bold border border-slate-100">
                            {s}
                          </span>
                        ))}
                        {provider.priceRange && (
                          <span className="bg-wellness-50 text-wellness-600 px-2 py-0.5 rounded-md text-[10px] font-bold border border-wellness-100">
                            {provider.priceRange}
                          </span>
                        )}
                      </div>

                      <div className="mt-auto flex gap-3">
                        <a 
                          href={provider.website || '#'} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex-1 bg-slate-900 text-white py-3 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all text-center"
                        >
                          Book
                        </a>
                        <Link 
                          href={`/provider/${provider.slug || provider.id}`}
                          className="flex-1 bg-white text-slate-900 border border-slate-200 py-3 rounded-xl text-xs font-bold hover:border-slate-900 transition-all text-center"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* SECTION 3 — "MORE OPTIONS NEAR YOU" */}
          {moreMatches.length > 0 && (
            <section className="space-y-4">
              <button 
                onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                className="w-full flex items-center justify-between p-6 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all group"
              >
                <span className="font-black text-slate-900">See {moreMatches.length} more clinics near {surveyData.city || 'your area'}</span>
                {isAccordionOpen ? <ChevronUp size={20} className="text-slate-400 group-hover:text-slate-900" /> : <ChevronDown size={20} className="text-slate-400 group-hover:text-slate-900" />}
              </button>

              <AnimatePresence>
                {isAccordionOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      {moreMatches.map((provider) => (
                        <div key={provider.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
                            {provider.imageUrl && !provider.imageUrl.includes('picsum.photos/seed') ? (
                              <Image src={provider.imageUrl} alt={provider.name} fill className="object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <InitialsPlaceholder name={provider.name} size="lg" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-900 text-sm truncate">{provider.name}</h4>
                            <p className="text-[10px] text-slate-500 font-bold">{formatDistance(provider)}</p>
                          </div>
                          <Link 
                            href={`/provider/${provider.slug || provider.id}`}
                            className="p-2 text-slate-400 hover:text-wellness-600 transition-colors"
                          >
                            <ArrowRight size={18} />
                          </Link>
                        </div>
                      ))}
                    </div>
                    <div className="text-center pt-8">
                      <Link 
                        href={`/iv-therapy/${surveyData.state?.toLowerCase() || 'usa'}/${surveyData.city?.toLowerCase().replace(/\s+/g, '-') || ''}`}
                        className="inline-flex items-center gap-2 text-wellness-600 font-black text-sm hover:underline"
                      >
                        View all {surveyData.city} listings <ArrowRight size={16} />
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          )}

          {/* SECTION 4 — FALLBACK (conditional) */}
          {showFallback && (
            <section className="space-y-8">
              <div className="bg-amber-50 border border-amber-100 rounded-3xl p-8 text-center">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600">
                  <Info size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">
                  We found 0 clinics near {surveyData.city || 'you'}.
                </h3>
                <p className="text-slate-600 font-medium">
                  Here are top-rated options further away:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {fallbackResults.map((provider) => (
                  <div key={provider.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-lg flex flex-col">
                    <div className="relative h-40">
                      {provider.imageUrl && !provider.imageUrl.includes('picsum.photos/seed') ? (
                        <Image src={provider.imageUrl} alt={provider.name} fill className="object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <InitialsPlaceholder name={provider.name} size="lg" />
                      )}
                      <div className="absolute top-3 left-3">
                        <span className="bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">
                          {formatDistance(provider)}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="flex items-center gap-1 text-wellness-600 mb-1">
                        <Star size={10} fill="currentColor" />
                        <span className="text-[10px] font-bold">{provider.rating}</span>
                        <span className="text-[8px] text-slate-400 font-bold ml-1">({provider.reviewCount})</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm mb-1 line-clamp-1">{provider.name}</h4>
                      <p className="text-[10px] text-slate-500 font-bold mb-3">{provider.city}{provider.state ? `, ${provider.state}` : ''}</p>
                      
                      <div className="flex flex-wrap gap-1 mb-4">
                        {provider.specialties.slice(0, 2).map(s => (
                          <span key={s} className="bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded text-[8px] font-bold border border-slate-100">
                            {s}
                          </span>
                        ))}
                      </div>

                      <Link 
                        href={`/provider/${provider.slug || provider.id}`}
                        className="mt-auto w-full bg-slate-50 text-slate-900 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-slate-100 transition-all text-center"
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
