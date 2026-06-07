/**
 * Sitewide sweep: "directory" -> "matching platform" in USER-FACING content.
 *
 * Scope:
 *   - Code files: user-facing strings only (JSX content, meta tags, JSON-LD,
 *     page titles, descriptions, AI prompts that render to the user, error
 *     messages, button labels). Code comments, variable identifiers, and
 *     file paths preserved.
 *   - blog_posts table: content, excerpt, meta_title, meta_description,
 *     metaTitle, metaDescription. Including JSON-LD inside content.
 *   - GitHub repo description: updated separately via gh CLI.
 *
 * Operator-required specific rewords (applied first, before catch-all swap):
 *   "We are an editorial directory"     -> "Our rankings are editorial"
 *   "the directory has confirmed ..."   -> "we have confirmed ..."
 *   "We do operate a directory."        -> "We do operate a matching platform."
 *
 * Code-file editing is line-aware: skip lines that are pure comments or
 * contain identifier patterns like `isDirectoryPage`. Mixed lines (e.g.
 * JSX with both content and a JSX comment) handled per file manually
 * via explicit replacements where needed.
 */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const sb = require('@supabase/supabase-js').createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// ============================================================
// REPLACEMENT RULES (ordered: most-specific first)
// ============================================================
const RULES = [
  // Footer disclaimer (was already done in MedicalDisclaimer.tsx but appears in other files too)
  { from: 'TheDripMap is a directory and matching service', to: 'TheDripMap is a matching service' },
  { from: 'TheDripMap is an independent directory and matching service', to: 'TheDripMap is an independent matching service' },

  // Operator-specific rewords (no force-swap)
  { from: 'We are an editorial directory', to: 'Our rankings are editorial' },
  { from: 'We do operate a directory.', to: 'We do operate a matching platform.' },
  { from: 'the directory has confirmed', to: 'we have confirmed' },
  { from: 'drawn from our editorial directory', to: 'drawn from our matching platform' },
  { from: 'editorial directory', to: 'matching platform' },

  // Button + label specific (would read awkward as "matching platform")
  { from: 'Browse Directory', to: 'Browse Clinics' },
  { from: 'Browse our national directory', to: 'Browse all clinics nationwide' },
  { from: 'Browse our complete directory', to: 'Browse all clinics' },
  { from: 'Browse our directory', to: 'Browse all clinics' },
  { from: 'Search the directory', to: 'Search all clinics' },
  { from: 'Checking our directory', to: 'Checking our matching platform' },
  { from: 'Real-time directory check', to: 'Real-time platform check' },
  { from: 'directory aggregate', to: 'platform aggregate' },
  { from: 'directory concierge', to: 'matching platform concierge' },
  { from: 'directory tools', to: 'matching platform tools' },
  { from: 'city directory', to: 'city listings' },

  // Specific phrasings that read awkward as a literal swap
  { from: 'a directory like TheDripMap', to: 'a matching platform like TheDripMap' },
  { from: 'TheDripMap is an online directory', to: 'TheDripMap is an online matching platform' },
  { from: 'TheDripMap operates an online directory', to: 'TheDripMap operates an online matching platform' },
  { from: 'comprehensive directory of', to: 'complete matching platform for' },
  { from: 'maintained directory of every', to: 'maintained matching platform for every' },
  { from: 'free directory of every', to: 'free matching platform for every' },
  { from: 'free directory of', to: 'free matching platform for' },
  { from: 'maintain a directory of', to: 'maintain a matching platform for' },
  { from: 'directory of every IV', to: 'matching platform for every IV' },
  { from: 'directory of every', to: 'matching platform for every' },
  { from: 'most comprehensive directory of', to: 'most complete matching platform for' },

  // North America's/national/IV therapy directory phrasings
  { from: "North America's IV therapy directory", to: "North America's IV therapy matching platform" },
  { from: "North America's IV therapy & peptide clinic directory", to: "North America's IV therapy & peptide clinic matching platform" },
  { from: "North America's IV Therapy Clinic Directory", to: "North America's IV Therapy Clinic Matching Platform" },
  { from: 'North America\'s directory for IV therapy clinics', to: 'North America\'s matching platform for IV therapy clinics' },
  { from: 'IV Therapy Directory Support', to: 'IV Therapy Matching Platform Support' },
  { from: 'IV Therapy Clinic Directory', to: 'IV Therapy Clinic Matching Platform' },
  { from: 'national IV therapy directory', to: 'national IV therapy matching platform' },
  { from: 'national directory', to: 'national matching platform' },
  { from: 'TheDripMap directory', to: 'TheDripMap matching platform' },
  { from: "TheDripMap's directory", to: "TheDripMap's matching platform" },
  { from: "TheDripMap's verified directory", to: "TheDripMap's verified matching platform" },
  { from: "TheDripMap's national directory", to: "TheDripMap's national matching platform" },

  // Misc phrasings
  { from: 'directory listings', to: 'platform listings' },
  { from: 'directory listing', to: 'platform listing' },
  { from: 'verified directory', to: 'verified matching platform' },
  { from: 'high-authority directory', to: 'high-authority matching platform' },
  { from: 'Browse our matching', to: 'Browse our matching platform' }, // safety in case a partial replace already happened
  { from: 'IV therapy directory', to: 'IV therapy matching platform' },
  { from: 'an IV therapy / peptide clinics', to: 'IV therapy / peptide clinics' }, // safety
  { from: 'Informational Directory Only', to: 'Informational Matching Platform Only' },
  { from: 'half-empty page.', to: 'half-empty page.' }, // no-op safety

  // Catch the standalone "in our directory" / "the directory" phrases
  { from: "isn't in our directory", to: "isn't in our matching platform" },
  { from: 'in our directory', to: 'in our matching platform' },
  { from: 'on our directory', to: 'on our matching platform' },
  { from: 'our directory', to: 'our matching platform' },
  { from: 'the directory', to: 'the matching platform' },
  { from: 'a directory.', to: 'a matching platform.' },
  { from: 'a directory,', to: 'a matching platform,' },
  { from: 'a directory ', to: 'a matching platform ' },
  { from: 'this directory', to: 'this matching platform' },
  { from: 'their directory', to: 'their matching platform' },

  // Title-case variants
  { from: 'Directory of ', to: 'Matching platform for ' },
  { from: 'Directory.', to: 'Matching Platform.' },
  { from: 'Directory:', to: 'Matching Platform:' },

  // Generic final catch-all (will catch any remaining "directory")
  { from: 'directory', to: 'matching platform' },
  { from: 'Directory', to: 'Matching Platform' },
];

