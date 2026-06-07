/**
 * Full sweep of articles 2 and 3 for unverified specific dates, named papers,
 * named documents, author/journal IDs, and any remaining "2023/2024/2025"
 * specific-year claims. Across body + FAQ markdown + JSON-LD schema.
 *
 * Approach:
 *   1. Read live content.
 *   2. Build a flagged-pattern report (so operator can see what we found).
 *   3. Apply replacements.
 *   4. Update DB.
 *   5. Re-read and print final content.
 */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const sb = require('@supabase/supabase-js').createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// Article 2 sweep replacements
const A2_SWEEP = [
  // "Canadian Society of Internal Medicine endorsed" — soften to general
  {
    from: 'For confirmed iron-deficiency anemia, intravenous iron is a Health Canada and Canadian Society of Internal Medicine endorsed treatment when oral iron is not tolerated or not absorbed.',
    to: 'For confirmed iron-deficiency anemia, intravenous iron is supported by Health Canada and Canadian medical guidance when oral iron is not tolerated or not absorbed.',
    reason: '"Canadian Society of Internal Medicine endorsed" was a specific institutional endorsement claim I did not verify',
  },
];

// Article 3 sweep replacements
const A3_SWEEP = [
  // Opening: 2024 peptide advisory date
  {
    from: 'Health Canada\'s 2024 peptide advisory and the broader regulator crackdown have not gone away.',
    to: 'Health Canada\'s peptide advisory and the broader regulator crackdown have not gone away.',
    reason: 'Drop unverified "2024" date attached to advisory',
  },
  // Instagram-share line: "2024 peptide advisory"
  {
    from: '**Instagram-share line:** Canadian IV regulators are no longer hypothetical. If you operate a wellness IV clinic, here is who can legally administer the drip in each province, plus the 2024 peptide advisory you cannot ignore.',
    to: '**Instagram-share line:** Canadian IV regulators are no longer hypothetical. If you operate a wellness IV clinic, here is who can legally administer the drip in each province, plus the Health Canada peptide advisory you cannot ignore.',
    reason: 'Drop unverified "2024" date from share line',
  },
  // "most enforced category in 2025" — soften
  {
    from: 'is the most enforced category in 2025',
    to: 'is an actively enforced category',
    reason: 'Drop unverified "in 2025" claim',
  },
  // FAQ markdown answer about peptide advisory
  {
    from: '**What is the Health Canada peptide advisory?**\nHealth Canada published a 2023 advisory warning of unauthorized peptide products being imported and administered in Canada. Clinics sourcing peptides like semaglutide, BPC-157, or others from non-Health-Canada-licensed sources face regulatory and patient safety risks.',
    to: '**What is the Health Canada peptide advisory?**\nHealth Canada has issued advisories about unauthorized peptide products being imported and administered in Canada. Clinics sourcing peptides like semaglutide, BPC-157, or others from non-Health-Canada-licensed sources face regulatory and patient safety risks.',
    reason: 'FAQ markdown: drop specific 2023 date to match softened body',
  },
  // JSON-LD answer for peptide advisory
  {
    from: '{"@type": "Question", "name": "What is the Health Canada peptide advisory?", "acceptedAnswer": {"@type": "Answer", "text": "Health Canada published a 2023 advisory warning of unauthorized peptide products being imported and administered in Canada. Clinics sourcing peptides from non-Health-Canada-licensed sources face regulatory and patient safety risks."}}',
    to: '{"@type": "Question", "name": "What is the Health Canada peptide advisory?", "acceptedAnswer": {"@type": "Answer", "text": "Health Canada has issued advisories about unauthorized peptide products being imported and administered in Canada. Clinics sourcing peptides from non-Health-Canada-licensed sources face regulatory and patient safety risks."}}',
    reason: 'JSON-LD schema: drop specific 2023 date to match softened body',
  },
];

