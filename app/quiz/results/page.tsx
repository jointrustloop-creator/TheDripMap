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
  Calendar,
  Target,
  Activity,
  Twitter,
  Link as LinkIcon,
  Camera,
  Check,
  Download,
  Instagram,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { matchProviders } from '../../../src/lib/matching';
import { Navbar } from '../../../src/components/Navbar';
import { Footer } from '../../../src/components/Footer';
import { SurveyState, OperatorProfile, Provider, City, TreatmentType } from '../../../src/types';
import { getOperatorProfiles, getAllListings, getListingsByCity, slugify } from '../../../src/lib/data';
import { ClinicImage } from '../../../src/components/ClinicImage';
import { cn } from '../../../src/lib/utils';
import { getSymptomById, hasSafetyFlag, SAFETY_FLAGS } from '../../../src/lib/symptom-treatments';
import { pickArchetype } from '../../../src/lib/quiz-archetype';
import { ShieldAlert, Clock, DollarSign, CheckCircle2 } from 'lucide-react';

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

const GOALS = [
  { id: 'hangover', label: 'Hangover Recovery' },
  { id: 'nad-plus', label: 'Energy & NAD+' },
  { id: 'immune-support', label: 'Immune Support' },
  { id: 'beauty-glow', label: 'Beauty & Glow' },
  { id: 'weight-loss', label: 'Weight Loss' },
  { id: 'hydration', label: 'Rapid Hydration' },
  { id: 'recovery', label: 'Athletic Recovery' },
  { id: 'myers-cocktail', label: 'Myers Cocktail' },
  { id: 'jet-lag', label: 'Jet Lag & Travel' },
  { id: 'peptide-therapy', label: 'Peptide Therapy' },
];

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [operatorProfiles, setOperatorProfiles] = React.useState<OperatorProfile[]>([]);
  const [listings, setListings] = React.useState<Provider[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAccordionOpen, setIsAccordionOpen] = React.useState(false);
  const [isExactMatch, setIsExactMatch] = React.useState(true);
  const [isStateMatch, setIsStateMatch] = React.useState(true);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const city = searchParams.get('city');
        const state = searchParams.get('state');
        
        // Step 1: Fetch by location (tiered logic inside getListingsByCity)
        const [profilesRes, locationListingsRes] = await Promise.allSettled([
          getOperatorProfiles(),
          city ? getListingsByCity(city, state || undefined) : getAllListings()
        ]);

        let initialListings: Provider[] = [];
        if (locationListingsRes.status === 'fulfilled') {
          initialListings = locationListingsRes.value as Provider[];
        }

        // Check if we found any exact city matches
        const cityOnlyMatches = initialListings.filter(p => {
          const pCity = p.city.toLowerCase().trim();
          let searchCity = city?.toLowerCase().trim() || '';
          if (searchCity.includes(',')) {
            searchCity = searchCity.split(',')[0].trim();
          }
          return pCity === searchCity || pCity.includes(searchCity) || searchCity.includes(pCity);
        }).length;

        // Check if we found any state matches
        const stateOnlyMatches = initialListings.filter(p => {
          const pState = p.state?.toLowerCase().trim();
          const searchState = state?.toLowerCase().trim() || '';
          return pState === searchState || (searchState.length === 2 && pState === searchState);
        }).length;

        setIsExactMatch(cityOnlyMatches > 0);
        setIsStateMatch(stateOnlyMatches > 0);

        if (profilesRes.status === 'fulfilled') setOperatorProfiles(profilesRes.value as OperatorProfile[]);
        setListings(initialListings);
      } catch (err) {
        console.error('Error loading results data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [searchParams]);

  const surveyData: SurveyState = useMemo(() => {
    const symptomParam = searchParams.get('symptom') || searchParams.get('symptoms');
    const safetyParam = searchParams.get('safety');
    return {
      goal: searchParams.get('goal') || undefined,
      city: (searchParams.get('city') as City) || undefined,
      state: searchParams.get('state') || undefined,
      lat: searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined,
      lng: searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined,
      country: searchParams.get('country') || undefined,
      locationPreference: (searchParams.get('type') as TreatmentType) || undefined,
      urgency: (searchParams.get('urgency') as 'ASAP' | 'Today' | 'This Week') || undefined,
      budget: searchParams.get('budget') || undefined,
      symptoms: symptomParam ? symptomParam.split(',').filter(Boolean) : undefined,
      medicalHistory: safetyParam && safetyParam !== 'none' ? [safetyParam] : undefined,
    };
  }, [searchParams]);

  // Pull the recommended treatment for the visitor's chosen symptom.
  // This is the source of the "Your recommended treatment" plan card.
  const recommendation = useMemo(() => {
    const sym = getSymptomById(surveyData.symptoms?.[0]);
    return sym?.recommendedTreatment || null;
  }, [surveyData.symptoms]);

  const archetype = useMemo(() =>
    pickArchetype({ goal: surveyData.goal, symptoms: surveyData.symptoms }),
    [surveyData.goal, surveyData.symptoms]
  );

  const safetyTriggered = useMemo(() => hasSafetyFlag(surveyData.medicalHistory), [surveyData.medicalHistory]);
  const safetyLabel = useMemo(() => {
    const id = surveyData.medicalHistory?.[0];
    if (!id) return null;
    return SAFETY_FLAGS.find((f) => f.id === id)?.label || null;
  }, [surveyData.medicalHistory]);

  const userLocation = useMemo(() => {
    if (surveyData.lat && surveyData.lng) {
      return { latitude: surveyData.lat, longitude: surveyData.lng };
    }
    return undefined;
  }, [surveyData]);

  const scoredProviders = useMemo(() => {
    if (listings.length === 0) return [];
    // Step 2: Score and Sort
    return matchProviders(surveyData, listings, operatorProfiles, userLocation);
  }, [surveyData, operatorProfiles, listings, userLocation]);

  // Step 3: Display
  const topMatch = scoredProviders[0];
  const otherMatches = scoredProviders.slice(1, 3);
  const moreMatches = scoredProviders.slice(3, 10);
  
  // Empty State - zero results
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

  if (scoredProviders.length === 0) {
    return (
      <div className="min-h-screen bg-[#FDFDFB]">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-32 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-400">
            <MapPin size={40} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">
            No IV therapy clinics found in {surveyData.city || 'your area'} yet.
          </h1>
          <p className="text-lg text-slate-500 mb-12 max-w-lg mx-auto">
            Browse our national directory or take the quiz again with a different location.
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

  const getMatchReason = (provider: Provider) => {
    const goal = surveyData.goal || '';
    const city = surveyData.city || '';
    const delivery = surveyData.locationPreference || '';
    const timing = surveyData.urgency || '';
    
    const clauses: string[] = [];
    
    // 1. Goal/Keyword Match
    if (goal) {
      const goalLower = goal.toLowerCase();
      const goalKeywords: Record<string, string[]> = {
        'hangover': ['hangover', 'hydration', 'recovery'],
        'nad-plus': ['nad', 'energy', 'anti-aging'],
        'immune-support': ['immune', 'wellness', 'immunity'],
        'beauty-glow': ['beauty', 'glow', 'skin'],
        'weight-loss': ['weight', 'metabolism', 'fat'],
        'hydration': ['hydration', 'fluids'],
        'recovery': ['recovery', 'athletic', 'sport'],
        'myers-cocktail': ['myers', 'cocktail'],
        'jet-lag': ['jet', 'travel', 'fatigue', 'energy'],
        'peptide-therapy': ['peptide', 'semaglutide', 'tirzepatide', 'sermorelin', 'glp-1']
      };
      
      const keywords = goalKeywords[goalLower] || [goalLower];
      const pSpecialties = (provider.specialties || []).map(s => s.toLowerCase());
      const pSubtypes = (provider.subtypes || []).map(s => s.toLowerCase());
      const pName = provider.name.toLowerCase();
      
      const hasKeyword = keywords.some(kw => 
        pSpecialties.some(s => s.includes(kw)) || 
        pSubtypes.some(s => s.includes(kw)) ||
        pName.includes(kw)
      );

      if (hasKeyword) {
        const goalLabel = GOALS.find(g => g.id === goalLower)?.label || goal;
        clauses.push(`offers specialized treatments for ${goalLabel}`);
      }
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

  // Delivery-only label — never repeats the city (the best-match card already
  // prints city, state). Fixes the "Toronto, ON · Toronto, ON" duplication.
  const deliveryLabel = (provider: Provider) => {
    const profile = operatorProfiles.find(op => op.clinicId === provider.id);
    const isMobile = provider.type === 'Mobile' || profile?.profile_data?.mobileService;
    if (isMobile) return "Comes to you";
    if (provider.distance !== undefined) return `${provider.distance.toFixed(1)} mi away`;
    return "In-clinic";
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
            These clinics were selected based on your answers
          </h1>
          {!isExactMatch && surveyData.city && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 max-w-2xl mx-auto flex items-center gap-3 text-amber-800">
              <MapPin className="shrink-0" size={20} />
              <p className="text-sm font-medium text-left">
                {isStateMatch ? (
                  <>No exact matches found in <span className="font-bold">{surveyData.city}</span>. We&apos;ve expanded your search to include top-rated providers across <span className="font-bold">{surveyData.state || 'your state'}</span>.</>
                ) : (
                  <>Showing nearby results — no exact matches found in <span className="font-bold">{surveyData.city}</span> or <span className="font-bold">{surveyData.state || 'your state'}</span>.</>
                )}
              </p>
            </div>
          )}
          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10">
            Our algorithm analyzed hundreds of data points to find your best clinical fit in <span className="text-slate-900 font-bold">{surveyData.city || 'your area'}</span>.
          </p>

          {/* Selected Criteria Summary */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block w-full mb-2">You selected:</span>
            {surveyData.goal && (
              <div className="bg-wellness-50 text-wellness-700 px-4 py-2 rounded-xl text-sm font-bold border border-wellness-100 flex items-center gap-2">
                <Target size={14} />
                {GOALS.find(g => g.id === surveyData.goal)?.label || surveyData.goal}
              </div>
            )}
            {surveyData.locationPreference && (
              <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold border border-blue-100 flex items-center gap-2">
                <MapPin size={14} />
                {surveyData.locationPreference} IV
              </div>
            )}
            {surveyData.urgency && (
              <div className="bg-amber-50 text-amber-700 px-4 py-2 rounded-xl text-sm font-bold border border-amber-100 flex items-center gap-2">
                <Calendar size={14} />
                {surveyData.urgency}
              </div>
            )}
            {surveyData.budget && surveyData.budget !== 'Any' && (
              <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold border border-emerald-100 flex items-center gap-2">
                <span>{surveyData.budget} Budget</span>
              </div>
            )}
            {surveyData.symptoms && surveyData.symptoms.length > 0 && (
              <div className="bg-purple-50 text-purple-700 px-4 py-2 rounded-xl text-sm font-bold border border-purple-100 flex items-center gap-2">
                <Activity size={14} />
                {surveyData.symptoms.length} Symptoms
              </div>
            )}
          </div>
        </div>

        <div className="space-y-20">
          {/* SECTION 0 — PERSONALIZED PLAN (recommended treatment + safety callout) */}
          {recommendation && (
            <section className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-100" />
                <div className="flex items-center gap-2 text-wellness-600">
                  <Sparkles size={16} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Your personalized plan</span>
                </div>
                <div className="h-px flex-1 bg-slate-100" />
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-wellness-50 via-white to-amber-50/40 rounded-[2.5rem] border-2 border-wellness-100 overflow-hidden shadow-xl"
              >
                <div className="p-8 md:p-12">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-wellness-600 mb-3">
                    Based on your answers, you likely want
                  </p>
                  <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-4">
                    {recommendation.name}
                  </h2>
                  <p className="text-lg text-slate-700 leading-relaxed mb-6 max-w-3xl">
                    <span className="font-bold text-slate-900">What it is:</span> {recommendation.what}
                  </p>
                  <p className="text-base text-slate-600 leading-relaxed mb-8 max-w-3xl">
                    <span className="font-bold text-slate-900">Why this fits you:</span> {recommendation.why}
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-8 max-w-md">
                    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-1.5">
                        <DollarSign size={11} /> Typical cost
                      </div>
                      <div className="text-sm font-black text-slate-900 leading-tight">
                        {recommendation.typicalCost}
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-1.5">
                        <Clock size={11} /> Session length
                      </div>
                      <div className="text-sm font-black text-slate-900 leading-tight">
                        {recommendation.duration}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border-2 border-slate-100 p-6 max-w-3xl">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-700 mb-4 flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-wellness-600" />
                      Ask the clinic before you book
                    </p>
                    <ul className="space-y-2.5">
                      {recommendation.askBeforeBooking.map((q, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-slate-700 leading-relaxed">
                          <span className="text-wellness-600 font-black shrink-0 mt-0.5">→</span>
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>

              {/* Safety callout — only when visitor flagged a condition */}
              {safetyTriggered && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start gap-5"
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <ShieldAlert size={22} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-black text-amber-900 mb-2 tracking-tight">
                      Important — you flagged: {safetyLabel}
                    </h3>
                    <p className="text-sm text-amber-900 leading-relaxed mb-3">
                      Talk to your primary doctor before any IV therapy session. Below, we&apos;ve prioritized clinics that have an MD, NP, or DO on the team — look for the &ldquo;MD oversight&rdquo; badge on the cards.
                    </p>
                    <p className="text-xs text-amber-800 font-bold">
                      TheDripMap is a directory, not a medical provider. This isn&apos;t medical advice.
                    </p>
                  </div>
                </motion.div>
              )}
            </section>
          )}

          {/* SECTION 0 — "YOUR DRIP TYPE" archetype hero w/ shareable card */}
          <section>
            <div className={cn(
              "relative rounded-[2.5rem] overflow-hidden p-8 md:p-12 text-white shadow-[0_30px_60px_-25px_rgba(15,23,42,0.4)] bg-gradient-to-br",
              archetype.gradient.tailwind
            )}>
              {/* Decorative glow */}
              <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-black/15 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8 md:gap-12">
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-white/80 mb-3">
                    Your Drip Type
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.05] mb-5 [text-shadow:0_4px_18px_rgba(0,0,0,0.25)]">
                    <span className="block text-2xl md:text-3xl italic font-medium opacity-85 mb-1">The</span>
                    {archetype.shortName}
                  </h2>
                  <p className="text-base md:text-lg text-white/90 leading-relaxed italic font-medium max-w-md whitespace-pre-line">
                    {`"${archetype.quote}"`}
                  </p>
                </div>

                {/* Right column: share card preview + 3 buttons */}
                <div className="shrink-0 w-full md:w-72 flex flex-col items-center md:items-end gap-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/75 self-center md:self-end">
                    Share your type
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-end w-full">
                    <a
                      href={`/api/quiz-card/${archetype.slug}`}
                      download={`drip-type-${archetype.slug}.png`}
                      className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-white px-4 py-2.5 rounded-xl font-black text-xs transition-all"
                    >
                      <Download size={14} />
                      <span>Download</span>
                    </a>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await fetch(`/api/quiz-card/${archetype.slug}`);
                          const blob = await res.blob();
                          const file = new File([blob], `drip-type-${archetype.slug}.png`, { type: 'image/png' });
                          if (typeof navigator !== 'undefined' && (navigator as Navigator & { canShare?: (data: ShareData) => boolean }).canShare?.({ files: [file] })) {
                            await navigator.share({ files: [file], title: `I'm ${archetype.name} on TheDripMap` });
                          } else {
                            // Fallback: open the PNG in a new tab so the user can save then upload to IG manually
                            window.open(`/api/quiz-card/${archetype.slug}`, '_blank');
                          }
                        } catch {
                          window.open(`/api/quiz-card/${archetype.slug}`, '_blank');
                        }
                      }}
                      className="inline-flex items-center gap-2 bg-white text-slate-900 hover:bg-white/90 px-4 py-2.5 rounded-xl font-black text-xs transition-all shadow-lg"
                    >
                      <Instagram size={14} />
                      <span>Story</span>
                    </button>
                    <a
                      href={(() => {
                        const text = `I'm ${archetype.name} on TheDripMap 💧 What's your IV drip type? Take the 60-second quiz →`;
                        return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent('https://www.thedripmap.com/quiz')}`;
                      })()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-white px-4 py-2.5 rounded-xl font-black text-xs transition-all"
                    >
                      <Twitter size={14} fill="currentColor" />
                      <span>Tweet</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 1 — "BEST MATCH" */}
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-100" />
              <div className="flex items-center gap-2 text-wellness-600">
                <Sparkles size={16} className="animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                  {recommendation ? 'Clinics that offer this protocol' : 'Our #1 Recommendation: Best Match'}
                </span>
              </div>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-[2.5rem] border border-wellness-100 overflow-hidden shadow-[0_30px_60px_-25px_rgba(15,110,86,0.25)] group relative"
            >
              <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr]">
                <div className="relative h-64 lg:h-full min-h-[300px] overflow-hidden bg-slate-50">
                  <ClinicImage
                    name={topMatch.name}
                    imageUrl={topMatch.imageUrl}
                    contain={topMatch.is_featured === true}
                    className="group-hover:scale-[1.03] transition-transform duration-700 h-full w-full object-cover"
                  />
                  <div className="absolute top-6 left-6 flex flex-wrap gap-2">
                    {topMatch.availability && (
                      <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg">Available Today</span>
                    )}
                    {(topMatch.type === 'Mobile' || operatorProfiles.find(op => op.clinicId === topMatch.id)?.profile_data?.mobileService) && (
                      <span className="bg-wellness-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg">Mobile IV</span>
                    )}
                    {(topMatch as { hasMdOversight?: boolean }).hasMdOversight && (
                      <span className="bg-slate-900 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1">
                        <ShieldAlert size={10} /> MD oversight
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-8 lg:p-10 flex flex-col justify-center">
                  {/* Calm top-match label (replaces the gaudy floating amber badge) */}
                  <div className="inline-flex items-center gap-1.5 self-start bg-wellness-50 text-wellness-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.18em] border border-wellness-100 mb-5">
                    <Star size={11} fill="currentColor" /> Your top match
                  </div>

                  <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-3 tracking-tight leading-tight">
                    {topMatch.name}
                  </h2>

                  {/* Rating + location + delivery — city shown ONCE */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-6">
                    {topMatch.rating > 0 && (
                      <span className="inline-flex items-center gap-1.5 text-sm font-black text-slate-900">
                        <Star size={15} fill="currentColor" className="text-amber-400" />
                        {topMatch.rating}
                        <span className="text-slate-400 font-bold">({topMatch.reviewCount})</span>
                      </span>
                    )}
                    <span className="text-slate-300">·</span>
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500">
                      <MapPin size={14} className="text-wellness-600" />
                      {topMatch.city}{topMatch.state ? `, ${topMatch.state}` : ''}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-100 text-[11px] font-black uppercase tracking-wide text-slate-500">
                      {deliveryLabel(topMatch)}
                    </span>
                    <span className="text-sm font-black text-wellness-600">{topMatch.price_range || topMatch.priceRange || '$$'}</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-7">
                    {topMatch.specialties.slice(0, 3).map(s => (
                      <span key={s} className="bg-slate-50 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold border border-slate-100">
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className="bg-wellness-50 rounded-2xl p-6 mb-8 border border-wellness-100 relative">
                    <div className="absolute -top-3 left-6 bg-wellness-600 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">Why this match</div>
                    <p className="text-wellness-900 font-medium leading-relaxed">
                      {(topMatch as { matchReason?: string }).matchReason || getMatchReason(topMatch)}
                    </p>
                  </div>

                  {/* One strong CTA; profile is a quiet secondary link */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <a
                      href={topMatch.website || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-wellness-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-wellness-700 transition-all text-center shadow-lg shadow-wellness-200 flex items-center justify-center gap-2"
                    >
                      <Calendar size={18} />
                      Book Appointment
                    </a>
                    <Link
                      href={`/providers/${topMatch.slug || slugify(topMatch.name)}`}
                      className="inline-flex items-center justify-center gap-1.5 text-slate-500 hover:text-wellness-700 font-bold text-sm transition-colors group/link"
                    >
                      View full profile
                      <ArrowRight size={15} className="group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>

          {/* SHARE STRIP — viral loop. Encourage users to share their match. */}
          <section>
            <div className="bg-gradient-to-br from-wellness-50 via-white to-slate-50 border border-wellness-100 rounded-[2.5rem] p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-wellness-600 mb-2">
                    ✨ Share your match
                  </div>
                  <p className="text-slate-700 text-base font-medium leading-relaxed">
                    Got matched with <span className="font-black text-slate-900">{topMatch.name}</span> for{' '}
                    <span className="font-black text-wellness-700">
                      {GOALS.find((g) => g.id === surveyData.goal)?.label || surveyData.goal || 'your wellness goal'}
                    </span>
                    . Tell a friend who&apos;s been putting off booking.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  {(() => {
                    const goalLabel = GOALS.find((g) => g.id === surveyData.goal)?.label || surveyData.goal || 'IV therapy';
                    const tweetText = `Just got matched with ${topMatch.name} for ${goalLabel} via @thedripmap`;
                    const url = 'https://www.thedripmap.com/quiz';
                    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(url)}`;
                    return (
                      <>
                        <a
                          href={twitterUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-colors"
                        >
                          <Twitter size={14} fill="currentColor" />
                          <span>Tweet</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof window !== 'undefined' && navigator.clipboard) {
                              navigator.clipboard.writeText(url);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            }
                          }}
                          className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-900 text-slate-900 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors"
                        >
                          {copied ? <Check size={14} /> : <LinkIcon size={14} />}
                          <span>{copied ? 'Copied!' : 'Copy link'}</span>
                        </button>
                        <div className="inline-flex items-center gap-2 bg-white border border-dashed border-slate-200 text-slate-500 px-4 py-2.5 rounded-xl font-bold text-xs">
                          <Camera size={14} />
                          <span className="hidden sm:inline">Screenshot to share</span>
                          <span className="sm:hidden">Screenshot</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2 — "ALTERNATIVE & PREMIUM OPTIONS" */}
          {otherMatches.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-100" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Other Matches</span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {otherMatches.map((provider) => {
                  // Only claimed (is_featured) listings get the "Premium Option" badge
                  // + green star/rating treatment. Unclaimed listings get neutral styling.
                  const isPremium = provider.is_featured === true;
                  return (
                  <div key={provider.id} className="relative group">
                    <div className="absolute -top-3 left-6 z-10">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-md border",
                        isPremium ? "bg-wellness-600 text-white border-wellness-500" : "bg-white text-slate-500 border-slate-100"
                      )}>
                        {isPremium ? "Premium Option" : "Alternative Option"}
                      </span>
                    </div>
                    <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-xl shadow-slate-200/50 flex flex-col h-full">
                      <div className="relative h-48 overflow-hidden bg-slate-50">
                        <ClinicImage
                          name={provider.name}
                          imageUrl={provider.imageUrl}
                          contain={provider.is_featured === true}
                        />
                        <div className="absolute top-4 left-4">
                          <span className="bg-white/90 backdrop-blur-md text-slate-900 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
                            {deliveryLabel(provider)}
                          </span>
                        </div>
                      </div>
                      <div className="p-6 flex-1 flex flex-col">
                        <div className={cn(
                          "flex items-center gap-1 mb-2",
                          isPremium ? "text-wellness-600" : "text-slate-400"
                        )}>
                          <Star size={14} fill="currentColor" />
                          <span className="text-sm font-bold">{provider.rating}</span>
                          <span className="text-xs text-slate-400 font-bold ml-1">({provider.reviewCount}) reviews</span>
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
                            Book now
                          </a>
                          <Link
                            href={`/providers/${provider.slug || slugify(provider.name)}`}
                            className="flex-1 bg-white text-slate-900 border border-slate-200 py-3 rounded-xl text-xs font-bold hover:border-slate-900 transition-all text-center"
                          >
                            Profile
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Persistent Retake Reminder */}
          <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <h3 className="text-2xl font-black mb-2 tracking-tight">Want better results?</h3>
                <p className="text-slate-400 font-medium">Refine your match criteria to get even more precise recommendations.</p>
              </div>
              <button 
                onClick={() => router.push('/quiz')}
                className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-sm hover:bg-slate-100 transition-all shrink-0 flex items-center gap-2"
              >
                Retake Quiz to Refine <ArrowRight size={16} />
              </button>
            </div>
          </div>

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
                            <ClinicImage 
                              name={provider.name}
                              imageUrl={provider.imageUrl}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-900 text-sm truncate">{provider.name}</h4>
                            <p className="text-[10px] text-slate-500 font-bold">{formatDistance(provider)}</p>
                          </div>
                          <Link 
                            href={`/providers/${provider.slug || slugify(provider.name)}`}
                            className="p-2 text-slate-400 hover:text-wellness-600 transition-colors"
                          >
                            <ArrowRight size={18} />
                          </Link>
                        </div>
                      ))}
                    </div>
                    <div className="text-center pt-8">
                      <Link 
                        href={`/cities/${slugify(surveyData.city)}`}
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
        </div>
      </div>

      <Footer />
    </div>
  );
}
