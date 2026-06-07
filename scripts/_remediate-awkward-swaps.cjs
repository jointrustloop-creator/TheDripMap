/**
 * Post-sweep remediation. Fix awkward phrasings that the bulk swap
 * created, especially:
 *   - "matching platform and matching platform" (dup from original
 *     "directory and matching platform")
 *   - "Comprehensive matching platform of IV therapy protocols" (these
 *     are guide pages, not platforms)
 *   - "Search our matching platform of top-rated providers" (awkward)
 *   - Other low-readability artifacts
 *
 * Operates on code files + blog_posts. Also runs a residue scan for
 * known-awkward phrases and flags anything left.
 */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const sb = require('@supabase/supabase-js').createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const REMEDIATIONS = [
  // Dup phrase from original "directory and matching platform"
  { from: 'matching platform and matching platform', to: 'matching platform' },
  { from: 'matching platform and matching service', to: 'matching service' },
  { from: 'Matching Platform and Matching Platform', to: 'Matching Platform' },

  // "Comprehensive X of IV therapy protocols/treatments/etc." should
  // read as a guide, not a platform.
  { from: 'Comprehensive matching platform of IV therapy protocols for hangovers, fatigue, immunity, and more.', to: 'Comprehensive guide to IV therapy protocols for hangovers, fatigue, immunity, and more.' },
  { from: 'Comprehensive matching platform of IV therapy', to: 'Comprehensive guide to IV therapy' },
  { from: 'Comprehensive matching platform', to: 'Comprehensive guide' },
  { from: 'comprehensive matching platform of IV therapy', to: 'comprehensive guide to IV therapy' },
  { from: 'comprehensive matching platform', to: 'comprehensive matching platform' }, // no-op safety
  { from: 'most comprehensive matching platform', to: 'most complete matching platform' },

  // "Search our matching platform of X" -> "Search our matching platform for X"
  { from: 'Search our matching platform of top-rated providers specializing in', to: 'Search our matching platform for top-rated providers specializing in' },
  { from: 'Search our matching platform of', to: 'Search our matching platform for' },
  { from: 'search our matching platform of', to: 'search our matching platform for' },

  // "matching platform of every" -> "matching platform for every" (most "directory of" should be "for")
  { from: 'matching platform of every', to: 'matching platform for every' },
  { from: 'matching platform of IV therapy protocols', to: 'matching platform for IV therapy protocols' },
  { from: 'matching platform of IV therapy', to: 'matching platform for IV therapy' },
  { from: 'matching platform of top-rated', to: 'matching platform for top-rated' },
  { from: 'matching platform of cities', to: 'matching platform for cities' },
  { from: 'matching platform of ', to: 'matching platform for ' },

  // "matching platform listings of" -> "platform listings of" or keep
  // (no specific fix needed)

  // "On TheDripMap, North America's matching platform for IV therapy clinics"
  // - this was already a clean swap result. Leave.

  // "Matching platform for ${total}" - reads weird if used as headline
  { from: 'Matching platform for ', to: 'Matching platform for ' }, // no-op

  // Generic catch for "our matching platform listings"
  { from: 'our matching platform of', to: 'our matching platform for' },

  // "TheDripMap's matching platform of IV"
  { from: "TheDripMap's matching platform of IV", to: "TheDripMap's matching platform for IV" },
  { from: "TheDripMap's matching platform of", to: "TheDripMap's matching platform for" },
];

const CODE_FILES = [
  'app/for-clinics/page.tsx',
  'app/treatments/page.tsx',
  'app/tools/clinic-agent-demo/ClinicAgentDemoClient.tsx',
  'app/terms/page.tsx',
  'app/contact/layout.tsx',
  'app/symptoms/[slug]/page.tsx',
  'app/symptoms/page.tsx',
  'app/cities/page.tsx',
  'app/states/[state]/page.tsx',
  'app/iv-therapy-statistics/page.tsx',
  'app/iv-therapy-for/[slug]/page.tsx',
  'app/resources/safety-checker/page.tsx',
  'app/resources/patient-acquisition/page.tsx',
  'app/resources/clinic-owners/page.tsx',
  'app/quiz/results/page.tsx',
  'app/iv-therapy/[treatment]/[city]/page.tsx',
  'app/providers/[slug]/page.tsx',
  'app/privacy/page.tsx',
  'app/og-image/route.tsx',
  'app/api/admin/send-outreach-batch/route.ts',
  'app/api/admin/queue-outreach-drafts/route.ts',
  'app/api/admin/queue-claimed-data-drafts/route.ts',
  'app/api/seo-audit/lead/route.ts',
  'app/api/brand-voice/route.ts',
  'app/api/cron/backlink-research/route.ts',
  'src/components/MedicalDisclaimer.tsx',
  'src/components/SafetyChecker.tsx',
  'src/components/TemporarilyUnavailable.tsx',
  'src/components/SmartSummary.tsx',
  'src/lib/drip-assistant.ts',
  'src/lib/backlink-templates.ts',
  'src/lib/outreach-templates.ts',
  'src/lib/outreach-quality.ts',
  'src/lib/seo-audit-llm.ts',
];

