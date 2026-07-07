// IndexNow ping for the 2026-07-06 GSC audit fixes (iron content, NAD+ title,
// blog up-links) plus the 3 healthy Canadian city pages Google crawled but
// has not indexed. IndexNow reaches Bing and partners; Google recrawls on
// its own schedule.
const KEY = '185967dfe967397d54c61634cf10e4b4';
const HOST = 'www.thedripmap.com';

const urls = [
  '/treatments/iron-infusion',
  '/treatments/nad-plus',
  '/iv-therapy/iron-infusion/oakville',
  '/iv-therapy/iron-infusion/toronto',
  '/iv-therapy/iron-infusion/ottawa',
  '/iv-therapy/iron-infusion/montreal',
  '/iv-therapy/iron-infusion/halifax',
  '/iv-therapy/iron-infusion/victoria',
  '/blog/myers-cocktail-toronto',
  '/blog/iv-therapy-yorkville-toronto',
  '/cities/burlington',
  '/cities/saskatoon',
  '/cities/bedford',
].map((p) => `https://${HOST}${p}`);

const keyCheck = await fetch(`https://${HOST}/${KEY}.txt`);
if ((await keyCheck.text()).trim() !== KEY) {
  console.error('Key file mismatch, aborting');
  process.exit(1);
}
console.log('key file verified');

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls }),
});
console.log('IndexNow response:', res.status, res.statusText);
console.log('submitted', urls.length, 'URLs');
