'use client';

import React, { useState } from 'react';
import { CheckCircle2, ShieldCheck, Upload, ArrowRight, Loader2, Image as ImageIcon, Sparkles } from 'lucide-react';
import { Logo } from '../../../src/components/Logo';

interface PrefillDrip { name?: string; price?: string | null }
interface Prefill {
  team?: { whoPlaces?: string[]; oversight?: string; leadName?: string };
  sourcing?: string[];
  drips?: PrefillDrip[];
  boosters?: string[];
  delivery?: string[];
  firstVisit?: { consult?: string; length?: string; booking?: string };
  payment?: string[];
  about?: string;
  offer?: { title?: string; code?: string; expires?: string; active?: boolean };
  slowWindows?: string[];
}

interface Props {
  token: string;
  clinicName: string;
  city: string;
  listingUrl: string;
  hasLogo: boolean;
  photoCount: number;
  prefill: Record<string, unknown> | null;
}

// Who can legally start the line. ND kept (most of our claimed roster is
// Canada, where NDs run IV clinics); MD/DO + PA cover the US.
const WHO_PLACES = ['RN', 'NP', 'ND', 'MD / DO', 'PA', 'Paramedic'];
const OVERSIGHT = ['Medical director', 'On-site physician', 'NP-led', 'ND-led'];
// "Licensed compounding pharmacy" covers a US 503A or a provincial pharmacy;
// "503B outsourcing facility" is the US sterile-batch signal. Either reads as
// in-the-know to the owner.
const SOURCING = ['Licensed compounding pharmacy', '503B outsourcing facility', 'Prepared on site'];

// The real menu, pre-loaded and grouped, each with its true formula. Owners tap
// what they offer; the grouping is UI only (data is still a flat list).
const DRIP_MENU: { group: string; items: { name: string; hint: string }[] }[] = [
  { group: 'Core', items: [
    { name: "Myers' Cocktail", hint: 'B-complex, B12, vitamin C, magnesium, calcium' },
    { name: 'Hydration', hint: "Saline or lactated Ringer's + electrolytes" },
  ] },
  { group: 'Signature', items: [
    { name: 'NAD+', hint: 'Nicotinamide adenine dinucleotide - slow 2-4h push' },
    { name: 'Glutathione', hint: 'The master antioxidant - push or add-on' },
    { name: 'High-Dose Vitamin C', hint: 'Ascorbic acid - G6PD screen over 15g' },
  ] },
  { group: 'Recovery', items: [
    { name: 'Hangover Relief', hint: 'Fluids, anti-nausea, B12, electrolytes' },
    { name: 'Athletic Recovery', hint: 'Amino acids, B-complex, magnesium' },
    { name: 'Immune / Cold & Flu', hint: 'High-dose vitamin C, zinc, B vitamins' },
  ] },
  { group: 'Beauty & Targeted', items: [
    { name: 'Beauty / Glow', hint: 'Biotin, glutathione, vitamin C' },
    { name: 'Energy / B12', hint: 'B12, B-complex, amino blend' },
    { name: 'Iron Infusion', hint: 'Iron sucrose / ferric - needs bloodwork' },
    { name: 'Weight-Loss Support', hint: 'MIC / lipotropic + B12' },
  ] },
];

// A-la-carte add-ons real IV bars upsell. No generic directory asks this.
const BOOSTERS = ['Glutathione', 'Extra B12', 'Vitamin C', 'Biotin', 'Magnesium', 'Amino acids', 'Zinc', 'Anti-nausea (Zofran)', 'Toradol', 'NAD+ boost'];

const DELIVERY = ['In-clinic', 'Mobile / at-home', 'Memberships & packages'];
const CONSULT = ['Required', 'Optional', 'No'];
const LENGTH = ['30 min', '45 min', '60 min', '90+ min'];
const BOOKING = ['By appointment', 'Walk-ins welcome', 'Both'];
const PAYMENT = ['Receipts for extended health benefits', 'Direct billing', 'HSA/FSA', 'Memberships / packages', 'Pay per visit'];

// When-are-you-slow windows -> we write the deal for them.
const SLOW_WINDOWS = ['Mid-afternoon (1-4pm)', 'Weekday mornings', 'Early week (Mon-Tue)', 'Lunch lull', 'Seasonal dip', 'Same-day openings'];

