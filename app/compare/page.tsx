import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import {
  MapPin,
  Phone,
  ExternalLink,
  Star,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Globe,
  Home,
  Clock,
} from 'lucide-react';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';
import { ResilientImage } from '../../src/components/ResilientImage';
import { getListingsByIds } from '../../src/lib/data';
import { Provider } from '../../src/types';
import { getStatus } from '../../src/lib/hours';
import { OpenStatus } from '../../src/components/OpenStatus';
import { ClearCompareButton } from '../../src/components/ClearCompareButton';
import TrackedLink from '../../src/components/TrackedLink';

export const metadata: Metadata = {
  title: 'Compare IV Therapy Clinics | TheDripMap',
  description:
    'Compare IV therapy clinics side-by-side. See ratings, prices, treatments offered, hours, and contact info to pick the right clinic for you.',
  robots: { index: false, follow: true },
};

const DEFAULT_CLINIC_IMAGE =
  'https://qaqzwfnjajyejehmdvuw.supabase.co/storage/v1/object/public/blog-images/iv-therapy-group-clinic.jpg';

function getInitials(name: string): string {
  if (!name) return 'IV';
  let words = name.trim().split(/\s+/);
  if (words.length > 1 && ['the', 'a', 'an'].includes(words[0].toLowerCase())) {
    words = words.slice(1);
  }
  return ((words[0]?.[0] || '') + (words[1]?.[0] || '')).toUpperCase().slice(0, 2);
}

type SearchParams = Promise<{ ids?: string | string[] }>;

