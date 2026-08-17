// STEP 1 AUDIT (report only): who displays 7/7 today, and 6/7 one-away cases.
// Imports the real computeTransparencyScore so there is zero logic drift.
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { computeTransparencyScore } from '../src/lib/transparency-score';

dotenv.config({ path: '.env.local' });

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

type Raw = Record<string, any>;

async function main() {
  const rows: Raw[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from('providers')
      .select('id,slug,name,city,state,country,is_claimed,is_hidden,transparency_score,decision_drivers,services,specialties,description,price_range,phone,address,website,online_booking_url,medical_team,safety_verified,safety_review_status')
      .range(from, from + 999);
    if (error) throw error;
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < 1000) break;
  }
  const active = rows.filter(r => !r.is_hidden);

  const results = active.map(p => {
    const res = computeTransparencyScore(p);
    const dd = p.decision_drivers || {};
    const team = (dd.manage && dd.manage.team) || {};
    const prescriberName = (team.prescriberName || team.leadName || '').trim();
    const regNum = (team.prescriberRegNum || '').trim();
    return { p, res, prescriberName, regNum };
  });

  const sevens = results.filter(r => r.res.score === 7);
  const sixesOversightOnly = results.filter(
    r => r.res.score === 6 && r.res.checks.find(c => c.key === 'oversight' && !c.passed)
  );
  const sixesOther = results.filter(
    r => r.res.score === 6 && !r.res.checks.find(c => c.key === 'oversight' && !c.passed)
  );

  // Stored-vs-computed drift (surfaces read the stored column)
  const drift = results.filter(r => typeof r.p.transparency_score === 'number' && r.p.transparency_score !== r.res.score);

  console.log('ACTIVE PROVIDERS:', active.length);
  console.log('SCORE DISTRIBUTION:', JSON.stringify(
    results.reduce((m: Record<number, number>, r) => { m[r.res.score] = (m[r.res.score] || 0) + 1; return m; }, {})));
  console.log('STORED!=COMPUTED drift rows:', drift.length,
    drift.slice(0, 10).map(r => `${r.p.slug} stored=${r.p.transparency_score} computed=${r.res.score}`));

  console.log('\n=== CURRENT 7/7 (' + sevens.length + ') ===');
  for (const r of sevens) {
    const checksStr = r.res.checks.map(c => (c.passed ? c.key.slice(0, 4) : '-')).join(',');
    console.log(JSON.stringify({
      name: r.p.name, city: r.p.city, state: r.p.state, country: r.p.country,
      claimed: !!r.p.is_claimed,
      badge: `${r.p.safety_verified}/${r.p.safety_review_status}`,
      prescriberName: r.prescriberName || null,
      regNum: r.regNum || null,
      humanVerified: false, // no verified-prescriber flag exists anywhere yet
      checks: checksStr,
    }));
  }

  console.log('\n=== 6/7 MISSING ONLY OVERSIGHT (' + sixesOversightOnly.length + ') ===');
  for (const r of sixesOversightOnly) {
    console.log(JSON.stringify({ name: r.p.name, city: r.p.city, claimed: !!r.p.is_claimed }));
  }
  console.log('\n=== 6/7 MISSING SOMETHING ELSE (' + sixesOther.length + ') ===');
  for (const r of sixesOther) {
    const missing = r.res.checks.filter(c => !c.passed).map(c => c.key).join(',');
    console.log(JSON.stringify({ name: r.p.name, city: r.p.city, claimed: !!r.p.is_claimed, missing }));
  }
}

main().catch(e => { console.error('ERR', e.message); process.exit(1); });
