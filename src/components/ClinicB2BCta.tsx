import Link from 'next/link';
import { ArrowRight, Building2 } from 'lucide-react';

/**
 * B2B call-to-action for clinic owners, shown at the end of operator-intent blog
 * posts (how to start a clinic, find a medical director, get patients, CA laws).
 * Routes to /for-clinics, the free get-listed entry point. House style: no dashes.
 */
export function ClinicB2BCta() {
  return (
    <div className="mt-14 rounded-3xl border border-slate-800 bg-slate-900 text-white p-8 md:p-10">
      <div className="flex flex-col md:flex-row md:items-center gap-6 md:justify-between">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-wellness-300 mb-3">
            <Building2 size={14} /> For clinic owners
          </div>
          <h3 className="text-2xl md:text-3xl font-black tracking-tight mb-2">Opening an IV therapy clinic?</h3>
          <p className="text-slate-300 leading-relaxed">
            Get listed on TheDripMap free. Claim your listing so patients searching IV therapy in your city find you, with your services, prices, and booking.
          </p>
        </div>
        <Link
          href="/for-clinics"
          className="inline-flex items-center justify-center gap-2 bg-wellness-600 hover:bg-wellness-700 text-white px-7 py-4 rounded-2xl font-black whitespace-nowrap transition-all"
        >
          Get listed free <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