export default async function ComparePage({ searchParams }: { searchParams: SearchParams }) {
  const resolved = await searchParams;
  const rawIds = Array.isArray(resolved.ids) ? resolved.ids.join(',') : resolved.ids || '';
  const ids = rawIds
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);

  const providers: Provider[] = ids.length > 0 ? await getListingsByIds(ids) : [];

  // Keep selection order from URL
  const orderMap = new Map(ids.map((id, i) => [id, i]));
  providers.sort(
    (a, b) => (orderMap.get(a.id) ?? 99) - (orderMap.get(b.id) ?? 99)
  );

  if (providers.length < 2) {
    return (
      <div className="min-h-screen bg-[#FDFDFB]">
        <Navbar />
        <main className="max-w-3xl mx-auto px-6 py-32 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
            <XCircle size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">
            Nothing to compare yet
          </h1>
          <p className="text-slate-500 mb-8 max-w-md mx-auto leading-relaxed">
            Pick at least 2 clinics by tapping the &ldquo;+ Compare&rdquo; chip on any provider card,
            then return here to see them side-by-side.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-7 py-3.5 rounded-2xl font-black hover:bg-slate-800 transition-all shadow-lg"
          >
            Browse clinics <ArrowLeft size={16} className="rotate-180" />
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-start justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-wellness-600 mb-2">
              Side-by-side
            </p>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Comparing {providers.length} clinics
            </h1>
          </div>
          <ClearCompareButton />
        </div>

        {/* Mobile: stacked cards */}
        <div className="md:hidden space-y-6">
          {providers.map((p) => (
            <MobileCompareCard key={p.id} provider={p} />
          ))}
        </div>

        {/* Desktop: grid table */}
        <div className="hidden md:grid gap-6 mb-12" style={{ gridTemplateColumns: `200px repeat(${providers.length}, minmax(0, 1fr))` }}>
          {/* Row: clinic header */}
          <RowLabel />
          {providers.map((p) => (
            <ClinicHeader key={p.id} provider={p} />
          ))}

          {/* Row: rating */}
          <RowLabel label="Rating" />
          {providers.map((p) => (
            <Cell key={p.id}>
              {p.is_featured && p.rating > 0 ? (
                <div className="flex items-center gap-1.5">
                  <Star size={16} className="text-amber-500" fill="currentColor" />
                  <span className="text-2xl font-black text-slate-900">{p.rating}</span>
                  <span className="text-xs font-bold text-slate-500">
                    ({p.reviewCount?.toLocaleString() || 0})
                  </span>
                </div>
              ) : (
                <span className="text-sm text-slate-400 font-medium">—</span>
              )}
            </Cell>
          ))}

          {/* Row: status / hours */}
          <RowLabel label="Open now" />
          {providers.map((p) => {
            const status = getStatus(p.hours);
            return (
              <Cell key={p.id}>
                <OpenStatus hours={p.hours} className="flex items-center gap-2 mb-1" dotBaseClass="w-2 h-2 rounded-full inline-block" openDotClass="bg-emerald-500" closedDotClass="bg-amber-500" textClass="text-sm font-black text-slate-900" openText="Open" closedText="Closed" />
                <div className="text-xs text-slate-500 font-medium">{status.todayHours}</div>
              </Cell>
            );
          })}

          {/* Row: claim status */}
          <RowLabel label="Verified" />
          {providers.map((p) => (
            <Cell key={p.id}>
              {p.is_featured ? (
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-black border border-emerald-100">
                  <CheckCircle2 size={12} /> Claimed & verified
                </span>
              ) : (
                <span className="text-xs text-slate-400 font-bold">Unclaimed listing</span>
              )}
            </Cell>
          ))}

          {/* Row: phone */}
          <RowLabel label="Phone" />
          {providers.map((p) => (
            <Cell key={p.id}>
              {p.phone ? (
                <a
                  href={`tel:${p.phone}`}
                  className="text-sm font-black text-slate-900 hover:text-wellness-600 inline-flex items-center gap-1.5"
                >
                  <Phone size={14} /> {p.phone}
                </a>
              ) : (
                <span className="text-xs text-slate-400">—</span>
              )}
            </Cell>
          ))}

          {/* Row: address */}
          <RowLabel label="Address" />
          {providers.map((p) => (
            <Cell key={p.id}>
              <div className="text-sm font-medium text-slate-700 leading-relaxed">
                {p.address || p.city}
              </div>
            </Cell>
          ))}

          {/* Row: specialties */}
          <RowLabel label="Treatments offered" />
          {providers.map((p) => (
            <Cell key={p.id}>
              <div className="flex flex-wrap gap-1.5">
                {(p.specialties?.slice(0, 8) || []).map((s, i) => (
                  <span
                    key={i}
                    className="bg-slate-50 text-slate-700 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md border border-slate-100"
                  >
                    {s}
                  </span>
                ))}
                {(!p.specialties || p.specialties.length === 0) && (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </div>
            </Cell>
          ))}

          {/* Row: type */}
          <RowLabel label="Service type" />
          {providers.map((p) => {
            const isMobile =
              p.mobile_service ||
              p.type === 'Mobile' ||
              p.specialties?.some((s) => (s?.toString() || '').toLowerCase().includes('mobile'));
            return (
              <Cell key={p.id}>
                <span className="inline-flex items-center gap-1.5 text-xs font-black text-slate-700">
                  {isMobile ? (
                    <>
                      <Home size={12} className="text-wellness-600" /> Mobile / At-home
                    </>
                  ) : (
                    <>
                      <Clock size={12} className="text-wellness-600" /> Clinic
                    </>
                  )}
                </span>
              </Cell>
            );
          })}

          {/* Row: website */}
          <RowLabel label="Website" />
          {providers.map((p) => (
            <Cell key={p.id}>
              {p.website ? (
                <TrackedLink
                  providerId={p.id}
                  eventType="website_click"
                  href={p.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-black text-wellness-600 hover:text-wellness-700 inline-flex items-center gap-1.5"
                >
                  <Globe size={14} /> Visit
                </TrackedLink>
              ) : (
                <span className="text-xs text-slate-400">—</span>
              )}
            </Cell>
          ))}

          {/* Row: CTA */}
          <RowLabel />
          {providers.map((p) => (
            <Cell key={p.id}>
              <Link
                href={`/providers/${p.slug}`}
                className="w-full bg-slate-900 text-white px-4 py-3 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5 shadow-md"
              >
                View profile <ExternalLink size={12} />
              </Link>
            </Cell>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            href="/search"
            className="inline-flex items-center gap-2 text-sm font-black text-slate-600 hover:text-wellness-600 transition-colors"
          >
            <ArrowLeft size={14} /> Back to search
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function RowLabel({ label }: { label?: string }) {
  return (
    <div className="hidden md:flex items-center text-xs font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 pb-3 pt-6">
      {label || ''}
    </div>
  );
}

function Cell({ children }: { children: React.ReactNode }) {
  return (
    <div className="hidden md:block border-b border-slate-100 pb-3 pt-6">{children}</div>
  );
}

function ClinicHeader({ provider }: { provider: Provider }) {
  const initials = getInitials(provider.name);
  return (
    <div className="border-b border-slate-100 pb-5">
      <div className="w-full h-32 rounded-2xl overflow-hidden bg-slate-100 mb-4 relative">
        {provider.is_featured && provider.imageUrl ? (
          <ResilientImage
            src={provider.imageUrl}
            fallbackSrc={DEFAULT_CLINIC_IMAGE}
            alt={provider.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 font-black text-4xl">
            {initials}
          </div>
        )}
      </div>
      <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight mb-1">
        {provider.name}
      </h2>
      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
        <MapPin size={11} /> {provider.city}
      </div>
    </div>
  );
}

function MobileCompareCard({ provider }: { provider: Provider }) {
  const initials = getInitials(provider.name);
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="w-full h-40 bg-slate-100 relative">
        {provider.is_featured && provider.imageUrl ? (
          <ResilientImage
            src={provider.imageUrl}
            fallbackSrc={DEFAULT_CLINIC_IMAGE}
            alt={provider.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 font-black text-5xl">
            {initials}
          </div>
        )}
      </div>
      <div className="p-5 space-y-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">{provider.name}</h2>
          <div className="text-xs font-bold text-slate-500 mt-1">{provider.city}</div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Rating
            </div>
            <div className="flex items-center gap-1 mt-1">
              {provider.is_featured && provider.rating > 0 ? (
                <>
                  <Star size={14} className="text-amber-500" fill="currentColor" />
                  <span className="text-sm font-black text-slate-900">{provider.rating}</span>
                  <span className="text-[10px] font-bold text-slate-500">
                    ({provider.reviewCount || 0})
                  </span>
                </>
              ) : (
                <span className="text-sm font-black text-slate-400">—</span>
              )}
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Status
            </div>
            <OpenStatus hours={provider.hours} className="flex items-center gap-1.5 mt-1" dotBaseClass="w-2 h-2 rounded-full inline-block" openDotClass="bg-emerald-500" closedDotClass="bg-amber-500" textClass="text-sm font-black text-slate-900" openText="Open" closedText="Closed" />
          </div>
        </div>

        {provider.specialties && provider.specialties.length > 0 && (
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              Treatments
            </div>
            <div className="flex flex-wrap gap-1.5">
              {provider.specialties.slice(0, 6).map((s, i) => (
                <span
                  key={i}
                  className="bg-slate-50 text-slate-700 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md border border-slate-100"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        <Link
          href={`/providers/${provider.slug}`}
          className="block w-full bg-slate-900 text-white text-center py-3 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-slate-800 transition-all"
        >
          View full profile
        </Link>
      </div>
    </div>
  );
}
