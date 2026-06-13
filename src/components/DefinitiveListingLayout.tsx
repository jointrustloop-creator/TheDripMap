/**
 * Definitive listing template for claimed clinics.
 * Ported from design-reference.html.html — editorial layout with green stage,
 * gallery, at-a-glance, safety verified module, drip menu, hours, location,
 * nearby clinics, and sticky booking sidebar.
 *
 * Used for any provider with is_claimed=true (both grandfathered Featured and
 * future FREE-tier claimed). Unclaimed listings continue to render via the
 * existing code path in app/providers/[slug]/page.tsx.
 *
 * Every section hides itself gracefully when data is missing.
 */
import React from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Star,
  MapPin,
  Sparkles,
  Stethoscope,
  Building2,
  DollarSign,
  Phone,
  MessageCircle,
  Map as MapIcon,
  LayoutGrid,
  Droplets,
  Heart,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { ResilientImage } from './ResilientImage';
import { MessageClinicButton } from './MessageClinicButton';
import { SubmitTestimonialButton } from './SubmitTestimonialButton';
import { TreatmentDefinitionDisclosure } from './TreatmentDefinitionDisclosure';
import { findDefinition } from '../lib/treatment-definitions';
import TrackedLink from './TrackedLink';
import type { Provider, OperatorProfile } from '../types';

const DEFAULT_CLINIC_IMAGE = '/og-image.png';

interface SafetyResult {
  key: string;
  label: string;
  detail: string;
  passed: boolean;
}

interface ProviderStatus {
  isOpen: boolean;
  text: string;
  todayHours: string;
}

interface SimilarClinic {
  name: string;
  slug: string;
  city: string;
  state?: string | null;
  specialties?: string[];
}

interface Props {
  provider: Provider;
  profile: OperatorProfile | undefined;
  safetyResults: SafetyResult[];
  safetyVerified: boolean;
  status: ProviderStatus;
  displayName: string;
  displayRating: number;
  displayReviewCount: number;
  stateCode: string;
  cityLabel: string;
  initials: string;
  similarClinics: SimilarClinic[];
  citySlug: string;
}

// Region → regulator line. Localizes the State board criterion in the Safety
// Verified module. Falls back to a generic label if not mapped.
const REGULATOR_MAP: Record<string, string> = {
  // Canadian provinces, nursing or naturopathic boards depending on primary
  // admin type, simplified to one line per province.
  ON: 'College of Nurses of Ontario',
  BC: 'CCHPBC (BC Naturopathic Doctors)',
  AB: 'College of Physicians and Surgeons of Alberta',
  QC: 'Ordre des infirmières et infirmiers du Québec',
  MB: 'College of Registered Nurses of Manitoba',
  SK: 'Saskatchewan Registered Nurses Association',
  NS: 'Nova Scotia College of Nursing',
  NB: 'Nurses Association of New Brunswick',
  NL: 'College of Registered Nurses of Newfoundland and Labrador',
  PE: 'College of Registered Nurses of Prince Edward Island',
  // US, generic for top targets
  NY: 'New York State Education Department, Office of the Professions',
  CA: 'California Board of Registered Nursing',
  TX: 'Texas Board of Nursing',
  FL: 'Florida Board of Nursing',
};

// Normalize either a 2-letter code or a full province/state name to the
// 2-letter code used by REGULATOR_MAP. Some providers store "Ontario",
// others store "ON" — be defensive.
const STATE_NAME_TO_CODE: Record<string, string> = {
  ontario: 'ON',
  'british columbia': 'BC',
  alberta: 'AB',
  quebec: 'QC',
  québec: 'QC',
  manitoba: 'MB',
  saskatchewan: 'SK',
  'nova scotia': 'NS',
  'new brunswick': 'NB',
  'newfoundland and labrador': 'NL',
  'prince edward island': 'PE',
};

// providers.regulator_override (TEXT, nullable) is the operator-specified
// regulator string used verbatim. Added 2026-06-02 for clinics whose primary
// admin type doesn't match the province default (e.g. an Ontario naturopath
// clinic where REGULATOR_MAP['ON'] would otherwise be the nursing college).
function regulatorLine(stateCode: string, override?: string | null): string {
  if (typeof override === 'string' && override.trim()) return override.trim();
  const raw = (stateCode || '').trim();
  const code = raw.length === 2 ? raw.toUpperCase() : (STATE_NAME_TO_CODE[raw.toLowerCase()] || raw.toUpperCase());
  return REGULATOR_MAP[code] || 'State or provincial professional board';
}

