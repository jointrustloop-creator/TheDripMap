/**
 * Seed clinic_opportunities + clinic_owner_pains in Supabase from the
 * artifacts produced in this conversation:
 *   - scripts/_assessment-4-clinics.md (parsed for per-clinic gaps/solid/rec)
 *   - docs/clinic-owner-pains.md (seed body for the pain doc)
 *
 * Idempotent: re-running upserts. The operator-set fields on
 * clinic_opportunities (outreach_status, last_contacted_at, notes) are
 * NEVER overwritten on re-seed.
 */
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const get = (k) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1];
const SB = get('NEXT_PUBLIC_SUPABASE_URL');
const KEY = get('SUPABASE_SERVICE_ROLE_KEY');

async function q(method, path, body) {
  const r = await fetch(SB + '/rest/v1/' + path, {
    method,
    headers: {
      apikey: KEY,
      Authorization: 'Bearer ' + KEY,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { ok: r.ok, status: r.status, text: await r.text() };
}

function parseAssessment(md) {
  // Parse the assessment markdown into per-clinic blocks. Each section
  // starts with "## <name>" and contains: slug line, what is solid bullets,
  // gaps bullets, Get Found verdict, manual-check bullets.
  const out = [];
  const blocks = md.split(/^---$/m);
  for (const b of blocks) {
    const nameMatch = b.match(/^## ([^\n]+)$/m);
    if (!nameMatch) continue;
    const name = nameMatch[1].trim();
    const slugMatch = b.match(/Slug:\s+\/providers\/([a-z0-9-]+)/);
    if (!slugMatch) continue;
    const slug = slugMatch[1];

    const solidSec = b.match(/### What is solid([\s\S]*?)(?:^###|\Z)/m);
    const gapsSec = b.match(/### What is missing or inconsistent[^\n]*\n([\s\S]*?)(?:^###|\Z)/m);
    const verdictMatch = b.match(/### Get Found read\s+\*\*(YES|NO|MAYBE)\*\*,\s*(.+?)\./);
    const manualSec = b.match(/### Needs a manual Google check[^\n]*\n([\s\S]*?)(?:^---|\Z)/m);

    const toBullets = (text) => {
      if (!text) return [];
      return text
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.startsWith('- '))
        .map((l) => l.slice(2).trim())
        .filter(Boolean)
        // Drop the "(none surfaced from free signals)" placeholder bullet
        // so it never lands in clinic_opportunities.gaps as a real gap.
        .filter((b) => !/^\(none/i.test(b));
    };

    out.push({
      name,
      slug,
      solid: toBullets(solidSec?.[1]),
      gaps: toBullets(gapsSec?.[1]),
      recommendation: verdictMatch ? verdictMatch[1].toLowerCase() : 'maybe',
      manual_check: toBullets(manualSec?.[1]),
    });
  }
  return out;
}

(async () => {
  // 1. Pain doc seed.
  const painsBody = fs.readFileSync('./docs/clinic-owner-pains.md', 'utf8');
  const r1 = await q('POST', 'clinic_owner_pains?on_conflict=id', { id: 1, body: painsBody, sources_used: null });
  console.log('clinic_owner_pains seed:', r1.status, r1.ok ? 'OK' : r1.text.slice(0, 200));

  // 2. Clinic opportunities seed.
  const md = fs.readFileSync('./scripts/_assessment-4-clinics.md', 'utf8');
  const parsed = parseAssessment(md);
  console.log('Parsed', parsed.length, 'clinic blocks from assessment');

  for (const c of parsed) {
    // Resolve clinic_id by slug.
    const probe = await fetch(SB + '/rest/v1/providers?slug=eq.' + c.slug + '&select=id&limit=1', { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } });
    const probeJson = await probe.json();
    const clinic_id = probeJson?.[0]?.id;
    if (!clinic_id) { console.log('  SKIP', c.slug, '(provider not found)'); continue; }

    // Upsert by clinic_id. Operator-set fields are not in the payload, so
    // they retain their prior values on update.
    const existing = await fetch(SB + '/rest/v1/clinic_opportunities?clinic_id=eq.' + clinic_id + '&select=id,outreach_status,last_contacted_at,notes&limit=1', { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } });
    const existingJson = await existing.json();
    const isUpdate = existingJson?.[0]?.id;
    const payload = {
      clinic_id,
      gaps: c.gaps,
      solid: c.solid,
      recommendation: c.recommendation,
      manual_check: c.manual_check,
      assessed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    let result;
    if (isUpdate) {
      result = await q('PATCH', 'clinic_opportunities?clinic_id=eq.' + clinic_id, payload);
    } else {
      result = await q('POST', 'clinic_opportunities', payload);
    }
    console.log('  ' + (isUpdate ? 'UPDATE' : 'INSERT'), c.slug, result.status, result.ok ? 'OK' : result.text.slice(0, 200));
  }
})().catch((e) => { console.error(e); process.exit(1); });
