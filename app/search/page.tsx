'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Search, 
  Filter, 
  Zap,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Provider, City, TreatmentType } from '../../src/types';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';
import { ProviderCard } from '../../src/components/ProviderCard';
import { cn } from '../../src/lib/utils';
import { searchListings, getAllCities } from '../../src/lib/data';
import { getUserLocation, UserLocation } from '../../src/lib/geo';

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FDFDFB] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-wellness-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-bold">Loading directory...</p>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const initialCity = searchParams.get('city') || searchParams.get('location') || 'All';
  const initialQuery = searchParams.get('q') || searchParams.get('treatment') || '';
  
  const [selectedCity, setSelectedCity] = useState<City | 'All'>(initialCity as City || 'All');
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [citySearchQuery, setCitySearchQuery] = useState('');

  // Sync with URL parameters
  useEffect(() => {
    const city = searchParams.get('city') || searchParams.get('location') || 'All';
    const q = searchParams.get('q') || searchParams.get('treatment') || '';
    setSelectedCity(city as City || 'All');
    setSearchQuery(q);
  }, [searchParams]);
  const [typeFilter, setTypeFilter] = useState<TreatmentType | 'All'>('All');
  const [sortBy, setSortBy] = useState<'best' | 'rating' | 'reviews' | 'distance'>('best');
  const [activeChips, setActiveChips] = useState<string[]>(['All']);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([]);
  const [topCities, setTopCities] = useState<{city: string, state: string, count: number}[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const filterChips = [
    { id: 'All', label: 'All' },
    { id: 'Mobile', label: 'Mobile IV' },
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

  const isOpenNow = (hours?: Record<string, string>) => {
    if (!hours) return false;
    const now = new Date();
    // Use lowercase day for matching our normalized keys
    const day = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const timeRange = hours[day];
    if (!timeRange || timeRange.toLowerCase().includes('closed')) return false;
    try {
      // Handle "9AM-5PM" or "9:00 AM - 5:00 PM" formats
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
      
      // Handle overnight hours (e.g., 10PM-2AM)
      if (endTime < startTime) {
        endTime.setDate(endTime.getDate() + 1);
      }
      
      return now >= startTime && now <= endTime;
    } catch (e) { 
      console.warn('Error parsing hours:', timeRange, e);
      return false; 
    }
  };

  useEffect(() => {
    const loadData = async () => {
      const cities = await getAllCities();
      setTopCities(cities);
      
      try {
        const location = await getUserLocation();
        setUserLocation(location);
      } catch (err) {
        console.warn('Geolocation not available:', err);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const fetchListings = async () => {
      setIsLoading(true);
      let results = await searchListings(searchQuery, selectedCity, userLocation || undefined);
      
      // Apply Chips Filters
      if (!activeChips.includes('All')) {
        if (activeChips.includes('Mobile')) {
          results = results.filter(p => p.mobile_service || p.type === 'Mobile');
        }
        if (activeChips.includes('Walk-ins')) {
          results = results.filter(p => p.walk_ins_welcome);
        }
        if (activeChips.includes('Open')) {
          results = results.filter(p => isOpenNow(p.hours));
        }
        if (activeChips.includes('TopRated')) {
          results = results.filter(p => p.is_top_rated);
        }
      }

      // Apply Sorting
      const sorted = [...results];
      if (sortBy === 'rating') {
        sorted.sort((a, b) => b.rating - a.rating);
      } else if (sortBy === 'reviews') {
        sorted.sort((a, b) => b.reviewCount - a.reviewCount);
      } else if (sortBy === 'distance' && userLocation) {
        sorted.sort((a, b) => (a.distance || 999) - (b.distance || 999));
      } else {
        // Best Match: Featured first, then rating
        sorted.sort((a, b) => {
          if (a.is_featured && !b.is_featured) return -1;
          if (!a.is_featured && b.is_featured) return 1;
          return b.rating - a.rating;
        });
      }
      
      setFilteredProviders(sorted);
      setIsLoading(false);
    };

    fetchListings();
  }, [selectedCity, searchQuery, activeChips, sortBy, userLocation]);

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      
      {/* Search Header */}
      <section className="bg-white border-b border-slate-100 pt-12 pb-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              {selectedCity === 'All' ? 'All IV Therapy Clinics' : `IV Therapy in ${selectedCity}`}
              <span className="text-wellness-600 ml-2">({filteredProviders.length})</span>
            </h1>
            
            <div className="flex items-center gap-3">
              <div className="relative flex-1 md:w-80">
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
                onChange={(e) => setSortBy(e.target.value as 'best' | 'rating' | 'reviews' | 'distance')}
                className="bg-white border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-wellness-600/20 transition-all cursor-pointer"
              >
                <option value="best">Best Match</option>
                <option value="rating">Highest Rated</option>
                <option value="reviews">Most Reviewed</option>
                <option value="distance">Nearest First</option>
              </select>

              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm border transition-all",
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

          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
            Showing {filteredProviders.length} {activeChips.includes('Mobile') ? 'mobile IV ' : ''}clinics in {selectedCity}
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
                      
                      {topCities
                        .filter(c => c.city.toLowerCase().includes(citySearchQuery.toLowerCase()))
                        .map(c => (
                        <button 
                          key={`${c.city}-${c.state}`}
                          onClick={() => setSelectedCity(c.city as City)}
                          className={cn(
                            "w-full text-left px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-between",
                            selectedCity === c.city ? "bg-wellness-50 border-wellness-600 text-wellness-700" : "bg-white border-slate-100 text-slate-600 hover:border-wellness-200"
                          )}
                        >
                          <span>{c.city} <span className="text-[10px] opacity-50 ml-1">{c.state}</span></span>
                          {selectedCity === c.city && <CheckCircle2 size={14} />}
                        </button>
                      ))}
                      
                      {topCities.filter(c => c.city.toLowerCase().includes(citySearchQuery.toLowerCase())).length === 0 && (
                        <div className="text-center py-8 text-slate-400 text-xs font-medium">
                          No cities found
                        </div>
                      )}
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
                    <h4 className="text-lg font-black text-wellness-900 mb-2">Need help choosing?</h4>
                    <p className="text-sm text-wellness-700 mb-6 leading-relaxed">Our clinical matching quiz can find the perfect provider for you in 60 seconds.</p>
                    <button 
                      onClick={() => router.push('/quiz')}
                      className="bg-wellness-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-wellness-700 transition-all shadow-lg shadow-wellness-100 flex items-center justify-center gap-2"
                    >
                      <Zap size={16} /> Start Quiz
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProviders.map((provider) => (
                <ProviderCard key={provider.id} provider={provider} />
              ))}
            </div>
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

      <Footer />
    </div>
  );
}