function applyRules(text) {
  let updated = text;
  let count = 0;
  for (const rule of REMEDIATIONS) {
    if (rule.from === rule.to) continue;
    while (updated.includes(rule.from)) {
      updated = updated.replace(rule.from, rule.to);
      count++;
    }
  }
  return { text: updated, changed: count };
}

(async () => {
  const receipt = { phase: 'remediate-awkward', timestamp: new Date().toISOString(), code_changes: [], blog_changes: [], flags: [] };

  // ----- CODE FILES -----
  console.log('=== CODE FILES (remediation pass) ===');
  for (const filePath of CODE_FILES) {
    const abs = path.join(process.cwd(), filePath);
    if (!fs.existsSync(abs)) continue;
    const original = fs.readFileSync(abs, 'utf-8');
    const result = applyRules(original);
    if (result.changed > 0) {
      fs.writeFileSync(abs, result.text);
      console.log('  ' + filePath + ': ' + result.changed + ' fixes');
      receipt.code_changes.push({ file: filePath, fixes: result.changed });
    }
  }

  // ----- BLOG POSTS -----
  console.log();
  console.log('=== BLOG POSTS (remediation pass) ===');
  const { data: all } = await sb.from('blog_posts').select('id, slug, content, excerpt, meta_title, meta_description, metaTitle, metaDescription').range(0, 999);
  for (const p of all) {
    const updates = {};
    let total = 0;
    for (const field of ['content', 'excerpt', 'meta_title', 'meta_description', 'metaTitle', 'metaDescription']) {
      if (!p[field]) continue;
      const r = applyRules(p[field]);
      if (r.changed > 0) {
        updates[field] = r.text;
        total += r.changed;
      }
    }
    if (total > 0) {
      updates.last_updated = new Date().toISOString();
      updates.lastUpdated = updates.last_updated;
      const { error } = await sb.from('blog_posts').update(updates).eq('id', p.id);
      if (error) {
        console.log('  ! ' + p.slug + ': ' + error.message);
        receipt.flags.push({ slug: p.slug, error: error.message });
      } else {
        console.log('  ' + p.slug + ': ' + total + ' fixes');
        receipt.blog_changes.push({ slug: p.slug, fixes: total });
      }
    }
  }

  // ----- FINAL AWKWARD-PHRASE RESIDUE SCAN -----
  console.log();
  console.log('=== POST-REMEDIATION AWKWARD-PHRASE SCAN ===');
  const AWKWARD = [
    'matching platform and matching platform',
    'matching platform and matching service',
    'Comprehensive matching platform',
    'comprehensive matching platform',
    'matching platform of every',
    'matching platform of IV',
    'matching platform of top-rated',
    'Search our matching platform of',
    'platform listing of every', // unlikely
  ];

  for (const filePath of CODE_FILES) {
    const abs = path.join(process.cwd(), filePath);
    if (!fs.existsSync(abs)) continue;
    const content = fs.readFileSync(abs, 'utf-8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      for (const a of AWKWARD) {
        if (line.includes(a)) {
          console.log('  AWKWARD ' + filePath + ':' + (idx + 1) + ' [' + a + '] ' + line.trim().slice(0, 180));
          receipt.flags.push({ file: filePath, line: idx + 1, awkward: a });
        }
      }
    });
  }
  const { data: residue } = await sb.from('blog_posts').select('slug, content, excerpt, meta_title, meta_description').range(0, 999);
  for (const p of residue) {
    for (const field of ['content', 'excerpt', 'meta_title', 'meta_description']) {
      if (!p[field]) continue;
      for (const a of AWKWARD) {
        if (p[field].includes(a)) {
          console.log('  AWKWARD blog ' + p.slug + '.' + field + ' [' + a + ']');
          receipt.flags.push({ slug: p.slug, field, awkward: a });
        }
      }
    }
  }
  if (receipt.flags.filter((f) => f.awkward).length === 0) console.log('  No awkward residue found.');

  console.log();
  console.log('Code fixes: ' + receipt.code_changes.length + ' files');
  console.log('Blog fixes: ' + receipt.blog_changes.length + ' posts');
  console.log('Awkward flags: ' + receipt.flags.filter((f) => f.awkward).length);

  fs.mkdirSync('scripts/_receipts', { recursive: true });
  const outPath = path.join('scripts/_receipts', 'remediate-awkward-' + Date.now() + '.json');
  fs.writeFileSync(outPath, JSON.stringify(receipt, null, 2));
  console.log('Receipt: ' + outPath);
})();
