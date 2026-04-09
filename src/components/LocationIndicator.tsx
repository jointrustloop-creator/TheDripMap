'use client';
import React, { useState, useEffect } from 'react';
import { MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LocationInfo, City } from '../types';
import { cn } from '../lib/utils';
import { usePathname, useRouter } from 'next/navigation';

const TOP_CITIES: City[] = [
  'New York', 'Los Angeles', 'Miami', 'Las Vegas', 'Austin', 
  'Chicago', 'Toronto' as City, 'Washington' as City, 'Portland' as City, 'San Francisco' as City, 'San Diego' as City,
  'Dallas' as City, 'Houston' as City, 'Phoenix' as City, 'Atlanta' as City, 'Denver' as City,
  'Seattle' as City, 'Boston' as City, 'Nashville' as City, 'Charlotte' as City, 'Orlando' as City
];

export const LocationIndicator = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const initLocation = async () => {
      setIsDetecting(true);
      
      const cached = sessionStorage.getItem('tdm_location');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.detectedAt < 86400000) {
            setLocation(parsed);
            setIsDetecting(false);
            return;
          }
        } catch {
          // Ignore parse errors
        }
      }

      try {
        const res = await fetch('https://ipapi.co/json/');
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        if (data.city) {
          const detected = {
            city: data.city,
            state: data.region_code,
            country: data.country_name,
            latitude: data.latitude,
            longitude: data.longitude,
            isPrecise: false,
            detectedAt: Date.now()
          };
          setLocation(detected);
          sessionStorage.setItem('tdm_location', JSON.stringify(detected));
          window.dispatchEvent(new CustomEvent('tdm_location_change', { detail: detected }));
        }
      } catch {
        // Silently fail for IP detection to avoid console noise in restricted environments
      }

      setIsDetecting(false);
    };

    initLocation();
  }, []);

  if (isDetecting && !location) {
    return (
      <div className="flex items-center gap-2 text-slate-400 animate-pulse">
        <MapPin size={14} />
        <span className="text-xs font-bold uppercase tracking-widest">Detecting...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsEditing(!isEditing)}
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-full border border-slate-100 transition-all group"
      >
        <MapPin size={14} className={cn("text-slate-400 group-hover:text-wellness-600 transition-colors", location?.isPrecise && "text-wellness-600")} />
        <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900">
          {location ? `${location.city}, ${location.state}` : 'Select Location'}
        </span>
        {isEditing ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      <AnimatePresence>
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-[60]"
          >
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Change City</div>
            <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {TOP_CITIES.map(city => (
                <button 
                  key={city}
                  onClick={() => {
                    const cityStates: Record<string, { state: string, country: string }> = {
                      'Toronto': { state: 'ON', country: 'CA' },
                      'New York': { state: 'NY', country: 'US' },
                      'Los Angeles': { state: 'CA', country: 'US' },
                      'Miami': { state: 'FL', country: 'US' },
                      'Las Vegas': { state: 'NV', country: 'US' },
                      'Austin': { state: 'TX', country: 'US' },
                      'Chicago': { state: 'IL', country: 'US' },
                    };

                    const cityInfo = cityStates[city] || { state: '', country: 'US' };

                    const newLocation = {
                      city,
                      state: cityInfo.state, 
                      country: cityInfo.country,
                      isPrecise: false,
                      detectedAt: Date.now()
                    };
                    setLocation(newLocation);
                    sessionStorage.setItem('tdm_location', JSON.stringify(newLocation));
                    window.dispatchEvent(new CustomEvent('tdm_location_change', { detail: newLocation }));
                    
                    // If not on search page, redirect to search with this city
                    if (pathname !== '/search') {
                      router.push(`/search?city=${encodeURIComponent(city)}`);
                    }
                    
                    setIsEditing(false);
                  }}
                  className="text-left px-3 py-2 text-sm font-medium text-slate-600 hover:bg-wellness-50 hover:text-wellness-700 rounded-lg transition-colors"
                >
                  {city}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
