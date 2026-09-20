/**
 * Segment every unclaimed Canadian clinic with an email for the third-touch
 * campaign Hubert approved 2026-09-20 ("i don't mind emailing all of our
 * canadian clinics again even if it's 3rd touch... clinics with views and
 * clicks should get different pitch"). Read-only report.
 *   npx tsx scripts/_segment-outreach.ts
 */
import * as fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });
import { createClient } from '@supabase/supabase-js';
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
(async () => {
  const since = new Date(Date.now() - 90 * 86400000).toISOString();
  const ev = new Map<string, { views: number; clicks: number }>();
  for (let f = 0; ; f += 1000) {
    const { data, error } = await s.from('listing_events').select('provider_id, event_type, referrer').gte('created_at', since).or('referrer.is.null,referrer.not.like.i:%').range(f, f + 999);
    if (error) throw error;
    for (const e of data || []) { const k = String(e.provider_id); const c = ev.get(k) || { views: 0, clicks: 0 }; if (e.event_type === 'view') c.views++; else c.clicks++; ev.set(k, c); }
    if (!data || data.length < 1000) break;
  }
  const rows: any[] = [];
  for (let f = 0; ; f += 1000) {
    const { data, error } = await s.from('providers').select('id, slug, name, city, state, email, email_bounced, outreach_sent, outreach_sent_at, followup_sent, reply_category, discovery_flag, discovery_source, transparency_score, decision_drivers').eq('country', 'Canada').eq('is_hidden', false).eq('is_claimed', false).range(f, f + 999);
    if (error) throw error; rows.push(...(data || [])); if (!data || data.length < 1000) break;
  }
  const { data: s1 } = await s.from('email_suppressions').select('email'); const { data: s2 } = await s.from('outreach_suppressions').select('email');
  const sup = new Set([...(s1 || []), ...(s2 || [])].map((r: any) => String(r.email).toLowerCase()));
  const seg: Record<string, any[]> = { 'A warm: views>=3 or a click, prebuilt profile': [], 'A2 warm: views>=3 or a click, no prebuilt': [], 'B register: CONO, few views': [], 'C cold: no views': [], 'X excluded': [] };
  const excl: Record<string, number> = {};
  for (const p of rows) {
    const dd = p.decision_drivers || {}; const e = ev.get(p.id) || { views: 0, clicks: 0 };
    const email = String(p.email || '').toLowerCase();
    const touches = (p.outreach_sent ? 1 : 0) + (p.followup_sent ? 1 : 0) + ['warm_outreach', 'register_touch', 'personal_note'].filter((k) => dd[k]).length;
    let why = '';
    if (!email) why = 'no email'; else if (p.email_bounced) why = 'bounced'; else if (sup.has(email)) why = 'suppressed'; else if (['not_interested', 'unsubscribed', 'closed', 'flagged'].includes(p.reply_category || '')) why = `reply ${p.reply_category}`; else if (p.discovery_flag) why = 'needs name check'; else if (dd.source === 'orphan_claim_stub') why = 'stub'; else if (touches >= 3) why = '3 touches already';
    const line = { slug: p.slug, name: p.name, city: p.city, email, views: e.views, clicks: e.clicks, touches, last: String(p.outreach_sent_at || '').slice(0, 10), reply: p.reply_category || '', score: p.transparency_score, prebuilt: !!(dd.prebuilt || dd.fact_fill), cono: p.discovery_source === 'cono_ivit_register' || !!dd.cono_premise };
    if (why) { excl[why] = (excl[why] || 0) + 1; seg['X excluded'].push({ ...line, why }); continue; }
    const warm = e.views >= 3 || e.clicks >= 1;
    if (warm && line.prebuilt) seg['A warm: views>=3 or a click, prebuilt profile'].push(line);
    else if (warm) seg['A2 warm: views>=3 or a click, no prebuilt'].push(line);
    else if (line.cono) seg['B register: CONO, few views'].push(line);
    else seg['C cold: no views'].push(line);
  }
  const out: string[] = [`# Third-touch segmentation, unclaimed Canada, ${new Date().toISOString().slice(0, 10)}`, '', `Unclaimed CA active: ${rows.length}. Excluded: ${JSON.stringify(excl)}`, ''];
  for (const [k, v] of Object.entries(seg)) {
    out.push(`## ${k} (${v.length})`, '');
    const touchDist: Record<number, number> = {}; for (const l of v) touchDist[l.touches] = (touchDist[l.touches] || 0) + 1;
    out.push(`touch distribution: ${JSON.stringify(touchDist)}`, '');
    for (const l of v.sort((a, b) => (b.views + b.clicks * 3) - (a.views + a.clicks * 3)).slice(0, 400)) out.push(`- ${l.name} (${l.city}) v${l.views} c${l.clicks} t${l.touches} last ${l.last} score ${l.score}${l.reply ? ' reply ' + l.reply : ''}${l.why ? ' | ' + l.why : ''}`);
    out.push('');
  }
  fs.writeFileSync('.audit-tmp/third-touch-segments.md', out.join('\n'));
  console.log(out.slice(0, 3).join('\n'));
  for (const [k, v] of Object.entries(seg)) console.log(`${k}: ${v.length}`);
})().catch((e) => { console.error(e.message); process.exit(1); });
