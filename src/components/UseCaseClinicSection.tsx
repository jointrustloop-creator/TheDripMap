'use client';
import React, { useState, useEffect } from 'react';
import { MapPin, Search, Navigation, Loader2 } from 'lucide-react';
import { ProviderCard } from './ProviderCard';
import { Provider } from '../types';
import { getListingsByServiceAndCity } from '../lib/data';
import { motion, AnimatePresence } from 'motion/react';

interface UseCaseClinicSectionProps {
  serviceTag: string;
  useCaseTitle: string;
  initialClinics: Provider[];
}

export const UseCaseClinicSection = ({ 
  serviceTag, 
  useCaseTitle, 
  initialClinics 
}: UseCaseClinicSectionProps) => {
  const [city, setCity] = useState('');
  const [clinics, setClinics] = useState<Provider[]>(initialClinics);
  const [isLoading, setIsLoading] = useState(false);
  const [detectedCity, setDetectedCity] = useState<string | null>(null);
  const [searchStatus, setSearchStatus] = useState<'initial' | 'searching' | 'results' | 'no-results'>('initial');

  useEffect(() => {
    const handleLocationChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      const newLoc = customEvent.detail;
      if (newLoc && newLoc.city) {
        setDetectedCity(newLoc.city);
        setCity(newLoc.city);
        handleSearch(newLoc.city);
      }
    };

    window.addEventListener('tdm_location_change', handleLocationChange);

    // Initial check
    const cached = sessionStorage.getItem('tdm_location');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.city) {
          setDetectedCity(parsed.city);
          setCity(parsed.city);
          handleSearch(parsed.city);
        }
      } catch (e) {
        console.error('Error parsing cached location', e);
      }
    }

    return () => window.removeEventListener('tdm_location_change', handleLocationChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async (searchCity: string) => {
    if (!searchCity.trim()) return;
    
    setIsLoading(true);
    setSearchStatus('searching');
    
    try {
      const results = await getListingsByServiceAndCity(serviceTag, searchCity, 4);
      if (results.length > 0) {
        setClinics(results);
        setSearchStatus('results');
      } else {
        // If no results in that city, maybe show general top clinics but inform user
        setClinics(initialClinics);
        setSearchStatus('no-results');
      }
    } catch (error) {
      console.error('Error searching clinics:', error);
      setClinics(initialClinics);
      setSearchStatus('initial');
    } finally {
      setIsLoading(false);
    }
  };

  const detectLocation = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      if (data.city) {
        setCity(data.city);
        setDetectedCity(data.city);
        handleSearch(data.city);
        
        // Cache it
        sessionStorage.setItem('tdm_location', JSON.stringify({
          city: data.city,
          state: data.region_code,
          detectedAt: Date.now()
        }));
      }
    } catch (error) {
      console.error('Error detecting location:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Top Clinics for {useCaseTitle}</h2>
            <p className="text-gray-600 mb-8">Find highly-rated providers offering {useCaseTitle.toLowerCase()} support near you.</p>
            
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Enter your city (e.g. Los Angeles)"
                  className="block w-full pl-11 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(city)}
                />
                <button 
                  onClick={() => handleSearch(city)}
                  disabled={isLoading}
                  className="absolute right-2 top-2 bottom-2 bg-blue-600 text-white px-4 rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span className="hidden sm:inline">Search</span>
                </button>
              </div>
              
              <button 
                onClick={detectLocation}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-4 bg-white border border-gray-200 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
              >
                <Navigation className="w-4 h-4 text-blue-600" />
                Detect My Location
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {searchStatus === 'no-results' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-amber-50 border border-amber-100 p-4 rounded-2xl mb-8 flex items-center gap-3 text-amber-800"
            >
              <Icons.AlertCircle className="w-5 h-5" />
              <p className="font-medium">No specific clinics found in {city || detectedCity}. Showing top national providers instead.</p>
            </motion.div>
          )}
          
          {searchStatus === 'results' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-blue-50 border border-blue-100 p-4 rounded-2xl mb-8 flex items-center gap-3 text-blue-800"
            >
              <Icons.CheckCircle2 className="w-5 h-5" />
              <p className="font-medium">Showing top clinics in {city || detectedCity}.</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {clinics.map((clinic) => (
            <ProviderCard key={clinic.id} provider={clinic} />
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <Link href="/search" className="inline-flex items-center gap-2 text-blue-600 font-bold hover:underline">
            View All Clinics <Icons.ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

// Mock Icons for the component since we can't easily import them dynamically here
const Icons = {
  AlertCircle: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
  ),
  CheckCircle2: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
  ),
  ArrowRight: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
  )
};

import Link from 'next/link';