// Identifier patterns to PROTECT (lines containing these are skipped for replacement)
const PROTECT_IDENTIFIERS = [
  'isDirectoryPage',
  'directorypage',
  '/directory/', // filesystem path
  'submission-quick-fills', // file name reference
  'directory-submission',
];

// Comment patterns
function isCommentLine(line) {
  const trimmed = line.trim();
  return trimmed.startsWith('//') ||
         trimmed.startsWith('*') ||
         trimmed.startsWith('/*') ||
         /^\s*\* /.test(trimmed) ||
         trimmed.endsWith('*/') ||
         (trimmed.startsWith('{/*') && trimmed.endsWith('*/}'));
}
function lineHasProtectedIdentifier(line) {
  return PROTECT_IDENTIFIERS.some((p) => line.includes(p));
}

function applyRulesToLine(line) {
  // Skip pure comment lines + lines with protected identifiers (e.g. isDirectoryPage)
  if (isCommentLine(line) || lineHasProtectedIdentifier(line)) return { line, changed: 0 };
  let updated = line;
  let count = 0;
  for (const rule of RULES) {
    while (updated.includes(rule.from)) {
      updated = updated.replace(rule.from, rule.to);
      count++;
    }
  }
  return { line: updated, changed: count };
}

function applyRulesToText(text) {
  // Plain prose (blog_posts content): apply rules globally without comment skipping
  let updated = text;
  let count = 0;
  for (const rule of RULES) {
    while (updated.includes(rule.from)) {
      updated = updated.replace(rule.from, rule.to);
      count++;
    }
  }
  return { text: updated, changed: count };
}

// User-facing code files identified from grep survey
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
  'src/components/SafetyChecker.tsx',
  'src/components/TemporarilyUnavailable.tsx',
  'src/components/SmartSummary.tsx',
  'src/lib/drip-assistant.ts',
  'src/lib/backlink-templates.ts',
  'src/lib/outreach-templates.ts',
  'src/lib/outreach-quality.ts',
  'src/lib/seo-audit-llm.ts',
];

