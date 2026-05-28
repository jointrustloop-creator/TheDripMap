import { NextResponse } from 'next/server';
import { getServiceSupabase } from '../../../../src/lib/supabase';
import { sendMail } from '../../../../src/lib/mailer';
import type { AuditResult } from '../route';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

const SITE_URL = 'https://www.thedripmap.com';

function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

const STATUS_ICON: Record<string, string> = { pass: '[PASS]', warn: '[WARN]', fail: '[FAIL]' };

function buildReportText(email: string, r: AuditResult): string {
  const lines: string[] = [];
  lines.push(`Your IV Clinic SEO Audit — TheDripMap`);
  lines.push('');
  lines.push(`Website: ${r.finalUrl}`);
  if (r.city) lines.push(`City: ${r.city}`);
  lines.push('');
  lines.push(`OVERALL SCORE: ${r.score}/100  (${r.grade.replace('-', ' ').toUpperCase()})`);
  lines.push('');
  lines.push('SCORECARD');
  for (const c of r.checks) {
    lines.push(`  ${STATUS_ICON[c.status] || ''} ${c.label} — ${c.earned}/${c.max}`);
    lines.push(`        ${c.detail}`);
  }
  lines.push('');
  if (r.topFixes.length) {
    lines.push('TOP FIXES (ranked by points you\'re leaving on the table)');
    r.topFixes.forEach((f, i) => lines.push(`  ${i + 1}. ${f.title}  (+${f.gain} pts)`));
    lines.push('');
  }
  lines.push(`YOUR CITY — "iv therapy ${r.cityInsight.name || 'your area'}"`);
  lines.push(`  ~${r.cityInsight.searchesPerMonth} searches/month · ${r.cityInsight.competitors} clinics listed here`);
  lines.push('');
  const claimUrl = r.listing.slug
    ? `${SITE_URL}/providers/${r.listing.slug}?claim=1`
    : `${SITE_URL}/for-clinics/setup`;
  if (r.listing.listed && !r.listing.claimed) {
    lines.push(`TheDripMap covers ${r.cityInsight.name || 'your city'} — your listing is UNCLAIMED.`);
    lines.push(`Patients comparing clinics see a placeholder instead of your photos and services.`);
    lines.push(`Claim your free listing: ${claimUrl}`);
  } else if (!r.listing.listed) {
    lines.push(`Your clinic isn't on TheDripMap yet — patients searching here can't find you.`);
    lines.push(`Add your free listing: ${SITE_URL}/for-clinics/setup`);
  } else {
    lines.push(`Your listing is claimed — nice work. Keep it complete to win more clicks.`);
    lines.push(`View your profile: ${claimUrl.replace('?claim=1', '')}`);
  }
  lines.push('');
  lines.push('—');
  lines.push('TheDripMap · North America\'s IV therapy directory');
  lines.push(`Run another audit: ${SITE_URL}/tools/seo-audit`);
  return lines.join('\n');
}

export async function POST(req: Request) {
  let body: { email?: string; result?: AuditResult };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const email = (body.email || '').trim().toLowerCase();
  const result = body.result;
  if (!isEmail(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }
  if (!result || typeof result.score !== 'number') {
    return NextResponse.json({ error: 'Missing audit result.' }, { status: 400 });
  }

  // 1. Save the lead (always) — mirrors the existing inquiries-table pattern so
  // it surfaces in /admin/leads. Marker [SEO AUDIT] lets the admin categorize it.
  let leadSaved = false;
  try {
    const sb = getServiceSupabase();
    const { error } = await sb.from('inquiries').insert({
      name: result.listing.name || 'SEO Audit Lead',
      email,
      phone: null,
      message: `[SEO AUDIT] score=${result.score} url=${result.finalUrl} city=${result.city || '(n/a)'} listed=${result.listing.listed} claimed=${result.listing.claimed}`,
      listing_id: null,
      created_at: new Date().toISOString(),
    });
    leadSaved = !error;
    if (error) console.error('SEO audit lead insert error:', error.message);
  } catch (err) {
    console.error('SEO audit lead insert threw:', err);
  }

  // 2. Email the report to the lead (best-effort — never block the on-screen
  // report on email delivery). Per project rule, this fires only on an explicit
  // user action, not an automated blast.
  const reportText = buildReportText(email, result);
  let reportEmailed = false;
  try {
    const mail = await sendMail({
      from: 'TheDripMap <info@thedripmap.com>',
      to: email,
      replyTo: 'info@thedripmap.com',
      subject: `Your IV clinic SEO audit — ${result.score}/100`,
      text: reportText,
    });
    reportEmailed = mail.ok;
    if (!mail.ok) console.error('SEO audit report email failed:', mail.error);
  } catch (err) {
    console.error('SEO audit report email threw:', err);
  }

  // 3. Notify info@ so the team sees the new lead (best-effort).
  try {
    await sendMail({
      from: 'TheDripMap <info@thedripmap.com>',
      to: 'info@thedripmap.com',
      subject: `[SEO AUDIT lead] ${email} — ${result.score}/100`,
      text: `New SEO audit lead.\n\nEmail: ${email}\nWebsite: ${result.finalUrl}\nCity: ${result.city || '(n/a)'}\nScore: ${result.score}/100\nListed: ${result.listing.listed} · Claimed: ${result.listing.claimed}\n\n${reportText}`,
    });
  } catch (err) {
    console.error('SEO audit notify email threw:', err);
  }

  return NextResponse.json({ ok: true, leadSaved, reportEmailed });
}
