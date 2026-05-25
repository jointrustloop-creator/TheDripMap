// Submit URLs to Bing / Yandex / etc via IndexNow.
// Run AFTER the deploy that ships the /185967dfe967397d54c61634cf10e4b4.txt key file.
//
// IndexNow is free, no account needed. It pings participating search engines
// (Bing, Yandex, Seznam, Naver — Google doesn't participate but Bing covers a
// lot of traffic + their data feeds OpenAI/Copilot/etc).

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', quiet: true });

const KEY = '185967dfe967397d54c61634cf10e4b4';
const HOST = 'www.thedripmap.com';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

// First, sanity-check that the key file is actually live before submitting.
console.log('Verifying key file is accessible...');
const keyCheck = await fetch(KEY_LOCATION);
const keyContent = (await keyCheck.text()).trim();
if (keyContent !== KEY) {
  console.error(`✗ Key file mismatch. Expected "${KEY}", got "${keyContent}" (HTTP ${keyCheck.status})`);
  console.error('Make sure the latest commit (with public/' + KEY + '.txt) has deployed to Vercel.');
  process.exit(1);
}
console.log('✓ Key file verified at', KEY_LOCATION);

// Build a meaningful URL list: homepage + every city + every claimed provider +
// every blog post. We could submit everything but IndexNow recommends keeping
// individual requests to ≤10,000 URLs. We're well under.
//
// Fetching the sitemap.xml lets us reuse the URL list Next.js already builds.
console.log('\nFetching sitemap.xml for the URL list...');
const sitemapRes = await fetch(`https://${HOST}/sitemap.xml`);
if (!sitemapRes.ok) {
  console.error('✗ Sitemap fetch failed:', sitemapRes.status);
  process.exit(1);
}
const sitemapXml = await sitemapRes.text();
const urls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
console.log(`✓ Found ${urls.length} URLs in sitemap`);

// IndexNow limit: 10,000 URLs per request. Chunk if needed.
const BATCH = 1000;
let totalSubmitted = 0;
for (let i = 0; i < urls.length; i += BATCH) {
  const chunk = urls.slice(i, i + BATCH);
  const body = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: chunk,
  };
  const res = await fetch('https://api.indexnow.org/IndexNow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  console.log(`  Batch ${i / BATCH + 1}: ${chunk.length} URLs → HTTP ${res.status} ${text.slice(0, 200)}`);
  totalSubmitted += chunk.length;
}

console.log(`\n✓ Submitted ${totalSubmitted} URLs to IndexNow. Bing/Yandex will crawl them within hours/days.`);
