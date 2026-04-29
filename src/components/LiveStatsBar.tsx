'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Users, Plus, TrendingUp } from 'lucide-react';

interface LiveStatsBarProps {
  stats?: {
    totalClinics: number;
    totalCities: number;
    growth: string;
  };
}

export default function LiveStatsBar({ stats: incomingStats }: LiveStatsBarProps) {
  const [usersCount, setUsersCount] = useState(42);

  // Fluctuating user count to simulate real-time activity
  useEffect(() => {
    const interval = setInterval(() => {
      setUsersCount(prev => {
        const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
        return Math.max(30, Math.min(60, prev + change));
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { 
      icon: <Activity size={14} className="text-emerald-500" />, 
      text: `${incomingStats?.totalClinics?.toLocaleString() || '1,000'}+ Verified Clinics`,
      label: "Verified"
    },
    { 
      icon: <TrendingUp size={14} className="text-blue-500" />, 
      text: `${incomingStats?.totalCities?.toLocaleString() || '50'}+ US & Canada Cities`,
      label: "Coverage"
    },
    { 
      icon: <Plus size={14} className="text-wellness-500" />, 
      text: `New Clinics Added ${incomingStats?.growth || 'Weekly'}`,
      label: "Expansion"
    },
    { 
      icon: <Users size={14} className="text-amber-500" />, 
      text: `${usersCount} Users Searching Right Now`,
      label: "Live"
    },
  ];

  return (
    <div className="bg-slate-900 overflow-hidden py-3">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-2">
          {stats.map((stat, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex items-center justify-center p-1 bg-white/5 rounded-md">
                {stat.icon}
              </div>
              <span className="text-[10px] md:text-xs font-bold text-slate-300 whitespace-nowrap">
                {stat.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
