/**
 * IndexNow (Bing, Yandex, Seznam, Naver share one endpoint). Change order
 * 2026-09-28. The key is public by design: search engines verify it by
 * fetching https://www.thedripmap.com/<key>.txt, which is the static file
 * public/<key>.txt whose only content is the key itself.
 *
 * pingIndexNow() is fire-and-forget and never throws: a search engine being
 * down must never fail a publish. Every call is logged to the console so the
 * Vercel function log shows what was submitted.
 */
export const INDEXNOW_KEY = (process.env.INDEXNOW_KEY || '90341dadc2d887fba911fff3afa910fe').trim();
export const SITE_HOST = 'www.thedripmap.com';
export const INDEXNOW_KEY_URL = `https://${SITE_HOST}/${INDEXNOW_KEY}.txt`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';

function absolute(u: string): string {
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${SITE_HOST}${u.startsWith('/') ? u : `/${u}`}`;
}

/** Submit up to 10,000 URLs in one call. Returns the HTTP status or 0 on a network failure. */
export async function pingIndexNow(urls: string[], reason = ''): Promise<{ status: number; submitted: number }> {
  const list = Array.from(new Set(urls.map(absolute))).filter((u) => u.startsWith(`https://${SITE_HOST}/`)).slice(0, 10000);
  if (!list.length || !INDEXNOW_KEY || INDEXNOW_KEY.startsWith('[')) return { status: 0, submitted: 0 };
  try {
    const r = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: SITE_HOST, key: INDEXNOW_KEY, keyLocation: INDEXNOW_KEY_URL, urlList: list }),
    });
    console.log(`[indexnow] ${r.status} for ${list.length} url(s)${reason ? ` (${reason})` : ''}`);
    return { status: r.status, submitted: list.length };
  } catch (e) {
    console.log(`[indexnow] failed: ${e instanceof Error ? e.message : 'unknown'}`);
    return { status: 0, submitted: 0 };
  }
}
