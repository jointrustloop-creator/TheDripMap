'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Zap, 
  MapPin, 
  Droplets, 
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
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SurveyState } from '../../src/types';
import { cn } from '../../src/lib/utils';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';

import { getUserLocation, getIPLocation } from '../../src/lib/geo';
import { getAllCities, GTA_CITIES } from '../../src/lib/data';

const STEPS = [
  {
    id: 'goal',
    question: "What's your primary wellness goal today?",
    description: "We'll match you with clinics specializing in your specific needs.",
    options: [
      { id: 'Energy Boost', label: 'Energy Boost', icon: <Zap size={24} />, desc: 'Fight fatigue and mental fog' },
      { id: 'Immunity', label: 'Immune Support', icon: <ShieldCheck size={24} />, desc: 'Bolster your natural defenses' },
      { id: 'Hangover', label: 'Hangover Relief', icon: <Heart size={24} />, desc: 'Rapid recovery and rehydration' },
      { id: 'Beauty', label: 'Beauty & Glow', icon: <Sparkles size={24} />, desc: 'Skin, hair, and nail health' },
      { id: 'Athletic', label: 'Athletic Recovery', icon: <Dumbbell size={24} />, desc: 'Muscle repair and hydration' },
      { id: 'NAD+', label: 'NAD+ Therapy', icon: <Activity size={24} />, desc: 'Longevity and cellular repair' },
    ]
  },
  {
    id: 'locationPreference',
    question: "How would you like to receive treatment?",
    description: "Choose between visiting a clinic or having a nurse come to you.",
    options: [
      { id: 'In-Clinic', label: 'Visit a Clinic', icon: <Building2 size={24} />, desc: 'Relax in a professional medical lounge' },
      { id: 'Mobile', label: 'Mobile IV', icon: <Home size={24} />, desc: 'Treatment at your home, office, or hotel' },
      { id: 'Both', label: 'No Preference', icon: <MapPin size={24} />, desc: 'Show me all available options' },
    ]
  },
  {
    id: 'urgency',
    question: "When do you need your treatment?",
    description: "Some providers offer rapid 60-minute dispatch for mobile services.",
    options: [
      { id: 'ASAP', label: 'As Soon As Possible', icon: <Zap size={24} />, desc: 'Emergency or rapid relief needed' },
      { id: 'Today', label: 'Later Today', icon: <Sun size={24} />, desc: 'Planning for a session today' },
      { id: 'This Week', label: 'Sometime This Week', icon: <Calendar size={24} />, desc: 'Regular wellness maintenance' },
    ]
  },
  {
    id: 'budget',
    question: "What's your budget for this session?",
    description: "We'll find clinics that match your price range.",
    options: [
      { id: 'Under $100', label: 'Under $100', icon: <DollarSign size={24} />, desc: 'Basic hydration and recovery' },
      { id: '$100 – $200', label: '$100 – $200', icon: <DollarSign size={24} />, desc: 'Standard IV drip packages' },
      { id: '$200 – $400', label: '$200 – $400', icon: <DollarSign size={24} />, desc: 'Premium formulas and add-ons' },
      { id: '$400+', label: '$400+', icon: <DollarSign size={24} />, desc: 'Concierge and NAD+ protocols' },
    ]
  },
  {
    id: 'city',
    question: "Where are you located?",
    description: "We'll find clinics near you",
    type: 'location'
  }
];

