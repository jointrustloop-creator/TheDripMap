'use client';
import React, { useState, useEffect } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LocationInfo } from '../types';
import { cn } from '../lib/utils';
import { usePathname, useRouter } from 'next/navigation';
import { getAllCities } from '../lib/data';

export const LocationIndicator = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCities, setActiveCities] = useState<{ city: string, state: string, count: number }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Listen for global location changes to keep multiple instances in sync
  useEffect(() => {
    const handleLocationChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      const newLoc = customEvent.detail;
      if (newLoc && newLoc.city) {
        setLocation(newLoc);
      }
    };

    window.addEventListener('tdm_location_change', handleLocationChange);
    return () => window.removeEventListener('tdm_location_change', handleLocationChange);
  }, []);

  const detectBrowserLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsDetecting(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Reverse geocode using a free service or just store coords
          // For now, we'll try to get the city name from an API using coords
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
          const data = await res.json();
          
          const detected = {
            city: data.city || data.locality || 'Unknown City',
            state: data.principalSubdivisionCode?.split('-')[1] || data.principalSubdivision || '',
            country: data.countryName,
            latitude,
            longitude,
            isPrecise: true,
            detectedAt: Date.now()
          };
          
          setLocation(detected);
          sessionStorage.setItem('tdm_location', JSON.stringify(detected));
          window.dispatchEvent(new CustomEvent('tdm_location_change', { detail: detected }));
          setIsEditing(false);
        } catch (err) {
          console.error('Reverse geocoding failed:', err);
          setError('Could not determine city name from your coordinates');
        } finally {
          setIsDetecting(false);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        let msg = 'Location access denied';
        if (err.code === 2) msg = 'Location unavailable';
        if (err.code === 3) msg = 'Location request timed out';
        setError(msg);
        setIsDetecting(false);
      },
      { timeout: 10000 }
    );
  };

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
      } catch (err) {
        console.warn('IP-based location detection failed. This is often due to ad-blockers or browser privacy settings.', err);
      }

      setIsDetecting(false);
    };

    initLocation();
  }, []);

  useEffect(() => {
    const fetchActiveCities = async () => {
      try {
        const cities = await getAllCities();
        setActiveCities(cities.slice(0, 30)); // Show top 30 cities
      } catch (err) {
        console.error('Failed to fetch active cities:', err);
      }
    };
    fetchActiveCities();
  }, []);

  const filteredCities = activeCities.filter(city => 
    city.city.toLowerCase().includes(searchTerm.toLowerCase()) || 
    city.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCitySelect = (city: string, state: string) => {
    const newLocation = {
      city,
      state, 
      country: 'US',
      isPrecise: false,
      detectedAt: Date.now()
    };
    setLocation(newLocation);
    sessionStorage.setItem('tdm_location', JSON.stringify(newLocation));
    window.dispatchEvent(new CustomEvent('tdm_location_change', { detail: newLocation }));
    
    // If not on search page and not on a directory page, redirect to search
    const isDirectoryPage = pathname === '/search' || 
                          pathname.startsWith('/iv-therapy') || 
                          pathname.startsWith('/iv-therapy-for') ||
                          pathname.startsWith('/provider/');
    
    if (!isDirectoryPage) {
      router.push(`/search?city=${encodeURIComponent(city)}`);
    }
    
    setIsEditing(false);
    setSearchTerm('');
  };

  if (isDetecting && !location) {
    return (
      <div className="flex items-center gap-2 text-slate-400 animate-pulse">
        <MapPin size={14} />
        <span className="text-xs font-bold uppercase tracking-widest">Detecting...</span>
      </div>
    );
  }

  return (
    <div className="relative group/loc">
      <div className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-full px-3 py-1.5 transition-all focus-within:ring-2 focus-within:ring-wellness-600/20 focus-within:border-wellness-600 focus-within:bg-white">
        <MapPin size={14} className={cn("text-slate-400", location?.isPrecise && "text-wellness-600")} />
        <input 
          type="text"
          placeholder="Enter city, state..."
          className="bg-transparent border-none outline-none text-xs font-bold text-slate-900 w-24 md:w-32 focus:w-40 md:focus:w-48 transition-all placeholder:text-slate-400"
          value={isEditing ? searchTerm : (location ? `${location.city}, ${location.state}` : '')}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isEditing) setIsEditing(true);
          }}
          onFocus={() => setIsEditing(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && searchTerm) {
              const parts = searchTerm.split(',').map(s => s.trim());
              handleCitySelect(parts[0], parts[1] || '');
            }
            if (e.key === 'Escape') setIsEditing(false);
          }}
        />
        <button 
          onClick={(e) => {
            e.stopPropagation();
            detectBrowserLocation();
          }}
          disabled={isDetecting}
          title="Use current location"
          className="p-1 text-slate-400 hover:text-wellness-600 transition-colors disabled:opacity-50"
        >
          <Navigation size={14} className={isDetecting ? "animate-spin" : ""} />
        </button>
      </div>

      <AnimatePresence>
        {isEditing && (
          <>
            <div 
              className="fixed inset-0 z-[55]" 
              onClick={() => setIsEditing(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-[60]"
            >
              {error && (
                <div className="text-[10px] text-red-500 font-bold mb-3 px-1">
                  {error}
                </div>
              )}

              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                {searchTerm ? 'Search Results' : 'Popular Cities'}
              </div>
              <div className="grid grid-cols-1 gap-1 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {filteredCities.length > 0 ? (
                  filteredCities.map(city => (
                    <button 
                      key={`${city.city}-${city.state}`}
                      onClick={() => handleCitySelect(city.city, city.state)}
                      className="text-left px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-wellness-50 hover:text-wellness-700 rounded-lg transition-colors flex items-center justify-between group/item"
                    >
                      <span>{city.city}, {city.state}</span>
                      <span className="text-[10px] text-slate-400 group-hover/item:text-wellness-600">{city.count}</span>
                    </button>
                  ))
                ) : searchTerm ? (
                  <button 
                    onClick={() => {
                      const parts = searchTerm.split(',').map(s => s.trim());
                      handleCitySelect(parts[0], parts[1] || '');
                    }}
                    className="text-left px-3 py-3 text-xs font-bold text-wellness-600 bg-wellness-50 rounded-lg hover:bg-wellness-100 transition-colors flex items-center gap-2"
                  >
                    <MapPin size={12} />
                    Use &quot;{searchTerm}&quot;
                  </button>
                ) : (
                  <div className="text-[10px] text-slate-400 italic px-3 py-2">No cities found</div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