function applySweep(content, sweep, label) {
  let updated = content;
  let applied = 0;
  let missed = [];
  for (const r of sweep) {
    if (updated.includes(r.from)) {
      updated = updated.replace(r.from, r.to);
      applied++;
      console.log('  ' + label + ' applied: ' + r.reason);
    } else {
      missed.push({ reason: r.reason, preview: r.from.slice(0, 80) });
    }
  }
  if (missed.length) {
    console.log('  ' + label + ' MISSED:');
    for (const m of missed) console.log('    [' + m.reason + '] ' + m.preview);
  }
  return updated;
}

function flagSuspiciousPatterns(content, label) {
  const flags = [];
  // Years in specific-document positions
  const yearMatches = content.match(/\b20(0[0-9]|1[0-9]|2[0-6])\b/g);
  if (yearMatches) {
    const yearLines = content.split('\n').filter((l) => /\b20(0[0-9]|1[0-9]|2[0-6])\b/.test(l));
    for (const l of yearLines) {
      const trimmed = l.trim();
      if (trimmed && !/Updated|updated|date|Date|copyright|©/.test(trimmed)) {
        flags.push('YEAR: ' + trimmed.slice(0, 180));
      }
    }
  }
  // Named papers, et al.
  const etAl = content.match(/[A-Z][a-z]+ et al/);
  if (etAl) flags.push('AUTHOR: ' + etAl[0]);
  // Specific journal names
  const journals = ['Nature Aging', 'BMJ Evidence', 'Journal of Alternative', 'Cell Metabolism', 'Lancet', 'NEJM', 'JAMA'];
  for (const j of journals) {
    if (content.includes(j)) flags.push('JOURNAL: ' + j);
  }
  // Quoted document titles in quotes followed by year
  const quotedDocs = content.match(/"[^"]{6,80}"\s*\(?20\d{2}/g);
  if (quotedDocs) for (const q of quotedDocs) flags.push('QUOTED DOC: ' + q.slice(0, 100));

  if (flags.length) {
    console.log('  ' + label + ' SUSPICIOUS PATTERNS REMAINING:');
    for (const f of flags) console.log('    ' + f);
  } else {
    console.log('  ' + label + ' clean of suspicious patterns.');
  }
}

(async () => {
  const receipt = { phase: 'sweep-articles-2-3', timestamp: new Date().toISOString(), updated: [], errors: [] };

  // Article 2
  console.log('=== Sweeping article 2 ===');
  const { data: a2 } = await sb.from('blog_posts').select('id, content').eq('slug', 'is-iv-therapy-a-scam-what-the-science-says').single();
  const a2New = applySweep(a2.content, A2_SWEEP, 'A2');
  flagSuspiciousPatterns(a2New, 'A2 post-sweep');
  const { error: a2Err } = await sb.from('blog_posts').update({
    content: a2New,
    last_updated: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  }).eq('id', a2.id);
  if (a2Err) { console.log('! A2 update failed: ' + a2Err.message); receipt.errors.push({ slug: 'a2', err: a2Err.message }); }
  else { receipt.updated.push('is-iv-therapy-a-scam-what-the-science-says'); }
  console.log();

  // Article 3
  console.log('=== Sweeping article 3 ===');
  const { data: a3 } = await sb.from('blog_posts').select('id, content').eq('slug', 'canadian-iv-clinic-regulations-2026').single();
  const a3New = applySweep(a3.content, A3_SWEEP, 'A3');
  flagSuspiciousPatterns(a3New, 'A3 post-sweep');
  const { error: a3Err } = await sb.from('blog_posts').update({
    content: a3New,
    last_updated: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  }).eq('id', a3.id);
  if (a3Err) { console.log('! A3 update failed: ' + a3Err.message); receipt.errors.push({ slug: 'a3', err: a3Err.message }); }
  else { receipt.updated.push('canadian-iv-clinic-regulations-2026'); }
  console.log();

  fs.mkdirSync('scripts/_receipts', { recursive: true });
  const outPath = path.join('scripts/_receipts', 'sweep-articles-2-3-' + Date.now() + '.json');
  fs.writeFileSync(outPath, JSON.stringify(receipt, null, 2));
  console.log('Receipt: ' + outPath);
})();
