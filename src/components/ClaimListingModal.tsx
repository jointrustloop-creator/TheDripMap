'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, ArrowRight, Mail, Loader2 } from 'lucide-react';
import { Logo } from './Logo';
import { Provider } from '../types';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

interface ClaimListingModalProps {
  provider: Provider;
  isOpen: boolean;
  onClose: () => void;
  email: string;
  setEmail: (email: string) => void;
  confirmed: boolean;
  setConfirmed: (confirmed: boolean) => void;
  isSubmitting: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;
  isSuccess: boolean;
  setIsSuccess: (isSuccess: boolean) => void;
}

export const ClaimListingModal = ({ 
  provider, 
  isOpen, 
  onClose,
  email,
  setEmail,
  confirmed,
  setConfirmed,
  isSubmitting,
  setIsSubmitting,
  isSuccess,
  setIsSuccess
}: ClaimListingModalProps) => {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !confirmed) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const token = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      let dbSuccess = false;
      try {
        const { error: submitError } = await supabase
          .from('claim_requests')
          .insert({
            listing_id: provider.id,
            email: email,
            token: token,
            expires_at: expiresAt.toISOString(),
            created_at: new Date().toISOString()
          });
        
        if (!submitError) {
          dbSuccess = true;
        } else {
          console.warn('Supabase insertion error:', submitError);
        }
      } catch (dbErr) {
        console.warn('Supabase connection error:', dbErr);
      }

      // Always try notification even if DB fails
      let notifySuccess = false;
      try {
        const response = await fetch('/api/notify-operator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clinicName: provider.name,
            ownerName: 'Claim Request',
            email: email,
            specialty: (provider.specialties && provider.specialties[0]) || 'N/A'
          })
        });
        if (response.ok) {
          notifySuccess = true;
        }
      } catch (notifyErr) {
        console.warn('Notification fallback failed:', notifyErr);
      }

      if (dbSuccess || notifySuccess) {
        setIsSuccess(true);
      } else {
        throw new Error('Both database and notification systems are currently unavailable.');
      }
    } catch (err) {
      console.error('Error submitting claim:', err);
      const errorResponse = err as { message?: string };
      // Even if the table doesn't exist yet, we'll try to show a helpful message
      if (errorResponse?.message?.includes('claim_requests') && errorResponse?.message?.includes('not found')) {
        setError('Verification system is being updated. Please try again soon.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-8 pb-4 flex flex-col items-center text-center">
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>

              <Logo className="mb-6" iconOnly={true} />

              {!isSuccess ? (
                <>
                  <h2 className="text-2xl font-black tracking-tight text-slate-900 mb-2">
                    Claim {provider.name}
                  </h2>
                  <p className="text-slate-500 text-sm leading-relaxed max-w-[90%]">
                    Take control of your listing — update your photos, services, and contact details to attract more patients.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-wellness-50 rounded-full flex items-center justify-center mb-6">
                    <Check size={32} className="text-wellness-600" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-900 mb-2">
                    Request Received! 🎉
                  </h2>
                  <div className="text-slate-500 text-sm leading-relaxed max-w-[90%]">
                    We have sent a verification email to <span className="font-bold text-slate-900">{email}</span>. Click the link in the email to complete your claim and access your dashboard.
                  </div>
                </>
              )}
            </div>

            {/* Form Content */}
            {!isSuccess ? (
              <form onSubmit={handleSubmit} className="p-8 pt-4">
                <div className="space-y-4 mb-8">
                  {/* Read-only fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Clinic Name</label>
                      <div className="text-xs font-semibold text-slate-400 truncate">{provider.name}</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Address</label>
                      <div className="text-xs font-semibold text-slate-400 truncate">{provider.address || `${provider.city}, ${provider.state}`}</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Phone</label>
                      <div className="text-xs font-semibold text-slate-400 truncate">{provider.phone || 'Not listed'}</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Website</label>
                      <div className="text-xs font-semibold text-slate-400 truncate">{provider.website || 'Not listed'}</div>
                    </div>
                  </div>

                  {/* Input field */}
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-[11px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Mail size={14} className="text-wellness-600" /> Enter your clinic email address
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      placeholder="Enter your clinic email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white border-2 border-slate-100 p-4 rounded-2xl text-slate-900 font-medium focus:border-wellness-500 focus:outline-none transition-colors shadow-sm"
                    />
                  </div>

                  {/* Checkbox */}
                  <label className="flex items-start gap-3 cursor-pointer group mt-4">
                    <div className="relative mt-0.5">
                      <input 
                        type="checkbox" 
                        className="peer sr-only"
                        checked={confirmed}
                        onChange={() => setConfirmed(!confirmed)}
                        required
                      />
                      <div className="w-5 h-5 border-2 border-slate-200 rounded group-hover:border-wellness-500 peer-checked:bg-wellness-500 peer-checked:border-wellness-500 transition-all flex items-center justify-center">
                        <Check size={12} className="text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium leading-snug">
                      I confirm I am the owner or authorized representative of this clinic
                    </span>
                  </label>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[10px] font-bold">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !email || !confirmed}
                  className={cn(
                    "w-full bg-wellness-600 text-white p-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-wellness-200/50 hover:bg-wellness-700 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none",
                    isSubmitting && "opacity-80"
                  )}
                >
                  {isSubmitting ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    <>Claim My Listing <ArrowRight size={20} /></>
                  )}
                </button>
              </form>
            ) : (
              <div className="p-8 pt-0 flex justify-center">
                <button
                  onClick={onClose}
                  className="w-full max-w-[200px] bg-slate-900 text-white p-4 rounded-2xl font-bold hover:bg-slate-800 transition-all"
                >
                  Got it
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
