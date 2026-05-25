import React from 'react';
import { Star, Quote, Heart } from 'lucide-react';
import { Provider } from '../types';
import { ApprovedTestimonial } from '../lib/data';
import { SubmitTestimonialButton } from './SubmitTestimonialButton';

interface PatientTestimonialsProps {
  provider: Provider;
  testimonials: ApprovedTestimonial[];
}

const MONTH_FORMATTER = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' });

function formatVisit(date: string | null): string | null {
  if (!date) return null;
  try {
    return MONTH_FORMATTER.format(new Date(date.length === 7 ? `${date}-01` : date));
  } catch {
    return null;
  }
}

function initialsFromName(name: string): string {
  const parts = (name || '').trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0] || '').join('').toUpperCase() || 'A';
}

const AVATAR_BG = ['bg-wellness-100 text-wellness-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700', 'bg-sky-100 text-sky-700', 'bg-violet-100 text-violet-700'];

export function PatientTestimonials({ provider, testimonials }: PatientTestimonialsProps) {
  if (testimonials.length === 0) {
    // Empty state — soft prompt for the first testimonial
    return (
      <section className="pt-12 border-t border-slate-100">
        <div className="bg-gradient-to-br from-amber-50 via-white to-wellness-50 rounded-[2.5rem] border border-amber-100 p-8 md:p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-white shadow-sm flex items-center justify-center text-amber-500">
            <Heart size={26} fill="currentColor" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-3 tracking-tight">
            Be the first to recommend {provider.name}
          </h2>
          <p className="text-slate-600 max-w-md mx-auto mb-7 leading-relaxed">
            Did you visit {provider.name}? Share your experience to help the next person find the right clinic.
          </p>
          <SubmitTestimonialButton provider={provider} variant="primary" />
        </div>
      </section>
    );
  }

  const avg =
    testimonials.reduce((sum, t) => sum + (t.rating || 0), 0) / testimonials.length;

  return (
    <section className="pt-12 border-t border-slate-100">
      <div className="flex items-end justify-between gap-6 mb-8 flex-wrap">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-600 mb-2">
            Patient testimonials
          </p>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            What patients say
          </h2>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Star size={18} fill="currentColor" className="text-amber-500" />
              <span className="text-xl font-black text-slate-900">{avg.toFixed(1)}</span>
            </div>
            <span className="text-sm font-bold text-slate-500">
              from {testimonials.length} verified patient{testimonials.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
        <SubmitTestimonialButton provider={provider} variant="card" label="Share yours" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {testimonials.map((t, idx) => {
          const visit = formatVisit(t.visit_date);
          const avatarClass = AVATAR_BG[idx % AVATAR_BG.length];
          return (
            <article
              key={t.id}
              className="relative bg-white rounded-3xl border border-slate-100 shadow-sm p-7 flex flex-col"
            >
              <Quote size={28} className="text-amber-200 absolute top-6 right-6" />
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    size={14}
                    fill={n <= t.rating ? 'currentColor' : 'none'}
                    className={n <= t.rating ? 'text-amber-500' : 'text-slate-200'}
                    strokeWidth={1.5}
                  />
                ))}
              </div>
              {t.title && (
                <h3 className="text-lg font-black text-slate-900 mb-3 tracking-tight leading-snug">
                  &ldquo;{t.title}&rdquo;
                </h3>
              )}
              <p className="text-base text-slate-700 leading-relaxed mb-6 whitespace-pre-line">
                {t.body}
              </p>
              <div className="mt-auto pt-4 border-t border-slate-100 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${avatarClass}`}>
                  {initialsFromName(t.author_name)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-black text-slate-900 truncate">{t.author_name}</div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    Verified patient{visit ? ` · visited ${visit}` : ''}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
