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
        "group relative rounded-3xl border overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full bg-slate-900",
        provider.is_featured 
          ? "border-wellness-500 shadow-wellness-500/10 ring-1 ring-wellness-500/20" 
          : "border-slate-800",
        className
      )}
    >
      {/* Full Card Background Image */}
      <div className="absolute inset-0 z-0">
        <ClinicImage 
          name={provider.name}
          imageUrl={provider.imageUrl || DEFAULT_CLINIC_IMAGE}
          initials={provider.is_featured ? ' ' : undefined}
          className="group-hover:scale-105 transition-transform duration-700 h-full w-full opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Photo Area (Height maintained for layout consistency) */}
        <div className="relative h-[160px] shrink-0">
          {/* Top Left Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {!isClaimed && (
              <span className="bg-slate-500/80 backdrop-blur-sm text-white px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm">
                Unclaimed
              </span>
            )}
            {provider.is_featured && (
              <>
                <span className="bg-[#10B981] text-white px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                  ✅ Verified & Claimed
                </span>
                {dynamicBadge && (
                  <motion.span 
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={cn("text-white px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1", dynamicBadge.color)}
                  >
                    {dynamicBadge.label}
                  </motion.span>
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
              <h3 className="text-lg font-bold text-white leading-tight line-clamp-1 group-hover:text-wellness-400 transition-colors">
                {provider.name}
              </h3>
            </Link>
          </div>

          {/* New Rating Section */}
          {provider.is_featured && provider.rating > 0 && provider.reviewCount > 0 && (
            <div className="text-xs text-slate-300 mb-2 font-medium">
              ⭐ {provider.rating} ({provider.reviewCount || 0} reviews)
            </div>
          )}

          {/* Row 2: Delivery Type + Distance */}
          <div className="flex items-center gap-2 mb-2">
            {isMobile ? (
              <span className="bg-wellness-500/20 backdrop-blur-sm text-wellness-200 border border-wellness-500/30 px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap">
                🚐 Mobile
              </span>
            ) : (
              <span className="bg-white/10 backdrop-blur-sm text-slate-200 border border-white/20 px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap">
                🏥 In-Clinic
              </span>
            )}
            
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              {provider.distance !== undefined ? (
                <span className="font-bold text-wellness-400 flex items-center gap-1">
                  <Navigation size={10} className="fill-wellness-400" />
                  {provider.distance} mi
                </span>
              ) : (
                <span className="font-medium">{provider.city}, {provider.state || 'US'}</span>
              )}
            </div>
          </div>

          {/* Row 3: Description (Claimed Only) */}
          {provider.is_featured && provider.description && (
            <p className="text-xs text-slate-300 mb-3">
              {provider.description}
            </p>
          )}

          {/* Row 4: Price Range (Claimed Only) */}
          {provider.is_featured && (provider.price_range || provider.priceRange) && (
            <div className="text-xs font-bold text-wellness-400 mb-3">
              {provider.price_range || provider.priceRange}
            </div>
          )}

          {/* Row 5: Service Pills */}
          <div className="flex flex-wrap gap-1.5 mt-auto">
            {(provider.services || []).length > 0 ? (
              provider.services?.slice(0, 3).map((s, idx) => {
                const name = typeof s === 'string' ? s : (s?.name || '');
                if (!name) return null;
                return (
                  <span key={idx} className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-medium border",
                    provider.is_featured 
                      ? "bg-wellness-500/10 text-wellness-200 border-wellness-500/30" 
                      : "bg-white/5 text-slate-400 border-white/10"
                  )}>
                    {name}
                  </span>
                );
              })
            ) : (
              (provider.specialties || []).slice(0, 3).map((s, idx) => (
                <span key={idx} className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-medium border",
                  provider.is_featured 
                    ? "bg-wellness-500/10 text-wellness-200 border-wellness-500/30" 
                    : "bg-white/5 text-slate-400 border-white/10"
                )}>
                  {s}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Card Footer */}
        <div className="px-3 py-3 mt-auto flex flex-col gap-2 bg-gradient-to-t from-slate-950/80 to-transparent">
          {showAddPhotoBadge && !isClaimed && (
            <div className="text-[10px] text-white/70 mb-1 flex items-center gap-1 font-medium">
              📷 Add your photo — Claim this listing
            </div>
          )}
          
          <div className="flex gap-2">
            {isClaimed && provider.is_featured ? (
              <div className="flex gap-2 w-full">
                {provider.phone && (
                  <a 
                    href={`tel:${provider.phone}`}
                    className="flex-1 bg-white text-slate-900 px-3 py-2 rounded-lg font-bold text-[11px] hover:bg-slate-100 transition-all flex items-center justify-center gap-1.5 shadow-sm"
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
            ) : (
              <div className="flex gap-2 w-full">
                {provider.phone && (
                  <a 
                    href={`tel:${provider.phone}`}
                    className="flex-1 bg-white/10 backdrop-blur-sm text-white px-3 py-2 rounded-lg font-bold text-[11px] hover:bg-white/20 transition-all flex items-center justify-center gap-1.5 border border-white/10"
                  >
                    <Phone size={14} /> Call
                  </a>
                )}
                {provider.website && (
                  <a 
                    href={provider.website.startsWith('http') ? provider.website : `https://${provider.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-white/10 backdrop-blur-sm text-white px-3 py-2 rounded-lg font-bold text-[11px] hover:bg-white/20 transition-all flex items-center justify-center gap-1.5 border border-white/10"
                  >
                    Website
                  </a>
                )}
              </div>
            )}
          </div>
          
          {!isClaimed && (
            <button 
              onClick={() => openClaimModal(provider)}
              className="bg-teal-500 text-white px-3 py-2.5 rounded-lg font-bold text-[12px] hover:bg-teal-600 transition-all flex items-center justify-center gap-1.5 shadow-sm uppercase tracking-wider w-full"
            >
              Claim Listing <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