// Case-insensitive dedupe that preserves the first cased version seen.
function dedupeCi(items: string[]): string[] {
  const seen = new Map<string, string>();
  for (const it of items) {
    const k = it.trim().toLowerCase();
    if (!k) continue;
    if (!seen.has(k)) seen.set(k, it.trim());
  }
  return Array.from(seen.values());
}

interface DripItem { name: string; price?: string | null }

function buildDripMenu(provider: Provider): DripItem[] {
  type ServiceItem = { name?: string; price?: string | null };
  const rawServices = (provider as { services?: unknown }).services;
  const structured: ServiceItem[] = Array.isArray(rawServices)
    ? rawServices.filter((s): s is ServiceItem =>
        !!s && typeof s === 'object' && typeof (s as ServiceItem).name === 'string'
      )
    : [];

  // Merge structured services + plain specialty strings, key on lowercased name.
  const seen = new Map<string, DripItem>();
  for (const s of structured) {
    if (!s.name) continue;
    const k = s.name.trim().toLowerCase();
    if (!seen.has(k)) seen.set(k, { name: s.name.trim(), price: s.price || null });
  }
  for (const sp of provider.specialties || []) {
    if (typeof sp !== 'string') continue;
    const k = sp.trim().toLowerCase();
    if (!seen.has(k)) seen.set(k, { name: sp.trim() });
  }
  return Array.from(seen.values());
}

const FACT_HOURS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const DAY_LABEL: Record<typeof FACT_HOURS_ORDER[number], string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday',
  friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
};

function isClosedHours(value: string | undefined | null): boolean {
  if (!value) return true;
  return /^closed$/i.test(value.trim());
}

function bestForLabel(provider: Provider, profile: OperatorProfile | undefined): string | null {
  const pd = (profile?.profile_data || {}) as Record<string, unknown>;
  const primary = pd.primarySpecialty;
  if (typeof primary === 'string' && primary.trim()) return primary.trim();
  const first = (provider.specialties || [])[0];
  return first ? String(first) : null;
}

function administeredByLabel(profile: OperatorProfile | undefined): string | null {
  const pd = (profile?.profile_data || {}) as Record<string, unknown>;
  const administerType = pd.administerType;
  if (typeof administerType === 'string' && administerType.trim()) return administerType.trim();
  return null;
}

function settingLabel(profile: OperatorProfile | undefined, provider: Provider): string | null {
  const pd = (profile?.profile_data || {}) as Record<string, unknown>;
  const env = pd.environment;
  const walkIns = pd.walkInsWelcome === true;
  if (typeof env === 'string' && env.trim()) {
    return walkIns ? `${env.trim()} · walk-ins welcome` : `${env.trim()}, by appointment`;
  }
  if (provider.mobile_service) return 'Mobile / in-home service';
  return null;
}

function priceRangeLabel(provider: Provider): string | null {
  if (provider.price_range && typeof provider.price_range === 'string') {
    return `${provider.price_range} per drip`;
  }
  return null;
}

function aboutHeadline(provider: Provider, profile: OperatorProfile | undefined): string {
  const pd = (profile?.profile_data || {}) as Record<string, unknown>;
  const primary = (typeof pd.primarySpecialty === 'string' && pd.primarySpecialty) || (provider.specialties || [])[0] || 'IV therapy';
  const env = (typeof pd.environment === 'string' && pd.environment) || 'medical clinic';
  return `${primary} in a ${env.toLowerCase()}`;
}

function ownerQuote(profile: OperatorProfile | undefined): { text: string; name?: string; title?: string } | null {
  const pd = (profile?.profile_data || {}) as Record<string, unknown>;
  const text = (typeof pd.oneLiner === 'string' && pd.oneLiner)
    || (typeof pd.founderStatement === 'string' && pd.founderStatement)
    || null;
  if (!text) return null;
  const name = typeof pd.ownerName === 'string' ? pd.ownerName : (profile?.owner_name as string | undefined);
  const credentials = typeof pd.medicalDirectorCredentials === 'string' ? pd.medicalDirectorCredentials : undefined;
  const fullName = name + (credentials && !name?.includes(credentials) ? `, ${credentials}` : '');
  return { text, name: fullName?.trim(), title: 'Medical Director' };
}

function getInitials(name?: string): string {
  if (!name) return 'C';
  const words = name.trim().split(/\s+/).filter((w) => !['the', 'a', 'an'].includes(w.toLowerCase()));
  return ((words[0]?.[0] || '') + (words[1]?.[0] || '')).toUpperCase().slice(0, 2) || 'C';
}

