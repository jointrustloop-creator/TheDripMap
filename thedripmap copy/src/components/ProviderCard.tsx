import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star, Clock, ShieldCheck, Zap, Home, Building2, Sparkles } from 'lucide-react';
import { Provider, OperatorProfile } from '../types';
import { RatingStars } from './RatingStars';
import { ServicePill } from './ServicePill';
import { slugify } from '../lib/data';
import { cn } from '../lib/utils';

interface ProviderCardProps {
  provider: Provider;
  operatorProfile?: OperatorProfile;
  className?: string;
}

export const ProviderCard = ({ provider, operatorProfile, className }: ProviderCardProps) => {
  const slug = slugify(provider.name);
  const priceAnchor = provider.priceRange === '$' ? '$99' : provider.priceRange === '$$' ? '$149' : provider.priceRange === '$$$' ? '$199' : '$249';

  return (
    <div className={cn(
      "group relative bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-lg hover:shadow-xl hover:border-wellness-100 transition-all duration-500",
      className
    )}>
      <Link href={`/provider/${slug}`} className="block">
        <div className="relative h-48 overflow-hidden">
          <Image 
            src={provider.imageUrl} 
            alt={`${provider.name} IV therapy clinic in ${provider.city}`}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            {provider.featured && (
              <span className="bg-wellness-600 text-white px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1">
                <Zap size={10} className="fill-white" /> Featured
              </span>
            )}
            {operatorProfile && (
              <span className="bg-amber-500 text-white px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1">
                <Sparkles size={10} className="fill-white" /> Verified Partner
              </span>
            )}
            {provider.type === 'Mobile' && (
              <span className="bg-blue-600 text-white px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1">
                <Home size={10} className="fill-white" /> Mobile IV
              </span>
            )}
            {provider.type === 'In-Clinic' && (
              <span className="bg-slate-800 text-white px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1">
                <Building2 size={10} className="fill-white" /> In-Clinic
              </span>
            )}
          </div>

          {provider.availability && (
            <div className="absolute bottom-4 left-4">
              <span className="bg-emerald-500 text-white px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1">
                <Clock size={10} /> Available Today
              </span>
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-xl font-black text-slate-900 group-hover:text-wellness-600 transition-colors leading-tight">
              {provider.name}
            </h3>
          </div>

          {operatorProfile?.profile_data.oneLiner && (
            <p className="text-sm text-slate-600 mb-4 line-clamp-2 italic font-medium">
              "{operatorProfile.profile_data.oneLiner}"
            </p>
          )}

          <div className="flex items-center gap-3 mb-4">
            <RatingStars rating={provider.rating} count={provider.reviewCount} />
            <div className="w-1 h-1 bg-slate-200 rounded-full" />
            <div className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <MapPin size={12} /> {provider.city}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-6">
            {provider.specialties.slice(0, 3).map((specialty, idx) => (
              <ServicePill key={idx} service={specialty} />
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-50">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Starting From</span>
              <span className="text-lg font-black text-slate-900">{priceAnchor}+</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-wellness-600 uppercase tracking-widest">View Details</span>
              <div className="w-8 h-8 rounded-full bg-wellness-50 flex items-center justify-center text-wellness-600 group-hover:bg-wellness-600 group-hover:text-white transition-all">
                <Zap size={14} />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};
