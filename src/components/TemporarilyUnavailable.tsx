import React from 'react';
import Link from 'next/link';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { AlertCircle, ArrowRight } from 'lucide-react';

interface Props {
  /** "city", "clinic", or "blog" — used to vary the message wording. */
  kind: 'city' | 'clinic' | 'blog';
  /** Best-effort human-readable label derived from the slug, e.g. "Toronto". */
  label?: string;
}

/**
 * Soft fallback when the data-layer cannot reach Supabase. Renders at HTTP 200
 * (Next.js default for a successful render) so Google does not treat the URL
 * as gone. The page is short, low-noise, and links the visitor back to the
 * homepage and search. ISR will revalidate within ~5 min and replace this
 * placeholder with the real page as soon as Supabase is reachable again.
 */
export function TemporarilyUnavailable({ kind, label }: Props) {
  const noun = kind === 'city' ? 'city page' : kind === 'blog' ? 'article' : 'clinic page';
  const subject = label ? ` for ${label}` : '';
  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-24">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 flex items-start gap-5">
          <div className="shrink-0 w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <AlertCircle size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
              We&apos;ll be back in a few minutes
            </h1>
            <p className="text-slate-700 leading-relaxed mb-5">
              Our matching platform is briefly catching its breath, so this {noun}
              {subject} can&apos;t load right now. Nothing is lost — try again in
              two or three minutes and it will be back to normal.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-wellness-600 text-white px-5 py-2.5 rounded-2xl text-sm font-bold hover:bg-wellness-700 transition-all"
              >
                Go to homepage <ArrowRight size={15} />
              </Link>
              <Link
                href="/search"
                className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-2xl text-sm font-bold hover:border-slate-300 transition-all"
              >
                Search by treatment <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
