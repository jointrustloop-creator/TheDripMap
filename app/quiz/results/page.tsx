'use client';
import React, { useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, ArrowRight, MapPin, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { Navbar } from '../../../src/components/Navbar';
import { Footer } from '../../../src/components/Footer';
import { ProviderCardFeatured } from '../../../src/components/ProviderCardFeatured';
import { SurveyState, OperatorProfile, Provider, City, TreatmentType } from '../../../src/types';
import {
  getOperatorProfiles,
  getListingsByCity,
  getFeaturedListings,
} from '../../../src/lib/data';
import {
  getSymptomById,
  hasSafetyFlag,
  SAFETY_FLAGS,
} from '../../../src/lib/symptom-treatments';

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FDFDFB] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-wellness-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500 font-bold">Analyzing your results...</p>
          </div>
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}

// Fallback symptom → treatment mapping for free-text goal answers (URL ?goal=...).
// The primary mapping is the per-symptom `recommendedTreatment` block in
// src/lib/symptom-treatments.ts — we only fall back to this when no symptom
// id is present in the URL.
const GOAL_TO_TREATMENT: Record<string, string> = {
  hangover: 'Hangover Recovery Drip',
  hydration: 'Hangover Recovery Drip',
  'immune-support': 'High-Dose Vitamin C + Zinc',
  'nad-plus': "NAD+ Therapy",
  'beauty-glow': 'Beauty + Glow IV',
  recovery: 'Athletic Recovery IV',
  'weight-loss': 'MIC / Weight-Loss Support IV',
  'myers-cocktail': "Myers' Cocktail",
  'jet-lag': 'Hydration + Immune IV',
};

// Derive a country hint ("US"/"Canada") from a state/province so location
// fallbacks never cross the border (no Chicago for Toronto). 'CA' = California
// (US); Canada the country arrives via the explicit country param.
function deriveCountry(state?: string | null): string | undefined {
  if (!state) return undefined;
  const up = state.trim().toUpperCase();
  const caProv = ['ON', 'BC', 'AB', 'MB', 'SK', 'QC', 'NS', 'NB', 'NL', 'PE', 'NT', 'YT', 'NU'];
  const caNames = ['ontario', 'british columbia', 'alberta', 'manitoba', 'saskatchewan', 'quebec', 'nova scotia', 'new brunswick', 'newfoundland', 'prince edward island', 'northwest territories', 'yukon', 'nunavut'];
  if (caProv.includes(up) || caNames.includes(state.trim().toLowerCase())) return 'Canada';
  const usAbbr = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'];
  if (usAbbr.includes(up)) return 'US';
  return undefined;
}

