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

function buildReportText(email: string, r: AuditResult, businessName: string, ownerName: string): string {
  const lines: string[] = [];
  lines.push(`Your IV Clinic SEO Audit — TheDripMap`);
  lines.push('');
  if (businessName) lines.push(`Clinic: ${businessName}`);
  if (ownerName) lines.push(`Owner: ${ownerName}`);
  lines.push(`Website: ${r.finalUrl}`);
  if (r.city) lines.push(`City: ${r.city}`);
  lines.push('');

  // IMPACT-first opener (matches the on-screen UI).
  if (r.llm?.impactHeadline) {
    lines.push('THE BOTTOM LINE');
    lines.push(`  ${r.llm.impactHeadline}`);
    lines.push('');
  }

  // Pillar 1 — paste-ready fixes (lead with these, they're the highest value).
  if (r.llm?.pasteReadyFixes?.length) {
    lines.push('PASTE-READY FIXES (copy these straight into your site)');
    r.llm.pasteReadyFixes.forEach((f, i) => {
      lines.push(`  ${i + 1}. ${f.field}`);
      if (f.current) lines.push(`     Current: ${f.current}`);
      lines.push(`     FIX: ${f.fix}`);
      if (f.why) lines.push(`     Why: ${f.why}`);
      lines.push('');
    });
  }

  // Pillar 2 — missing pages.
  if (r.llm?.missingPages?.length) {
    lines.push('MISSING HIGH-INTENT PAGES');
    r.llm.missingPages.forEach((p, i) => {
      lines.push(`  ${i + 1}. ${p.suggestedPath}`);
      lines.push(`     Title: ${p.title}`);
      lines.push(`     Meta: ${p.metaDescription}`);
      lines.push(`     H1: ${p.h1}`);
      if (p.intent) lines.push(`     Intent: ${p.intent}`);
      lines.push(`     Outline:`);
      p.outline.split('\n').forEach((ln) => lines.push(`       ${ln}`));
      lines.push('');
    });
  }

  // Pillar 3 — patient questions.
  if (r.llm?.patientQuestions?.length) {
    lines.push('PATIENT-VOICE QUESTIONS YOU AREN\'T ANSWERING');
    r.llm.patientQuestions.forEach((q, i) => {
      lines.push(`  ${i + 1}. ${q.question}`);
      if (q.why) lines.push(`     Why: ${q.why}`);
      if (q.format) lines.push(`     Best format: ${q.format}`);
    });
    lines.push('');
  }

  // Pillar 4 — schema.
  if (r.schemaPillar?.scriptTag) {
    lines.push('READY-TO-PASTE JSON-LD SCHEMA (paste into your <head>)');
    r.schemaPillar.scriptTag.split('\n').forEach((ln) => lines.push(`  ${ln}`));
    if (r.schemaPillar.notes?.length) {
      lines.push('');
      lines.push('  Schema notes:');
      r.schemaPillar.notes.forEach((n) => lines.push(`   - ${n}`));
    }
    lines.push('');
  }

  // Pillar 5 — local visibility.
  if (r.localVisibility) {
    lines.push('LOCAL VISIBILITY (Google Business Profile)');
    if (r.localVisibility.state === 'ok' && r.localVisibility.place) {
      const p = r.localVisibility.place;
      lines.push(`  Match: ${p.name} — ${p.formattedAddress}`);
      lines.push(`  Rating: ${p.rating ?? '?'}★ (${p.reviewCount ?? 0} reviews)`);
      lines.push(`  Hours set: ${p.hasHours ? 'yes' : 'NO'} · Photos: ${p.hasPhotos ? 'yes' : 'NO'}`);
      if (r.localVisibility.issues.length) {
        lines.push('  Issues:');
        r.localVisibility.issues.forEach((iss) => lines.push(`   - ${iss}`));
      }
      if (r.localVisibility.napConsistency?.notes?.length) {
        lines.push('  NAP consistency:');
        r.localVisibility.napConsistency.notes.forEach((n) => lines.push(`   - ${n}`));
      }
    } else if (r.localVisibility.state === 'setup-required') {
      lines.push(`  Setup required — set ${r.localVisibility.envVar} in your environment.`);
      r.localVisibility.setupSteps?.forEach((s) => lines.push(`   ${s}`));
    } else if (r.localVisibility.state === 'not-found') {
      r.localVisibility.issues.forEach((iss) => lines.push(`  ${iss}`));
    } else if (r.localVisibility.state === 'error') {
      lines.push(`  Local visibility check failed: ${r.localVisibility.errorMessage || 'unknown error'}`);
    }
    lines.push('');
  }

  lines.push('TECHNICAL SCORECARD (secondary)');
  lines.push(`  Overall: ${r.score}/100 (${r.grade.replace('-', ' ').toUpperCase()})`);
  for (const c of r.checks) {
    const scoreText = c.counted === false ? 'not measured' : `${c.earned}/${c.max}`;
    lines.push(`  ${STATUS_ICON[c.status] || ''} ${c.label} — ${scoreText}`);
    lines.push(`        ${c.detail}`);
  }
  lines.push('');

  lines.push(`YOUR CITY — "iv therapy ${r.cityInsight.name || 'your area'}"`);
  lines.push(`  ~${r.cityInsight.searchesPerMonth} searches/month · ${r.cityInsight.competitors} clinics listed here`);
  lines.push('');

  const claimUrl = r.listing.slug
    ? `${SITE_URL}/providers/${r.listing.slug}?claim=1`
    : `${SITE_URL}/for-clinics/setup`;

  // The big CTA at the end — "Want us to handle this for you?" per the brief.
  lines.push('────────────────────────────────────────');
  lines.push('WANT US TO HANDLE ALL OF THIS FOR YOU?');
  lines.push(`  Claim your free TheDripMap listing and we'll put you in front of`);
  lines.push(`  patients already searching for IV therapy in ${r.city || 'your city'}.`);
  lines.push(`  → ${claimUrl}`);
  lines.push('');

  lines.push('—');
  lines.push('TheDripMap · North America\'s IV therapy matching platform');
  lines.push(`Run another audit: ${SITE_URL}/tools/seo-audit`);
  return lines.join('\n');
}

