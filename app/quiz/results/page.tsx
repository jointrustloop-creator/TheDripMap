'use client';
import React, { useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, ArrowRight, MapPin, ShieldAlert, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import { Navbar } from '../../../src/components/Navbar';
import { Footer } from '../../../src/components/Footer';
import { ProviderCardFeatured } from '../../../src/components/ProviderCardFeatured';
import { SurveyState, OperatorProfile, Provider, City, TreatmentType } from '../../../src/types';
import {
  getOperatorProfiles,
  getListingsByCity,
  getFeaturedListings,
  slugify,
} from '../../../src/lib/data';
import {
  getSymptomById,
  hasSafetyFlag,
  SAFETY_FLAGS,
} from '../../../src/lib/symptom-treatments';
import { practitionerType } from '../../../src/lib/practitioner';

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

// Title-case a raw location/treatment token so headings never read "toronto".
function titleCase(s?: string | null): string {
  if (!s) return '';
  return s.trim().toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

// Operator de-duplication. There is NO operator/owner column in the data, so we
// derive a best-effort key: the brand stem of the name (generic clinic words,
// directional words, and the clinic's own city stripped out), falling back to
// the root website domain. This collapses e.g. "Signature Beauty Lounge" and
// "Signature Cosmetic Clinic" (same operator, two domains) to one card. Small
// over-merge risk on a short, generic shared stem — acceptable for a 3-card set.
const OP_GENERIC = new Set(['clinic', 'clinics', 'cosmetic', 'beauty', 'lounge', 'medical', 'medi', 'spa', 'medspa', 'wellness', 'centre', 'center', 'health', 'aesthetics', 'aesthetic', 'group', 'the', 'and', 'iv', 'therapy', 'drip', 'drips', 'hydration', 'infusion', 'infusions', 'co', 'inc', 'ltd', 'care', 'of', 'for', 'at', 'mobile']);
const OP_DIR = new Set(['downtown', 'midtown', 'uptown', 'north', 'south', 'east', 'west', 'central']);
function rootDomain(url?: string | null): string {
  if (!url) return '';
  try {
    const h = new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^www\./, '');
    const parts = h.split('.');
    return parts.length > 2 ? parts.slice(-2).join('.') : h;
  } catch {
    return '';
  }
}
function operatorKey(p: Provider): string {
  const cityTokens = new Set((p.city || '').toLowerCase().split(/\s+/).filter(Boolean));
  const tokens = (p.name || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => !OP_GENERIC.has(t) && !OP_DIR.has(t) && !cityTokens.has(t));
  const stem = tokens.slice(0, 2).join(' ').trim();
  if (stem) return `brand:${stem}`;
  const dom = rootDomain((p as { website?: string }).website);
  if (dom) return `dom:${dom}`;
  return `id:${p.id || p.slug || p.name}`;
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [operatorProfiles, setOperatorProfiles] = React.useState<OperatorProfile[]>([]);
  const [listings, setListings] = React.useState<Provider[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showMore, setShowMore] = React.useState(false);

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
      why: 'Based on the goal you selected, this is a protocol clinics on our matching platform commonly offer for this goal.',
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
  const rankedClinics = useMemo<(Provider & { offersRecommended?: boolean })[]>(() => {
    if (!recommendation || listings.length === 0) return [];
    const keywords = treatmentMatchKeywords(recommendation.name);

    // Honor the visitor's delivery choice — the quiz asks Mobile vs In-Clinic.
    // If a filter would empty the set, ignore it rather than dead-end the visitor.
    const isMobile = (p: Provider) =>
      p.type === 'Mobile' || p.type === 'Both' ||
      (p as { mobile_service?: boolean }).mobile_service === true ||
      /\bmobile\b|concierge|in[\s-]home|come to you/i.test(`${p.name || ''} ${p.description || ''}`);
    const pref = surveyData.locationPreference;
    let pool = listings;
    if (pref === 'Mobile') { const m = listings.filter(isMobile); if (m.length) pool = m; }
    else if (pref === 'In-Clinic') { const c = listings.filter((p) => p.type !== 'Mobile'); if (c.length) pool = c; }

    const hasTreatmentMatch = (p: Provider) => {
      const haystacks = [...(p.specialties || []), ...(p.subtypes || []), p.name || '', p.description || '']
        .map((s) => (s || '').toLowerCase());
      return keywords.some((kw) => haystacks.some((h) => h.includes(kw)));
    };

    // Annotate each clinic with whether it actually offers the recommended
    // treatment — the card shows an honest "Offers …" chip only when true, and
    // the header only claims the treatment when at least one clinic confirms it.
    const annotated = pool.map((p) => ({ ...p, offersRecommended: hasTreatmentMatch(p) }));

    // Safety-aware ranking: when the visitor flagged a contraindication, MD / NP
    // / DO-led clinics rise to the TOP (sort, never hard-filter, so thin markets
    // still return results). Then confirmed-treatment, then claimed, then rating.
    const sortFn = (a: typeof annotated[number], b: typeof annotated[number]) => {
      if (safetyTriggered) {
        const diff = practitionerType(b).rank - practitionerType(a).rank;
        if (diff !== 0) return diff;
      }
      // Featured (paid) clinics take the top slots — the sellable "Featured =
      // top-3 match placement." Safety oversight still ranks above this for
      // patients who flagged a contraindication (trust before revenue).
      if (!!b.is_featured !== !!a.is_featured) return b.is_featured ? 1 : -1;
      if (!!b.offersRecommended !== !!a.offersRecommended) return b.offersRecommended ? 1 : -1;
      if (!!b.is_claimed !== !!a.is_claimed) return b.is_claimed ? 1 : -1;
      return (b.rating || 0) - (a.rating || 0);
    };

    // One card per operator (no data operator key exists; see operatorKey()).
    const sorted = annotated.sort(sortFn);
    const seenOperators = new Set<string>();
    const deduped: typeof annotated = [];
    for (const p of sorted) {
      const key = operatorKey(p);
      if (seenOperators.has(key)) continue;
      seenOperators.add(key);
      deduped.push(p);
    }
    return deduped;
  }, [recommendation, listings, surveyData.locationPreference, safetyTriggered]);

  // Top 3 are the hero "matches"; the rest expand on demand ("view more").
  // This makes the top-3 slots scarce + sellable as Featured placement.
  const matchedClinics = useMemo(() => rankedClinics.slice(0, 3), [rankedClinics]);
  const moreClinics = useMemo(() => rankedClinics.slice(3), [rankedClinics]);

  // Location transparency: getListingsByCity silently broadens an empty city to
  // state level, so detect when nothing in the shown set is actually in the
  // requested city and surface it (banner) instead of pretending.
  const inCityCount = useMemo(() => {
    const city = (surveyData.city || '').toLowerCase().trim();
    if (!city) return -1;
    return listings.filter((l) => (l.city || '').toLowerCase().trim() === city).length;
  }, [listings, surveyData.city]);
  const isBroadened = Boolean(surveyData.city) && inCityCount === 0 && matchedClinics.length > 0;
  const fallbackRegion = (() => {
    if (surveyData.state) return surveyData.state;
    const tally = new Map<string, number>();
    matchedClinics.forEach((c) => { if (c.state) tally.set(c.state, (tally.get(c.state) || 0) + 1); });
    let best = ''; let n = 0;
    tally.forEach((v, k) => { if (v > n) { best = k; n = v; } });
    return best || 'your area';
  })();

  // Honest header wording: only call the set "verified" when every shown clinic
  // carries a real badge, and only claim the treatment when one actually offers it.
  const anyConfirmed = matchedClinics.some((c) => c.offersRecommended);
  const allVerified = matchedClinics.length > 0 && matchedClinics.every((c) => c.is_claimed || c.is_featured || c.safety_verified);
  const clinicNoun = allVerified ? 'Verified clinics' : 'Clinics';

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

        {/* Transparent radius expansion — never silently jump markets */}
        {isBroadened && (
          <div className="max-w-3xl mx-auto mb-8 bg-sky-50 border border-sky-200 rounded-2xl p-4 flex items-start gap-3">
            <MapPin size={18} className="text-sky-600 shrink-0 mt-0.5" />
            <p className="text-sm text-sky-900 font-semibold leading-relaxed">
              No verified clinics in{' '}
              <span className="font-black">{titleCase(surveyData.city)}</span> yet. Showing the
              nearest verified clinics in {fallbackRegion}.
            </p>
          </div>
        )}

        {/* 3. Clinic-grid header — honest about verification, location, treatment */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            {isBroadened ? (
              <>
                Nearest {clinicNoun.toLowerCase()}
                {anyConfirmed && (
                  <> for <span className="text-wellness-700">{recommendation.name}</span></>
                )}
              </>
            ) : (
              <>
                {clinicNoun}{' '}
                {surveyData.city ? (
                  <>near <span className="text-wellness-700">{titleCase(surveyData.city)}</span></>
                ) : (
                  'near you'
                )}
                {anyConfirmed && (
                  <> for <span className="text-wellness-700">{recommendation.name}</span></>
                )}
              </>
            )}
          </h2>
          {!anyConfirmed && matchedClinics.length > 0 && (
            <p className="text-sm text-slate-500 font-semibold mt-2 max-w-xl mx-auto">
              These are the closest matches we can show. Confirm they offer {recommendation.name} when you reach out.
            </p>
          )}
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
                recommendedTreatment={recommendation.name}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 p-10 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
              <MapPin size={28} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">
              No verified clinics found in {surveyData.city ? titleCase(surveyData.city) : 'your area'} yet.
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

        {/* View more clinics nearby — keeps patients on the results page and
            makes the top-3 "featured" slots visibly scarce (sellable placement). */}
        {moreClinics.length > 0 && (
          <div className="mt-6">
            {!showMore ? (
              <button
                onClick={() => setShowMore(true)}
                className="w-full bg-white border-2 border-slate-200 hover:border-wellness-400 hover:bg-wellness-50/40 text-slate-900 px-6 py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2"
              >
                View more clinics{surveyData.city ? ` in ${titleCase(surveyData.city)}` : ' nearby'}
                <ChevronDown size={16} />
              </button>
            ) : (
              <>
                <div className="text-center mt-14 mb-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">More clinics nearby</h3>
                </div>
                <div className="space-y-6">
                  {moreClinics.slice(0, 9).map((provider) => (
                    <ProviderCardFeatured
                      key={provider.id}
                      provider={provider}
                      operatorProfile={operatorProfiles.find((op) => op.clinicId === provider.id)}
                      isPrimary={false}
                      recommendedTreatment={recommendation.name}
                    />
                  ))}
                </div>
                {moreClinics.length > 9 && surveyData.city && (
                  <div className="text-center mt-8">
                    <Link
                      href={`/cities/${slugify(surveyData.city)}`}
                      className="inline-flex items-center gap-1.5 text-sm font-black text-wellness-700 hover:gap-2.5 transition-[gap]"
                    >
                      See all {rankedClinics.length} clinics in {titleCase(surveyData.city)} <ArrowRight size={16} />
                    </Link>
                  </div>
                )}
              </>
            )}
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
