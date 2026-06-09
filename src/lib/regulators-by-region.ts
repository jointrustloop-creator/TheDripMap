/**
 * Verified regulator facts by Canadian province + US state.
 *
 * Source of truth: the 2026 regulation article
 * /blog/who-can-legally-give-iv-canada-rules-by-province-2026 plus the
 * publicly listed regulator names. Each entry cites the specific colleges /
 * boards that authorize IV administration in that jurisdiction, so the
 * city-page intro can drop in a one-paragraph regulator note without
 * inventing scope claims.
 *
 * Used by:
 *   - src/lib/city-deep-intro.ts (composes the 150 to 250 word city intro)
 *   - Future expansion to other Canadian + US city pages
 *
 * IMPORTANT: This file is general information, not legal advice. The
 * "summary" field is the verbatim wording we use in user-facing copy and
 * must avoid medical claims, definitive scope statements that could be
 * wrong, or em-dashes (commas + periods only).
 */

export interface RegulatorRegion {
  /** ISO/Stats Canada region code (e.g. 'ON', 'BC') or US state abbrev. */
  code: string;
  /** Display name (e.g. 'Ontario'). */
  displayName: string;
  /** 'CA' or 'US'. */
  country: 'CA' | 'US';
  /** Short label for the regulator note headline. */
  headline: string;
  /**
   * One-paragraph regulator note (~100-160 words). Used as part of the
   * dynamic city intro. Each name expanded on first use, acronyms in
   * parens. No em-dashes; commas + periods only.
   */
  summary: string;
  /** Acronyms cited in the summary, surfaced as quick-reference tags. */
  colleges: string[];
}

export const REGULATORS_BY_REGION: Record<string, RegulatorRegion> = {
  ON: {
    code: 'ON',
    displayName: 'Ontario',
    country: 'CA',
    headline: 'Who can legally administer IV therapy in Ontario',
    summary:
      'Administering an IV is a regulated activity in Ontario. The College of Physicians and Surgeons of Ontario (CPSO) regulates physicians, the College of Nurses of Ontario (CNO) regulates RNs, NPs, and RPNs, and the College of Naturopaths of Ontario (CONO) authorizes naturopathic doctors who have passed the Intravenous Infusion Therapy (IVIT) Exam to administer a defined set of IV substances on inspected premises. Most wellness IV in Ontario is delivered either by an RN under a medical directive signed by a physician or NP, or by a CONO-authorized ND on CONO-inspected premises. Both models are legitimate.',
    colleges: ['CPSO', 'CNO', 'CONO'],
  },
  BC: {
    code: 'BC',
    displayName: 'British Columbia',
    country: 'CA',
    headline: 'Who can legally administer IV therapy in British Columbia',
    summary:
      'British Columbia reorganized its health professions regulation under the Health Professions and Occupations Act in 2026. The British Columbia College of Nurses and Midwives (BCCNM) regulates RNs, NPs, LPNs, and registered psychiatric nurses, and BC LPNs may perform IV therapy with the appropriate education within the BCCNM standards. The College of Physicians and Surgeons of BC (CPSBC) regulates physicians, who sign the directives nurse-led clinics follow. Naturopathic doctors in BC are regulated by the College of Complementary Health Professionals of BC (CCHPBC), the successor to the former CNPBC, and ND-led IV is common in Vancouver, Victoria, and Kelowna. The BC ND scope differs from Ontario, so confirm what a specific clinic is authorized to deliver.',
    colleges: ['BCCNM', 'CPSBC', 'CCHPBC'],
  },
  AB: {
    code: 'AB',
    displayName: 'Alberta',
    country: 'CA',
    headline: 'Who can legally administer IV therapy in Alberta',
    summary:
      'Alberta has a fast-growing IV market regulated through three colleges. The College of Physicians and Surgeons of Alberta (CPSA) regulates physicians, the College of Registered Nurses of Alberta (CRNA) regulates RNs and NPs, and the College of Licensed Practical Nurses of Alberta (CLPNA) regulates LPNs. Inserting a peripheral IV is within an Alberta RN s authorized scope, NPs hold prescribing authority, and Alberta LPNs may perform IV therapy with the additional certification. Naturopathic IV authority is more limited than in Ontario, so confirm directly with the clinic if you specifically want an ND-led drip.',
    colleges: ['CPSA', 'CRNA', 'CLPNA'],
  },
  QC: {
    code: 'QC',
    displayName: 'Quebec',
    country: 'CA',
    headline: 'Who can legally administer IV therapy in Quebec',
    summary:
      'Quebec regulates IV administration through the Ordre des infirmieres et infirmiers du Quebec (OIIQ) for registered nurses, the Ordre des infirmieres et infirmiers auxiliaires du Quebec (OIIAQ) for auxiliary nurses, and the College des medecins du Quebec (CMQ) for physicians. Quebec RNs may insert peripheral IVs and administer prescribed substances under appropriate prescriptive authority or a written medical directive. Quebec auxiliary nurses cannot administer medications by the intravenous route, which is a sharper limit than English-Canadian LPN scopes. Naturopathy is not a regulated profession in Quebec, so Quebec wellness IV typically runs through the RN-under-physician-directive model.',
    colleges: ['OIIQ', 'OIIAQ', 'CMQ'],
  },
  MB: {
    code: 'MB',
    displayName: 'Manitoba',
    country: 'CA',
    headline: 'Who can legally administer IV therapy in Manitoba',
    summary:
      'Manitoba regulates IV administration through the College of Registered Nurses of Manitoba (CRNM) and the College of Physicians and Surgeons of Manitoba (CPSM). The standard model in Manitoba wellness IV clinics is an RN delivering care under a medical directive signed by a physician or NP. Confirm with the clinic that a named supervising physician is reachable while the IV is running.',
    colleges: ['CRNM', 'CPSM'],
  },
  NS: {
    code: 'NS',
    displayName: 'Nova Scotia',
    country: 'CA',
    headline: 'Who can legally administer IV therapy in Nova Scotia',
    summary:
      'Nova Scotia regulates IV administration through the Nova Scotia College of Nursing (NSCN) and the College of Physicians and Surgeons of Nova Scotia (CPSNS). The standard model in Nova Scotia wellness IV clinics is an RN delivering care under a medical directive signed by a physician or NP. Confirm credentials with the clinic before booking.',
    colleges: ['NSCN', 'CPSNS'],
  },
  SK: {
    code: 'SK',
    displayName: 'Saskatchewan',
    country: 'CA',
    headline: 'Who can legally administer IV therapy in Saskatchewan',
    summary:
      'Saskatchewan regulates IV administration through the Saskatchewan Registered Nurses Association (SRNA) and the College of Physicians and Surgeons of Saskatchewan (CPSS). The standard model in Saskatchewan wellness IV clinics is an RN delivering care under a medical directive signed by a physician or NP.',
    colleges: ['SRNA', 'CPSS'],
  },
};

/** Slugified alias map so getRegulatorForState('Ontario') and ('ON') both work. */
const ALIASES: Record<string, string> = {
  'ontario': 'ON',
  'british columbia': 'BC',
  'bc': 'BC',
  'alberta': 'AB',
  'quebec': 'QC',
  'manitoba': 'MB',
  'nova scotia': 'NS',
  'saskatchewan': 'SK',
};

export function getRegulatorForState(state: string | null | undefined): RegulatorRegion | undefined {
  if (!state) return undefined;
  const key = state.trim().toLowerCase();
  const code = ALIASES[key] || state.toUpperCase();
  return REGULATORS_BY_REGION[code];
}
