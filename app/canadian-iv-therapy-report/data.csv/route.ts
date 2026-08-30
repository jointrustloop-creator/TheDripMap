/**
 * GET /canadian-iv-therapy-report/data.csv (PLAN-4, 2026-08-31)
 *
 * The report's raw dataset as CSV, for journalists and researchers. Computed
 * LIVE from the same sources as the report page (providers table + the dated
 * price index), so the download can never disagree with the page. Referenced
 * by the Dataset JSON-LD `distribution` field, which is what makes the
 * dataset legible to Google Dataset Search.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PRICE_INDEX } from '../../../src/lib/price-index-data';

export const revalidate = 86400;

const CENSUS_2021: Record<string, number> = {
  Ontario: 14223942,
  Quebec: 8501833,
  'British Columbia': 5000879,
  Alberta: 4262635,
  Manitoba: 1342153,
  Saskatchewan: 1132505,
  'Nova Scotia': 969383,
  'New Brunswick': 775610,
  'Newfoundland and Labrador': 510550,
  'Prince Edward Island': 154331,
};

const csvCell = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const byProvince = new Map<string, number>();
  const byCity = new Map<string, { count: number; province: string }>();
  let total = 0;
  for (let f = 0; ; f += 1000) {
    const { data } = await sb
      .from('providers')
      .select('city,state')
      .eq('country', 'Canada')
      .eq('is_hidden', false)
      .range(f, f + 999);
    if (!data || !data.length) break;
    for (const p of data as Array<{ city: string | null; state: string | null }>) {
      total++;
      if (p.state) byProvince.set(p.state, (byProvince.get(p.state) || 0) + 1);
      if (p.city) {
        const cur = byCity.get(p.city) || { count: 0, province: p.state || '' };
        cur.count += 1;
        byCity.set(p.city, cur);
      }
    }
    if (data.length < 1000) break;
  }

  const generated = new Date().toISOString().slice(0, 10);
  const lines: string[] = [
    `# The Canadian IV Therapy Report, TheDripMap, generated ${generated}`,
    `# Free to cite with attribution and a link to https://www.thedripmap.com/canadian-iv-therapy-report`,
    `# Population figures: Statistics Canada, 2021 Census. Prices: published clinic menus, dated per city snapshot.`,
    '',
    'section,region,metric,value',
    `national,Canada,active_clinics,${total}`,
  ];
  for (const [name, count] of [...byProvince.entries()].sort((a, b) => b[1] - a[1])) {
    lines.push(`province,${csvCell(name)},active_clinics,${count}`);
    const pop = CENSUS_2021[name];
    if (pop) lines.push(`province,${csvCell(name)},clinics_per_100k,${((count / pop) * 100000).toFixed(2)}`);
  }
  for (const [city, v] of [...byCity.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 15)) {
    lines.push(`city,${csvCell(`${city}, ${v.province}`)},active_clinics,${v.count}`);
  }
  lines.push('');
  lines.push('section,city,as_of,treatment,clinics_reporting,low_cad,median_cad,high_cad');
  for (const c of Object.values(PRICE_INDEX)) {
    for (const r of c.rows) {
      lines.push(
        ['prices', csvCell(c.city), csvCell(c.asOf), csvCell(r.treatment), r.clinics, r.low, r.median, r.high].join(','),
      );
    }
  }

  return new NextResponse(lines.join('\n') + '\n', {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'inline; filename="canadian-iv-therapy-report.csv"',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400',
    },
  });
}
