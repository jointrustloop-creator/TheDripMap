/**
 * POST /api/admin/queue-owner-followup
 *
 * Drafts personalised owner follow-up emails for newly-Claimed clinics where
 * we need the operator to confirm hours, services, and request real photos.
 * The Safety Verified attestation is presented as a separate, optional track
 * the owner can opt into later (per the 2026-06-08 Claimed vs Safety Verified
 * separation policy).
 *
 * Two trigger modes:
 *   1) Body-less call → endpoint queues the built-in batch (Insight Naturopathic
 *      + Tri-Health Wellness Centre). Hours and services pasted from live
 *      Supabase data so the email reflects what is actually rendered.
 *   2) Body with `{ recipients: [{ slug, to?, regulator? }] }` → endpoint pulls
 *      each provider by slug, builds the same template, optionally overrides
 *      the recipient email + regulator name.
 *
 * Auth: admin cookie OR `Authorization: Bearer $CRON_SECRET`. Idempotent: each
 * subject pattern is purged from [Gmail]/Drafts before re-queueing to prevent
 * duplicates on re-run.
 *
 * Em-dash policy: every outgoing string is run through assertNoFancyDashes()
 * before save. If any em-dash, en-dash, or horizontal bar slips through, the
 * endpoint refuses to save and returns 500 with the offending subject/body.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminRequest } from '../../../../src/lib/admin-auth';
import { saveDrafts, deleteDraftsBySubject, type DraftPayload } from '../../../../src/lib/draft-saver';

export const maxDuration = 60;

const FROM = 'TheDripMap <info@thedripmap.com>';
const REPLY_TO = 'info@thedripmap.com';

interface RecipientSpec {
  slug: string;
  to?: string;
  regulator?: string; // override; default uses providers.regulator_override
}

interface RequestBody {
  recipients?: RecipientSpec[];
}

const DEFAULT_RECIPIENTS: RecipientSpec[] = [
  { slug: 'insight-naturopathic-clinic-toronto' },
  { slug: 'tri-health-wellness-centre-vaughan' },
];

async function isAuthorized(req: Request): Promise<boolean> {
  if (await isAdminRequest()) return true;
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const auth = req.headers.get('authorization') || '';
  return auth === `Bearer ${expected}`;
}

// Catches em-dash, en-dash, figure-dash, horizontal bar. Throws if any present.
function assertNoFancyDashes(label: string, s: string) {
  // U+2014 em-dash, U+2013 en-dash, U+2012 figure dash, U+2015 horizontal bar
  const re = /[‒–—―]/;
  if (re.test(s)) {
    throw new Error(`Em/en-dash detected in ${label}`);
  }
}

function dayOrder(): string[] {
  return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
}

function formatHoursBlock(working_hours: Record<string, string> | null | undefined): string {
  if (!working_hours || typeof working_hours !== 'object' || Object.keys(working_hours).length === 0) {
    return '(we do not currently have hours listed for your clinic)';
  }
  return dayOrder()
    .map((d) => {
      const v = working_hours[d];
      const label = d.charAt(0).toUpperCase() + d.slice(1);
      return v ? `  ${label}: ${v}` : `  ${label}: (not listed)`;
    })
    .join('\n');
}

function formatServicesBlock(services: string[] | null | undefined, specialties: string[] | null | undefined): string {
  const combined = Array.from(new Set([
    ...(Array.isArray(services) ? services : []),
    ...(Array.isArray(specialties) ? specialties : []),
  ]));
  if (combined.length === 0) {
    return '(we do not currently have a services list for your clinic)';
  }
  return combined.map((s) => `  - ${s}`).join('\n');
}

// Build the subject. Pattern uses no fancy dashes.
function buildSubject(name: string): string {
  return `Your ${name} listing on TheDripMap`;
}

interface ProviderRow {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  working_hours: Record<string, string> | null;
  services: string[] | null;
  specialties: string[] | null;
  regulator_override: string | null;
}

function buildBody(p: ProviderRow, ownerSalutation: string, regulator: string): string {
  const cleanName = p.name.replace(/\s+/g, ' ').trim();
  const hours = formatHoursBlock(p.working_hours);
  const services = formatServicesBlock(p.services, p.specialties);

  // Carefully written with no em/en dashes. Hyphens (-) and commas only.
  const body = `Hi ${ownerSalutation},

Quick note from TheDripMap. I saw your listing for ${cleanName} is now Claimed, congratulations. Being Claimed means you can edit services, hours, photos, and respond to testimonials. I want to make sure the page reflects your clinic accurately, so I have a small list of asks below.

1. Photos
We have no real photos on file yet. Could you reply with 3 to 6 photos of your space, anything that shows the interior, the treatment rooms, or the IV lounge. Real photos only, please, no stock imagery.

2. Hours confirmation
These are the hours we currently show on your TheDripMap page:

${hours}

If anything is off, please paste a corrected schedule into your reply.

3. Services confirmation
These are the services we currently list:

${services}

If we are missing anything, or listing something you no longer offer, let me know.

That is the full ask for Claimed. Reply with whatever you have and I will integrate it within a day.

OPTIONAL, SEPARATE TRACK: Safety Verified

Safety Verified is a different, optional step that earns a distinct badge on your public listing. It is NOT granted by claiming. To start that attestation, reply Yes to whichever of these you can confirm:

  a. Licensed medical director or lead clinician on staff (name and credentials).
  b. IVs and injections administered by RNs, NPs, or physicians (not unlicensed staff).
  c. Ingredients sourced from a licensed compounding pharmacy.
  d. Active medical liability insurance covering IV therapy.
  e. Operating in good standing with ${regulator}.

All five are required to earn the Safety Verified badge. You can defer this entirely if you are not ready, your Claimed status is unaffected either way.

Warmly,
TheDripMap Team
info@thedripmap.com
`;
  return body;
}

function firstNameFromEmail(email: string): string {
  const local = email.split('@')[0] || '';
  if (!local) return 'there';
  const head = local.replace(/[._-].*$/, '');
  if (!head) return 'there';
  return head.charAt(0).toUpperCase() + head.slice(1);
}

export async function POST(req: Request) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return NextResponse.json({ error: 'SMTP_USER/SMTP_PASS required' }, { status: 500 });
  }

  // Parse body. Empty body is allowed and uses defaults.
  let recipients: RecipientSpec[] = DEFAULT_RECIPIENTS;
  try {
    const text = await req.text();
    if (text && text.trim().length > 0) {
      const parsed = JSON.parse(text) as RequestBody;
      if (Array.isArray(parsed.recipients) && parsed.recipients.length > 0) {
        recipients = parsed.recipients;
      }
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const drafts: DraftPayload[] = [];
  const skipped: { slug: string; reason: string }[] = [];

  for (const spec of recipients) {
    const { data: row, error } = await supabase
      .from('providers')
      .select('id, name, slug, email, working_hours, services, specialties, regulator_override')
      .eq('slug', spec.slug)
      .maybeSingle();
    if (error || !row) {
      skipped.push({ slug: spec.slug, reason: error?.message || 'not_found' });
      continue;
    }
    const to = (spec.to || row.email || '').trim();
    if (!to) {
      skipped.push({ slug: spec.slug, reason: 'no recipient email' });
      continue;
    }
    const regulator = spec.regulator || row.regulator_override || 'your provincial regulator';
    const subject = buildSubject(row.name);
    const text = buildBody(row as ProviderRow, firstNameFromEmail(to), regulator);

    try {
      assertNoFancyDashes('subject', subject);
      assertNoFancyDashes('body', text);
    } catch (err) {
      return NextResponse.json({
        error: err instanceof Error ? err.message : String(err),
        slug: spec.slug,
        subject,
      }, { status: 500 });
    }

    drafts.push({ from: FROM, to, replyTo: REPLY_TO, subject, text });
  }

  if (drafts.length === 0) {
    return NextResponse.json({ ok: true, drafted: 0, skipped, message: 'No drafts to queue.' });
  }

  // Idempotency: delete prior drafts with the exact same subject before saving.
  let deleted = 0;
  try {
    for (const d of drafts) {
      deleted += await deleteDraftsBySubject(d.subject);
    }
  } catch (err) {
    return NextResponse.json(
      { error: `delete failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }

  let results;
  try {
    results = await saveDrafts(drafts);
  } catch (err) {
    return NextResponse.json(
      { error: `saveDrafts failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    drafted: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    deletedPriorDrafts: deleted,
    skipped,
    recipients: drafts.map((d) => ({ to: d.to, subject: d.subject })),
    results,
  });
}
