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
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SurveyState, City } from '../../src/types';
import { cn } from '../../src/lib/utils';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';

const TOP_CITIES: City[] = [
  'New York', 'Los Angeles', 'Miami', 'Las Vegas', 'Austin', 
  'Chicago', 'Washington', 'Portland', 'San Francisco', 'San Diego',
  'Dallas' as City, 'Houston' as City, 'Phoenix' as City, 'Atlanta' as City, 'Denver' as City,
  'Seattle' as City, 'Boston' as City, 'Nashville' as City, 'Charlotte' as City, 'Orlando' as City
];

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
    id: 'city',
    question: "Where are you located?",
    description: "We'll find the best-rated providers in your immediate area.",
    type: 'city-select'
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
  }
];

function Building2({ size }: { size: number }) { return <Droplets size={size} />; }
function Home({ size }: { size: number }) { return <Droplets size={size} />; }
function Calendar({ size }: { size: number }) { return <Droplets size={size} />; }

export default function QuizPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<SurveyState>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleOptionSelect = (id: string, value: string) => {
    const newData = { ...data, [id]: value };
    setData(newData);
    
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete(newData);
    }
  };

  const handleComplete = (finalData: SurveyState) => {
    setIsAnalyzing(true);
    // Simulate analysis time
    setTimeout(() => {
      const query = new URLSearchParams();
      if (finalData.goal) query.set('goal', finalData.goal);
      if (finalData.city) query.set('city', finalData.city);
      if (finalData.locationPreference) query.set('type', finalData.locationPreference);
      if (finalData.urgency) query.set('urgency', finalData.urgency);
      
      router.push(`/quiz/results?${query.toString()}`);
    }, 2500);
  };

  const progress = ((step + 1) / STEPS.length) * 100;

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

            {currentStep.type === 'city-select' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                {TOP_CITIES.map((city) => (
                  <button
                    key={city}
                    onClick={() => handleOptionSelect('city', city)}
                    className={cn(
                      "flex items-center justify-between p-5 rounded-2xl border-2 text-left transition-all group",
                      data.city === city 
                        ? "border-wellness-600 bg-wellness-50 shadow-lg shadow-wellness-100" 
                        : "border-slate-100 bg-white hover:border-wellness-200 hover:shadow-md"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                        data.city === city ? "bg-wellness-600 text-white" : "bg-slate-50 text-slate-400 group-hover:bg-wellness-50 group-hover:text-wellness-600"
                      )}>
                        <MapPin size={20} />
                      </div>
                      <span className="font-bold text-slate-900">{city}</span>
                    </div>
                    {data.city === city && <CheckCircle2 size={20} className="text-wellness-600" />}
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentStep.options?.map((option) => (
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
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-10 border-t border-slate-100">
              <button 
                onClick={() => step > 0 && setStep(step - 1)}
                disabled={step === 0}
                className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-900 transition-colors disabled:opacity-0"
              >
                <ChevronLeft size={20} /> Back
              </button>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-300">
                <ShieldCheck size={14} /> HIPAA Compliant Matching
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