export async function POST(req: Request) {
  let body: {
    email?: string;
    result?: AuditResult;
    businessName?: string;
    ownerName?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const email = (body.email || '').trim().toLowerCase();
  const result = body.result;
  const businessName = (body.businessName || '').trim().slice(0, 120);
  const ownerName = (body.ownerName || '').trim().slice(0, 120);

  if (!isEmail(email)) {
    return NextResponse.json({ error: 'Please enter a valid business email address.' }, { status: 400 });
  }
  if (!result || typeof result.score !== 'number') {
    return NextResponse.json({ error: 'Missing audit result.' }, { status: 400 });
  }
  if (!businessName) {
    return NextResponse.json({ error: 'Please enter your clinic name.' }, { status: 400 });
  }
  if (!ownerName) {
    return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 });
  }

  // 1. Save the lead (always) — mirrors the existing inquiries-table pattern so
  // it surfaces in /admin/leads. Marker [SEO AUDIT] + source=seo-audit lets
  // the admin categorize and filter.
  let leadSaved = false;
  try {
    const sb = getServiceSupabase();
    const { error } = await sb.from('inquiries').insert({
      name: `${ownerName} — ${businessName}`,
      email,
      phone: null,
      message:
        `[SEO AUDIT] source=seo-audit ` +
        `score=${result.score} ` +
        `url=${result.finalUrl} ` +
        `city=${result.city || '(n/a)'} ` +
        `listed=${result.listing.listed} ` +
        `claimed=${result.listing.claimed} ` +
        `clinic=${businessName} ` +
        `owner=${ownerName}`,
      listing_id: null,
      created_at: new Date().toISOString(),
    });
    leadSaved = !error;
    if (error) console.error('SEO audit lead insert error:', error.message);
  } catch (err) {
    console.error('SEO audit lead insert threw:', err);
  }

  // 2. Email the report to the lead (best-effort — never block the on-screen
  // report on email delivery).
  const reportText = buildReportText(email, result, businessName, ownerName);
  let reportEmailed = false;
  try {
    const mail = await sendMail({
      from: 'TheDripMap <info@thedripmap.com>',
      to: email,
      replyTo: 'info@thedripmap.com',
      subject: `Your IV clinic SEO audit — ${businessName} (${result.score}/100)`,
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
      subject: `[SEO AUDIT lead] ${businessName} — ${ownerName} (${result.score}/100)`,
      text:
        `New SEO audit lead.\n\n` +
        `Clinic: ${businessName}\n` +
        `Owner: ${ownerName}\n` +
        `Email: ${email}\n` +
        `Website: ${result.finalUrl}\n` +
        `City: ${result.city || '(n/a)'}\n` +
        `Score: ${result.score}/100\n` +
        `Listed: ${result.listing.listed} · Claimed: ${result.listing.claimed}\n\n` +
        reportText,
    });
  } catch (err) {
    console.error('SEO audit notify email threw:', err);
  }

  return NextResponse.json({ ok: true, leadSaved, reportEmailed });
}
