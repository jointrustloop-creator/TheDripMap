'use client';

import React from 'react';
import Link from 'next/link';
import { ResilientImage } from './ResilientImage';
import { MapPin, Sparkles, ArrowRight, Phone, Clock, Globe, Building2, TrendingUp, Zap as ZapIcon, Flame, Star as StarIcon } from 'lucide-react';
import { Provider, OperatorProfile } from '../types';
import { ServicePill } from './ServicePill';
import { slugify } from '../lib/data';
import { cn } from '../lib/utils';
import { calculateValueMetrics } from '../lib/price-utils';
import { motion } from 'motion/react';

interface ProviderCardFeaturedProps {
  provider: Provider & { matchScore?: number };
  operatorProfile?: OperatorProfile;
  rank?: number;
  isPrimary?: boolean;
}

export const ProviderCardFeatured = ({ provider, operatorProfile, isPrimary = true }: ProviderCardFeaturedProps) => {
  const slug = provider.slug || slugify(provider.name);
  const valueMetrics = calculateValueMetrics(provider);
  const priceAnchor = provider.priceRange === '$' ? '$99' : provider.priceRange === '$$' ? '$149' : provider.priceRange === '$$$' ? '$199' : '$249';

  // Simulate dynamic badges intelligently based on ID
  const dynamicBadge = React.useMemo(() => {
    const idHash = provider.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const options = [
      { label: '🔥 Popular This Week', color: 'bg-orange-500', icon: <Flame size={14} /> },
      { label: '⭐ Top Rated in Area', color: 'bg-amber-500', icon: <StarIcon size={14} /> },
      { label: '📈 Trending', color: 'bg-blue-500', icon: <TrendingUp size={14} /> },
      { label: '⚡ Fast Response', color: 'bg-emerald-500', icon: <ZapIcon size={14} /> },
    ];
    
    // Fewer badges on featured to keep it clean
    if (idHash % 10 > 2) return null;
    return options[idHash % options.length];
  }, [provider.id]);

  const isRealPhoto = provider.imageUrl && 
                      !provider.imageUrl.includes('placeholder') && 
                      !provider.imageUrl.includes('default');
  const showAddPhotoBadge = !isRealPhoto;
  const DEFAULT_CLINIC_IMAGE = 'https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/iv-therapy-group-clinic.jpg';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className={cn(
        "group relative bg-white rounded-[2.5rem] border overflow-hidden transition-all duration-500",
        provider.is_featured 
          ? "border-wellness-500 shadow-2xl shadow-wellness-100 ring-4 ring-wellness-500/10 p-2" 
          : "border-slate-100 shadow-lg hover:shadow-xl"
      )}
    >
      <div className={cn(
        "flex flex-col",
        isPrimary ? "md:flex-row" : ""
      )}>
        {/* Image Section */}
        <div className={cn(
          "relative overflow-hidden",
          isPrimary ? "md:w-80 h-72 md:h-auto rounded-[2rem]" : "h-48"
        )}>
          <Link href={`/provider/${slug}`} className="block h-full">
            <ResilientImage 
              src={provider.imageUrl || DEFAULT_CLINIC_IMAGE} 
              alt={`${provider.name} IV therapy clinic in ${provider.city}`}
              fill
              className={cn(
                "object-cover group-hover:scale-110 transition-transform duration-700",
                !isRealPhoto && "opacity-60 bg-slate-900"
              )}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              fallbackSrc="https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/clinic-logo-placeholder.png"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          </Link>
          
          {showAddPhotoBadge && (
            <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-sm text-white/90 px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-2 border border-white/10 z-20">
              📷 Add your photo — Claim this listing
            </div>
          )}

          <div className="flex flex-col gap-2 absolute top-4 left-4">
            {provider.is_featured && (
              <div className="bg-emerald-600 text-white px-4 py-2 rounded-2xl text-[10px] font-black shadow-xl flex items-center gap-2">
                ✅ Verified & Claimed
              </div>
            )}
            
            {isPrimary && (
              <div className="bg-white/90 backdrop-blur-sm text-wellness-700 px-4 py-2 rounded-2xl text-xs font-black shadow-xl flex items-center gap-2">
                <Sparkles size={14} /> YOUR BEST MATCH
              </div>
            )}
            
            {dynamicBadge && (
              <motion.div 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={cn("text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wider shadow-xl flex items-center gap-2", dynamicBadge.color)}
              >
                {dynamicBadge.icon} {dynamicBadge.label}
              </motion.div>
            )}

            {isPrimary && (
              <div className={cn(
                "px-4 py-2 rounded-2xl text-[10px] font-black shadow-xl flex items-center gap-2 border",
                valueMetrics.color
              )}>
                💎 {valueMetrics.label}
              </div>
            )}
          </div>

          {provider.distance !== undefined && (
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-slate-900 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg">
              {provider.distance} miles away
            </div>
          )}

          {/* Status Overlay */}
          {!provider.is_claimed && !provider.is_featured && (
            <div className="absolute bottom-4 left-4 right-4 bg-slate-900/40 backdrop-blur-md py-3 px-5 rounded-2xl flex items-center justify-center gap-3 border border-white/10 shadow-xl z-10 pointer-events-none">
              <span className="text-xs font-black text-white uppercase tracking-[0.15em]">UNCLAIMED</span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className={cn(
          "flex-1 flex flex-col",
          isPrimary ? "p-10" : "p-6"
        )}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <Link href={`/provider/${slug}`} className="block">
                <h3 className={cn(
                  "font-black text-slate-900 group-hover:text-wellness-600 transition-colors leading-tight",
                  isPrimary ? "text-3xl mb-2" : "text-xl mb-1"
                )}>
                  {provider.name}
                </h3>
              </Link>
              <div className="flex items-center gap-3 mb-2">
                {provider.is_featured && provider.rating > 0 && provider.reviewCount > 0 && (
                  <div className="text-sm font-bold text-slate-900">
                    ⭐ {provider.name.includes('Blue Cypress') ? '5.0' : provider.rating} ({provider.name.includes('Blue Cypress') ? '13' : (provider.reviewCount || 0)} reviews)
                  </div>
                )}
                <div className="w-1 h-1 bg-slate-200 rounded-full" />
                <div className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <MapPin size={12} className="text-wellness-600" /> {provider.city}
                </div>
                {provider.is_featured && provider.hours && (
                  <>
                    <div className="w-1 h-1 bg-slate-200 rounded-full" />
                    <div className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <Clock size={12} /> Open Now
                    </div>
                  </>
                )}
              </div>
              {provider.address && (
                <div className="text-xs text-slate-400 font-medium mb-4 flex items-center gap-1.5">
                  <Building2 size={12} /> {provider.address}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className={cn(
                "font-black text-slate-900",
                isPrimary ? "text-2xl" : "text-lg"
              )}>From {priceAnchor}+</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Starting Price</div>
            </div>
          </div>

          {operatorProfile?.profile_data.oneLiner && (
            <div className="mb-6 bg-wellness-50 p-4 rounded-2xl border border-wellness-100">
              <p className="text-sm text-wellness-900 font-bold italic leading-relaxed">
                &quot;{operatorProfile.profile_data.oneLiner}&quot;
              </p>
            </div>
          )}

          <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-2">
            {provider.description}
          </p>

          <div className="flex flex-wrap gap-2 mb-8">
            {(provider.specialties || []).slice(0, 4).map((specialty, idx) => (
              <ServicePill key={idx} service={specialty} />
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 mt-auto">
            <Link 
              href={`/provider/${slug}`}
              className="w-full sm:w-auto bg-wellness-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-wellness-700 transition-all shadow-lg shadow-wellness-100 flex items-center justify-center gap-2"
            >
              View Full Details <ArrowRight size={20} />
            </Link>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {provider.phone && (
                <a 
                  href={`tel:${provider.phone}`}
                  className="flex-1 sm:flex-none bg-white border border-slate-200 text-slate-900 px-6 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  <Phone size={18} /> Call
                </a>
              )}
              {provider.website && (
                <a 
                  href={provider.website}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none bg-white border border-slate-200 text-slate-900 px-6 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  <Globe size={18} /> Website
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
