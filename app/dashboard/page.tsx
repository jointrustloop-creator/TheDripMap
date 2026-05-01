'use client';
import React, { useEffect, useState } from 'react';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';
import { 
  BarChart3, 
  Users, 
  Settings, 
  ExternalLink, 
  CheckCircle2,
  Clock,
  TrendingUp,
  MessageSquare,
  DollarSign,
  ArrowRight,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../src/lib/supabase';
import Link from 'next/link';
import { OperatorProfile, Provider } from '../../src/types';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [operator, setOperator] = useState<OperatorProfile | null>(null);
  const [listing, setListing] = useState<Provider | null>(null);
  const [stats, setStats] = useState({
    views: 0,
    matches: 'Coming soon',
    rating: '0.0',
    responseTime: '12m'
  });

  useEffect(() => {
    async function loadDashboardData() {
      if (!isSupabaseConfigured()) {
        setLoading(false);
        return;
      }

      try {
        // 1. Get current user
        const { data: { user } } = await supabase.auth.getUser();
        const email = user?.email || new URLSearchParams(window.location.search).get('email');

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

        // 3. Get listing data if clinic_id exists
        if (operatorData.clinic_id) {
          const { data: listingData } = await supabase
            .from('providers')
            .select('*')
            .eq('id', operatorData.clinic_id)
            .single();
          
          if (listingData) {
            setListing(listingData);

            // 4. Get views count (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const { count: viewsCount } = await supabase
              .from('listing_views')
              .select('*', { count: 'exact', head: true })
              .eq('listing_id', operatorData.clinic_id)
              .gt('viewed_at', thirtyDaysAgo.toISOString());

            setStats(prev => ({
              ...prev,
              views: viewsCount || 0,
              rating: listingData.rating?.toString() || '0.0'
            }));
          }
        }
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

  if (!operator) {
    return (
      <div className="min-h-screen bg-[#FDFDFB]">
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 py-20 text-center">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-600">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-4">Registration Received</h1>
          <p className="text-slate-600 mb-8 max-w-md mx-auto text-lg">
            Thank you! We have received your clinic information and will be in touch within 24 hours.
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
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg"
            >
              Update Information <ArrowRight size={20} />
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-black text-slate-900 mb-2">
              {listing?.name || 'Clinic Dashboard'}
            </h1>
            <p className="text-slate-500">Manage your listing and track your matching performance.</p>
          </div>
          <div className="flex items-center gap-3">
            {listing?.is_verified ? (
              <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border border-emerald-100">
                <CheckCircle2 size={16} /> Profile Verified
              </div>
            ) : (
              <div className="bg-amber-50 text-amber-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border border-amber-100">
                <Clock size={16} /> Verification Pending
              </div>
            )}
            {listing?.subscription_tier && (
              <div className="bg-wellness-50 text-wellness-700 px-4 py-2 rounded-xl text-sm font-bold border border-wellness-100 uppercase tracking-widest">
                {listing.subscription_tier}
              </div>
            )}
          </div>
        </div>

        {!operator.clinic_id ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-12 text-center mb-12">
            <h2 className="text-2xl font-black text-slate-900 mb-4">Listing Not Linked</h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              Your operator profile is created, but it isn&apos;t linked to a clinic listing yet. Complete your profile to see your stats.
            </p>
            <Link 
              href="/for-clinics/setup"
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg"
            >
              Complete Profile <ArrowRight size={20} />
            </Link>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              {[
                { label: 'Profile Views', value: stats.views.toLocaleString(), icon: <Users className="text-blue-600" />, trend: 'Last 30d' },
                { label: 'Quiz Matches', value: stats.matches, icon: <TrendingUp className="text-wellness-600" />, trend: 'Coming soon' },
                { label: 'Avg. Rating', value: stats.rating, icon: <BarChart3 className="text-amber-600" />, trend: 'Live' },
                { label: 'Response Time', value: stats.responseTime, icon: <Clock className="text-purple-600" />, trend: 'Est.' }
              ].map((stat, idx) => (
                <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-slate-50 rounded-2xl">
                      {stat.icon}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {stat.trend}
                    </span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 mb-1">{stat.value}</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900">Recent Matches</h3>
                    <button className="text-sm font-bold text-wellness-600 hover:text-wellness-700">View All</button>
                  </div>
                  <div className="p-8">
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <TrendingUp size={32} />
                      </div>
                      <p className="text-slate-500 font-medium">Match tracking is coming soon to your dashboard.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-8">
                <div className="bg-slate-900 text-white rounded-[2.5rem] p-8">
                  <h3 className="text-xl font-bold mb-4">Profile Strength</h3>
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-400">Completion</span>
                      <span className="font-bold">{listing?.is_verified ? '100%' : '85%'}</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-wellness-500 transition-all duration-1000" style={{ width: listing?.is_verified ? '100%' : '85%' }} />
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                    {listing?.is_verified 
                      ? "Your profile is fully verified and performing at peak capacity."
                      : "Complete your clinical protocols to unlock the \"Verified Partner\" badge and get 2x more matches."}
                  </p>
                  <Link 
                    href="/for-clinics/setup"
                    className="w-full bg-white text-slate-900 py-4 rounded-2xl font-bold hover:bg-wellness-50 transition-all flex items-center justify-center gap-2"
                  >
                    Update Profile <Settings size={18} />
                  </Link>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Links</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'View Public Listing', icon: <ExternalLink size={16} />, href: `/provider/${listing?.slug || listing?.id}` },
                      { label: 'Manage Reviews', icon: <MessageSquare size={16} />, href: '#' },
                      { label: 'Billing & Plan', icon: <DollarSign size={16} />, href: '#' }
                    ].map((link, idx) => (
                      <Link 
                        key={idx} 
                        href={link.href}
                        className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors text-sm font-bold text-slate-600"
                      >
                        <span className="flex items-center gap-3">{link.icon} {link.label}</span>
                        <ArrowRight size={14} className="text-slate-300" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
