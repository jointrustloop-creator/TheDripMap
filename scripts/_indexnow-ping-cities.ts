/**
 * One-off: submit every sitemapped city page to IndexNow after the key file
 * is live. Reads the live sitemap so the list is exactly what Google sees.
 *
 *   npx tsx scripts/_indexnow-ping-cities.ts            (dry: lists URLs, checks the key file)
 *   npx tsx scripts/_indexnow-ping-cities.ts --send
 */
import { pingIndexNow, INDEXNOW_KEY, INDEXNOW_KEY_URL } from '../src/lib/indexnow';

(async () => {
  const keyFile = await fetch(INDEXNOW_KEY_URL);
  const body = (await keyFile.text()).trim();
  console.log(`key file ${INDEXNOW_KEY_URL}: HTTP ${keyFile.status}, content matches key: ${body === INDEXNOW_KEY}`);
  if (keyFile.status !== 200 || body !== INDEXNOW_KEY) { console.error('key file not live yet; refusing to ping'); process.exit(1); }

  const xml = await (await fetch('https://www.thedripmap.com/sitemap.xml')).text();
  const urls = Array.from(xml.matchAll(/<loc>(https:\/\/www\.thedripmap\.com\/cities\/[a-z0-9-]+)<\/loc>/g)).map((m) => m[1]);
  console.log(`${urls.length} city URLs in the live sitemap`);
  if (!process.argv.includes('--send')) { console.log(urls.join('\n')); console.log('\ndry run; add --send'); return; }
  const r = await pingIndexNow(urls, 'city pages, one-off after change order 2026-09-28');
  console.log(`IndexNow responded ${r.status} for ${r.submitted} URLs (200 or 202 = accepted)`);
  process.exit(r.status === 200 || r.status === 202 ? 0 : 1);
})();
