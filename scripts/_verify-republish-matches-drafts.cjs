require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const crypto = require('crypto');
const sb = require('@supabase/supabase-js').createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function parseDraft(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const dividerIdx = raw.indexOf('\n---\n');
  const body = raw.slice(dividerIdx + 5).replace(/^\s*\n/, '').trimEnd();
  return body;
}

(async () => {
  for (const [slug, file] of [
    ['is-iv-therapy-a-scam-what-the-science-says', 'scripts/_drafts/is-iv-therapy-a-scam-what-the-science-says.md'],
    ['canadian-iv-clinic-regulations-2026', 'scripts/_drafts/canadian-iv-clinic-regulations-2026.md'],
  ]) {
    const draftBody = parseDraft(file);
    const { data } = await sb.from('blog_posts').select('content').eq('slug', slug).single();
    const liveBody = data.content;
    const draftHash = crypto.createHash('sha256').update(draftBody).digest('hex');
    const liveHash = crypto.createHash('sha256').update(liveBody).digest('hex');
    const match = draftHash === liveHash;
    console.log(slug);
    console.log('  draft chars: ' + draftBody.length + '  hash: ' + draftHash.slice(0, 16));
    console.log('  live  chars: ' + liveBody.length + '  hash: ' + liveHash.slice(0, 16));
    console.log('  ' + (match ? 'IDENTICAL' : 'MISMATCH'));
    console.log();
  }
})();