function Building2({ size }: { size: number }) { return <Droplets size={size} />; }
function Home({ size }: { size: number }) { return <Droplets size={size} />; }

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
            lat: parsed.latitude,
            lng: parsed.longitude,
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
        setData(prev => ({
          ...prev,
          lat: pos.latitude,
          lng: pos.longitude
        }));
        setIsLocating(false);
      } catch {
        // 2. IP geolocation fallback
        try {
          const ipPos = await getIPLocation();
          setData(prev => ({
            ...prev,
            city: ipPos.city,
            state: ipPos.region,
            lat: ipPos.latitude,
            lng: ipPos.longitude,
            country: ipPos.country
          }));
          setIsLocating(false);
        } catch {
          // 3. Both failed, show manual input
          setShowManualLocation(true);
          setIsLocating(false);
        }
      }
    }
    init();
  }, []);

  const handleOptionSelect = (id: string, value: string) => {
    const newData = { ...data, [id]: value };
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
      setData(prev => ({
        ...prev,
        lat: pos.latitude,
        lng: pos.longitude
      }));
      
      // Try to get city name from IP fallback
      try {
        const ipPos = await getIPLocation();
        setData(prev => ({
          ...prev,
          city: ipPos.city,
          state: ipPos.region
        }));
        if (ipPos.city) setCitySearch(ipPos.city);
      } catch {
        // Ignore IP failure if we at least have lat/lng
      }
    } catch {
      // Fallback to IP location entirely
      try {
        const ipPos = await getIPLocation();
        setData(prev => ({
          ...prev,
          lat: ipPos.latitude,
          lng: ipPos.longitude,
          city: ipPos.city,
          state: ipPos.region
        }));
        if (ipPos.city) setCitySearch(ipPos.city);
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
      if (finalData.goal) query.set('goal', finalData.goal);
      if (finalData.city) query.set('city', finalData.city);
      if (finalData.state) query.set('state', finalData.state);
      if (finalData.lat) query.set('lat', finalData.lat.toString());
      if (finalData.lng) query.set('lng', finalData.lng.toString());
      if (finalData.country) query.set('country', finalData.country);
      if (finalData.locationPreference) query.set('type', finalData.locationPreference);
      if (finalData.urgency) query.set('urgency', finalData.urgency);
      
      router.push(`/quiz/results?${query.toString()}`);
    }, 2500);
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  if (isLocating) {
    return (
      <div className="min-h-screen bg-[#FDFDFB] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 border-4 border-wellness-600 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Finding Your Location</h2>
        <p className="text-slate-500 font-medium">We&apos;re locating nearby clinics for you...</p>
      </div>
    );
  }

  if (showManualLocation) {
    const filteredCities = allCities.filter(c => 
      c.city.toLowerCase().includes(citySearch.toLowerCase()) || 
      c.state.toLowerCase().includes(citySearch.toLowerCase())
    ).slice(0, 8);

    return (
      <div className="min-h-screen bg-[#FDFDFB]">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="max-w-2xl mb-12">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
              Where are you located?
            </h2>
            <p className="text-lg text-slate-500">
              We couldn&apos;t detect your location automatically. Please enter your city to find clinics near you.
            </p>
          </div>

          <div className="relative max-w-xl">
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text"
                placeholder="Search your city..."
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 focus:border-wellness-600 focus:outline-none font-bold text-slate-900 transition-all"
                autoFocus
              />
            </div>

            {citySearch.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border-2 border-slate-100 shadow-xl z-50 overflow-hidden">
                {filteredCities.length > 0 ? (
                  filteredCities.map((c, idx) => (
                    <button
                      key={`${c.city}-${c.state}-${idx}`}
                      onClick={() => handleManualLocation(c.city, c.state)}
                      className="w-full flex items-center gap-3 px-6 py-4 hover:bg-wellness-50 text-left transition-colors border-b border-slate-50 last:border-0"
                    >
                      <MapPin size={16} className="text-slate-400" />
                      <div>
                        <span className="font-bold text-slate-900">{c.city}</span>
                        <span className="text-slate-400 ml-2">{c.state}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-6 py-4 text-slate-400 italic">No cities found matching &quot;{citySearch}&quot;</div>
                )}
              </div>
            )}

            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {allCities.slice(0, 5).map((c, idx) => (
                <button
                  key={`top-${c.city}-${idx}`}
                  onClick={() => handleManualLocation(c.city, c.state)}
                  className="px-4 py-3 rounded-xl border border-slate-100 hover:border-wellness-600 hover:bg-wellness-50 font-bold text-slate-600 hover:text-wellness-600 transition-all text-sm"
                >
                  {c.city}
                </button>
              ))}
              <button
                onClick={skipLocation}
                className="px-4 py-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-wellness-600 hover:bg-wellness-50 font-bold text-slate-400 hover:text-wellness-600 transition-all text-sm"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-[#FDFDFB] flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="relative w-24 h-24 mx-auto mb-12">
            <div className="absolute inset-0 border-4 border-wellness-100 rounded-full" />
            <motion.div 
              className="absolute inset-0 border-4 border-wellness-600 rounded-full border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-wellness-600">
              <Zap size={32} className="animate-pulse" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Analyzing Clinical Data</h2>
          <div className="space-y-4">
            <LoadingStep label="Scanning local providers..." delay={0} />
            <LoadingStep label="Matching with your wellness goals..." delay={800} />
            <LoadingStep label="Verifying clinical protocols..." delay={1600} />
          </div>
        </div>
      </div>
    );
  }

  const currentStep = STEPS[step];

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-between items-end mb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-wellness-600">Step {step + 1} of {STEPS.length}</span>
              <h3 className="text-sm font-bold text-slate-400">Clinical Matching Quiz</h3>
            </div>
            <span className="text-sm font-black text-slate-900">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
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
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-10"
          >
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight leading-tight">
                {currentStep.question}
              </h2>
              <p className="text-lg text-slate-500 leading-relaxed">
                {currentStep.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentStep.options ? (
                currentStep.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleOptionSelect(currentStep.id, option.id)}
                    className={cn(
                      "flex items-start gap-5 p-6 rounded-[2rem] border-2 text-left transition-all group",
                      data[currentStep.id as keyof SurveyState] === option.id 
                        ? "border-wellness-600 bg-wellness-50 shadow-lg shadow-wellness-100" 
                        : "border-slate-100 bg-white hover:border-wellness-200 hover:shadow-md"
                    )}
                  >
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all",
                      data[currentStep.id as keyof SurveyState] === option.id 
                        ? "bg-wellness-600 text-white scale-110" 
                        : "bg-slate-50 text-slate-400 group-hover:bg-wellness-50 group-hover:text-wellness-600"
                    )}>
                      {option.icon}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 mb-1">{option.label}</h4>
                      <p className="text-sm text-slate-500 leading-relaxed">{option.desc}</p>
                    </div>
                  </button>
                ))
              ) : currentStep.type === 'location' ? (
                <div className="col-span-1 md:col-span-2 space-y-6">
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                      type="text"
                      placeholder="City, State or Zip"
                      value={citySearch || data.city || ''}
                      onChange={(e) => {
                        setCitySearch(e.target.value);
                        setData(prev => ({ ...prev, city: e.target.value }));
                      }}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 focus:border-wellness-600 focus:outline-none font-bold text-slate-900 transition-all"
                      autoFocus
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                      onClick={handleLocationDetect}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 hover:border-wellness-600 hover:bg-wellness-50 text-slate-600 font-bold transition-all"
                    >
                      <Navigation size={18} />
                      Use my current location
                    </button>
                    <button 
                      onClick={() => handleComplete(data)}
                      disabled={!data.city && !citySearch}
                      className="flex-1 bg-wellness-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-wellness-700 transition-all shadow-lg shadow-wellness-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Find Matches
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-between pt-10 border-t border-slate-100">
              <button 
                onClick={() => step > 0 && setStep(step - 1)}
                disabled={step === 0}
                className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-900 transition-colors disabled:opacity-0"
              >
                <ChevronLeft size={20} /> Back
              </button>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-300">
                <Lock size={14} /> Your answers are private and never shared
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <Footer />
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