function suggestedDeals(windows: string[]): string[] {
  const s: string[] = [];
  if (windows.includes('Mid-afternoon (1-4pm)')) s.push('Happy Hour Drip - 20% off all drips, Tue-Thu 2-4pm');
  if (windows.includes('Weekday mornings')) s.push('Early Bird Drip - $25 off any drip before 11am');
  if (windows.includes('Early week (Mon-Tue)')) s.push('Recovery Hour - 20% off drips, Mon & Tue');
  if (windows.includes('Lunch lull')) s.push('Lunch-Break Express - $20 off the 20-min B12 push');
  if (windows.includes('Seasonal dip')) s.push('Reset Package - 25% off a 3-drip series');
  if (windows.includes('Same-day openings')) s.push('Same-Day Seat - 15% off when you book today');
  if (s.length === 0) s.push('Happy Hour Drip - 20% off all drips, Tue-Thu 2-4pm');
  return s.slice(0, 4);
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'px-4 py-2.5 rounded-full text-sm font-bold border transition-all ' +
        (active
          ? 'bg-[#0F6E56] text-white border-[#0F6E56] shadow-sm shadow-emerald-200'
          : 'bg-white text-slate-600 border-slate-200 hover:border-[#0F6E56]/40 hover:text-slate-900')
      }
    >
      {children}
    </button>
  );
}

