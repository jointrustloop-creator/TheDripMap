'use client';

import React, { useState } from 'react';
import { CheckCircle2, ShieldCheck, Upload, ArrowRight, Loader2, Image as ImageIcon } from 'lucide-react';

interface PrefillDrip { name?: string; price?: string | null }
interface Prefill {
  team?: { whoPlaces?: string[]; oversight?: string; leadName?: string };
  drips?: PrefillDrip[];
  firstVisit?: { consult?: string; length?: string; booking?: string };
  sourcing?: string[];
  payment?: string[];
  about?: string;
  offer?: { title?: string; code?: string; expires?: string };
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

const GREEN = '#0F6E56';

const WHO_PLACES = ['RN', 'NP', 'ND', 'MD', 'Paramedic'];
const OVERSIGHT = ['On-site physician', 'Medical director (off-site)', 'Nurse practitioner', 'Naturopathic doctor'];
const DRIPS = ['Hydration', 'Myers Cocktail', 'NAD+', 'Immune', 'Glutathione / Beauty', 'Hangover', 'Energy / B12', 'Athletic recovery', 'Weight loss'];
const CONSULT = ['Required', 'Optional', 'No'];
const LENGTH = ['30 min', '45 min', '60 min', '90+ min'];
const BOOKING = ['By appointment', 'Walk-ins welcome', 'Both'];
const SOURCING = ['Licensed compounding pharmacy', 'Pharmaceutical wholesaler', 'Prepared on site'];
const PAYMENT = ['Receipts for extended health benefits', 'Direct billing', 'HSA/FSA', 'Memberships / packages', 'Pay per visit'];

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
  const [selectedDrips, setSelectedDrips] = useState<string[]>((pf.drips || []).map((d) => d.name || '').filter(Boolean));
  const [prices, setPrices] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    (pf.drips || []).forEach((d) => { if (d.name && d.price) m[d.name] = String(d.price).replace('$', ''); });
    return m;
  });
  const [consult, setConsult] = useState<string>(pf.firstVisit?.consult || '');
  const [length, setLength] = useState<string>(pf.firstVisit?.length || '');
  const [booking, setBooking] = useState<string>(pf.firstVisit?.booking || '');
  const [sourcing, setSourcing] = useState<string[]>(pf.sourcing || []);
  const [payment, setPayment] = useState<string[]>(pf.payment || []);
  const [about, setAbout] = useState<string>(pf.about || '');
  const [logo, setLogo] = useState<File | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);

  const [offerTitle, setOfferTitle] = useState<string>(pf.offer?.title || '');
  const [offerCode, setOfferCode] = useState<string>(pf.offer?.code || '');
  const [offerExpires, setOfferExpires] = useState<string>(pf.offer?.expires || '');

  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const toggle = (arr: string[], setArr: (v: string[]) => void, val: string) =>
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  // Live completion across the 6 sections, to nudge owners to finish.
  const sectionsDone =
    (whoPlaces.length || oversight || leadName.trim() ? 1 : 0) +
    (selectedDrips.length ? 1 : 0) +
    (consult || length || booking ? 1 : 0) +
    (sourcing.length ? 1 : 0) +
    (payment.length ? 1 : 0) +
    (logo || photos.length || about.trim() || hasLogo || photoCount > 0 ? 1 : 0);
  const pctDone = Math.round((sectionsDone / 6) * 100);

  async function save() {
    setSaving(true);
    setError('');
    try {
      const answers = {
        token,
        team: { whoPlaces, oversight, leadName: leadName.trim() },
        drips: selectedDrips.map((n) => ({ name: n, price: prices[n] ? prices[n].trim() : null })),
        firstVisit: { consult, length, booking },
        sourcing,
        payment,
        about: about.trim(),
        offer: { title: offerTitle.trim(), code: offerCode.trim(), expires: offerExpires },
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
      {/* Slim branded header */}
      <header className="bg-[#1f3a27] text-[#f3efe2]">
        <div className="max-w-2xl mx-auto px-6 py-3 flex items-center gap-2">
          <span className="font-serif italic text-[#d8b878] text-lg">TheDripMap</span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#c4c9b8] font-bold">Owner portal</span>
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
              <span className="text-[12px] font-black uppercase tracking-[0.12em] text-[#0F6E56]">{sectionsDone} of 6 complete</span>
              <span className="text-[12px] font-bold text-slate-400">{pctDone}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full bg-[#0F6E56] rounded-full transition-all duration-500" style={{ width: `${pctDone}%` }} />
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <SectionCard step={1} title="Who will patients meet?" hint="The single biggest trust signal for patients choosing a clinic.">
            <div className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2">Who places the IVs?</div>
            <div className="flex flex-wrap gap-2 mb-5">
              {WHO_PLACES.map((o) => <Chip key={o} active={whoPlaces.includes(o)} onClick={() => toggle(whoPlaces, setWhoPlaces, o)}>{o}</Chip>)}
            </div>
            <div className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2">Medical oversight</div>
            <div className="flex flex-wrap gap-2 mb-5">
              {OVERSIGHT.map((o) => <Chip key={o} active={oversight === o} onClick={() => setOversight(oversight === o ? '' : o)}>{o}</Chip>)}
            </div>
            <div className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2">Lead practitioner (optional)</div>
            <input
              value={leadName}
              onChange={(e) => setLeadName(e.target.value)}
              placeholder="e.g. Dr. Megan Maycher, ND"
              maxLength={80}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#0F6E56] focus:ring-2 focus:ring-[#0F6E56]/20 outline-none text-sm"
            />
          </SectionCard>

          <SectionCard step={2} title="Your drips and prices" hint="Tap the drips you offer. Add a from price if you like, it is optional.">
            <div className="space-y-2.5">
              {DRIPS.map((d) => {
                const on = selectedDrips.includes(d);
                return (
                  <div key={d} className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggle(selectedDrips, setSelectedDrips, d)}
                      className={'flex-1 text-left px-4 py-3 rounded-xl text-sm font-bold border transition-all ' + (on ? 'bg-[#ebf1e5] text-[#1f3a27] border-[#0F6E56]/40' : 'bg-white text-slate-600 border-slate-200 hover:border-[#0F6E56]/30')}
                    >
                      <span className={'inline-flex items-center justify-center w-5 h-5 rounded-md mr-2 align-middle ' + (on ? 'bg-[#0F6E56] text-white' : 'bg-slate-100 text-transparent')}>
                        <CheckCircle2 size={13} />
                      </span>
                      {d}
                    </button>
                    {on && (
                      <div className="flex items-center gap-1 w-[120px]">
                        <span className="text-slate-400 font-bold text-sm">from $</span>
                        <input
                          inputMode="numeric"
                          value={prices[d] || ''}
                          onChange={(e) => setPrices({ ...prices, [d]: e.target.value.replace(/[^\d]/g, '') })}
                          placeholder="—"
                          className="w-full px-2 py-2 rounded-lg border border-slate-200 focus:border-[#0F6E56] outline-none text-sm text-center"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard step={3} title="A first visit">
            <div className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2">Do first-timers get a consultation?</div>
            <div className="flex flex-wrap gap-2 mb-5">{CONSULT.map((o) => <Chip key={o} active={consult === o} onClick={() => setConsult(consult === o ? '' : o)}>{o}</Chip>)}</div>
            <div className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2">Typical session length</div>
            <div className="flex flex-wrap gap-2 mb-5">{LENGTH.map((o) => <Chip key={o} active={length === o} onClick={() => setLength(length === o ? '' : o)}>{o}</Chip>)}</div>
            <div className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2">Booking</div>
            <div className="flex flex-wrap gap-2">{BOOKING.map((o) => <Chip key={o} active={booking === o} onClick={() => setBooking(booking === o ? '' : o)}>{o}</Chip>)}</div>
          </SectionCard>

          <SectionCard step={4} title="Safety and sourcing" hint="This helps you earn the Safety Verified badge patients look for.">
            <div className="flex flex-wrap gap-2">{SOURCING.map((o) => <Chip key={o} active={sourcing.includes(o)} onClick={() => toggle(sourcing, setSourcing, o)}>{o}</Chip>)}</div>
          </SectionCard>

          <SectionCard step={5} title="Payment">
            <div className="flex flex-wrap gap-2">{PAYMENT.map((o) => <Chip key={o} active={payment.includes(o)} onClick={() => toggle(payment, setPayment, o)}>{o}</Chip>)}</div>
          </SectionCard>

          <SectionCard step={6} title="Make it yours" hint="Real photos beat stock every time. Listings with photos get far more bookings.">
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

          {/* Bonus: slow-time offer. Optional, not counted toward the 6. Shows
              as a banner on your listing and on the deals feed until it expires. */}
          <section className="bg-gradient-to-br from-[#1f3a27] to-[#14352a] text-[#f3efe2] rounded-[1.75rem] p-6 md:p-8 shadow-[0_12px_34px_-22px_rgba(25,40,28,0.5)]">
            <div className="flex items-start gap-3.5 mb-2">
              <span className="flex-none w-8 h-8 rounded-full bg-[rgba(216,184,120,0.18)] text-[#d8b878] flex items-center justify-center">★</span>
              <div>
                <h2 className="text-lg font-black tracking-tight leading-tight">Slow week? Post an offer</h2>
                <p className="text-[13px] text-[#c4c9b8] mt-0.5">Optional. Fill quiet days. It shows on your listing and the local deals feed, and disappears on its own when it expires.</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <input
                value={offerTitle}
                onChange={(e) => setOfferTitle(e.target.value)}
                placeholder="Your offer, e.g. $20 off any drip this week"
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
            {saving ? (<><Loader2 size={16} className="animate-spin" /> Saving…</>) : (<>Save and publish <ArrowRight size={16} /></>)}
          </button>
        </div>
      </div>
    </div>
  );
}