// Maps a treatment name to substrings we look for inside `provider.specialties`
// (or the provider name) so we can pick clinics that actually offer it.
function treatmentMatchKeywords(treatmentName: string): string[] {
  const t = treatmentName.toLowerCase();
  if (t.includes('hangover')) return ['hangover', 'hydration', 'recovery'];
  if (t.includes('nad')) return ['nad', 'energy', 'longevity'];
  if (t.includes('vitamin c') || t.includes('immune')) return ['immune', 'vitamin c', 'wellness'];
  if (t.includes('beauty') || t.includes('glutathione') || t.includes('glow'))
    return ['beauty', 'glow', 'glutathione', 'skin'];
  if (t.includes('recovery') || t.includes('athletic')) return ['recovery', 'athletic', 'sport'];
  if (t.includes('weight') || t.includes('mic')) return ['weight', 'mic', 'metabolism'];
  if (t.includes('myers')) return ['myers', 'cocktail', 'wellness'];
  if (t.includes('energy') || t.includes('b-complex') || t.includes('b complex'))
    return ['energy', 'b12', 'b-complex', 'wellness', 'myers'];
  if (t.includes('iron')) return ['iron', 'anemia', 'medical'];
  return [t.split(' ')[0]];
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
      try {
        const city = searchParams.get('city');
        const state = searchParams.get('state');
        // Country hint keeps the featured fallback in the visitor's own country.
        const country = searchParams.get('country') || deriveCountry(state);

        const [profilesRes, locationListingsRes] = await Promise.allSettled([
          getOperatorProfiles(),
          city ? getListingsByCity(city, state || undefined) : getFeaturedListings(12, undefined, country || undefined),
        ]);

        let initialListings: Provider[] = [];
        if (locationListingsRes.status === 'fulfilled') {
          initialListings = locationListingsRes.value as Provider[];
        }

        // If a city search returned nothing, fall back to featured (claimed)
        // clinics IN THE SAME COUNTRY so the visitor always sees verified
        // results — never cross-border (no US clinics for a Canadian, etc.).
        if (city && initialListings.length === 0) {
          try {
            initialListings = (await getFeaturedListings(12, undefined, country || undefined)) as Provider[];
          } catch {
            /* empty */
          }
        }

        if (profilesRes.status === 'fulfilled') {
          setOperatorProfiles(profilesRes.value as OperatorProfile[]);
        }
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

  // Resolve the recommended treatment from the user's primary symptom.
  // Source of truth: src/lib/symptom-treatments.ts (recommendedTreatment block).
  // Falls back to the goal-based map above when no symptom id is present.
  const recommendation = useMemo(() => {
    const sym = getSymptomById(surveyData.symptoms?.[0]);
    if (sym?.recommendedTreatment) return sym.recommendedTreatment;
    const goal = (surveyData.goal || '').toLowerCase();
    const name = GOAL_TO_TREATMENT[goal];
    if (!name) return null;
    return {
      name,
      what: 'A clinically common IV protocol for this goal.',
      why: 'Based on the goal you selected, this is the protocol most clinics in our matching platform forfer for this concern.',
      askBeforeBooking: [],
      typicalCost: '',
      duration: '',
    };
  }, [surveyData.symptoms, surveyData.goal]);

  const safetyTriggered = useMemo(
    () => hasSafetyFlag(surveyData.medicalHistory),
    [surveyData.medicalHistory]
  );
  const safetyLabel = useMemo(() => {
    const id = surveyData.medicalHistory?.[0];
    if (!id) return null;
    return SAFETY_FLAGS.find((f) => f.id === id)?.label || null;
  }, [surveyData.medicalHistory]);

  // Top 3 clinics that offer the recommended treatment.
  // Strategy: filter by specialty keyword for the treatment, then sort
  // claimed (is_featured) first, then by rating descending. Take top 3.
  // If no clinics match the specialty keyword, fall back to claimed-first
  // rating-sorted across the whole result set.
  const matchedClinics = useMemo<Provider[]>(() => {
    if (!recommendation || listings.length === 0) return [];
    const keywords = treatmentMatchKeywords(recommendation.name);

    const hasTreatmentMatch = (p: Provider) => {
      const haystacks = [
        ...(p.specialties || []),
        ...(p.subtypes || []),
        p.name || '',
        p.description || '',
      ]
        .map((s) => (s || '').toLowerCase());
      return keywords.some((kw) => haystacks.some((h) => h.includes(kw)));
    };

    const sortFn = (a: Provider, b: Provider) => {
      // Claimed clinics always pin first; rating breaks ties within each group.
      if (!!b.is_claimed !== !!a.is_claimed) {
        return b.is_claimed ? 1 : -1;
      }
      return (b.rating || 0) - (a.rating || 0);
    };

    const treatmentMatches = listings.filter(hasTreatmentMatch).sort(sortFn);
    if (treatmentMatches.length >= 3) return treatmentMatches.slice(0, 3);

    // Top up with claimed-first remaining listings if we don't have 3.
    const seen = new Set(treatmentMatches.map((p) => p.id));
    const remaining = listings.filter((p) => !seen.has(p.id)).sort(sortFn);
    return [...treatmentMatches, ...remaining].slice(0, 3);
  }, [recommendation, listings]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFDFB] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-wellness-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Analyzing Your Answers</h2>
          <p className="text-slate-500 font-bold">Finding the right protocol and clinics for you...</p>
        </div>
      </div>
    );
  }

  // If we can't even resolve a treatment (no symptom + no recognized goal),
  // route the visitor to the directory rather than show a half-empty page.
  if (!recommendation) {
    return (
      <div className="min-h-screen bg-[#FDFDFB]">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-32 text-center">
          <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">
            We need a bit more from you
          </h1>
          <p className="text-lg text-slate-500 mb-12 max-w-lg mx-auto">
            Retake the quiz so we can match you to a treatment and the clinics that offer it.
          </p>
          <button
            onClick={() => router.push('/quiz')}
            className="bg-wellness-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-wellness-700 transition-all shadow-lg shadow-wellness-200"
          >
            Retake Quiz
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* 1. One-line top recommendation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-wellness-50 text-wellness-700 px-4 py-1.5 rounded-full text-sm font-bold mb-6 border border-wellness-100">
            <Sparkles size={16} />
            <span>Your recommendation</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight max-w-3xl mx-auto">
            Based on your goals, we recommend:{' '}
            <span className="text-wellness-700">{recommendation.name}</span>
          </h1>
        </motion.div>

        {/* 2. Two-sentence "why" */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-3xl mx-auto mb-12 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8"
        >
          <p className="text-base md:text-lg text-slate-700 leading-relaxed">
            <span className="font-bold text-slate-900">What it is:</span>{' '}
            {recommendation.what}
          </p>
          <p className="text-base md:text-lg text-slate-700 leading-relaxed mt-3">
            <span className="font-bold text-slate-900">Why this fits you:</span>{' '}
            {recommendation.why}
          </p>
        </motion.div>

        {/* Optional safety callout — only when visitor flagged a condition */}
        {safetyTriggered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="max-w-3xl mx-auto mb-12 bg-amber-50 border-2 border-amber-200 rounded-3xl p-6 flex flex-col md:flex-row items-start gap-5"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <ShieldAlert size={22} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black text-amber-900 mb-2 tracking-tight">
                Important — you flagged: {safetyLabel}
              </h3>
              <p className="text-sm text-amber-900 leading-relaxed mb-3">
                Talk to your primary doctor before any IV therapy session. When you reach out
                to the clinics below, ask whether they have an MD, NP, or DO on the team for
                your situation.
              </p>
              <p className="text-xs text-amber-800 font-bold">
                TheDripMap is a matching platform, not a medical provider. This isn&apos;t medical advice.
              </p>
            </div>
          </motion.div>
        )}

        {/* 3. Clinic-grid header */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Top verified clinics{' '}
            {surveyData.city ? (
              <>
                near <span className="text-wellness-700">{surveyData.city}</span>
              </>
            ) : (
              'near you'
            )}{' '}
            offering {recommendation.name}
          </h2>
        </div>

        {/* 4. Top 3 matching clinic cards */}
        {matchedClinics.length > 0 ? (
          <div className="space-y-6">
            {matchedClinics.map((provider) => (
              <ProviderCardFeatured
                key={provider.id}
                provider={provider}
                operatorProfile={operatorProfiles.find((op) => op.clinicId === provider.id)}
                isPrimary={false}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 p-10 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
              <MapPin size={28} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">
              No verified clinics found in {surveyData.city || 'your area'} yet.
            </h3>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              Browse all clinics nationwide or retake the quiz with a different location.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/search"
                className="bg-wellness-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-wellness-700 transition-all shadow-sm"
              >
                Browse Clinics
              </Link>
              <button
                onClick={() => router.push('/quiz')}
                className="bg-white text-slate-900 border-2 border-slate-200 px-6 py-3 rounded-2xl font-bold hover:border-slate-900 transition-all"
              >
                Retake Quiz
              </button>
            </div>
          </div>
        )}

        {/* Retake quiz CTA */}
        <div className="mt-16 bg-slate-900 rounded-3xl p-8 md:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl md:text-2xl font-black mb-1 tracking-tight">
              Want a different match?
            </h3>
            <p className="text-slate-400 font-medium text-sm">
              Try a different city or adjust your answers.
            </p>
          </div>
          <button
            onClick={() => router.push('/quiz')}
            className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-black text-sm hover:bg-slate-100 transition-all shrink-0 flex items-center gap-2"
          >
            Retake Quiz <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