(async () => {
  const receipt = {
    phase: 'sweep-directory-to-matching-platform',
    timestamp: new Date().toISOString(),
    code_files: [],
    blog_posts: [],
    flags: [],
  };

  // ----- CODE FILES -----
  console.log('=== CODE FILES ===');
  for (const filePath of CODE_FILES) {
    const abs = path.join(process.cwd(), filePath);
    if (!fs.existsSync(abs)) { console.log('  SKIP (not found): ' + filePath); continue; }
    const original = fs.readFileSync(abs, 'utf-8');
    const lines = original.split('\n');
    let totalChanges = 0;
    const changedLines = [];
    const newLines = lines.map((line, idx) => {
      const res = applyRulesToLine(line);
      if (res.changed > 0) {
        totalChanges += res.changed;
        changedLines.push({ line_num: idx + 1, before: line.trim().slice(0, 200), after: res.line.trim().slice(0, 200) });
      }
      return res.line;
    });
    if (totalChanges > 0) {
      fs.writeFileSync(abs, newLines.join('\n'));
      receipt.code_files.push({ file: filePath, changes: totalChanges, lines: changedLines });
      console.log('  ' + filePath + ': ' + totalChanges + ' changes across ' + changedLines.length + ' line(s)');
    } else {
      console.log('  ' + filePath + ': no changes');
    }
  }

  // ----- BLOG POSTS -----
  console.log();
  console.log('=== BLOG POSTS ===');
  const { data: allPosts } = await sb.from('blog_posts').select('id, slug, title, content, excerpt, meta_title, meta_description, metaTitle, metaDescription').range(0, 999);
  for (const p of allPosts) {
    const updates = {};
    let totalChanges = 0;
    for (const field of ['content', 'excerpt', 'meta_title', 'meta_description', 'metaTitle', 'metaDescription']) {
      if (p[field] && /directory/i.test(p[field])) {
        const res = applyRulesToText(p[field]);
        if (res.changed > 0) {
          updates[field] = res.text;
          totalChanges += res.changed;
        }
      }
    }
    if (totalChanges > 0) {
      // Also keep last_updated in sync
      updates.last_updated = new Date().toISOString();
      updates.lastUpdated = updates.last_updated;
      const { error } = await sb.from('blog_posts').update(updates).eq('id', p.id);
      if (error) {
        console.log('  ! ' + p.slug + ' failed: ' + error.message);
        receipt.flags.push({ slug: p.slug, error: error.message });
      } else {
        receipt.blog_posts.push({ slug: p.slug, changes: totalChanges, fields_updated: Object.keys(updates).filter((k) => !k.includes('Updated')) });
        console.log('  ' + p.slug + ': ' + totalChanges + ' changes');
      }
    }
  }

  // ----- POST-SWEEP SANITY CHECK -----
  console.log();
  console.log('=== POST-SWEEP "directory" RESIDUE CHECK (case-insensitive, USER-FACING only) ===');
  let residueFound = 0;
  for (const filePath of CODE_FILES) {
    const abs = path.join(process.cwd(), filePath);
    if (!fs.existsSync(abs)) continue;
    const content = fs.readFileSync(abs, 'utf-8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (/directory/i.test(line) && !isCommentLine(line) && !lineHasProtectedIdentifier(line)) {
        console.log('  RESIDUE ' + filePath + ':' + (idx + 1) + '  ' + line.trim().slice(0, 200));
        receipt.flags.push({ file: filePath, line: idx + 1, content: line.trim().slice(0, 200), kind: 'residue' });
        residueFound++;
      }
    });
  }

  const { data: residueBlog } = await sb.from('blog_posts').select('slug, content, excerpt, meta_title, meta_description').range(0, 999);
  for (const p of residueBlog) {
    for (const field of ['content', 'excerpt', 'meta_title', 'meta_description']) {
      if (p[field] && /directory/i.test(p[field])) {
        const matches = (p[field].match(/directory/gi) || []).length;
        console.log('  RESIDUE blog_post ' + p.slug + '.' + field + ': ' + matches + ' instance(s)');
        receipt.flags.push({ slug: p.slug, field, residue_count: matches, kind: 'blog_residue' });
        residueFound += matches;
      }
    }
  }
  if (residueFound === 0) console.log('  Clean. No residue in user-facing files or blog posts.');
  else console.log('  Total residue instances: ' + residueFound);

  console.log();
  console.log('Code files changed: ' + receipt.code_files.length);
  console.log('Blog posts changed: ' + receipt.blog_posts.length);
  console.log('Flags: ' + receipt.flags.length);

  fs.mkdirSync('scripts/_receipts', { recursive: true });
  const outPath = path.join('scripts/_receipts', 'sweep-directory-' + Date.now() + '.json');
  fs.writeFileSync(outPath, JSON.stringify(receipt, null, 2));
  console.log('Receipt: ' + outPath);
})();
