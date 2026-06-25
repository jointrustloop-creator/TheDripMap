'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Zap,
  MapPin,
  ShieldCheck,
  Activity,
  Heart,
  Sparkles,
  Dumbbell,
  Sun,
  CheckCircle2,
  ChevronLeft,
  DollarSign,
  Navigation,
  Lock,
  Calendar,
  Building2,
  Home,
  X,
  Battery,
  Plane,
  Brain,
  Droplet,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SurveyState } from '../../src/types';
import { cn } from '../../src/lib/utils';
import { Logo } from '../../src/components/Logo';

import { getUserLocation, getIPLocation } from '../../src/lib/geo';
import { getAllCities, GTA_CITIES } from '../../src/lib/data';

// 5-step quiz, restructured around solving a problem instead of collecting filter values.
// Step 2 asks symptoms (plain language) instead of treatment names — visitors don't know
// what NAD+ is, they know they feel wiped out. Step 3 is a safety pre-screen that boosts
// clinics with MD/NP oversight when the visitor flags a condition.
const STEPS = [
  {
    id: 'city',
    question: 'Where are you located?',
    description: 'We\'ll find clinics nearest to you. Confirm or edit below — we try to auto-detect.',
    type: 'location',
  },
  {
    id: 'symptoms',
    question: 'Which best describes how you\'re feeling?',
    description: 'Pick the one that fits best — we\'ll recommend a treatment, then match clinics that offer it.',
    options: [
      { id: 'wiped-out', label: "I'm wiped out", icon: <Battery size={24} />, desc: 'Low energy, foggy, dragging' },
      { id: 'fighting-cold', label: "Fighting a cold", icon: <ShieldCheck size={24} />, desc: 'Run-down, post-illness' },
      { id: 'hungover', label: "I'm hungover", icon: <Heart size={24} />, desc: 'Need to feel human fast' },
      { id: 'event-prep', label: 'Big event coming up', icon: <Sparkles size={24} />, desc: 'Wedding, photoshoot, vacation' },
      { id: 'flying', label: 'Flying soon / just landed', icon: <Plane size={24} />, desc: 'Pre or post flight' },
      { id: 'workout-recovery', label: 'Hard workout recovery', icon: <Dumbbell size={24} />, desc: 'Sore, depleted, training' },
      { id: 'mental-sharp', label: 'Want to feel sharper', icon: <Brain size={24} />, desc: 'Focus, clarity, performance' },
      { id: 'skin-goals', label: 'Skin & glow goals', icon: <Sparkles size={24} />, desc: 'Long-term skin clarity' },
      { id: 'iron', label: 'Iron / anemia diagnosed', icon: <Droplet size={24} />, desc: 'Confirmed low iron or ferritin' },
      { id: 'just-curious', label: "Not sure — show options", icon: <HelpCircle size={24} />, desc: 'Browsing, help me understand' },
    ],
  },
  {
    id: 'medicalHistory',
    question: 'Before we match you — anything we should know?',
    description: 'This helps us prioritize clinics with proper medical oversight for your case. Pick one — your data stays private.',
    options: [
      { id: 'none', label: 'None of these apply', icon: <CheckCircle2 size={24} />, desc: 'Healthy, no medications' },
      { id: 'pregnant', label: 'Pregnant or breastfeeding', icon: <ShieldAlert size={24} />, desc: 'Show clinics with MD on-site' },
      { id: 'kidney', label: 'Kidney condition', icon: <ShieldAlert size={24} />, desc: 'Affects fluid volume tolerance' },
      { id: 'heart', label: 'Heart condition', icon: <ShieldAlert size={24} />, desc: 'Affects IV rate / volume' },
      { id: 'blood-thinners', label: 'On blood thinners', icon: <ShieldAlert size={24} />, desc: 'Some additives interact' },
      { id: 'diabetic', label: 'Diabetic', icon: <ShieldAlert size={24} />, desc: 'Some additives affect glucose' },
      { id: 'g6pd', label: 'G6PD deficiency', icon: <ShieldAlert size={24} />, desc: 'Affects high-dose vitamin C safety' },
    ],
  },
  {
    id: 'locationPreference',
    question: 'How would you like to receive treatment?',
    description: 'Visit a clinic, or have a licensed nurse come to you.',
    options: [
      { id: 'In-Clinic', label: 'Visit a Clinic', icon: <Building2 size={24} />, desc: 'Relax in a medical lounge' },
      { id: 'Mobile', label: 'Mobile IV', icon: <Home size={24} />, desc: 'Home, office, hotel' },
      { id: 'Both', label: 'No Preference', icon: <MapPin size={24} />, desc: 'Show me all options' },
    ],
  },
];

interface IconProps {
  size?: number;
  className?: string;
}

