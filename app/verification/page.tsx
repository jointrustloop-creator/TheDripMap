import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Info, ArrowRight, ExternalLink } from 'lucide-react';
import { Navbar } from '../../src/components/Navbar';
import { Footer } from '../../src/components/Footer';

export const revalidate = 86400;

const SITE_URL = 'https://www.thedripmap.com';

export const metadata: Metadata = {
  title: 'How TheDripMap verifies clinics',
  description:
    'Exactly what we check on an IV therapy clinic, which public register we check it against, how often we re-check, and what we do not check. Our verification levels, explained plainly.',
  alternates: { canonical: `${SITE_URL}/verification` },
  openGraph: {
    title: 'How TheDripMap verifies clinics',
    description:
      'What we check, which public register we check it against, how often, and what we do not check. Our verification levels, explained plainly.',
    url: `${SITE_URL}/verification`,
    type: 'article',
  },
};

// The ladder, as adopted in docs/badge-standard.md §7. Wording here is the
// public-facing statement of what each level does and does not claim; it must
// stay in sync with that document.
const LEVELS: {
  id: string;
  name: string;
  live: boolean;
  what: string;
  claim: string;
  cadence: string;
  notClaim: string;
}[] = [
  {
    id: 'L1',
    name: 'Owner-provided',
    live: true,
    what:
      'The clinic answered our questions itself: who administers its IVs, who prescribes, what it offers. Nobody has checked those answers against an outside source.',
    claim: 'The clinic told us this.',
    cadence: 'We ask the clinic to confirm its answers are still current every 12 months.',
    notClaim:
      'This is not verification, and we never label it as such. It is shown as owner-provided so you know exactly where the information came from.',
  },
  {
    id: 'L2',
    name: 'Credentials Verified',
    live: true,
    what:
      'The clinic names the person who prescribes and oversees its IV protocols, along with their college registration number. We look that registration up on the relevant public register and confirm it is real, current, and unrestricted. For an Ontario clinic where a naturopathic doctor prescribes, we also check the College of Naturopaths IVIT premises register.',
    claim:
      'We confirmed this prescriber holds an active registration in good standing with the college named, on the date shown.',
    cadence:
      'Re-checked quarterly. The badge expires automatically after 12 months without a fresh check. If a register shows a registration has lapsed or been restricted, the badge comes off.',
    notClaim:
      'It does not mean the clinic is safe, that we inspected the premises, or that we assessed anyone’s quality of care. It is a credential check, nothing more.',
  },
  {
    id: 'L3',
    name: 'Documents Verified',
    live: false,
    what:
      'The clinic supplies a current certificate of insurance and evidence of where its IV bags are sourced or compounded. We review those documents.',
    claim: 'We reviewed documents the clinic provided, and recorded when they expire.',
    cadence: 'The badge expires when the document expires. No document, no badge.',
    notClaim:
      'We do not audit clinical operations, and we cannot confirm a document reflects day-to-day practice.',
  },
  {
    id: 'L4',
    name: 'Site-Assessed',
    live: false,
    what:
      'Someone from TheDripMap visits the clinic and works through a published checklist: the premises matches its register listing, a consent process exists, the person inserting the IV holds the credential the clinic claims, emergency equipment is present, consumables are single-use.',
    claim: 'An assessor visited and confirmed the items on our published checklist, on the date shown.',
    cadence: 'Valid 24 months, and withdrawn immediately if a safety complaint is substantiated.',
    notClaim:
      'This is not a regulatory inspection and it does not evaluate medical care. Only a college or health authority can do that.',
  },
  {
    id: 'L5',
    name: 'Regulator-Inspected',
    live: false,
    what:
      'Some IV clinics are inspected by their regulator, which publishes the outcome. In Ontario, every premises where a naturopathic doctor performs intravenous infusion therapy must be registered and inspected by the College of Naturopaths of Ontario, and the result is posted publicly. Where such an outcome exists, we show it and link to the regulator’s own register.',
    claim:
      'This premises passed inspection according to the regulator’s public register, on the date shown.',
    cadence: 'We re-check the register quarterly and show only the most recent outcome.',
    notClaim:
      'We did not conduct the inspection. The college did, and their register is the authority. We are repeating what it says and pointing you to it.',
  },
];

const REGISTERS: { label: string; who: string; href: string }[] = [
  {
    label: 'College of Physicians and Surgeons of Ontario',
    who: 'Physicians in Ontario',
    href: 'https://register.cpso.on.ca/',
  },
  {
    label: 'College of Nurses of Ontario',
    who: 'Nurses and nurse practitioners in Ontario',
    href: 'https://registry.cno.org/',
  },
  {
    label: 'College of Naturopaths of Ontario',
    who: 'Naturopathic doctors in Ontario, including IV authorization',
    href: 'https://cono.alinityapp.com/client/publicdirectory',
  },
  {
    label: 'CONO IVIT Premises Register',
    who: 'Ontario premises inspected for intravenous infusion therapy',
    href: 'https://cono.alinityapp.com/client/findcorporationdirectory',
  },
  {
    label: 'BC College of Nurses and Midwives',
    who: 'Nurses in British Columbia',
    href: 'https://registry.bccnm.ca/',
  },
  {
    label: 'College of Complementary Health Professionals of BC',
    who: 'Naturopathic doctors in British Columbia',
    href: 'https://cchpbc.ca/public/practitioner-search/',
  },
];

