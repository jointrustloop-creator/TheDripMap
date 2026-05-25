const res = await fetch('https://www.revitalizeivsolutions.com/', { redirect: 'follow' });
console.log('status', res.status);
const text = await res.text();
console.log('length', text.length);
console.log(text.slice(0, 500));
