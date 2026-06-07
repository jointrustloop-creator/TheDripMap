require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const sb = require('@supabase/supabase-js').createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const A3_PASS2 = [
  {
    from: 'Border seizures of unauthorized peptide products have continued through the 2024 to 2026 period.',
    to: 'Border seizures of unauthorized peptide products have continued in recent years.',
    reason: 'Soften "2024 to 2026 period" historical claim',
  },
  {
    from: 'The 2024-2026 regulatory landscape rewards the operators who have built honest, documented, college-aligned practices and penalizes the corner-cutters.',
    to: 'The current regulatory landscape rewards the operators who have built honest, documented, college-aligned practices and penalizes the corner-cutters.',
    reason: 'Soften "2024-2026 regulatory landscape" framing',
  },
  {
    from: 'The 2024-2026 regulatory landscape rewards documented, college-aligned IV operators and penalizes the corner-cutters.',
    to: 'The current regulatory landscape rewards documented, college-aligned IV operators and penalizes the corner-cutters.',
    reason: 'Soften same framing in excerpt-mirror text if present',
  },
];

(async () => {
  const { data: a3 } = await sb.from('blog_posts').select('id, content, excerpt').eq('slug', 'canadian-iv-clinic-regulations-2026').single();
  let updated = a3.content;
  let updatedExcerpt = a3.excerpt;
  for (const r of A3_PASS2) {
    if (updated.includes(r.from)) {
      updated = updated.replace(r.from, r.to);
      console.log('  body applied: ' + r.reason);
    }
    if (updatedExcerpt && updatedExcerpt.includes(r.from)) {
      updatedExcerpt = updatedExcerpt.replace(r.from, r.to);
      console.log('  excerpt applied: ' + r.reason);
    }
  }
  // Also soften excerpt if it references "2024-2026"
  if (updatedExcerpt && updatedExcerpt.includes('The 2024-2026 regulatory landscape')) {
    updatedExcerpt = updatedExcerpt.replace('The 2024-2026 regulatory landscape', 'The current regulatory landscape');
    console.log('  excerpt: "2024-2026 regulatory landscape" softened');
  }
  const { error } = await sb.from('blog_posts').update({
    content: updated,
    excerpt: updatedExcerpt,
    last_updated: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  }).eq('id', a3.id);
  if (error) { console.log('! update failed: ' + error.message); return; }
  console.log('Article 3 pass-2 applied.');
})();
