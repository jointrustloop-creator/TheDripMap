'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, Send, ShieldCheck, Star, ArrowRight, Loader2, Mail, MapPin, Navigation, Calendar, Phone } from 'lucide-react';

const EMERALD = '#0F6E56';

interface Clinic {
  name: string; slug: string | null; city: string | null; state: string | null;
  rating: number | null; reviews: number | null; verified: boolean; claimed: boolean; mobile: boolean;
  distanceMi?: number | null;
  bookingUrl?: string | null;
  phone?: string | null;
}
interface Coords { lat: number; lng: number }
interface ComparisonRow {
  name: string; slug: string | null;
  city: string | null; state: string | null;
  rating: number | null; reviewCount: number | null;
  safetyVerified: boolean; claimed: boolean;
  treatments: string[]; priceRange: string;
  distanceMi: number | null; bookable: boolean; phone: string | null;
}
interface Comparison { providers: ComparisonRow[] }
interface Msg {
  role: 'user' | 'assistant';
  content: string;
  clinics?: Clinic[];
  comparison?: Comparison;
  greeting?: boolean;
}

const GREETING = 'Hi! I can help you find the right IV therapy clinic near you, or answer quick questions about treatments. What are you looking for?';

const SUGGESTIONS = [
  'Find a hangover IV near me',
  "What's a Myers Cocktail?",
  'Mobile IV to my hotel',
  'Is NAD+ safe?',
  'How much does NAD+ cost?',
];

const WHITELABEL_SUGGESTIONS = [
  'What treatments do you offer?',
  'How much is a Myers Cocktail?',
  'Are you open this weekend?',
  'How do I book?',
  'Is NAD+ safe?',
];

const HIDDEN_PREFIXES = ['/for-clinics', '/resources/clinic-owners', '/tools', '/admin', '/dashboard', '/apply-copy', '/verify-claim'];

// White-label mode is opt-in via a prop OR a global window flag injected by
// the embed shim (public/clinic-agent.js). When set, every request to the API
// includes the slug, and the chat header swaps to the clinic's branding.
type WhitelabelProps = {
  clinicSlug?: string; // overrides everything
  clinicName?: string; // optional override of the header label
  tagline?: string;    // optional subtitle in the header
};
declare global {
  interface Window { __DRIPMAP_AGENT__?: WhitelabelProps }
}

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Strip phone of non-digits for tel: links. Keep the user-facing label as-is.
function telHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  return `tel:${digits}`;
}