export default function DefinitiveListingLayout({
  provider,
  profile,
  safetyResults,
  safetyVerified,
  status,
  displayName,
  displayRating,
  displayReviewCount,
  stateCode,
  cityLabel,
  initials,
  similarClinics,
  citySlug,
}: Props) {
  const photos = Array.isArray(provider.photos)
    ? (provider.photos as unknown[]).filter((p): p is string =>
        typeof p === 'string' && p.length > 0 && !p.includes('picsum.photos') && !p.includes('unsplash.com')
      )
    : [];
  const galleryPhotos = photos.slice(0, 5);
  const allPhotos = photos.slice(0, 12);
  const hasGallery = galleryPhotos.length >= 3;

  const drips = buildDripMenu(provider);
  const dripNames = dedupeCi(drips.map((d) => d.name));
  const dripByName = new Map(drips.map((d) => [d.name.trim().toLowerCase(), d]));

  const bestFor = bestForLabel(provider, profile);
  const administeredBy = administeredByLabel(profile);
  const setting = settingLabel(profile, provider);
  const price = priceRangeLabel(provider);
  const glanceCells = [
    bestFor && { key: 'Best for', value: bestFor, icon: Sparkles },
    administeredBy && { key: 'Administered by', value: administeredBy, icon: Stethoscope },
    setting && { key: 'Setting', value: setting, icon: Building2 },
    price && { key: 'Price range', value: price, icon: DollarSign },
  ].filter(Boolean) as { key: string; value: string; icon: React.ComponentType<{ size?: number; className?: string }> }[];

  const quote = ownerQuote(profile);
  const headline = aboutHeadline(provider, profile);

  // Current weekday for hours highlighting (lowercased).
  const todayKey = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as typeof FACT_HOURS_ORDER[number];

  // Hours: build today-first ordered list, only days the operator provided.
  const hoursMap = (provider.hours || {}) as Record<string, string>;
  const orderedDays: typeof FACT_HOURS_ORDER[number][] = todayKey && FACT_HOURS_ORDER.includes(todayKey)
    ? [todayKey, ...FACT_HOURS_ORDER.filter((d) => d !== todayKey)]
    : [...FACT_HOURS_ORDER];
  const hoursToRender = orderedDays
    .filter((d) => hoursMap[d] !== undefined && hoursMap[d] !== null && String(hoursMap[d]).trim() !== '')
    .map((d) => ({ key: d, label: DAY_LABEL[d], value: hoursMap[d] }));

  // Directions URL (Google Maps). Prefer lat/lng if both, else address string.
  const addressLine = provider.address || '';
  const directionsHref = provider.latitude && provider.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${provider.latitude},${provider.longitude}`
    : addressLine
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addressLine + ', ' + provider.city + ', ' + stateCode)}`
    : null;

  // Booking primary CTA → online_booking_url, else phone, else nothing.
  // online_booking_url + email are real DB columns but not in the type — cast.
  const extraFields = provider as unknown as { online_booking_url?: string; email?: string };
  const bookingHref = extraFields.online_booking_url || null;
  const clinicEmail = extraFields.email || null;
  const phoneHref = provider.phone ? `tel:${provider.phone.replace(/[^+\d]/g, '')}` : null;

  // Sticky booking head subtitle: city + province only.
  const stickySubtitle = `${cityLabel}, ${stateCode}`;

  return (
    <div className="bg-[#f8f5ee] text-[#19241c] font-[var(--font-hanken)] antialiased">
      {/* ───────────────────────── STAGE ───────────────────────── */}
      <div className="bg-[#1f3a27] text-[#f3efe2] relative overflow-hidden">
        {/* Layered ambient: warm gold key light upper-right, cool depth lower-left */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(120% 100% at 88% -20%, rgba(216,184,120,.16), transparent 58%)' }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(90% 90% at 0% 120%, rgba(47,84,54,.55), transparent 60%)' }} />
        {/* Fine dot texture, masked to fade at edges */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #f3efe2 1px, transparent 1px)', backgroundSize: '30px 30px', maskImage: 'radial-gradient(ellipse 80% 70% at 50% 40%, black, transparent 78%)', WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 40%, black, transparent 78%)' }} />
        {/* Hairline gold rule along the bottom edge for a finished transition */}
        <div className="absolute inset-x-0 bottom-0 h-px pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(216,184,120,.5), transparent)' }} />
        <section className="relative z-[2] max-w-[1140px] mx-auto px-[30px] pt-[26px] pb-[40px]">
          {/* Breadcrumb */}
          <nav className="text-[12.5px] text-[#c4c9b8] mb-7">
            <Link href="/" className="hover:text-[#f3efe2]">Home</Link>
            <span className="mx-2">·</span>
            <Link href="/search" className="hover:text-[#f3efe2]">IV therapy</Link>
            <span className="mx-2">·</span>
            <Link href={`/cities/${citySlug}`} className="hover:text-[#f3efe2]">{cityLabel}</Link>
            <span className="mx-2">·</span>
            <span className="text-[#f3efe2]">{displayName}</span>
          </nav>

          {/* Identity */}
          <div className="flex gap-6 md:gap-7 items-center">
            {/* Logo card: cream surface + object-contain so wordmark logos show
                in full instead of being cropped into a circle. Gold ring +
                soft drop shadow read premium. Initials fallback for clinics
                with no logo asset stays in brand green. */}
            <div className="flex-none w-[92px] h-[92px] md:w-[104px] md:h-[104px] rounded-[24px] bg-[#fffefa] flex items-center justify-center border border-[rgba(216,184,120,0.5)] ring-1 ring-[rgba(216,184,120,0.18)] shadow-[0_20px_44px_-20px_rgba(0,0,0,0.6)] overflow-hidden">
              {provider.imageUrl ? (
                <ResilientImage
                  src={provider.imageUrl}
                  fallbackSrc={DEFAULT_CLINIC_IMAGE}
                  alt={`${provider.name} logo`}
                  width={104}
                  height={104}
                  fill={false}
                  className="w-full h-full object-contain p-[11px]"
                />
              ) : (
                <span className="font-[var(--font-fraunces)] text-[40px] font-light text-[#1f3a27]">{initials || getInitials(provider.name)}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex gap-2 mb-[15px] flex-wrap">
                <span className="inline-flex items-center gap-[7px] text-xs font-medium py-[6px] px-[13px] rounded-full border border-[rgba(243,239,226,0.25)] text-[#f3efe2]">
                  <CheckCircle2 size={14} /> Verified &amp; claimed
                </span>
                {safetyVerified && (
                  <a href="#safety-verified" className="inline-flex items-center gap-[7px] text-xs font-medium py-[6px] px-[13px] rounded-full border border-[rgba(216,184,120,0.55)] text-[#d8b878] hover:bg-[rgba(216,184,120,0.08)] transition-colors">
                    <ShieldCheck size={14} /> Safety verified · 5 of 5
                  </a>
                )}
              </div>
              <h1 className="font-[var(--font-fraunces)] text-[34px] md:text-[46px] leading-[1.03] font-light tracking-tight text-[#fefdf8]">{displayName}</h1>
              <div className="flex flex-wrap mt-[18px] items-center">
                {displayRating > 0 && displayReviewCount > 0 && (
                  <span className="text-sm text-[#c4c9b8] font-medium px-4 flex items-center gap-[7px] first:pl-0 border-l border-[rgba(243,239,226,0.18)] first:border-l-0">
                    <span className="text-[#d8b878]">★</span> <b className="text-[#f3efe2] font-semibold">{displayRating.toFixed(1)}</b> · {displayReviewCount} reviews
                  </span>
                )}
                <span className="text-sm text-[#c4c9b8] font-medium px-4 flex items-center gap-[7px] first:pl-0 border-l border-[rgba(243,239,226,0.18)] first:border-l-0">
                  <MapPin size={15} /> {cityLabel}, {stateCode}
                </span>
                <span className="text-sm text-[#c4c9b8] font-medium px-4 flex items-center gap-[7px] border-l border-[rgba(243,239,226,0.18)]">
                  <span className={`w-[7px] h-[7px] rounded-full inline-block ${status.isOpen ? 'bg-emerald-400' : 'bg-[#d8b878]'}`} />
                  {status.text}
                </span>
                {provider.price_range && (
                  <span className="text-sm text-[#c4c9b8] font-medium px-4 flex items-center gap-[7px] border-l border-[rgba(243,239,226,0.18)]">
                    <b className="text-[#f3efe2] font-semibold">{provider.price_range}</b> typical
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ───────────────────────── GALLERY ───────────────────────── */}
      {hasGallery && (
        <div className="relative z-[3] -mt-[22px]">
          <div className="max-w-[1140px] mx-auto px-[30px]">
            <div className="grid grid-cols-2 md:grid-cols-[1.6fr_1fr_1fr] grid-rows-[160px_110px_110px] md:grid-rows-[128px_128px] gap-3 relative">
              {galleryPhotos.map((photo, idx) => {
                const isLeader = idx === 0;
                const cornerClasses = [
                  'rounded-tl-[18px] rounded-bl-[18px] md:rounded-tl-[20px] md:rounded-bl-[20px]', // first
                  '',
                  'rounded-tr-[20px]',                                                              // top-right
                  '',
                  'rounded-bl-[18px] md:rounded-bl-none md:rounded-br-[20px]',                      // bottom-right
                ];
                return (
                  <div
                    key={photo + idx}
                    className={`relative overflow-hidden border border-[rgba(25,36,28,0.09)] ${isLeader ? 'col-span-2 md:col-span-1 row-span-1 md:row-span-2' : ''} ${cornerClasses[idx] || ''}`}
                  >
                    <ResilientImage
                      src={photo}
                      fallbackSrc={DEFAULT_CLINIC_IMAGE}
                      alt={`${provider.name} photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                );
              })}
              {allPhotos.length > 5 && (
                <button className="absolute right-[18px] bottom-[16px] bg-[#fffefa] border border-[rgba(25,36,28,0.15)] rounded-[10px] py-[9px] px-[15px] text-[13px] font-semibold inline-flex items-center gap-[7px] shadow-sm cursor-default">
                  <LayoutGrid size={15} /> {allPhotos.length} photos
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────── MAIN GRID ───────────────────────── */}
      <div className="max-w-[1140px] mx-auto px-[30px]">
        <div className={`grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_372px] gap-[32px] lg:gap-[54px] items-start ${hasGallery ? 'pt-[46px]' : 'pt-[40px]'} pb-[80px]`}>

          <main>
            {/* ── At a glance ── */}
            {glanceCells.length > 0 && (
              <section className="mb-[46px]">
                <div className="bg-[#fffefa] border border-[rgba(25,36,28,0.09)] rounded-[20px] shadow-[0_12px_34px_-20px_rgba(25,40,28,0.4)] overflow-hidden">
                  <div className="grid" style={{ gridTemplateColumns: `repeat(${Math.min(glanceCells.length, 4)}, minmax(0, 1fr))` }}>
                    {glanceCells.map(({ key, value, icon: Icon }, i) => (
                      <div key={key} className={`min-w-0 px-[22px] py-[21px] ${i > 0 ? 'border-l border-[rgba(25,36,28,0.07)]' : ''}`}>
                        <div className="text-[10.5px] tracking-[0.12em] uppercase text-[#b08a3e] font-semibold mb-[10px]">{key}</div>
                        <div className="text-[15px] font-semibold flex items-start gap-2 leading-snug break-words">
                          <Icon size={18} className="text-[#2f5436] flex-none mt-[1px]" />
                          <span>{value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* ── About + Owner quote ── */}
            {(provider.description || quote) && (
              <section className="mb-[46px]">
                <div className="text-[11.5px] tracking-[0.18em] uppercase text-[#b08a3e] font-semibold inline-flex items-center gap-[10px] mb-[14px] before:content-[''] before:w-[22px] before:h-[1px] before:bg-[#b08a3e]">About</div>
                <h2 className="font-[var(--font-fraunces)] text-[28px] font-normal tracking-tight mb-4 leading-[1.15]">{headline}</h2>
                {provider.description && (
                  <p className="text-[16.5px] text-[#37423a] leading-[1.78]">{provider.description}</p>
                )}
                {quote && (
                  <div className="pl-[28px] mt-6 border-l-2 border-[#b08a3e]">
                    <p className="font-[var(--font-fraunces)] text-[21px] italic leading-[1.42] text-[#1f3a27]">&ldquo;{quote.text}&rdquo;</p>
                    {(quote.name || quote.title) && (
                      <div className="flex items-center gap-3 mt-4">
                        <div className="w-[38px] h-[38px] rounded-full bg-[#1f3a27] text-[#d8b878] flex items-center justify-center font-medium text-[13px]">
                          {getInitials(quote.name)}
                        </div>
                        <div>
                          {quote.name && <b className="font-semibold text-sm block">{quote.name}</b>}
                          {quote.title && <span className="text-[12.5px] text-[#5c685e]">{quote.title} · {provider.name}</span>}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* ── Safety Verified ── */}
            {safetyVerified && (
              <section id="safety-verified" className="mb-[46px] scroll-mt-24">
                <div className="bg-[#1f3a27] text-[#f3efe2] rounded-[22px] p-[30px_32px] relative overflow-hidden">
                  <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(90% 120% at 100% 0, rgba(216,184,120,.14), transparent 55%)' }} />
                  <div className="flex items-center gap-[13px] mb-[6px] relative">
                    <div className="w-[44px] h-[44px] rounded-full bg-[rgba(216,184,120,0.16)] text-[#d8b878] flex items-center justify-center border border-[rgba(216,184,120,0.4)]">
                      <ShieldCheck size={22} />
                    </div>
                    <div>
                      <h2 className="font-[var(--font-fraunces)] text-white text-[24px] font-normal leading-tight">Safety verified · 5 of 5</h2>
                      <small className="text-[12.5px] text-[#c4c9b8] block mt-[2px]">The standard every clinic confirms before earning this badge</small>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px_26px] mt-[22px] relative">
                    {safetyResults.map((c, idx) => {
                      const regOverride = (provider as unknown as { regulator_override?: string | null }).regulator_override;
                      const label = c.key === 'verifiedStateBoard' ? regulatorLine(stateCode, regOverride) : c.label;
                      return (
                        <div key={c.key} className="flex gap-[11px] items-start">
                          <CheckCircle2 size={18} className="text-[#d8b878] flex-none mt-[2px]" />
                          <div>
                            <b className="font-medium text-sm text-white block">{idx === 4 ? 'Provincial board standing' : c.label}</b>
                            <span className="text-[12.5px] text-[#c4c9b8] leading-[1.45]">
                              {c.key === 'verifiedStateBoard' ? `In good standing with ${label}.` : c.detail}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-[rgba(196,201,184,0.7)] mt-5 relative">
                    Self-attested by the clinic operator. TheDripMap does not perform on-site audits.
                  </p>
                </div>
              </section>
            )}

            {/* ── Drip menu ── */}
            {dripNames.length > 0 && (
              <section className="mb-[46px]">
                <div className="text-[11.5px] tracking-[0.18em] uppercase text-[#b08a3e] font-semibold inline-flex items-center gap-[10px] mb-[14px] before:content-[''] before:w-[22px] before:h-[1px] before:bg-[#b08a3e]">Drip menu</div>
                <h2 className="font-[var(--font-fraunces)] text-[28px] font-normal tracking-tight mb-4 leading-[1.15]">Treatments offered</h2>
                <div className="grid gap-[10px]" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))' }}>
                  {dripNames.map((name) => {
                    const meta = dripByName.get(name.trim().toLowerCase());
                    const def = findDefinition(name);
                    return (
                      <TreatmentDefinitionDisclosure
                        key={name}
                        name={name}
                        definition={def}
                        price={meta?.price ?? null}
                        variant="claimed"
                      />
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── Reviews ── */}
            {(displayRating > 0 && displayReviewCount > 0) && (
              <section className="mb-[46px]">
                <div className="text-[11.5px] tracking-[0.18em] uppercase text-[#b08a3e] font-semibold inline-flex items-center gap-[10px] mb-[14px] before:content-[''] before:w-[22px] before:h-[1px] before:bg-[#b08a3e]">Reviews</div>
                <div className="flex gap-[30px] items-center bg-[#fffefa] border border-[rgba(25,36,28,0.09)] rounded-[18px] py-[26px] px-[30px] flex-wrap">
                  <div>
                    <div className="font-[var(--font-fraunces)] text-[54px] font-light leading-none text-[#1f3a27]">{displayRating.toFixed(1)}</div>
                    <div className="text-[#b08a3e] text-lg tracking-[2px]">★★★★★</div>
                    <div className="text-[13px] text-[#5c685e] mt-[6px]">{displayReviewCount} Google reviews</div>
                  </div>
                  <div className="w-px self-stretch bg-[rgba(25,36,28,0.09)]" />
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-[14.5px] text-[#5c685e] mb-[14px]">
                      Patients rate this clinic {displayRating.toFixed(1)} out of 5 across {displayReviewCount} verified Google reviews. Visited recently?
                    </p>
                    <SubmitTestimonialButton
                      provider={provider}
                      className="inline-flex items-center gap-2 border border-[rgba(25,36,28,0.15)] rounded-[10px] py-[11px] px-[18px] text-sm font-semibold cursor-pointer hover:bg-[#ebf1e5] hover:border-[#d4e0cb] transition"
                      label="Share your experience"
                    />
                  </div>
                </div>
              </section>
            )}

            {/* ── Hours + Location ── */}
            {(hoursToRender.length > 0 || provider.address || (provider.latitude && provider.longitude)) && (
              <section className="mb-[46px]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[30px]">
                  {hoursToRender.length > 0 && (
                    <div>
                      <div className="text-[11.5px] tracking-[0.18em] uppercase text-[#b08a3e] font-semibold inline-flex items-center gap-[10px] mb-[14px] before:content-[''] before:w-[22px] before:h-[1px] before:bg-[#b08a3e]">Hours</div>
                      {hoursToRender.map(({ key, label, value }) => {
                        const closed = isClosedHours(value);
                        const isToday = key === todayKey;
                        return (
                          <div key={key} className={`flex justify-between py-3 px-4 rounded-[10px] text-[14.5px] ${isToday ? 'bg-[#ebf1e5] font-semibold' : ''}`}>
                            <span>{label}</span>
                            <span className={isToday ? 'text-[#1f3a27]' : 'text-[#5c685e]'}>
                              {closed ? 'Closed' : value}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {(provider.address || (provider.latitude && provider.longitude)) && (
                    <div>
                      <div className="text-[11.5px] tracking-[0.18em] uppercase text-[#b08a3e] font-semibold inline-flex items-center gap-[10px] mb-[14px] before:content-[''] before:w-[22px] before:h-[1px] before:bg-[#b08a3e]">Location</div>
                      {provider.latitude && provider.longitude ? (
                        <TrackedLink
                          providerId={provider.id}
                          eventType="directions_click"
                          href={directionsHref || `https://www.google.com/maps/search/?api=1&query=${provider.latitude},${provider.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block h-[182px] rounded-[16px] border border-[rgba(25,36,28,0.09)] overflow-hidden bg-[#ebf1e5] mt-2 relative group"
                          ariaLabel={`Open map of ${provider.name} location in Google Maps`}
                        >
                          {process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ? (
                            <ResilientImage
                              src={`https://api.mapbox.com/styles/v1/mapbox/light-v11/static/pin-s+1f3a27(${provider.longitude},${provider.latitude})/${provider.longitude},${provider.latitude},14,0/700x300@2x?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`}
                              alt={`${provider.name} map location`}
                              fill
                              className="object-cover"
                              fallbackSrc={DEFAULT_CLINIC_IMAGE}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-[#5c685e] text-sm font-medium">
                              <MapIcon size={24} className="mr-2" /> Open in Google Maps
                            </div>
                          )}
                        </TrackedLink>
                      ) : (
                        <div className="h-[182px] rounded-[16px] border border-[rgba(25,36,28,0.09)] bg-[#ebf1e5] flex items-center justify-center text-[#a8b69b] mt-2">
                          <MapIcon size={24} />
                        </div>
                      )}
                      {provider.address && (
                        <div className="text-[14.5px] text-[#5c685e] mt-[14px] leading-[1.55]">
                          <b className="text-[#19241c] font-semibold">{provider.address}</b>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* ── Nearby ── */}
            {similarClinics.length > 0 && (
              <section>
                <div className="text-[11.5px] tracking-[0.18em] uppercase text-[#b08a3e] font-semibold inline-flex items-center gap-[10px] mb-[14px] before:content-[''] before:w-[22px] before:h-[1px] before:bg-[#b08a3e]">Nearby</div>
                <h2 className="font-[var(--font-fraunces)] text-[28px] font-normal tracking-tight mb-4 leading-[1.15]">Other IV clinics in {cityLabel}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px]">
                  {similarClinics.slice(0, 4).map((c) => (
                    <Link key={c.slug} href={`/providers/${c.slug}`} className="bg-[#fffefa] border border-[rgba(25,36,28,0.09)] rounded-[15px] p-[18px] hover:border-[#d4e0cb] transition">
                      <div className="font-semibold text-[15px]">{c.name}</div>
                      <div className="text-[12.5px] text-[#919a8d] mt-[3px] mb-[11px]">{c.city}{c.state ? `, ${c.state}` : ''}</div>
                      {Array.isArray(c.specialties) && c.specialties.length > 0 && (
                        <div className="flex gap-[6px] flex-wrap">
                          {dedupeCi(c.specialties).slice(0, 3).map((tag) => (
                            <span key={tag} className="text-[11px] bg-[#ebf1e5] text-[#1f3a27] py-1 px-[10px] rounded-full font-semibold">{tag}</span>
                          ))}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </main>

          {/* ───────────────────────── STICKY BOOKING ASIDE ─────────────────────────
              Sticky lives on the <aside> itself (with self-start so the aside
              doesn't stretch to the row height and so sticky has actual scroll
              runway inside the surrounding grid row). The inner card stays a
              plain block. */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="bg-[#fffefa] border border-[rgba(25,36,28,0.15)] rounded-[22px] overflow-hidden shadow-sm">
              <div className="h-[4px]" style={{ background: 'linear-gradient(90deg, #b08a3e, #d8b878)' }} />
              <div className="p-6">
                <div className="flex gap-3 items-center pb-[18px] border-b border-[rgba(25,36,28,0.09)]">
                  <div className="w-[42px] h-[42px] rounded-full bg-[#1f3a27] text-[#d8b878] flex items-center justify-center font-[var(--font-fraunces)] text-lg">
                    {initials || getInitials(provider.name)}
                  </div>
                  <div>
                    <b className="font-semibold text-[15px] block leading-tight">{displayName}</b>
                    <span className="text-[12.5px] text-[#919a8d]">{stickySubtitle}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-[18px] mb-[14px] text-[13.5px]">
                  <span className={`w-[7px] h-[7px] rounded-full inline-block ${status.isOpen ? 'bg-emerald-500' : 'bg-[#d8b878]'}`} />
                  <span className="font-semibold text-[#b08a3e]">{status.text}</span>
                </div>
                {provider.price_range && (
                  <div className="flex items-baseline justify-between gap-2 mb-[18px] py-[12px] px-[15px] rounded-[13px] bg-[#ebf1e5] border border-[rgba(47,84,54,0.12)]">
                    <span className="text-[12px] uppercase tracking-[0.1em] font-semibold text-[#2f5436]">Typical visit</span>
                    <span className="font-[var(--font-fraunces)] text-[20px] font-normal text-[#1f3a27] leading-none">{provider.price_range}</span>
                  </div>
                )}
                {bookingHref ? (
                  <TrackedLink
                    providerId={provider.id}
                    eventType="book_click"
                    href={bookingHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center py-[15px] rounded-[13px] font-semibold text-[15px] mb-[10px] bg-[#1f3a27] text-[#f3efe2] hover:bg-[#142619] transition"
                  >
                    <Calendar size={15} className="inline-block -mt-1 mr-2" /> Book appointment
                  </TrackedLink>
                ) : phoneHref ? (
                  <TrackedLink
                    providerId={provider.id}
                    eventType="call_click"
                    href={phoneHref}
                    className="block w-full text-center py-[15px] rounded-[13px] font-semibold text-[15px] mb-[10px] bg-[#1f3a27] text-[#f3efe2] hover:bg-[#142619] transition"
                  >
                    <Phone size={15} className="inline-block -mt-1 mr-2" /> Call to book
                  </TrackedLink>
                ) : null}
                {phoneHref && bookingHref && (
                  <TrackedLink
                    providerId={provider.id}
                    eventType="call_click"
                    href={phoneHref}
                    className="block w-full text-center py-[15px] rounded-[13px] font-semibold text-[15px] mb-[10px] border border-[rgba(25,36,28,0.15)] hover:bg-[#ebf1e5] transition"
                  >
                    <Phone size={15} className="inline-block -mt-1 mr-2 text-[#2f5436]" /> Call clinic
                  </TrackedLink>
                )}
                {clinicEmail && (
                  <MessageClinicButton
                    provider={provider}
                    className="block w-full text-center py-[15px] rounded-[13px] font-semibold text-[15px] mb-[10px] border border-[rgba(25,36,28,0.15)] hover:bg-[#ebf1e5] transition cursor-pointer flex items-center justify-center gap-2"
                    label="Message clinic"
                  />
                )}
                <div className="mt-[18px] pt-[18px] border-t border-[rgba(25,36,28,0.09)] text-[13px] text-[#5c685e] leading-[1.55]">
                  {provider.address && (
                    <div>
                      <MapPin size={15} className="inline-block -mt-1 mr-1 text-[#2f5436]" /> {provider.address}
                    </div>
                  )}
                  {directionsHref && (
                    <div className="mt-[5px]">
                      <TrackedLink
                        providerId={provider.id}
                        eventType="directions_click"
                        href={directionsHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#2f5436] font-semibold hover:underline"
                      >
                        Get directions →
                      </TrackedLink>
                    </div>
                  )}
                  {(displayRating > 0 && displayReviewCount > 0) && (
                    <div className="flex justify-between items-center mt-[13px] pt-[13px] border-t border-[rgba(25,36,28,0.09)]">
                      <span>
                        <Star size={13} className="inline-block -mt-0.5 text-[#b08a3e]" fill="currentColor" /> <b className="text-[#19241c] font-semibold">{displayRating.toFixed(1)}</b> <span className="text-[#919a8d]">({displayReviewCount})</span>
                      </span>
                      <span className="text-[#2f5436] font-semibold text-[12.5px] inline-flex items-center gap-1">
                        <CheckCircle2 size={13} /> Verified
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
