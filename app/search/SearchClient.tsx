'use client';
import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  Filter,
  Zap,
  CheckCircle2,
  MapPin,
  ArrowDown,
  ArrowUp,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Provider, City, TreatmentType, ListingStats } from '../../src/types';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';
import { TrustSignals } from '../../src/components/TrustSignals';
import { ProviderCard } from '../../src/components/ProviderCard';
import { ProviderCardFeatured } from '../../src/components/ProviderCardFeatured';
import { cn } from '../../src/lib/utils';
import { searchListings, getCitiesWithListings, slugify } from '../../src/lib/data';
import { getUserLocation, UserLocation } from '../../src/lib/geo';
import { calculateValueMetrics } from '../../src/lib/price-utils';

interface SearchClientProps {
  initialProviders: Provider[];
  cities: string[];
  initialStats: ListingStats | null;
  totalCount: number;
}

const GOAL_KEYWORDS: Record<string, string[]> = {
  'SkinGlow': ['beauty', 'glow', 'skin', 'hair', 'nails', 'collagen', 'glutathione', 'skin glow', 'brightening', 'complexion'],
  'WeightLoss': ['weight', 'metabolism', 'fat', 'slim', 'semaglutide', 'tirzepatide', 'mic', 'lipo', 'fat burn', 'metabolic'],
  'NAD': ['nad', 'nicotinamide', 'anti-aging', 'energy', 'longevity', 'cellular', 'rejuvenation'],
  'Immune': ['immune', 'wellness', 'vitamin c', 'zinc', 'immunity', 'shield', 'defense', 'defender', 'glutathione', 'tri-immune'],
  'Hangover': ['hangover', 'hydration', 'recovery', 'rehydrate', 'detox', 'cleanse', 'saline', 'fluids'],
  'Hydration': ['hydration', 'rehydrate', 'fluids', 'saline', 'electrolyte', 'quench'],
  'JetLag': ['jet', 'lag', 'travel', 'fatigue', 'energy', 'recovery', 'timezone', 'flight', 'international'],
  'Peptide': ['peptide', 'semaglutide', 'tirzepatide', 'sermorelin', 'bpc-157', 'glp-1', 'ozempic', 'wegovy', 'mounjaro', 'cjc-1295', 'ipamorelin', 'tb-500'],
};

