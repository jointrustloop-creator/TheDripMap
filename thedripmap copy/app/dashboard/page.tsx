'use client';
import React from 'react';
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
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-black text-slate-900 mb-2">Clinic Dashboard</h1>
            <p className="text-slate-500">Manage your listing and track your matching performance.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border border-emerald-100">
              <CheckCircle2 size={16} /> Profile Verified
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Profile Views', value: '1,284', icon: <Users className="text-blue-600" />, trend: '+12%' },
            { label: 'Quiz Matches', value: '42', icon: <TrendingUp className="text-wellness-600" />, trend: '+8%' },
            { label: 'Avg. Rating', value: '4.9', icon: <BarChart3 className="text-amber-600" />, trend: '0.0' },
            { label: 'Response Time', value: '12m', icon: <Clock className="text-purple-600" />, trend: '-2m' }
          ].map((stat, idx) => (
            <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-slate-50 rounded-2xl">
                  {stat.icon}
                </div>
                <span className={`text-xs font-bold ${stat.trend.startsWith('+') ? 'text-emerald-600' : stat.trend.startsWith('-') ? 'text-blue-600' : 'text-slate-400'}`}>
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
                <div className="space-y-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-wellness-100 rounded-full flex items-center justify-center text-wellness-700 font-bold">
                          JD
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">Patient #{1024 + i}</div>
                          <div className="text-xs text-slate-500">Matched for: <span className="font-bold text-wellness-600">Hangover Recovery</span></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-900">92% Match</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">2 hours ago</div>
                      </div>
                    </div>
                  ))}
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
                  <span className="font-bold">85%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-wellness-500 w-[85%]" />
                </div>
              </div>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                Complete your clinical protocols to unlock the "Verified Partner" badge and get 2x more matches.
              </p>
              <button className="w-full bg-white text-slate-900 py-4 rounded-2xl font-bold hover:bg-wellness-50 transition-all flex items-center justify-center gap-2">
                Update Profile <Settings size={18} />
              </button>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Links</h3>
              <div className="space-y-3">
                {[
                  { label: 'View Public Listing', icon: <ExternalLink size={16} /> },
                  { label: 'Manage Reviews', icon: <MessageSquare size={16} /> },
                  { label: 'Billing & Plan', icon: <DollarSign size={16} /> }
                ].map((link, idx) => (
                  <button key={idx} className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors text-sm font-bold text-slate-600">
                    <span className="flex items-center gap-3">{link.icon} {link.label}</span>
                    <ArrowRight size={14} className="text-slate-300" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
