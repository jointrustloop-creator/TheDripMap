'use client';
import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  Filter,
  Zap,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Provider, City, ListingStats } from '../../src/types';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';
import { TrustSignals } from '../../src/components/TrustSignals';
import { ExploreResults } from '../../src/components/explore/ExploreResults';
import { ExploreCard } from '../../src/components/explore/ExploreCard';
import { BreadcrumbNav } from '../../src/components/BreadcrumbNav';
import { isVerifiedClinic } from '../../src/lib/clinic-display';
import { cn } from '../../src/lib/utils';
import { searchListings, getCitiesWithListings } from '../../src/lib/data';
import { getUserLocation, UserLocation } from '../../src/lib/geo';
import {
  CHIPS,
  isMobile as isMobileFilter,
  isPrescriberVerified,
  groupBySoft,
  countHard,
  countFacet,
  SOFT_GROUP_LABELS,
  type SoftFilterId,
  type GroupedResults,
} from '../../src/lib/filters';
import { trackFilter } from '../../src/lib/track-filter';

interface SearchClientProps {
  initialProviders: Provider[];
  cities: string[];
  initialStats: ListingStats | null;
  totalCount: number;
}

const SOFT_IDS: SoftFilterId[] = ['NAD', 'SkinGlow', 'TopRated'];
const isSoftId = (id: string): id is SoftFilterId => (SOFT_IDS as string[]).includes(id);

