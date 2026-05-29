import type { Metadata } from 'next';
import Link from 'next/link';
import { Code2, Check, Calendar, Shield, Mail, ArrowRight } from 'lucide-react';

const EMERALD = '#0F6E56';
const title = 'Install the Drip Assistant on your clinic site — TheDripMap';
const description = 'Add the Drip Assistant chat agent to your IV therapy clinic site in under 5 minutes. One script tag, fully branded, books appointments 24/7.';

// Sales/operational page — not for search.
export const metadata: Metadata = {
  title,
  description,
  robots: { index: false, follow: false },
};

const SNIPPET = `<!-- TheDripMap Clinic Agent — paste before </head> -->
<script async
  src="https://www.thedripmap.com/clinic-agent.js"
  data-clinic="your-clinic-slug"></script>`;

const CHECKLIST = [
  { label: 'Clinic name', detail: 'Exactly as you want it shown in the chat header.' },
  { label: 'Logo URL', detail: 'PNG or SVG, square preferred. Hosted anywhere reachable on the public internet.' },
  { label: 'Treatment menu', detail: 'Names + current prices + a one-line description of each.' },
  { label: 'Booking URL', detail: 'JaneApp, Vagaro, Square, Mindbody, Acuity, GlossGenius, Boulevard — whatever you use.' },
  { label: 'Hours', detail: 'Per-day open/close, or a human-readable line like "Mon-Fri 10am-7pm, Sat 10am-4pm, Sun closed".' },
  { label: 'Phone number', detail: 'For the fallback CALL TO BOOK button if you don\'t use online booking.' },
];

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: 'What patient data is sent to TheDripMap?',
    a: 'Only the chat messages, the slug of your clinic, and (optionally) the patient\'s browser-provided city for distance-aware answers. We never store credit card, PHI, or identifiable health info. Messages are kept in transient logs for 30 days for debugging only.',
  },
  {
    q: 'How is privacy handled?',
    a: 'The widget runs on TheDripMap infrastructure — no patient data ever touches your servers. We are not a covered entity under HIPAA. Patients are informed in the chat that it is an AI assistant and should not be used for medical advice. For HIPAA-regulated use cases, contact us.',
  },
  {
    q: 'Can I style the chat to match my brand?',
    a: 'v1 uses the TheDripMap emerald accent and a white card UI. v1.1 adds a brandColor option you can pass to the script tag. Logo and clinic name appear in the chat header right now.',
  },
  {
    q: 'Will my agent recommend other clinics?',
    a: 'No. In white-label mode the system prompt is rewritten so your agent only knows about your menu and your booking link. It never mentions TheDripMap or any other clinic.',
  },
  {
    q: 'What about safety-sensitive treatments like NAD+ or GLP-1?',
    a: 'The agent runs a structured safety screening for higher-risk treatments. If a patient flags a contraindication, it gently redirects them to book a consultation with your medical team rather than confirming a specific drip.',
  },
  {
    q: 'How long does setup take?',
    a: 'Under an hour on our side. Once your slug is configured, you paste one line into your site\'s <head> and the agent is live.',
  },
];

