'use client';
import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2,
  Building2,
  User,
  Mail,
  Stethoscope,
  Clock,
  Users,
  DollarSign,
  Sparkles,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from '../../../src/components/Navbar';
import { Footer } from '../../../src/components/Footer';
import { supabase, isSupabaseConfigured } from '../../../src/lib/supabase';

function SetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clinicId = searchParams.get('clinicId');
  const clinicName = searchParams.get('clinicName');
  const clinicCity = searchParams.get('clinicCity');

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    clinicName: clinicName || '',
    ownerName: '',
    email: '',
    primarySpecialty: '',
    additionalServices: [] as string[],
    environment: '',
    waitTime: '',
    administerType: '',
    typicalPatientAge: [] as string[],
    primaryReasons: [] as string[],
    priceRange: '',
    walkInsWelcome: false,
    mobileService: false,
    oneLiner: ''
  });

  const specialties = [
    'Hangover recovery',
    'Energy + NAD+',
    'Immune support',
    'Beauty + glow',
    'Athletic recovery',
    'Weight loss',
    'General wellness'
  ];

  const environments = [
    'Medical clinic',
    'Spa-like lounge',
    'Quick and clinical',
    'Mobile only',
    'Hybrid (clinic + mobile)'
  ];

  const waitTimes = [
    'Under 15 minutes',
    '15-30 minutes',
    'By appointment',
    'Same day available'
  ];

  const administerTypes = [
    'Registered Nurse (RN)',
    'Nurse Practitioner (NP)',
    'Medical Doctor (MD)',
    'Paramedic',
    'Multiple credential types'
  ];

  const ageRanges = ['18-25', '25-35', '35-50', '50+'];

  const reasons = [
    'Hangover recovery',
    'Wellness routine',
    'Athletic performance',
    'Chronic fatigue',
    'Beauty treatment',
    'Event preparation',
    'Immune boost'
  ];

  const priceRanges = ['$75-150', '$150-250', '$250-400', '$400+'];

  const handleNext = () => setStep(s => Math.min(s + 1, 5));
  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const toggleMultiSelect = (field: 'additionalServices' | 'typicalPatientAge' | 'primaryReasons', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(i => i !== value)
        : [...prev[field], value]
    }));
  };

  const handleSubmit = async () => {
    if (!isSupabaseConfigured()) {
      alert('Supabase is not configured. Please set your environment variables.');
      return;
    }
    setIsSubmitting(true);
    try {
      // 1. Test connection and verify table exists/accessible
      const { error: pingError } = await supabase.from('operator_profiles').select('id').limit(1);
      if (pingError && pingError.code !== 'PGRST116') { // PGRST116 is just "no rows", which is fine
        console.warn('Database connection warning:', pingError);
      }

      // 2. Get current user if any
      const { data: { user } } = await supabase.auth.getUser();

      // 3. Prepare payload - only include clinic_id if we have one to avoid NOT NULL issues
      const profilePayload: Record<string, unknown> = {
        owner_name: formData.ownerName,
        email: formData.email,
        profile_data: {
          ...formData,
          user_id: user?.id || null // Keep user context inside JSON as backup
        }
      };

      if (clinicId) {
        profilePayload.clinic_id = clinicId;
      }

      // Also try user_id at top level if not null
      if (user?.id) {
        profilePayload.user_id = user.id;
      }

      const { data, error } = await supabase
        .from('operator_profiles')
        .insert([profilePayload])
        .select();

      if (error) {
        console.error('Insert error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('Profile saved successfully:', data);
      
      // Save email to localStorage for dashboard lookup persistence without auth
      localStorage.setItem('operator_email', formData.email);

      // 4. Update the listings table if claiming
      if (clinicId) {
        await supabase
          .from('providers')
          .update({ 
            is_claimed: true, 
            claimed_at: new Date().toISOString() 
          })
          .eq('id', clinicId);
      }

      // Redirect to confirmation success page
      router.push('/for-clinics/success');
    } catch (err: unknown) {
      console.error('Final registration error:', err);
      const errorObj = err as { message?: string; code?: string };
      const errorMessage = errorObj.message || 'Unknown database error';
      const errorCode = errorObj.code || 'NO_CODE';
      
      alert(`Registration Error (${errorCode}): ${errorMessage}\n\nPlease contact support if this persists.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      
      <main className="max-w-3xl mx-auto px-6 py-20">
        {/* Clinic Claim Banner */}
        {clinicId && clinicName && (
          <div className="mb-8 bg-wellness-50 border border-wellness-200 p-4 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 bg-wellness-600 rounded-xl flex items-center justify-center text-white shrink-0">
              <Info size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-wellness-900">You are claiming: {clinicName}</p>
              <p className="text-xs text-wellness-700">in {clinicCity || 'your city'}</p>
            </div>
          </div>
        )}

        {/* Progress Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-wellness-600 uppercase tracking-widest">Step {step} of 5</span>
            <span className="text-sm font-bold text-slate-400">{Math.round((step / 5) * 100)}% Complete</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-wellness-600"
              initial={{ width: 0 }}
              animate={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div>
                <h1 className="text-4xl font-black text-slate-900 mb-4">Basic Information</h1>
                <p className="text-slate-500">Let&apos;s start with the essentials for your clinic profile.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Building2 size={16} /> Clinic Name
                  </label>
                  <input 
                    type="text"
                    value={formData.clinicName}
                    onChange={e => setFormData({...formData, clinicName: e.target.value})}
                    placeholder="e.g. Wellness Drip NYC"
                    readOnly={!!clinicId}
                    className={`w-full p-4 rounded-2xl border border-slate-200 focus:border-wellness-600 focus:ring-2 focus:ring-wellness-100 outline-none transition-all ${
                      clinicId ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <User size={16} /> Owner Name
                  </label>
                  <input 
                    type="text"
                    value={formData.ownerName}
                    onChange={e => setFormData({...formData, ownerName: e.target.value})}
                    placeholder="Full Name"
                    className="w-full p-4 rounded-2xl border border-slate-200 focus:border-wellness-600 focus:ring-2 focus:ring-wellness-100 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Mail size={16} /> Email Address
                  </label>
                  <input 
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder="owner@clinic.com"
                    className="w-full p-4 rounded-2xl border border-slate-200 focus:border-wellness-600 focus:ring-2 focus:ring-wellness-100 outline-none transition-all"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div>
                <h1 className="text-4xl font-black text-slate-900 mb-4">Specialization</h1>
                <p className="text-slate-500">What are your top services? This helps us match you with the right patients.</p>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Zap size={16} /> Primary Specialty
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {specialties.map(s => (
                      <button
                        key={s}
                        onClick={() => setFormData({...formData, primarySpecialty: s})}
                        className={`p-4 rounded-2xl border text-left font-bold transition-all ${
                          formData.primarySpecialty === s 
                            ? 'border-wellness-600 bg-wellness-50 text-wellness-700' 
                            : 'border-slate-100 hover:border-slate-200 text-slate-600'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold text-slate-700">Additional Services (Select all that apply)</label>
                  <div className="flex flex-wrap gap-2">
                    {specialties.map(s => (
                      <button
                        key={s}
                        onClick={() => toggleMultiSelect('additionalServices', s)}
                        className={`px-4 py-2 rounded-full border text-sm font-bold transition-all ${
                          formData.additionalServices.includes(s)
                            ? 'border-wellness-600 bg-wellness-600 text-white'
                            : 'border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div>
                <h1 className="text-4xl font-black text-slate-900 mb-4">Clinic Experience</h1>
                <p className="text-slate-500">Describe the environment and clinical standards of your facility.</p>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Sparkles size={16} /> Environment
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {environments.map(e => (
                      <button
                        key={e}
                        onClick={() => setFormData({...formData, environment: e})}
                        className={`p-4 rounded-2xl border text-left font-bold transition-all ${
                          formData.environment === e 
                            ? 'border-wellness-600 bg-wellness-50 text-wellness-700' 
                            : 'border-slate-100 hover:border-slate-200 text-slate-600'
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Clock size={16} /> Typical Wait Time
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {waitTimes.map(w => (
                      <button
                        key={w}
                        onClick={() => setFormData({...formData, waitTime: w})}
                        className={`p-4 rounded-2xl border text-left font-bold transition-all ${
                          formData.waitTime === w 
                            ? 'border-wellness-600 bg-wellness-50 text-wellness-700' 
                            : 'border-slate-100 hover:border-slate-200 text-slate-600'
                        }`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Stethoscope size={16} /> Who Administers Treatments?
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {administerTypes.map(a => (
                      <button
                        key={a}
                        onClick={() => setFormData({...formData, administerType: a})}
                        className={`p-4 rounded-2xl border text-left font-bold transition-all ${
                          formData.administerType === a 
                            ? 'border-wellness-600 bg-wellness-50 text-wellness-700' 
                            : 'border-slate-100 hover:border-slate-200 text-slate-600'
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div>
                <h1 className="text-4xl font-black text-slate-900 mb-4">Patient Fit</h1>
                <p className="text-slate-500">Help us understand who your ideal patients are.</p>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Users size={16} /> Typical Patient Age
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ageRanges.map(a => (
                      <button
                        key={a}
                        onClick={() => toggleMultiSelect('typicalPatientAge', a)}
                        className={`px-6 py-3 rounded-2xl border font-bold transition-all ${
                          formData.typicalPatientAge.includes(a)
                            ? 'border-wellness-600 bg-wellness-600 text-white'
                            : 'border-slate-100 text-slate-600 hover:border-slate-200'
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold text-slate-700">Primary Reasons Patients Visit</label>
                  <div className="flex flex-wrap gap-2">
                    {reasons.map(r => (
                      <button
                        key={r}
                        onClick={() => toggleMultiSelect('primaryReasons', r)}
                        className={`px-4 py-2 rounded-full border text-sm font-bold transition-all ${
                          formData.primaryReasons.includes(r)
                            ? 'border-wellness-600 bg-wellness-600 text-white'
                            : 'border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <DollarSign size={16} /> Price Range per Session
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {priceRanges.map(p => (
                      <button
                        key={p}
                        onClick={() => setFormData({...formData, priceRange: p})}
                        className={`p-4 rounded-2xl border text-center font-bold transition-all ${
                          formData.priceRange === p 
                            ? 'border-wellness-600 bg-wellness-50 text-wellness-700' 
                            : 'border-slate-100 hover:border-slate-200 text-slate-600'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="text-sm font-bold text-slate-700">Walk-ins Welcome?</label>
                    <div className="flex gap-2">
                      {[true, false].map(v => (
                        <button
                           key={v ? 'yes' : 'no'}
                          onClick={() => setFormData({...formData, walkInsWelcome: v})}
                          className={`flex-1 p-4 rounded-2xl border font-bold transition-all ${
                            formData.walkInsWelcome === v 
                              ? 'border-wellness-600 bg-wellness-50 text-wellness-700' 
                              : 'border-slate-100 hover:border-slate-200 text-slate-600'
                          }`}
                        >
                          {v ? 'Yes' : 'No'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-sm font-bold text-slate-700">Mobile Service?</label>
                    <div className="flex gap-2">
                      {[true, false].map(v => (
                        <button
                          key={v ? 'yes' : 'no'}
                          onClick={() => setFormData({...formData, mobileService: v})}
                          className={`flex-1 p-4 rounded-2xl border font-bold transition-all ${
                            formData.mobileService === v 
                              ? 'border-wellness-600 bg-wellness-50 text-wellness-700' 
                              : 'border-slate-100 hover:border-slate-200 text-slate-600'
                          }`}
                        >
                          {v ? 'Yes' : 'No'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div>
                <h1 className="text-4xl font-black text-slate-900 mb-4">One Liner</h1>
                <p className="text-slate-500">What makes your clinic different? This will be shown on your listing card.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Your Unique Value Proposition</label>
                  <textarea 
                    maxLength={100}
                    value={formData.oneLiner}
                    onChange={e => setFormData({...formData, oneLiner: e.target.value})}
                    placeholder="e.g. Concierge IV therapy with a focus on luxury and clinical excellence."
                    className="w-full p-4 h-32 rounded-2xl border border-slate-200 focus:border-wellness-600 focus:ring-2 focus:ring-wellness-100 outline-none transition-all resize-none"
                  />
                  <div className="text-right text-xs font-bold text-slate-400">
                    {formData.oneLiner.length} / 100 characters
                  </div>
                </div>

                <div className="bg-wellness-50 p-6 rounded-3xl border border-wellness-100">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-wellness-600 rounded-xl flex items-center justify-center text-white shrink-0">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-wellness-900 mb-1">Ready to launch?</h4>
                      <p className="text-sm text-wellness-700 leading-relaxed">
                        By submitting this profile, you agree to our clinical standards and verification process. Your profile will be live once verified.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="mt-12 flex items-center justify-between gap-4">
          {step > 1 ? (
            <button 
              onClick={handleBack}
              className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-700 transition-colors"
            >
              <ArrowLeft size={20} /> Back
            </button>
          ) : <div />}

          {step < 5 ? (
            <button 
              onClick={handleNext}
              disabled={step === 1 && (!formData.clinicName || !formData.ownerName || !formData.email)}
              className="bg-wellness-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-wellness-700 transition-all shadow-lg shadow-wellness-100 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next Step <ArrowRight size={20} />
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.oneLiner}
              className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving Profile...' : 'Complete Setup'} <CheckCircle2 size={20} />
            </button>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function OperatorSetupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FDFDFB] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-wellness-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SetupContent />
    </Suspense>
  );
}
