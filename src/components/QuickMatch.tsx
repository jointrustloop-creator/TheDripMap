'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MapPin, 
  Zap, 
  ChevronDown, 
  Target,
  Sparkles,
  Heart,
  ShieldCheck,
  Activity,
  Droplets,
  Dumbbell,
  Navigation,
  Plane,
  FlaskConical
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { GTA_CITIES } from '../lib/data';

const GOALS = [
  { id: 'hangover', label: 'Hangover Recovery', icon: <Heart size={18} /> },
  { id: 'nad-plus', label: 'Energy & NAD+', icon: <Zap size={18} /> },
  { id: 'immune-support', label: 'Immune Support', icon: <ShieldCheck size={18} /> },
  { id: 'beauty-glow', label: 'Beauty & Glow', icon: <Sparkles size={18} /> },
  { id: 'weight-loss', label: 'Weight Loss', icon: <Activity size={18} /> },
  { id: 'hydration', label: 'Rapid Hydration', icon: <Droplets size={18} /> },
  { id: 'recovery', label: 'Athletic Recovery', icon: <Dumbbell size={18} /> },
  { id: 'myers-cocktail', label: 'Myers Cocktail', icon: <Target size={18} /> },
  { id: 'jet-lag', label: 'Jet Lag & Travel', icon: <Plane size={18} /> },
  { id: 'peptide-therapy', label: 'Peptide Therapy', icon: <FlaskConical size={18} /> },
];

// Popular metros with the strongest directory inventory — shown in the
// location picker so users can choose from a visible list rather than
// having to know exactly what to type. Free typing still works.
const POPULAR_LOCATIONS = [
  'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX',
  'Miami, FL', 'San Diego, CA', 'Atlanta, GA', 'Dallas, TX',
  'Phoenix, AZ', 'Boston, MA', 'Philadelphia, PA', 'Las Vegas, NV',
  'San Francisco, CA', 'Washington, DC', 'Seattle, WA', 'Denver, CO',
  'Tampa, FL', 'Toronto, ON', 'Vancouver, BC', 'Calgary, AB',
  'Montreal, QC', 'Ottawa, ON', 'Edmonton, AB',
];