export default function ClinicAgentInstallPage() {
  return (
    <div className="min-h-screen bg-[#F8F7F3]">
      <div className="text-white text-center text-xs font-bold tracking-wider uppercase py-2" style={{ backgroundColor: EMERALD }}>
        Install instructions · For clinic owners
      </div>
      <main className="max-w-3xl mx-auto px-6 py-14 md:py-20">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 mb-5">
            <Code2 size={13} className="text-emerald-700" />
            <span className="text-xs font-black uppercase tracking-wider text-emerald-700">5-minute install</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-4 leading-tight">
            Add the Drip Assistant to your clinic site
          </h1>
          <p className="text-slate-600 text-lg max-w-xl mx-auto">
            One <code className="px-1.5 py-0.5 rounded bg-slate-100 text-sm">&lt;script&gt;</code> tag. Your clinic name in the header. Your menu, your booking link, your hours.
          </p>
        </div>

        {/* Snippet */}
        <section className="bg-white rounded-3xl border border-slate-200 p-7 md:p-9 mb-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Step 1 of 1</span>
            <span className="text-xs font-bold text-slate-600">Paste this into your site&rsquo;s <code>&lt;head&gt;</code></span>
          </div>
          <pre className="overflow-x-auto bg-slate-950 text-slate-100 rounded-2xl p-5 text-xs md:text-sm font-mono leading-relaxed">
{SNIPPET}
          </pre>
          <p className="mt-4 text-sm text-slate-600">
            Replace <code className="px-1.5 py-0.5 rounded bg-slate-100">your-clinic-slug</code> with the slug we assign you during setup
            (e.g. <code className="px-1.5 py-0.5 rounded bg-slate-100">drip-and-glow-wellness-toronto</code>).
            The widget floats in the bottom-right corner of every page it loads on.
          </p>
        </section>

        {/* Preview link */}
        <section className="bg-white rounded-3xl border border-slate-200 p-7 md:p-9 mb-10">
          <h2 className="font-black text-slate-900 text-xl mb-2">Want to see it first?</h2>
          <p className="text-slate-600 text-sm mb-5">
            We have a live demo on a fake clinic site — exact same widget, real chat agent, no commitment.
          </p>
          <Link href="/tools/clinic-agent-demo" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-black text-sm shadow-lg" style={{ backgroundColor: EMERALD }}>
            Open the live demo <ArrowRight size={15} />
          </Link>
        </section>

        {/* Checklist */}
        <section className="bg-white rounded-3xl border border-slate-200 p-7 md:p-9 mb-10">
          <h2 className="font-black text-slate-900 text-xl mb-1">What we need from you to activate</h2>
          <p className="text-slate-600 text-sm mb-6">Send these by email (info@thedripmap.com) and we&rsquo;ll have your slug live in under an hour.</p>
          <ul className="space-y-4">
            {CHECKLIST.map((item) => (
              <li key={item.label} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={13} className="text-emerald-700" />
                </div>
                <div className="flex-1">
                  <div className="font-black text-slate-900 text-sm">{item.label}</div>
                  <div className="text-slate-600 text-sm">{item.detail}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* FAQ */}
        <section className="bg-white rounded-3xl border border-slate-200 p-7 md:p-9 mb-10">
          <div className="flex items-center gap-2 mb-6">
            <Shield size={18} className="text-emerald-700" />
            <h2 className="font-black text-slate-900 text-xl">FAQ</h2>
          </div>
          <div className="space-y-5">
            {FAQ.map(({ q, a }) => (
              <div key={q}>
                <div className="font-black text-slate-900 text-sm mb-1.5">{q}</div>
                <div className="text-slate-600 text-sm leading-relaxed">{a}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-3xl p-10 md:p-12 text-center text-white shadow-2xl" style={{ backgroundColor: EMERALD }}>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3">Ready to install?</h2>
          <p className="text-emerald-50 text-lg mb-7 max-w-lg mx-auto">
            We&rsquo;ll set up your slug, plug in your menu, and walk you through pasting the snippet. ~30 minutes on a call.
          </p>
          <a
            href="mailto:info@thedripmap.com?subject=Whitelabel%20Drip%20Assistant%20setup"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white font-black text-sm shadow-lg hover:scale-[1.02] transition-transform"
            style={{ color: EMERALD }}
          >
            <Calendar size={16} /> Book a setup call
          </a>
          <div className="mt-5 text-emerald-50/80 text-sm inline-flex items-center gap-2 justify-center">
            <Mail size={14} />
            <a className="underline" href="mailto:info@thedripmap.com">info@thedripmap.com</a>
          </div>
        </section>
      </main>
    </div>
  );
}
