import Link from 'next/link';
import { CalendarCheck, ArrowRight } from 'lucide-react';

/**
 * End-of-article conversion CTA for blog posts. Blog posts are where the search
 * traffic actually lands (5 of the top 8 pages by clicks), but the only calls to
 * action lived in the sidebar (off-screen on mobile) and none mentioned that a
 * patient can now send a booking request. This surfaces that path in the flow of
 * the article: city-specific posts route to their city hub (verified clinics +
 * booking buttons); everything else routes to the quiz, which matches the reader
 * to a clinic where they can book.
 *
 * Honest about the flow: the clinic confirms the time by email, and no payment is
 * taken on TheDripMap.
 */
export function BlogBookingCTA({ cityName, href }: { cityName?: string; href: string }) {
  const inCity = Boolean(cityName);
  return (
    <aside className="mt-16 rounded-[2rem] bg-wellness-900 text-white p-8 md:p-10 relative overflow-hidden not-prose">
      <div className="absolute top-0 right-0 w-40 h-40 bg-wellness-800 rounded-bl-[6rem] -mr-10 -mt-10" aria-hidden="true" />
      <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-7 justify-between">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.15em] text-wellness-200 mb-3">
            <CalendarCheck size={14} /> Book a session
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-3 leading-tight text-white">
            {inCity ? `Ready to book IV therapy in ${cityName}?` : 'Ready to book your IV therapy session?'}
          </h2>
          <p className="text-wellness-100 text-sm md:text-[15px] leading-relaxed">
            {inCity
              ? `Browse Safety Verified clinics in ${cityName}, pick your treatment and the times that work for you, and send a booking request. The clinic confirms your time by email. No payment is taken on TheDripMap.`
              : `Answer a few quick questions, get matched with clinics near you, and send a booking request in a couple of clicks. The clinic confirms your time by email. No payment is taken on TheDripMap.`}
          </p>
        </div>
        <Link
          href={href}
          className="shrink-0 inline-flex items-center justify-center gap-2 bg-white text-wellness-900 px-7 py-4 rounded-xl font-black text-sm hover:bg-wellness-50 transition-all shadow-xl no-underline"
        >
          {inCity ? `See ${cityName} clinics` : 'Find your clinic'} <ArrowRight size={16} />
        </Link>
      </div>
    </aside>
  );
}