// Side-by-side comparison rendered when the agent calls compare_providers.
// Compact 2-3 column table tuned for the chat's narrow viewport.
function ComparisonTable({ data }: { data: Comparison }) {
  const rows = data.providers.slice(0, 3);
  if (rows.length < 2) return null;
  return (
    <div className="mt-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-3 py-2 bg-emerald-50 border-b border-emerald-100">
        <div className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Side-by-side</div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: `repeat(${rows.length}, minmax(0, 1fr))` }}>
        {rows.map((r) => (
          <div key={r.slug || r.name} className="p-3 border-r last:border-r-0 border-slate-100">
            <div className="text-xs font-black text-slate-900 truncate" title={r.name}>{r.name}</div>
            <div className="mt-1 space-y-1 text-[11px] text-slate-600">
              {r.rating != null && r.rating > 0 ? (
                <div className="inline-flex items-center gap-0.5 font-bold text-slate-700">
                  <Star size={10} fill="currentColor" className="text-amber-400" />
                  {r.rating.toFixed(1)}
                  {r.reviewCount ? <span className="text-slate-400 font-medium"> · {r.reviewCount}</span> : null}
                </div>
              ) : (
                <div className="text-slate-400">No rating yet</div>
              )}
              <div>
                {r.safetyVerified ? (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded-full">
                    <ShieldCheck size={9} /> Verified
                  </span>
                ) : r.claimed ? (
                  <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded-full">Claimed</span>
                ) : (
                  <span className="text-[9px] font-black uppercase tracking-wider bg-slate-50 text-slate-500 border border-slate-100 px-1.5 py-0.5 rounded-full">Unclaimed</span>
                )}
              </div>
              <div className="text-[11px] text-slate-500">
                <span className="font-bold text-slate-700">Price:</span>{' '}
                <span className="truncate inline-block max-w-full" title={r.priceRange}>{r.priceRange}</span>
              </div>
              <div className="text-[11px] text-slate-500">
                <span className="font-bold text-slate-700">Booking:</span>{' '}
                {r.bookable ? 'Online' : r.phone ? 'By phone' : 'Contact'}
              </div>
              {r.distanceMi != null && (
                <div className="text-[11px] text-[#0F6E56] font-bold">{r.distanceMi} mi away</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClinicMiniCard({ c }: { c: Clinic }) {
  // BOOK NOW is only meaningful for claimed clinics that have given us a
  // booking URL. CALL TO BOOK shows when a claimed clinic has a phone but no
  // online booking. Unclaimed clinics get neither — they go to the listing.
  const showBookOnline = c.claimed && !!c.bookingUrl;
  const showCallToBook = c.claimed && !c.bookingUrl && !!c.phone;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-3 hover:border-emerald-300 transition-all">
      <Link href={`/providers/${c.slug || slugify(c.name)}`} className="block">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-bold text-slate-900 text-sm truncate">{c.name}</div>
            <div className="text-[11px] text-slate-400 truncate flex items-center gap-1">
              <span>{c.city}{c.state ? `, ${c.state}` : ''}</span>
              {c.distanceMi != null && (
                <span className="text-[#0F6E56] font-bold whitespace-nowrap">· {c.distanceMi} mi</span>
              )}
            </div>
          </div>
          {c.claimed && c.rating != null && c.rating > 0 && (
            <span className="flex items-center gap-0.5 text-xs font-bold text-slate-700 shrink-0">
              <Star size={11} fill="currentColor" className="text-amber-400" />{c.rating.toFixed(1)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-2">
          <div className="flex flex-wrap gap-1">
            {c.verified ? (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded-full"><ShieldCheck size={9} /> Verified</span>
            ) : c.claimed ? (
              <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded-full">Claimed</span>
            ) : (
              <span className="text-[9px] font-black uppercase tracking-wider bg-slate-50 text-slate-500 border border-slate-100 px-1.5 py-0.5 rounded-full">Unclaimed</span>
            )}
            {c.mobile && <span className="text-[9px] font-black uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-100 px-1.5 py-0.5 rounded-full">Mobile</span>}
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-black text-[#0F6E56] shrink-0">View <ArrowRight size={11} /></span>
        </div>
      </Link>
      {(showBookOnline || showCallToBook) && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-100">
          {showBookOnline ? (
            <a
              href={c.bookingUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl font-black text-white text-xs uppercase tracking-wider shadow-sm hover:opacity-95 transition-opacity"
              style={{ backgroundColor: EMERALD }}
            >
              <Calendar size={12} /> Book Now
            </a>
          ) : (
            <a
              href={telHref(c.phone!)}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl font-black text-xs uppercase tracking-wider border-2 transition-colors hover:bg-emerald-50"
              style={{ borderColor: EMERALD, color: EMERALD }}
            >
              <Phone size={12} /> Call to Book
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export const DripAssistant = (props: WhitelabelProps = {}) => {
  const pathname = usePathname() || '';
  // Resolve white-label config from props first, then from a window global
  // (the embed shim injects this before mounting), then null. Stable across
  // re-renders so the API URL doesn't change mid-conversation.
  const [wl, setWl] = useState<WhitelabelProps>(props);
  useEffect(() => {
    if (!props.clinicSlug && typeof window !== 'undefined' && window.__DRIPMAP_AGENT__) {
      setWl({ ...window.__DRIPMAP_AGENT__, ...props });
    }
  }, [props]);
  const wlSlug = wl.clinicSlug || null;
  const wlClinicName = wl.clinicName || null;
  const wlTagline = wl.tagline || null;
  const isWhitelabel = !!wlSlug;

  const [open, setOpen] = useState(false);
  const initialGreeting = wlClinicName
    ? `Hi! I'm the chat concierge for ${wlClinicName}. Ask me about treatments, prices, hours, or booking.`
    : GREETING;
  const [messages, setMessages] = useState<Msg[]>([{ role: 'assistant', content: initialGreeting, greeting: true }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMsgForm, setShowMsgForm] = useState(false);
  const [msgName, setMsgName] = useState('');
  const [msgEmail, setMsgEmail] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [msgSending, setMsgSending] = useState(false);
  const [userCity, setUserCity] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<Coords | null>(null);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'locating' | 'granted' | 'denied'>('idle');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open, loading, showMsgForm]);

  // Restore any previously shared location.
  useEffect(() => {
    try {
      const c = localStorage.getItem('dripmap_user_city');
      const co = localStorage.getItem('dripmap_user_coords');
      if (c) setUserCity(c);
      if (co) { const p = JSON.parse(co); if (Number.isFinite(p?.lat) && Number.isFinite(p?.lng)) { setUserCoords(p); setGeoStatus('granted'); } }
    } catch { /* ignore */ }
  }, []);

  const requestLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) { setGeoStatus('denied'); return; }
    setGeoStatus('locating');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        setGeoStatus('granted');
        try { localStorage.setItem('dripmap_user_coords', JSON.stringify(coords)); } catch { /* ignore */ }
        try {
          const r = await fetch(`/api/geo/reverse?lat=${coords.lat}&lng=${coords.lng}`);
          const d = await r.json();
          if (d?.city) { setUserCity(d.city); try { localStorage.setItem('dripmap_user_city', d.city); } catch { /* ignore */ } }
        } catch { /* reverse geocode is best-effort */ }
      },
      () => setGeoStatus('denied'),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
    );
  };

  // On first open, offer to use precise location (only if we don't have it yet).
  // Skip entirely in white-label mode — the chat scope is one clinic, so we
  // don't need to distance-rank anything.
  useEffect(() => {
    if (isWhitelabel) return;
    if (open && geoStatus === 'idle' && !userCoords && !userCity) requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Public widget is hidden on internal/admin/tools pages. White-label mode
  // overrides that — the embed page and the demo page render the widget
  // explicitly even when their path is in HIDDEN_PREFIXES.
  if (!isWhitelabel && HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const sendText = async (text: string) => {
    const t = text.trim();
    if (!t || loading) return;
    const next = [...messages, { role: 'user' as const, content: t }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const payload = next.filter((m) => !m.greeting).map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/drip-assistant', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payload, userCity, userCoords, clinicSlug: wlSlug }),
      });
      const data = await res.json();
      if (!res.ok) setMessages((m) => [...m, { role: 'assistant', content: data.error || 'Sorry, something went wrong. Please try again.' }]);
      else {
        setMessages((m) => [...m, { role: 'assistant', content: data.reply, clinics: data.clinics, comparison: data.comparison }]);
        // If we didn't know the user's city, learn it from the matched results so
        // future "near me" turns don't have to ask again.
        if (!userCity && Array.isArray(data.clinics) && data.clinics[0]?.city) {
          const inferred = data.clinics[0].city as string;
          setUserCity(inferred);
          try { localStorage.setItem('dripmap_user_city', inferred); } catch { /* ignore */ }
        }
      }
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'I couldn\'t reach the server — please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const submitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (msgSending) return;
    setMsgSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: msgName, email: msgEmail, subject: 'Drip Assistant message', message: msgBody }),
      });
      const data = await res.json();
      if (data.success) {
        setShowMsgForm(false);
        const first = msgName.trim().split(' ')[0];
        setMessages((m) => [...m, { role: 'assistant', content: `Thanks${first ? `, ${first}` : ''}! We've got your message and will reply to ${msgEmail} soon.` }]);
        setMsgName(''); setMsgEmail(''); setMsgBody('');
      } else {
        setMessages((m) => [...m, { role: 'assistant', content: 'Sorry, that didn\'t send — please try again or email info@thedripmap.com.' }]);
        setShowMsgForm(false);
      }
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Couldn\'t send your message — please try again.' }]);
    } finally {
      setMsgSending(false);
    }
  };

  const onlyGreeting = messages.length === 1;

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open Drip Assistant"
          className="group fixed bottom-5 right-5 z-[60] hover:scale-[1.07] active:scale-95 transition-transform"
        >
          {/* Hover label (desktop) */}
          <span className="absolute right-full top-1/2 -translate-y-1/2 mr-3 whitespace-nowrap rounded-full bg-white px-3.5 py-2 text-xs font-black text-slate-700 shadow-xl border border-slate-100 opacity-0 translate-x-1 pointer-events-none transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 hidden sm:block">
            Chat with Drip Assistant
          </span>
          {/* Soft glow */}
          <span className="absolute inset-2 rounded-full blur-lg opacity-40" style={{ backgroundColor: EMERALD }} />
          {/* Drip-shaped launcher */}
          <span className="drip-float relative block" style={{ filter: 'drop-shadow(0 12px 22px rgba(10,61,43,0.45))' }}>
            <svg width="58" height="72" viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="dripGrad" x1="32" y1="6" x2="32" y2="76" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#1A8A68" />
                  <stop offset="1" stopColor="#0A3D2B" />
                </linearGradient>
              </defs>
              {/* map pin (points down) — matches TheDripMap logo mark */}
              <path d="M32 76 C 32 76 9 47 8 30 A 24 24 0 1 1 56 30 C 55 47 32 76 32 76 Z" fill="url(#dripGrad)" />
              {/* glossy highlight */}
              <ellipse cx="21" cy="20" rx="4" ry="7" fill="#ffffff" opacity="0.16" transform="rotate(-20 21 20)" />
              {/* IV bag: hanger cap, bag body, green fluid, drip tube + drop */}
              <rect x="29.5" y="11" width="5" height="3" rx="1" fill="#ffffff" />
              <rect x="23" y="14.5" width="18" height="23" rx="4.5" fill="#ffffff" />
              <rect x="25.5" y="25" width="13" height="10.5" rx="3" fill="#6CBE45" />
              <rect x="31" y="37.5" width="2" height="5" fill="#ffffff" />
              <circle cx="32" cy="45" r="2.1" fill="#ffffff" />
            </svg>
          </span>
          <style>{`@keyframes dripFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}.drip-float{animation:dripFloat 3.2s ease-in-out infinite}@media (prefers-reduced-motion: reduce){.drip-float{animation:none}}`}</style>
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-[60] w-[calc(100vw-2.5rem)] max-w-[390px] h-[min(74vh,640px)] bg-white rounded-3xl shadow-2xl shadow-slate-900/25 border border-slate-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 text-white shrink-0" style={{ backgroundColor: EMERALD }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center"><ShieldCheck size={16} /></div>
              <div>
                <div className="font-black text-sm leading-tight flex items-center gap-1.5">
                  {isWhitelabel && wlClinicName ? wlClinicName : 'Drip Assistant'}
                  <span
                    title={isWhitelabel ? 'This chat is in beta. Results may vary.' : 'This tool is in beta. Results may vary. Send feedback to info@thedripmap.com'}
                    className="inline-flex items-center rounded-full bg-white/20 text-white px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide leading-none"
                  >
                    BETA
                  </span>
                </div>
                <div className="text-[10px] text-emerald-50/80 leading-tight">
                  {isWhitelabel ? (wlTagline || 'Treatments · prices · booking') : 'Find a clinic · ask anything'}
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" className="p-1.5 rounded-lg hover:bg-white/15 transition-colors"><X size={18} /></button>
          </div>

          {/* Location strip — directory mode only; irrelevant in single-clinic white-label */}
          {!isWhitelabel && (
            <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-100 shrink-0">
              {userCity ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                  <MapPin size={12} className="text-[#0F6E56]" />
                  {userCity}{userCoords ? ' · nearby results' : ''}
                </span>
              ) : geoStatus === 'locating' ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                  <Loader2 size={12} className="animate-spin" /> finding your location…
                </span>
              ) : (
                <span className="text-[11px] font-bold text-slate-400">Location not set</span>
              )}
              <button
                onClick={requestLocation}
                className="inline-flex items-center gap-1 text-[11px] font-black text-[#0F6E56] hover:underline"
              >
                <Navigation size={11} /> {userCity ? 'Update' : 'Use my location'}
              </button>
            </div>
          )}

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-[#F8F7F3]">
            {messages.map((m, i) => (
              <div key={i}>
                <div className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user' ? 'text-white rounded-br-md' : 'bg-white text-slate-700 border border-slate-100 rounded-bl-md'
                  }`} style={m.role === 'user' ? { backgroundColor: EMERALD } : undefined}>
                    {m.content}
                  </div>
                </div>
                {m.clinics && m.clinics.length > 0 && (
                  <div className="mt-2 space-y-2">{m.clinics.map((c) => <ClinicMiniCard key={c.slug || c.name} c={c} />)}</div>
                )}
                {/* "Compare these" link — only when the agent surfaced exactly */}
                {/* 3 clinics AND hasn't already produced a comparison this turn. */}
                {m.role === 'assistant' && m.clinics && m.clinics.length >= 2 && !m.comparison && (
                  <button
                    onClick={() => {
                      const slugs = (m.clinics || [])
                        .map((c) => c.slug || slugify(c.name))
                        .filter(Boolean)
                        .slice(0, 3);
                      // The synthetic user message includes the slugs so the
                      // model has them in context for the compare_providers call.
                      const slugHint = slugs.length ? ` (${slugs.join(', ')})` : '';
                      sendText(`Compare those three for me${slugHint}.`);
                    }}
                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-black text-[#0F6E56] hover:underline"
                  >
                    Compare these <ArrowRight size={11} />
                  </button>
                )}
                {m.comparison && m.comparison.providers && m.comparison.providers.length >= 2 && (
                  <ComparisonTable data={m.comparison} />
                )}
              </div>
            ))}

            {/* Suggested questions — shown before the conversation starts */}
            {onlyGreeting && !showMsgForm && !loading && (
              <div className="flex flex-wrap gap-2">
                {(isWhitelabel ? WHITELABEL_SUGGESTIONS : SUGGESTIONS).map((s) => (
                  <button key={s} onClick={() => sendText(s)}
                    className="text-left text-xs font-bold text-[#0F6E56] bg-white border border-emerald-200 rounded-full px-3 py-1.5 hover:bg-emerald-50 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2 text-slate-400 text-sm">
                  <Loader2 size={14} className="animate-spin" /> thinking…
                </div>
              </div>
            )}

            {/* Leave-a-message form */}
            {showMsgForm && (
              <form onSubmit={submitMessage} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">Leave us a message</span>
                  <button type="button" onClick={() => setShowMsgForm(false)} className="text-slate-300 hover:text-slate-500"><X size={15} /></button>
                </div>
                <input required value={msgName} onChange={(e) => setMsgName(e.target.value)} placeholder="Your name"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:outline-none focus:border-emerald-500" />
                <input required type="email" value={msgEmail} onChange={(e) => setMsgEmail(e.target.value)} placeholder="Your email"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:outline-none focus:border-emerald-500" />
                <textarea required value={msgBody} onChange={(e) => setMsgBody(e.target.value)} placeholder="How can we help?" rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:outline-none focus:border-emerald-500 resize-none" />
                <button type="submit" disabled={msgSending}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-white text-sm disabled:opacity-60" style={{ backgroundColor: EMERALD }}>
                  {msgSending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Send message
                </button>
              </form>
            )}
          </div>

          {/* Input + leave-a-message toggle */}
          {!showMsgForm && (
            <>
              <form onSubmit={(e) => { e.preventDefault(); sendText(input); }} className="px-3 pt-3 border-t border-slate-100 bg-white shrink-0 flex items-center gap-2">
                <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask or type your city…"
                  className="flex-1 px-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500" />
                <button type="submit" disabled={loading || !input.trim()} aria-label="Send"
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 disabled:opacity-50 transition-opacity" style={{ backgroundColor: EMERALD }}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
              <button onClick={() => setShowMsgForm(true)} className="bg-white pb-3 pt-1.5 text-[11px] font-bold text-slate-400 hover:text-[#0F6E56] inline-flex items-center justify-center gap-1.5 transition-colors">
                <Mail size={12} /> Prefer to leave a message?
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
};
