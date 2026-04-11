import React from 'react';
import { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { 
  MapPin, 
  ShieldCheck, 
  Zap, 
  Activity,
  Clock,
  Building2,
  Home,
  Star,
  CheckCircle2,
  ArrowRight,
  User,
  Check,
  Quote,
  Award,
  Tag,
  MessageSquare,
  ChevronRight
} from 'lucide-react';
import { Navbar } from '../../../src/components/Navbar';
import { Footer } from '../../../src/components/Footer';
import { RatingStars } from '../../../src/components/RatingStars';
import { BreadcrumbNav } from '../../../src/components/BreadcrumbNav';
import { 
  getListingBySlug, 
  slugify, 
  getAllListings, 
  getStateFromProvider, 
  getOperatorProfiles 
} from '../../../src/lib/data';
import { calculateDistance } from '../../../src/lib/geo';
import { cn } from '../../../src/lib/utils';
import Link from 'next/link';

export const revalidate = 86400; // 24 hours

interface ProviderPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateStaticParams() {
  const providers = await getAllListings();
  return providers
    .filter(p => p.name)
    .map((p) => ({
      slug: p.slug || slugify(p.name),
    }));
}

export async function generateMetadata({ params }: ProviderPageProps): Promise<Metadata> {
  const { slug } = await params;
  const provider = await getListingBySlug(slug);
  
  if (!provider) return { title: 'Provider Not Found' };

  return {
    title: `${provider.name} | Best IV Therapy in ${provider.city} | TheDripMap`,
    description: `${provider.name} offers top-rated IV therapy in ${provider.city}. Specialties include ${(provider.specialties || []).slice(0, 3).join(', ')}. Read reviews and book your drip today.`,
    alternates: {
      canonical: `/provider/${slug}`,
    },
  };
}

function getStatus(hours: Record<string, string> | undefined) {
  if (!hours) return { isOpen: false, text: 'Closed', todayHours: 'Closed' };
  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = days[now.getDay()];
  const todayHours = hours[today];
  
  if (!todayHours || typeof todayHours !== 'string' || todayHours.toLowerCase() === 'closed') {
    return { isOpen: false, text: 'Closed', todayHours: 'Closed' };
  }
  
  try {
    const parts = todayHours.split('-');
    if (parts.length < 2) {
      // Handle formats like "Open 24/7" or "By Appointment"
      return { isOpen: true, text: todayHours, todayHours };
    }
    
    const [start, end] = parts.map(t => t.trim());
    const parseTime = (t: string) => {
      if (!t) return new Date();
      const [time, modifier] = t.split(' ');
      if (!time) return new Date();
      
      const [hStr, mStr] = time.split(':');
      let h = parseInt(hStr);
      const m = parseInt(mStr || '0');
      
      if (modifier === 'PM' && h < 12) h += 12;
      if (modifier === 'AM' && h === 12) h = 0;
      
      const d = new Date();
      d.setHours(h, m, 0);
      return d;
    };
    
    const startTime = parseTime(start);
    const endTime = parseTime(end);
    
    if (now >= startTime && now <= endTime) {
      return { isOpen: true, text: 'Open Now', todayHours };
    } else {
      return { isOpen: false, text: `Closed · Opens ${start}`, todayHours };
    }
  } catch {
    return { isOpen: false, text: 'Closed', todayHours: 'Closed' };
  }
}

export default async function ProviderPage({ params, searchParams }: ProviderPageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const provider = await getListingBySlug(slug);
  
  if (!provider) notFound();

  const fromQuiz = sp.from === 'quiz';
  const quizGoal = sp.goal as string;
  const quizType = sp.type as string;
  const quizCity = sp.city as string;
  const userLat = sp.lat ? parseFloat(sp.lat as string) : undefined;
  const userLng = sp.lng ? parseFloat(sp.lng as string) : undefined;

  const profiles = await getOperatorProfiles();
  const profile = profiles.find(p => p.clinicId === provider.id);
  const stateCode = provider.state || getStateFromProvider(provider);
  const stateSlug = slugify(stateCode);
  const citySlug = slugify(provider.city);

  const distance = userLat && userLng && provider.latitude && provider.longitude
    ? calculateDistance(userLat, userLng, provider.latitude, provider.longitude)
    : undefined;

  const status = getStatus(provider.hours);
  const isMobile = provider.mobile_service || provider.type === 'Mobile' || profile?.profile_data?.mobileService;
  const isRN = profile?.credentials?.includes('RN') || profile?.credentials?.includes('NP');

  const allListings = await getAllListings();
  let similarClinics = allListings.filter(p => p.id !== provider.id && p.city === provider.city);
  let similarTitle = `Other IV therapy clinics in ${provider.city}`;
  
  if (similarClinics.length < 3) {
    const stateSimilar = allListings.filter(p => 
      p.id !== provider.id && 
      p.city !== provider.city && 
      (p.state === stateCode || getStateFromProvider(p) === stateCode)
    );
    similarClinics = [...similarClinics, ...stateSimilar].slice(0, 3);
    similarTitle = `Other IV therapy clinics in ${stateCode}`;
  } else {
    similarClinics = similarClinics.slice(0, 3);
  }

  similarClinics.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0) || b.rating - a.rating);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "MedicalBusiness"],
    "name": provider.name,
    "description": provider.description,
    "image": provider.imageUrl,
    "telephone": provider.phone,
    "url": provider.website,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": provider.address,
      "addressLocality": provider.city,
      "addressRegion": stateCode,
      "addressCountry": "US"
    },
    "geo": provider.latitude && provider.longitude ? {
      "@type": "GeoCoordinates",
      "latitude": provider.latitude,
      "longitude": provider.longitude
    } : undefined,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": provider.rating.toString(),
      "reviewCount": provider.reviewCount.toString()
    },
    "priceRange": provider.price_range || provider.priceRange || '$$',
    "openingHoursSpecification": provider.hours ? Object.entries(provider.hours).map(([day, hours]) => {
      if (!hours || typeof hours !== 'string' || hours.toLowerCase() === 'closed') return null;
      const parts = hours.split('-');
      if (parts.length < 2) return null;
      
      const [opens, closes] = parts.map(t => t.trim());
      return {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": day.charAt(0).toUpperCase() + day.slice(1),
        "opens": opens,
        "closes": closes
      };
    }).filter(Boolean) : undefined
  };

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* TOP BAR — MATCH CONTEXT */}
      {fromQuiz && (
        <div className="bg-emerald-600 text-white py-4 px-6">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <CheckCircle2 size={24} className="shrink-0" />
            <div>
              <div className="font-black text-sm uppercase tracking-wider">✓ This clinic matched your profile</div>
              <div className="text-xs opacity-90 font-medium">
                Selected because it offers {quizGoal || 'wellness goals'} and {quizType || 'your preferred delivery'} in {quizCity || provider.city}
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <BreadcrumbNav 
            items={[
              { label: 'IV Therapy', href: '/search' },
              { label: stateCode, href: `/iv-therapy/${stateSlug}` },
              { label: provider.city, href: `/iv-therapy/${stateSlug}/${citySlug}` },
              { label: provider.name }
            ]} 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12">
          {/* Left Column: Content */}
          <div className="space-y-16">
            {/* SECTION 1 — CLINIC HEADER */}
            <section>
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
                {provider.name}
              </h1>
              
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-bold text-slate-500 mb-8">
                <div className="flex items-center gap-2">
                  <RatingStars rating={provider.rating} count={provider.reviewCount} size={18} />
                  <span className="text-slate-400">({provider.reviewCount} reviews)</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-wellness-600" />
                  {provider.city}, {stateCode}
                </div>
                {distance !== undefined && (
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                    <span>{distance.toFixed(1)} miles away</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm",
                  status.isOpen ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"
                )}>
                  <span className={cn("w-2 h-2 rounded-full", status.isOpen ? "bg-emerald-500" : "bg-red-500")} />
                  {status.text}
                </span>

                {isMobile && (
                  <span className="bg-slate-50 text-slate-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-slate-100 flex items-center gap-1.5">
                    <Home size={12} /> Mobile IV
                  </span>
                )}

                {provider.walk_ins_welcome && (
                  <span className="bg-slate-50 text-slate-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-slate-100 flex items-center gap-1.5">
                    <User size={12} /> Walk-ins Welcome
                  </span>
                )}

                {isRN && (
                  <span className="bg-slate-50 text-slate-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-slate-100 flex items-center gap-1.5">
                    <ShieldCheck size={12} /> RN Administered
                  </span>
                )}

                {status.isOpen && (
                  <span className="bg-slate-50 text-slate-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-slate-100 flex items-center gap-1.5">
                    <Zap size={12} /> Same Day
                  </span>
                )}

                {provider.is_featured && (
                  <span className="bg-wellness-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                    <Star size={12} fill="white" /> Featured
                  </span>
                )}

                {provider.is_verified && (
                  <span className="bg-emerald-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                    <Check size={12} /> Verified
                  </span>
                )}
              </div>
            </section>

            {/* SECTION 2 — PHOTO AREA */}
            <section>
              {provider.photos && provider.photos.length > 0 ? (
                <div className="space-y-4">
                  <div className="relative h-[400px] md:h-[500px] rounded-[2.5rem] overflow-hidden shadow-xl">
                    <Image 
                      src={provider.photos[0]} 
                      alt={provider.name}
                      fill
                      className="object-cover"
                      priority
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  {provider.photos.length > 1 && (
                    <div className="grid grid-cols-4 gap-4">
                      {provider.photos.slice(1, 5).map((photo, idx) => (
                        <div key={idx} className="relative h-24 md:h-32 rounded-2xl overflow-hidden border border-slate-100">
                          <Image src={photo} alt={`${provider.name} gallery ${idx}`} fill className="object-cover" referrerPolicy="no-referrer" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative h-[400px] md:h-[500px] rounded-[2.5rem] overflow-hidden bg-wellness-700 flex flex-col items-center justify-center text-white p-12 text-center shadow-xl">
                  <div className="text-[72px] font-black mb-4 leading-none">
                    {(provider.name || 'IV').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="text-lg font-bold mb-12 opacity-90">{provider.name}</div>
                  <div className="absolute bottom-8 text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                    Claim this listing to add your photos
                  </div>
                </div>
              )}
            </section>

            {/* QUICK NAV */}
            <nav className="flex items-center gap-4 overflow-x-auto pb-4 no-scrollbar sticky top-20 z-20 bg-slate-50/80 backdrop-blur-md -mx-4 px-4 sm:mx-0 sm:px-0">
              {[
                { label: 'About', id: 'about' },
                { label: 'Offers', id: 'offers' },
                { label: 'Services', id: 'menu' },
                { label: 'Team', id: 'team' },
                { label: 'Reviews', id: 'reviews' },
                { label: 'Location', id: 'location' }
              ].map((item) => (
                <a 
                  key={item.id} 
                  href={`#${item.id}`}
                  className="whitespace-nowrap px-4 py-2 rounded-full bg-white border border-slate-100 text-xs font-black uppercase tracking-widest text-slate-500 hover:border-wellness-200 hover:text-wellness-600 transition-all shadow-sm"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {/* SECTION 3 — ABOUT THIS CLINIC */}
            {provider.description && provider.description.length > 30 && (
              <section id="about">
                <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">About {provider.name}</h2>
                {profile?.one_liner && (
                  <div className="bg-wellness-50 rounded-3xl p-8 border border-wellness-100 mb-8 relative">
                    <Quote size={40} className="absolute -top-4 -left-2 text-wellness-200 opacity-50" />
                    <p className="text-xl font-bold text-wellness-900 italic leading-relaxed mb-4">
                      &quot;{profile.one_liner}&quot;
                    </p>
                    <div className="text-sm font-black text-wellness-700 uppercase tracking-wider">
                      — {profile.owner_name || profile.ownerName}, {provider.name}
                    </div>
                  </div>
                )}
                <p className="text-lg text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {provider.description}
                </p>
              </section>
            )}

            {/* SECTION 3.5 — SPECIAL OFFERS */}
            {provider.special_offers && provider.special_offers.length > 0 && (
              <section id="offers">
                <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Special Offers & Packages</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {provider.special_offers.map((offer, idx) => (
                    <div key={idx} className="bg-amber-50 rounded-3xl p-8 border border-amber-100 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4">
                        <Tag size={24} className="text-amber-200 group-hover:rotate-12 transition-transform" />
                      </div>
                      <h3 className="text-xl font-black text-amber-900 mb-2">{offer.title}</h3>
                      <p className="text-amber-700 mb-6 font-medium">{offer.description}</p>
                      {offer.code && (
                        <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-amber-200 font-black text-amber-600 uppercase tracking-widest text-xs">
                          Code: {offer.code}
                        </div>
                      )}
                      {offer.expires && (
                        <div className="mt-4 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                          Expires: {offer.expires}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* SECTION 4 — SERVICE MENU */}
            {provider.services && provider.services.length > 0 && (
              <section id="menu">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Service Menu & Pricing</h2>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Prices may vary</span>
                </div>
                <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                  {provider.services.map((item, idx) => (
                    <div key={idx} className="p-8 border-b border-slate-50 last:border-0 hover:bg-slate-50/30 transition-colors group">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-black text-slate-900 group-hover:text-wellness-600 transition-colors">{item.name}</h4>
                            {item.category && (
                              <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                                {item.category}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-500 text-sm leading-relaxed max-w-xl">
                            {item.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-xl font-black text-slate-900">{item.price}</div>
                          <button className="bg-wellness-50 text-wellness-600 p-2 rounded-xl hover:bg-wellness-600 hover:text-white transition-all">
                            <ChevronRight size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* SECTION 4 — SERVICES OFFERED */}
            {provider.specialties && provider.specialties.length > 0 && (
              <section>
                <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Services offered at {provider.name}</h2>
                <div className="flex flex-wrap gap-3">
                  {(provider.specialties || []).map((service, idx) => {
                    const isMobilePill = service === 'Mobile IV';
                    return (
                      <span 
                        key={idx} 
                        className={cn(
                          "px-4 py-2 rounded-xl text-sm font-bold border transition-all",
                          isMobilePill 
                            ? "bg-wellness-600 text-white border-wellness-600 shadow-md" 
                            : "bg-white text-slate-600 border-slate-100 hover:border-slate-300"
                        )}
                      >
                        {service}
                      </span>
                    );
                  })}
                </div>
              </section>
            )}

            {/* SECTION 5 — CLINIC DETAILS GRID */}
            <section>
              <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Clinic details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(provider.price_range || provider.priceRange) && (
                  <DetailCard label="Typical cost" value={provider.price_range || provider.priceRange || '$$'} icon={<Star size={20} />} />
                )}
                {provider.is_claimed && profile?.profile_data?.environment && (
                  <DetailCard 
                    label="Clinic environment" 
                    value={profile.profile_data.environment} 
                    icon={
                      profile.profile_data.environment.includes('Medical') ? <Building2 size={20} /> :
                      profile.profile_data.environment.includes('Spa') ? <Droplets size={20} /> :
                      profile.profile_data.environment.includes('Mobile') ? <Home size={20} /> :
                      <Activity size={20} />
                    } 
                  />
                )}
                {profile?.profile_data?.waitTime && (
                  <DetailCard label="Average wait time" value={profile.profile_data.waitTime} icon={<Clock size={20} />} />
                )}
                {profile?.credentials && (
                  <DetailCard label="Administered by" value={profile.credentials} icon={<ShieldCheck size={20} />} />
                )}
                {isMobile && (
                  <DetailCard label="Service area" value="Comes to your home, hotel, or office" icon={<Home size={20} />} />
                )}
                {provider.walk_ins_welcome && (
                  <DetailCard label="Walk-ins" value="Welcome — no appointment needed" icon={<User size={20} />} />
                )}
              </div>
            </section>

            {/* SECTION 6 — HOURS */}
            {provider.hours && (
              <section>
                <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Hours</h2>
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Day</th>
                        <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                        const dayKey = day.toLowerCase();
                        const hours = provider.hours?.[dayKey] || 'Closed';
                        const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day;
                        
                        return (
                          <tr key={day} className={cn(
                            "border-b border-slate-50 last:border-0 transition-colors",
                            isToday ? "bg-wellness-50/50 border-l-[3px] border-l-wellness-600" : "hover:bg-slate-50/30"
                          )}>
                            <td className={cn("px-8 py-4 font-bold", isToday ? "text-wellness-900" : "text-slate-700")}>{day}</td>
                            <td className={cn(
                              "px-8 py-4 font-medium",
                              hours === 'Closed' ? "text-slate-300" : (isToday ? "text-wellness-700 font-black" : "text-slate-600")
                            )}>{hours}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* SECTION 7 — WHO THIS CLINIC IS BEST FOR */}
            {profile && (
              <section>
                <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Who this clinic is best for</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {profile.profile_data?.typicalPatientAge && (
                    <BestForCard 
                      icon={<User size={24} />} 
                      label="Typical patient" 
                      value={profile.profile_data.typicalPatientAge.join(', ')} 
                    />
                  )}
                  {profile.profile_data?.primarySpecialty && (
                    <BestForCard 
                      icon={<Check size={24} />} 
                      label="Best for" 
                      value={profile.profile_data.primarySpecialty} 
                    />
                  )}
                  {profile.profile_data?.priceRange && (
                    <BestForCard 
                      icon={<span className="text-2xl font-black">💰</span>} 
                      label="Typical spend" 
                      value={profile.profile_data.priceRange} 
                    />
                  )}
                </div>
              </section>
            )}

            {/* SECTION 7.5 — MEDICAL TEAM */}
            {provider.medical_team && provider.medical_team.length > 0 && (
              <section id="team">
                <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Meet the Medical Team</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {provider.medical_team.map((member, idx) => (
                    <div key={idx} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                      <div className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 shadow-lg">
                        <Image 
                          src={member.photo || `https://picsum.photos/seed/${member.name}/200/200`} 
                          alt={member.name}
                          fill
                          className="object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-xl font-black text-slate-900">{member.name}</h4>
                          <Award size={16} className="text-wellness-600" />
                        </div>
                        <div className="text-sm font-black text-wellness-600 uppercase tracking-wider mb-4">{member.role}</div>
                        <p className="text-sm text-slate-500 leading-relaxed">
                          {member.bio}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* SECTION 7.6 — REVIEWS */}
            {provider.reviews_data && provider.reviews_data.length > 0 && (
              <section id="reviews">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Customer Reviews</h2>
                  <div className="flex items-center gap-2">
                    <Star size={20} fill="#EAB308" className="text-yellow-500" />
                    <span className="text-xl font-black text-slate-900">{provider.rating}</span>
                    <span className="text-slate-400 font-bold">({provider.reviewCount} total)</span>
                  </div>
                </div>
                <div className="space-y-6">
                  {provider.reviews_data.map((review, idx) => (
                    <div key={idx} className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm relative">
                      <div className="absolute top-8 right-10 opacity-10">
                        <MessageSquare size={64} />
                      </div>
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-black">
                          {review.author ? review.author[0] : 'U'}
                        </div>
                        <div>
                          <div className="font-black text-slate-900">{review.author || 'Anonymous User'}</div>
                          <div className="text-xs text-slate-400 font-bold">{review.date}</div>
                        </div>
                        <div className="ml-auto flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={14} 
                              fill={i < review.rating ? "#EAB308" : "none"} 
                              className={i < review.rating ? "text-yellow-500" : "text-slate-200"} 
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-600 leading-relaxed font-medium relative z-10">
                        &quot;{review.text}&quot;
                      </p>
                    </div>
                  ))}
                  <button className="w-full py-4 text-sm font-black text-slate-400 uppercase tracking-[0.2em] hover:text-wellness-600 transition-colors">
                    Load More Reviews
                  </button>
                </div>
              </section>
            )}

            {/* SECTION 8 — VERIFIED PROVIDER DETAILS */}
            {provider.is_verified && (
              <section className="bg-emerald-50 rounded-[2.5rem] p-10 border border-emerald-100">
                <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Why this clinic is verified</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12 mb-8">
                  <VerifiedItem label="Phone number confirmed active" />
                  <VerifiedItem label="Business address verified" />
                  <VerifiedItem label="Website verified and active" />
                  <VerifiedItem label="Owner has claimed this listing" />
                  <VerifiedItem label="Staff credentials on file" />
                  <VerifiedItem label="Operating hours confirmed" />
                </div>
                <div className="text-sm font-bold text-emerald-700">
                  Verified by TheDripMap on {provider.claimed_at ? new Date(provider.claimed_at).toLocaleDateString() : 'recent date'}
                </div>
              </section>
            )}

            {/* SECTION 9 — SIMILAR CLINICS */}
            {similarClinics.length > 0 && (
              <section>
                <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">{similarTitle}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {similarClinics.map((clinic) => (
                    <Link 
                      key={clinic.id} 
                      href={`/provider/${clinic.slug || slugify(clinic.name)}`}
                      className="bg-white rounded-3xl border border-slate-100 p-5 hover:shadow-xl transition-all group"
                    >
                      <div className="relative h-32 rounded-2xl overflow-hidden mb-4">
                        <Image src={clinic.imageUrl} alt={clinic.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                      </div>
                      <h4 className="font-black text-slate-900 mb-2 line-clamp-1">{clinic.name}</h4>
                      <div className="flex items-center gap-2 mb-4">
                        <RatingStars rating={clinic.rating} count={clinic.reviewCount} size={14} />
                      </div>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="bg-wellness-50 text-wellness-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                          {(clinic.specialties && clinic.specialties[0]) || 'IV Therapy'}
                        </span>
                        <span className="text-wellness-600 font-black text-xs flex items-center gap-1">
                          View <ArrowRight size={12} />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* SECTION 10 — QUIZ CTA BANNER */}
            <section className="bg-wellness-700 rounded-[2.5rem] p-12 text-center text-white shadow-2xl shadow-wellness-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">Not sure if {provider.name} is right for you?</h2>
                <p className="text-lg opacity-90 mb-10 max-w-xl mx-auto font-medium">
                  Answer 5 quick questions and get matched to the best IV therapy clinic for your specific goals.
                </p>
                <Link 
                  href="/quiz"
                  className="inline-flex items-center gap-2 bg-white text-wellness-700 px-10 py-5 rounded-2xl font-black text-lg hover:scale-105 transition-all shadow-xl"
                >
                  Take the Free Quiz <ArrowRight size={20} />
                </Link>
              </div>
            </section>
          </div>

          {/* Right Column: Sticky Sidebar */}
          <aside className="relative">
            <div className="sticky top-28 space-y-6">
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 space-y-8">
                {/* 1. OPEN STATUS */}
                <div className="text-center pb-4 border-b border-slate-50">
                  <div className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-black uppercase tracking-wider mb-2",
                    status.isOpen ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                  )}>
                    <span className={cn("w-2.5 h-2.5 rounded-full", status.isOpen ? "bg-emerald-500" : "bg-red-500")} />
                    {status.isOpen ? 'Open Now' : 'Closed'}
                  </div>
                  <div className="text-2xl font-black text-slate-900">{status.todayHours}</div>
                </div>

                {/* 2. BOOK APPOINTMENT */}
                {provider.website && (
                  <a 
                    href={provider.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-wellness-700 text-white px-8 py-5 rounded-2xl font-black text-lg hover:bg-wellness-800 transition-all shadow-xl shadow-wellness-100 flex items-center justify-center gap-2"
                  >
                    Book Appointment
                  </a>
                )}

                {/* 3. CALL CLINIC */}
                {provider.phone && (
                  <a 
                    href={`tel:${provider.phone}`}
                    className="w-full bg-white border-2 border-slate-100 text-slate-900 px-8 py-5 rounded-2xl font-black text-lg hover:border-slate-900 transition-all flex items-center justify-center gap-2"
                  >
                    📞 Call Clinic
                  </a>
                )}

                <div className="h-px bg-slate-50" />

                {/* 5. ADDRESS block */}
                <div className="space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Location</div>
                  <div className="flex items-start gap-3 text-slate-900">
                    <MapPin size={20} className="text-wellness-600 shrink-0 mt-1" />
                    <div className="font-bold leading-relaxed">
                      {(provider.address || '').split(',')[0] || 'Address not available'}<br />
                      {provider.city}, {stateCode} {provider.postal_code}
                    </div>
                  </div>
                </div>

                {/* 6. DISTANCE line */}
                {(distance !== undefined || isMobile) && (
                  <div className="flex items-center gap-2 text-sm font-black text-slate-500">
                    <Clock size={16} className="text-slate-300" />
                    {isMobile ? "Comes to you" : `${distance?.toFixed(1)} miles away`}
                  </div>
                )}

                <div className="h-px bg-slate-50" />

                {/* 8. CLAIM / VERIFIED status */}
                <div className="space-y-4">
                  {!provider.is_claimed ? (
                  <Link 
                    href={`/for-clinics/setup?clinicId=${provider.id}&clinicName=${encodeURIComponent(provider.name)}&clinicCity=${encodeURIComponent(provider.city)}&clinicSlug=${slug}`} 
                    className="text-sm font-black text-wellness-600 hover:underline flex items-center gap-2"
                  >
                    Own this clinic? Claim your free listing
                  </Link>
                  ) : !provider.is_verified ? (
                    <div className="text-sm font-bold text-slate-400 flex items-center gap-2">
                      <Check size={16} /> Claimed by owner
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-emerald-600 font-black text-sm flex items-center gap-2">
                        <ShieldCheck size={18} /> Verified Provider
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pl-6">
                        Identity and credentials confirmed
                      </div>
                    </div>
                  )}

                  {/* 9. FEATURED badge */}
                  {provider.is_featured && (
                    <div className="space-y-1">
                      <div className="text-amber-500 font-black text-sm flex items-center gap-2">
                        <Star size={18} fill="currentColor" /> Featured Provider
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pl-6">
                        Priority matched to patients
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* MEDICAL DISCLAIMER */}
        <div className="mt-24 pt-12 border-t border-slate-100 text-center max-w-3xl mx-auto">
          <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
            TheDripMap is an independent directory and matching service. We do not endorse or guarantee any individual clinic. Always verify credentials directly with the provider before booking any treatment.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function DetailCard({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm">
      <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
        {icon}
      </div>
      <div>
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{label}</div>
        <div className="font-bold text-slate-900">{value}</div>
      </div>
    </div>
  );
}

function BestForCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 text-center shadow-sm">
      <div className="w-16 h-16 rounded-2xl bg-wellness-50 flex items-center justify-center text-wellness-600 mx-auto mb-4">
        {icon}
      </div>
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{label}</div>
      <div className="font-black text-slate-900">{value}</div>
    </div>
  );
}

function VerifiedItem({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
        <Check size={12} strokeWidth={4} />
      </div>
      {label}
    </div>
  );
}

function Droplets({ size }: { size: number }) { return <Activity size={size} />; }
