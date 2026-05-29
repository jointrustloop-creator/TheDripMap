'use client';

import React from 'react';
import { Calendar, Sparkles, ShieldCheck, Check, X, ArrowRight, Phone, MapPin } from 'lucide-react';
import { DripAssistant } from '../../../src/components/DripAssistant';

const EMERALD = '#0F6E56';

// Fake clinic — fully synthetic. The matching overlay lives in
// src/lib/whitelabel-configs.ts under the same slug so the chat agent
// behaves correctly when this page mounts the white-label widget.
const DEMO_SLUG = 'drip-and-glow-wellness-toronto';
const DEMO_NAME = 'Drip & Glow Wellness';
const DEMO_TAGLINE = 'IV Therapy & Wellness · Toronto, ON';

export function ClinicAgentDemoClient() {
  return (
    <div className="min-h-screen bg-[#F8F7F3]">
      {/* Banner — make it crystal clear this is a sales demo, not a real clinic */}
      <div className="text-white text-center text-xs font-bold tracking-wider uppercase py-2" style={{ backgroundColor: EMERALD }}>
        Demo · This page shows what the Drip Assistant looks like on YOUR clinic site
      </div>

      {/* Fake clinic site hero */}
      <main>
        <section className="relative bg-gradient-to-b from-emerald-50 via-white to-[#F8F7F3] overflow-hidden">
          <div className="absolute inset-0 [background-image:radial-gradient(#0F6E56_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-[0.04]" />
          <div className="relative max-w-5xl mx-auto px-6 py-16 md:py-24">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black" style={{ backgroundColor: EMERALD }}>
                  D
                </div>
                <span className="font-black text-slate-900 tracking-tight">{DEMO_NAME}</span>
              </div>
              <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-slate-600">
                <span>Treatments</span>
                <span>About</span>
                <span>Pricing</span>
                <span>Contact</span>
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-white" style={{ backgroundColor: EMERALD }}>
                  <Calendar size={14} /> Book
                </span>
              </nav>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 mb-5">
                  <Sparkles size={13} className="text-emerald-700" />
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-700">Toronto's premium IV lounge</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight mb-5">
                  Feel like yourself again — in under an hour.
                </h1>
                <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                  IV therapy, NAD+, Myers cocktails, and glow drips delivered by Toronto's most
                  trusted wellness team. Book in 30 seconds.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-black text-sm shadow-lg" style={{ backgroundColor: EMERALD }}>
                    <Calendar size={16} /> Book a Drip
                  </button>
                  <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white border-2 border-slate-200 text-slate-700 font-black text-sm">
                    See the menu <ArrowRight size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-5 mt-8 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1.5"><MapPin size={14} /> 145 Queen St W</span>
                  <span className="inline-flex items-center gap-1.5"><Phone size={14} /> (416) 555-0142</span>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-square rounded-3xl bg-gradient-to-br from-emerald-200 via-emerald-100 to-white border border-emerald-100 shadow-xl flex items-center justify-center">
                  <div className="text-7xl">💧</div>
                </div>
                <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl border border-slate-100 p-3 shadow-lg flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-600" />
                  <div className="text-xs">
                    <div className="font-black text-slate-900">5/5 Safety Verified</div>
                    <div className="text-slate-500">Medical director on staff</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pointer card — tell the visitor what to do */}
        <section className="max-w-4xl mx-auto px-6 -mt-6">
          <div className="rounded-2xl border-2 border-dashed border-emerald-300 bg-white p-5 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
              <ArrowRight size={20} />
            </div>
            <div className="flex-1">
              <div className="font-black text-slate-900">Try the agent in the corner →</div>
              <div className="text-sm text-slate-600">
                Ask &ldquo;how much is NAD+?&rdquo;, &ldquo;what's a Myers cocktail?&rdquo;, or &ldquo;how do I book?&rdquo; — the same questions
                your patients ask.
              </div>
            </div>
          </div>
        </section>

        {/* Side-by-side comparison */}
        <section className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 mb-3">
              What's different about YOUR agent
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              The public Drip Assistant on TheDripMap is a directory concierge. Your agent is
              your clinic's concierge — laser-focused on your patients and your bookings.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Public */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                  <span className="text-slate-500 font-black text-sm">∞</span>
                </div>
                <span className="font-black text-slate-900">Public Drip Assistant</span>
              </div>
              <ul className="space-y-3 text-sm">
                {[
                  'Searches across 770+ clinics in North America',
                  'Asks for the user\'s city before recommending',
                  'Distance-ranks competitors next to your clinic',
                  'Mentions TheDripMap brand throughout',
                  'Generic prices ("$100–$350 typical")',
                ].map((s) => (
                  <li key={s} className="flex items-start gap-2 text-slate-600">
                    <X size={16} className="text-slate-400 shrink-0 mt-0.5" /> {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* White-label */}
            <div className="bg-white rounded-2xl border-2 p-6 shadow-lg" style={{ borderColor: EMERALD }}>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm" style={{ backgroundColor: EMERALD }}>
                  ✓
                </div>
                <span className="font-black text-slate-900">YOUR clinic agent</span>
                <span className="ml-auto inline-flex items-center rounded-full text-white px-2 py-0.5 text-[10px] font-black uppercase tracking-wide" style={{ backgroundColor: EMERALD }}>
                  This page
                </span>
              </div>
              <ul className="space-y-3 text-sm">
                {[
                  'Knows ONLY your menu, your prices, your hours',
                  'Identifies itself by your clinic name',
                  'Never recommends a competitor',
                  'Sends bookings straight to your booking system',
                  'Real prices straight from your menu',
                ].map((s) => (
                  <li key={s} className="flex items-start gap-2 text-slate-700 font-medium">
                    <Check size={16} className="text-emerald-600 shrink-0 mt-0.5" /> {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-3xl mx-auto px-6 py-16 text-center">
          <div className="rounded-3xl p-10 md:p-14 text-white shadow-2xl" style={{ backgroundColor: EMERALD }}>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
              Want this on your clinic site?
            </h2>
            <p className="text-emerald-50 text-lg mb-8 max-w-xl mx-auto">
              We'll have your agent live and answering patient questions within a week. One
              line of code, your menu, your booking link.
            </p>
            <a
              href="mailto:info@thedripmap.com?subject=Whitelabel%20Drip%20Assistant%20setup"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white font-black text-sm shadow-lg hover:scale-[1.02] transition-transform"
              style={{ color: EMERALD }}
            >
              <Calendar size={16} /> Book a setup call
            </a>
            <div className="mt-5 text-emerald-50/80 text-sm">
              Or email <a className="underline" href="mailto:info@thedripmap.com">info@thedripmap.com</a>
            </div>
          </div>
        </section>

        <div className="text-center text-xs text-slate-400 pb-10">
          Drip &amp; Glow Wellness is a fictional clinic created for this demo. All prices, hours, and reviews are illustrative.
        </div>
      </main>

      {/* Mount the actual Drip Assistant in white-label mode for this clinic. */}
      <DripAssistant clinicSlug={DEMO_SLUG} clinicName={DEMO_NAME} tagline={DEMO_TAGLINE} />
    </div>
  );
}
