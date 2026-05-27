const fs = require('fs');
const results = JSON.parse(fs.readFileSync('C:/Users/Dell/Desktop/TheDripMap/scripts/ig-discovery-results.json', 'utf8'));

// Keep only those with an IG handle
const withHandle = results.filter(r => r.instagram_handle);

const PRIORITY_CITIES = ['Tampa', 'Miami', 'Miami Beach', 'Austin', 'New York', 'Brooklyn', 'Manhattan', 'Toronto', 'Los Angeles', 'Las Vegas', 'San Francisco', 'Houston', 'Clearwater'];
const isPriorityCity = (city) => PRIORITY_CITIES.some(c => city && city.toLowerCase().includes(c.toLowerCase()));

const score = (p) => {
  const base = (Number(p.rating) || 0) * Math.log10((Number(p.reviews) || 0) + 1);
  const cityBoost = isPriorityCity(p.city) ? 1.5 : 1;
  const claimedBoost = p.is_featured ? 100 : 0;
  return base * cityBoost + claimedBoost;
};

const sorted = [...withHandle].sort((a,b) => score(b) - score(a));
const top20 = sorted.slice(0, 20);

const today = new Date().toISOString().slice(0,10);

let md = `# Instagram Outreach List — Top 20

Generated ${today}. For Hubert to personally DM each clinic starting tomorrow morning.

## How to use this list
1. Open each Instagram handle in a new tab
2. **Verify active first:** check that they've posted in the last 30 days. If their last post is older than 90 days, skip them.
3. Look at their follower count + bio. If it doesn't look like a real clinic, skip.
4. DM the clinic owner personally — refer to them by name if you can see it in posts/bio.

## Suggested DM template

> Hi [clinic name] — saw your work on Instagram, beautiful clinic. I run TheDripMap, a directory for IV therapy clinics. You're already listed at [url] and getting visitors. Wanted to introduce myself + see if you'd want to chat about featured placement. — Deborah

---

## Priority order

Sorted by: claimed status (4 partners always first), then Google rating × log(reviews+1), boosted 1.5x for clinics in high-traffic metros (Tampa, Miami, Austin, NYC, Toronto, LA, Las Vegas, Houston, San Francisco, Clearwater, Brooklyn, Manhattan, Miami Beach).

---

`;

for (let i = 0; i < top20.length; i++) {
  const p = top20[i];
  const rank = i + 1;
  const status = p.is_featured ? '🟢 CLAIMED PARTNER' : '⚪ Unclaimed';
  const cityFlag = isPriorityCity(p.city) ? ' ⭐ priority city' : '';
  const reason = p.is_featured
    ? `Already claimed — top-priority relationship-building DM`
    : `${p.rating}★ Google rating · ${p.reviews} reviews${cityFlag}`;

  md += `### ${rank}. ${p.name} — ${status}

- **City:** ${p.city}${p.state ? `, ${p.state}` : ''}
- **TheDripMap listing:** https://www.thedripmap.com/providers/${p.slug}
- **Instagram:** [@${p.instagram_handle}](https://www.instagram.com/${p.instagram_handle}/)
- **Followers:** *check manually — Instagram blocks scraping*
- **Last post date:** *check manually — must be within last 30 days to send DM*
- **Why priority:** ${reason}

---

`;
}

md += `## Skipped (no Instagram handle found on website)

Of the 54 candidates audited (4 claimed + top 50 unclaimed by score), 14 had no Instagram link visible on their website. They may still have one — Hubert can search manually if he wants to DM them. List in scripts/ig-discovery-results.json.

## Notes on data limitations

- **Follower counts** can't be auto-collected — Instagram blocks scraping. Verify manually before DMing.
- **Last post dates** can't be auto-collected for the same reason.
- The list assumes the IG handle found on the website is the clinic's official account. Some sites link to staff personal accounts by mistake — verify before DMing.

## Auto-skip rules when DMing
- Last post older than 90 days → skip
- Under 100 followers → likely a personal account, skip
- Bio says nothing about IV therapy / wellness / medical → wrong account, skip
`;

fs.writeFileSync('C:/Users/Dell/Desktop/TheDripMap/scripts/instagram-outreach.md', md);
console.log(`Wrote ${top20.length} entries to scripts/instagram-outreach.md`);
console.log('\nTop 10 preview:');
top20.slice(0,10).forEach((p, i) => console.log(`  ${i+1}. ${p.name} (${p.city}) — @${p.instagram_handle} — ${p.is_featured ? 'CLAIMED' : `${p.rating}★/${p.reviews}rev`}`));
