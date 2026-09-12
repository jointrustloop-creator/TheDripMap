/**
 * Country guard for discovery (2026-09-11). Canadian city names collide with
 * London UK, Vancouver WA, Burlington VT/NC/MA, Hamilton NJ, Ottawa IL, Milton
 * MA, Victoria TX, Halifax UK: 22 such clinics reached the table before this
 * check. Lives in src/lib because a Next.js route file may only export HTTP
 * handlers (exporting it from the route broke the production build).
 */
// Every Canadian area code (2026). A 10-digit phone outside this set is not a
// Canadian clinic; toll-free (8xx) numbers are allowed because Canadian chains
// use them.
const CA_AREA_CODES = new Set(['204','226','236','249','250','263','289','306','343','354','365','367','368','382','387','403','416','418','428','431','437','438','450','460','468','474','506','514','519','548','579','581','584','587','600','604','613','639','647','672','683','705','709','742','753','778','780','782','807','819','825','867','873','879','902','905']);
export function notCanadianReason(phone: string | null | undefined, website: string | null | undefined): string | null {
  const host = (() => { try { return new URL(String(website || '')).hostname.toLowerCase(); } catch { return ''; } })();
  if (/\.(uk|ie|au|nz)$/.test(host)) return `non-Canadian domain ${host}`;
  const digits = String(phone || '').replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');
  if (digits.length === 10) {
    const ac = digits.slice(0, 3);
    if (!CA_AREA_CODES.has(ac) && !/^8[0-9]{2}$/.test(ac)) return `phone area code ${ac} is not Canadian`;
  } else if (digits.length && (digits.length === 11 || digits.length === 12) && !digits.startsWith('1')) {
    return `phone ${phone} is not a North American number`;
  }
  return null;
}

