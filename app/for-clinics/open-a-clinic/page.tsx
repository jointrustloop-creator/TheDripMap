import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, ClipboardList, Stethoscope, FlaskConical, ArrowRight } from 'lucide-react';
import { Navbar } from '../../../src/components/Navbar';
import { Footer } from '../../../src/components/Footer';
import { FounderLeadForm } from '../../../src/components/FounderLeadForm';

const SITE_URL = 'https://www.thedripmap.com';

export const metadata: Metadata = {
  title: 'How to Open an IV Therapy Clinic in Canada (2026)',
  description: 'What founders line up before opening an IV therapy clinic in Canada: who can legally administer IVs by province, medical oversight, compounding pharmacy sourcing, and where to get matched with vetted help.',
  alternates: { canonical: `${SITE_URL}/for-clinics/open-a-clinic` },
};

// Monetization Lane 3 (2026-08-07): founder funnel. Content deliberately links
// to our sourced province guides instead of restating regulatory claims; the
// page's job is orientation + lead capture, not legal advice.
export default function OpenAClinicPage() {
  const steps = [
    {
      Icon: ShieldCheck,
      title: 'Know who can legally start an IV in your province',
      body: 'The rules differ by province, and they decide your staffing model. Start with our plain-language guides, each sourced to the actual regulator:',
      links: [
        { label: 'Ontario', href: '/blog/who-can-legally-give-iv-ontario-2026' },
        { label: 'British Columbia', href: '/blog/who-can-legally-give-iv-british-columbia-2026' },
        { label: 'Alberta', href: '/blog/who-can-legally-give-iv-alberta-2026' },
        { label: 'Quebec', href: '/blog/who-can-legally-give-iv-quebec-2026' },
        { label: 'All provinces', href: '/blog/who-can-legally-give-iv-canada-rules-by-province-2026' },
      ],
    },
    {
      Icon: Stethoscope,
      title: 'Line up your medical oversight',
      body: 'Most wellness IV clinics run on a prescriber relationship: a physician or nurse practitioner behind the protocols, or an authorized naturopathic doctor where provincial rules allow. Founders consistently say this is the hardest piece to find, and it is where we can point you to vetted people.',
      links: [],
    },
    {
      Icon: FlaskConical,
      title: 'Source ingredients properly',
      body: 'What goes in the bag has to be legal to compound and administer. That usually means a relationship with a licensed compounding pharmacy and documented sourcing, the same things patients are told to ask about.',
      links: [],
    },
    {
      Icon: ClipboardList,
      title: 'Get found from day one',
      body: 'When you open, your listing on TheDripMap is free, and the patients comparing clinics in your city are already here. Claiming takes two minutes.',
      links: [{ label: 'See how listings work', href: '/for-clinics' }],
    },
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="max-w-2xl mb-12">
          <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-wellness-700 bg-wellness-50 border border-wellness-200 rounded-full px-3 py-1.5 mb-5">
            For founders
          </span>
          <h1 className="font-black text-slate-900 tracking-[-0.03em] leading-[1.05] text-[clamp(2rem,5.5vw,3.25rem)] mb-5">
            Opening an IV therapy clinic in Canada?
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            We track every IV clinic in Canada, publish the provincial rules in plain language, and talk to
            clinic owners every week. Here is the honest starting map, and a hand if you want one.
          </p>
        </div>

        <div className="space-y-6 mb-14">
          {steps.map((s, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-full bg-wellness-50 text-wellness-700 flex items-center justify-center shrink-0 ring-1 ring-wellness-100">
                  <s.Icon size={20} />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-black text-slate-900 mb-2 tracking-tight">{i + 1}. {s.title}</h2>
                  <p className="text-slate-600 leading-relaxed">{s.body}</p>
                  {s.links.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {s.links.map((l) => (
                        <Link key={l.href} href={l.href} className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-wellness-50 border border-slate-200 hover:border-wellness-300 px-3.5 py-2 rounded-xl text-[13px] font-bold text-slate-700 hover:text-wellness-700 transition-all">
                          {l.label} <ArrowRight size={13} />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="max-w-2xl mx-auto mb-6 text-center">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-3">Want a shortcut to the right people?</h2>
          <p className="text-slate-600 leading-relaxed">
            Tell us where you are at. We will point you to the right provincial guide, and where it helps, connect
            you with vetted medical directors, consultants, or suppliers from the market we cover every day.
          </p>
        </div>
        <div className="max-w-2xl mx-auto">
          <FounderLeadForm />
        </div>

        <p className="text-xs text-slate-400 text-center mt-10 max-w-xl mx-auto leading-relaxed">
          General information only, not legal or medical advice. Provincial rules change; always confirm current
          requirements with the relevant regulatory college.
        </p>
      </main>
      <Footer />
    </div>
  );
}