export function QuickMatch() {
  const router = useRouter();
  const [goal, setGoal] = useState<{ id: string, label: string } | null>(null);
  const [location, setLocation] = useState('');
  const [isGoalOpen, setIsGoalOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  // Precise GPS coords + the location string they correspond to, so we only pass
  // coordinates to the matcher when the chosen location is the detected one.
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [coordsFor, setCoordsFor] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsGoalOpen(false);
      }
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setIsLocationOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);

    // Listen for location changes from LocationIndicator
    const handleLocationChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { city, state } = customEvent.detail;
      if (city && state) {
        setLocation(`${city}, ${state}`);
      } else if (city) {
        setLocation(city);
      }
    };

    window.addEventListener('tdm_location_change', handleLocationChange);
    
    // Check if location is already in session storage
    const cached = sessionStorage.getItem('tdm_location');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.city) {
          setLocation(parsed.state ? `${parsed.city}, ${parsed.state}` : parsed.city);
        }
      } catch {
        // Ignore errors
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('tdm_location_change', handleLocationChange);
    };
  }, []);

  const handleDetectLocation = () => {
    setIsDetecting(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
            );
            const data = await response.json();
            const city = data.address.city || data.address.town || data.address.village || data.address.suburb;
            const state = data.address.state;
            if (city) {
              const loc = state ? `${city}, ${state}` : city;
              setLocation(loc);
              setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
              setCoordsFor(loc);
            }
          } catch (error) {
            console.error("Error detecting location:", error);
          } finally {
            setIsDetecting(false);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          setIsDetecting(false);
        }
      );
    } else {
      setIsDetecting(false);
    }
  };

  const handleMatch = () => {
    const params = new URLSearchParams();
    if (goal) params.set('goal', goal.id);
    
    if (location) {
      const [cityName, stateName] = location.split(',').map(s => s.trim());
      params.set('city', cityName);
      if (stateName) params.set('state', stateName);
      // Pass precise coordinates only when they belong to the selected location,
      // so results can be ranked by true distance (closest clinics first).
      if (coords && coordsFor && location.trim() === coordsFor) {
        params.set('lat', String(coords.lat));
        params.set('lng', String(coords.lng));
      }
      
      // Update global location state so the entire app stays in sync
      const gtaLower = GTA_CITIES.map(c => c.toLowerCase());
      const isCanada = gtaLower.includes(cityName.toLowerCase()) || 
                       cityName.toLowerCase() === 'gta' || 
                       cityName.toLowerCase() === 'ontario' ||
                       (stateName && (stateName.toLowerCase() === 'on' || stateName.toLowerCase() === 'ontario'));
                       
      const newLoc = {
        city: cityName,
        state: stateName || '',
        country: isCanada ? 'Canada' : 'US',
        isPrecise: false,
        detectedAt: Date.now()
      };
      sessionStorage.setItem('tdm_location', JSON.stringify(newLoc));
      window.dispatchEvent(new CustomEvent('tdm_location_change', { detail: newLoc }));
    }
    
    // Default quiz params for shortcut
    params.set('urgency', 'Today');
    params.set('type', 'Any');
    params.set('budget', 'Any');
    
    // Navigate to results page directly
    router.push(`/quiz/results?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white p-2 md:p-3 rounded-[2rem] md:rounded-full shadow-[0_30px_60px_-20px_rgba(15,23,42,0.22),0_10px_24px_-12px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/80 flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-0">
        
        {/* Goal Selector */}
        <div className="relative flex-1" ref={dropdownRef}>
          <button 
            onClick={() => setIsGoalOpen(!isGoalOpen)}
            className="w-full h-full flex items-center gap-4 px-6 py-4 md:py-3 text-left hover:bg-slate-50 rounded-2xl md:rounded-l-full transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-wellness-50 flex items-center justify-center text-wellness-600 group-hover:scale-110 transition-transform">
              {goal ? GOALS.find(g => g.id === goal.id)?.icon : <Target size={20} />}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">I need help with</div>
              <div className={cn(
                "font-bold truncate",
                goal ? "text-slate-900" : "text-slate-400"
              )}>
                {goal ? goal.label : "Select your goal..."}
              </div>
            </div>
            <ChevronDown size={18} className={cn("text-slate-300 transition-transform", isGoalOpen && "rotate-180")} />
          </button>

          <AnimatePresence>
            {isGoalOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-full left-0 right-0 mt-4 bg-white rounded-3xl shadow-2xl border border-slate-100 p-3 z-50 grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-[70vh] overflow-y-auto"
              >
                {GOALS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => {
                      setGoal(g);
                      setIsGoalOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-2xl text-left transition-all",
                      goal?.id === g.id 
                        ? "bg-wellness-600 text-white shadow-lg shadow-wellness-100" 
                        : "hover:bg-slate-50 text-slate-600"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      goal?.id === g.id ? "bg-white/20" : "bg-slate-100"
                    )}>
                      {g.icon}
                    </div>
                    <span className="font-bold text-sm">{g.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px h-12 bg-slate-100 mx-2" />

        {/* Location combobox — type freely OR choose from the visible list */}
        <div className="relative flex-1" ref={locationRef}>
          <div className="flex items-center gap-4 px-6 py-4 md:py-3 hover:bg-slate-50 rounded-2xl md:rounded-none transition-colors group">
            <div className="w-10 h-10 rounded-xl bg-[#0F6E56]/10 flex items-center justify-center text-[#0F6E56] group-hover:scale-110 transition-transform shrink-0">
              <MapPin size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">My location is</div>
              <input
                type="text"
                value={location}
                onChange={(e) => { setLocation(e.target.value); setIsLocationOpen(true); }}
                onFocus={() => setIsLocationOpen(true)}
                onKeyDown={(e) => { if (e.key === 'Enter') { setIsLocationOpen(false); handleMatch(); } }}
                placeholder="Choose your city"
                className="w-full bg-transparent font-bold text-slate-900 placeholder:text-slate-400 outline-none"
              />
            </div>
            <ChevronDown
              size={18}
              className={cn('text-slate-300 transition-transform shrink-0 hidden md:block', isLocationOpen && 'rotate-180')}
            />
            <button
              onClick={handleDetectLocation}
              disabled={isDetecting}
              className={cn(
                'p-2 rounded-xl hover:bg-white transition-all text-slate-400 hover:text-[#0F6E56] shrink-0',
                isDetecting && 'animate-pulse text-[#0F6E56]'
              )}
              title="Detect my location"
            >
              <Navigation size={18} />
            </button>
          </div>

          <AnimatePresence>
            {isLocationOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.97 }}
                className="absolute top-full left-0 right-0 mt-4 bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 z-50 max-h-72 overflow-y-auto"
              >
                <button
                  onClick={() => { handleDetectLocation(); setIsLocationOpen(false); }}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl text-left hover:bg-[#0F6E56]/5 text-[#0F6E56] transition-colors mb-1"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#0F6E56]/10 flex items-center justify-center shrink-0">
                    <Navigation size={15} />
                  </div>
                  <span className="font-bold text-sm">Use my current location</span>
                </button>
                <div className="h-px bg-slate-100 mx-3 my-1" />
                {POPULAR_LOCATIONS
                  .filter((c) => !location.trim() || c.toLowerCase().includes(location.trim().toLowerCase()))
                  .map((city) => (
                    <button
                      key={city}
                      onClick={() => { setLocation(city); setIsLocationOpen(false); }}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-colors',
                        location === city ? 'bg-[#0F6E56] text-white' : 'hover:bg-slate-50 text-slate-700'
                      )}
                    >
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                        location === city ? 'bg-white/20' : 'bg-slate-100 text-slate-400'
                      )}>
                        <MapPin size={15} />
                      </div>
                      <span className="font-bold text-sm">{city}</span>
                    </button>
                  ))}
                {POPULAR_LOCATIONS.filter((c) => !location.trim() || c.toLowerCase().includes(location.trim().toLowerCase())).length === 0 && (
                  <div className="px-4 py-3 text-sm text-slate-400 font-medium">
                    Press Enter to search &ldquo;{location}&rdquo;
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Button — brand emerald for maximum visibility */}
        <button
          onClick={handleMatch}
          className="md:ml-2 bg-[#0F6E56] text-white px-8 py-5 md:py-4 rounded-2xl md:rounded-full font-black text-lg hover:bg-[#0A5742] transition-all shadow-[0_12px_28px_-8px_rgba(15,110,86,0.55)] flex items-center justify-center gap-3 group active:scale-95 shrink-0"
        >
          <span>Find My Match</span>
          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}

function ArrowRight({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
