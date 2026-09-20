/**
 * Blog post sidebar (rebuilt 2026-09-20, Hubert: "dead white space on the
 * right side"). Sticky, and every block is data the post can stand behind:
 *
 *   1. Prices near you: the dated Price Index rows for the post's city, or for
 *      the post's treatment across the indexed cities.
 *   2. On this page: a table of contents from the post's own H2 headings.
 *   3. Clinics that publish prices: real listings in the post's city, Safety
 *      Verified first, real photo or logo only, never a placeholder.
 *   4. Live offers in that city, when any exist.
 *   5. Ask a question.
 *
 * Server component: no client JS, all data fetched here.
 */
import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Tag, MessageCircleQuestion, ListOrdered, Receipt, MapPin, Star } from 'lucide-react';
import { getCityPriceIndex, PRICE_INDEX, type PriceRow } from '../lib/price-index-data';
import { getListingsByCity } from '../lib/data';
import { getLiveDeals } from '../lib/deals';
import { isSafetyVerified } from '../lib/safety';
import { coverPhotoOf } from './ClinicImageBand';
import { ResilientImage } from './ResilientImage';
import { BlogCard } from './BlogCard';

export const headingId = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 80);

/** ## headings from the markdown body, in order. Skips the FAQ block's ### questions. */
export function tableOfContents(markdown: string): { id: string; text: string }[] {
  const out: { id: string; text: string }[] = [];
  for (const m of String(markdown || '').matchAll(/^##\s+(.+?)\s*$/gm)) {
    const text = m[1].replace(/[*_`]/g, '').trim();
    if (text) out.push({ id: headingId(text), text });
  }
  return out;
}

const TREATMENT_KEYS: Array<[RegExp, RegExp]> = [
  [/glutathione|gluta/i, /glutathione/i],
  [/nad/i, /nad/i],
  [/myers/i, /myers/i],
  [/hydration|dehydrat/i, /hydration/i],
  [/vitamin-c|high-dose/i, /vitamin c/i],
  [/b12/i, /b12/i],
  [/iron/i, /iron/i],
  [/hangover/i, /hangover/i],
  [/beauty|glow|skin/i, /beauty|glow/i],
  [/immune|immunity/i, /immune/i],
];

function pricesFor(slug: string, citySlug: string | null): { title: string; asOf: string; rows: Array<PriceRow & { city?: string }>; href: string } | null {
  if (citySlug) {
    const idx = getCityPriceIndex(citySlug);
    if (idx) return { title: `What IV drips cost in ${idx.city}`, asOf: idx.asOf, rows: idx.rows.slice(0, 5), href: `/iv-prices/${idx.citySlug}` };
  }
  const hit = TREATMENT_KEYS.find(([slugRe]) => slugRe.test(slug));
  if (hit) {
    const rows: Array<PriceRow & { city?: string }> = [];
    for (const idx of Object.values(PRICE_INDEX)) {
      const row = idx.rows.find((r) => hit[1].test(r.treatment));
      if (row) rows.push({ ...row, city: idx.city });
    }
    if (rows.length) return { title: `What ${rows[0].treatment.toLowerCase()} costs, by city`, asOf: Object.values(PRICE_INDEX)[0].asOf, rows, href: '/iv-prices' };
  }
  const t = getCityPriceIndex('toronto');
  return t ? { title: 'What IV drips cost in Toronto', asOf: t.asOf, rows: t.rows.slice(0, 4), href: '/iv-prices/toronto' } : null;
}

interface Props {
  slug: string;
  content: string;
  cityHub: { name: string; href: string } | null;
  relatedPosts: Array<Parameters<typeof BlogCard>[0]['post']>;
}

export async function BlogSidebar({ slug, content, cityHub, relatedPosts }: Props) {
  const citySlug = cityHub ? cityHub.href.replace('/cities/', '') : null;
  const prices = pricesFor(slug, citySlug);
  const toc = tableOfContents(content);

  // Clinics in the post's city that publish at least one price. Safety Verified
  // first, then the most complete. Photo or logo only when the clinic has one.
  let clinics: Array<{ slug: string; name: string; city: string; image: string | null; verified: boolean; from: number | null; rating: number; reviews: number }> = [];
  if (cityHub) {
    try {
      const rows = await getListingsByCity(cityHub.name);
      clinics = rows
        .map((p) => {
          const prices = ((p.services || []) as Array<{ price?: string | null }>)
            .map((s) => Number(String(s?.price || '').replace(/[^0-9.]/g, '')))
            .filter((n) => n >= 30 && n <= 5000);
          const rangeMin = Number(String(p.price_range || '').replace(/[^0-9.\-]/g, '').split('-')[0]);
          const from = prices.length ? Math.min(...prices) : rangeMin >= 30 ? rangeMin : null;
          const uploaded = (Array.isArray((p as { photos?: unknown }).photos) ? ((p as { photos?: string[] }).photos as string[]) : []).find((u) => typeof u === 'string' && /^https?:/.test(u) && !/\/logo\./i.test(u));
          return { slug: p.slug || '', name: p.name, city: p.city, image: uploaded || coverPhotoOf(p) || (p.image_url && !/unsplash|picsum|placeholder/i.test(p.image_url) ? p.image_url : null), verified: isSafetyVerified(p), from, rating: Number(p.rating) || 0, reviews: Number(p.reviewCount) || 0 };
        })
        .filter((c) => c.slug && c.from !== null)
        .sort((a, b) => Number(b.verified) - Number(a.verified) || b.reviews - a.reviews)
        .slice(0, 3);
    } catch { clinics = []; }
  }

  let deals: Array<{ slug: string; name: string; title: string }> = [];
  if (cityHub) {
    try {
      deals = (await getLiveDeals()).filter((d) => d.city.toLowerCase() === cityHub.name.toLowerCase()).slice(0, 2).map((d) => ({ slug: d.slug, name: d.name, title: d.offer.title.replace(/[‒–—―−]/g, '-') }));
    } catch { deals = []; }
  }

  return (
    <aside className="lg:col-span-4">
      <div className="lg:sticky lg:top-24 space-y-6">
        {prices && (
          <div className="bg-white rounded-[1.75rem] border border-[rgba(25,36,28,0.1)] p-6">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#0F6E56] mb-3"><Receipt size={13} /> IV Price Index, {prices.asOf}</div>
            <h3 className="text-[17px] font-black text-slate-900 tracking-tight mb-4">{prices.title}</h3>
            <table className="w-full text-[13px]">
              <tbody>
                {prices.rows.map((r) => (
                  <tr key={(r.city || '') + r.treatment} className="border-t border-slate-100">
                    <td className="py-2 pr-2 font-bold text-slate-700">{r.city || r.treatment}</td>
                    <td className="py-2 text-right text-slate-500 whitespace-nowrap">${r.low} to ${r.high}</td>
                    <td className="py-2 pl-3 text-right font-black text-slate-900 whitespace-nowrap tabular-nums">${r.median} <span className="text-[10px] font-bold text-slate-400 uppercase">median</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-[11.5px] text-slate-500 leading-relaxed">Published menu prices, one per clinic per drip, CAD. Not a quote.</p>
            <Link href={prices.href} className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-black text-[#0F6E56] hover:underline">Full price index <ArrowRight size={14} /></Link>
          </div>
        )}

        {toc.length >= 3 && (
          <nav className="bg-[#f8f5ee] rounded-[1.75rem] border border-[rgba(25,36,28,0.08)] p-6" aria-label="On this page">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3"><ListOrdered size={13} /> On this page</div>
            <ol className="space-y-2">
              {toc.slice(0, 10).map((h, i) => (
                <li key={h.id} className="flex gap-2.5 text-[13.5px] leading-snug">
                  <span className="text-[11px] font-black text-[#0F6E56] tabular-nums pt-0.5 w-4 shrink-0">{i + 1}</span>
                  <a href={`#${h.id}`} className="font-semibold text-slate-700 hover:text-[#0F6E56]">{h.text}</a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        {clinics.length > 0 && cityHub && (
          <div className="bg-white rounded-[1.75rem] border border-[rgba(25,36,28,0.1)] p-6">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3"><MapPin size={13} /> Publish their prices in {cityHub.name}</div>
            <div className="divide-y divide-slate-100">
              {clinics.map((c) => (
                <Link key={c.slug} href={`/providers/${c.slug}`} className="group flex items-center gap-3 py-3">
                  {c.image ? (
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-[#efe9dc] shrink-0">
                      <ResilientImage src={c.image} alt={c.name} fill sizes="56px" className="object-cover" fallbackSrc="" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-[#e7f1ec] text-[#0F6E56] font-black text-lg flex items-center justify-center shrink-0">{c.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()}</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-black text-[14px] text-slate-900 truncate group-hover:text-[#0F6E56]">{c.name}</div>
                    <div className="flex items-center gap-2 mt-0.5 text-[12px] text-slate-500 font-semibold">
                      {c.from !== null && <span className="text-slate-900">From ${c.from}</span>}
                      {c.rating > 0 && <span className="inline-flex items-center gap-0.5"><Star size={11} className="text-amber-500" fill="currentColor" />{c.rating.toFixed(1)}</span>}
                      {c.verified && <span className="inline-flex items-center gap-0.5 text-amber-800 bg-amber-100 rounded px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide"><ShieldCheck size={10} /> Verified</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <Link href={cityHub.href} className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-black text-[#0F6E56] hover:underline">All clinics in {cityHub.name} <ArrowRight size={14} /></Link>
          </div>
        )}

        {deals.length > 0 && cityHub && (
          <div className="bg-[linear-gradient(135deg,#f3f7f2_0%,#e7f1ec_100%)] rounded-[1.75rem] border border-[#0F6E56]/15 p-6">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#0F6E56] mb-3"><Tag size={13} /> Live offers in {cityHub.name}</div>
            <ul className="space-y-3">
              {deals.map((d) => (
                <li key={d.slug}>
                  <Link href={`/providers/${d.slug}`} className="block group">
                    <div className="text-[14px] font-bold text-slate-900 group-hover:text-[#0F6E56] leading-snug">{d.title}</div>
                    <div className="text-[12px] text-slate-500 font-semibold">{d.name}</div>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/deals" className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-black text-[#0F6E56] hover:underline">All offers <ArrowRight size={14} /></Link>
          </div>
        )}

        <div className="bg-[#14261c] text-white rounded-[1.75rem] p-6">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-wellness-400 mb-2"><MessageCircleQuestion size={13} /> Still have a question?</div>
          <p className="text-[14px] text-slate-300 leading-relaxed mb-4">Ask us. A person reads every message and answers, usually the same day.</p>
          <Link href="/contact" className="inline-flex items-center gap-2 bg-wellness-400 text-slate-900 px-4 py-2.5 rounded-xl font-black text-[13px] hover:bg-wellness-300 transition-colors">Ask a question <ArrowRight size={14} /></Link>
        </div>

        {relatedPosts.length > 0 && (
          <div>
            <h3 className="text-[15px] font-black text-slate-900 mb-4 tracking-tight">More from the blog</h3>
            <div className="space-y-6">
              {relatedPosts.map((post, idx) => (
                <BlogCard key={idx} post={post} />
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
