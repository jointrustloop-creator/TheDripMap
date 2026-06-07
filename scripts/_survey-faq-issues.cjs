require('dotenv').config({ path: '.env.local' });
const sb = require('@supabase/supabase-js').createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { data } = await sb.from('blog_posts').select('slug, title, content, date').range(0, 999);
  const affected = [];
  for (const p of data) {
    const c = p.content || '';
    const hasLiteralScript = /<script type="application\/ld\+json">/i.test(c);
    const hasFaqHeading = /##\s+Frequently\s+Asked\s+Questions/i.test(c) || /##\s+Frequently\s+asked\s+questions/i.test(c);
    // Parser regex from the page
    const faqStart = c.match(/##\s+Frequently asked questions[\s\S]*$/i);
    let qaCount = 0;
    if (faqStart) {
      const qaPattern = /###\s+([^\n]+)\n+([\s\S]+?)(?=\n###\s+|\n##\s+|<!--|$)/g;
      let m;
      while ((m = qaPattern.exec(faqStart[0])) !== null) qaCount++;
    }
    // Bold-style Q's that the parser would MISS
    let boldQs = 0;
    if (faqStart) {
      const boldPattern = /\*\*[^*\n]+\?\*\*/g;
      boldQs = (faqStart[0].match(boldPattern) || []).length;
    }
    if (hasLiteralScript || (hasFaqHeading && qaCount === 0 && boldQs > 0)) {
      affected.push({ slug: p.slug, date: p.date, hasLiteralScript, hasFaqHeading, qaCount, boldQs });
    }
  }
  console.log('Posts affected by FAQ schema issue (literal <script> tag OR bold-Q FAQ that parser would miss):');
  console.log();
  for (const p of affected) {
    console.log('  ' + p.slug);
    console.log('    date=' + (p.date || '').slice(0, 10) + ' literalScript=' + p.hasLiteralScript + ' faqHeading=' + p.hasFaqHeading + ' parsed_QAs=' + p.qaCount + ' bold_Qs(missed)=' + p.boldQs);
  }
  console.log();
  console.log('Total affected: ' + affected.length);
})();