export default function VerificationPage() {
  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-16">
        <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-600 bg-slate-100 border border-slate-200 rounded-full px-3 py-1.5 mb-5">
          <ShieldCheck size={14} /> How it works
        </span>
        <h1 className="font-black text-slate-900 tracking-[-0.03em] leading-[1.05] text-[clamp(2rem,5vw,3rem)] mb-5">
          How we verify clinics
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed mb-4">
          Most directories take a clinic at its word. We would rather check, and then tell you exactly
          what we checked. This page lists every level of verification we use, which public register
          each one is checked against, how often we look again, and, just as importantly, what each
          level does not claim.
        </p>
        <p className="text-slate-600 leading-relaxed mb-8">
          Two rules run through all of it. Every badge names the authority behind it and the date it
          was checked. And we only use the word verified when something was checked against an outside
          register, never for information a clinic simply gave us.
        </p>

        <div className="my-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-center gap-2 mb-3 text-amber-900">
            <Info size={18} />
            <h2 className="text-lg font-black tracking-tight">What none of this means</h2>
          </div>
          <ul className="space-y-2 text-[15px] text-amber-900 leading-relaxed">
            <li>No badge on this site is a judgment about the quality of anyone&apos;s medical care.</li>
            <li>
              A badge is not a recommendation, and it is not medical advice. Whether a treatment is
              appropriate for you is a conversation for you and a clinician.
            </li>
            <li>
              An unbadged clinic is not a bad clinic. Most often it simply has not claimed its listing
              or given us anything to check yet.
            </li>
          </ul>
        </div>

        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">The levels</h2>
        <p className="text-slate-600 leading-relaxed mb-6">
          Levels are cumulative in strength, not in sequence. A clinic can sit at any level, and the
          level shown on its listing is the strongest one it currently holds.
        </p>

        <ol className="space-y-4 mb-10 list-none p-0">
          {LEVELS.map((l) => (
            <li key={l.id} className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6">
              <div className="flex items-center gap-3 flex-wrap mb-3">
                <span className="text-xs font-black text-wellness-700 bg-wellness-50 border border-wellness-100 rounded-full px-2.5 py-1">
                  {l.id}
                </span>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">{l.name}</h3>
                <span
                  className={
                    'ml-auto text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ' +
                    (l.live ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')
                  }
                >
                  {l.live ? 'In use today' : 'Planned'}
                </span>
              </div>
              <p className="text-[15px] text-slate-600 leading-relaxed mb-3">{l.what}</p>
              <dl className="space-y-2 text-[14px]">
                <div>
                  <dt className="font-black text-slate-900">What it claims</dt>
                  <dd className="text-slate-600 leading-relaxed">{l.claim}</dd>
                </div>
                <div>
                  <dt className="font-black text-slate-900">How often we check</dt>
                  <dd className="text-slate-600 leading-relaxed">{l.cadence}</dd>
                </div>
                <div>
                  <dt className="font-black text-slate-900">What it does not claim</dt>
                  <dd className="text-slate-600 leading-relaxed">{l.notClaim}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ol>

        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
          Check any clinic yourself
        </h2>
        <p className="text-slate-600 leading-relaxed mb-6">
          Everything we check is public. You can look up any practitioner or premises without us, and
          we think you should feel free to. These are the registers we use.
        </p>
        <ul className="space-y-2 mb-4">
          {REGISTERS.map((r) => (
            <li key={r.href} className="bg-white border border-slate-200 rounded-2xl p-4">
              <a
                href={r.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-black text-slate-900 text-[15px] hover:text-wellness-700 inline-flex items-center gap-1.5"
              >
                {r.label} <ExternalLink size={13} />
              </a>
              <div className="text-[14px] text-slate-500 leading-relaxed">{r.who}</div>
            </li>
          ))}
        </ul>
        <p className="text-[14px] text-slate-500 leading-relaxed mb-10">
          Registers are run by the colleges, not by us, and they are the authority if anything we show
          disagrees with them. Links checked August 2026.
        </p>

        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
          If something looks wrong
        </h2>
        <p className="text-slate-600 leading-relaxed mb-4">
          If a badge on this site does not match what a register says, tell us and we will re-check it
          and correct or remove it. If your concern is about the care a clinic provided, the college
          that regulates the practitioner is the right place to raise it, and every register above
          links to that college&apos;s complaints process.
        </p>
        <p className="text-slate-600 leading-relaxed mb-10">
          Email <a className="text-wellness-700 font-bold" href="mailto:info@thedripmap.com">info@thedripmap.com</a>.
          Corrections are free, and they apply to claimed and unclaimed listings alike.
        </p>

        <div className="rounded-3xl bg-slate-900 text-white p-8 md:p-10 text-center">
          <h2 className="text-2xl font-black tracking-tight mb-3">Own an IV therapy clinic?</h2>
          <p className="text-slate-300 mb-6 max-w-lg mx-auto leading-relaxed">
            Claiming your free listing lets you tell patients who prescribes and who administers your
            IVs. Give us a registration number and we will check it against the public register.
          </p>
          <Link
            href="/for-clinics"
            className="inline-flex items-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-2xl font-black hover:bg-slate-100 transition-all"
          >
            Claim your listing <ArrowRight size={18} />
          </Link>
        </div>

        <p className="text-[13px] text-slate-400 leading-relaxed mt-10">
          Our full verification standard, including the exact evidence we require and how badges
          expire, is documented internally and reviewed whenever the rules change. This page is kept
          in step with it.
        </p>
      </main>
      <Footer />
    </div>
  );
}
