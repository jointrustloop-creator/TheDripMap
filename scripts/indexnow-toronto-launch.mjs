// Targeted IndexNow submission for the Toronto launch blog post.
// Submits the new URL + the blog index (which now has a News category).

const KEY = '185967dfe967397d54c61634cf10e4b4';
const HOST = 'www.thedripmap.com';

const urls = [
  `https://${HOST}/blog/thedripmap-launches-toronto-gta-iv-therapy`,
  `https://${HOST}/blog`,
];

console.log('Verifying key file is live...');
const keyCheck = await fetch(`https://${HOST}/${KEY}.txt`);
const keyContent = (await keyCheck.text()).trim();
if (keyContent !== KEY) {
  console.error(`✗ Key file mismatch: got "${keyContent}" (HTTP ${keyCheck.status})`);
  process.exit(1);
}
console.log('✓ Key file verified');

console.log('\nVerifying the blog post URL returns 200...');
const postCheck = await fetch(urls[0]);
console.log(`  ${urls[0]} → ${postCheck.status}`);
if (postCheck.status !== 200) {
  console.log('  (Will still submit — Bing will recrawl as ISR fires.)');
}

const body = {
  host: HOST,
  key: KEY,
  keyLocation: `https://${HOST}/${KEY}.txt`,
  urlList: urls,
};
const res = await fetch('https://api.indexnow.org/IndexNow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});
const text = await res.text();
console.log(`\nIndexNow → HTTP ${res.status} ${text || '(empty body — success)'}`);

if (res.status === 200 || res.status === 202) {
  console.log('\n✓ Submitted. Bing/Yandex will crawl within hours.');
} else {
  console.error('✗ Unexpected status');
  process.exit(1);
}
