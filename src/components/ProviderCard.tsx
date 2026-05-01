'use client';

import React from 'react';
import Link from 'next/link';
import { Phone, ArrowRight, TrendingUp, Zap as ZapIcon, Star as StarIcon, Flame, Navigation } from 'lucide-react';
import { Provider } from '../types';
import { slugify } from '../lib/data';
import { cn } from '../lib/utils';
import { ClinicImage } from './ClinicImage';
import { calculateValueMetrics } from '../lib/price-utils';
import { getStatus } from '../lib/hours';
import { motion } from 'motion/react';

interface ProviderCardProps {
  provider: Provider;
  className?: string;
}

export const ProviderCard = ({ provider, className }: ProviderCardProps) => {
  const slug = provider.slug || slugify(provider.name);
  const valueMetrics = calculateValueMetrics(provider);

  const status = getStatus(provider.hours);
  const isOpenNow = status.isOpen;
  const openStatus = provider.hours ? isOpenNow : null;
  const isMobile = provider.mobile_service || 
                   provider.type === 'Mobile' || 
                   provider.specialties?.some(s => (s?.toString() || '').toLowerCase().includes('mobile'));

  // Simulate dynamic badges intelligently based on ID
  const dynamicBadge = React.useMemo(() => {
    // Only show dynamic badge for claimed/featured clinics
    if (!provider.is_featured) return null;
    
    const idHash = provider.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const options = [
      { label: '🔥 Popular This Week', color: 'bg-orange-500', icon: <Flame size={12} /> },
      { label: '⭐ Top Rated in Area', color: 'bg-amber-500', icon: <StarIcon size={12} /> },
      { label: '📈 Trending', color: 'bg-blue-500', icon: <TrendingUp size={12} /> },
      { label: '⚡ Fast Response', color: 'bg-emerald-500', icon: <ZapIcon size={12} /> },
    ];
    
    // Only show dynamic badge for ~30% of clinics to keep it premium
    if (idHash % 10 > 2) return null;
    return options[idHash % options.length];
  }, [provider.id, provider.is_featured]);

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={cn(
        "group relative bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full",
        !provider.is_featured && "border-slate-200",
        className
      )}
    >
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
          {!provider.is_featured && (
            <span className="bg-slate-400/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
              Unclaim listing
            </span>
          )}
          {provider.is_featured && (
            <>
              {dynamicBadge && (
                <motion.span 
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={cn("text-white px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1", dynamicBadge.color)}
                >
                  {dynamicBadge.label}
                </motion.span>
              )}
              {provider.is_verified && (
                <span className="bg-[#10B981] text-white px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                  ✓ Verified
                </span>
              )}
              <span className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1 border",
                valueMetrics.color
              )}>
                💎 {valueMetrics.label}
              </span>
            </>
          )}
        </div>

        {/* Top Right Badge */}
        <div className="absolute top-3 right-3">
          {provider.is_featured && openStatus === true && (
            <span className="bg-[#10B981] text-white px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
              Open Now
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
          {provider.rating > 0 && provider.reviewCount > 0 && (
            <>
              <div className="flex items-center gap-1">
                <span className="text-slate-900 font-bold">⭐ {provider.rating}</span>
                <span>({provider.reviewCount} reviews)</span>
              </div>
              <span>·</span>
            </>
          )}
          {provider.distance !== undefined ? (
            <span className="font-bold text-wellness-600 flex items-center gap-1">
              <Navigation size={10} className="fill-wellness-600" />
              {provider.distance} miles away
            </span>
          ) : (
            <span className="font-medium">{provider.city}, {provider.state || 'US'}</span>
          )}
        </div>

        {/* Row 3: Description (Claimed Only) */}
        {provider.is_featured && provider.description && (
          <p className="text-xs text-slate-600 line-clamp-2 mb-3">
            {provider.description}
          </p>
        )}

        {/* Row 4: Price Range (Claimed Only) */}
        {provider.is_featured && (provider.price_range || provider.priceRange) && (
          <div className="text-xs font-bold text-slate-900 mb-3">
            {provider.price_range || provider.priceRange}
          </div>
        )}

        {/* Row 5: Service Pills (Claimed Only) */}
        {provider.is_featured && (
          <div className="flex flex-wrap gap-1.5 mt-auto">
            {(provider.services || []).length > 0 ? (
              provider.services?.slice(0, 3).map((s, idx) => {
                const name = typeof s === 'string' ? s : (s?.name || '');
                if (!name) return null;
                return (
                  <span key={idx} className="bg-slate-50 text-slate-500 px-2 py-0.5 rounded text-[10px] font-medium border border-slate-100">
                    {name}
                  </span>
                );
              })
            ) : (
              (provider.specialties || []).slice(0, 3).map((s, idx) => (
                <span key={idx} className="bg-slate-50 text-slate-500 px-2 py-0.5 rounded text-[10px] font-medium border border-slate-100">
                  {s}
                </span>
              ))
            )}
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="px-3 py-3 border-t border-slate-50 flex flex-col gap-2">
        {!provider.is_featured ? (
          <>
            <div className="flex gap-2">
              {provider.phone && (
                <a 
                  href={`tel:${provider.phone}`}
                  className="flex-1 bg-slate-100 text-slate-900 px-3 py-2 rounded-lg font-bold text-[11px] hover:bg-slate-200 transition-all flex items-center justify-center gap-1.5"
                >
                  <Phone size={14} /> Call
                </a>
              )}
              {provider.website && (
                <a 
                  href={provider.website.startsWith('http') ? provider.website : `https://${provider.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-slate-100 text-slate-900 px-3 py-2 rounded-lg font-bold text-[11px] hover:bg-slate-200 transition-all flex items-center justify-center gap-1.5"
                >
                  Website
                </a>
              )}
            </div>
            <Link 
              href={`/for-clinics?clinicId=${provider.id}&clinicName=${encodeURIComponent(provider.name)}`}
              className="bg-teal-500 text-white px-3 py-3 rounded-lg font-bold text-[12px] hover:bg-teal-600 transition-all flex items-center justify-center gap-1.5 shadow-sm uppercase tracking-wider"
            >
              Claim This Listing <ArrowRight size={14} />
            </Link>
          </>
        ) : (
          <div className="flex gap-2">
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
        )}
      </div>
    </motion.div>
  );
};

