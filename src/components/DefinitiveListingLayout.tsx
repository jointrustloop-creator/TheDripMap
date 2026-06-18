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
  ChevronRight,
  Gift,
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

// Display form of a service name: drop a trailing variant suffix after a
// dash so "Medical Aesthetics - Botox", "Medical Aesthetics - PRP", etc. all
// collapse to a single "Medical Aesthetics" entry. The menu de-dupes by this.
function serviceDisplayName(name: string): string {
  return name.split(/\s+[-–—]\s+/)[0].replace(/\s+/g, ' ').trim();
}

function buildDripMenu(provider: Provider): DripItem[] {
  type ServiceItem = { name?: string; price?: string | null };
  const rawServices = (provider as { services?: unknown }).services;
  const structured: ServiceItem[] = Array.isArray(rawServices)
    ? rawServices.filter((s): s is ServiceItem =>
        !!s && typeof s === 'object' && typeof (s as ServiceItem).name === 'string'
      )
    : [];

  // Merge structured services + plain specialty strings, de-duped by display
  // name (case-insensitive) so identical service names collapse to one entry.
  const seen = new Map<string, DripItem>();
  for (const s of structured) {
    if (!s.name) continue;
    const display = serviceDisplayName(s.name);
    const k = display.toLowerCase();
    if (!k) continue;
    const existing = seen.get(k);
    if (!existing) seen.set(k, { name: display, price: s.price || null });
    else if (!existing.price && s.price) existing.price = s.price;
  }
  for (const sp of provider.specialties || []) {
    if (typeof sp !== 'string') continue;
    const display = serviceDisplayName(sp);
    const k = display.toLowerCase();
    if (!k) continue;
    if (!seen.has(k)) seen.set(k, { name: display });
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

// Display a time range with "to", never an en or em dash or a bare hyphen, per
// the content rules. "10:00 AM – 5:00 PM" renders as "10:00 AM to 5:00 PM".
function formatHoursRange(value: string): string {
  return value.replace(/\s*[–—-]\s*/g, ' to ').replace(/\s+/g, ' ').trim();
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

  // Safety: render only the fields the clinic actually confirmed (passed=true),
  // sourced from profile_data. Never the fields it did not confirm, never a
  // default full set, and hide the block entirely if a verified clinic has
  // confirmed none.
  const confirmedSafety = safetyResults.filter((c) => c.passed);
  const showSafety = safetyVerified && confirmedSafety.length > 0;

  // Current weekday for hours highlighting (lowercased).
  const todayKey = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as typeof FACT_HOURS_ORDER[number];

  // Hours: render all seven days, Monday to Sunday, every day present and in
  // order. Today is highlighted in place (see isToday in the render), never
  // pulled out of the array or reordered to the front. A missing or malformed
  // day renders as "Closed" so a bad day can never collapse the list. Open-now
  // is derived separately, from this same data, by getStatus on the page, not
  // by removing the current day.
  const hoursMap = (provider.hours || {}) as Record<string, string>;
  const hasAnyHours = Object.values(hoursMap).some(
    (v) => typeof v === 'string' && v.trim() !== ''
  );
  const hoursToRender = hasAnyHours
    ? FACT_HOURS_ORDER.map((d) => {
        const raw = hoursMap[d];
        const value = typeof raw === 'string' && raw.trim() !== '' ? raw.trim() : 'Closed';
        return { key: d, label: DAY_LABEL[d], value };
      })
    : [];

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

  // Slow-time offer (operator-approved feature). Show the first non-expired
  // offer the owner set via /finish. Expiry enforced here at render time.
  const todayIso = new Date().toISOString().slice(0, 10);
  type Offer = { title?: string; code?: string; expires?: string; active?: boolean };
  const rawOffers = (provider as { special_offers?: Offer[] }).special_offers;
  const activeOffer = Array.isArray(rawOffers)
    ? rawOffers.find((o) => o && typeof o.title === 'string' && o.title.trim() && o.active !== false && (!o.expires || o.expires >= todayIso))
    : null;

  // ── Showcase modules (2026-06-12) ──────────────────────────────────────
  // New patient/owner-value sections previewed on Blue Cypress only, pending
  // operator approval before rollout to all claimed listings. Every value is
  // derived from real provider fields (no medical claims, generic cost
  // framing) so the same code generalizes once the gate is lifted.
  const isShowcase = provider.slug === 'blue-cypress-iv-and-wellness-georgetown';

  // Care team — data-driven from provider.medical_team.
  type TeamMember = { name?: string; role?: string; bio?: string; photo?: string };
  const team: TeamMember[] = Array.isArray(provider.medical_team)
    ? (provider.medical_team as TeamMember[]).filter((m) => m && typeof m.name === 'string' && m.name.trim())
    : [];
  const isRnLed = team.some((m) => /\bRN\b|registered nurse/i.test(`${m.name} ${m.role}`));

  // First-visit walkthrough — logistics only, reassuring, no medical claims.
  const sessionLength = '30 to 60 minutes';
  const firstVisitSteps: { head: string; sub: string }[] = [
    { head: 'Check in', sub: 'Share your goals and a quick health history so your visit can be tailored to you.' },
    { head: 'Get comfortable', sub: `Settle into a lounge chair. Most visits take about ${sessionLength}.` },
    { head: 'Your session', sub: isRnLed ? 'A licensed nurse looks after you and stays close through the session.' : 'Licensed clinical staff look after you through the session.' },
    { head: 'Back to your day', sub: 'Most guests head straight back to work or their plans afterward.' },
  ];

  // Common questions — grounded in real fields. FAQPage schema mirrors these.
  const careLine = isRnLed
    ? `Blue Cypress is founded and led by ${team[0]?.name || 'a registered nurse'}, and visits are overseen by licensed clinical staff.`
    : 'Visits are overseen by licensed clinical staff.';
  const faqItems: { q: string; a: string }[] = [
    provider.price_range ? {
      q: 'How much does a visit cost?',
      a: `Most drips at ${displayName} fall in the ${provider.price_range} range. Pricing depends on the drip you choose, so ask when you book.`,
    } : null,
    { q: 'Who looks after me during my visit?', a: careLine },
    bookingHref ? {
      q: 'Do I need an appointment?',
      a: 'Booking online is the fastest way to reserve a chair, and it only takes a moment. You can also call the clinic directly.',
    } : null,
    { q: 'How long does a session take?', a: `Plan for about ${sessionLength}, depending on the drip you choose.` },
    provider.address ? {
      q: 'Where are you located?',
      a: `${displayName} is at ${provider.address}. Directions are one tap away in the booking panel.`,
    } : null,
    { q: 'Can I use my HSA or FSA card?', a: 'Many guests pay with an HSA or FSA card. Check with the clinic about your specific plan before your visit.' },
  ].filter(Boolean) as { q: string; a: string }[];

  const showcaseFaqJsonLd = isShowcase && faqItems.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  } : null;

  return (
    <div className="bg-[#f8f5ee] text-[#19241c] font-[var(--font-hanken)] antialiased">
      {/* ───────────────────────── STAGE ─────────────────────────
          IV-therapy themed hero: a deep emerald-to-teal fluid gradient with a
          hydration glow, a faint droplet field, and slow IV-drip droplets
          falling from the top. Replaces the former flat solid green.
          All motion respects prefers-reduced-motion. */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes dlhFall { 0% { transform: translateY(-10px) rotate(45deg); opacity: 0 } 16% { opacity: .62 } 78% { opacity: .26 } 100% { transform: translateY(160px) rotate(45deg); opacity: 0 } }
        @keyframes dlhFloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-7px) } }
        @keyframes dlhGlow { 0%,100% { box-shadow: 0 0 0 1px rgba(94,234,212,.5), 0 0 14px rgba(94,234,212,.28) } 50% { box-shadow: 0 0 0 1px rgba(94,234,212,.85), 0 0 26px rgba(94,234,212,.5) } }
        .dlh-chip { animation: dlhGlow 3.2s ease-in-out infinite }
        .dlh-drip { position: absolute; width: 7px; height: 7px; border-radius: 0 50% 50% 50%; background: linear-gradient(135deg, rgba(174,247,228,.92), rgba(45,212,191,.35)); filter: blur(.3px) }
        .dlh-bub { position: absolute; border-radius: 9999px; background: radial-gradient(circle at 35% 30%, rgba(190,242,225,.5), rgba(45,212,191,.06) 70%); animation: dlhFloat 7s ease-in-out infinite }
        @media (prefers-reduced-motion: reduce) { .dlh-chip, .dlh-drip, .dlh-bub { animation: none !important; opacity: .3 } }
      ` }} />
      <div className="relative overflow-hidden text-[#f3efe2]" style={{ background: 'linear-gradient(168deg, #0b211a 0%, #123a2c 48%, #0b3633 100%)' }}>
        {/* Teal hydration key light, upper-left */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(72% 86% at 14% -12%, rgba(45,212,191,.22), transparent 60%)' }} />
        {/* Warm gold accent glow, upper-right (brand) */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(78% 92% at 92% -16%, rgba(216,184,120,.16), transparent 58%)' }} />
        {/* Soft droplet field, masked to fade at edges */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: [
          'radial-gradient(circle at 20% 28%, rgba(190,242,225,.10) 0 5px, transparent 6px)',
          'radial-gradient(circle at 34% 70%, rgba(190,242,225,.07) 0 3px, transparent 4px)',
          'radial-gradient(circle at 58% 22%, rgba(190,242,225,.06) 0 4px, transparent 5px)',
          'radial-gradient(circle at 70% 60%, rgba(190,242,225,.05) 0 6px, transparent 7px)',
          'radial-gradient(circle at 47% 48%, rgba(190,242,225,.05) 0 2px, transparent 3px)',
        ].join(','), maskImage: 'radial-gradient(ellipse 90% 80% at 50% 30%, black, transparent 85%)', WebkitMaskImage: 'radial-gradient(ellipse 90% 80% at 50% 30%, black, transparent 85%)' }} />
        {/* Floating bubbles + falling IV drips */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <span className="dlh-bub" style={{ left: '8%', top: '32%', width: '14px', height: '14px', animationDelay: '0s' }} />
          <span className="dlh-bub" style={{ left: '26%', top: '60%', width: '9px', height: '9px', animationDelay: '1.4s' }} />
          <span className="dlh-bub" style={{ left: '83%', top: '42%', width: '11px', height: '11px', animationDelay: '.7s' }} />
          <span className="dlh-drip" style={{ left: '64%', top: 0, animation: 'dlhFall 7s linear infinite', animationDelay: '0s' }} />
          <span className="dlh-drip" style={{ left: '76%', top: 0, animation: 'dlhFall 8.5s linear infinite', animationDelay: '2.2s' }} />
          <span className="dlh-drip" style={{ left: '88%', top: 0, animation: 'dlhFall 6.5s linear infinite', animationDelay: '4s' }} />
          <span className="dlh-drip" style={{ left: '52%', top: 0, animation: 'dlhFall 9s linear infinite', animationDelay: '3.1s' }} />
        </div>
        {/* Fine texture, masked */}
        <div className="absolute inset-0 opacity-[0.035] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #f3efe2 1px, transparent 1px)', backgroundSize: '30px 30px', maskImage: 'radial-gradient(ellipse 80% 70% at 50% 40%, black, transparent 78%)', WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 40%, black, transparent 78%)' }} />
        {/* Bottom fluid edge: faint teal lift + gold hairline for a finished transition */}
        <div className="absolute inset-x-0 bottom-0 h-24 pointer-events-none" style={{ background: 'linear-gradient(0deg, rgba(12,54,51,.5), transparent)' }} />
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
                <span className="dlh-chip inline-flex items-center gap-[7px] text-xs font-semibold py-[6px] px-[13px] rounded-full border border-[#5eead4] text-[#aef7e4]" style={{ background: 'rgba(45,212,191,0.10)' }}>
                  <CheckCircle2 size={14} className="text-[#5eead4]" /> Verified &amp; claimed
                </span>
                {showSafety && (
                  <a href="#safety-verified" className="inline-flex items-center gap-[7px] text-xs font-medium py-[6px] px-[13px] rounded-full border border-[rgba(216,184,120,0.55)] text-[#d8b878] hover:bg-[rgba(216,184,120,0.08)] transition-colors">
                    <ShieldCheck size={14} /> Safety verified
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
            {/* ── Slow-time offer banner (owner-set via /finish) ── */}
            {activeOffer && (
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify({
                  '@context': 'https://schema.org',
                  '@type': 'Offer',
                  name: activeOffer.title,
                  url: `https://www.thedripmap.com/providers/${provider.slug}`,
                  seller: { '@type': 'MedicalBusiness', name: provider.name },
                  ...(activeOffer.expires ? { availabilityEnds: activeOffer.expires } : {}),
                }) }}
              />
            )}
            {activeOffer && (
              <div className="mb-[34px] flex items-start gap-3.5 rounded-[18px] p-[18px_22px] bg-[#fdf6e7] border border-[#e7cf93]">
                <div className="flex-none w-[42px] h-[42px] rounded-full bg-[#d8b878]/20 text-[#a9772a] flex items-center justify-center">
                  <Gift size={20} />
                </div>
                <div className="min-w-0 pt-[2px]">
                  <div className="text-[10.5px] tracking-[0.14em] uppercase text-[#a9772a] font-bold mb-[3px]">Limited-time offer</div>
                  <div className="text-[16px] font-bold text-[#5a4310] leading-snug">{activeOffer.title}</div>
                  <div className="text-[12.5px] text-[#8a6f3e] mt-[3px] flex flex-wrap gap-x-3">
                    {activeOffer.code && <span>Use code <b className="font-bold">{activeOffer.code}</b></span>}
                    {activeOffer.expires && <span>Ends {activeOffer.expires}</span>}
                  </div>
                </div>
              </div>
            )}

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

            {/* ── Meet your provider (data-driven; gated to showcase for now) ── */}
            {isShowcase && team.length > 0 && (
              <section className="mb-[46px]">
                <div className="text-[11.5px] tracking-[0.18em] uppercase text-[#b08a3e] font-semibold inline-flex items-center gap-[10px] mb-[14px] before:content-[''] before:w-[22px] before:h-[1px] before:bg-[#b08a3e]">Your care team</div>
                <h2 className="font-[var(--font-fraunces)] text-[28px] font-normal tracking-tight mb-5 leading-[1.15]">The people who look after you</h2>
                <div className="grid gap-[14px]">
                  {team.map((m, i) => (
                    <div key={(m.name || '') + i} className="flex gap-[18px] items-start bg-[#fffefa] border border-[rgba(25,36,28,0.09)] rounded-[18px] p-[22px] shadow-[0_10px_30px_-20px_rgba(25,40,28,0.4)]">
                      <div className="flex-none w-[58px] h-[58px] rounded-full bg-[#1f3a27] text-[#d8b878] flex items-center justify-center font-[var(--font-fraunces)] text-[22px] font-light overflow-hidden border border-[rgba(216,184,120,0.4)]">
                        {m.photo ? (
                          <ResilientImage src={m.photo} fallbackSrc={DEFAULT_CLINIC_IMAGE} alt={m.name || 'Team member'} width={58} height={58} fill={false} className="w-full h-full object-cover" />
                        ) : (
                          <span>{getInitials(m.name)}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <b className="font-semibold text-[16px] text-[#19241c]">{m.name}</b>
                          {/\bRN\b|registered nurse/i.test(`${m.name} ${m.role}`) && (
                            <span className="inline-flex items-center gap-[5px] text-[11px] font-semibold py-[3px] px-[9px] rounded-full bg-[#ebf1e5] text-[#2f5436] border border-[rgba(47,84,54,0.15)]">
                              <ShieldCheck size={12} /> Licensed clinician
                            </span>
                          )}
                        </div>
                        {m.role && <div className="text-[12.5px] text-[#b08a3e] font-semibold mt-[3px] uppercase tracking-[0.06em]">{m.role}</div>}
                        {m.bio && <p className="text-[14.5px] text-[#5c685e] leading-[1.6] mt-[10px]">{m.bio}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Safety Verified ── */}
            {showSafety && (
              <section id="safety-verified" className="mb-[46px] scroll-mt-24">
                <div className="bg-[#1f3a27] text-[#f3efe2] rounded-[22px] p-[30px_32px] relative overflow-hidden">
                  <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(90% 120% at 100% 0, rgba(216,184,120,.14), transparent 55%)' }} />
                  <div className="flex items-center gap-[13px] mb-[6px] relative">
                    <div className="w-[44px] h-[44px] rounded-full bg-[rgba(216,184,120,0.16)] text-[#d8b878] flex items-center justify-center border border-[rgba(216,184,120,0.4)]">
                      <ShieldCheck size={22} />
                    </div>
                    <div>
                      <h2 className="font-[var(--font-fraunces)] text-white text-[24px] font-normal leading-tight">Safety verified</h2>
                      <small className="text-[12.5px] text-[#c4c9b8] block mt-[2px]">What {displayName} confirmed on our safety review</small>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px_26px] mt-[22px] relative">
                    {confirmedSafety.map((c) => {
                      const regOverride = (provider as unknown as { regulator_override?: string | null }).regulator_override;
                      const label = c.key === 'verifiedStateBoard' ? regulatorLine(stateCode, regOverride) : c.label;
                      return (
                        <div key={c.key} className="flex gap-[11px] items-start">
                          <CheckCircle2 size={18} className="text-[#d8b878] flex-none mt-[2px]" />
                          <div>
                            <b className="font-medium text-sm text-white block">{c.key === 'verifiedStateBoard' ? 'Provincial board standing' : c.label}</b>
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

            {/* ── Your first visit (logistics walkthrough; gated to showcase) ── */}
            {isShowcase && (
              <section className="mb-[46px]">
                <div className="text-[11.5px] tracking-[0.18em] uppercase text-[#b08a3e] font-semibold inline-flex items-center gap-[10px] mb-[14px] before:content-[''] before:w-[22px] before:h-[1px] before:bg-[#b08a3e]">Your first visit</div>
                <h2 className="font-[var(--font-fraunces)] text-[28px] font-normal tracking-tight mb-5 leading-[1.15]">What to expect, start to finish</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px]">
                  {firstVisitSteps.map((s, i) => (
                    <div key={s.head} className="flex gap-[16px] items-start bg-[#fffefa] border border-[rgba(25,36,28,0.09)] rounded-[16px] p-[20px] shadow-[0_8px_24px_-18px_rgba(25,40,28,0.35)]">
                      <div className="flex-none w-[34px] h-[34px] rounded-full bg-[#ebf1e5] text-[#1f3a27] flex items-center justify-center font-[var(--font-fraunces)] text-[17px] border border-[rgba(47,84,54,0.14)]">{i + 1}</div>
                      <div className="min-w-0 pt-[3px]">
                        <b className="font-semibold text-[15.5px] text-[#19241c] block leading-snug">{s.head}</b>
                        <p className="text-[13.5px] text-[#5c685e] leading-[1.6] mt-[5px]">{s.sub}</p>
                      </div>
                    </div>
                  ))}
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

            {/* ── Common questions (FAQ + FAQPage schema; gated to showcase) ── */}
            {isShowcase && faqItems.length > 0 && (
              <section className="mb-[46px]">
                {showcaseFaqJsonLd && (
                  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(showcaseFaqJsonLd) }} />
                )}
                <div className="text-[11.5px] tracking-[0.18em] uppercase text-[#b08a3e] font-semibold inline-flex items-center gap-[10px] mb-[14px] before:content-[''] before:w-[22px] before:h-[1px] before:bg-[#b08a3e]">Good to know</div>
                <h2 className="font-[var(--font-fraunces)] text-[28px] font-normal tracking-tight mb-5 leading-[1.15]">Common questions</h2>
                <div className="space-y-[10px]">
                  {faqItems.map((f) => (
                    <details key={f.q} className="group bg-[#fffefa] border border-[rgba(25,36,28,0.09)] rounded-[14px] px-[20px] py-[16px] open:shadow-[0_10px_30px_-20px_rgba(25,40,28,0.4)] transition-shadow">
                      <summary className="cursor-pointer list-none flex items-center justify-between gap-4">
                        <b className="font-semibold text-[15.5px] text-[#19241c]">{f.q}</b>
                        <span className="flex-none w-[26px] h-[26px] rounded-full bg-[#ebf1e5] text-[#2f5436] flex items-center justify-center group-open:rotate-90 transition-transform">
                          <ChevronRight size={15} />
                        </span>
                      </summary>
                      <p className="text-[14px] text-[#5c685e] leading-[1.65] mt-[12px]">{f.a}</p>
                    </details>
                  ))}
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
                              {closed ? 'Closed' : formatHoursRange(value)}
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

            {/* ── Nearby (unclaimed pages only) ──
                Competitor cards are suppressed on any claimed or verified
                provider page. This editorial template only ever renders
                claimed listings, so the !is_claimed guard keeps the nearby
                competitor section from showing here at all. */}
            {!provider.is_claimed && similarClinics.length > 0 && (
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
                  <div className="w-[42px] h-[42px] rounded-full overflow-hidden flex items-center justify-center shrink-0">
                    {provider.imageUrl ? (
                      // Show the clinic's logo here too (the hero already does).
                      // Cream circle + object-contain so a wordmark logo reads
                      // cleanly instead of being cropped; initials only when
                      // there's genuinely no logo asset.
                      <span className="w-full h-full bg-[#fffefa] border border-[rgba(216,184,120,0.45)] flex items-center justify-center">
                        <ResilientImage
                          src={provider.imageUrl}
                          fallbackSrc={DEFAULT_CLINIC_IMAGE}
                          alt={`${provider.name} logo`}
                          width={42}
                          height={42}
                          fill={false}
                          className="w-full h-full object-contain p-[5px]"
                        />
                      </span>
                    ) : (
                      <span className="w-full h-full bg-[#1f3a27] text-[#d8b878] flex items-center justify-center font-[var(--font-fraunces)] text-lg">
                        {initials || getInitials(provider.name)}
                      </span>
                    )}
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
