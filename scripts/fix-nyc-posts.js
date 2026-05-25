// Fix NYC blog posts: replace 2026 stub with full content, then delete older 2025 post.
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const fullContent = `New York has one of the highest concentrations of IV therapy clinics in North America, driven by demanding professional sectors, constant international travel, and a wellness-conscious population spread across all five boroughs. From Manhattan's concierge-style infusion lounges to practical mobile services in Brooklyn and Queens, the NYC market offers more options than any other US city — but that means more variation in quality and pricing. Here's how to navigate it in 2026.

## What makes a great NYC IV therapy clinic

New York's IV therapy market is mature, which means the gap between the best clinics and the worst has widened considerably. Quality clinics share a few non-negotiable traits: a clearly named medical director on file, RN-administered infusions, single-use sterile catheters and tubing per patient, ingredients sourced from licensed compounding pharmacies, and pricing published openly on their website rather than disclosed only at intake.

If a Manhattan clinic charging $400 for a "premium" drip can't tell you who their medical director is, or can't explain what's in the bag beyond a marketing name, walk out. There are dozens of legitimate alternatives within walking distance in most neighborhoods.

## What you'll pay in NYC

New York sits at the higher end of US IV therapy pricing, but the spread within the city is wide:

- **Standard wellness drips** (Myers Cocktail, basic immune): $200 to $400
- **Premium beauty and glow drips** with glutathione: $275 to $550
- **Hangover and recovery drips**: $225 to $450
- **NAD+ low dose (250mg)**: $500 to $750
- **NAD+ high dose (500mg+)**: $850 to $1,300+
- **Mobile (in-home or hotel) premium**: typically $75 to $150 on top

Outer-borough clinics in Brooklyn, Queens, and the Bronx generally run $50 to $100 lower across the board than Manhattan equivalents. For a deeper pricing breakdown nationally, see our [IV therapy cost guide](/guide/iv-therapy-cost-guide).

## Top NYC neighborhoods for IV therapy

**Upper East Side and Midtown** host the highest concentration of premium clinics — large medical practices that add IV therapy as a wellness extension, plus dedicated luxury infusion lounges serving the professional and entertainment industries. Premium pricing.

**Tribeca and SoHo** lean toward newer, design-forward clinics targeting the creative and tech-finance crowd. Pricing similar to Midtown.

**Financial District** sees lunch-hour traffic from professionals who book quick Myers Cocktails or B12 boosts between meetings. Several clinics offer 30-minute express drips for this segment.

**Williamsburg and DUMBO** in Brooklyn host the newer, more lifestyle-focused clinics — strong overlap with the boutique fitness and wellness scene.

**Park Slope, Cobble Hill, and Carroll Gardens** serve the residential professional community with mid-market pricing.

**Long Island City and Astoria** are emerging markets with more affordable pricing and growing mobile coverage.

Browse the full [New York state directory](/states/new-york) for clinic listings across the state.

## Mobile IV therapy in New York

Mobile IV is one of the largest segments of the NYC market. Hotel concierges at every major Manhattan property maintain relationships with mobile providers, and many residential buildings have informal arrangements with nearby clinics. The model works particularly well in NYC because of the difficulty of getting around the city for someone hungover, jet-lagged, or recovering from a late event.

Expect a $75 to $150 premium over the equivalent in-clinic drip, plus possible minimums for weekend or off-hours bookings. Read our [mobile IV therapy vs clinic guide](/guide/mobile-iv-therapy-vs-clinic) for the full comparison.

## Most popular treatments in NYC

The NYC market skews heavier toward recovery and energy than the longevity-focused biohacking that dominates San Francisco:

- [Hangover Recovery](/treatments/hangover-recovery) — peak demand around event weekends and holidays
- [NAD+ Plus](/treatments/nad-plus-therapy) — growing segment, popular with finance and entertainment
- [Energy Boost](/treatments/energy-boost) — busy professionals booking weekly or biweekly
- [Beauty Glow](/treatments/beauty-glow) — strong demand in fashion and entertainment circles
- [Jet Lag](/treatments/jet-lag) — heavy demand from international travelers through JFK and Newark

## How to book your first NYC session

Compare three to five clinics before booking — NYC has enough supply that you don't have to settle. Use the screening questions in our [how to choose an IV therapy clinic guide](/guide/how-to-choose-iv-therapy-clinic). Book during off-peak hours (Tuesday through Thursday mornings) for shorter waits and better staff attention at busy Manhattan clinics. Most NYC clinics offer first-time discounts of 10 to 20% — ask explicitly when you call.

---

**Ready to book?** [Browse all IV therapy clinics in New York →](/cities/new-york) or [take our 60-second matching quiz](/quiz) to find the best NYC clinic for your specific goals.`;

console.log('Step 1: Updating best-iv-therapy-new-york-2026 with full content...');
const { error: upErr, count: upCount } = await supabase
  .from('blog_posts')
  .update({ content: fullContent })
  .eq('slug', 'best-iv-therapy-new-york-2026')
  .select('slug', { count: 'exact' });
if (upErr) { console.error('Update failed:', upErr); process.exit(1); }
console.log(`  ✓ Updated. Content now ${fullContent.length} chars, ${fullContent.split(/\s+/).filter(Boolean).length} words.`);

console.log('\nStep 2: Deleting older best-iv-therapy-new-york...');
const { error: delErr } = await supabase
  .from('blog_posts')
  .delete()
  .eq('slug', 'best-iv-therapy-new-york');
if (delErr) { console.error('Delete failed:', delErr); process.exit(1); }
console.log('  ✓ Deleted.');

console.log('\nStep 3: Verifying only the 2026 post remains...');
const { data: remaining } = await supabase
  .from('blog_posts')
  .select('slug, title')
  .ilike('slug', 'best-iv-therapy-new-york%');

console.log(`  Remaining NYC posts (${remaining.length}):`);
for (const r of remaining) {
  console.log(`    - ${r.slug}: ${r.title}`);
}
