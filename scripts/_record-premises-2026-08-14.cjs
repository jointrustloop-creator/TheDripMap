// Record CONO IVIT Premises Register lookups (2026-08-14) for the 3 claimed
// Ontario ND clinics found AUTHORIZED on the public register, per the L5
// standard in docs/badge-standard.md. Evidence captured from the live register
// (status as of 14-Aug-2026, read via the register's own search UI).
//
// Display rule reminder: only status='authorized' surfaces publicly. Tri-Health
// was NOT found on the premises register (searched "Tri-Health", "Tri", and
// registrant last name "Granzotto") -> recorded as an INTERNAL note only
// (status 'not_listed' never renders), pending operator review per SSOT.
require('dotenv').config({ path: '.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const REGISTER_URL = 'https://cono.alinityapp.com/client/findcorporationdirectory';
const CHECKED = '2026-08-14';

const RECORDS = [
  {
    slug: 'insight-naturopathic-clinic-toronto',
    premises: {
      register: 'the CONO IVIT Premises Register',
      status: 'authorized',
      outcome: 'Pass',
      url: REGISTER_URL,
      checked_at: CHECKED,
    },
    evidence:
      'CONO IVIT Premises Register lookup 2026-08-14: "Insight Naturopathic Clinic (Wicksteed)" Premise #4181, ' +
      'Status Active (effective 29-Nov-2021), 45 Wicksteed Avenue Unit 260 Toronto. Inspections: New premises ' +
      'Part I Passed 17-Mar-2021, Part II Passed 30-Nov-2021, no conditions. Registrants performing IVIT include ' +
      'Dr. Leslie Jill Shainhouse ND #1265 (Premise Registrant). Prior Eglinton premises shows Inactive (relocated).',
  },
  {
    slug: 'soma-and-soul-wellness-toronto',
    premises: {
      register: 'the CONO IVIT Premises Register',
      status: 'authorized',
      outcome: 'Pass',
      url: REGISTER_URL,
      checked_at: CHECKED,
    },
    evidence:
      'CONO IVIT Premises Register lookup 2026-08-14: "Soma & Soul Wellness" Premise #3836, Status Active ' +
      '(effective 02-Apr-2019), 1089 Kingston Road Unit 4B Toronto. 5-year re-inspection 22-Aug-2024: initial ' +
      'outcome Passed with 4 conditions (hand hygiene, informed consent, MRO documentation, documenting patient ' +
      'fears/anxieties); conditions fully met, final outcome Pass 19-Sep-2024. Designated Registrant Dr. Mary ' +
      'Lynn Eun Jung Choi ND #1630.',
  },
  {
    slug: 'natures-touch-naturopathic-clinic-brampton',
    premises: {
      register: 'the CONO IVIT Premises Register',
      status: 'authorized',
      outcome: 'Pass',
      url: REGISTER_URL,
      checked_at: CHECKED,
    },
    evidence:
      'CONO IVIT Premises Register lookup 2026-08-14: "Nature\'s Touch Naturopathic Clinic Inc." Premise #3860, ' +
      'Status Active (effective 29-May-2019), 50 Sunny Meadow Boulevard Suite 304 Brampton. 5-year re-inspection ' +
      '21-Nov-2024: initial outcome Passed with 2 conditions (crash cart stock, MRO patient chart requirements); ' +
      'conditions fully met, final outcome Pass. Designated Registrant Dr. Maria Melissa Papasodaro-Engineer ND ' +
      '#1554. Note: register header shows "Inspection status: Report under review" (a newer report appears to be ' +
      'in process); current registration remains Active. Re-check at next quarterly pass.',
  },
  {
    slug: 'tri-health-wellness-centre-vaughan',
    premises: {
      register: 'the CONO IVIT Premises Register',
      status: 'not_listed', // NEVER renders publicly; internal review signal only
      outcome: null,
      url: REGISTER_URL,
      checked_at: CHECKED,
    },
    evidence:
      'CONO IVIT Premises Register lookup 2026-08-14: NO premises found for "Tri-Health" (also searched "Tri" ' +
      'and registrant last name "Granzotto" - 0 results). OPERATOR REVIEW ITEM per badge-standard SSOT: absence ' +
      'from the premises register is a question to ask the clinic (e.g. whether IVIT is performed by/under an ND ' +
      'at this location), never a public mark. No public change made.',
  },
];

(async () => {
  for (const r of RECORDS) {
    // Try exact slug, then a fuzzy fallback (Tri-Health slug may differ).
    let { data: row } = await s.from('providers').select('id,name,slug,address,city,decision_drivers').eq('slug', r.slug).maybeSingle();
    if (!row) {
      const base = r.slug.split('-').slice(0, 2).join('-');
      const { data: cands } = await s.from('providers').select('id,name,slug,address,city,decision_drivers').ilike('slug', `${base}%`).limit(5);
      if (cands && cands.length === 1) row = cands[0];
      else { console.log(`SKIP ${r.slug}: not found (candidates: ${(cands || []).map(c => c.slug).join(', ') || 'none'})`); continue; }
    }
    const dd = (row.decision_drivers && typeof row.decision_drivers === 'object') ? row.decision_drivers : {};
    const prevEvidence = Array.isArray(dd.safety_evidence) ? dd.safety_evidence : (dd.safety_evidence ? [dd.safety_evidence] : []);
    const next = {
      ...dd,
      premises: r.premises,
      safety_evidence: [...prevEvidence, r.evidence],
    };
    const { error, count } = await s.from('providers').update({ decision_drivers: next }, { count: 'exact' }).eq('id', row.id);
    if (error) { console.log(`ERROR ${row.slug}: ${error.message}`); continue; }
    if (count !== 1) { console.log(`SCOPE ERROR ${row.slug}: count=${count}`); continue; }
    console.log(`OK ${row.slug} -> premises.status=${r.premises.status}${r.premises.outcome ? ' (' + r.premises.outcome + ')' : ''}`);
    console.log(`   listing address: ${row.address || '(none)'} | ${row.city}`);
  }
})();
