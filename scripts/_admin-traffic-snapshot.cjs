/**
 * Admin + traffic snapshot. Pulls everything actionable from Supabase in
 * one go: new claim requests, testimonials, replies, leads, listing events.
 */
require('dotenv').config({ path: '.env.local' });
const sb = require('@supabase/supabase-js').createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

function sinceISO(hours) {
  return new Date(Date.now() - hours * 3600 * 1000).toISOString();
}

(async () => {
  const NOW = new Date();
  const LAST_24H = sinceISO(24);
  const LAST_48H = sinceISO(48);
  const LAST_7D = sinceISO(24 * 7);

  console.log('Snapshot at ' + NOW.toISOString());
  console.log('Looking back at: 24h, 48h, 7d');
  console.log();

  // === CLAIM REQUESTS ===
  console.log('=== CLAIM REQUESTS ===');
  {
    const { data: pending } = await sb
      .from('claim_requests')
      .select('id, listing_id, email, owner_name, owner_phone, status, created_at, verified_at, expires_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    console.log('  Pending: ' + (pending?.length || 0));
    for (const r of pending || []) {
      const ageH = Math.round((Date.now() - new Date(r.created_at).getTime()) / 3600000);
      console.log('    [' + ageH + 'h ago] ' + r.email + '  owner=' + (r.owner_name || '(blank)') + '  phone=' + (r.owner_phone || '(blank)') + '  listing=' + r.listing_id);
    }
  }
  {
    const { data: recentVerified } = await sb
      .from('claim_requests')
      .select('id, listing_id, email, owner_name, verified_at')
      .gte('verified_at', LAST_7D)
      .order('verified_at', { ascending: false });
    console.log('  Verified in last 7 days: ' + (recentVerified?.length || 0));
    for (const r of recentVerified || []) {
      console.log('    ' + r.verified_at.slice(0, 16) + ' ' + r.email + ' (listing ' + r.listing_id + ')');
    }
  }
  console.log();

  // === TESTIMONIALS ===
  console.log('=== TESTIMONIALS ===');
  try {
    const { data: t24, error } = await sb
      .from('testimonials')
      .select('id, provider_id, name, rating, status, created_at')
      .gte('created_at', LAST_24H)
      .order('created_at', { ascending: false });
    if (error) console.log('  table read error: ' + error.message);
    else {
      console.log('  Submitted in last 24h: ' + (t24?.length || 0));
      for (const t of t24 || []) console.log('    [' + (t.status || 'pending') + '] ' + t.rating + '*  ' + t.name + ' (provider ' + t.provider_id + ')');
    }
    const { data: pending } = await sb
      .from('testimonials')
      .select('id, provider_id, name, rating, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10);
    console.log('  Total pending (all-time): ' + (pending?.length || 0));
  } catch (e) {
    console.log('  table not present? ' + e.message);
  }
  console.log();

  // === OUTREACH REPLIES ===
  console.log('=== OUTREACH REPLIES ===');
  {
    const { data: recent } = await sb
      .from('providers')
      .select('slug, name, email, reply_category, reply_received_at, reply_status, reply_snippet')
      .gte('reply_received_at', LAST_7D)
      .order('reply_received_at', { ascending: false });
    const by = { interested: 0, not_interested: 0, unsubscribe: 0, bounce: 0, other: 0, total: 0 };
    for (const r of recent || []) {
      by.total++;
      const c = r.reply_category || 'other';
      by[c] = (by[c] || 0) + 1;
    }
    console.log('  Replies in last 7 days: ' + by.total);
    console.log('    interested:    ' + (by.interested || 0));
    console.log('    not_interested:' + (by.not_interested || 0));
    console.log('    unsubscribe:   ' + (by.unsubscribe || 0));
    console.log('    bounce:        ' + (by.bounce || 0));
    console.log('    other/auto:    ' + (by.other || 0));
    console.log();
    const interesting = (recent || []).filter((r) => r.reply_category === 'interested' || r.reply_status === 'needs_review');
    if (interesting.length) {
      console.log('  Need-attention replies (interested OR needs_review):');
      for (const r of interesting.slice(0, 10)) {
        console.log('    [' + r.reply_received_at.slice(0, 16) + '] ' + r.email + ' (' + r.slug + ')');
        if (r.reply_snippet) console.log('       "' + r.reply_snippet.slice(0, 120).replace(/\s+/g, ' ') + '..."');
      }
    }
  }
  console.log();

  // === BOUNCES NEWLY FLAGGED ===
  console.log('=== EMAIL BOUNCES (recently flagged) ===');
  {
    const { data: bounces, count } = await sb
      .from('providers')
      .select('slug, email, outreach_sent_at', { count: 'exact' })
      .eq('email_bounced', true)
      .gte('outreach_sent_at', LAST_7D)
      .order('outreach_sent_at', { ascending: false })
      .limit(20);
    console.log('  New bounces in last 7 days: ' + (bounces?.length || 0) + ' (showing up to 20)');
    for (const b of bounces || []) console.log('    ' + b.email + ' (' + b.slug + ')');
  }
  console.log();

  // === CONTACT / LEAD CAPTURE ===
  console.log('=== CONTACT FORM + EMAIL CAPTURE ===');
  try {
    const { data: leads, error } = await sb
      .from('leads')
      .select('email, source, created_at, city, treatment')
      .gte('created_at', LAST_7D)
      .order('created_at', { ascending: false });
    if (error) console.log('  leads table read error: ' + error.message);
    else {
      console.log('  Leads captured in last 7 days: ' + (leads?.length || 0));
      for (const l of (leads || []).slice(0, 15)) {
        console.log('    [' + l.created_at.slice(0, 16) + '] ' + l.email + '  src=' + (l.source || '?') + (l.city ? '  city=' + l.city : '') + (l.treatment ? '  tx=' + l.treatment : ''));
      }
    }
  } catch (e) {
    console.log('  leads table not present? ' + e.message);
  }
  console.log();

  // === FEATURED WAITLIST ===
  console.log('=== FEATURED WAITLIST ===');
  try {
    const { data: wl, error } = await sb
      .from('featured_waitlist')
      .select('email, clinic_name, city, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) console.log('  table read error: ' + error.message);
    else {
      console.log('  Total signups (last 20 shown):');
      for (const w of wl || []) {
        const ageD = Math.round((Date.now() - new Date(w.created_at).getTime()) / 86400000);
        console.log('    [' + ageD + 'd ago] ' + w.email + '  clinic=' + (w.clinic_name || '?') + '  city=' + (w.city || '?'));
      }
    }
  } catch (e) {
    console.log('  table not present? ' + e.message);
  }
  console.log();

  // === LISTING EVENTS / TRAFFIC ===
  console.log('=== TRAFFIC EVENTS (listing_events table) ===');
  try {
    // Total events last 24h, 48h, 7d
    for (const [label, since] of [['24h', LAST_24H], ['48h', LAST_48H], ['7d', LAST_7D]]) {
      const { count } = await sb.from('listing_events').select('id', { count: 'exact', head: true }).gte('created_at', since);
      console.log('  Total events in last ' + label + ': ' + (count ?? 0));
    }
    console.log();
    // Per type breakdown last 7d
    const { data: events } = await sb
      .from('listing_events')
      .select('event_type, target_slug, created_at')
      .gte('created_at', LAST_7D)
      .order('created_at', { ascending: false })
      .limit(2000);
    if (events) {
      const byType = {};
      const byTarget = {};
      for (const e of events) {
        byType[e.event_type] = (byType[e.event_type] || 0) + 1;
        if (e.target_slug) byTarget[e.target_slug] = (byTarget[e.target_slug] || 0) + 1;
      }
      console.log('  Event types (last 7d):');
      for (const [k, v] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
        console.log('    ' + k.padEnd(28) + ' ' + v);
      }
      console.log();
      console.log('  Top targets (last 7d, top 20):');
      const top = Object.entries(byTarget).sort((a, b) => b[1] - a[1]).slice(0, 20);
      for (const [k, v] of top) console.log('    ' + String(v).padStart(5) + '  ' + k);
    }
  } catch (e) {
    console.log('  listing_events read error: ' + e.message);
  }
})();
