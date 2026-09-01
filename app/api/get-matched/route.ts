/**
 * POST /api/get-matched  (lead engine v1 part 2, PLAN-3, 2026-08-28)
 *
 * One patient request -> up to 3 eligible claimed clinics in the patient's
 * city. The matching order is TRUST-BASED and never pay-based: Safety
 * Verified first, then Google rating. is_featured plays NO part here — the
 * matching verdict, like the organic ranking, is not for sale.
 *
 * SHIPS DARK: GET_MATCHED_FORWARD_ENABLED (default false) gates the clinic
 * emails. While dark, every request is saved + reported to info@ for manual
 * relay, so the funnel works day one and the clinic-facing email format can
 * go through the one-time [TEST] format review before any real send.
 *
 * Every saved inquiry is one row PER MATCHED CLINIC (listing_id set), so
 * /admin/leads and the lead_deliveries ledger stay per-clinic accurate.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMail } from '../../../src/lib/mailer';
import { isJunkEmail } from '../../../src/lib/outreach-quality';
import { normalizeHours, getStatus } from '../../../src/lib/hours';
import {
  forwardBlocker,
  recordLeadDelivery,
  renderLeadEmail,
  type ForwardProviderRow,
} from '../../../src/lib/lead-forward';

const FORWARD_ENABLED =
  String(process.env.GET_MATCHED_FORWARD_ENABLED || 'false').toLowerCase() === 'true';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const name = String(data?.name || '').trim();
    const email = String(data?.email || '').trim();
    const phone = String(data?.phone || '').trim();
    const city = String(data?.city || '').trim();
    const treatment = String(data?.treatment || '').trim().slice(0, 120);
    const notes = String(data?.notes || '').trim().slice(0, 1500);
    // "Need it today?" (2026-09-01): honest same-day handling. We never promise
    // a booking; we bias the match toward clinics that are OPEN RIGHT NOW and
    // mark the request urgent so it stands out in the clinic inbox.
    const urgent = data?.urgent === true;

    if (!name || !email || !city || !treatment) {
      return NextResponse.json({ success: false, error: 'Missing required fields.' }, { status: 400 });
    }
    // Honeypot: bots that fill the invisible field get a fake success.
    if (typeof data.website === 'string' && data.website.trim() !== '') {
      return NextResponse.json({ success: true, matched: [] });
    }
    if (isJunkEmail(email)) {
      return NextResponse.json({ success: false, error: 'Please use a real email address so clinics can reach you.' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Same 5-per-24h per-email cap as message-clinic; fails open.
    try {
      const since = new Date(Date.now() - 24 * 3_600_000).toISOString();
      const { count, error: capError } = await supabase
        .from('inquiries')
        .select('id', { count: 'exact', head: true })
        .eq('email', email)
        .gte('created_at', since);
      if (!capError && (count || 0) >= 5) {
        return NextResponse.json(
          { success: false, error: 'Too many requests from this email today. Please try again tomorrow or email info@thedripmap.com.' },
          { status: 429 },
        );
      }
    } catch { /* fail open */ }

    // Candidate clinics: claimed, visible, in the city. Trust-ranked.
    const { data: cands } = await supabase
      .from('providers')
      .select('id, name, slug, city, email, email_bounced, is_claimed, decision_drivers, forward_leads, safety_verified, safety_review_status, rating, working_hours, timezone')
      .eq('country', 'Canada')
      .eq('is_hidden', false)
      .eq('is_claimed', true)
      .ilike('city', city)
      .order('rating', { ascending: false, nullsFirst: false })
      .limit(20);

    type Cand = ForwardProviderRow & {
      slug: string | null;
      safety_verified: boolean | null;
      safety_review_status: string | null;
      rating: number | null;
      working_hours: unknown;
      timezone: string | null;
    };
    const isOpenNow = (c: Cand): boolean => {
      try {
        const st = getStatus(normalizeHours(c.working_hours), c.timezone || undefined);
        return st.known && st.isOpen;
      } catch {
        return false;
      }
    };
    const ranked = ((cands || []) as Cand[]).sort((a, b) => {
      // Urgent requests put open-right-now clinics first; trust order breaks ties.
      if (urgent) {
        const ao = isOpenNow(a) ? 1 : 0;
        const bo = isOpenNow(b) ? 1 : 0;
        if (ao !== bo) return bo - ao;
      }
      const av = a.safety_verified === true && a.safety_review_status === 'approved' ? 1 : 0;
      const bv = b.safety_verified === true && b.safety_review_status === 'approved' ? 1 : 0;
      if (av !== bv) return bv - av;
      return (b.rating || 0) - (a.rating || 0);
    });

    const matched: Cand[] = [];
    for (const c of ranked) {
      if (matched.length >= 3) break;
      const blocker = await forwardBlocker(supabase, c);
      if (!blocker) matched.push(c);
    }

    const nowIso = new Date().toISOString();
    const patientMessage = `${urgent ? 'SAME-DAY REQUEST. ' : ''}Looking for: ${treatment} in ${city}.${notes ? ` Notes: ${notes}` : ''}`;
    const savedIds: Array<{ clinic: Cand; inquiryId: string | null }> = [];

    if (matched.length) {
      for (const c of matched) {
        const row = {
          name,
          email,
          phone: phone || null,
          message: `[MATCH${urgent ? ' · URGENT' : ''} · Lead for ${c.name} · clinicId=${c.id}] ${patientMessage}`,
          listing_id: c.id,
          created_at: nowIso,
          forward_status: FORWARD_ENABLED ? 'sent' : 'shadow_would_send',
          forwarded_to_clinic_email: c.email,
          forwarded_to_clinic_at: FORWARD_ENABLED ? nowIso : null,
        };
        let r = await supabase.from('inquiries').insert(row).select('id').single();
        if (r.error && /Could not find|column|schema cache/.test(r.error.message || '')) {
          r = await supabase
            .from('inquiries')
            .insert({ name, email, phone: phone || null, message: row.message, listing_id: c.id, created_at: nowIso })
            .select('id')
            .single();
        }
        savedIds.push({ clinic: c, inquiryId: (r.data?.id as string) || null });
      }
    } else {
      // No eligible clinic: save one unmatched row so the request is never lost.
      await supabase.from('inquiries').insert({
        name,
        email,
        phone: phone || null,
        message: `[MATCH · no eligible clinic in ${city}] ${patientMessage}`,
        created_at: nowIso,
      });
    }

    // Clinic emails: gated. The format goes through the one-time [TEST]
    // review before this flag ever flips.
    if (FORWARD_ENABLED) {
      for (const { clinic, inquiryId } of savedIds) {
        if (!clinic.email) continue;
        try {
          const rendered = renderLeadEmail({
            greeting: `Hi ${clinic.name} team,`,
            previewText: urgent
              ? `Same-day request: a patient wants ${treatment} in ${city} today.`
              : `A patient wants ${treatment} in ${city} and matched with your clinic.`,
            paras: [
              urgent
                ? `A patient on TheDripMap is looking for ${treatment} in ${city} TODAY and matched with your clinic. A quick reply matters most here; if today is not possible, telling them so still helps.`
                : `A patient on TheDripMap asked to be matched with a clinic for ${treatment} in ${city}, and your clinic was one of their matches.`,
            ],
            details: [
              ['Name', name],
              ['Email', email],
              ['Phone', phone || 'Not provided'],
              ['Looking for', `${treatment} in ${city}`],
              ...(notes ? ([['Notes', notes]] as Array<[string, string]>) : []),
            ],
            buttonLabel: 'View your listing',
            buttonUrl: `https://www.thedripmap.com/providers/${clinic.slug || ''}`,
            clinicName: clinic.name || 'your clinic',
            clinicEmail: clinic.email,
          });
          await sendMail({
            from: 'TheDripMap <info@thedripmap.com>',
            to: clinic.email,
            replyTo: email,
            subject: urgent
              ? `URGENT same-day request from TheDripMap: ${treatment} in ${city}`
              : `New patient request from TheDripMap: ${treatment} in ${city}`,
            text: rendered.text,
            html: rendered.html,
          });
          await recordLeadDelivery(supabase, {
            inquiry_id: inquiryId,
            provider_id: clinic.id,
            channel: 'auto_forward',
            source: 'quiz_match',
            delivered_to: clinic.email,
          });
        } catch (err) {
          console.error('get-matched forward failed:', err);
        }
      }
    }

    // Operator summary — always, so nothing waits unseen while dark.
    try {
      await sendMail({
        from: 'TheDripMap <info@thedripmap.com>',
        to: 'info@thedripmap.com',
        replyTo: email,
        subject: `${urgent ? 'URGENT same-day ' : ''}Get Matched request: ${treatment} in ${city} (${matched.length} matched)`,
        text: `Patient: ${name} <${email}>${phone ? ` · ${phone}` : ''}
Wants: ${treatment} in ${city}
${notes ? `Notes: ${notes}\n` : ''}
Matched clinics (${matched.length}): ${matched.map((m) => m.name).join(', ') || 'NONE — relay manually or suggest nearby cities'}
Forwarding is ${FORWARD_ENABLED ? 'ON — clinics were emailed directly.' : 'OFF (dark launch) — relay to the matched clinics manually.'}
`,
      });
    } catch { /* reporting must never fail the request */ }

    return NextResponse.json({
      success: true,
      matched: savedIds.map(({ clinic }) => ({ name: clinic.name, slug: clinic.slug, openNow: isOpenNow(clinic) })),
      forwarded: FORWARD_ENABLED,
      urgent,
    });
  } catch (error) {
    console.error('get-matched error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