export default function SearchClient({ initialProviders, cities: initialCities, initialStats, totalCount }: SearchClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Parse URL parameters. Chips map from ?specialty / ?type into our chip ids.
  const getInitialState = React.useCallback(() => {
    const city = (searchParams.get('city') || searchParams.get('location') || 'All') as City | 'All';
    const q = searchParams.get('q') || searchParams.get('treatment') || '';
    const type = searchParams.get('type');
    const specialty = searchParams.get('specialty');

    let initialSearchQuery = q;
    const chips: string[] = [];

    if (type && type.toLowerCase() === 'mobile') chips.push('Mobile');

    const specialtyToChip: Record<string, string> = {
      'NAD+ Plus': 'NAD',
      'NAD+ Therapy': 'NAD',
      'Skin Glow': 'SkinGlow',
      'Beauty & Glow': 'SkinGlow',
    };
    if (specialty) {
      const chipId = specialtyToChip[specialty];
      if (chipId) chips.push(chipId);
      else if (!initialSearchQuery) initialSearchQuery = specialty;
    }

    return { city, searchQuery: initialSearchQuery, activeChips: chips };
  }, [searchParams]);

  const initialState = React.useMemo(() => getInitialState(), [getInitialState]);

  const [selectedCity, setSelectedCity] = useState<City | 'All'>(initialState.city);
  const [searchQuery, setSearchQuery] = useState(initialState.searchQuery);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  // activeChips holds the ids of every active chip (hard, soft, or facet). Empty
  // means no narrowing. There is no implicit 'All' sentinel anymore.
  const [activeChips, setActiveChips] = useState<string[]>(initialState.activeChips);

  useEffect(() => {
    const state = getInitialState();
    setSelectedCity(state.city);
    setSearchQuery(state.searchQuery);
    setActiveChips(state.activeChips);
  }, [getInitialState]);

  const [sortBy, setSortBy] = useState<'best' | 'rating' | 'reviews' | 'distance' | 'verified'>('best');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [verifiedSortAsc, setVerifiedSortAsc] = useState(false);
  const [showAllClinics, setShowAllClinics] = useState(false);
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>(initialProviders);
  // Grouped results when a soft chip is active (lists / notListed / unknown).
  const [groups, setGroups] = useState<GroupedResults | null>(null);
  const [fullPool, setFullPool] = useState<Provider[]>(initialProviders);
  useEffect(() => {
    let cancelled = false;
    searchListings('', 'All')
      .then((all) => {
        if (!cancelled && Array.isArray(all) && all.length > initialProviders.length) setFullPool(all);
      })
      .catch(() => { /* keep the SSR slice on failure */ });
    return () => { cancelled = true; };
  }, [initialProviders]);
  const [isBroadened, setIsBroadened] = useState(false);
  const [cities, setCities] = useState(initialCities);
  const [siteStats, setSiteStats] = useState<ListingStats | null>(initialStats);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Pre-apply counts for the hard filter (Mobile) + the flagship facet, so the
  // visitor sees what they're narrowing to BEFORE clicking. Computed over the
  // full pool (falls back to the current filtered set until it hydrates).
  const countPool = fullPool.length ? fullPool : filteredProviders;
  const mobileCount = countHard(countPool, 'Mobile');
  const prescriberCount = countFacet(countPool, 'PrescriberVerified');

  const chipCount = (id: string): number | null => {
    if (id === 'Mobile') return mobileCount;
    if (id === 'PrescriberVerified') return prescriberCount;
    return null;
  };

  const toggleChip = (id: string) => {
    setActiveChips((prev) => {
      const on = !prev.includes(id);
      trackFilter(id, on ? 'on' : 'off', 'search', selectedCity === 'All' ? null : String(selectedCity));
      return on ? [...prev, id] : prev.filter((c) => c !== id);
    });
  };

  const isDefaultView =
    selectedCity === 'All' && searchQuery.trim() === '' && activeChips.length === 0;

  const claimDateMs = React.useCallback((p: Provider): number => {
    return p.claimed_at ? new Date(p.claimed_at).getTime() : 0;
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!initialCities || !initialCities.length) setCities(await getCitiesWithListings());
      if (!initialStats) {
        const { getListingStats } = await import('../../src/lib/data');
        setSiteStats(await getListingStats());
      }
      try {
        setUserLocation(await getUserLocation());
      } catch (err) {
        console.warn('Geolocation not available:', err);
      }
    };
    loadData();
  }, [initialCities, initialStats]);

  useEffect(() => {
    const fetchListings = async () => {
      // --- Default view: verified-only, sorted by claim date ---
      if (isDefaultView && !showAllClinics) {
        const verifiedOnly = fullPool
          .filter((p) => p.is_claimed)
          .slice()
          .sort((a, b) => (verifiedSortAsc ? claimDateMs(a) - claimDateMs(b) : claimDateMs(b) - claimDateMs(a)));
        setFilteredProviders(verifiedOnly);
        setGroups(null);
        setIsBroadened(false);
        return;
      }
      if (isDefaultView && showAllClinics) {
        const all = fullPool.slice().sort((a, b) => {
          if (a.is_claimed !== b.is_claimed) return a.is_claimed ? -1 : 1;
          if (a.is_claimed && b.is_claimed) return claimDateMs(b) - claimDateMs(a);
          return (b.rating ?? 0) - (a.rating ?? 0);
        });
        setFilteredProviders(all);
        setGroups(null);
        setIsBroadened(false);
        return;
      }

      setIsLoading(true);
      let results = await searchListings(searchQuery, selectedCity);

      // --- HARD narrowing (these genuinely narrow + are fair to fail closed) ---
      if (activeChips.includes('Mobile')) results = results.filter(isMobileFilter);
      // Flagship facet: only clinics where we verified who prescribes.
      if (activeChips.includes('PrescriberVerified')) results = results.filter(isPrescriberVerified);

      // --- Sort (claimed pinned, then chosen sort) ---
      const tiebreaker = (a: Provider, b: Provider): number => {
        if (sortBy === 'verified') {
          const va = isVerifiedClinic(a) ? 1 : 0;
          const vb = isVerifiedClinic(b) ? 1 : 0;
          if (va !== vb) return vb - va;
          return (b.rating ?? 0) - (a.rating ?? 0);
        }
        if (sortBy === 'rating') return (b.rating ?? 0) - (a.rating ?? 0);
        if (sortBy === 'reviews') return (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
        if (sortBy === 'distance' && userLocation) return (a.distance ?? 999) - (b.distance ?? 999);
        const ra = a.rating ?? 0, rb = b.rating ?? 0;
        if ((rb > 0) !== (ra > 0)) return rb > 0 ? 1 : -1;
        if (rb !== ra) return rb - ra;
        return (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
      };
      const pinSort = (arr: Provider[]) =>
        arr.slice().sort((a, b) => {
          if (a.is_claimed !== b.is_claimed) return a.is_claimed ? -1 : 1;
          if (a.is_claimed && b.is_claimed) return claimDateMs(b) - claimDateMs(a);
          return tiebreaker(a, b);
        });

      // --- SOFT boosts: partition into visible labelled groups, never hide ---
      const activeSoft = activeChips.filter(isSoftId) as SoftFilterId[];
      const grouped = groupBySoft(results, activeSoft);

      // Broaden only on a genuine empty (no results at all for the query/city +
      // hard filters), never because a soft chip produced empty groups.
      if (results.length === 0 && selectedCity !== 'All' && selectedCity !== '') {
        const broadened = await searchListings(searchQuery, 'All');
        const cityProv = fullPool.find((p) => (p.city || '').toLowerCase() === String(selectedCity).toLowerCase());
        const cityCountry = (cityProv as { country?: string } | undefined)?.country;
        const normC = (x?: string | null) =>
          !x ? '' : /^(us|usa|united states)$/i.test(x.trim()) ? 'us' : /^(ca|canada)$/i.test(x.trim()) ? 'ca' : x.toLowerCase().trim();
        const scoped = cityCountry ? broadened.filter((p) => normC((p as { country?: string }).country) === normC(cityCountry)) : broadened;
        const pool = scoped.length > 0 ? scoped : broadened;
        setFilteredProviders(pinSort(pool).slice(0, 24));
        setGroups(null);
        setIsBroadened(pool.length > 0);
      } else if (grouped.grouped) {
        setGroups({
          lists: pinSort(grouped.lists),
          notListed: pinSort(grouped.notListed),
          unknown: pinSort(grouped.unknown),
          grouped: true,
        });
        setFilteredProviders(pinSort(results));
        setIsBroadened(false);
      } else {
        setFilteredProviders(pinSort(results));
        setGroups(null);
        setIsBroadened(false);
      }
      setIsLoading(false);
    };

    fetchListings();
  }, [selectedCity, searchQuery, activeChips, sortBy, userLocation, fullPool, isDefaultView, showAllClinics, verifiedSortAsc, claimDateMs]);

  const totalShown = groups ? groups.lists.length + groups.notListed.length + groups.unknown.length : filteredProviders.length;

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />

      <section className="bg-white border-b border-slate-100 pt-12 pb-8 px-6 text-center md:text-left">
        <div className="max-w-7xl mx-auto">
          <BreadcrumbNav
            items={selectedCity !== 'All'
              ? [{ label: 'Cities', href: '/cities' }, { label: String(selectedCity) }]
              : [{ label: 'Explore Clinics' }]}
          />
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
              IV Therapy Clinics Near You
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto md:mx-0 font-medium leading-relaxed">
              Browse verified IV therapy clinics across Canada. Filter by city, service, or delivery preference, or take the quiz to get matched in 60 seconds.
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
                <span className="text-wellness-600 ml-2">({totalShown})</span>
              </h2>
              {isDefaultView && !showAllClinics && (
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                  <button
                    onClick={() => setVerifiedSortAsc((v) => !v)}
                    className="inline-flex items-center gap-1.5 font-bold text-slate-600 hover:text-slate-900"
                  >
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
                onChange={(e) => setSortBy(e.target.value as 'best' | 'rating' | 'reviews' | 'distance' | 'verified')}
                className="w-full sm:w-auto bg-white border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-wellness-600/20 transition-all cursor-pointer"
              >
                <option value="best">Best Match</option>
                <option value="verified">Verified First</option>
                <option value="rating">Highest Rated</option>
                <option value="distance">Nearest First</option>
                <option value="reviews">Most Reviewed</option>
              </select>

              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={cn(
                  'w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm border transition-all',
                  isFilterOpen ? 'bg-wellness-600 text-white border-wellness-600' : 'bg-white text-slate-600 border-slate-100 hover:border-wellness-200'
                )}
              >
                <Filter size={18} /> Filters
              </button>
            </div>
          </div>

          {/* Filter chips: facet + hard show a live qualifying count; soft chips
              regroup (never hide). */}
          <div className="flex flex-wrap gap-2 mb-4">
            {CHIPS.map((chip) => {
              const active = activeChips.includes(chip.id);
              const count = chipCount(chip.id);
              return (
                <button
                  key={chip.id}
                  onClick={() => toggleChip(chip.id)}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-xs font-bold border transition-all inline-flex items-center gap-1.5',
                    active ? 'bg-wellness-600 border-wellness-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-wellness-300',
                    chip.kind === 'facet' && !active && 'border-wellness-300 text-wellness-700'
                  )}
                >
                  {chip.kind === 'facet' && <ShieldCheck size={12} />}
                  {chip.label}
                  {count != null && (
                    <span className={cn('font-black', active ? 'text-white/80' : 'text-slate-400')}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>
          {activeChips.length > 0 && (
            <button
              onClick={() => setActiveChips([])}
              className="text-[11px] font-bold text-slate-400 hover:text-slate-600 mb-4"
            >
              Clear filters
            </button>
          )}

          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 text-left">
            Showing {totalShown} {activeChips.includes('Mobile') ? 'mobile IV ' : ''}clinics {selectedCity === 'All' ? 'across Canada' : `in ${selectedCity}`}
          </div>

          <AnimatePresence>
            {isFilterOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-t border-slate-50">
                  <div>
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
                          'w-full text-left px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-between',
                          selectedCity === 'All' ? 'bg-wellness-50 border-wellness-600 text-wellness-700' : 'bg-white border-slate-100 text-slate-600 hover:border-wellness-200'
                        )}
                      >
                        All Cities
                        {selectedCity === 'All' && <CheckCircle2 size={14} />}
                      </button>
                      {cities
                        .filter((c) => c.toLowerCase().includes(citySearchQuery.toLowerCase()))
                        .map((city) => (
                          <button
                            key={city}
                            onClick={() => setSelectedCity(city as City)}
                            className={cn(
                              'w-full text-left px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-between',
                              selectedCity === city ? 'bg-wellness-50 border-wellness-600 text-wellness-700' : 'bg-white border-slate-100 text-slate-600 hover:border-wellness-200'
                            )}
                          >
                            <span>{city}</span>
                            {selectedCity === city && <CheckCircle2 size={14} />}
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

      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="text-center py-32">
              <div className="w-12 h-12 border-4 border-wellness-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-500 font-bold">Searching clinics...</p>
            </div>
          ) : totalShown > 0 ? (
            <>
              {isBroadened && (
                <div className="mb-8 bg-amber-50 border-2 border-amber-200 rounded-3xl p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-amber-900 mb-1">
                      No matches for your filters in {selectedCity}, showing top-rated nearby.
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

              {groups ? (
                <div className="space-y-12">
                  <GroupSection label={SOFT_GROUP_LABELS.lists} tone="lists" providers={groups.lists} />
                  <GroupSection label={SOFT_GROUP_LABELS.notListed} tone="notListed" providers={groups.notListed} />
                  <GroupSection
                    label={SOFT_GROUP_LABELS.unknown}
                    tone="unknown"
                    providers={groups.unknown}
                    note="These clinics haven't told us their full menu yet. If you own one, claiming your listing fills this in."
                  />
                </div>
              ) : (
                <ExploreResults providers={filteredProviders} />
              )}
            </>
          ) : (
            <div className="text-center py-32 bg-white rounded-[3rem] border border-slate-100 shadow-xl">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-6">
                <Search size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">No clinics found</h3>
              <p className="text-slate-500 mb-8">Try adjusting your filters or searching for a different city.</p>
              <button
                onClick={() => { setSelectedCity('All'); setSearchQuery(''); setActiveChips([]); }}
                className="text-wellness-600 font-bold hover:text-wellness-700 transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="py-16 px-6 border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-black text-slate-900 mb-10 tracking-tight">Browse by City</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {[
              { name: 'Toronto', slug: 'toronto' },
              { name: 'Vancouver', slug: 'vancouver' },
              { name: 'Calgary', slug: 'calgary' },
              { name: 'Ottawa', slug: 'ottawa' },
              { name: 'Montreal', slug: 'montreal' },
              { name: 'Edmonton', slug: 'edmonton' },
              { name: 'Mississauga', slug: 'mississauga' },
              { name: 'Hamilton', slug: 'hamilton' },
              { name: 'Brampton', slug: 'brampton' },
              { name: 'Winnipeg', slug: 'winnipeg' },
              { name: 'Vaughan', slug: 'vaughan' },
              { name: 'Markham', slug: 'markham' },
              { name: 'Richmond Hill', slug: 'richmond-hill' },
              { name: 'Halifax', slug: 'halifax' },
            ].map((city) => (
              <button
                key={city.slug}
                onClick={() => router.push(`/cities/${city.slug}`)}
                className="p-6 bg-white border border-slate-100 rounded-2xl text-center hover:border-wellness-200 hover:shadow-md transition-all group"
              >
                <div className="text-sm font-bold text-slate-900 group-hover:text-wellness-600 transition-colors uppercase tracking-tight">{city.name}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">View City Info</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {siteStats && <TrustSignals stats={siteStats} />}

      <Footer />
    </div>
  );
}

// A labelled, always-visible result group for the soft-boost view. The unknown
// group is shown too (never buried) and doubles as a claim incentive.
function GroupSection({
  label,
  tone,
  providers,
  note,
}: {
  label: string;
  tone: 'lists' | 'notListed' | 'unknown';
  providers: Provider[];
  note?: string;
}) {
  if (providers.length === 0) return null;
  const toneStyle =
    tone === 'lists'
      ? 'bg-wellness-600 text-white'
      : tone === 'unknown'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-slate-100 text-slate-500';
  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full', toneStyle)}>
          {tone === 'lists' && <CheckCircle2 size={12} />}
          {tone === 'unknown' && <HelpCircle size={12} />}
          {label}
        </span>
        <span className="text-xs font-bold text-slate-400">{providers.length}</span>
      </div>
      {note && <p className="text-xs text-slate-500 font-medium mb-4 -mt-2 max-w-2xl">{note}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {providers.map((p) => (
          <ExploreCard key={p.id} provider={p} />
        ))}
      </div>
    </div>
  );
}
