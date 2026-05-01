'use client';
import React, { useEffect, useState } from 'react';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';
import { 
  CheckCircle2,
  ArrowRight,
  Loader2,
  MapPin
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../src/lib/supabase';
import Link from 'next/link';
import { OperatorProfile } from '../../src/types';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [operator, setOperator] = useState<OperatorProfile | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      if (!isSupabaseConfigured()) {
        setLoading(false);
        return;
      }

      try {
        // 1. Get current user or persistent email from local storage/query
        const { data: { user } } = await supabase.auth.getUser();
        const email = user?.email || 
                      new URLSearchParams(window.location.search).get('email') || 
                      localStorage.getItem('operator_email');

        if (!email) {
          setLoading(false);
          return;
        }

        // 2. Get operator profile
        const { data: operatorData, error: opError } = await supabase
          .from('operator_profiles')
          .select('*')
          .eq('email', email)
          .single();

        if (opError || !operatorData) {
          setLoading(false);
          return;
        }

        setOperator(operatorData);
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFDFB] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-wellness-600 animate-spin" />
      </div>
    );
  }

  // State 1: Profile Found -> Show "On the List" Success Message
  if (operator) {
    return (
      <div className="min-h-screen bg-[#FDFDFB] flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6 py-20">
          <div className="max-w-xl w-full text-center">
            <div className="w-24 h-24 bg-wellness-50 text-wellness-600 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-xl shadow-wellness-100/20">
              <CheckCircle2 size={48} />
            </div>

            <h1 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">
              You&apos;re on the list!
            </h1>
            
            <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm mb-10 text-left">
              <p className="text-lg text-slate-700 leading-relaxed font-bold mb-6">
                Thank you for claiming your TheDripMap listing.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 text-slate-400">
                    <span className="text-xs">1</span>
                  </div>
                  <p className="text-slate-600 font-medium pt-1">
                    Our team will review your profile and activate it within 24 hours.
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 text-slate-400">
                    <span className="text-xs">2</span>
                  </div>
                  <div className="pt-1">
                    <p className="text-slate-600 font-medium">
                      We&apos;ll contact you at <span className="text-slate-900 font-bold">{operator.email}</span> with next steps.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-wellness-50 rounded-2xl border border-wellness-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-black text-wellness-700 uppercase tracking-widest">Preview</p>
                  <span className="text-[10px] font-bold text-wellness-600 bg-wellness-200/30 px-2 py-0.5 rounded-full uppercase tracking-widest">Sample</span>
                </div>
                <p className="text-sm text-wellness-900 font-medium">
                  In the meantime, explore what a verified listing looks like:
                </p>
                <Link 
                  href="/cities/toronto"
                  className="mt-4 inline-flex items-center gap-2 text-wellness-700 font-black hover:gap-3 transition-all"
                >
                  View Example Listing <ArrowRight size={18} />
                </Link>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/"
                className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-slate-900 text-white font-black hover:bg-slate-800 transition-all shadow-lg"
              >
                Return Home
              </Link>
              <Link 
                href="/for-clinics/setup"
                className="w-full sm:w-auto px-10 py-4 rounded-2xl border-2 border-slate-100 text-slate-600 font-bold hover:bg-slate-50 transition-all"
              >
                Edit Information
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // State 2: Profile Not Found -> Show Setup CTA
  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-400">
          <MapPin size={40} />
        </div>
        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Clinic Dashboard</h1>
        <p className="text-slate-500 mb-10 max-w-md mx-auto text-lg leading-relaxed">
          Manage your clinical network presence, track patient matches, and update your protocols.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-slate-500 font-bold hover:text-slate-900 transition-all"
          >
            Return Home
          </Link>
          <Link 
            href="/for-clinics/setup"
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-10 py-4 rounded-2xl font-black hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
          >
            Get Started <ArrowRight size={20} />
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

