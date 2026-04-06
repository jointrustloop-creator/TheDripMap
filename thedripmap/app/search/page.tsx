'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Search, 
  Filter, 
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Provider, City, TreatmentType } from '../../src/types';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';
import { ProviderCard } from '../../src/components/ProviderCard';
import { cn } from '../../src/lib/utils';
import { searchListings, getAllCities } from '../../src/lib/data';

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
  
  const [selectedCity, setSelectedCity] = useState<City | 'All'>((searchParams.get('city') as City) || 'All');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [typeFilter, setTypeFilter] = useState<TreatmentType | 'All'>('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([]);
  const [topCities, setTopCities] = useState<{city: string, state: string, count: number}[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const cities = await getAllCities();
      setTopCities(cities.slice(0, 12));
    };
    loadData();
  }, []);

  useEffect(() => {
    const fetchListings = async () => {
      setIsLoading(true);
      const results = await searchListings(searchQuery, selectedCity, typeFilter);
      setFilteredProviders(results);
      setIsLoading(false);
    };

    fetchListings();
  }, [selectedCity, searchQuery, typeFilter]);

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

          <AnimatePresence>
            {isFilterOpen && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8 border-t border-slate-50">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Select City</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => setSelectedCity('All')}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-bold border transition-all",
                          selectedCity === 'All' ? "bg-wellness-50 border-wellness-600 text-wellness-700" : "bg-white border-slate-100 text-slate-600 hover:border-wellness-200"
                        )}
                      >
                        All Cities
                      </button>
                      {topCities.map(c => (
                        <button 
                          key={c.city}
                          onClick={() => setSelectedCity(c.city as City)}
                          className={cn(
                            "px-4 py-2 rounded-xl text-xs font-bold border transition-all",
                            selectedCity === c.city ? "bg-wellness-50 border-wellness-600 text-wellness-700" : "bg-white border-slate-100 text-slate-600 hover:border-wellness-200"
                          )}
                        >
                          {c.city}
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