export default function SearchClient({ initialProviders, cities: initialCities, initialStats, totalCount }: SearchClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Parse URL parameters
  const getInitialState = React.useCallback(() => {
    const city = (searchParams.get('city') || searchParams.get('location') || 'All') as City | 'All';
    const q = searchParams.get('q') || searchParams.get('treatment') || '';
    const type = searchParams.get('type');
    const specialty = searchParams.get('specialty');
    
    // For specialty that doesn't have a direct chip, we might want to add it to the query
    let initialSearchQuery = q;
    
    const chips: string[] = ['All'];
    let initialTypeFilter: TreatmentType | 'All' = 'All';
    
    // Case-insensitive type URL parsing — ?type=mobile, ?type=Mobile, ?type=MOBILE all activate the chip.
    if (type && type.toLowerCase() === 'mobile') {
      chips.push('Mobile');
      initialTypeFilter = 'Mobile';
    }
    
    // Mapping from specialty parameter to our internal chip IDs
    const specialtyToChip: Record<string, string> = {
      'NAD+ Plus': 'NAD',
      'NAD+ Therapy': 'NAD',
      'Hangover Relief': 'Hangover',
      'Hangover': 'Hangover',
      'Hydration': 'Hydration',
      'Skin Glow': 'SkinGlow',
      'Beauty & Glow': 'SkinGlow',
      'Weight Loss': 'WeightLoss',
      'Immune Support': 'Immune',
      'Jet Lag': 'JetLag',
      'Peptide Therapy': 'Peptide',
    };
    
    if (specialty) {
      const chipId = specialtyToChip[specialty];
      if (chipId) {
        chips.push(chipId);
      } else {
        // If no matching chip, add it to the search query if search query is empty
        if (!initialSearchQuery) initialSearchQuery = specialty;
      }
    }
    
    return {
      city,
      searchQuery: initialSearchQuery,
      activeChips: chips.length > 1 ? chips.filter(c => c !== 'All') : chips,
      typeFilter: initialTypeFilter
    };
  }, [searchParams]);

  const initialState = React.useMemo(() => getInitialState(), [getInitialState]);
  
  const [selectedCity, setSelectedCity] = useState<City | 'All'>(initialState.city);
  const [searchQuery, setSearchQuery] = useState(initialState.searchQuery);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  
  const [typeFilter, setTypeFilter] = useState<TreatmentType | 'All'>(initialState.typeFilter);
  const [activeChips, setActiveChips] = useState<string[]>(initialState.activeChips);

  // Sync with URL parameters
  useEffect(() => {
    const state = getInitialState();
    setSelectedCity(state.city);
    setSearchQuery(state.searchQuery);
    setActiveChips(state.activeChips);
    setTypeFilter(state.typeFilter);
  }, [getInitialState]);
  
  const [sortBy, setSortBy] = useState<'best' | 'rating' | 'reviews' | 'distance' | 'value'>('best');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  // Default-view behavior (no city, no query, no chips): show ONLY verified
  // clinics sorted by claim date. The toggles flip the sort direction and let
  // the visitor escape into the full directory pool.
  const [verifiedSortAsc, setVerifiedSortAsc] = useState(false); // false = newest claim first
  const [showAllClinics, setShowAllClinics] = useState(false);
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>(initialProviders);
  // True when the user's combination of filters produced zero results and we
  // auto-broadened to nationwide top-rated. Drives the amber "broadened" banner.
  const [isBroadened, setIsBroadened] = useState(false);
  const [cities, setCities] = useState(initialCities);
  const [siteStats, setSiteStats] = useState<ListingStats | null>(initialStats);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Start as false since we have initial data

  const filterChips = [
    { id: 'All', label: 'All' },
    { id: 'Mobile', label: 'Mobile IV' },
    { id: 'Value', label: 'Best Value' },
    { id: 'SkinGlow', label: 'Skin Glow' },
    { id: 'WeightLoss', label: 'Weight Loss' },
    { id: 'NAD', label: 'Energy / NAD+' },
    { id: 'Immune', label: 'Immune Support' },
    { id: 'Hangover', label: 'Hangover' },
    { id: 'Hydration', label: 'Hydration' },
    { id: 'JetLag', label: 'Jet Lag' },
    { id: 'Peptide', label: 'Peptide Therapy' },
    { id: 'Open', label: 'Open Now' },
    { id: 'TopRated', label: 'Top Rated' },
  ];

  const toggleChip = (id: string) => {
    if (id === 'All') {
      setActiveChips(['All']);
      setTypeFilter('All');
      return;
    }
    
    setActiveChips(prev => {
      const next = prev.includes(id) ? prev.filter(c => c !== id) : [...prev.filter(c => c !== 'All'), id];
      return next.length === 0 ? ['All'] : next;
    });

    if (id === 'Mobile') {
      setTypeFilter(prev => prev === 'Mobile' ? 'All' : 'Mobile');
    }
  };

  // Handles both legacy `hours` format ({monday: "10AM-8PM"}) and the actual
  // working_hours format from Supabase ({Monday: ["10AM-8PM"]} — capitalized keys, array values).
  const isOpenNow = (hours?: Record<string, string | string[]>) => {
    if (!hours) return false;
    const now = new Date();
    const weekday = now.toLocaleDateString('en-US', { weekday: 'long' }); // "Monday"
    // Try capitalized key first (DB format), fall back to lowercase
    const raw = hours[weekday] ?? hours[weekday.toLowerCase()];
    const timeRange: string | undefined = Array.isArray(raw) ? raw[0] : raw;
    if (!timeRange || timeRange.toLowerCase().includes('closed')) return false;
    try {
      const cleanRange = timeRange.replace(/\s+/g, '');
      const parts = cleanRange.split(/[-–—]/);
      if (parts.length !== 2) return false;
      const [startStr, endStr] = parts;
      const parseTime = (t: string) => {
        const match = t.match(/(\d+)(?::(\d+))?\s*(AM|PM)/i);
        if (!match) return null;
        let h = parseInt(match[1], 10);
        const m = match[2] ? parseInt(match[2], 10) : 0;
        const modifier = match[3].toUpperCase();
        if (modifier === 'PM' && h < 12) h += 12;
        if (modifier === 'AM' && h === 12) h = 0;
        const d = new Date(now);
        d.setHours(h, m, 0, 0);
        return d;
      };
      const startTime = parseTime(startStr);
      const endTime = parseTime(endStr);
      if (!startTime || !endTime) return false;
      if (endTime < startTime) endTime.setDate(endTime.getDate() + 1);
      return now >= startTime && now <= endTime;
    } catch {
      return false;
    }
  };

  // Mobile-IV detection heuristic — only ~5 of 705 providers have type='Mobile' set,
  // and there's no mobile_service column. Catch mobile providers by name/desc/specialty
  // signals instead: "mobile" in name, "we come to you", "in-home", "concierge",
  // or a specialty literally including "Mobile".
  const isMobileProvider = (p: Provider): boolean => {
    if (p.type === 'Mobile' || p.type === 'Both') return true;
    const name = (p.name || '').toLowerCase();
    const desc = (p.description || '').toLowerCase();
    const specialties = (p.specialties || []).join(' ').toLowerCase();
    const haystack = `${name} ${desc} ${specialties}`;
    return /\bmobile\b|\bconcierge\b|\bin[\s-]home\b|come to you|at[\s-]your[\s-](?:home|office|hotel)|house calls?|delivered to your/.test(haystack);
  };

  // Top-rated heuristic — there's no is_top_rated column. Define "top rated" as
  // rating >= 4.7 AND at least 20 reviews so we don't surface fluke 5-star/1-review listings.
  const isTopRated = (p: Provider): boolean => {
    return (p.rating ?? 0) >= 4.7 && (p.reviewCount ?? 0) >= 20;
  };

  useEffect(() => {
    const loadData = async () => {
      if (!initialCities || !initialCities.length) {
        const fetchedCities = await getCitiesWithListings();
        setCities(fetchedCities);
      }
      
      if (!initialStats) {
        const { getListingStats } = await import('../../src/lib/data');
        const stats = await getListingStats();
        setSiteStats(stats);
      }
      
      try {
        const location = await getUserLocation();
        setUserLocation(location);
      } catch (err) {
        console.warn('Geolocation not available:', err);
      }
    };
    loadData();
  }, [initialCities, initialStats]);

  // Helpers shared by both the default-view path and the search/filter path.
  // claimDateMs returns the parsed claimed_at as a number; missing values fall
  // back to 0 so unstamped grandfathered rows sink rather than scramble order.
  const claimDateMs = React.useCallback((p: Provider): number => {
    return p.claimed_at ? new Date(p.claimed_at).getTime() : 0;
  }, []);

  // True when nothing the visitor did has narrowed the page yet. In this state
  // we show ONLY verified clinics by claim date (the "spot new ones" view),
  // unless the visitor explicitly clicks "Browse all" to escape into the
  // broader directory.
  const isDefaultView =
    selectedCity === 'All' &&
    searchQuery.trim() === '' &&
    (activeChips.length === 0 || (activeChips.length === 1 && activeChips[0] === 'All'));

  useEffect(() => {
    const fetchListings = async () => {
      // --- Default view: verified-only, sorted by claim date ---
      if (isDefaultView && !showAllClinics) {
        const verifiedOnly = initialProviders
          .filter((p) => p.is_claimed)
          .slice()
          .sort((a, b) =>
            verifiedSortAsc ? claimDateMs(a) - claimDateMs(b) : claimDateMs(b) - claimDateMs(a),
          );
        setFilteredProviders(verifiedOnly);
        setIsBroadened(false);
        return;
      }

      // --- Default view + "Browse all" escape: full pool, claimed pinned top ---
      if (isDefaultView && showAllClinics) {
        const all = initialProviders.slice().sort((a, b) => {
          if (a.is_claimed !== b.is_claimed) return a.is_claimed ? -1 : 1;
          if (a.is_claimed && b.is_claimed) return claimDateMs(b) - claimDateMs(a);
          return (b.rating ?? 0) - (a.rating ?? 0);
        });
        setFilteredProviders(all);
        setIsBroadened(false);
        return;
      }

      setIsLoading(true);
      let results = await searchListings(searchQuery, selectedCity);

      // Apply Chips Filters
      if (!activeChips.includes('All')) {
        if (activeChips.includes('Mobile')) {
          results = results.filter(isMobileProvider);
        }
        if (activeChips.includes('Value')) {
          results = results.filter(p => {
            const metrics = calculateValueMetrics(p);
            return metrics.score >= 70;
          });
        }
        if (activeChips.includes('Open')) {
          results = results.filter(p => isOpenNow(p.working_hours));
        }
        if (activeChips.includes('TopRated')) {
          results = results.filter(isTopRated);
        }

        const activeGoalChips = Object.keys(GOAL_KEYWORDS).filter(id => activeChips.includes(id));
        if (activeGoalChips.length > 0) {
          results = results.filter(p => {
            const pSpecialties = (p.specialties || []).map(s => (s || '').toLowerCase());
            const pSubtypes = (p.subtypes || []).map(s => (s || '').toLowerCase());
            const pName = (p.name || '').toLowerCase();
            const pDesc = (p.description || '').toLowerCase();
            return activeGoalChips.some(chipId => {
              const keywords = GOAL_KEYWORDS[chipId];
              return keywords.some(kw =>
                pSpecialties.some(s => s.includes(kw)) ||
                pSubtypes.some(s => s.includes(kw)) ||
                pName.includes(kw) ||
                pDesc.includes(kw)
              );
            });
          });
        }
      }

      // Apply Sorting (city or query active).
      //
      // Pinning changed 2026-06-05: claimed (is_claimed) clinics pin to the
      // top, replacing the older is_featured pin. Within the claimed group,
      // newest claimed_at first so a freshly verified clinic surfaces above
      // older claims. Among the unclaimed remainder, the visitor's chosen
      // sort applies. Mirrors how Yelp/Google keep verified results pinned
      // regardless of sort, and protects the value clinics get when they
      // claim.
      const sorted = [...results];
      const tiebreaker = (a: Provider, b: Provider): number => {
        if (sortBy === 'rating') return (b.rating ?? 0) - (a.rating ?? 0);
        if (sortBy === 'reviews') return (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
        if (sortBy === 'distance' && userLocation) {
          return (a.distance ?? 999) - (b.distance ?? 999);
        }
        if (sortBy === 'value') {
          return calculateValueMetrics(b).score - calculateValueMetrics(a).score;
        }
        // 'best' or anything else: rating
        return (b.rating ?? 0) - (a.rating ?? 0);
      };
      sorted.sort((a, b) => {
        if (a.is_claimed !== b.is_claimed) return a.is_claimed ? -1 : 1;
        if (a.is_claimed && b.is_claimed) return claimDateMs(b) - claimDateMs(a);
        return tiebreaker(a, b);
      });

      // Hard floor: if the user's filter combo produced 0 results and there
      // is a city filter active, drop the city and retry — better to show
      // top-rated nationwide options than a dead-end empty state.
      if (sorted.length === 0 && selectedCity !== 'All' && selectedCity !== '') {
        const broadened = await searchListings(searchQuery, 'All');
        const fallback = broadened.slice().sort((a, b) => {
          if (a.is_claimed !== b.is_claimed) return a.is_claimed ? -1 : 1;
          if (a.is_claimed && b.is_claimed) return claimDateMs(b) - claimDateMs(a);
          return (b.rating ?? 0) - (a.rating ?? 0);
        }).slice(0, 24);
        setFilteredProviders(fallback);
        setIsBroadened(fallback.length > 0);
      } else {
        setFilteredProviders(sorted);
        setIsBroadened(false);
      }
      setIsLoading(false);
    };

    fetchListings();
  }, [selectedCity, searchQuery, activeChips, sortBy, userLocation, initialProviders, isDefaultView, showAllClinics, verifiedSortAsc, claimDateMs]);

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      
      {/* Search Header */}
      <section className="bg-white border-b border-slate-100 pt-12 pb-8 px-6 text-center md:text-left">
        <div className="max-w-7xl mx-auto">
          {/* SEO H1 and Intro */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
              IV Therapy Clinics Near You
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto md:mx-0 font-medium leading-relaxed">
              Browse {siteStats?.totalListings?.toLocaleString() || '...'} verified IV therapy clinics across {siteStats?.totalCities || '...'} US cities. Filter by city, service, or delivery preference — or take the quiz to get matched in 60 seconds.
            </p>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pt-8 border-t border-slate-50">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {isDefaultView && !showAllClinics ? (
                  <>
                    <ShieldCheck size={22} className="inline -mt-1 text-wellness-600 mr-2" />
                    Safety Verified IV Therapy Clinics
                  </>
                ) : selectedCity === 'All' ? (
                  'All Clinics'
                ) : (
                  `IV Therapy in ${selectedCity}`
                )}
                <span className="text-wellness-600 ml-2">
                  ({filteredProviders.length})
                </span>
              </h2>
              {isDefaultView && !showAllClinics && (
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                  <button
                    onClick={() => setVerifiedSortAsc((v) => !v)}
                    className="inline-flex items-center gap-1.5 font-bold text-slate-600 hover:text-slate-900"
                  >
                    {verifiedSortAsc ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                    {verifiedSortAsc ? 'Oldest claim first' : 'Newest claim first'}
                  </button>
                  <span className="text-slate-300">·</span>
                  <button
                    onClick={() => setShowAllClinics(true)}
                    className="font-bold text-wellness-700 hover:text-wellness-800 underline-offset-2 hover:underline"
                  >
                    Browse all {totalCount.toLocaleString()} clinics
                  </button>
                </div>
              )}
              {isDefaultView && showAllClinics && (
                <button
                  onClick={() => setShowAllClinics(false)}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-wellness-700 hover:text-wellness-800 underline-offset-2 hover:underline"
                >
                  <ShieldCheck size={12} /> Back to Safety Verified only
                </button>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search by name or service..." 
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-wellness-600/20 focus:border-wellness-600 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'best' | 'rating' | 'reviews' | 'distance' | 'value')}
                className="w-full sm:w-auto bg-white border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-wellness-600/20 transition-all cursor-pointer"
              >
                <option value="best">Best Match</option>
                <option value="value">Best Value</option>
                <option value="rating">Highest Rated</option>
                <option value="reviews">Most Reviewed</option>
                <option value="distance">Nearest First</option>
              </select>

              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={cn(
                  "w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm border transition-all",
                  isFilterOpen ? "bg-wellness-600 text-white border-wellness-600" : "bg-white text-slate-600 border-slate-100 hover:border-wellness-200"
                )}
              >
                <Filter size={18} /> Filters
              </button>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {filterChips.map(chip => (
              <button
                key={chip.id}
                onClick={() => toggleChip(chip.id)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-bold border transition-all",
                  activeChips.includes(chip.id) 
                    ? "bg-wellness-600 border-wellness-600 text-white" 
                    : "bg-white border-slate-200 text-slate-600 hover:border-wellness-300"
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>


          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 text-left">
            Showing {filteredProviders.length} {activeChips.includes('Mobile') ? 'mobile IV ' : ''}clinics {selectedCity === 'All' ? 'nationwide' : `in ${selectedCity}`}
          </div>

          <AnimatePresence>
            {isFilterOpen && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8 border-t border-slate-50">
                  <div className="md:col-span-1">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Select City</h4>
                    <div className="mb-4 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input 
                        type="text"
                        placeholder="Search cities..."
                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-100 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-wellness-600/20 focus:border-wellness-600 transition-all"
                        value={citySearchQuery}
                        onChange={(e) => setCitySearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-1">
                      <button 
                        onClick={() => setSelectedCity('All')}
                        className={cn(
                          "w-full text-left px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-between",
                          selectedCity === 'All' ? "bg-wellness-50 border-wellness-600 text-wellness-700" : "bg-white border-slate-100 text-slate-600 hover:border-wellness-200"
                        )}
                      >
                        All Cities
                        {selectedCity === 'All' && <CheckCircle2 size={14} />}
                      </button>
                      
                      {cities
                        .filter(c => c.toLowerCase().includes(citySearchQuery.toLowerCase()))
                        .map(city => (
                        <button 
                          key={city}
                          onClick={() => setSelectedCity(city as City)}
                          className={cn(
                            "w-full text-left px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-between",
                            selectedCity === city ? "bg-wellness-50 border-wellness-600 text-wellness-700" : "bg-white border-slate-100 text-slate-600 hover:border-wellness-200"
                          )}
                        >
                          <span>{city}</span>
                          {selectedCity === city && <CheckCircle2 size={14} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Service Type</h4>
                    <div className="space-y-2">
                      {['All', 'In-Clinic', 'Mobile'].map(type => (
                        <button 
                          key={type}
                          onClick={() => setTypeFilter(type as TreatmentType | 'All')}
                          className={cn(
                            "w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold border transition-all",
                            typeFilter === type ? "bg-wellness-50 border-wellness-600 text-wellness-700" : "bg-white border-slate-100 text-slate-600 hover:border-wellness-200"
                          )}
                        >
                          {type}
                          {typeFilter === type && <Zap size={14} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-wellness-50 rounded-3xl p-6 flex flex-col justify-center">
                    <h4 className="text-lg font-black text-wellness-900 mb-2">Get exactly what you need.</h4>
                    <p className="text-sm text-wellness-700 mb-6 leading-relaxed">Not all IV therapy is the same. Our match quiz finds the perfect provider based on your exact goals in 60 seconds.</p>
                    <button 
                      onClick={() => router.push('/quiz')}
                      className="bg-wellness-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-wellness-700 transition-all shadow-lg shadow-wellness-100 flex items-center justify-center gap-2"
                    >
                      <Zap size={16} /> Start Match Quiz
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Results Grid */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="text-center py-32">
              <div className="w-12 h-12 border-4 border-wellness-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-500 font-bold">Searching clinics...</p>
            </div>
          ) : filteredProviders.length > 0 ? (
            <>
              {isBroadened && (
                <div className="mb-8 bg-amber-50 border-2 border-amber-200 rounded-3xl p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-amber-900 mb-1">
                      No matches for your filters in {selectedCity}, showing top-rated nationwide.
                    </p>
                    <p className="text-xs text-amber-800 font-medium leading-relaxed">
                      Adjust the city, clear a chip, or pick a different sort to narrow down.
                    </p>
                  </div>
                  <button
                    onClick={() => { setSelectedCity('All'); setIsBroadened(false); }}
                    className="text-xs font-black text-amber-900 uppercase tracking-widest hover:underline whitespace-nowrap"
                  >
                    Clear city →
                  </button>
                </div>
              )}

              {/* Recent Additions strip — only renders in the default verified-only
                  view when there are at least 3 verified clinics with claim dates.
                  Top 3 are still shown in the full grid below; this is a high-
                  visibility "spot what just claimed" surface. */}
              {isDefaultView && !showAllClinics && (() => {
                const newest = filteredProviders
                  .filter((p) => p.claimed_at)
                  .slice(0, 3);
                if (newest.length < 3) return null;
                return (
                  <section className="mb-12">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center justify-center w-9 h-9 rounded-2xl bg-wellness-100 text-wellness-700">
                          <Sparkles size={16} />
                        </span>
                        <div>
                          <h3 className="text-lg font-black text-slate-900 tracking-tight">Recent additions</h3>
                          <p className="text-xs font-bold text-slate-500">3 most recently verified clinics</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {newest.map((p, idx) => (
                        <div key={`new-${p.id}`} className="relative">
                          {idx === 0 && (
                            <span className="absolute -top-2 left-4 z-10 bg-wellness-600 text-white text-[10px] font-black uppercase tracking-[0.18em] px-3 py-1 rounded-full shadow-md shadow-wellness-200">
                              NEW
                            </span>
                          )}
                          <ProviderCard provider={p} />
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })()}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProviders.map((provider) => (
                  <div key={provider.id} className={cn(provider.is_featured ? "md:col-span-2 lg:col-span-3" : "")}>
                    {provider.is_featured ? (
                      <ProviderCardFeatured provider={provider} isPrimary={true} />
                    ) : (
                      <ProviderCard provider={provider} />
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-32 bg-white rounded-[3rem] border border-slate-100 shadow-xl">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-6">
                <Search size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">No clinics found</h3>
              <p className="text-slate-500 mb-8">Try adjusting your filters or searching for a different city.</p>
              <button 
                onClick={() => { setSelectedCity('All'); setSearchQuery(''); setTypeFilter('All'); }}
                className="text-wellness-600 font-bold hover:text-wellness-700 transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Recently Viewed (Simulated) */}
      {filteredProviders.length > 3 && (
        <section className="py-16 px-6 border-t border-slate-100 bg-slate-50/30">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Recently Viewed</h2>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-slate-300 rounded-full" /> Personal results
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 opacity-60 hover:opacity-100 transition-all duration-500">
              {filteredProviders.slice().reverse().slice(0, 4).map((provider) => (
                <div key={`recent-${provider.id}`} className="scale-95 origin-center">
                  <ProviderCard 
                    provider={provider} 
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Browse by City Section */}
      <section className="py-16 px-6 border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-black text-slate-900 mb-10 tracking-tight">Browse by City</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {(cities && cities.length > 0 ? cities.slice(0, 14) : [
              'New York',
              'Clearwater',
              'Washington',
              'Houston',
              'San Diego',
              'Tampa',
              'Miami'
            ]).map((city: string | { city?: string; name?: string }) => {
              const cityName = typeof city === 'string' ? city : city.city || city.name || '';
              const citySlug = slugify(cityName);
              return (
                <button
                  key={citySlug}
                  onClick={() => router.push(`/cities/${citySlug}`)}
                  className="p-6 bg-white border border-slate-100 rounded-2xl text-center hover:border-wellness-200 hover:shadow-md transition-all group"
                >
                  <div className="text-sm font-bold text-slate-900 group-hover:text-wellness-600 transition-colors uppercase tracking-tight">{cityName}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">View City Info</div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Dynamic Trust Signals */}
      {siteStats && <TrustSignals stats={siteStats} />}

      <Footer />
    </div>
  );
}
