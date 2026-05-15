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
import { useClaimListing } from '../context/ClaimListingContext';

interface ProviderCardProps {
  provider: Provider;
  className?: string;
}

const DEFAULT_CLINIC_IMAGE = 'https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/iv-therapy-group-clinic.jpg';

export const ProviderCard = ({ provider, className }: ProviderCardProps) => {
  const { openClaimModal } = useClaimListing();
  const slug = provider.slug || slugify(provider.name);
  const valueMetrics = calculateValueMetrics(provider);

  const status = getStatus(provider.hours);
  const isOpenNow = status.isOpen;
  const openStatus = provider.hours ? isOpenNow : null;
  const isMobile = provider.mobile_service || 
                   provider.type === 'Mobile' || 
                   provider.specialties?.some(s => (s?.toString() || '').toLowerCase().includes('mobile'));

  const isRealPhoto = provider.imageUrl && 
                      !provider.imageUrl.includes('placeholder') && 
                      !provider.imageUrl.includes('default');
  
  const showAddPhotoBadge = !isRealPhoto;

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

  const isClaimed = provider.is_claimed === true || provider.is_featured === true || (provider as any).claimed_status === 'claimed';

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={cn(
        "group relative rounded-[2rem] border overflow-hidden transition-all duration-500 flex flex-col h-full",
        provider.is_featured 
          ? "border-amber-400/50 shadow-[0_20px_50px_rgba(245,158,11,0.15)] ring-2 ring-amber-400/20 bg-white" 
          : "border-slate-200 shadow-sm bg-slate-50 grayscale-[0.5] opacity-90 hover:grayscale-0 hover:opacity-100",
        className
      )}
    >
      {/* Full Card Background Image */}
      <div className={cn(
        "absolute inset-0 z-0",
        !provider.is_featured && "brightness-[0.8] contrast-[0.9]"
      )}>
        <ClinicImage 
          name={provider.name}
          imageUrl={provider.imageUrl || (provider.is_featured ? DEFAULT_CLINIC_IMAGE : undefined)}
          initials={provider.is_featured ? ' ' : undefined}
          className="group-hover:scale-105 transition-transform duration-700 h-full w-full opacity-30"
        />
        <div className={cn(
          "absolute inset-0",
          provider.is_featured 
            ? "bg-gradient-to-t from-white via-white/80 to-amber-50/20" 
            : "bg-gradient-to-t from-slate-100 via-slate-50/90 to-transparent"
        )} />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Photo Area */}
        <div className="relative h-[140px] shrink-0">
          {/* Top Left Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {!isClaimed && (
              <span className="bg-slate-400 text-white px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-[0.1em] shadow-sm">
                Unclaimed Listing
              </span>
            )}
            {provider.is_featured && (
              <>
                <span className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 border border-emerald-500/50">
                  <span className="bg-white text-emerald-600 rounded-full p-0.5"><StarIcon size={8} fill="currentColor" /></span>
                  Verified & Claimed
                </span>
                {dynamicBadge && (
                  <motion.span 
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={cn("text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5", dynamicBadge.color)}
                  >
                    {dynamicBadge.icon} {dynamicBadge.label}
                  </motion.span>
                )}
              </>
            )}
          </div>

          {/* Top Right Score/Distance on Featured */}
          <div className="absolute top-4 right-4">
            {provider.is_featured && (
              <div className={cn(
                "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md border bg-white",
                valueMetrics.color.replace('bg-', 'text-').replace('/10', '')
              )}>
                {valueMetrics.label}
              </div>
            )}
          </div>
        </div>

        {/* Card Body */}
        <div className="px-5 pb-5 flex-1 flex flex-col">
          <div className="flex justify-between items-start gap-2 mb-3">
            <Link href={`/providers/${slug}`} className="flex-1">
              <h3 className={cn(
                "text-xl font-black leading-tight line-clamp-2 transition-colors",
                provider.is_featured ? "text-slate-900 group-hover:text-wellness-600" : "text-slate-600"
              )}>
                {provider.name}
              </h3>
            </Link>
          </div>

          {/* Rating Section */}
          <div className="mb-4">
            {provider.is_featured && (
              provider.rating > 0 ? (
                <div className="flex items-center gap-1 text-[11px] font-black text-slate-700">
                  <div className="flex items-center text-amber-500">
                    <StarIcon size={12} fill="currentColor" />
                  </div>
                  {provider.rating} <span className="text-slate-400 font-bold ml-1">({provider.reviewCount || 0} reviews)</span>
                </div>
              ) : (
                <div className="text-[9px] font-black text-emerald-600 uppercase tracking-wider flex items-center gap-1 bg-emerald-50 w-fit px-2 py-0.5 rounded-md border border-emerald-100">
                  ✨ New Clinic · Be the first to review
                </div>
              )
            )}
          </div>

          {/* Location & Service Row */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
              <Navigation size={12} className={provider.is_featured ? "text-wellness-600" : "text-slate-400"} />
              {provider.distance ? `${provider.distance} mi` : provider.city}
            </div>
            <div className="w-1 h-1 bg-slate-200 rounded-full" />
            {isMobile ? (
              <span className="text-wellness-600 text-[10px] font-black uppercase tracking-tight">
                🚐 Mobile
              </span>
            ) : (
              <span className="text-slate-500 text-[10px] font-black uppercase tracking-tight">
                🏥 Clinic
              </span>
            )}
          </div>

          {/* Service Pills */}
          <div className="flex flex-wrap gap-1.5 mt-auto pt-4 border-t border-slate-100/50">
            {(provider.services || provider.specialties || []).slice(0, 2).map((s, idx) => {
              const name = typeof s === 'string' ? s : (s?.name || '');
              if (!name) return null;
              return (
                <span key={idx} className={cn(
                  "px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors",
                  provider.is_featured 
                    ? "bg-slate-50 text-slate-600 border-slate-200" 
                    : "bg-transparent text-slate-400 border-slate-200"
                )}>
                  {name}
                </span>
              );
            })}
          </div>
        </div>

        {/* Card Footer */}
        <div className={cn(
          "px-5 py-5 mt-auto flex flex-col gap-3",
          provider.is_featured ? "bg-slate-50/50" : "bg-transparent"
        )}>
          <div className="flex gap-2">
            <Link 
              href={`/providers/${slug}`}
              className={cn(
                "flex-1 px-4 py-3 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-sm",
                provider.is_featured 
                  ? "bg-wellness-600 text-white hover:bg-wellness-700" 
                  : "bg-white border-2 border-slate-100 text-slate-600 hover:border-slate-300"
              )}
            >
              View Profile <ArrowRight size={14} />
            </Link>
          </div>
          
          {!isClaimed && (
            <button 
              onClick={() => openClaimModal(provider)}
              className="text-teal-600 text-[10px] font-black uppercase tracking-[0.1em] hover:underline transition-all py-1"
            >
              Own this clinic? Claim Listing →
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