function SectionCard({ step, title, hint, children }: { step: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-[1.75rem] border border-slate-200 shadow-[0_12px_34px_-22px_rgba(25,40,28,0.4)] p-6 md:p-8">
      <div className="flex items-start gap-3.5 mb-5">
        <span className="flex-none w-8 h-8 rounded-full bg-[#ebf1e5] text-[#0F6E56] flex items-center justify-center font-black text-sm">{step}</span>
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">{title}</h2>
          {hint && <p className="text-[13px] text-slate-500 mt-0.5">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export function FinishListingForm({ token, clinicName, city, listingUrl, hasLogo, photoCount, prefill }: Props) {
  const pf = (prefill || {}) as Prefill;
  const [whoPlaces, setWhoPlaces] = useState<string[]>(pf.team?.whoPlaces || []);
  const [oversight, setOversight] = useState<string>(pf.team?.oversight || '');
  const [leadName, setLeadName] = useState<string>(pf.team?.leadName || '');
  const [sourcing, setSourcing] = useState<string[]>(pf.sourcing || []);
  const [selectedDrips, setSelectedDrips] = useState<string[]>((pf.drips || []).map((d) => d.name || '').filter(Boolean));
  const [prices, setPrices] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    (pf.drips || []).forEach((d) => { if (d.name && d.price) m[d.name] = String(d.price).replace('$', ''); });
    return m;
  });
  const [boosters, setBoosters] = useState<string[]>(pf.boosters || []);
  const [delivery, setDelivery] = useState<string[]>(pf.delivery || []);
  const [consult, setConsult] = useState<string>(pf.firstVisit?.consult || '');
  const [length, setLength] = useState<string>(pf.firstVisit?.length || '');
  const [booking, setBooking] = useState<string>(pf.firstVisit?.booking || '');
  const [payment, setPayment] = useState<string[]>(pf.payment || []);
  const [about, setAbout] = useState<string>(pf.about || '');
  const [logo, setLogo] = useState<File | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);

  const [slowWindows, setSlowWindows] = useState<string[]>(pf.slowWindows || []);
  const [offerTitle, setOfferTitle] = useState<string>(pf.offer?.title || '');
  const [offerCode, setOfferCode] = useState<string>(pf.offer?.code || '');
  const [offerExpires, setOfferExpires] = useState<string>(pf.offer?.expires || '');
  const [offerActive, setOfferActive] = useState<boolean>(pf.offer?.active !== false);
  const [offerSavedTitle] = useState<string>(pf.offer?.title || '');

  // One-tap ON/OFF for an already-saved offer (no full form save needed).
  async function toggleOffer(next: boolean) {
    setOfferActive(next);
    try {
      await fetch('/api/offer-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, active: next }),
      });
    } catch { /* optimistic; the next full save will reconcile */ }
  }

  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const toggle = (arr: string[], setArr: (v: string[]) => void, val: string) =>
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  // Live completion across the 5 substantive sections (boosters + offer are
  // bonus, not counted), to nudge owners to finish.
  const sectionsDone =
    (whoPlaces.length || oversight || sourcing.length || leadName.trim() ? 1 : 0) +
    (selectedDrips.length ? 1 : 0) +
    (delivery.length || consult || length || booking ? 1 : 0) +
    (payment.length ? 1 : 0) +
    (logo || photos.length || about.trim() || hasLogo || photoCount > 0 ? 1 : 0);
  const pctDone = Math.round((sectionsDone / 5) * 100);

  const dealSuggestions = suggestedDeals(slowWindows);

  async function save() {
    setSaving(true);
    setError('');
    try {
      const answers = {
        token,
        team: { whoPlaces, oversight, leadName: leadName.trim() },
        sourcing,
        drips: selectedDrips.map((n) => ({ name: n, price: prices[n] ? prices[n].trim() : null })),
        boosters,
        delivery,
        firstVisit: { consult, length, booking },
        payment,
        about: about.trim(),
        offer: { title: offerTitle.trim(), code: offerCode.trim(), expires: offerExpires, active: offerActive },
        slowWindows,
      };
      const fd = new FormData();
      fd.append('answers', JSON.stringify(answers));
      fd.append('token', token);
      if (logo) fd.append('logo', logo);
      photos.slice(0, 5).forEach((p) => fd.append('photos', p));
      const res = await fetch('/api/finish-listing', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        setSaving(false);
        return;
      }
      setDone(true);
      setSaving(false);
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setError('Network error. Please try again.');
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#f8f5ee] flex items-center justify-center px-6 py-16">
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl p-12 text-center max-w-lg">
          <div className="flex justify-center mb-6"><Logo imgClassName="h-10" /></div>
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
            <CheckCircle2 size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Saved. Your listing is updated.</h1>
          <p className="text-slate-500 leading-relaxed mb-8">
            Your changes are live now. This page is always yours, so bookmark it and come back to update anything anytime.
          </p>
          <div className="flex flex-col gap-3">
            <a href={listingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-[#0F6E56] text-white px-7 py-4 rounded-xl font-black hover:bg-[#0A5742] transition-all">
              View your live listing <ArrowRight size={18} />
            </a>
            <button onClick={() => setDone(false)} className="text-sm font-bold text-slate-500 hover:text-slate-900">
              Keep editing
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f5ee] pb-32">
      {/* Slim branded header with the real logo */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between gap-2">
          <Logo imgClassName="h-9" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">Owner portal</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 pt-10">
        {/* Confirmed owner banner */}
        <div className="mb-7">
          <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] py-1.5 px-3 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 mb-4">
            <ShieldCheck size={14} /> You're confirmed as the owner of {clinicName}
          </span>
          <h1 className="text-[clamp(2rem,6vw,3rem)] font-black text-slate-900 tracking-tight leading-[1.02]">
            Finish your listing
          </h1>
          <p className="text-slate-500 mt-3 leading-relaxed">
            All quick taps, about two minutes. Everything you set publishes to your live listing the moment you save, and you can come back to change it anytime.
          </p>
          {/* Completion progress */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[12px] font-black uppercase tracking-[0.12em] text-[#0F6E56]">{sectionsDone} of 5 complete</span>
              <span className="text-[12px] font-bold text-slate-400">{pctDone}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full bg-[#0F6E56] rounded-full transition-all duration-500" style={{ width: `${pctDone}%` }} />
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {/* 1 - SAFETY FIRST. The #1 thing patients (and Google's medical
              ranking) check, and what earns the Safety Verified badge. */}
          <SectionCard step={1} title="Who keeps patients safe?" hint="The first thing patients check, and what earns your Safety Verified badge.">
            <div className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2">Who starts the IV?</div>
            <div className="flex flex-wrap gap-2 mb-5">
              {WHO_PLACES.map((o) => <Chip key={o} active={whoPlaces.includes(o)} onClick={() => toggle(whoPlaces, setWhoPlaces, o)}>{o}</Chip>)}
            </div>
            <div className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2">Medical oversight</div>
            <div className="flex flex-wrap gap-2 mb-5">
              {OVERSIGHT.map((o) => <Chip key={o} active={oversight === o} onClick={() => setOversight(oversight === o ? '' : o)}>{o}</Chip>)}
            </div>
            <div className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2">Where do your IVs come from?</div>
            <div className="flex flex-wrap gap-2 mb-1.5">
              {SOURCING.map((o) => <Chip key={o} active={sourcing.includes(o)} onClick={() => toggle(sourcing, setSourcing, o)}>{o}</Chip>)}
            </div>
            <p className="text-[11.5px] text-slate-400 mb-5">A 503A pharmacy, a 503B outsourcing facility, or mixed on site, however your bags are made.</p>
            <div className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2">Lead practitioner (optional)</div>
            <input
              value={leadName}
              onChange={(e) => setLeadName(e.target.value)}
              placeholder="e.g. Dr. Megan Maycher, ND"
              maxLength={80}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#0F6E56] focus:ring-2 focus:ring-[#0F6E56]/20 outline-none text-sm"
            />
          </SectionCard>

          {/* 2 - THE REAL MENU, pre-loaded with true formulas. */}
          <SectionCard step={2} title="Your drip menu" hint="We pre-loaded the real menu. Tap what you offer, add a from price if you like.">
            {DRIP_MENU.map((grp) => (
              <div key={grp.group} className="mt-4 first:mt-0">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 mb-2">{grp.group}</div>
                <div className="space-y-2.5">
                  {grp.items.map((it) => {
                    const on = selectedDrips.includes(it.name);
                    return (
                      <div key={it.name} className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggle(selectedDrips, setSelectedDrips, it.name)}
                          className={'flex-1 text-left px-4 py-2.5 rounded-xl border transition-all ' + (on ? 'bg-[#ebf1e5] border-[#0F6E56]/40' : 'bg-white border-slate-200 hover:border-[#0F6E56]/30')}
                        >
                          <div className="flex items-center gap-2">
                            <span className={'inline-flex items-center justify-center w-5 h-5 rounded-md flex-none ' + (on ? 'bg-[#0F6E56] text-white' : 'bg-slate-100 text-transparent')}>
                              <CheckCircle2 size={13} />
                            </span>
                            <span className={'text-sm font-bold ' + (on ? 'text-[#1f3a27]' : 'text-slate-700')}>{it.name}</span>
                          </div>
                          <div className="text-[11.5px] text-slate-400 mt-0.5 pl-7">{it.hint}</div>
                        </button>
                        {on && (
                          <div className="flex items-center gap-1 w-[112px] flex-none">
                            <span className="text-slate-400 font-bold text-sm">from $</span>
                            <input
                              inputMode="numeric"
                              value={prices[it.name] || ''}
                              onChange={(e) => setPrices({ ...prices, [it.name]: e.target.value.replace(/[^\d]/g, '') })}
                              placeholder="-"
                              className="w-full px-2 py-2 rounded-lg border border-slate-200 focus:border-[#0F6E56] outline-none text-sm text-center"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </SectionCard>

          {/* Bonus - boosters & pushes. Not counted toward the 5; pure expertise
              signal + richer listing data. */}
          <section className="bg-white rounded-[1.75rem] border border-slate-200 shadow-[0_12px_34px_-22px_rgba(25,40,28,0.4)] p-6 md:p-8">
            <div className="flex items-start gap-3.5 mb-5">
              <span className="flex-none w-8 h-8 rounded-full bg-[#ebf1e5] text-[#0F6E56] flex items-center justify-center"><Sparkles size={16} /></span>
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">Boosters & pushes</h2>
                <p className="text-[13px] text-slate-500 mt-0.5">The a-la-carte add-ons you offer alongside a drip. Optional.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {BOOSTERS.map((o) => <Chip key={o} active={boosters.includes(o)} onClick={() => toggle(boosters, setBoosters, o)}>{o}</Chip>)}
            </div>
          </section>

          {/* 3 - how you run visits */}
          <SectionCard step={3} title="How you run visits">
            <div className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2">How do patients get their drip?</div>
            <div className="flex flex-wrap gap-2 mb-5">{DELIVERY.map((o) => <Chip key={o} active={delivery.includes(o)} onClick={() => toggle(delivery, setDelivery, o)}>{o}</Chip>)}</div>
            <div className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2">Do first-timers get a consultation?</div>
            <div className="flex flex-wrap gap-2 mb-5">{CONSULT.map((o) => <Chip key={o} active={consult === o} onClick={() => setConsult(consult === o ? '' : o)}>{o}</Chip>)}</div>
            <div className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2">Typical session length</div>
            <div className="flex flex-wrap gap-2 mb-5">{LENGTH.map((o) => <Chip key={o} active={length === o} onClick={() => setLength(length === o ? '' : o)}>{o}</Chip>)}</div>
            <div className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2">Booking</div>
            <div className="flex flex-wrap gap-2">{BOOKING.map((o) => <Chip key={o} active={booking === o} onClick={() => setBooking(booking === o ? '' : o)}>{o}</Chip>)}</div>
          </SectionCard>

          {/* 4 - payment */}
          <SectionCard step={4} title="Payment & coverage">
            <div className="flex flex-wrap gap-2">{PAYMENT.map((o) => <Chip key={o} active={payment.includes(o)} onClick={() => toggle(payment, setPayment, o)}>{o}</Chip>)}</div>
          </SectionCard>

          {/* 5 - make it yours */}
          <SectionCard step={5} title="Make it yours" hint="Real photos beat stock every time. Listings with photos get far more bookings.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="cursor-pointer border-2 border-dashed border-slate-200 rounded-2xl p-5 text-center hover:border-[#0F6E56]/40 transition-all">
                <ImageIcon size={22} className="mx-auto text-[#0F6E56] mb-2" />
                <div className="text-sm font-black text-slate-900">{logo ? logo.name.slice(0, 22) : 'Upload your logo'}</div>
                <div className="text-[11px] text-slate-400 mt-1">{hasLogo && !logo ? 'A logo is already on file' : 'PNG, JPG, or SVG'}</div>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setLogo(e.target.files?.[0] || null)} />
              </label>
              <label className="cursor-pointer border-2 border-dashed border-slate-200 rounded-2xl p-5 text-center hover:border-[#0F6E56]/40 transition-all">
                <Upload size={22} className="mx-auto text-[#0F6E56] mb-2" />
                <div className="text-sm font-black text-slate-900">{photos.length ? `${photos.length} photo${photos.length > 1 ? 's' : ''} selected` : 'Upload photos'}</div>
                <div className="text-[11px] text-slate-400 mt-1">{photoCount > 0 && !photos.length ? `${photoCount} already on file` : 'Up to 5: room, team, exterior'}</div>
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => setPhotos(Array.from(e.target.files || []).slice(0, 5))} />
              </label>
            </div>
            <div className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2 mt-5">Anything you'd like patients to know (optional)</div>
            <input
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="One line in your own words"
              maxLength={200}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#0F6E56] focus:ring-2 focus:ring-[#0F6E56]/20 outline-none text-sm"
            />
          </SectionCard>

          {/* Bonus - slow-time deal builder. We tell them when they're slow and
              write the deal; it shows on the listing + /deals and expires itself. */}
          <section className="bg-gradient-to-br from-[#1f3a27] to-[#14352a] text-[#f3efe2] rounded-[1.75rem] p-6 md:p-8 shadow-[0_12px_34px_-22px_rgba(25,40,28,0.5)]">
            <div className="flex items-start gap-3.5 mb-2">
              <span className="flex-none w-8 h-8 rounded-full bg-[rgba(216,184,120,0.18)] text-[#d8b878] flex items-center justify-center"><Sparkles size={16} /></span>
              <div className="flex-1">
                <h2 className="text-lg font-black tracking-tight leading-tight">Slow week? We'll fill it.</h2>
                <p className="text-[13px] text-[#c4c9b8] mt-0.5">Tell us when you're quiet and we'll write the deal. It shows on your listing and our deals page, and turns off on its own when it ends.</p>
              </div>
            </div>

            {/* One-tap ON/OFF for an existing offer */}
            {offerSavedTitle && (
              <div className="flex items-center justify-between gap-3 mb-4 mt-4 rounded-xl bg-white/10 px-4 py-3">
                <span className="text-sm font-bold">{offerActive ? 'Your offer is LIVE on the site' : 'Your offer is hidden'}</span>
                <button
                  type="button"
                  onClick={() => toggleOffer(!offerActive)}
                  className={'relative w-[52px] h-[28px] rounded-full transition-colors flex-none ' + (offerActive ? 'bg-[#d8b878]' : 'bg-white/25')}
                  aria-label="Toggle offer on or off"
                >
                  <span className={'absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white transition-all ' + (offerActive ? 'left-[27px]' : 'left-[3px]')} />
                </button>
              </div>
            )}

            {/* When are you slow? */}
            <div className="text-[11px] font-black uppercase tracking-[0.14em] text-[#c4c9b8] mt-5 mb-2">When are you slow?</div>
            <div className="flex flex-wrap gap-2">
              {SLOW_WINDOWS.map((w) => {
                const on = slowWindows.includes(w);
                return (
                  <button
                    key={w}
                    type="button"
                    onClick={() => toggle(slowWindows, setSlowWindows, w)}
                    className={'px-3.5 py-2 rounded-full text-[13px] font-bold transition-all ' + (on ? 'bg-[#d8b878] text-[#1f3a27]' : 'bg-white/10 text-[#e7e3d5] hover:bg-white/20')}
                  >
                    {w}
                  </button>
                );
              })}
            </div>

            {/* Suggested deals, tap to use */}
            <div className="text-[11px] font-black uppercase tracking-[0.14em] text-[#c4c9b8] mt-5 mb-2">Suggested for you, tap to use</div>
            <div className="space-y-2">
              {dealSuggestions.map((s) => {
                const chosen = offerTitle.trim() === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setOfferTitle(s)}
                    className={'w-full text-left rounded-xl px-4 py-3 text-[13.5px] font-bold transition-all ' + (chosen ? 'bg-white/10 ring-2 ring-[#d8b878] text-white' : 'bg-white/5 text-[#e7e3d5] hover:bg-white/10')}
                  >
                    {s}
                  </button>
                );
              })}
            </div>

            {/* Editable offer fields */}
            <div className="mt-5 space-y-3">
              <input
                value={offerTitle}
                onChange={(e) => setOfferTitle(e.target.value)}
                placeholder="Or write your own, e.g. $20 off any drip this week"
                maxLength={90}
                className="w-full px-4 py-3 rounded-xl bg-white/95 text-slate-900 placeholder-slate-400 outline-none text-sm font-semibold"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  value={offerCode}
                  onChange={(e) => setOfferCode(e.target.value)}
                  placeholder="Promo code (optional)"
                  maxLength={24}
                  className="w-full px-4 py-3 rounded-xl bg-white/95 text-slate-900 placeholder-slate-400 outline-none text-sm"
                />
                <div>
                  <label className="block text-[11px] font-bold text-[#c4c9b8] uppercase tracking-wide mb-1">Ends on</label>
                  <input
                    type="date"
                    value={offerExpires}
                    onChange={(e) => setOfferExpires(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/95 text-slate-900 outline-none text-sm"
                  />
                </div>
              </div>
              <p className="text-[11px] text-[#c4c9b8]">Keep it about the deal, not medical claims. Leave the date blank for an open-ended offer, or clear the title to remove it.</p>
            </div>
          </section>
        </div>

        {error && (
          <div className="mt-6 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold">{error}</div>
        )}
      </main>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-slate-200 z-30">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <span className="text-[12px] text-slate-400 font-bold hidden sm:block">Publishes to your live listing instantly</span>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 bg-[#0F6E56] text-white px-8 py-3.5 rounded-xl font-black text-sm hover:bg-[#0A5742] disabled:opacity-60 transition-all shadow-lg shadow-emerald-200 w-full sm:w-auto"
          >
            {saving ? (<><Loader2 size={16} className="animate-spin" /> Saving...</>) : (<>Save and publish <ArrowRight size={16} /></>)}
          </button>
        </div>
      </div>
    </div>
  );
}