export default function QuizPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<SurveyState>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLocating, setIsLocating] = useState(true);
  const [showManualLocation, setShowManualLocation] = useState(false);
  const [allCities, setAllCities] = useState<{ city: string, state: string }[]>([]);
  const [citySearch, setCitySearch] = useState('');

  useEffect(() => {
    async function init() {
      // Load cities for autocomplete fallback
      const cities = await getAllCities();
      setAllCities(cities);

      // Check for cached location first
      const cached = sessionStorage.getItem('tdm_location');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setData(prev => ({
            ...prev,
            city: parsed.city,
            state: parsed.state,
            lat: parsed.lat || parsed.latitude,
            lng: parsed.lng || parsed.longitude,
            country: parsed.country
          }));
          setIsLocating(false);
          return;
        } catch {
          // Ignore parse errors
        }
      }

      try {
        // 1. Silent browser geolocation
        const pos = await getUserLocation();
        if (pos) {
          setData(prev => ({
            ...prev,
            lat: pos.lat,
            lng: pos.lng
          }));
          setIsLocating(false);
          return;
        }
        throw new Error('Geolocation failed');
      } catch {
        // 2. IP geolocation fallback
        try {
          const ipPos = await getIPLocation();
          if (ipPos) {
            setData(prev => ({
              ...prev,
              city: ipPos.city,
              state: ipPos.state,
              lat: ipPos.lat,
              lng: ipPos.lng
            }));
          }
          setIsLocating(false);
        } catch (e) {
          console.error("All location methods failed", e);
          setIsLocating(false);
          setShowManualLocation(true);
        }
      }
    }
    init();
  }, []);

  const handleOptionSelect = (id: string, value: string) => {
    // symptoms and medicalHistory are typed as string[] on SurveyState — wrap.
    // medicalHistory 'none' means the visitor explicitly opted out; store an
    // empty array so hasSafetyFlag() returns false.
    let newData: SurveyState;
    if (id === 'symptoms') {
      newData = { ...data, symptoms: [value] };
    } else if (id === 'medicalHistory') {
      newData = { ...data, medicalHistory: value === 'none' ? [] : [value] };
    } else {
      newData = { ...data, [id]: value };
    }
    setData(newData);

    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete(newData);
    }
  };

  const handleLocationDetect = async () => {
    setIsLocating(true);
    try {
      // Try precise location first
      const pos = await getUserLocation();
      if (pos) {
        setData(prev => ({
          ...prev,
          lat: pos.lat,
          lng: pos.lng
        }));
      }
      
      // Try to get city name from IP fallback
      try {
        const ipPos = await getIPLocation();
        if (ipPos) {
          setData(prev => ({
            ...prev,
            city: ipPos.city,
            state: ipPos.state,
            lat: prev.lat || ipPos.lat,
            lng: prev.lng || ipPos.lng
          }));
          if (ipPos.city) setCitySearch(ipPos.city);
        }
      } catch {
        // Ignore IP failure if we at least have lat/lng
      }
    } catch {
      // Fallback to IP location entirely
      try {
        const ipPos = await getIPLocation();
        if (ipPos) {
          setData(prev => ({
            ...prev,
            lat: ipPos.lat,
            lng: ipPos.lng,
            city: ipPos.city,
            state: ipPos.state
          }));
          if (ipPos.city) setCitySearch(ipPos.city);
        }
      } catch (innerErr) {
        console.error("Location detection failed", innerErr);
      }
    } finally {
      setIsLocating(false);
    }
  };

  const handleManualLocation = (city: string, state: string) => {
    const isCanada = 
      GTA_CITIES.map(c => c.toLowerCase()).includes(city.toLowerCase()) || 
      city.toLowerCase() === 'ontario' || 
      (state && (state.toLowerCase() === 'on' || state.toLowerCase() === 'ontario'));
      
    setData(prev => ({ 
      ...prev, 
      city, 
      state,
      country: isCanada ? 'Canada' : 'US'
    }));
    setShowManualLocation(false);
  };

  const skipLocation = () => {
    setShowManualLocation(false);
  };

  const handleComplete = (finalData: SurveyState) => {
    setIsAnalyzing(true);
    // Simulate analysis time
    setTimeout(() => {
      const query = new URLSearchParams();
      
      let finalCity = finalData.city;
      let finalState = finalData.state;
      let finalCountry = finalData.country;

      // Ensure city and state are separated if they were typed as "City, State"
      if (finalCity && finalCity.includes(',')) {
        const parts = finalCity.split(',').map(p => p.trim());
        finalCity = parts[0];
        if (parts.length > 1) {
          finalState = parts[1];
          
          // Detect country from the state part if it changed
          const usStatesByAbbr = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'];
          const usStatesByName = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'].map(s => s.toLowerCase());

          if (usStatesByAbbr.includes(finalState.toUpperCase()) || usStatesByName.includes(finalState.toLowerCase())) {
            finalCountry = 'US';
          } else if (finalState.toUpperCase() === 'ON' || finalState.toLowerCase() === 'ontario') {
            finalCountry = 'Canada';
          }
        }
      }

      // Carry the new symptom-based answers + optional safety flag through.
      // We keep `goal` in the URL too for backwards compat with any old links.
      if (finalData.symptoms?.[0]) query.set('symptom', finalData.symptoms[0]);
      if (finalData.medicalHistory?.[0]) query.set('safety', finalData.medicalHistory[0]);
      if (finalData.goal) query.set('goal', finalData.goal);
      if (finalCity) query.set('city', finalCity);
      if (finalState) query.set('state', finalState);
      if (finalData.lat) query.set('lat', finalData.lat.toString());
      if (finalData.lng) query.set('lng', finalData.lng.toString());
      if (finalCountry) query.set('country', finalCountry);
      if (finalData.locationPreference) query.set('type', finalData.locationPreference);
      if (finalData.budget) query.set('budget', finalData.budget);
      if (finalData.firstTime) query.set('firstTime', finalData.firstTime);
      if (finalData.hsaFsa) query.set('hsaFsa', finalData.hsaFsa);
      if (finalData.priceTransparency) query.set('priceTransparency', finalData.priceTransparency);

      router.push(`/quiz/results?${query.toString()}`);
    }, 2500);
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  if (isLocating) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center p-6 text-center bg-[#FDFDFB]">
        <div className="w-12 h-12 border-4 border-wellness-600 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h1 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Finding Your Location</h1>
        <p className="text-sm text-slate-500 font-medium">We&apos;re locating nearby clinics for you...</p>
      </div>
    );
  }

  if (showManualLocation) {
    const filteredCities = allCities.filter(c => 
      c.city.toLowerCase().includes(citySearch.toLowerCase()) || 
      c.state.toLowerCase().includes(citySearch.toLowerCase())
    ).slice(0, 5);

    return (
      <div className="h-[100dvh] flex flex-col bg-[#FDFDFB] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50 bg-white">
          <Link href="/"><Logo /></Link>
          <button onClick={() => router.push('/')} className="text-xs font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest flex items-center gap-1.5"><X size={14} /> Exit</button>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 overflow-y-auto">
          <div className="w-full max-w-xl mx-auto space-y-8">
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2 tracking-tight">
                Where are you located?
              </h2>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                We couldn&apos;t detect your location. Enter your city to find clinics near you.
              </p>
            </div>

            <div className="relative">
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="Search your city..."
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border-2 border-slate-100 focus:border-wellness-600 focus:outline-none font-bold text-slate-900 transition-all text-sm"
                  autoFocus
                />
              </div>

              {citySearch.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border-2 border-slate-100 shadow-xl z-50 overflow-hidden">
                  {filteredCities.length > 0 ? (
                    filteredCities.map((c, idx) => (
                      <button
                        key={`${c.city}-${c.state}-${idx}`}
                        onClick={() => handleManualLocation(c.city, c.state)}
                        className="w-full flex items-center gap-3 px-6 py-3.5 hover:bg-wellness-50 text-left transition-colors border-b border-slate-50 last:border-0"
                      >
                        <MapPin size={14} className="text-slate-400" />
                        <div className="text-sm">
                          <span className="font-bold text-slate-900">{c.city}</span>
                          <span className="text-slate-400 ml-2">{c.state}</span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-6 py-4 text-xs text-slate-400 italic">No cities found matching &quot;{citySearch}&quot;</div>
                  )}
                </div>
              )}

              <div className="mt-8">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 text-center">Top Cities</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {allCities.slice(0, 5).map((c, idx) => (
                    <button
                      key={`top-${c.city}-${idx}`}
                      onClick={() => handleManualLocation(c.city, c.state)}
                      className="px-3 py-2 rounded-lg border border-slate-100 hover:border-wellness-600 hover:bg-wellness-50 font-bold text-slate-600 hover:text-wellness-600 transition-all text-[11px]"
                    >
                      {c.city}
                    </button>
                  ))}
                  <button
                    onClick={skipLocation}
                    className="px-3 py-2 rounded-lg border-2 border-dashed border-slate-200 hover:border-wellness-600 hover:bg-wellness-50 font-bold text-slate-400 hover:text-wellness-600 transition-all text-[11px]"
                  >
                    Skip
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="h-[100dvh] bg-[#FDFDFB] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full">
          <div className="relative w-20 h-20 mx-auto mb-10">
            <div className="absolute inset-0 border-4 border-wellness-100 rounded-full" />
            <motion.div 
              className="absolute inset-0 border-4 border-wellness-600 rounded-full border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-wellness-600">
              <Zap size={24} className="animate-pulse" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Personalizing Recommendations</h2>
          <div className="space-y-3">
            <LoadingStep label="Scanning local providers..." delay={0} />
            <LoadingStep label="Matching with your goals..." delay={800} />
            <LoadingStep label="Verifying clinical protocols..." delay={1600} />
          </div>
        </div>
      </div>
    );
  }

  const currentStep = STEPS[step];

  return (
    <div className="h-[100dvh] flex flex-col bg-[#FDFDFB] overflow-hidden">
      {/* Minimal Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50 bg-white">
        <Link href="/">
          <Logo />
        </Link>
        <button 
          onClick={() => router.push('/')}
          className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest flex items-center gap-1.5"
        >
          <X size={14} /> Exit Quiz
        </button>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 overflow-y-auto">
        <div className="w-full max-w-4xl mx-auto">
          {/* Progress Bar - Compact */}
          <div className="mb-6 md:mb-8 max-w-2xl mx-auto">
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-wellness-600">Step {step + 1} of {STEPS.length}</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{Math.round(progress)}% Complete</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-wellness-600"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 md:space-y-8"
            >
              <div className="max-w-2xl mx-auto text-center">
                <h1 className="text-2xl md:text-4xl font-black text-slate-900 mb-2 md:mb-3 tracking-tight leading-tight">
                  {currentStep.question}
                </h1>
                <p className="text-sm md:text-base text-slate-500 leading-relaxed max-w-lg mx-auto">
                  {currentStep.description}
                </p>
              </div>

              <div className={cn(
                "grid gap-3 max-w-2xl mx-auto",
                currentStep.options && currentStep.options.length > 4 ? "grid-cols-2 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2"
              )}>
                {currentStep.options ? (
                  currentStep.options.map((option) => {
                    // Array-shaped fields (symptoms, medicalHistory) — check membership.
                    // Scalar fields — direct equality.
                    const stored = data[currentStep.id as keyof SurveyState];
                    const isSelected = Array.isArray(stored)
                      ? stored.includes(option.id)
                      : stored === option.id;
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleOptionSelect(currentStep.id, option.id)}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all group",
                          isSelected
                            ? "border-wellness-600 bg-wellness-50 shadow-md"
                            : "border-slate-100 bg-white hover:border-wellness-200 hover:bg-slate-50/50"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all",
                          isSelected
                            ? "bg-wellness-600 text-white"
                            : "bg-slate-50 text-slate-400 group-hover:text-wellness-600"
                        )}>
                          {React.cloneElement(option.icon as React.ReactElement<IconProps>, { size: 18 })}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-sm mb-0.5 leading-none">{option.label}</h4>
                          {option.desc && <p className="text-[10px] text-slate-500 truncate">{option.desc}</p>}
                        </div>
                      </button>
                    );
                  })
                ) : currentStep.type === 'location' ? (
                  <div className="col-span-1 md:col-span-2 space-y-4 max-w-md mx-auto w-full">
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text"
                        placeholder="City, State or Zip"
                        value={citySearch || data.city || ''}
                        onChange={(e) => {
                          setCitySearch(e.target.value);
                          setData(prev => ({ ...prev, city: e.target.value }));
                        }}
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl border-2 border-slate-100 focus:border-wellness-600 focus:outline-none font-bold text-slate-900 transition-all text-sm"
                        autoFocus
                      />
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={handleLocationDetect}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-50 border-2 border-slate-100 hover:border-wellness-600 hover:bg-wellness-50 text-slate-600 font-bold transition-all text-sm"
                      >
                        <Navigation size={14} />
                        Use my current location
                      </button>
                      <button
                        onClick={() => {
                          // Persist the typed city into data if user typed but didn't click an autocomplete
                          const finalData = { ...data, city: data.city || citySearch };
                          setData(finalData);
                          if (step < STEPS.length - 1) {
                            setStep(step + 1);
                          } else {
                            handleComplete(finalData);
                          }
                        }}
                        disabled={!data.city && !citySearch}
                        className="w-full bg-wellness-600 text-white px-8 py-3.5 rounded-xl font-black hover:bg-wellness-700 transition-all shadow-lg shadow-wellness-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-wider"
                      >
                        {step < STEPS.length - 1 ? 'Continue →' : 'Find Matches'}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-50 max-w-2xl mx-auto w-full">
                <button 
                  onClick={() => step > 0 && setStep(step - 1)}
                  disabled={step === 0}
                  className="flex items-center gap-2 text-xs text-slate-400 font-bold hover:text-slate-900 transition-colors disabled:opacity-0"
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-300">
                  <Lock size={12} /> Encrypted & Private
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function LoadingStep({ label, delay }: { label: string, delay: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className="flex items-center justify-center gap-3 h-6">
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-slate-500 font-medium"
          >
            <CheckCircle2 size={16} className="text-wellness-600" />
            <span>{label}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
