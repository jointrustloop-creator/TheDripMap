import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Sparkles, ArrowRight } from 'lucide-react';
import { Provider, OperatorProfile } from '../types';
import { RatingStars } from './RatingStars';
import { ServicePill } from './ServicePill';
import { slugify } from '../lib/data';
import { cn } from '../lib/utils';

interface ProviderCardFeaturedProps {
  provider: Provider & { matchScore?: number };
  operatorProfile?: OperatorProfile;
  rank?: number;
  isPrimary?: boolean;
}

export const ProviderCardFeatured = ({ provider, operatorProfile, isPrimary = true }: ProviderCardFeaturedProps) => {
  const slug = slugify(provider.name);
  const priceAnchor = provider.priceRange === '$' ? '$99' : provider.priceRange === '$$' ? '$149' : provider.priceRange === '$$$' ? '$199' : '$249';

  return (
    <div className={cn(
      "group relative bg-white rounded-[2.5rem] border overflow-hidden transition-all duration-500",
      isPrimary 
        ? "border-wellness-200 shadow-2xl shadow-wellness-100 ring-1 ring-wellness-100 p-2" 
        : "border-slate-100 shadow-lg hover:shadow-xl hover:border-wellness-100"
    )}>
      <div className={cn(
        "flex flex-col",
        isPrimary ? "md:flex-row" : ""
      )}>
        {/* Image Section */}
        <div className={cn(
          "relative overflow-hidden",
          isPrimary ? "md:w-80 h-72 md:h-auto rounded-[2rem]" : "h-48"
        )}>
          <Image 
            src={provider.imageUrl} 
            alt={`${provider.name} IV therapy clinic in ${provider.city}`}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {isPrimary && (
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-wellness-700 px-4 py-2 rounded-2xl text-xs font-black shadow-xl flex items-center gap-2">
              <Sparkles size={14} /> YOUR BEST MATCH
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
              <h3 className={cn(
                "font-black text-slate-900 group-hover:text-wellness-600 transition-colors leading-tight",
                isPrimary ? "text-3xl mb-2" : "text-xl mb-1"
              )}>
                {provider.name}
              </h3>
              <div className="flex items-center gap-3">
                <RatingStars rating={provider.rating} count={provider.reviewCount} />
                <div className="w-1 h-1 bg-slate-200 rounded-full" />
                <div className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <MapPin size={12} /> {provider.city}
                </div>
              </div>
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
            <a 
              href="#" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full sm:w-auto bg-white border border-slate-200 text-slate-900 px-8 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              Book Now
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
