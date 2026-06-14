/**
 * POST /api/finish-listing
 *
 * Save endpoint for the self-serve "Finish your listing" page. The owner edits
 * via /finish/[token]; this writes their multiple-choice answers + uploaded
 * images straight to the live listing (publish-instantly, operator-approved
 * 2026-06-13), then notifies the operator.
 *
 * Security: access is the HMAC manage token (verifyManageToken). All writes use
 * the service-role key AFTER token validation. The owner never has direct DB
 * access. Body is multipart/form-data: a JSON `answers` field + optional `logo`
 * and `photos` files.
 *
 * Never trusts free text for anything structural. The only free text is the
 * lead-practitioner name and a one-line "about", both length-capped and lightly
 * scrubbed of obvious medical-claim phrasing. Everything else is constrained
 * choices, so there is nothing to review before it goes live.
 */
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { sendMail } from '../../../src/lib/mailer';
import { parseManageToken, secretsMatch } from '../../../src/lib/manage-token';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SITE_URL = 'https://www.thedripmap.com';
const OPERATOR_EMAIL = 'info@thedripmap.com';
const BUCKET = 'blog-images';
const MAX_PHOTOS = 5;
const MAX_BYTES = 6 * 1024 * 1024; // 6MB per image

interface Drip { name: string; price?: string | null; duration?: string | null }
interface Answers {
  token?: string;
  team?: { whoPlaces?: string[]; oversight?: string; leadName?: string };
  drips?: Drip[];
  firstVisit?: { consult?: string; length?: string; booking?: string };
  sourcing?: string[];
  payment?: string[];
  about?: string;
  offer?: { title?: string; code?: string; expires?: string; active?: boolean };
}

// Light scrub: trim, cap length, drop obvious medical-claim verbs so owner free
// text can never publish a treatment claim. Not a substitute for the operator
// notification, just a guardrail.
function scrub(input: unknown, max = 200): string {
  if (typeof input !== 'string') return '';
  let s = input.replace(/\s+/g, ' ').trim().slice(0, max);
  s = s.replace(/\b(cure|cures|cured|treat|treats|treatment of|heal|heals|reverse|reverses)\b/gi, 'support');
  return s;
}

function normalizePrice(p?: string | null): string | null {
  if (!p) return null;
  const t = String(p).trim();
  if (!t) return null;
  if (t.startsWith('$')) return t;
  const num = t.replace(/[^\d.]/g, '');
  return num ? `$${num}` : null;
}

function priceRangeFrom(drips: Drip[]): string | null {
  const nums = drips
    .map((d) => Number(String(d.price || '').replace(/[^\d.]/g, '')))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (nums.length === 0) return null;
  const lo = Math.min(...nums);
  const hi = Math.max(...nums);
  return lo === hi ? `$${lo}` : `$${lo}-${hi}`;
}

function composeDescription(name: string, city: string, a: Answers): string {
  const parts: string[] = [];
  const dripNames = (a.drips || []).map((d) => d.name).filter(Boolean);
  const where = city ? ` in ${city}` : '';
  if (dripNames.length) {
    parts.push(`${name}${where} offers ${dripNames.slice(0, 8).join(', ')}.`);
  } else {
    parts.push(`${name}${where} offers IV therapy and wellness drips.`);
  }
  const consult = a.firstVisit?.consult;
  if (consult === 'Required') parts.push('New patients start with a consultation.');
  else if (consult === 'Optional') parts.push('A consultation is available for new patients.');
  const length = a.firstVisit?.length;
  if (length) parts.push(`Visits typically take about ${length}.`);
  const booking = a.firstVisit?.booking;
  if (booking === 'Walk-ins welcome') parts.push('Walk-ins are welcome.');
  else if (booking === 'Both') parts.push('Book ahead or walk in.');
  const pay = a.payment || [];
  if (pay.includes('Receipts for extended health benefits')) parts.push('Receipts are available for extended health benefits.');
  if (pay.includes('HSA/FSA')) parts.push('HSA and FSA cards are accepted.');
  const about = scrub(a.about, 240);
  if (about) parts.push(about);
  return parts.join(' ').slice(0, 900);
}

