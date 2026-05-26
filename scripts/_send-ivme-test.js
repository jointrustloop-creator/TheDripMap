// One-shot: fire the IVme outreach test via the admin send-email endpoint.
import fetch from 'node:https';

const body = JSON.stringify({
  from: 'TheDripMap <info@thedripmap.com>',
  to: 'hubertzyworonek@gmail.com',
  replyTo: 'info@thedripmap.com',
  subject: 'Your IVme Wellness + Aesthetics listing on TheDripMap',
  text: `Hi there,

I run TheDripMap (https://www.thedripmap.com) — North America's directory for IV therapy clinics. We added IVme Wellness + Aesthetics Milwaukee Historic Third Ward to our directory and your listing is now live: https://www.thedripmap.com/providers/ivme-wellness-aesthetics-milwaukee-historic-third-ward-milwaukee

Your page shows your real Google rating of 5.0★ from 923 patient reviews — but right now it's an unclaimed listing, which means anyone visiting sees a generic placeholder instead of your clinic's photos, hours, services, or one-line pitch.

Claiming is completely free and takes about 2 minutes. Once claimed you control everything on the page — description, drip menu, photos, contact CTAs. Direct link to claim: https://www.thedripmap.com/providers/ivme-wellness-aesthetics-milwaukee-historic-third-ward-milwaukee?claim=1

Warmly,
Hubert
TheDripMap · info@thedripmap.com`,
});

const res = await globalThis.fetch('https://www.thedripmap.com/api/admin/send-email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Cookie: 'tdm_admin=1779734307016.5ffdc767e2ead02bbc92f585eae5b5e648f421de23d9108a476b7aace102fad3',
  },
  body,
});
console.log('HTTP', res.status);
console.log(await res.text());
