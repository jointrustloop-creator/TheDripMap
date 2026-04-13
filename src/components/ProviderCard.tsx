import React from 'react';
import Link from 'next/link';
import { Phone } from 'lucide-react';
import { Provider } from '../types';
import { slugify } from '../lib/data';
import { cn } from '../lib/utils';
import { ClinicImage } from './ClinicImage';

import { getStatus } from '../lib/hours';

interface ProviderCardProps {
  provider: Provider;
  className?: string;
}

export const ProviderCard = ({ provider, className }: ProviderCardProps) => {
  const slug = provider.slug || slugify(provider.name);

  const status = getStatus(provider.hours);
  const isOpenNow = status.isOpen;
  const openStatus = provider.hours ? isOpenNow : null;
  const isMobile = provider.mobile_service || 
                   provider.type === 'Mobile' || 
                   provider.specialties?.some(s => s.toLowerCase().includes('mobile'));

  return (
    <div className={cn(
      "group relative bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full",
      className
    )}>
      {/* Photo Area */}
      <div className="relative h-[180px] overflow-hidden shrink-0">
        <Link href={`/provider/${slug}`} className="block h-full">
          <ClinicImage 
            name={provider.name}
            imageUrl={provider.imageUrl}
            className="group-hover:scale-105 transition-transform duration-500"
          />
        </Link>
        
        {/* Top Left Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {provider.is_featured && (
            <span className="bg-[#FFD700] text-slate-900 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
              ⭐ Featured
            </span>
          )}
          {provider.is_verified && (
            <span className="bg-[#10B981] text-white px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
              ✓ Verified
            </span>
          )}
        </div>

        {/* Top Right Badge */}
        <div className="absolute top-3 right-3">
          {openStatus === true && (
            <span className="bg-[#10B981] text-white px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
              Open Now
            </span>
          )}
          {openStatus === false && (
            <span className="bg-slate-400 text-white px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
              Closed
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Row 1: Name + Delivery Type */}
        <div className="flex justify-between items-start gap-2 mb-2">
          <Link href={`/provider/${slug}`} className="flex-1">
            <h3 className="text-base font-bold text-slate-900 leading-tight line-clamp-1 group-hover:text-wellness-600 transition-colors">
              {provider.name}
            </h3>
          </Link>
          {isMobile ? (
            <span className="bg-wellness-50 text-wellness-700 px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap">
              🚐 Mobile
            </span>
          ) : (
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap">
              🏥 In-Clinic
            </span>
          )}
        </div>

        {/* Row 2: Rating + Distance */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
          <div className="flex items-center gap-1">
            <span className="text-slate-900 font-bold">⭐ {provider.rating}</span>
            <span>({provider.reviewCount} reviews)</span>
          </div>
          <span>·</span>
          {provider.distance !== undefined ? (
            <span className="font-medium">{provider.distance} miles away</span>
          ) : isMobile ? (
            <span className="font-medium">Comes to you</span>
          ) : (
            <span className="font-medium">{provider.city}, {provider.state || 'US'}</span>
          )}
        </div>

        {/* Row 3: Price Range */}
        {(provider.price_range || provider.priceRange) && (
          <div className="text-xs font-bold text-slate-900 mb-3">
            {provider.price_range || provider.priceRange}
          </div>
        )}

        {/* Row 4: Service Pills */}
        <div className="flex flex-wrap gap-1.5 mt-auto">
          {(provider.services || []).length > 0 ? (
            provider.services?.slice(0, 3).map((s, idx) => (
              <span key={idx} className="bg-slate-50 text-slate-500 px-2 py-0.5 rounded text-[10px] font-medium border border-slate-100">
                {s.name}
              </span>
            ))
          ) : (
            (provider.specialties || []).slice(0, 3).map((s, idx) => (
              <span key={idx} className="bg-slate-50 text-slate-500 px-2 py-0.5 rounded text-[10px] font-medium border border-slate-100">
                {s}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-3 py-3 border-t border-slate-50 flex items-center justify-between gap-2">
        {provider.phone && (
          <a 
            href={`tel:${provider.phone}`}
            className="flex-1 bg-slate-900 text-white px-3 py-2 rounded-lg font-bold text-[11px] hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Phone size={14} /> Call Now
          </a>
        )}
        <Link 
          href={`/provider/${slug}`}
          className="flex-1 bg-wellness-600 text-white px-3 py-2 rounded-lg font-bold text-[11px] hover:bg-wellness-700 transition-all flex items-center justify-center gap-1.5 shadow-sm"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
};