async function uploadImage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  providerId: string,
  file: File,
  label: string
): Promise<string | null> {
  if (!file || typeof file.arrayBuffer !== 'function') return null;
  if (!/^image\//.test(file.type)) return null;
  if (file.size > MAX_BYTES || file.size === 0) return null;
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'jpg';
  // Deterministic-ish unique path; index in label keeps photos distinct.
  const path = `clinic-uploads/${providerId}/${label}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from(BUCKET).upload(path, buf, {
    contentType: file.type,
    upsert: true,
  });
  if (error) {
    console.error('finish-listing upload error', label, error.message);
    return null;
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data?.publicUrl || null;
}

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'server not configured' }, { status: 500 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'expected multipart/form-data' }, { status: 400 });
  }

  let answers: Answers;
  try {
    answers = JSON.parse(String(form.get('answers') || '{}')) as Answers;
  } catch {
    return NextResponse.json({ error: 'invalid answers json' }, { status: 400 });
  }

  const parsed = parseManageToken(answers.token || String(form.get('token') || ''));
  if (!parsed) return NextResponse.json({ error: 'invalid or missing token' }, { status: 401 });
  const providerId = parsed.providerId;

  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: provider, error: provErr } = await supabase
    .from('providers')
    .select('id, name, slug, city, state, email, photos, image_url, decision_drivers')
    .eq('id', providerId)
    .maybeSingle();
  if (provErr || !provider) return NextResponse.json({ error: 'listing not found' }, { status: 404 });

  // Validate the URL secret against the stored manage_token.
  const ddStored = (provider.decision_drivers && typeof provider.decision_drivers === 'object')
    ? (provider.decision_drivers as Record<string, unknown>)
    : {};
  if (!secretsMatch(parsed.secret, typeof ddStored.manage_token === 'string' ? ddStored.manage_token : null)) {
    return NextResponse.json({ error: 'invalid or missing token' }, { status: 401 });
  }

  // ---- Map constrained answers -> real listing fields ----
  const drips = (answers.drips || []).filter((d) => d && typeof d.name === 'string' && d.name.trim());
  const services = drips.map((d) => ({ name: d.name.trim(), price: normalizePrice(d.price) }));
  const specialties = drips.map((d) => d.name.trim());

  const leadName = scrub(answers.team?.leadName, 80);
  const oversight = (answers.team?.oversight || '').toString().slice(0, 60);
  const medical_team = leadName
    ? [{ name: leadName, role: oversight || 'Lead clinician', bio: '' }]
    : undefined;

  const price_range = priceRangeFrom(drips);
  const description = composeDescription(provider.name, provider.city || '', answers);

  // ---- Images ----
  const logoFile = form.get('logo');
  const photoFiles = form.getAll('photos').filter((f): f is File => f instanceof File).slice(0, MAX_PHOTOS);
  let newLogoUrl: string | null = null;
  if (logoFile instanceof File && logoFile.size > 0) {
    newLogoUrl = await uploadImage(supabase, providerId, logoFile, 'logo');
  }
  const newPhotoUrls: string[] = [];
  for (let i = 0; i < photoFiles.length; i++) {
    const u = await uploadImage(supabase, providerId, photoFiles[i], `photo-${i + 1}`);
    if (u) newPhotoUrls.push(`${u}?v=${Math.floor(Date.now() / 1000)}`);
  }

  // ---- Build the update (only set fields we actually have) ----
  const existingDD = (provider.decision_drivers && typeof provider.decision_drivers === 'object')
    ? (provider.decision_drivers as Record<string, unknown>)
    : {};
  const update: Record<string, unknown> = {
    decision_drivers: { ...existingDD, manage: answers },
  };
  if (services.length) update.services = services;
  if (specialties.length) update.specialties = specialties;
  if (medical_team) update.medical_team = medical_team;
  if (price_range) update.price_range = price_range;
  if (description) update.description = description;
  if (newLogoUrl) update.image_url = newLogoUrl;
  if (newPhotoUrls.length) {
    const existingPhotos = Array.isArray(provider.photos) ? (provider.photos as string[]) : [];
    update.photos = [...newPhotoUrls, ...existingPhotos].slice(0, 12);
  }

  // Slow-time offer -> special_offers (rendered on the listing + deals feed).
  // A blank title clears any existing offer. Scrubbed for medical claims; code
  // and expiry are sanitized. Expiry is enforced at render time.
  const offerTitle = scrub(answers.offer?.title, 90);
  if (offerTitle) {
    const code = (answers.offer?.code || '').toString().replace(/[^A-Za-z0-9\-]/g, '').slice(0, 24);
    const expires = /^\d{4}-\d{2}-\d{2}$/.test(answers.offer?.expires || '') ? answers.offer!.expires : undefined;
    const active = answers.offer?.active !== false; // default ON when an offer is set
    update.special_offers = [{ title: offerTitle, description: '', active, ...(code ? { code } : {}), ...(expires ? { expires } : {}) }];
  } else {
    update.special_offers = [];
  }

  const { error: updErr } = await supabase.from('providers').update(update).eq('id', providerId);
  if (updErr) {
    console.error('finish-listing update error', updErr.message);
    return NextResponse.json({ error: 'could not save, please try again' }, { status: 500 });
  }

  // Bust the ISR cache for this listing + the deals hub so the owner's changes
  // (and offer) appear immediately instead of waiting out the revalidate window.
  try { revalidatePath(`/providers/${provider.slug}`); revalidatePath('/deals'); } catch { /* non-fatal */ }

  // Mark the onboarding row submitted (non-fatal).
  try {
    await supabase.from('onboarding_requests').update({ status: 'submitted' }).eq('provider_id', providerId);
  } catch { /* table may differ; non-fatal */ }

  // Notify the operator (non-fatal). Includes the safety evidence so the badge
  // decision is one glance away.
  try {
    const whoPlaces = (answers.team?.whoPlaces || []).join(', ') || 'not specified';
    const sourcing = (answers.sourcing || []).join(', ') || 'not specified';
    await sendMail({
      from: 'TheDripMap <info@thedripmap.com>',
      to: OPERATOR_EMAIL,
      replyTo: provider.email || OPERATOR_EMAIL,
      subject: `Listing updated by owner: ${provider.name}`,
      text: `${provider.name} (${provider.city || ''}) just updated their listing via the Finish page.

Drips: ${specialties.join(', ') || 'none'}
Price range: ${price_range || 'not set'}
Lead practitioner: ${leadName || 'not provided'}
Who places IVs: ${whoPlaces}
Medical oversight: ${oversight || 'not specified'}
Ingredient sourcing: ${sourcing}
Logo uploaded: ${newLogoUrl ? 'yes' : 'no'} | Photos uploaded: ${newPhotoUrls.length}
Slow-time offer: ${offerTitle ? offerTitle + (answers.offer?.expires ? ` (ends ${answers.offer.expires})` : '') : 'none'}

Safety evidence for your badge decision is above (team + sourcing). Review and, if it holds, flip safety_verified in /admin/onboarding.

Live listing: ${SITE_URL}/providers/${provider.slug}
`,
    });
  } catch (err) {
    console.error('finish-listing notify failed', err);
  }

  return NextResponse.json({ ok: true, listingUrl: `${SITE_URL}/providers/${provider.slug}` });
}
