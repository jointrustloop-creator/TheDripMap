import React from 'react';
import Link from 'next/link';
import { Instagram, Facebook, Linkedin, Twitter, ArrowRight } from 'lucide-react';
import { Logo } from './Logo';

// Canada-only footer. No US block. Static (no per-page data fetch) so it stays
// fast on every page. Hubs link to Canadian city pages; "View all Canadian
// cities" points at the /canada index.

const TREATMENTS = [
  { label: 'All Treatments', href: '/treatments', strong: true },
  { label: 'NAD+ Therapy', href: '/treatments/nad-plus' },
  { label: 'Myers Cocktail', href: '/treatments/myers-cocktail' },
  { label: 'Vitamin C IV', href: '/treatments/high-dose-vitamin-c' },
  { label: 'Hydration Drips', href: '/treatments/hydration' },
  { label: 'Mobile IV', href: '/search?type=Mobile' },
  { label: 'Hangover Relief', href: '/treatments/hangover' },
];

const GUIDES = [
  { label: 'IV Price Index (Canada)', href: '/iv-prices', strong: true },
  { label: 'IV Therapy Insurance Coverage in Canada', href: '/blog/iv-therapy-insurance-coverage-canada' },
  { label: 'Who Can Legally Give IV Therapy by Province', href: '/blog/who-can-legally-give-iv-canada-rules-by-province-2026' },
  { label: 'Mobile IV Therapy Toronto & GTA', href: '/blog/mobile-iv-therapy-toronto-gta' },
  { label: 'Is IV Therapy Worth It', href: '/blog/is-iv-therapy-a-scam-what-the-science-says' },
  { label: 'All Guides', href: '/guide', strong: true },
];

const CANADIAN_HUBS = [
  { label: 'Toronto & GTA', href: '/cities/toronto' },
  { label: 'Vancouver', href: '/cities/vancouver' },
  { label: 'Calgary', href: '/cities/calgary' },
  { label: 'Ottawa', href: '/cities/ottawa' },
  { label: 'Edmonton', href: '/cities/edmonton' },
  { label: 'Montreal', href: '/cities/montreal' },
];

const COMPANY = [
  { label: 'About', href: '/about' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' },
];

const FOR_CLINICS = [
  { label: 'For Clinic Owners', href: '/for-clinics' },
  { label: 'Claim Your Clinic', href: '/for-clinics/setup' },
  { label: 'Free SEO Audit', href: '/tools/seo-audit' },
  { label: 'Safety Compliance', href: '/resources/safety-checker' },
];

const linkClass = 'hover:text-wellness-600 transition-colors';

function Column({ title, links }: { title: string; links: { label: string; href: string; strong?: boolean }[] }) {
  return (
    <div>
      <h4 className="font-bold mb-6 text-sm uppercase tracking-wider text-slate-400">{title}</h4>
      <ul className="space-y-4 text-slate-600 text-sm">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link href={l.href} className={l.strong ? `${linkClass} font-bold text-slate-900` : linkClass}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export const Footer = () => {
  return (
    <footer className="bg-white border-t-2 border-[#0F6E56] py-12 px-6 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Brand */}
        <div className="lg:col-span-1 flex flex-col items-start text-left">
          <Link href="/" className="inline-flex mb-6 self-start">
            <Logo />
          </Link>
          <p className="text-[15px] text-slate-500 max-w-sm leading-relaxed">
            The IV therapy matching platform. We match you with the right clinic based on your specific health goals, location, and budget, all in under 60 seconds.
          </p>
          <div className="mt-5 flex items-center gap-2">
            <a
              href="https://www.instagram.com/thedripmap/"
              target="_blank"
              rel="me noopener noreferrer"
              aria-label="TheDripMap on Instagram"
              className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 text-slate-400 hover:text-wellness-700 hover:border-wellness-200 hover:bg-wellness-50 transition-all"
            >
              <Instagram size={16} strokeWidth={2} />
            </a>
            <a href="#" aria-label="TheDripMap on Facebook" className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 text-slate-400 hover:text-wellness-700 hover:border-wellness-200 hover:bg-wellness-50 transition-all">
              <Facebook size={16} strokeWidth={2} />
            </a>
            <a href="#" aria-label="TheDripMap on LinkedIn" className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 text-slate-400 hover:text-wellness-700 hover:border-wellness-200 hover:bg-wellness-50 transition-all">
              <Linkedin size={16} strokeWidth={2} />
            </a>
            <a href="#" aria-label="TheDripMap on X" className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 text-slate-400 hover:text-wellness-700 hover:border-wellness-200 hover:bg-wellness-50 transition-all">
              <Twitter size={16} strokeWidth={2} />
            </a>
          </div>
        </div>

        {/* Link columns */}
        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          <Column title="Treatments" links={TREATMENTS} />
          <Column title="Popular Guides" links={GUIDES} />
          <div>
            <h4 className="font-bold mb-6 text-sm uppercase tracking-wider text-slate-400">Canadian Hubs</h4>
            <ul className="space-y-4 text-slate-600 text-sm">
              {CANADIAN_HUBS.map((c) => (
                <li key={c.href}>
                  <Link href={c.href} className={linkClass}>{c.label}</Link>
                </li>
              ))}
              <li>
                <Link href="/canada" className="inline-flex items-center gap-1 text-wellness-600 font-bold hover:underline">
                  View all Canadian cities <ArrowRight size={13} />
                </Link>
              </li>
            </ul>
          </div>
          <Column title="Company" links={COMPANY} />
          <Column title="For Clinics" links={FOR_CLINICS} />
        </div>
      </div>

      {/* Legal */}
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-100 flex flex-col items-center gap-5 text-center">
        <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
          TheDripMap is a matching platform. Information on this site is for educational purposes only and does not constitute medical advice. Always consult a licensed healthcare professional.
        </p>
        <div className="flex items-center gap-5 text-sm text-slate-500">
          <Link href="/privacy" className={linkClass}>Privacy Policy</Link>
          <span className="text-slate-300">·</span>
          <Link href="/terms" className={linkClass}>Terms of Service</Link>
        </div>
        <div className="text-slate-400 text-sm">© 2026 TheDripMap. All rights reserved.</div>
      </div>
    </footer>
  );
};

export default Footer;
